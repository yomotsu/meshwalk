import {
	Object3D,
	Mesh,
	Vector3,
	BufferGeometry,
	Matrix4,
	type Ray,
	type Sphere,
} from 'three';
import { Body } from './Body';
import { Octree, type SerializedOctree } from './Octree';
import { ComputedTriangle } from '../math/triangle';

/**
 * 静的な環境コライダー（動かないトライメッシュ）。
 * three.js の Object3D / BufferGeometry を「形状のソース」として取り込み、
 * 三角形を内部の Octree に焼き込む。取り込み時点のワールド座標でスナップショットする。
 *
 * ```js
 * const level = MW.StaticBody.fromObject( scene );
 * world.add( level );
 * ```
 */
export class StaticBody extends Body {

	private _octree = new Octree();

	/**
	 * Object3D（graph）から生成する。子孫の全 Mesh を辿って取り込む。
	 */
	static fromObject( object: Object3D ): StaticBody {

		return new StaticBody().addFromObject( object );

	}

	static fromOctreeData( data: SerializedOctree ): StaticBody {

		return new StaticBody().setOctreeData( data );

	}

	/**
	 * Object3D（graph）を辿り、含まれる全 Mesh の三角形をワールド座標で取り込む（加算）。
	 */
	addFromObject( object: Object3D ): this {

		object.updateWorldMatrix( true, true );
		object.traverse( ( child ) => {

			if ( child instanceof Mesh ) this._addGeometry( child.geometry, child.matrixWorld );

		} );
		this._octree.build();
		return this;

	}

	/**
	 * BufferGeometry を直接取り込む（事前マージ済みジオメトリ向け・任意で変換行列を適用）。
	 */
	addFromGeometry( geometry: BufferGeometry, matrix?: Matrix4 ): this {

		this._addGeometry( geometry, matrix );
		this._octree.build();
		return this;

	}

	/**
	 * Add a baked, world-space triangle mesh from flat position data without
	 * creating a three.js BufferGeometry. Positions are xyz-packed; indices are
	 * optional and use position indices. The input is already in world space.
	 */
	addTriangles( positions: ArrayLike<number>, indices?: ArrayLike<number> ): this {

		this._validateTriangles( positions, indices );
		this._addTriangles( positions, indices );
		this._octree.build();

		return this;

	}

	toOctreeData(): SerializedOctree {

		return this._octree.toData();

	}

	setOctreeData( data: SerializedOctree ): this {

		this._octree = Octree.fromData( data );
		return this;

	}

	// --- 内部クエリ（World の broad-phase / カメラのレイ判定から使う） ---

	getSphereTriangles( sphere: Sphere, result: ComputedTriangle[] ): ComputedTriangle[] {

		return this._octree.getSphereTriangles( sphere, result );

	}

	rayIntersect( ray: Ray, far = Infinity ) {

		return this._octree.rayIntersect( ray, far );

	}

	dispose(): void {

		this._octree.triangles.length = 0;
		this._octree.subTrees.length = 0;

	}

	private _addGeometry( geometry: BufferGeometry, matrix?: Matrix4 ): void {

		// position は fromBufferAttribute 経由で読む。これにより KHR_mesh_quantization
		// などの正規化整数（normalized）属性も正しくデノーマライズされる。変換は頂点ごとに
		// matrix を適用する（元の three.js ジオメトリは変更しない）。
		const position = geometry.attributes.position;
		const index = geometry.index;

		const addTriangle = ( a: number, b: number, c: number ) => {

			const vA = new Vector3().fromBufferAttribute( position, a );
			const vB = new Vector3().fromBufferAttribute( position, b );
			const vC = new Vector3().fromBufferAttribute( position, c );

			if ( matrix ) {

				vA.applyMatrix4( matrix );
				vB.applyMatrix4( matrix );
				vC.applyMatrix4( matrix );

			}

			const triangle = new ComputedTriangle( vA, vB, vC );
			// ポリゴンの継ぎ目の辺で raycast が交差しない可能性があるので、わずかに拡大する
			triangle.extend( 1e-10 );
			triangle.computeBoundingSphere();
			this._octree.addTriangle( triangle );

		};

		if ( index ) {

			for ( let i = 0, l = index.count; i < l; i += 3 ) addTriangle( index.getX( i ), index.getX( i + 1 ), index.getX( i + 2 ) );

		} else {

			for ( let i = 0, l = position.count; i < l; i += 3 ) addTriangle( i, i + 1, i + 2 );

		}

	}

	private _addTriangles( positions: ArrayLike<number>, indices: ArrayLike<number> | undefined ): void {

		const triangleCount = indices === undefined ? positions.length / 9 : indices.length / 3;

		for ( let triangle = 0; triangle < triangleCount; triangle ++ ) {

			const base = triangle * 3;
			const a = indices === undefined ? base : indices[ base ]!;
			const b = indices === undefined ? base + 1 : indices[ base + 1 ]!;
			const c = indices === undefined ? base + 2 : indices[ base + 2 ]!;

			this._addTriangle( positions, a, b, c );

		}

	}

	private _addTriangle(
		positions: ArrayLike<number>, a: number, b: number, c: number,
	): void {

		const vA = new Vector3( positions[ a * 3 ]!, positions[ a * 3 + 1 ]!, positions[ a * 3 + 2 ]! );
		const vB = new Vector3( positions[ b * 3 ]!, positions[ b * 3 + 1 ]!, positions[ b * 3 + 2 ]! );
		const vC = new Vector3( positions[ c * 3 ]!, positions[ c * 3 + 1 ]!, positions[ c * 3 + 2 ]! );

		const triangle = new ComputedTriangle( vA, vB, vC );
		triangle.extend( 1e-10 );
		triangle.computeBoundingSphere();
		this._octree.addTriangle( triangle );

	}

	private _validateTriangles( positions: ArrayLike<number>, indices?: ArrayLike<number> ): void {

		if ( positions.length % 3 !== 0 ) throw new Error( 'StaticBody: positions length must be a multiple of 3' );
		if ( indices === undefined && positions.length % 9 !== 0 ) throw new Error( 'StaticBody: non-indexed positions length must be a multiple of 9' );
		if ( indices !== undefined && indices.length % 3 !== 0 ) throw new Error( 'StaticBody: indices length must be a multiple of 3' );

		const vertexCount = positions.length / 3;

		if ( indices !== undefined ) {
			for ( let i = 0; i < indices.length; i ++ ) {
				const index = indices[ i]!;
				if ( ! Number.isInteger( index ) || index < 0 || index >= vertexCount ) {
					throw new Error( `StaticBody: index ${ index } is outside positions (${ vertexCount } vertices)` );
				}
			}
		}

	}

}

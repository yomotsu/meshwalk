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
import { Octree } from './Octree';
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

	// --- 内部クエリ（World の broad-phase / カメラのレイ判定から使う） ---

	getSphereTriangles( sphere: Sphere, result: ComputedTriangle[] ): ComputedTriangle[] {

		return this._octree.getSphereTriangles( sphere, result );

	}

	rayIntersect( ray: Ray ) {

		return this._octree.rayIntersect( ray );

	}

	dispose(): void {

		this._octree.triangles.length = 0;
		this._octree.subTrees.length = 0;

	}

	private _addGeometry( geometry: BufferGeometry, matrix?: Matrix4 ): void {

		// geometry を複製して変換行列を焼き込む（元の three.js ジオメトリは変更しない）
		const geom = geometry.clone();
		if ( matrix ) geom.applyMatrix4( matrix );

		const positions = geom.attributes.position.array;

		const addTriangle = ( a: number, b: number, c: number ) => {

			const vA = new Vector3().fromArray( positions, a * 3 );
			const vB = new Vector3().fromArray( positions, b * 3 );
			const vC = new Vector3().fromArray( positions, c * 3 );

			const triangle = new ComputedTriangle( vA, vB, vC );
			// ポリゴンの継ぎ目の辺で raycast が交差しない可能性があるので、わずかに拡大する
			triangle.extend( 1e-10 );
			triangle.computeBoundingSphere();
			this._octree.addTriangle( triangle );

		};

		if ( geom.index ) {

			const indices = geom.index.array;
			for ( let i = 0, l = indices.length; i < l; i += 3 ) addTriangle( indices[ i ], indices[ i + 1 ], indices[ i + 2 ] );

		} else {

			const count = positions.length / 3;
			for ( let i = 0; i < count; i += 3 ) addTriangle( i, i + 1, i + 2 );

		}

		geom.dispose();

	}

}

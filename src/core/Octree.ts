import {
	Box3,
	Line3,
	// Plane,
	Sphere,
	Vector3,
	type Ray,
} from 'three';
// import { Capsule } from '../math/Capsule.js';
import { ComputedTriangle } from '../math/triangle';
import { intersectsLineBox } from "../math/intersectsLineBox";
import { intersectsLineTriangle } from "../math/intersectsLineTriangle";
import { sweepSphereTriangle } from "../math/sweepSphereTriangle";

const _v1 = new Vector3();
const _v2 = new Vector3();

// get*Triangles の重複排除用のマーク。三角形は複数のサブツリーに属するため、
// 1回のクエリで同じ三角形が何度も見つかる。
// クエリごとに ID を1つ進め、結果へ入れた三角形へその ID を書いておくことで、
// 結果配列の線形探索（indexOf・O(n²)）を使わずに重複を弾く。
let _queryId = 0;

// lineIntersect / rayIntersect が使う一時バッファ（呼び出しごとに確保しない）。
// 再帰・入れ子で使わないので1本で足りる。
const _intersectTriangles: ComputedTriangle[] = [];
const _bestPoint = new Vector3();

// Sphere.intersectsBox 相当。ノードを降りるたびに全サブツリーに対して呼ばれるので、
// Box3.clampPoint（Vector3 の copy + clamp×6）を経由せずスカラーで書く。
function intersectsSphereBox( sphere: Sphere, box: Box3 ): boolean {

	const center = sphere.center;
	const min = box.min;
	const max = box.max;

	const dx = center.x < min.x ? min.x - center.x : center.x > max.x ? center.x - max.x : 0;
	const dy = center.y < min.y ? min.y - center.y : center.y > max.y ? center.y - max.y : 0;
	const dz = center.z < min.z ? min.z - center.z : center.z > max.z ? center.z - max.z : 0;

	return dx * dx + dy * dy + dz * dz <= sphere.radius * sphere.radius;

}

// 掃かれた球（カプセル）とボックスが交差しうるかの前段フィルタ。
// ボックスを radius ぶん膨らませて中心線のスラブ判定を行う。角の近くでは実際には
// 当たらない場合も通すが、broad-phase なので superset で構わない（偽陰性はない）。
function intersectsSweptSphereBox( origin: Vector3, direction: Vector3, maxDistance: number, radius: number, box: Box3 ): boolean {

	const invDirectionX = 1 / direction.x;
	const invDirectionY = 1 / direction.y;
	const invDirectionZ = 1 / direction.z;

	let tMin, tMax, tyMin, tyMax, tzMin, tzMax;

	if ( invDirectionX >= 0 ) {

		tMin = ( box.min.x - radius - origin.x ) * invDirectionX;
		tMax = ( box.max.x + radius - origin.x ) * invDirectionX;

	} else {

		tMin = ( box.max.x + radius - origin.x ) * invDirectionX;
		tMax = ( box.min.x - radius - origin.x ) * invDirectionX;

	}

	if ( invDirectionY >= 0 ) {

		tyMin = ( box.min.y - radius - origin.y ) * invDirectionY;
		tyMax = ( box.max.y + radius - origin.y ) * invDirectionY;

	} else {

		tyMin = ( box.max.y + radius - origin.y ) * invDirectionY;
		tyMax = ( box.min.y - radius - origin.y ) * invDirectionY;

	}

	if ( tMin > tyMax || tyMin > tMax ) return false;

	// 方向成分が 0 のとき 0 * Infinity = NaN になるので、three と同じく NaN を潰す
	if ( tyMin > tMin || tMin !== tMin ) tMin = tyMin;
	if ( tyMax < tMax || tMax !== tMax ) tMax = tyMax;

	if ( invDirectionZ >= 0 ) {

		tzMin = ( box.min.z - radius - origin.z ) * invDirectionZ;
		tzMax = ( box.max.z + radius - origin.z ) * invDirectionZ;

	} else {

		tzMin = ( box.max.z + radius - origin.z ) * invDirectionZ;
		tzMax = ( box.min.z - radius - origin.z ) * invDirectionZ;

	}

	if ( tMin > tzMax || tzMin > tMax ) return false;

	if ( tzMin > tMin || tMin !== tMin ) tMin = tzMin;
	if ( tzMax < tMax || tMax !== tMax ) tMax = tzMax;

	return tMax >= 0 && tMin <= maxDistance;

}

/**
 * Transferable representation of a built static octree.
 *
 * `nodes` stores childStart, childCount, triangleStart and triangleCount per
 * node. `boxes` stores min.xyz and max.xyz per node. Triangle references are
 * stored in each node's triangle range and point into `triangles`/`normals`.
 */
export interface SerializedOctree {
	boxes: Float32Array;
	nodes: Uint32Array;
	triangleRefs: Uint32Array;
	triangles: Float32Array;
	normals: Float32Array;
}

// 点から box までの最短距離の2乗（box の内側なら 0）。far による枝刈り用（sqrt を避ける）。
function distanceSquaredToBox( box: Box3, point: Vector3 ): number {

	const dx = Math.max( box.min.x - point.x, 0, point.x - box.max.x );
	const dy = Math.max( box.min.y - point.y, 0, point.y - box.max.y );
	const dz = Math.max( box.min.z - point.z, 0, point.z - box.max.z );

	return dx * dx + dy * dy + dz * dz;

}
// const _plane = new Plane();
// const _line1 = new Line3();
// const _line2 = new Line3();
// const _sphere = new Sphere();
// const _capsule = new Capsule();

export class Octree {

	box: Box3;
	bounds = new Box3();
	triangles: ComputedTriangle[] = [];
	subTrees: Octree[] = [];

	constructor( box: Box3 = new Box3() ) {

		this.box = box;

	}

	addTriangle( triangle: ComputedTriangle ) {

		this.bounds.min.x = Math.min( this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.min.y = Math.min( this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.min.z = Math.min( this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z );
		this.bounds.max.x = Math.max( this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.max.y = Math.max( this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.max.z = Math.max( this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z );

		this.triangles.push( triangle );

	}

	calcBox() {

		this.box.set( this.bounds.min, this.bounds.max );

		// offset small amount to account for regular grid
		this.box.min.x -= 0.01;
		this.box.min.y -= 0.01;
		this.box.min.z -= 0.01;

		return this;

	}

	split( level: number ) {

		const subTrees = [];
		const halfSize = _v2.copy( this.box.max ).sub( this.box.min ).multiplyScalar( 0.5 );

		for ( let x = 0; x < 2; x ++ ) {

			for ( let y = 0; y < 2; y ++ ) {

				for ( let z = 0; z < 2; z ++ ) {

					const box = new Box3();
					const v = _v1.set( x, y, z );

					box.min.copy( this.box.min ).add( v.multiply( halfSize ) );
					box.max.copy( box.min ).add( halfSize );

					subTrees.push( new Octree( box ) );

				}

			}

		}

		let triangle;

		while ( triangle = this.triangles.pop() ) {

			for ( let i = 0; i < subTrees.length; i ++ ) {

				if ( subTrees[ i ].box.intersectsTriangle( triangle ) ) {

					subTrees[ i ].triangles.push( triangle );

				}

			}

		}

		for ( let i = 0; i < subTrees.length; i ++ ) {

			const len = subTrees[ i ].triangles.length;

			if ( len > 8 && level < 16 ) {

				subTrees[ i ].split( level + 1 );

			}

			if ( len !== 0 ) {

				this.subTrees.push( subTrees[ i ] );

			}

		}

	}

	build() {

		this.calcBox();
		this.split( 0 );

		return this;

	}

	toData(): SerializedOctree {

		const boxes: number[] = [];
		const nodes: number[] = [];
		const triangleRefs: number[] = [];
		const trianglePositions: number[] = [];
		const triangleNormals: number[] = [];
		const triangleIds = new Map<ComputedTriangle, number>();

		const addTriangle = ( triangle: ComputedTriangle ): number => {

			const existing = triangleIds.get( triangle );

			if ( existing !== undefined ) return existing;

			const id = triangleIds.size;
			triangleIds.set( triangle, id );

			trianglePositions.push(
				triangle.a.x, triangle.a.y, triangle.a.z,
				triangle.b.x, triangle.b.y, triangle.b.z,
				triangle.c.x, triangle.c.y, triangle.c.z,
			);
			triangleNormals.push( triangle.normal.x, triangle.normal.y, triangle.normal.z );

			return id;

		};

		// Store nodes breadth-first. fromData() treats childStart..childStart+childCount
		// as a contiguous range; preorder traversal would put a child's descendants
		// between its siblings and make hydration attach the wrong subtrees.
		const queue: Octree[] = [ this ];

		for ( let nodeId = 0; nodeId < queue.length; nodeId ++ ) {

			const node = queue[ nodeId ]!;
			const triangleStart = triangleRefs.length;
			const childStart = queue.length;

			boxes.push(
				node.box.min.x, node.box.min.y, node.box.min.z,
				node.box.max.x, node.box.max.y, node.box.max.z,
			);
			nodes.push( childStart, node.subTrees.length, triangleStart, node.triangles.length );

			for ( const triangle of node.triangles ) triangleRefs.push( addTriangle( triangle ) );
			for ( const child of node.subTrees ) queue.push( child );

		}

		return {
			boxes: new Float32Array( boxes ),
			nodes: new Uint32Array( nodes ),
			triangleRefs: new Uint32Array( triangleRefs ),
			triangles: new Float32Array( trianglePositions ),
			normals: new Float32Array( triangleNormals ),
		};

	}

	static fromData( data: SerializedOctree ): Octree {

		if ( data.boxes.length % 6 !== 0 || data.nodes.length % 4 !== 0 ) {
			throw new Error( 'Octree.fromData: invalid node buffer lengths' );
		}
		if ( data.triangles.length % 9 !== 0 || data.normals.length % 3 !== 0
			|| data.triangles.length / 3 !== data.normals.length ) {
			throw new Error( 'Octree.fromData: invalid triangle buffer lengths' );
		}

		const nodeCount = data.nodes.length / 4;
		if ( data.boxes.length / 6 !== nodeCount ) throw new Error( 'Octree.fromData: node/box count differs' );

		const triangles = new Array<ComputedTriangle>( data.triangles.length / 9 );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const p = i * 9;
			const n = i * 3;
			const triangle = new ComputedTriangle(
				new Vector3( data.triangles[ p ]!, data.triangles[ p + 1 ]!, data.triangles[ p + 2 ]! ),
				new Vector3( data.triangles[ p + 3 ]!, data.triangles[ p + 4 ]!, data.triangles[ p + 5 ]! ),
				new Vector3( data.triangles[ p + 6 ]!, data.triangles[ p + 7 ]!, data.triangles[ p + 8 ]! ),
			);
			triangle.normal.set( data.normals[ n ]!, data.normals[ n + 1 ]!, data.normals[ n + 2 ]! );
			triangle.computeBoundingSphere();
			triangles[ i ] = triangle;

		}

		const create = ( nodeId: number ): Octree => {

			if ( nodeId < 0 || nodeId >= nodeCount ) throw new Error( 'Octree.fromData: invalid child node index' );

			const b = nodeId * 6;
			const node = new Octree( new Box3(
				new Vector3( data.boxes[ b ]!, data.boxes[ b + 1 ]!, data.boxes[ b + 2 ]! ),
				new Vector3( data.boxes[ b + 3 ]!, data.boxes[ b + 4 ]!, data.boxes[ b + 5 ]! ),
			) );
			node.bounds.copy( node.box );

			const m = nodeId * 4;
			const childStart = data.nodes[ m ]!;
			const childCount = data.nodes[ m + 1 ]!;
			const triangleStart = data.nodes[ m + 2 ]!;
			const triangleCount = data.nodes[ m + 3 ]!;

			if ( triangleStart + triangleCount > data.triangleRefs.length ) throw new Error( 'Octree.fromData: invalid triangle range' );
			for ( let i = 0; i < triangleCount; i ++ ) {
				const triangleId = data.triangleRefs[ triangleStart + i ];
				if ( triangleId === undefined || triangleId >= triangles.length ) throw new Error( 'Octree.fromData: invalid triangle reference' );
				node.triangles.push( triangles[ triangleId ]! );
			}

			if ( childStart + childCount > nodeCount ) throw new Error( 'Octree.fromData: invalid child range' );
			for ( let i = 0; i < childCount; i ++ ) node.subTrees.push( create( childStart + i ) );

			return node;

		};

		return create( 0 );

	}

	getLineTriangles( line: Line3, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! intersectsLineBox( line, subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getLineTriangles( line, result, false );

			}

		}

		return result;

	}

	/**
	 * far を渡すと、原点から far より遠いサブツリーを枝刈りする（カメラの衝突判定のように
	 * 「ある距離までに何かあるか」だけ知りたい場合に、レベル全体を辿らずに済む）。
	 * 三角形はそれが交差するすべての葉ノードに登録されているので、far 以内に交点があるなら
	 * その交点を含む葉ノード（＝原点から far 以内）にも必ず登録されている＝枝刈りしても取りこぼさない。
	 */
	getRayTriangles( ray: Ray, result: ComputedTriangle[], far = Infinity, isRoot = true ) {

		if ( isRoot ) _queryId ++;

		const farSquared = far === Infinity ? Infinity : far * far;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! ray.intersectsBox( subTree.box ) ) continue;
			if ( farSquared !== Infinity && distanceSquaredToBox( subTree.box, ray.origin ) > farSquared ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getRayTriangles( ray, result, far, false );

			}

		}

		return result;

	}

	getSphereTriangles( sphere:Sphere, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! intersectsSphereBox( sphere, subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getSphereTriangles( sphere, result, false );

			}

		}

		return result;

	}

	// 掃かれた球が通る領域の近傍三角形を集める（sphereCast の broad-phase）
	getSweptSphereTriangles( origin: Vector3, direction: Vector3, maxDistance: number, radius: number, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! intersectsSweptSphereBox( origin, direction, maxDistance, radius, subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getSweptSphereTriangles( origin, direction, maxDistance, radius, result, false );

			}

		}

		return result;

	}

	/**
	 * 半径 radius の球を origin から direction（単位ベクトル）へ maxDistance まで掃き、
	 * 最初に当たる三角形とその距離を返す。当たらなければ false。
	 * レイ版（rayIntersect）と同じく背面は無視し、開始時点で既に接触している面も無視する。
	 */
	sphereCast( origin: Vector3, direction: Vector3, maxDistance: number, radius: number ) {

		const triangles = _intersectTriangles;
		triangles.length = 0;

		this.getSweptSphereTriangles( origin, direction, maxDistance, radius, triangles );

		let nearestDistance = Infinity;
		let nearestTriangle: ComputedTriangle | undefined;

		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const triangle = triangles[ i ];
			const distance = sweepSphereTriangle( origin, direction, maxDistance, radius, triangle );

			if ( distance < 0 || distance >= nearestDistance ) continue;

			nearestDistance = distance;
			nearestTriangle = triangle;

		}

		if ( ! nearestTriangle ) return false;

		// 接触点（三角形上の最近点）。もっとも近いものが確定してから 1 回だけ求める
		_bestPoint.copy( origin ).addScaledVector( direction, nearestDistance );
		nearestTriangle.closestPointToPoint( _bestPoint, _bestPoint );

		return { distance: nearestDistance, triangle: nearestTriangle, position: _bestPoint.clone() };

	}

	lineIntersect( line: Line3 ) {

		const triangles = _intersectTriangles;
		triangles.length = 0;

		let distanceSquared = Infinity;
		let triangle: ComputedTriangle | null = null;

		this.getLineTriangles( line, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = _v1;
			const isIntersected = intersectsLineTriangle( line.start, line.end, triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, result );

			if ( isIntersected ) {

				const newDistanceSquared = line.start.distanceToSquared( result );

				if ( distanceSquared > newDistanceSquared ) {

					_bestPoint.copy( result );
					distanceSquared = newDistanceSquared;
					triangle = triangles[ i ];

				}

			}

		}

		// 交点は「もっとも近いものが確定してから」1つだけ確保する（候補ごとに clone しない）
		return triangle ? { distance: Math.sqrt( distanceSquared ), triangle, position: _bestPoint.clone() } : false;

	}

	/**
	 * far を渡すと、その距離より遠い交差は無視する（見つからなければ false）。
	 */
	rayIntersect( ray: Ray, far = Infinity ) {

		if ( ray.direction.lengthSq() === 0 ) return;

		const triangles = _intersectTriangles;
		triangles.length = 0;

		let triangle, distanceSquared = 1e100;
		const farSquared = far === Infinity ? Infinity : far * far;

		this.getRayTriangles( ray, triangles, far );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = ray.intersectTriangle( triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, true, _v1 );

			if ( result ) {

				const newDistanceSquared = result.sub( ray.origin ).lengthSq();

				if ( newDistanceSquared > farSquared ) continue;

				if ( distanceSquared > newDistanceSquared ) {

					_bestPoint.copy( result ).add( ray.origin );
					distanceSquared = newDistanceSquared;
					triangle = triangles[ i ];

				}

			}

		}

		// 交点は「もっとも近いものが確定してから」1つだけ確保する（候補ごとに clone しない）
		return distanceSquared < 1e100 ? { distance: Math.sqrt( distanceSquared ), triangle, position: _bestPoint.clone() } : false;

	}

}

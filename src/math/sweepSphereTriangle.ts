import { Vector3 } from 'three';
import { type ComputedTriangle } from './triangle';

const EPSILON = 1e-10;

const _planeContactPoint = new Vector3();
const _baseToVertex = new Vector3();
const _edge = new Vector3();

// 掃かれた球 vs 三角形。半径 radius の球を origin から direction（単位ベクトル）へ
// maxDistance まで動かしたとき、三角形へ最初に接触するまでの距離を返す。接触しなければ -1。
//
//  - 背面（法線と同じ向きへ進む面）は無視する。レイ版が backfaceCulling: true なのに合わせる。
//  - 開始時点で既に接触している場合も無視する。カメラの追従点が一瞬ジオメトリへ潜っただけで
//    カメラがターゲットへ張り付くのを防ぐ（Unreal の bStartPenetrating と同じ考え方）。
//
// 面・辺・頂点の3領域を順に解く。
// based on "Improved Collision detection and Response" (Kasper Fauerby)
// および "Real-Time Collision Detection" (Christer Ericson) 5.5.
export function sweepSphereTriangle(
	origin: Vector3,
	direction: Vector3,
	maxDistance: number,
	radius: number,
	triangle: ComputedTriangle,
): number {

	const normal = triangle.normal;
	const normalDotDirection = normal.dot( direction );

	// 面から遠ざかる、または平行 → 面としては当たらない
	if ( normalDotDirection >= - EPSILON ) return - 1;

	const signedDistance =
		normal.x * ( origin.x - triangle.a.x ) +
		normal.y * ( origin.y - triangle.a.y ) +
		normal.z * ( origin.z - triangle.a.z );

	// 開始時点で既に面へ接触している（裏側にいる場合も含む）→ 無視
	if ( signedDistance <= radius ) return - 1;

	// 面内での接触: 中心が「平面から radius」まで来る距離
	const distanceToPlane = ( signedDistance - radius ) / - normalDotDirection;
	if ( distanceToPlane > maxDistance ) return - 1;

	// そのときの接触点が三角形の内側なら、それが答え
	_planeContactPoint.copy( origin ).addScaledVector( direction, distanceToPlane ).addScaledVector( normal, - radius );
	if ( triangle.containsPoint( _planeContactPoint ) ) return distanceToPlane;

	// 面を外れているので、辺と頂点を当たる。もっとも手前を採る。
	let nearest = maxDistance;
	let hit = false;

	const radiusSquared = radius * radius;
	const vertices = [ triangle.a, triangle.b, triangle.c ];

	for ( let i = 0; i < 3; i ++ ) {

		const vertex = vertices[ i ];
		const next = vertices[ ( i + 1 ) % 3 ];

		// 頂点: |origin + direction * s - vertex| = radius を s について解く
		_baseToVertex.subVectors( origin, vertex );
		const b = 2 * _baseToVertex.dot( direction );
		const c = _baseToVertex.lengthSq() - radiusSquared;
		const discriminant = b * b - 4 * c;

		if ( discriminant >= 0 ) {

			const s = ( - b - Math.sqrt( discriminant ) ) / 2;
			if ( 0 <= s && s < nearest ) { nearest = s; hit = true; }

		}

		// 辺: 中心線と辺の距離が radius になる s を解く
		_edge.subVectors( next, vertex );
		const edgeLengthSquared = _edge.lengthSq();
		if ( edgeLengthSquared <= EPSILON ) continue;

		const edgeDotDirection = _edge.dot( direction );
		const edgeDotBaseToVertex = _edge.dot( _baseToVertex );

		const ea = edgeLengthSquared * - 1 + edgeDotDirection * edgeDotDirection;
		const eb = edgeLengthSquared * 2 * _baseToVertex.dot( direction ) - 2 * edgeDotDirection * edgeDotBaseToVertex;
		const ec = edgeLengthSquared * ( radiusSquared - _baseToVertex.lengthSq() ) + edgeDotBaseToVertex * edgeDotBaseToVertex;

		if ( Math.abs( ea ) <= EPSILON ) continue; // 中心線が辺と平行

		const edgeDiscriminant = eb * eb - 4 * ea * ec;
		if ( edgeDiscriminant < 0 ) continue;

		const root = Math.sqrt( edgeDiscriminant );
		const s0 = ( - eb - root ) / ( 2 * ea );
		const s1 = ( - eb + root ) / ( 2 * ea );
		const s = Math.min( s0, s1 );

		if ( s < 0 || s >= nearest ) continue;

		// 最近点が辺の内側（端点は頂点の判定が拾う）にあるか
		const onEdge = ( edgeDotDirection * s - edgeDotBaseToVertex ) / edgeLengthSquared;
		if ( onEdge < 0 || onEdge > 1 ) continue;

		nearest = s;
		hit = true;

	}

	return hit ? nearest : - 1;

}

import { Vector3, Sphere } from 'three';
import { Intersection } from './Intersection';

const EPSILON = 1e-10;

const ab = new Vector3();
const ac = new Vector3();
const bc = new Vector3();
const ap = new Vector3();
const bp = new Vector3();
const cp = new Vector3();
const closestPoint = new Vector3();
const diff = new Vector3();


// Sphere vs Triangle
// 三角形上で、球の中心に最も近い点 (closestPoint) を求める。
// その点と中心の距離が半径以下なら交差。
//   out.point  : 三角形上の最近点
//   out.normal : 押し出し方向（最近点 → 中心 の単位ベクトル。フェイス内接触ならフェイス法線と一致）
//   out.depth  : 貫通量（正の値）= 半径 - 距離
// フェイス内・辺・頂点のどの領域で接触しても正しい法線・貫通量を返す。
//
// based on "Real-Time Collision Detection" (Christer Ericson) 5.1.5
export function intersectsSphereTriangle( sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3, out: Intersection ) {

	const p = sphere.center;

	// 三角形 (a, b, c) 上で p に最も近い点 closestPoint を求める
	ab.subVectors( b, a );
	ac.subVectors( c, a );
	ap.subVectors( p, a );

	const d1 = ab.dot( ap );
	const d2 = ac.dot( ap );

	if ( d1 <= 0 && d2 <= 0 ) {

		// 頂点 a の領域
		closestPoint.copy( a );

	} else {

		bp.subVectors( p, b );
		const d3 = ab.dot( bp );
		const d4 = ac.dot( bp );

		cp.subVectors( p, c );
		const d5 = ab.dot( cp );
		const d6 = ac.dot( cp );

		const vc = d1 * d4 - d3 * d2;
		const vb = d5 * d2 - d1 * d6;
		const va = d3 * d6 - d5 * d4;

		if ( d3 >= 0 && d4 <= d3 ) {

			// 頂点 b の領域
			closestPoint.copy( b );

		} else if ( d6 >= 0 && d5 <= d6 ) {

			// 頂点 c の領域
			closestPoint.copy( c );

		} else if ( vc <= 0 && d1 >= 0 && d3 <= 0 ) {

			// 辺 ab の領域
			const v = d1 / ( d1 - d3 );
			closestPoint.copy( a ).addScaledVector( ab, v );

		} else if ( vb <= 0 && d2 >= 0 && d6 <= 0 ) {

			// 辺 ac の領域
			const w = d2 / ( d2 - d6 );
			closestPoint.copy( a ).addScaledVector( ac, w );

		} else if ( va <= 0 && ( d4 - d3 ) >= 0 && ( d5 - d6 ) >= 0 ) {

			// 辺 bc の領域
			const w = ( d4 - d3 ) / ( ( d4 - d3 ) + ( d5 - d6 ) );
			bc.subVectors( c, b );
			closestPoint.copy( b ).addScaledVector( bc, w );

		} else {

			// フェイス内部の領域
			const denom = 1 / ( va + vb + vc );
			const v = vb * denom;
			const w = vc * denom;
			closestPoint.copy( a ).addScaledVector( ab, v ).addScaledVector( ac, w );

		}

	}

	diff.subVectors( p, closestPoint );
	const distanceSquared = diff.lengthSq();

	if ( distanceSquared > sphere.radius * sphere.radius ) {

		return false;

	}

	const distance = Math.sqrt( distanceSquared );

	// 中心が三角形上にほぼ乗っている場合は方向が定まらないのでフェイス法線を使う
	if ( distance <= EPSILON ) {

		out.set( closestPoint, normal, sphere.radius );
		return true;

	}

	out.set(
		closestPoint,
		diff.divideScalar( distance ), // 最近点 → 中心 の単位ベクトル
		sphere.radius - distance,
	);

	return true;

}

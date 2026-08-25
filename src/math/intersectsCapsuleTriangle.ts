import { Vector3, Plane, Sphere, MathUtils } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
import { type ComputedTriangle } from './triangle';

import { Intersection } from './Intersection';
import { intersectsSphereTriangle } from './intersectsSphereTriangle';

const EPSILON = 1e-10;
const sphere = new Sphere();

// https://wickedengine.net/2020/04/26/capsule-collision-detection/
// カプセルの中心線上に「三角形へ最も近づく点」を求め、そこに半径ぶんの球を置いて
// 球 vs 三角形へ帰着させる。フェイス内・辺・頂点のどこで当たっても
// 接触点・法線・貫通量が一貫して求まる。
// also "Real-Time Collision Detection" (Christer Ericson) 5.1.10

const _plane = new Plane();
const _capsuleDirection = new Vector3();
const _linePlanePoint = new Vector3();
const _referencePoint = new Vector3();
const _startToReference = new Vector3();

export function intersectsCapsuleTriangle( capsule: Capsule, triangle: ComputedTriangle, out: Intersection ) {

	// 線分長が 0 の退化カプセルは球として扱う（start === end のときの NaN を回避）
	if ( capsule.start.distanceToSquared( capsule.end ) <= EPSILON ) {

		sphere.center.copy( capsule.start );
		sphere.radius = capsule.radius;
		return intersectsSphereTriangle( sphere, triangle.a, triangle.b, triangle.c, triangle.normal, out );

	}

	// 中心線の両端のフェイス平面からの符号付き距離
	triangle.getPlane( _plane );
	const distanceStart = _plane.distanceToPoint( capsule.start );
	const distanceEnd = _plane.distanceToPoint( capsule.end );

	if (
		// 両端ともフェイスの表側（+法線側）で半径より遠い → 接触なし
		( distanceStart > capsule.radius && distanceEnd > capsule.radius ) ||
		// 両端とも裏側（-法線側）にある → 接触なし
		// （床面と同じ高さの下向き面などで、上に居るキャラを真下へ押し出す誤検出を防ぐ）
		( distanceStart < 0 && distanceEnd < 0 )
	) {

		return false;

	}

	// 参照点を求める: 中心線とフェイス平面の交点（線分外なら端へクランプ）を
	// 三角形上へ寄せた点。これが「三角形のどのあたりに当たっているか」を表す。
	_capsuleDirection.subVectors( capsule.end, capsule.start );
	const denominator = _plane.normal.dot( _capsuleDirection );

	// 平面上の点の位置 t は distanceStart + t * denominator === 0 で決まる。
	// 中心線がフェイスと平行（denominator ≈ 0）なら、平面に近い方の端点を使う。
	const t = Math.abs( denominator ) <= EPSILON
		? ( Math.abs( distanceStart ) <= Math.abs( distanceEnd ) ? 0 : 1 )
		: MathUtils.clamp( - distanceStart / denominator, 0, 1 );

	_linePlanePoint.copy( capsule.start ).addScaledVector( _capsuleDirection, t );
	triangle.closestPointToPoint( _linePlanePoint, _referencePoint );

	// 参照点に最も近い中心線上の点へ球を置いて、球 vs 三角形へ帰着させる。
	// 貫通量は「その球の中心と三角形上の最近点の距離」から求まるので、
	// 傾いたフェイスに対して中心線の遠い端の距離を拾ってしまうことがない。
	const lengthSquared = _capsuleDirection.lengthSq();
	const s = MathUtils.clamp(
		_startToReference.subVectors( _referencePoint, capsule.start ).dot( _capsuleDirection ) / lengthSquared,
		0,
		1,
	);

	sphere.center.copy( capsule.start ).addScaledVector( _capsuleDirection, s );
	sphere.radius = capsule.radius;

	return intersectsSphereTriangle( sphere, triangle.a, triangle.b, triangle.c, triangle.normal, out );

}

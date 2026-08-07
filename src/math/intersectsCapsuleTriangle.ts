import { Vector3, Plane, Sphere, MathUtils } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
import { type ComputedTriangle } from './triangle';

import { Intersection } from './Intersection';
import { intersectsSphereTriangle } from './intersectsSphereTriangle';

const EPSILON = 1e-10;
const vec3 = new Vector3();
const vec3_0 = new Vector3();
const vec3_1 = new Vector3();
const sphere = new Sphere();


// based on https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/Octree.js
//
// https://wickedengine.net/2020/04/26/capsule-collision-detection/
// we select the closest point on the capsule line to the triangle,
// place a sphere on that point and then perform the sphere – triangle test.
// also
// 5.1.10

const _v1 = new Vector3();
const _plane = new Plane();

const point1 = new Vector3();
const point2 = new Vector3();

export function intersectsCapsuleTriangle( capsule: Capsule, triangle: ComputedTriangle, out: Intersection ) {

	// 線分長が 0 の退化カプセルは球として扱う（start === end のときの NaN を回避）
	if ( capsule.start.distanceToSquared( capsule.end ) <= EPSILON ) {

		sphere.center.copy( capsule.start );
		sphere.radius = capsule.radius;
		return intersectsSphereTriangle( sphere, triangle.a, triangle.b, triangle.c, triangle.normal, out );

	}

	// based on three.js examples/jsm/math/Octree.js triangleCapsuleIntersect
	// 中心線の両端のフェイス平面からの符号付き距離（半径ぶん差し引く）
	triangle.getPlane( _plane );
	const d1 = _plane.distanceToPoint( capsule.start ) - capsule.radius;
	const d2 = _plane.distanceToPoint( capsule.end ) - capsule.radius;

	if (
		// 両端ともフェイスの表側（+法線側）で半径より遠い → 接触なし
		( d1 > 0 && d2 > 0 ) ||
		// 両端とも裏側（-法線側）を半径以上通り過ぎている → 接触なし
		// （床面と同じ高さの下向き面などで、上に居るキャラを真下へ押し出す誤検出を防ぐ）
		( d1 < - capsule.radius && d2 < - capsule.radius )
	) {

		return false;

	}

	// フェイス内部との接触:
	// 中心線上でフェイス平面に最も近づく点がフェイスの内側にあれば、面で接している。
	// （縦カプセル vs 縦壁のように中心線が面と平行でも正しく検出できる）
	const delta = Math.abs( d1 / ( Math.abs( d1 ) + Math.abs( d2 ) ) );
	const intersectPoint = _v1.copy( capsule.start ).lerp( capsule.end, delta );

	if ( triangle.containsPoint( intersectPoint ) ) {

		out.set(
			intersectPoint,
			_plane.normal, // 押し出し方向 = フェイス法線
			Math.abs( Math.min( d1, d2 ) ), // 貫通量（正の値）
		);

		return true;

	}

	// 辺との接触: 中心線と三角形の各辺の最近点間距離が半径以下なら、辺で接している。
	// もっとも深い（距離が最小の）辺を採用する。3辺は展開して書く（一時配列を作らない）。
	const radiusSquared = capsule.radius * capsule.radius;

	let minDistanceSquared = Infinity;
	minDistanceSquared = testEdge( capsule, triangle.a, triangle.b, radiusSquared, minDistanceSquared, out );
	minDistanceSquared = testEdge( capsule, triangle.b, triangle.c, radiusSquared, minDistanceSquared, out );
	minDistanceSquared = testEdge( capsule, triangle.c, triangle.a, radiusSquared, minDistanceSquared, out );

	return minDistanceSquared !== Infinity;

}

// カプセルの中心線と辺 (edgeStart, edgeEnd) の最近点間距離が半径以下で、
// かつこれまでの最小より近ければ out を更新する。採用したら「その距離^2」を、しなければ渡された値を返す。
function testEdge( capsule: Capsule, edgeStart: Vector3, edgeEnd: Vector3, radiusSquared: number, minDistanceSquared: number, out: Intersection ) {

	nearestPointsOnLineSegments( capsule.start, capsule.end, edgeStart, edgeEnd, point1, point2 );
	const distanceSquared = point1.distanceToSquared( point2 );

	if ( distanceSquared >= radiusSquared || distanceSquared >= minDistanceSquared ) return minDistanceSquared;

	const distance = Math.sqrt( distanceSquared );
	out.set(
		point1,
		_v1.subVectors( point1, point2 ).divideScalar( distance || 1 ), // 辺 → 中心線 の単位ベクトル
		capsule.radius - distance,
	);

	return distanceSquared;

}

// https://stackoverflow.com/a/67102941/1512272
function nearestPointsOnLineSegments( a0: Vector3, a1: Vector3, b0: Vector3, b1: Vector3, out0: Vector3, out1: Vector3 ) {

	const r = vec3.subVectors( b0, a0 );
	const u = vec3_0.subVectors( a1, a0 );
	const v = vec3_1.subVectors( b1, b0 );

	const ru = r.dot( u );
	const rv = r.dot( v );
	const uu = u.dot( u );
	const uv = u.dot( v );
	const vv = v.dot( v );

	const det = uu * vv - uv * uv;
	let s, t;

	if ( det < EPSILON * uu * vv ) {

		s = MathUtils.clamp( ru / uu, 0, 1 );
		t = 0;

	} else {

		s = MathUtils.clamp( ( ru * vv - rv * uv ) / det, 0, 1 );
		t = MathUtils.clamp( ( ru * uv - rv * uu ) / det, 0, 1 );

	}

	const S = MathUtils.clamp( ( t * uv + ru ) / uu, 0, 1 );
	const T = MathUtils.clamp( ( s * uv - rv ) / vv, 0, 1 );

	out0.addVectors( a0, u.multiplyScalar( S ) );
	out1.addVectors( b0, v.multiplyScalar( T ) );

}

import { Vector3, Line3, Plane, Sphere, MathUtils } from 'three';
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
const _line1 = new Line3();
const _line2 = new Line3();

const capsuleNormal = new Vector3();
const lineEndOffset = new Vector3();
const capsuleTip = new Vector3();
const capsuleBase = new Vector3();
const point1 = new Vector3();
const point2 = new Vector3();

export function intersectsCapsuleTriangle( capsule: Capsule, triangle: ComputedTriangle, out: Intersection ) {

	capsuleNormal.subVectors( capsule.start, capsule.end ).normalize();
	lineEndOffset.copy( capsuleNormal ).multiplyScalar( capsule.radius );

	// top
	capsuleTip.addVectors( capsule.start, lineEndOffset );
	// bottom
	capsuleBase.subVectors( capsule.end, lineEndOffset );

	triangle.getPlane( _plane );
	_line1.set( capsuleTip, capsuleBase );

	// ラインセグメントが貫通しているでの、交差している。
	if ( _plane.intersectLine( _line1, _v1 ) && triangle.containsPoint( _v1 ) ) {

		const d1 = _plane.distanceToPoint( capsuleTip );
		const d2 = _plane.distanceToPoint( capsuleBase );

		out.set(
			_v1,
			_plane.normal,
			Math.abs( Math.min( d1, d2 ) ),
		);

		return true;

	}

	// カプセルの中心線と三角形の辺を検証し、カプセルの中心線内で一番近い点を探す
	const line1 = _line1.set( capsule.start, capsule.end );
	const lines = [
		[ triangle.a, triangle.b ],
		[ triangle.b, triangle.c ],
		[ triangle.c, triangle.a ]
	];

	const closestPoint = _v1;
	let minimumDistanceSquared = Infinity;
	for ( let i = 0; i < lines.length; i ++ ) {

		const line2 = _line2.set( lines[ i ][ 0 ], lines[ i ][ 1 ] );
		nearestPointsOnLineSegments( line1.start, line1.end, line2.start, line2.end, point1, point2 );
		const distanceSquared = point1.distanceToSquared( point2 );

		if ( distanceSquared < minimumDistanceSquared ) {

			closestPoint.copy( point1 );
			minimumDistanceSquared = distanceSquared;

		}

	}

	if ( minimumDistanceSquared <= capsule.radius * capsule.radius ) {

		// 残りは、球と三角形の交差テストと同様
		sphere.center.copy( closestPoint );
		sphere.radius = capsule.radius;
		return intersectsSphereTriangle( sphere, triangle.a, triangle.b, triangle.c, triangle.normal, out );

	}

	return false;

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

	const A = out0.addVectors( a0, u.multiplyScalar( S ) );
	const B = out1.addVectors( b0, v.multiplyScalar( T ) );
	return [ A, B ];

}

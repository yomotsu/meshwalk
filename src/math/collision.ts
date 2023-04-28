import { Vector3, Line3, Plane, Sphere, MathUtils } from 'three';
import type { Box3 } from 'three';
import type { Capsule } from 'three/examples/jsm/math/Capsule.js';
import type { ComputedTriangle } from './triangle';

const EPSILON = 1e-10;
const vec3 = new Vector3();
const vec3_0 = new Vector3();
const vec3_1 = new Vector3();
const sphere = new Sphere();
const line = new Line3();

export class Intersection {

	point = new Vector3();
	normal	= new Vector3();
	depth = 0;

	set( point: Vector3, normal: Vector3, depth: number ) {

		this.point.copy( point );
		this.normal.copy( normal );
		this.depth = depth;

	}

}

// https://arrowinmyknee.com/2021/03/15/some-math-about-capsule-collision/
export function isIntersectionCapsuleSphere( capsule: Capsule, sphere: Sphere ) {

	line.start.copy( capsule.start );
	line.end.copy( capsule.end );
	line.closestPointToPoint( sphere.center, true, vec3 );
	const r = capsule.radius + sphere.radius;
	return vec3.distanceToSquared( sphere.center ) <= r * r;

}

// https://3dkingdoms.com/weekly/weekly.php?a=3
export function isIntersectionLineBox( line: Line3, box: Box3, hit?: Vector3 ) {

	if ( line.end.x < box.min.x && line.start.x < box.min.x ) return false;
	if ( line.end.x > box.max.x && line.start.x > box.max.x ) return false;
	if ( line.end.y < box.min.y && line.start.y < box.min.y ) return false;
	if ( line.end.y > box.max.y && line.start.y > box.max.y ) return false;
	if ( line.end.z < box.min.z && line.start.z < box.min.z ) return false;
	if ( line.end.z > box.max.z && line.start.z > box.max.z ) return false;
	if (
		line.start.x > box.min.x && line.start.x < box.max.x &&
		line.start.y > box.min.y && line.start.y < box.max.y &&
		line.start.z > box.min.z && line.start.z < box.max.z
	) {

		hit && hit.copy( line.start );
		return true;

	}

	const _hit = vec3;

	if (
		( getIntersection( line.start.x - box.min.x, line.end.x - box.min.x, line.start, line.end, _hit ) && inBox( _hit, box, 1 ) ) ||
		( getIntersection( line.start.y - box.min.y, line.end.y - box.min.y, line.start, line.end, _hit ) && inBox( _hit, box, 2 ) ) ||
		( getIntersection( line.start.z - box.min.z, line.end.z - box.min.z, line.start, line.end, _hit ) && inBox( _hit, box, 3 ) ) ||
		( getIntersection( line.start.x - box.max.x, line.end.x - box.max.x, line.start, line.end, _hit ) && inBox( _hit, box, 1 ) ) ||
		( getIntersection( line.start.y - box.max.y, line.end.y - box.max.y, line.start, line.end, _hit ) && inBox( _hit, box, 2 ) ) ||
		( getIntersection( line.start.z - box.max.z, line.end.z - box.max.z, line.start, line.end, _hit ) && inBox( _hit, box, 3 ) )
	) {

		hit && hit.copy( _hit );
		return true;

	}

	return false;

}

function getIntersection( dst1: number, dst2: number, p1: Vector3, p2: Vector3, hit?: Vector3 ) {

	if ( ( dst1 * dst2 ) >= 0 ) return false;
	if ( dst1 == dst2 ) return false;

	if ( hit ) {

		vec3.subVectors( p2, p1 );
		vec3.multiplyScalar( - dst1 / ( dst2 - dst1 ) );
		hit.addVectors( p1, vec3 );

	}

	return true;

}

function inBox( hit: Vector3, box: Box3, axis: number ) {

	if ( axis === 1 && hit.z > box.min.z && hit.z < box.max.z && hit.y > box.min.y && hit.y < box.max.y ) return true;
	if ( axis === 2 && hit.z > box.min.z && hit.z < box.max.z && hit.x > box.min.x && hit.x < box.max.x ) return true;
	if ( axis === 3 && hit.x > box.min.x && hit.x < box.max.x && hit.y > box.min.y && hit.y < box.max.y ) return true;
	return false;

}

const center = new Vector3();
const extents = new Vector3();

export function isIntersectionBoxPlane( box: Box3, plane: Plane ) {

	center.addVectors( box.max, box.min ).multiplyScalar( 0.5 );
	extents.subVectors( box.max, center );

	const r = extents.x * Math.abs( plane.normal.x ) + extents.y * Math.abs( plane.normal.y ) + extents.z * Math.abs( plane.normal.z );
	const s = plane.normal.dot( center ) - plane.constant;

	return Math.abs( s ) <= r;

}

const v0 = new Vector3();
const v1 = new Vector3();
const v2 = new Vector3();

const f0 = new Vector3();
const f1 = new Vector3();
const f2 = new Vector3();

const a00 = new Vector3();
const a01 = new Vector3();
const a02 = new Vector3();
const a10 = new Vector3();
const a11 = new Vector3();
const a12 = new Vector3();
const a20 = new Vector3();
const a21 = new Vector3();
const a22 = new Vector3();

const plane = new Plane();

// based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
//
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// aabb: <THREE.Box3>
export function isIntersectionTriangleBox( a: Vector3, b: Vector3, c: Vector3, box: Box3 ) {

	let p0, p1, p2, r;

	// Compute box center and extents of AABoundingBox (if not already given in that format)
	center.addVectors( box.max, box.min ).multiplyScalar( 0.5 );
	extents.subVectors( box.max, center );

	// Translate triangle as conceptually moving AABB to origin
	v0.subVectors( a, center );
	v1.subVectors( b, center );
	v2.subVectors( c, center );

	// Compute edge vectors for triangle
	f0.subVectors( v1, v0 );
	f1.subVectors( v2, v1 );
	f2.subVectors( v0, v2 );

	// Test axes a00..a22 (category 3)
	a00.set( 0, - f0.z, f0.y );
	a01.set( 0, - f1.z, f1.y );
	a02.set( 0, - f2.z, f2.y );
	a10.set( f0.z, 0, - f0.x );
	a11.set( f1.z, 0, - f1.x );
	a12.set( f2.z, 0, - f2.x );
	a20.set( - f0.y, f0.x, 0 );
	a21.set( - f1.y, f1.x, 0 );
	a22.set( - f2.y, f2.x, 0 );

	// Test axis a00
	p0 = v0.dot( a00 );
	p1 = v1.dot( a00 );
	p2 = v2.dot( a00 );
	r = extents.y * Math.abs( f0.z ) + extents.z * Math.abs( f0.y );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a01
	p0 = v0.dot( a01 );
	p1 = v1.dot( a01 );
	p2 = v2.dot( a01 );
	r = extents.y * Math.abs( f1.z ) + extents.z * Math.abs( f1.y );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a02
	p0 = v0.dot( a02 );
	p1 = v1.dot( a02 );
	p2 = v2.dot( a02 );
	r = extents.y * Math.abs( f2.z ) + extents.z * Math.abs( f2.y );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a10
	p0 = v0.dot( a10 );
	p1 = v1.dot( a10 );
	p2 = v2.dot( a10 );
	r = extents.x * Math.abs( f0.z ) + extents.z * Math.abs( f0.x );
	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a11
	p0 = v0.dot( a11 );
	p1 = v1.dot( a11 );
	p2 = v2.dot( a11 );
	r = extents.x * Math.abs( f1.z ) + extents.z * Math.abs( f1.x );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a12
	p0 = v0.dot( a12 );
	p1 = v1.dot( a12 );
	p2 = v2.dot( a12 );
	r = extents.x * Math.abs( f2.z ) + extents.z * Math.abs( f2.x );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a20
	p0 = v0.dot( a20 );
	p1 = v1.dot( a20 );
	p2 = v2.dot( a20 );
	r = extents.x * Math.abs( f0.y ) + extents.y * Math.abs( f0.x );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a21
	p0 = v0.dot( a21 );
	p1 = v1.dot( a21 );
	p2 = v2.dot( a21 );
	r = extents.x * Math.abs( f1.y ) + extents.y * Math.abs( f1.x );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test axis a22
	p0 = v0.dot( a22 );
	p1 = v1.dot( a22 );
	p2 = v2.dot( a22 );
	r = extents.x * Math.abs( f2.y ) + extents.y * Math.abs( f2.x );

	if ( Math.max( - Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

		return false; // Axis is a separating axis

	}

	// Test the three axes corresponding to the face normals of AABB b (category 1).
	// Exit if...
	// ... [-extents.x, extents.x] and [min(v0.x,v1.x,v2.x), max(v0.x,v1.x,v2.x)] do not overlap
	if ( Math.max( v0.x, v1.x, v2.x ) < - extents.x || Math.min( v0.x, v1.x, v2.x ) > extents.x ) {

		return false;

	}

	// ... [-extents.y, extents.y] and [min(v0.y,v1.y,v2.y), max(v0.y,v1.y,v2.y)] do not overlap
	if ( Math.max( v0.y, v1.y, v2.y ) < - extents.y || Math.min( v0.y, v1.y, v2.y ) > extents.y ) {

		return false;

	}

	// ... [-extents.z, extents.z] and [min(v0.z,v1.z,v2.z), max(v0.z,v1.z,v2.z)] do not overlap
	if ( Math.max( v0.z, v1.z, v2.z ) < - extents.z || Math.min( v0.z, v1.z, v2.z ) > extents.z ) {

		return false;

	}

	// Test separating axis corresponding to triangle face normal (category 2)
	// Face Normal is -ve as Triangle is clockwise winding (and XNA uses -z for into screen)
	plane.normal.copy( f1 ).cross( f0 ).normalize();
	plane.constant = plane.normal.dot( a );

	return isIntersectionBoxPlane( box, plane );

}


// sphere1: <THREE.Sphere>
// sphere2: <THREE.Sphere>
export function isIntersectionSphereSphere( sphere1: Sphere, sphere2: Sphere ) {

	const radiusSum = sphere1.radius + sphere2.radius;

	return sphere1.center.distanceToSquared( sphere2.center ) <= ( radiusSum * radiusSum );

}

// Section 5.1.3
// sphere: <THREE.Sphere>
// aabb: <THREE.Box3>

export function isIntersectionSphereBox( sphere: Sphere, box: Box3 ) {

	let sqDist = 0;

	if ( sphere.center.x < box.min.x ) sqDist += ( box.min.x - sphere.center.x ) * ( box.min.x - sphere.center.x );
	if ( sphere.center.x > box.max.x ) sqDist += ( sphere.center.x - box.max.x ) * ( sphere.center.x - box.max.x );

	if ( sphere.center.y < box.min.y ) sqDist += ( box.min.y - sphere.center.y ) * ( box.min.y - sphere.center.y );
	if ( sphere.center.y > box.max.y ) sqDist += ( sphere.center.y - box.max.y ) * ( sphere.center.y - box.max.y );

	if ( sphere.center.z < box.min.z ) sqDist += ( box.min.z - sphere.center.z ) * ( box.min.z - sphere.center.z );
	if ( sphere.center.z > box.max.z ) sqDist += ( sphere.center.z - box.max.z ) * ( sphere.center.z - box.max.z );

	return sqDist <= sphere.radius * sphere.radius;

}

const A = new Vector3();
const B = new Vector3();
const C = new Vector3();
const V = new Vector3();

const AB = new Vector3();
const BC = new Vector3();
const CA = new Vector3();
const Q1 = new Vector3();
const Q2 = new Vector3();
const Q3 = new Vector3();
const QC = new Vector3();
const QA = new Vector3();
const QB = new Vector3();

const negatedNormal = new Vector3();

// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle
export function isIntersectionSphereTriangle( sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3, out: Intersection ) {

	// http://realtimecollisiondetection.net/blog/?p=103

	// vs plain of triangle face
	A.subVectors( a, sphere.center );
	B.subVectors( b, sphere.center );
	C.subVectors( c, sphere.center );
	const rr = sphere.radius * sphere.radius;
	V.crossVectors( vec3_0.subVectors( B, A ), vec3_1.subVectors( C, A ) );
	const d = A.dot( V );
	const e = V.dot( V );

	if ( d * d > rr * e ) {

		return false;

	}

	// vs triangle vertex
	const aa = A.dot( A );
	const ab = A.dot( B );
	const ac = A.dot( C );
	const bb = B.dot( B );
	const bc = B.dot( C );
	const cc = C.dot( C );

	if (
		( aa > rr ) && ( ab > aa ) && ( ac > aa ) ||
		( bb > rr ) && ( ab > bb ) && ( bc > bb ) ||
		( cc > rr ) && ( ac > cc ) && ( bc > cc )
	) {

		return false;

	}

	// vs edge
	AB.subVectors( B, A );
	BC.subVectors( C, B );
	CA.subVectors( A, C );
	const d1 = ab - aa;
	const d2 = bc - bb;
	const d3 = ac - cc;
	const e1 = AB.dot( AB );
	const e2 = BC.dot( BC );
	const e3 = CA.dot( CA );
	Q1.subVectors( A.multiplyScalar( e1 ), AB.multiplyScalar( d1 ) );
	Q2.subVectors( B.multiplyScalar( e2 ), BC.multiplyScalar( d2 ) );
	Q3.subVectors( C.multiplyScalar( e3 ), CA.multiplyScalar( d3 ) );
	QC.subVectors( C.multiplyScalar( e1 ), Q1 );
	QA.subVectors( A.multiplyScalar( e2 ), Q2 );
	QB.subVectors( B.multiplyScalar( e3 ), Q3 );

	if (
		( Q1.dot( Q1 ) > rr * e1 * e1 ) && ( Q1.dot( QC ) >= 0 ) ||
		( Q2.dot( Q2 ) > rr * e2 * e2 ) && ( Q2.dot( QA ) >= 0 ) ||
		( Q3.dot( Q3 ) > rr * e3 * e3 ) && ( Q3.dot( QB ) >= 0 )
	) {

		return false;

	}

	const distance = Math.sqrt( d * d / e ) - sphere.radius - 1;
	negatedNormal.set( - normal.x, - normal.y, - normal.z );
	const contactPoint = sphere.center.clone().add( negatedNormal.multiplyScalar( distance ) );

	out.set(
		contactPoint,
		normal,
		distance,
	);

	return true;

}

// // based on Real-Time Collision Detection Section 5.3.4
// // p: <THREE.Vector3>, // line3.start
// // q: <THREE.Vector3>, // line3.end
// // a: <THREE.Vector3>, // triangle.a
// // b: <THREE.Vector3>, // triangle.b
// // c: <THREE.Vector3>, // triangle.c
// const pq = new Vector3();
// const pa = new Vector3();
// const pb = new Vector3();
// const pc = new Vector3();
// const au = new Vector3();
// const bv = new Vector3();
// const cw = new Vector3();

// export function testLineTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ) {

// 	pq.subVectors( q, p );
// 	pa.subVectors( a, p );
// 	pb.subVectors( b, p );
// 	pc.subVectors( c, p );
// 	let u: number;
// 	let v: number;
// 	let w: number;

// 	u = scalarTriple( pq, pc, pb );

// 	if ( u < 0 ) return false;

// 	v = scalarTriple( pq, pa, pc );

// 	if ( v < 0 ) return false;

// 	w = scalarTriple( pq, pb, pa );

// 	if ( w < 0 ) return false;

// 	const denom = 1 / ( u + v + w );
// 	u *= denom;
// 	v *= denom;
// 	w *= denom;

// 	au.copy( a ).multiplyScalar( u );
// 	bv.copy( b ).multiplyScalar( v );
// 	cw.copy( c ).multiplyScalar( w );

// 	hit.copy( au ).add( bv ).add( cw );

// 	return true;

// }

// function scalarTriple( a: Vector3, b: Vector3, c: Vector3 ) {

// 	var m = b.clone().cross( c );
// 	return a.dot( m );

// }

// var vectorTriple = function ( a, b, c ) {

//   var m = b.clone().cross( c );
//   return a.clone().cross( m );

// }

const ab = new Vector3();
const ac = new Vector3();
const qp = new Vector3();
const n  = new Vector3();

const ap = new Vector3();
const e  = new Vector3();

const au = new Vector3();
const bv = new Vector3();
const cw = new Vector3();


export function testLineTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ): boolean {

	ab.subVectors( b, a );
	ac.subVectors( c, a );
	qp.subVectors( p, q );

	n.copy( ab ).cross( ac );

	const d = qp.dot( n );
	if ( d <= 0 ) return false;

	ap.subVectors( p, a );
	let t = ap.dot( n );

	if ( t < 0 ) return false;
	if ( t > d ) return false;

	e.copy( qp ).cross( ap );
	let v = ac.dot( e );

	if ( v < 0 || v > d ) return false;

	let w = vec3.copy( ab ).dot( e ) * - 1;

	if ( w < 0 || v + w > d ) return false;

	const ood = 1 / d;
	t *= ood;
	v *= ood;
	w *= ood;
	const u = 1 - v - w;

	au.copy( a ).multiplyScalar( u );
	bv.copy( b ).multiplyScalar( v );
	cw.copy( c ).multiplyScalar( w );

	hit.copy( au ).add( bv ).add( cw );

	return true;

}

//
// based on https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/Octree.js


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

export function testTriangleCapsule( capsule: Capsule, triangle: ComputedTriangle, out: Intersection ) {

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
		return isIntersectionSphereTriangle( sphere, triangle.a, triangle.b, triangle.c, triangle.normal, out );

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

import { Vector3, Line3, Plane } from 'three';
import type { Box3, Sphere } from 'three';

const vec3 = new Vector3();
const vec3_0 = new Vector3();
const vec3_1 = new Vector3();

// https://3dkingdoms.com/weekly/weekly.php?a=3
export function isIntersectionLineAABB( segment: Line3, aabb: Box3, hit?: Vector3 ) {

	if ( segment.end.x < aabb.min.x && segment.start.x < aabb.min.x ) return false;
	if ( segment.end.x > aabb.max.x && segment.start.x > aabb.max.x ) return false;
	if ( segment.end.y < aabb.min.y && segment.start.y < aabb.min.y ) return false;
	if ( segment.end.y > aabb.max.y && segment.start.y > aabb.max.y ) return false;
	if ( segment.end.z < aabb.min.z && segment.start.z < aabb.min.z ) return false;
	if ( segment.end.z > aabb.max.z && segment.start.z > aabb.max.z ) return false;
	if (
		segment.start.x > aabb.min.x && segment.start.x < aabb.max.x &&
		segment.start.y > aabb.min.y && segment.start.y < aabb.max.y &&
		segment.start.z > aabb.min.z && segment.start.z < aabb.max.z
	) {

		hit && hit.copy( segment.start );
		return true;

	}

	const _hit = vec3;

	if (
		( getIntersection( segment.start.x - aabb.min.x, segment.end.x - aabb.min.x, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 1 ) ) ||
		( getIntersection( segment.start.y - aabb.min.y, segment.end.y - aabb.min.y, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 2 ) ) ||
		( getIntersection( segment.start.z - aabb.min.z, segment.end.z - aabb.min.z, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 3 ) ) ||
		( getIntersection( segment.start.x - aabb.max.x, segment.end.x - aabb.max.x, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 1 ) ) ||
		( getIntersection( segment.start.y - aabb.max.y, segment.end.y - aabb.max.y, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 2 ) ) ||
		( getIntersection( segment.start.z - aabb.max.z, segment.end.z - aabb.max.z, segment.start, segment.end, _hit ) && inBox( _hit, aabb, 3 ) )
	) {

		hit && hit.copy( _hit );
		return true;

	}

	return false;

}

function getIntersection( fDst1: number, fDst2: number, P1: Vector3, P2: Vector3, Hit?: Vector3 ) {

	if ( ( fDst1 * fDst2 ) >= 0 ) return false;
	if ( fDst1 == fDst2 ) return false;

	if ( Hit ) {

		vec3.subVectors( P2, P1 );
		vec3.multiplyScalar( - fDst1 / ( fDst2 - fDst1 ) );
		Hit.addVectors( P1, vec3 );

	}

	return true;

}

function inBox( Hit: Vector3, aabb: Box3, Axis: number ) {

	if ( Axis === 1 && Hit.z > aabb.min.z && Hit.z < aabb.max.z && Hit.y > aabb.min.y && Hit.y < aabb.max.y ) return true;
	if ( Axis === 2 && Hit.z > aabb.min.z && Hit.z < aabb.max.z && Hit.x > aabb.min.x && Hit.x < aabb.max.x ) return true;
	if ( Axis === 3 && Hit.x > aabb.min.x && Hit.x < aabb.max.x && Hit.y > aabb.min.y && Hit.y < aabb.max.y ) return true;
	return false;

}

const center = new Vector3();
const extents = new Vector3();

export function isIntersectionAABBPlane( box: Box3, plane: Plane ) {

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
export function isIntersectionTriangleAABB( a: Vector3, b: Vector3, c: Vector3, aabb: Box3 ) {

	let p0, p1, p2, r;

	// Compute box center and extents of AABoundingBox (if not already given in that format)
	center.addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 );
	extents.subVectors( aabb.max, center );

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

	return isIntersectionAABBPlane( aabb, plane );

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

export function isIntersectionSphereAABB( sphere: Sphere, aabb: Box3 ) {

	let sqDist = 0;

	if ( sphere.center.x < aabb.min.x ) sqDist += ( aabb.min.x - sphere.center.x ) * ( aabb.min.x - sphere.center.x );
	if ( sphere.center.x > aabb.max.x ) sqDist += ( sphere.center.x - aabb.max.x ) * ( sphere.center.x - aabb.max.x );

	if ( sphere.center.y < aabb.min.y ) sqDist += ( aabb.min.y - sphere.center.y ) * ( aabb.min.y - sphere.center.y );
	if ( sphere.center.y > aabb.max.y ) sqDist += ( sphere.center.y - aabb.max.y ) * ( sphere.center.y - aabb.max.y );

	if ( sphere.center.z < aabb.min.z ) sqDist += ( aabb.min.z - sphere.center.z ) * ( aabb.min.z - sphere.center.z );
	if ( sphere.center.z > aabb.max.z ) sqDist += ( sphere.center.z - aabb.max.z ) * ( sphere.center.z - aabb.max.z );

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

//http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle
export function isIntersectionSphereTriangle( sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3 ) {

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

	return {
		distance,
		contactPoint,
	};

}

// based on Real-Time Collision Detection Section 5.3.4
// p: <THREE.Vector3>, // line3.start
// q: <THREE.Vector3>, // line3.end
// a: <THREE.Vector3>, // triangle.a
// b: <THREE.Vector3>, // triangle.b
// c: <THREE.Vector3>, // triangle.c
// normal: <THREE.Vector3>, // triangle.normal, optional

// var scalarTriple = function ( a, b, c ) {

//   var m = b.clone().cross( c );
//   return a.dot( m );

// }

// var vectorTriple = function ( a, b, c ) {

//   var m = b.clone().cross( c );
//   return a.clone().cross( m );

// }

// export function isIntersectionLineTriangle ( p, q, a, b, c, precision ) {

//   var pq = q.clone().sub( p ),
//       pa = a.clone().sub( p ),
//       pb = b.clone().sub( p ),
//       pc = c.clone().sub( p ),
//       u, v, w;

//   u = scalarTriple( pq, pc, pb );

//   if ( u < 0 ) { return false; }

//   v = scalarTriple( pq, pa, pc );

//   if ( v < 0 ) { return false; }

//   w = scalarTriple( pq, pb, pa );

//   if ( w < 0 ) { return false; }

//   var denom = 1 / ( u + v + w );
//   u *= denom;
//   v *= denom;
//   w *= denom;

//   var au = a.clone().multiplyScalar( u ),
//       bv = b.clone().multiplyScalar( v ),
//       cw = c.clone().multiplyScalar( w ),
//       contactPoint = au.clone().add( bv ).add( cw );

//   return {
//     contactPoint: contactPoint
//   }

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


export function testSegmentTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ): boolean {

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

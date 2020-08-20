import { THREE, onInstallHandlers } from '../install.js';

let vec3;
let vec3_0;
let vec3_1;

let center;
let extents;

onInstallHandlers.push( () => {

	vec3 = new THREE.Vector3();
	vec3_0 = new THREE.Vector3();
	vec3_1 = new THREE.Vector3();

	center = new THREE.Vector3();
	extents = new THREE.Vector3();

} );

// aabb: <THREE.Box3>
// Plane: <THREE.Plane>
export function isIntersectionAABBPlane( aabb, Plane ) {

	center.addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 );
	extents.subVectors( aabb.max, center );

	const r = extents.x * Math.abs( Plane.normal.x ) + extents.y * Math.abs( Plane.normal.y ) + extents.z * Math.abs( Plane.normal.z );
	const s = Plane.normal.dot( center ) - Plane.constant;

	return Math.abs( s ) <= r;

}

let v0;
let v1;
let v2;

let f0;
let f1;
let f2;

let a00;
let a01;
let a02;
let a10;
let a11;
let a12;
let a20;
let a21;
let a22;

let plane;

onInstallHandlers.push( () => {

	v0 = new THREE.Vector3();
	v1 = new THREE.Vector3();
	v2 = new THREE.Vector3();

	f0 = new THREE.Vector3();
	f1 = new THREE.Vector3();
	f2 = new THREE.Vector3();

	a00 = new THREE.Vector3();
	a01 = new THREE.Vector3();
	a02 = new THREE.Vector3();
	a10 = new THREE.Vector3();
	a11 = new THREE.Vector3();
	a12 = new THREE.Vector3();
	a20 = new THREE.Vector3();
	a21 = new THREE.Vector3();
	a22 = new THREE.Vector3();

	plane = new THREE.Plane();

} );

// based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
//
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// aabb: <THREE.Box3>
export function isIntersectionTriangleAABB( a, b, c, aabb ) {

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
export function isIntersectionSphereSphere( sphere1, sphere2 ) {

	const radiusSum = sphere1.radius + sphere2.radius;

	return sphere1.center.distanceToSquared( sphere2.center ) <= ( radiusSum * radiusSum );

}

// Section 5.1.3
// sphere: <THREE.Sphere>
// aabb: <THREE.Box3>

export function isIntersectionSphereAABB( sphere, aabb ) {

	let sqDist = 0;

	if ( sphere.center.x < aabb.min.x ) sqDist += ( aabb.min.x - sphere.center.x ) * ( aabb.min.x - sphere.center.x );
	if ( sphere.center.x > aabb.max.x ) sqDist += ( sphere.center.x - aabb.max.x ) * ( sphere.center.x - aabb.max.x );

	if ( sphere.center.y < aabb.min.y ) sqDist += ( aabb.min.y - sphere.center.y ) * ( aabb.min.y - sphere.center.y );
	if ( sphere.center.y > aabb.max.y ) sqDist += ( sphere.center.y - aabb.max.y ) * ( sphere.center.y - aabb.max.y );

	if ( sphere.center.z < aabb.min.z ) sqDist += ( aabb.min.z - sphere.center.z ) * ( aabb.min.z - sphere.center.z );
	if ( sphere.center.z > aabb.max.z ) sqDist += ( sphere.center.z - aabb.max.z ) * ( sphere.center.z - aabb.max.z );

	return sqDist <= sphere.radius * sphere.radius;

}

let A;
let B;
let C;
let V;

let AB;
let BC;
let CA;
let Q1;
let Q2;
let Q3;
let QC;
let QA;
let QB;

let negatedNormal;

onInstallHandlers.push( () => {

	A = new THREE.Vector3();
	B = new THREE.Vector3();
	C = new THREE.Vector3();
	V = new THREE.Vector3();

	AB = new THREE.Vector3();
	BC = new THREE.Vector3();
	CA = new THREE.Vector3();
	Q1 = new THREE.Vector3();
	Q2 = new THREE.Vector3();
	Q3 = new THREE.Vector3();
	QC = new THREE.Vector3();
	QA = new THREE.Vector3();
	QB = new THREE.Vector3();

	negatedNormal = new THREE.Vector3();

} );

//http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle
export function isIntersectionSphereTriangle( sphere, a, b, c, normal ) {

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
		( aa > rr ) & ( ab > aa ) & ( ac > aa ) ||
		( bb > rr ) & ( ab > bb ) & ( bc > bb ) ||
		( cc > rr ) & ( ac > cc ) & ( bc > cc )
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

// export function isIntersectionLineTrianglefunction ( p, q, a, b, c, precisio{

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


let ab;
let ac;
let qp;
let n;

let ap;
let e;

let au;
let bv;
let cw;

onInstallHandlers.push( () => {

	ab = new THREE.Vector3();
	ac = new THREE.Vector3();
	qp = new THREE.Vector3();
	n  = new THREE.Vector3();

	ap = new THREE.Vector3();
	e  = new THREE.Vector3();

	au = new THREE.Vector3();
	bv = new THREE.Vector3();
	cw = new THREE.Vector3();

} );

export function testSegmentTriangle( p, q, a, b, c ) {

	ab.subVectors( b, a );
	ac.subVectors( c, a );
	qp.subVectors( p, q );

	n.copy( ab ).cross( ac );

	const d = qp.dot( n );
	if ( d <= 0 ) return false;

	ap.subVectors( p, a );
	let t = ap.dot( n );

	if ( t < 0 ) return 0;
	if ( t > d ) return 0;

	e.copy( qp ).cross( ap );
	let v = ac.dot( e );

	if ( v < 0 || v > d ) return 0;

	let w = vec3.copy( ab ).dot( e ) * - 1;

	if ( w < 0 || v + w > d ) return 0;

	const ood = 1 / d;
	t *= ood;
	v *= ood;
	w *= ood;
	const u = 1 - v - w;

	au.copy( a ).multiplyScalar( u );
	bv.copy( b ).multiplyScalar( v );
	cw.copy( c ).multiplyScalar( w );
	const contactPoint = au.clone().add( bv ).add( cw );

	return { contactPoint };

}

import { Vector3 } from 'three';
const vec3 = new Vector3();

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

// export function intersectsLineTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ) {

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


export function intersectsLineTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ): boolean {

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

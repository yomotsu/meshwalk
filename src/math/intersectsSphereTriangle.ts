import { Vector3, Sphere } from 'three';
import { Intersection } from './Intersection';

const vec3_0 = new Vector3();
const vec3_1 = new Vector3();

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


// Sphere vs Triangle
// 1. Triangle から Plane をつくる
// 2. Sphere の中心から Plane の距離を求める
// 3. 距離が Sphere の半径よりも大きければ、交差していないので return null
// 4. Sphere の中心を通る、Plane からの垂線の、Plane 上の座標を求める
// 5. その座標が Triangle の内側にあれば、交差している。return { position: 交差座標、 normal: triangle の法線、depth: 半径 - 距離 }
// 6. 外側の場合、Triangle の3つの辺（セグメント）と、Sphere との最近距離を求める
// 7. 最近距離が半径よりも大きければ、交差していないので return null
// 8. 交差している場合、最も近い辺の、セグメント上の最近距離のを求める。return { position: 交差座標、 normal: 点と中心の方向ベクトル、depth: 半径 - 距離 }
// 9. 例外は return null
//
// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle
export function intersectsSphereTriangle( sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3, out: Intersection ) {

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

import { Vector3, Triangle, Sphere } from 'three';

const vec3 = new Vector3();
export class ComputedTriangle extends Triangle {

	boundingSphere: Sphere | undefined;
	normal: Vector3;

	constructor( a: Vector3, b: Vector3, c: Vector3 ) {

		super( a, b, c );

		this.normal = this.getNormal( new Vector3() );

	}

	computeBoundingSphere() {

		this.boundingSphere = makeTriangleBoundingSphere( this, this.normal );

	}

	// https://math.stackexchange.com/questions/1397456/how-to-scale-a-triangle-such-that-the-distance-between-original-edges-and-new-ed
	// scale( amount: number ) {

	// 	const incenter = getIncenter( this, vec3 );

	// 	this.a.sub( incenter ).multiplyScalar( amount ).add( incenter );
	// 	this.b.sub( incenter ).multiplyScalar( amount ).add( incenter );
	// 	this.c.sub( incenter ).multiplyScalar( amount ).add( incenter );

	// 	拡張したら、過去の boundingSphere はすでに大きさが違うものとなる。破棄する。
	// 	this.boundingSphere = undefined;

	// }

	extend( amount: number ) {

		const incenter = getIncenter( this, vec3 );

		const a = incenter.distanceTo( this.a );
		const b = incenter.distanceTo( this.b );
		const c = incenter.distanceTo( this.c );
		this.a.sub( incenter ).normalize().multiplyScalar( a + amount ).add( incenter );
		this.b.sub( incenter ).normalize().multiplyScalar( b + amount ).add( incenter );
		this.c.sub( incenter ).normalize().multiplyScalar( c + amount ).add( incenter );

		// 拡張したら、過去の boundingSphere はすでに大きさが違うものとなる。破棄する。
		this.boundingSphere = undefined;

	}

}

// aka Semiperimeter
function getIncenter( triangle: Triangle, out: Vector3 ) {

	// https://byjus.com/maths/incenter-of-a-triangle/
	const a = triangle.a.distanceTo( triangle.b );
	const b = triangle.b.distanceTo( triangle.c );
	const c = triangle.c.distanceTo( triangle.a );
	const p = a + b + c;

	out.set(
		( a * triangle.a.x + b * triangle.b.x + c * triangle.c.x ) / p,
		( a * triangle.a.y + b * triangle.b.y + c * triangle.c.y ) / p,
		( a * triangle.a.z + b * triangle.b.z + c * triangle.c.z ) / p,
	);

	return out;

}

// const edge = new Line3();
// function getInradius( triangle: Triangle ) {

// 	const incenter = getIncenter( triangle, vec3 );
// 	const closestPointToEdge = new Vector3();
// 	edge.start = triangle.a;
// 	edge.end = triangle.b;
// 	edge.closestPointToPoint( incenter, true, closestPointToEdge );
// 	return incenter.distanceTo( closestPointToEdge );

// }

// function makeTriangleBoundingBox( triangle: Triangle ) {

// 	const bb = new Box3();

// 	bb.min = bb.min.min( triangle.a );
// 	bb.min = bb.min.min( triangle.b );
// 	bb.min = bb.min.min( triangle.c );

// 	bb.max = bb.max.max( triangle.a );
// 	bb.max = bb.max.max( triangle.b );
// 	bb.max = bb.max.max( triangle.c );

// 	return bb;

// }

const v = new Vector3();
const v0 = new Vector3();
const v1 = new Vector3();
const e0 = new Vector3();
const e1 = new Vector3();
const triangleNormal = new Vector3();

function makeTriangleBoundingSphere( triangle: Triangle, normal: Vector3 ) {

	const bs = new Sphere();

	// obtuse triangle

	v0.subVectors( triangle.b, triangle.a );
	v1.subVectors( triangle.c, triangle.a );

	if ( v0.dot( v1 ) <= 0 ) {

		bs.center.addVectors( triangle.b, triangle.c ).divideScalar( 2 );
		bs.radius = v.subVectors( triangle.b, triangle.c ).length() / 2;
		return bs;

	}

	v0.subVectors( triangle.a, triangle.b );
	v1.subVectors( triangle.c, triangle.b );

	if ( v0.dot( v1 ) <= 0 ) {

		bs.center.addVectors( triangle.a, triangle.c ).divideScalar( 2 );
		bs.radius = v.subVectors( triangle.a, triangle.c ).length() / 2;
		return bs;

	}

	v0.subVectors( triangle.a, triangle.c );
	v1.subVectors( triangle.b, triangle.c );

	if ( v0.dot( v1 ) <= 0 ) {

		bs.center.addVectors( triangle.a, triangle.b ).divideScalar( 2 );
		bs.radius = v.subVectors( triangle.a, triangle.b ).length() / 2;
		return bs;

	}

	// acute‐angled triangle

	if ( ! normal ) {

		normal = triangle.getNormal( triangleNormal );

	}

	v0.crossVectors( v.subVectors( triangle.c, triangle.b ), normal );
	v1.crossVectors( v.subVectors( triangle.c, triangle.a ), normal );

	e0.addVectors( triangle.c, triangle.b ).multiplyScalar( .5 );
	e1.addVectors( triangle.c, triangle.a ).multiplyScalar( .5 );

	const a = v0.dot( v1 );
	const b = v0.dot( v0 );
	const d = v1.dot( v1 );
	const c = - v.subVectors( e1, e0 ).dot( v0 );
	const e = - v.subVectors( e1, e0 ).dot( v1 );

	const div = - a * a + b * d;
	// t = ( - a * c + b * e ) / div;
	const s = ( - c * d + a * e ) / div;

	bs.center = e0.clone().add( v0.clone().multiplyScalar( s ) );
	bs.radius = v.subVectors( bs.center, triangle.a ).length();
	return bs;

}

import {
	Box3,
	Line3,
	// Plane,
	Sphere,
	Vector3,
	type Ray,
} from 'three';
// import { Capsule } from '../math/Capsule.js';
import { ComputedTriangle } from '../math/triangle';
import { intersectsLineBox } from "../math/intersectsLineBox";
import { intersectsLineTriangle } from "../math/intersectsLineTriangle";

const _v1 = new Vector3();
const _v2 = new Vector3();

// get*Triangles の重複排除用のマーク。三角形は複数のサブツリーに属するため、1回のクエリで
// 同じ三角形が何度も見つかる。クエリごとに ID を1つ進め、結果へ入れた三角形へその ID を
// 書いておくことで、結果配列の線形探索（indexOf・O(n²)）を使わずに重複を弾く。
let _queryId = 0;
// const _plane = new Plane();
// const _line1 = new Line3();
// const _line2 = new Line3();
// const _sphere = new Sphere();
// const _capsule = new Capsule();

export class Octree {

	box: Box3;
	bounds = new Box3();
	triangles: ComputedTriangle[] = [];
	subTrees: Octree[] = [];

	constructor( box: Box3 = new Box3() ) {

		this.box = box;

	}

	addTriangle( triangle: ComputedTriangle ) {

		this.bounds.min.x = Math.min( this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.min.y = Math.min( this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.min.z = Math.min( this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z );
		this.bounds.max.x = Math.max( this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x );
		this.bounds.max.y = Math.max( this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y );
		this.bounds.max.z = Math.max( this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z );

		this.triangles.push( triangle );

	}

	calcBox() {

		this.box.set( this.bounds.min, this.bounds.max );

		// offset small amount to account for regular grid
		this.box.min.x -= 0.01;
		this.box.min.y -= 0.01;
		this.box.min.z -= 0.01;

		return this;

	}

	split( level: number ) {

		const subTrees = [];
		const halfSize = _v2.copy( this.box.max ).sub( this.box.min ).multiplyScalar( 0.5 );

		for ( let x = 0; x < 2; x ++ ) {

			for ( let y = 0; y < 2; y ++ ) {

				for ( let z = 0; z < 2; z ++ ) {

					const box = new Box3();
					const v = _v1.set( x, y, z );

					box.min.copy( this.box.min ).add( v.multiply( halfSize ) );
					box.max.copy( box.min ).add( halfSize );

					subTrees.push( new Octree( box ) );

				}

			}

		}

		let triangle;

		while ( triangle = this.triangles.pop() ) {

			for ( let i = 0; i < subTrees.length; i ++ ) {

				if ( subTrees[ i ].box.intersectsTriangle( triangle ) ) {

					subTrees[ i ].triangles.push( triangle );

				}

			}

		}

		for ( let i = 0; i < subTrees.length; i ++ ) {

			const len = subTrees[ i ].triangles.length;

			if ( len > 8 && level < 16 ) {

				subTrees[ i ].split( level + 1 );

			}

			if ( len !== 0 ) {

				this.subTrees.push( subTrees[ i ] );

			}

		}

	}

	build() {

		this.calcBox();
		this.split( 0 );

		return this;

	}

	getLineTriangles( line: Line3, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! intersectsLineBox( line, subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getLineTriangles( line, result, false );

			}

		}

		return result;

	}

	getRayTriangles( ray: Ray, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! ray.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getRayTriangles( ray, result, false );

			}

		}

		return result;

	}

	getSphereTriangles( sphere:Sphere, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! sphere.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getSphereTriangles( sphere, result, false );

			}

		}

		return result;

	}

	getCapsuleTriangles( capsule: Sphere, result: ComputedTriangle[], isRoot = true ) {

		if ( isRoot ) _queryId ++;

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! capsule.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					const triangle = subTree.triangles[ j ];
					if ( triangle._queryId === _queryId ) continue;

					triangle._queryId = _queryId;
					result.push( triangle );

				}

			} else {

				subTree.getCapsuleTriangles( capsule, result, false );

			}

		}

	}

	lineIntersect( line: Line3 ) {

		const position = new Vector3();
		const triangles: ComputedTriangle[] = [];
		let distanceSquared = Infinity;
		let triangle: ComputedTriangle | null = null;

		this.getLineTriangles( line, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = _v1;
			const isIntersected = intersectsLineTriangle( line.start, line.end, triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, result );

			if ( isIntersected ) {

				const newDistanceSquared = line.start.distanceToSquared( result );

				if ( distanceSquared > newDistanceSquared ) {

					position.copy( result );
					distanceSquared = newDistanceSquared;
					triangle = triangles[ i ];

				}

			}

		}

		return triangle ? { distance: Math.sqrt( distanceSquared ), triangle, position } : false;

	}

	rayIntersect( ray: Ray ) {

		if ( ray.direction.lengthSq() === 0 ) return;

		const triangles: ComputedTriangle[] = [];
		let triangle, position, distanceSquared = 1e100;

		this.getRayTriangles( ray, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = ray.intersectTriangle( triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, true, _v1 );

			if ( result ) {

				const newDistanceSquared = result.sub( ray.origin ).lengthSq();

				if ( distanceSquared > newDistanceSquared ) {

					position = result.clone().add( ray.origin );
					distanceSquared = newDistanceSquared;
					triangle = triangles[ i ];

				}

			}

		}

		return distanceSquared < 1e100 ? { distance: Math.sqrt( distanceSquared ), triangle, position } : false;

	}

}

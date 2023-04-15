// import { Vector3, Box3, BufferGeometry } from 'three';
// import type { Line3, Ray, Sphere, Mesh } from 'three';
// import {
// 	isIntersectionLineAABB,
// 	isIntersectionTriangleAABB,
// 	isIntersectionSphereAABB,
// } from '../math/collision';

import { ComputedTriangle } from '../math/triangle';

import {
	Box3,
	// Line3,
	// Plane,
	Sphere,
	Vector3,
	Mesh,
} from 'three';

import type {
	Ray,
	Object3D,
} from 'three';
// import { Capsule } from '../math/Capsule.js';


const _v1 = new Vector3();
const _v2 = new Vector3();
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

	getRayTriangles( ray: Ray, result: ComputedTriangle[] ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];
			if ( ! ray.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( result.indexOf( subTree.triangles[ j ] ) === - 1 ) result.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getRayTriangles( ray, result );

			}

		}

		return result;

	}

	getSphereTriangles( sphere:Sphere, result: ComputedTriangle[] ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! sphere.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( result.indexOf( subTree.triangles[ j ] ) === - 1 ) result.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getSphereTriangles( sphere, result );

			}

		}

		return result;

	}

	getCapsuleTriangles( capsule: Sphere, result: ComputedTriangle[] ) {

		for ( let i = 0; i < this.subTrees.length; i ++ ) {

			const subTree = this.subTrees[ i ];

			if ( ! capsule.intersectsBox( subTree.box ) ) continue;

			if ( subTree.triangles.length > 0 ) {

				for ( let j = 0; j < subTree.triangles.length; j ++ ) {

					if ( result.indexOf( subTree.triangles[ j ] ) === - 1 ) result.push( subTree.triangles[ j ] );

				}

			} else {

				subTree.getCapsuleTriangles( capsule, result );

			}

		}

	}

	rayIntersect( ray: Ray ) {

		if ( ray.direction.length() === 0 ) return;

		const triangles: ComputedTriangle[] = [];
		let triangle, position, distance = 1e100;

		this.getRayTriangles( ray, triangles );

		for ( let i = 0; i < triangles.length; i ++ ) {

			const result = ray.intersectTriangle( triangles[ i ].a, triangles[ i ].b, triangles[ i ].c, true, _v1 );

			if ( result ) {

				const newdistance = result.sub( ray.origin ).length();

				if ( distance > newdistance ) {

					position = result.clone().add( ray.origin );
					distance = newdistance;
					triangle = triangles[ i ];

				}

			}

		}

		return distance < 1e100 ? { distance: distance, triangle: triangle, position: position } : false;

	}

	addGraphNode( object: Object3D ) {

		object.updateWorldMatrix( true, true );
		object.traverse( ( childObject ) => {

			if ( childObject instanceof Mesh ) {

				const mesh = childObject;
				const geometry   = mesh.geometry.clone();
				geometry.applyMatrix4( mesh.matrix );
				geometry.computeVertexNormals();

				if ( !! geometry.index ) {

					const indices   = geometry.index.array;
					const positions = geometry.attributes.position.array;
					const groups   = ( geometry.groups.length !== 0 ) ? geometry.groups : [ { start: 0, count: indices.length, materialIndex: 0 } ];

					for ( let i = 0, l = groups.length; i < l; ++ i ) {

						const start  = groups[ i ].start;
						const count  = groups[ i ].count;

						for ( let ii = start, ll = start + count; ii < ll; ii += 3 ) {

							const a = indices[ ii ];
							const b = indices[ ii + 1 ];
							const c = indices[ ii + 2 ];

							const vA = new Vector3().fromArray( positions, a * 3 );
							const vB = new Vector3().fromArray( positions, b * 3 );
							const vC = new Vector3().fromArray( positions, c * 3 );

							this.addTriangle( new ComputedTriangle(
								vA,
								vB,
								vC,
							) );

						}

					}

				}

			}

		} );

		this.build();

	}

}

import { Vector3, BufferGeometry } from 'three';
import type { Sphere, Mesh } from 'three';
import {
	isIntersectionTriangleAABB,
	isIntersectionSphereAABB,
} from '../math/collision';

// OcTree with Morton Order
// based on http://marupeke296.com/COL_3D_No15_Octree.html
//
//       +------+------+
//       |\   2  \   3  \
//       | +------+------+
//       + |\      \      \
//       |\| +------+------+
//       | + |      |      |
//       +0|\|   6  |   7  |
//        \| +------+------+
//         + |      |      |
//    y     \|   4  |   5  |
//    |      +------+------+
//    +--x
//     \
//      z
//
//
//       +------+------+
//       |\   6  \   7  \
//       | +------+------+
//       + |\      \      \
//       |\| +------+------+
//       | + |      |      |
//       +4|\|   2  |   3  |
//        \| +------+------+
//         + |      |      |
//  z y     \|   0  |   1  |
//   \|      +------+------+
//    +--x
//

// min: <THREE.Vector3>
// max: <THREE.Vector3>
// maxDepth: <Number>
export class Octree {

	isOctree = true;
	min: Vector3;
	max: Vector3;
	maxDepth: number;
	nodes: OctreeNode[][] = [];

	constructor( min: Vector3, max: Vector3, maxDepth: number = 5 ) {

		this.min = min;
		this.max = max;
		this.maxDepth = maxDepth;
		this.nodes = [];
		this.isOctree = true;

		const nodeBoxSize = new Vector3();
		const nodeBoxMin = new Vector3();
		const nodeBoxMax = new Vector3();

		for ( let depth = 0; depth < this.maxDepth; depth ++ ) {

			this.nodes.push( [] );
			const pow2 = Math.pow( 2, depth );
			const pow4 = Math.pow( 4, depth );
			nodeBoxSize.subVectors( this.max, this.min ).divideScalar( pow2 );

			for ( let i = 0, length = Math.pow( 8, depth ); i < length; i ++ ) {

				const indexX = i % pow2;
				const indexY = ( i / pow4 ) | 0;
				const indexZ = ( ( i / pow2 ) | 0 ) % pow2;

				nodeBoxMin.set(
					this.min.x + indexX * nodeBoxSize.x,
					this.min.y + indexY * nodeBoxSize.y,
					this.min.z + indexZ * nodeBoxSize.z
				);
				nodeBoxMax.copy( nodeBoxMin ).add( nodeBoxSize );

				const mortonNumber = Octree.getMortonNumber( indexX, indexY, indexZ );
				this.nodes[ depth ][ mortonNumber ] = new OctreeNode( this, depth, mortonNumber, nodeBoxMin, nodeBoxMax );

			}

		}

	}

	importThreeMesh( threeMesh: Mesh ) {

		threeMesh.updateMatrix();

		const geometryId = threeMesh.geometry.uuid;
		const geometry   = threeMesh.geometry.clone();
		geometry.applyMatrix4( threeMesh.matrix );
		geometry.computeVertexNormals();

		if ( geometry instanceof BufferGeometry ) {

			if ( !! geometry.index ) {

				const indices   = geometry.index.array;
				const positions = geometry.attributes.position.array;
				// const normals   = geometry.attributes.normal.array;
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

						// https://github.com/mrdoob/three.js/issues/4691
						// make face normal
						const cb = new Vector3().subVectors( vC, vB );
						const ab = new Vector3().subVectors( vA, vB );
						const faceNormal = cb.cross( ab ).normalize().clone();

						const face = new Face(
							vA,
							vB,
							vC,
							faceNormal,
							geometryId
						);

						this.addFace( face );

					}

				}

			}

			return;

		}

	}

	addFace( face: Face ) {

		let tmp: OctreeNode[] = [];
		let targetNodes = this.nodes[ 0 ].slice( 0 );

		for ( let i = 0, l = this.maxDepth; i < l; i ++ ) {

			for ( let ii = 0, ll = targetNodes.length; ii < ll; ii ++ ) {

				const node = targetNodes[ ii ];
				const isIntersected = isIntersectionTriangleAABB( face.a, face.b, face.c, node );

				if ( isIntersected ) {

					node.trianglePool.push( face );

					if ( i + 1 !== this.maxDepth ) {

						tmp = tmp.concat( node.getChildNodes() );

					}

				}

			}

			if ( tmp.length === 0 ) {

				break;

			}

			targetNodes = tmp.slice( 0 );
			tmp.length = 0;

		}

	}

	removeThreeMesh( meshID: string ) {

		this.nodes.forEach( ( nodeDepth ) => {

			nodeDepth.forEach( ( node ) => {

				const newTrianglePool: Face[] = [];

				node.trianglePool.forEach( ( face ) => {

					if ( face.meshID !== meshID ) {

						newTrianglePool.push( face );

					}

				} );

				node.trianglePool = newTrianglePool;

			} );

		} );

	}

	getIntersectedNodes( sphere: Sphere, depth: number ) {

		let tmp: OctreeNode[] = [];
		const intersectedNodes = [];
		const isIntersected = isIntersectionSphereAABB( sphere, this );

		if ( ! isIntersected ) return [];

		let targetNodes = this.nodes[ 0 ].slice( 0 );

		for ( let i = 0, l = depth; i < l; i ++ ) {

			for ( let ii = 0, ll = targetNodes.length; ii < ll; ii ++ ) {

				const node = targetNodes[ ii ];
				const isIntersected = isIntersectionSphereAABB( sphere, node );

				if ( isIntersected ) {

					const isAtMaxDepth = ( i + 1 === depth );

					if ( isAtMaxDepth ) {

						if ( node.trianglePool.length !== 0 ) {

							intersectedNodes.push( node );

						}

					} else {

						tmp = tmp.concat( node.getChildNodes() );

					}

				}

			}

			targetNodes = tmp.slice( 0 );
			tmp.length = 0;

		}

		return intersectedNodes;

	}

	static separate3Bit( n: number ) {

		n = ( n | n << 8 ) & 0x0000f00f;
		n = ( n | n << 4 ) & 0x000c30c3;
		n = ( n | n << 2 ) & 0x00249249;
		return n;

	}

	static getMortonNumber( x: number, y: number, z: number ) {

		return (
			Octree.separate3Bit( x ) |
			Octree.separate3Bit( y ) << 1 |
			Octree.separate3Bit( z ) << 2
		);

	}

	static uniqTrianglesFromNodes( nodes: OctreeNode[] ) {

		const uniq = [];
		let isContained = false;

		if ( nodes.length === 0 ) return [];
		if ( nodes.length === 1 ) return nodes[ 0 ].trianglePool.slice( 0 );

		for ( let i = 0, l = nodes.length; i < l; i ++ ) {

			for ( let ii = 0, ll = nodes[ i ].trianglePool.length; ii < ll; ii ++ ) {

				for ( let iii = 0, lll = uniq.length; iii < lll; iii ++ ) {

					if ( nodes[ i ].trianglePool[ ii ] === uniq[ iii ] ) {

						isContained = true;

					}

				}

				if ( ! isContained ) {

					uniq.push( nodes[ i ].trianglePool[ ii ] );

				}

				isContained = false;

			}

		}

		return uniq;

	}

}

//

export class OctreeNode {

	tree: Octree;
	depth: number;
	mortonNumber: number;
	min: Vector3;
	max: Vector3;
	trianglePool: Face[] = [];

	constructor( tree: Octree, depth: number, mortonNumber: number, min: Vector3, max: Vector3 ) {

		this.tree = tree;
		this.depth = depth;
		this.mortonNumber = mortonNumber;
		this.min = min.clone();
		this.max = max.clone();

	}

	// getParentNode() {

	// 	if ( this.depth === 0 ) return null;
	// 	this.tree.nodes[ this.depth ][ this.mortonNumber >> 3 ];

	// }

	getChildNodes() {

		if ( this.tree.maxDepth === this.depth ) {

			return [];

		}

		const firstChild = this.mortonNumber << 3;

		return [
			this.tree.nodes[ this.depth + 1 ][ firstChild ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 1 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 2 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 3 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 4 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 5 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 6 ],
			this.tree.nodes[ this.depth + 1 ][ firstChild + 7 ]
		];

	}

}

//

// a: <THREE.Vector3>
// b: <THREE.Vector3>
// c: <THREE.Vector3>
// normal: <THREE.Vector3>
// meshID: <String>
export class Face {

	a: Vector3;
	b: Vector3;
	c: Vector3;
	normal: Vector3;
	meshID: string;

	constructor( a: Vector3, b: Vector3, c: Vector3, normal: Vector3, meshID: string ) {

		this.a = a.clone();
		this.b = b.clone();
		this.c = c.clone();
		this.normal = normal.clone();
		this.meshID = meshID;

	}

}

// origin   : <THREE.Vector3>
// direction: <THREE.Vector3>
// distance : <Float>
// class Ray{

// 	constructor( origin, direction, distance ) {

// 		this.origin = origin;
// 		this.direction = direction;
// 		this.distance = distance;

// 	}

// }

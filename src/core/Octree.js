import { THREE } from '../install.js';
import {
	isIntersectionTriangleAABB,
	isIntersectionSphereAABB,
} from '../math/collision.js';

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

	constructor( min, max, maxDepth ) {

		this.min = min;
		this.max = max;
		this.maxDepth = maxDepth;
		this.nodes = [];
		this.isOctree = true;

		const nodeBoxSize = new THREE.Vector3();
		const nodeBoxMin = new THREE.Vector3();
		const nodeBoxMax = new THREE.Vector3();

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

	importThreeMesh( threeMesh ) {

		threeMesh.updateMatrix();

		const geometryId = threeMesh.geometry.uuid;
		const geometry   = threeMesh.geometry.clone();
		geometry.applyMatrix4( threeMesh.matrix );
		geometry.computeVertexNormals();

		if ( geometry instanceof THREE.BufferGeometry ) {

			if ( geometry.index !== undefined ) {

				const indices   = geometry.index.array;
				const positions = geometry.attributes.position.array;
				// const normals   = geometry.attributes.normal.array;

				const offsets   = ( geometry.groups.length !== 0 ) ? geometry.groups : [ { start: 0, count: indices.length, materialIndex: 0 } ];

				for ( let i = 0, l = offsets.length; i < l; ++ i ) {

					const start  = offsets[ i ].start;
					const count  = offsets[ i ].count;
					const index  = offsets[ i ].materialIndex;

					for ( let ii = start, ll = start + count; ii < ll; ii += 3 ) {

						const a = index + indices[ ii ];
						const b = index + indices[ ii + 1 ];
						const c = index + indices[ ii + 2 ];

						const vA = new THREE.Vector3().fromArray( positions, a * 3 );
						const vB = new THREE.Vector3().fromArray( positions, b * 3 );
						const vC = new THREE.Vector3().fromArray( positions, c * 3 );

						// https://github.com/mrdoob/three.js/issues/4691
						// make face normal
						const cb = new THREE.Vector3().subVectors( vC, vB );
						const ab = new THREE.Vector3().subVectors( vA, vB );
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

		geometry.computeFaceNormals();

		for ( let i = 0, l = geometry.faces.length; i < l; i ++ ) {

			const face = new Face(
				geometry.vertices[ geometry.faces[ i ].a ],
				geometry.vertices[ geometry.faces[ i ].b ],
				geometry.vertices[ geometry.faces[ i ].c ],
				geometry.faces[ i ].normal,
				geometryId
			);
			this.addFace( face );

		}

	}

	addFace( face ) {

		let tmp = [];
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

	removeThreeMesh( meshID ) {

		this.nodes.forEach( ( nodeDepth ) => {

			nodeDepth.forEach( ( node ) => {

				const newTrianglePool = [];

				node.trianglePool.forEach( ( face ) => {

					if ( face.meshID !== meshID ) {

						newTrianglePool.push( face );

					}

				} );

				node.trianglePool = newTrianglePool;

			} );

		} );

	}

	getIntersectedNodes( sphere, depth ) {

		let tmp = [];
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

}

Octree.separate3Bit = function ( n ) {

	n = ( n | n << 8 ) & 0x0000f00f;
	n = ( n | n << 4 ) & 0x000c30c3;
	n = ( n | n << 2 ) & 0x00249249;
	return n;

};

Octree.getMortonNumber = function ( x, y, z ) {

	return (
		Octree.separate3Bit( x ) |
		Octree.separate3Bit( y ) << 1 |
		Octree.separate3Bit( z ) << 2
	);

};

Octree.uniqTrianglesFromNodes = function ( nodes ) {

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

};

//

class OctreeNode {

	constructor( tree, depth, mortonNumber, min, max ) {

		this.tree = tree;
		this.depth = depth;
		this.mortonNumber = mortonNumber;
		this.min = new THREE.Vector3( min.x, min.y, min.z );
		this.max = new THREE.Vector3( max.x, max.y, max.z );
		this.trianglePool = [];

	}

	getParentNode() {

		if ( this.depth === 0 ) return null;
		this.tree.nodes[ this.depth ][ this.mortonNumber >> 3 ];

	}

	getChildNodes() {

		if ( this.tree.maxDepth === this.depth ) {

			return null;

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
class Face {

	constructor( a, b, c, normal, meshID ) {

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

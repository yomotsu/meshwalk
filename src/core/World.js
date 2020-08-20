import { THREE, onInstallHandlers } from '../install.js';
import { Octree } from './Octree.js';

let sphere;

onInstallHandlers.push( () => {

	sphere = new THREE.Sphere();

} );

export class World {

	constructor() {

		this.colliderPool = [];
		this.characterPool = [];

	}

	add( object ) {

		if ( object.isOctree ) {

			this.colliderPool.push( object );

		} else if ( object.isCharacterController ) {

			this.characterPool.push( object );
			object.world = this;

		}

	}

	step( dt ) {

		for ( let i = 0, l = this.characterPool.length; i < l; i ++ ) {

			const character = this.characterPool[ i ];
			let faces;

			// octree で絞られた node に含まれる face だけを
			// character に渡して判定する
			for ( let ii = 0, ll = this.colliderPool.length; ii < ll; ii ++ ) {

				const octree = this.colliderPool[ ii ];
				sphere.set( character.center, character.radius + character.groundPadding );
				const intersectedNodes = octree.getIntersectedNodes( sphere, octree.maxDepth );
				faces = Octree.uniqTrianglesFromNodes( intersectedNodes );

			}

			character.collisionCandidate = faces;
			character.update( dt );

		}

	}

}

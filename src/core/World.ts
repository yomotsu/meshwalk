import { Sphere } from 'three';
import { Octree, Face } from './Octree';
import type { CharacterController } from './CharacterController';

const sphere = new Sphere();

export class World {

	colliderPool: Octree[] = [];
	characterPool: CharacterController[] = [];

	add( object: Octree | CharacterController ) {

		if ( ( object as Octree ).isOctree ) {

			this.colliderPool.push( object as Octree );

		} else if ( ( object as CharacterController ).isCharacterController ) {

			this.characterPool.push( object as CharacterController );

		}

	}

	step( deltaTime: number ) {

		for ( let i = 0, l = this.characterPool.length; i < l; i ++ ) {

			const character = this.characterPool[ i ];
			let faces: Face[] = [];

			// octree で絞られた node に含まれる face だけを
			// character に渡して判定する
			for ( let ii = 0, ll = this.colliderPool.length; ii < ll; ii ++ ) {

				const octree = this.colliderPool[ ii ];
				sphere.set( character.center, character.radius + character.groundPadding );
				const intersectedNodes = octree.getIntersectedNodes( sphere, octree.maxDepth );
				faces.push( ...Octree.uniqTrianglesFromNodes( intersectedNodes ) );

			}

			character.setNearTriangles( faces );
			character.update( deltaTime );

		}

	}

}

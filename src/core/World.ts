import { Sphere } from 'three';
import { ComputedTriangle } from '../math/triangle';
import { Octree } from './Octree';
import { CharacterController } from './CharacterController';

const sphere = new Sphere();

export class World {

	colliderPool: Octree[] = [];
	characterPool: CharacterController[] = [];
	private _fps: number;
	private _stepsPerFrame: number;
	private _intervalId: number | null = null;
	private _running = false;

	constructor( { fps = 60, stepsPerFrame = 4 } = {} ) {

		this._fps = fps;
		this._stepsPerFrame = stepsPerFrame;

	}

	add( object: Octree | CharacterController ) {

		if ( object instanceof Octree ) {

			this.colliderPool.push( object );

		}

		if ( object instanceof CharacterController ) {

			this.characterPool.push( object );

		}

	}

	remove( object: Octree | CharacterController ) {

		if ( object instanceof Octree ) {

			const index = this.colliderPool.indexOf( object );
			if ( index !== - 1 ) this.colliderPool.splice( index, 1 );

		}

		if ( object instanceof CharacterController ) {

			const index = this.characterPool.indexOf( object );
			if ( index !== - 1 ) this.characterPool.splice( index, 1 );

		}

	}

	update() {

		const deltaTime = 1 / this._fps;
		const stepDeltaTime = deltaTime / this._stepsPerFrame;

		for ( let i = 0; i < this._stepsPerFrame; i ++ ) {

			this.step( stepDeltaTime );

		}

	}

	step( stepDeltaTime: number ) {

		for ( let i = 0, l = this.characterPool.length; i < l; i ++ ) {

			const character = this.characterPool[ i ];
			let triangles: ComputedTriangle[] = [];

			// octree で絞られた node に含まれる face だけを
			// character に渡して判定する
			for ( let ii = 0, ll = this.colliderPool.length; ii < ll; ii ++ ) {

				const octree = this.colliderPool[ ii ];
				sphere.set( character.center, character.radius + character.groundPadding );
				triangles.push( ...octree.getSphereTriangles( sphere, [] ) );

			}

			character.setNearTriangles( triangles );
			character.update( stepDeltaTime );

		}

	}

}

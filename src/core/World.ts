import { Sphere } from 'three';
import { ComputedTriangle } from '../math/triangle';
import { Body } from './Body';
import { StaticBody } from './StaticBody';
import { CharacterController } from './CharacterController';

const sphere = new Sphere();

export class World {

	private _staticBodies: StaticBody[] = [];
	private _characterControllers: CharacterController[] = [];
	private _fps: number;
	private _stepsPerFrame: number;

	constructor( { fps = 60, stepsPerFrame = 4 } = {} ) {

		this._fps = fps;
		this._stepsPerFrame = stepsPerFrame;

	}

	/**
	 * 静的ボディ一覧（読み取り専用）。カメラのレイ衝突など内部処理から参照する。
	 */
	get colliders(): readonly StaticBody[] {

		return this._staticBodies;

	}

	add( body: Body ): void {

		if ( body instanceof StaticBody ) {

			if ( this._staticBodies.indexOf( body ) === - 1 ) this._staticBodies.push( body );

		} else if ( body instanceof CharacterController ) {

			if ( this._characterControllers.indexOf( body ) === - 1 ) this._characterControllers.push( body );

		}

	}

	remove( body: Body ): void {

		if ( body instanceof StaticBody ) {

			const index = this._staticBodies.indexOf( body );
			if ( index !== - 1 ) this._staticBodies.splice( index, 1 );

		} else if ( body instanceof CharacterController ) {

			const index = this._characterControllers.indexOf( body );
			if ( index !== - 1 ) this._characterControllers.splice( index, 1 );

		}

	}

	fixedUpdate(): void {

		const deltaTime = 1 / this._fps;
		const stepDeltaTime = deltaTime / this._stepsPerFrame;

		for ( let i = 0; i < this._stepsPerFrame; i ++ ) {

			this.step( stepDeltaTime );

		}

	}

	step( stepDeltaTime: number ): void {

		for ( let i = 0, l = this._characterControllers.length; i < l; i ++ ) {

			const character = this._characterControllers[ i ];
			const triangles: ComputedTriangle[] = [];

			// キャラクターのカプセル全体を囲む sphere で broad-phase して、
			// 近傍の三角形だけを character に渡して判定する
			for ( let ii = 0, ll = this._staticBodies.length; ii < ll; ii ++ ) {

				sphere.center.set( 0, character.height / 2, 0 ).add( character.position );
				sphere.radius = character.height / 2 + character.groundCheckDepth;
				this._staticBodies[ ii ].getSphereTriangles( sphere, triangles );

			}

			character.setNearTriangles( triangles );
			character.update( stepDeltaTime );

		}

	}

	dispose(): void {

		for ( let i = 0; i < this._staticBodies.length; i ++ ) this._staticBodies[ i ].dispose();
		for ( let i = 0; i < this._characterControllers.length; i ++ ) this._characterControllers[ i ].dispose();
		this._staticBodies.length = 0;
		this._characterControllers.length = 0;

	}

}

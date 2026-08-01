import { Sphere, Vector3 } from 'three';
import { ComputedTriangle } from '../math/triangle';
import { Body } from './Body';
import { StaticBody } from './StaticBody';
import { KinematicBody } from './KinematicBody';
import { CharacterController } from './CharacterController';

const sphere = new Sphere();
const _leaveVelocity = new Vector3();

// 巨大な deltaTime（タブ復帰・ブレークポイント復帰など）で追いつき処理が暴走
// （spiral of death）しないよう、1回の update で進める固定ステップ数の上限。
const MAX_CATCH_UP_FRAMES = 5;

export class World {

	private _staticBodies: StaticBody[] = [];
	private _kinematicBodies: KinematicBody[] = [];
	private _characterControllers: CharacterController[] = [];
	// カメラのレイ衝突など「レイを当てる対象」。静的＋動的ボディ（キャラは含めない）。
	private _colliders: ( StaticBody | KinematicBody )[] = [];
	private _fps: number;
	private _stepsPerFrame: number;
	private _accumulatedTime = 0;

	constructor( { fps = 60, stepsPerFrame = 4 } = {} ) {

		this._fps = fps;
		this._stepsPerFrame = stepsPerFrame;

	}

	/**
	 * 静的ボディ一覧（読み取り専用）。カメラのレイ衝突など内部処理から参照する。
	 */
	get colliders(): readonly ( StaticBody | KinematicBody )[] {

		return this._colliders;

	}

	add( body: Body ): void {

		if ( body instanceof StaticBody ) {

			if ( this._staticBodies.indexOf( body ) === - 1 ) {

				this._staticBodies.push( body );
				this._colliders.push( body );

			}

		} else if ( body instanceof KinematicBody ) {

			if ( this._kinematicBodies.indexOf( body ) === - 1 ) {

				this._kinematicBodies.push( body );
				this._colliders.push( body );

			}

		} else if ( body instanceof CharacterController ) {

			if ( this._characterControllers.indexOf( body ) === - 1 ) this._characterControllers.push( body );

		}

	}

	remove( body: Body ): void {

		if ( body instanceof StaticBody ) {

			const index = this._staticBodies.indexOf( body );
			if ( index !== - 1 ) this._staticBodies.splice( index, 1 );
			const colliderIndex = this._colliders.indexOf( body );
			if ( colliderIndex !== - 1 ) this._colliders.splice( colliderIndex, 1 );

		} else if ( body instanceof KinematicBody ) {

			const index = this._kinematicBodies.indexOf( body );
			if ( index !== - 1 ) this._kinematicBodies.splice( index, 1 );
			const colliderIndex = this._colliders.indexOf( body );
			if ( colliderIndex !== - 1 ) this._colliders.splice( colliderIndex, 1 );

		} else if ( body instanceof CharacterController ) {

			const index = this._characterControllers.indexOf( body );
			if ( index !== - 1 ) this._characterControllers.splice( index, 1 );

		}

	}

	/**
	 * 可変フレーム時間 deltaTime（秒）を受け取り、内部の固定ステップ（1/fps）へ
	 * 分解して実行する。物理はフレームレートに依存せず一定速度で進む。
	 * 毎フレーム `timer.update()` 後の `timer.getDelta()` など、実時間の delta を渡す。
	 * 決定論的にちょうど1フレーム進めたい場合（テスト等）は `fixedUpdate()` を直接使う。
	 */
	update( deltaTime: number ): void {

		const frameTime = 1 / this._fps;

		// 巨大な delta が来ても追いつき過多にならないよう上限でクランプする
		this._accumulatedTime += Math.min( deltaTime, frameTime * MAX_CATCH_UP_FRAMES );

		while ( this._accumulatedTime >= frameTime ) {

			this.fixedUpdate();
			this._accumulatedTime -= frameTime;

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

		// キャラクターの broad-phase より前に動的ボディを進める（キャラが新位置の床を見るため）
		for ( let i = 0, l = this._kinematicBodies.length; i < l; i ++ ) {

			this._kinematicBodies[ i ].step( stepDeltaTime );

		}

		for ( let i = 0, l = this._characterControllers.length; i < l; i ++ ) {

			const character = this._characterControllers[ i ];
			const triangles: ComputedTriangle[] = [];

			// 前ステップで接地していた床（運搬・離脱慣性の判定に使う「1つ前の土台」）
			const previousGroundBody = character.groundBody;

			// 運搬: 前ステップで動く床に接地していたら、その床のこのステップの変換差分を
			// キャラ位置へ適用してから接地判定する（Unreal の MovementBase / Godod の
			// move_and_slide と同じく「1つ前の土台」を使う）。縦成分は直後の接地スナップが
			// 再確定し、横成分だけが実質の運搬になる。
			if ( previousGroundBody instanceof KinematicBody ) {

				// 位置の運搬（並進＋回転床の軌道）。deltaMatrix が回転を含むので軌道運搬は自動。
				character.position.applyMatrix4( previousGroundBody.deltaMatrix );

				// 任意: 乗員の向きも床の yaw に追従させる
				if ( character.carryRotation ) {

					character.rotateFacing( previousGroundBody.angularVelocity.y * stepDeltaTime );

				}

			}

			// キャラクターのカプセル全体を囲む sphere で broad-phase して、
			// 近傍の三角形だけを character に渡して判定する
			sphere.center.set( 0, character.height / 2, 0 ).add( character.position );
			sphere.radius = character.height / 2 + character.groundCheckDepth;

			for ( let ii = 0, ll = this._staticBodies.length; ii < ll; ii ++ ) {

				this._staticBodies[ ii ].getSphereTriangles( sphere, triangles );

			}

			// 動的ボディの近傍三角形は現在位置でワールド座標へ変換して混ぜる（所有ボディ tag 付き）
			for ( let ii = 0, ll = this._kinematicBodies.length; ii < ll; ii ++ ) {

				this._kinematicBodies[ ii ].getSphereTriangles( sphere, triangles );

			}

			character.setNearTriangles( triangles );
			character.update( stepDeltaTime );

			// 離脱慣性: 動く床に乗っていたが、このステップで空中に出た（ジャンプ・端から落下）
			// なら、足元での床面速度を引き継ぐ。静的な地面へ歩き移った場合は接地したままなので
			// 引き継がない。床面速度は deltaMatrix から算出する: v = (deltaMatrix·p − p) / dt。
			// これは並進も回転（接線 ω×r）も乗員の位置で正しく含む。
			if ( previousGroundBody instanceof KinematicBody && ! character.isGrounded ) {

				_leaveVelocity.copy( character.position ).applyMatrix4( previousGroundBody.deltaMatrix );
				_leaveVelocity.sub( character.position ).divideScalar( stepDeltaTime );
				character.inheritVelocity( _leaveVelocity );

			}

		}

	}

	dispose(): void {

		for ( let i = 0; i < this._staticBodies.length; i ++ ) this._staticBodies[ i ].dispose();
		for ( let i = 0; i < this._kinematicBodies.length; i ++ ) this._kinematicBodies[ i ].dispose();
		for ( let i = 0; i < this._characterControllers.length; i ++ ) this._characterControllers[ i ].dispose();
		this._staticBodies.length = 0;
		this._kinematicBodies.length = 0;
		this._characterControllers.length = 0;
		this._colliders.length = 0;

	}

}

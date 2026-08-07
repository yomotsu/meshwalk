import { Sphere, Vector3 } from 'three';
import { ComputedTriangle } from '../math/triangle';
import { Body } from './Body';
import { StaticBody } from './StaticBody';
import { KinematicBody } from './KinematicBody';
import { CharacterController } from './CharacterController';
import { ClimbableBody } from './ClimbableBody';

const sphere = new Sphere();
const _staticQuerySphere = new Sphere();
const _leaveVelocity = new Vector3();

// 巨大な deltaTime（タブ復帰・ブレークポイント復帰など）で追いつき処理が暴走
// （spiral of death）しないよう、1回の update で進める固定ステップ数の上限。
const MAX_CATCH_UP_FRAMES = 5;

// 静的ジオメトリの broad-phase をフレーム先頭で1回だけ引くときに、1フレーム分の移動を
// 包むために半径へ足す余裕の下限（m）。速度から算出した余裕がこれ未満ならこの値を使う。
const STATIC_QUERY_PADDING_MIN = 0.1;

export class World {

	private _staticBodies: StaticBody[] = [];
	private _kinematicBodies: KinematicBody[] = [];
	private _characterControllers: CharacterController[] = [];
	private _climbableBodies: ClimbableBody[] = [];
	// broad-phase 結果の使い回しバッファ（キャラごとに1本。毎ステップの配列確保を避ける）
	// バッファの先頭 _staticTriangleCounts[ i ] 件は「フレーム先頭で引いた静的ジオメトリの
	// 三角形」で、substep 間で使い回す。その後ろへ substep ごとに動的ボディぶんを足す。
	private _triangleBuffers: ComputedTriangle[][] = [];
	private _climbableBuffers: ClimbableBody[][] = [];
	private _staticTriangleCounts: number[] = [];
	// 静的ぶんを引いたときの sphere（キャッシュの有効範囲）。substep の sphere がこの中に
	// 収まっている限り、必要な葉ノードは必ずキャッシュに含まれているので引き直さなくてよい。
	private _staticQueryCenters: Vector3[] = [];
	private _staticQueryRadii: number[] = [];
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

		} else if ( body instanceof ClimbableBody ) {

			if ( this._climbableBodies.indexOf( body ) === - 1 ) this._climbableBodies.push( body );

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

		} else if ( body instanceof ClimbableBody ) {

			const index = this._climbableBodies.indexOf( body );
			if ( index !== - 1 ) this._climbableBodies.splice( index, 1 );

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

		// 静的ジオメトリは substep 間で動かないので、broad-phase はフレーム先頭で1回だけ引く。
		// 1フレーム分の移動を包む余裕を持たせておき、足りなかった substep だけ引き直す。
		for ( let i = 0, l = this._characterControllers.length; i < l; i ++ ) {

			this._queryStaticTriangles( this._characterControllers[ i ], i, deltaTime );

		}

		for ( let i = 0; i < this._stepsPerFrame; i ++ ) {

			this.step( stepDeltaTime );

		}

	}

	/**
	 * キャラの近傍にある静的ジオメトリの三角形をバッファ先頭へ引き直す。
	 * 半径には「1フレームで動きうる距離」ぶんの余裕を足す（足りなければ step() が引き直す
	 * ので、この余裕は速度のためのチューニングであって正しさの条件ではない）。
	 */
	private _queryStaticTriangles( character: CharacterController, index: number, deltaTime: number ): void {

		const triangles = this._triangleBuffers[ index ] || ( this._triangleBuffers[ index ] = [] );
		const center = this._staticQueryCenters[ index ] || ( this._staticQueryCenters[ index ] = new Vector3() );

		// 乗っている動く床の運搬ぶんも移動量に含める
		const groundBody = character.groundBody;
		const platformSpeed = groundBody instanceof KinematicBody
			? groundBody.velocity.length() + groundBody.surfaceVelocity.length()
			: 0;
		const padding = Math.max( ( character.velocity.length() + platformSpeed ) * deltaTime, STATIC_QUERY_PADDING_MIN );

		center.set( 0, character.height / 2, 0 ).add( character.position );
		const radius = character.height / 2 + character.groundCheckDepth + padding;

		_staticQuerySphere.center.copy( center );
		_staticQuerySphere.radius = radius;

		triangles.length = 0;

		for ( let i = 0, l = this._staticBodies.length; i < l; i ++ ) {

			this._staticBodies[ i ].getSphereTriangles( _staticQuerySphere, triangles );

		}

		this._staticTriangleCounts[ index ] = triangles.length;
		this._staticQueryRadii[ index ] = radius;

	}

	step( stepDeltaTime: number ): void {

		// キャラクターの broad-phase より前に動的ボディを進める（キャラが新位置の床を見るため）
		for ( let i = 0, l = this._kinematicBodies.length; i < l; i ++ ) {

			this._kinematicBodies[ i ].step( stepDeltaTime );

		}

		for ( let i = 0, l = this._characterControllers.length; i < l; i ++ ) {

			const character = this._characterControllers[ i ];
			const triangles = this._triangleBuffers[ i ] || ( this._triangleBuffers[ i ] = [] );

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

			// 静的ぶんはフレーム先頭で引いたものを使い回す。このステップで必要な sphere が
			// キャッシュの sphere に収まっていなければ（ジャンプ開始・速い運搬・テレポートなど）
			// 引き直す。収まっていれば必要な葉ノードは必ず含まれている。
			const cachedCenter = this._staticQueryCenters[ i ];
			const isCacheValid = cachedCenter !== undefined &&
				cachedCenter.distanceTo( sphere.center ) + sphere.radius <= this._staticQueryRadii[ i ];

			if ( ! isCacheValid ) this._queryStaticTriangles( character, i, stepDeltaTime * this._stepsPerFrame );

			// 静的ぶんだけ残して、動的ボディの近傍三角形を現在位置でワールド座標へ変換して混ぜる（所有ボディ tag 付き）
			// 動的ボディが無ければ静的ぶんそのままなので、length 代入自体を避ける
			// （V8 は length 代入で backing store を作り直すことがあり、毎ステップ確保になる）
			const staticCount = this._staticTriangleCounts[ i ];
			if ( triangles.length !== staticCount ) triangles.length = staticCount;
			for ( let ii = 0, ll = this._kinematicBodies.length; ii < ll; ii ++ ) {

				this._kinematicBodies[ ii ].getSphereTriangles( sphere, triangles );

			}

			character.setNearTriangles( triangles );

			// 近傍の登れる領域（梯子・壁面）を渡す。broad-phase はキャラの sphere と box の交差。
			const climbables = this._climbableBuffers[ i ] || ( this._climbableBuffers[ i ] = [] );
			climbables.length = 0;
			for ( let ii = 0, ll = this._climbableBodies.length; ii < ll; ii ++ ) {

				if ( this._climbableBodies[ ii ].box.intersectsSphere( sphere ) ) climbables.push( this._climbableBodies[ ii ] );

			}
			character.setNearClimbables( climbables );

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
		for ( let i = 0; i < this._climbableBodies.length; i ++ ) this._climbableBodies[ i ].dispose();
		this._staticBodies.length = 0;
		this._kinematicBodies.length = 0;
		this._characterControllers.length = 0;
		this._climbableBodies.length = 0;
		this._colliders.length = 0;
		this._triangleBuffers.length = 0;
		this._climbableBuffers.length = 0;
		this._staticTriangleCounts.length = 0;
		this._staticQueryCenters.length = 0;
		this._staticQueryRadii.length = 0;

	}

}

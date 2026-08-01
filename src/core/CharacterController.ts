import { MathUtils, Quaternion, Vector2, Vector3 } from 'three';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';
import { Body } from './Body';
import { Intersection } from '../math/Intersection';
import { intersectsLineTriangle } from '../math/intersectsLineTriangle';
import { intersectsCapsuleTriangle } from '../math/intersectsCapsuleTriangle';
import { intersectsCapsuleSphere } from '../math/intersectsCapsuleSphere';
import { type ComputedTriangle } from '../math/triangle';

const FALL_VELOCITY = - 20; // 自由落下、崖滑り時の下向きの速度。単位は m/s。
const JUMP_DURATION_SEC = 1; // ジャンプ弧の全長（秒）。
const LANDING_MIN_FALL_DURATION_SEC = 0.1; // 段差補正などの瞬間的な非接地を着地衝撃として扱わない。
const PI_HALF = Math.PI * 0.5;
const PI_ONE_HALF = Math.PI * 1.5;

const direction2D = new Vector2();
const wallNormal2D = new Vector2();
const groundingHead = new Vector3();
const groundingTo = new Vector3();
const groundContactPointTmp = new Vector3();
const groundContactPoint = new Vector3();
// const point1 = new Vector3();
// const point2 = new Vector3();
// const direction = new Vector3();
// const translateScoped = new Vector3();
const translate = new Vector3();
const _yAxis = new Vector3( 0, 1, 0 );
const STEP_EPS = 1e-4;
const stepProbeFrom = new Vector3();
const stepProbeTo = new Vector3();
const stepProbePoint = new Vector3();
const headroomFrom = new Vector3();
const headroomTo = new Vector3();
const capsule = new Capsule( new Vector3(), new Vector3(), 0 );

const intersection = new Intersection();

export interface CharacterControllerOptions {
	radius: number;
	height: number;
	slopeLimit?: number;       // 度。既定 50
	stepOffset?: number;       // 登れる段差の最大高さ。既定 0.3
	groundCheckDepth?: number; // 既定 0.3
	landingLockDuration?: number; // ジャンプ・自由落下後の着地硬直時間（秒）。既定 0.2
}

export type CharacterControllerEventType =
	| 'startIdling'
	| 'startWalking'
	| 'startJumping'
	| 'startSliding'
	| 'startFalling'
	| 'startLanding'
	| 'endLanding';

export class CharacterController extends Body<CharacterControllerEventType> {

	isCharacterController = true;
	radius: number;
	height: number;
	position = new Vector3();
	quaternion = new Quaternion(); // 向き（利用側がメッシュへ同期する）
	groundCheckDepth = .3; // 接地したまま降りられる段差の上限。stepOffset 以上が望ましい（登り降り対称）
	slopeLimit = 50; // 度。これより急な面は登れず滑り落ちる（Unity の slopeLimit 相当）
	stepOffset = 0.3; // これ以下の高さの段差は自動で登る（0 で無効・Unity の stepOffset 相当）
	landingLockDuration = 0.2; // ジャンプ・自由落下から着地した直後、移動・ジャンプ入力を抑止する時間（秒）
	carryRotation = true; // true のとき、乗っている回転床の yaw に合わせて自分の向きも回す（既定 on）
	isGrounded = false;
	isOnSlope  = false;
	isIdling   = false;
	isRunning  = false; // 派生状態: move() で移動が指定されているとき true
	isJumping  = false;
	isLanding  = false;
	velocity = new Vector3( 0, 0, 0 );
	groundHeight = 0;
	groundNormal = new Vector3();
	groundBody: Body | null = null; // 接地している床の所有ボディ（動床なら KinematicBody）。無ければ null

	private _currentJumpPower = 0;
	private _isStepping = false; // 段差登り中フラグ（壁接触が一時的に消えても登りを継続させるラッチ）
	private _nearTriangles: ComputedTriangle[] = [];
	private _contactInfo: {
		depth: number;
		point: Vector3;
		normal: Vector3;
		triangle: ComputedTriangle;
	}[] = [];

	private _moveVelocity = new Vector3();     // move() で設定する望む水平速度
	private _externalVelocity = new Vector3(); // 動床から離れる際に引き継いだ水平慣性（着地までの drift）
	private _facingAngle = 0;                  // 向き（移動方向から算出）
	private _jumpElapsed = 0;              // ジャンプ開始からの経過（秒）。deltaTime を積算
	private _landingTimeRemaining = 0;
	private _fallElapsed = 0;
	private _events: ( deltaTime: number ) => void;

	private get _slopeLimitCos(): number {

		return Math.cos( this.slopeLimit * MathUtils.DEG2RAD );

	}

	constructor( { radius, height, slopeLimit, stepOffset, groundCheckDepth, landingLockDuration }: CharacterControllerOptions ) {

		super();

		if ( slopeLimit !== undefined ) this.slopeLimit = slopeLimit;
		if ( stepOffset !== undefined ) this.stepOffset = stepOffset;
		if ( groundCheckDepth !== undefined ) this.groundCheckDepth = groundCheckDepth;
		if ( landingLockDuration !== undefined ) this.landingLockDuration = Math.max( 0, landingLockDuration );

		this.radius = radius;
		// カプセルの全高（先端から先端まで）。幾何学的に最小でも球の直径（2 * radius）
		this.height = Math.max( height, radius * 2 );
		this.position.set( 0, 0, 0 );

		let isFirstUpdate = true;
		let wasGrounded = false;
		let wasOnSlope = false;
		// let wasIdling = false;
		let wasRunning = false;
		let wasJumping = false;

		this._events = ( deltaTime: number ) => {

			if ( ! this.isGrounded && ! this.isJumping && ! this.isOnSlope ) this._fallElapsed += deltaTime;

			// 初回のみ、過去状態を作るだけで終わり
			if ( isFirstUpdate ) {

				isFirstUpdate = false;
				wasGrounded = this.isGrounded;
				wasOnSlope  = this.isOnSlope;
				// wasIdling   = this.isIdling;
				wasRunning  = this.isRunning;
				wasJumping  = this.isJumping;
				return;

			}

			const startedLanding =
				! wasGrounded &&
				this.isGrounded &&
				! this.isOnSlope &&
				( wasJumping || LANDING_MIN_FALL_DURATION_SEC <= this._fallElapsed );

			if ( startedLanding ) {

				this.isIdling = false;
				this.isLanding = 0 < this.landingLockDuration;
				this._landingTimeRemaining = this.landingLockDuration;
				this.isRunning = ! this.isLanding && this._moveVelocity.lengthSq() > 1e-8;
				if ( this.isLanding ) {

					this.velocity.x = 0;
					this.velocity.z = 0;

				}
				this.dispatchEvent( { type: 'startLanding' } );
				if ( ! this.isLanding ) this.dispatchEvent( { type: 'endLanding' } );

			} else if ( ! this.isLanding && ! wasRunning && ! this.isRunning && this.isGrounded && ! this.isIdling ) {

				this.isIdling = true;
				this.dispatchEvent( { type: 'startIdling' } );

			} else if (
				! this.isLanding && (
					( ! wasRunning && this.isRunning && ! this.isJumping && this.isGrounded ) ||
				( ! wasGrounded && this.isGrounded && this.isRunning ) ||
				( wasOnSlope && ! this.isOnSlope && this.isRunning && this.isGrounded )
				)
			) {

				this.isIdling = false;
				this.dispatchEvent( { type: 'startWalking' } );

			} else if ( ! wasJumping && this.isJumping ) {

				this.isIdling = false;
				this.dispatchEvent( { type: 'startJumping' } );

			} else if ( ! wasOnSlope && this.isOnSlope ) {

				this.dispatchEvent( { type: 'startSliding' } );

			} else if ( wasGrounded && ! this.isGrounded && ! this.isJumping ) {

				this.dispatchEvent( { type: 'startFalling' } );

			}

			wasGrounded = this.isGrounded;
			wasOnSlope  = this.isOnSlope;
			// wasIdling   = this.isIdling;
			// landingLockDuration=0 でも、次の更新で現在の入力に応じた歩行／待機イベントへ遷移させる。
			wasRunning  = startedLanding ? false : this.isRunning;
			wasJumping  = this.isJumping;
			if ( this.isGrounded ) this._fallElapsed = 0;

		};

	}

	setNearTriangles( nearTriangles: ComputedTriangle[] ) {

		this._nearTriangles = nearTriangles;

	}

	/**
	 * 望む水平移動速度をワールド座標で指定する（Unity CharacterController.Move / Godot velocity 相当）。
	 * y 成分は無視する（上下は重力・ジャンプ・接地が扱う）。次に move() を呼ぶまで保持される。
	 * 停止させるにはゼロベクトルを渡す。
	 */
	move( velocity: Vector3 ) {

		this._moveVelocity.set( velocity.x, 0, velocity.z );
		this.isRunning = ! this.isLanding && this._moveVelocity.lengthSq() > 1e-8;
		// 向きは移動方向に合わせる（移動している間のみ更新）
		if ( this.isRunning ) this._facingAngle = Math.atan2( - this._moveVelocity.x, - this._moveVelocity.z );

	}

	/**
	 * 動く床から離れる瞬間に、その床の水平速度を慣性として引き継ぐ（着地するまで保持）。
	 * Godot の platform_on_leave（ADD_VELOCITY）/ Unreal の impart base velocity 相当。
	 * y 成分は無視する（ジャンプ弧と干渉させない）。World が離脱を検出して呼ぶ。
	 */
	inheritVelocity( velocity: Vector3 ) {

		this._externalVelocity.set( velocity.x, 0, velocity.z );

	}

	/**
	 * 向き（facing）を deltaAngle[rad] だけ回す。回転床の運搬で World が呼ぶ（carryRotation 時）。
	 * 移動入力があるフレームは move() が向きを上書きするので、実質は静止時に効く。
	 */
	rotateFacing( deltaAngle: number ) {

		this._facingAngle += deltaAngle;

	}

	update( deltaTime: number ) {

		this._updateLanding( deltaTime );

		// 状態をリセットしておく
		this.isGrounded = false;
		this.isOnSlope  = false;
		this.groundHeight = - Infinity;
		this.groundNormal.set( 0, 1, 0 );
		this.groundBody = null;

		this._checkGround();
		this._updateJumping( deltaTime );
		this._updatePosition( deltaTime );
		this._collisionDetection();
		this._solvePosition();
		this._updateVelocity();
		this._events( deltaTime );

	}

	_updateVelocity() {

		let isHittingCeiling = false;

		this.velocity.set(
			this.isLanding ? 0 : this._moveVelocity.x,
			FALL_VELOCITY,
			this.isLanding ? 0 : this._moveVelocity.z
		);

		// 急勾配や自由落下など、自動で付与される速度の処理
		if ( this._contactInfo.length === 0 && ! this.isJumping ) {

			// 何とも衝突していないので、自由落下
			return;

		} else if ( this.isGrounded && ! this.isOnSlope && ! this.isJumping ) {

			// 通常の地面上にいる場合、ただしジャンプ開始時は除く
			this.velocity.y = 0;

		} else if ( this.isOnSlope ) {

			// TODO 0.2 はマジックナンバーなので、幾何学的な求め方を考える
			const slidingDownVelocity = FALL_VELOCITY;
			const horizontalSpeed = - slidingDownVelocity / ( 1 - this.groundNormal.y ) * 0.2;

			this.velocity.x = this.groundNormal.x * horizontalSpeed;
			this.velocity.y = FALL_VELOCITY;
			this.velocity.z = this.groundNormal.z * horizontalSpeed;

		} else if ( ! this.isGrounded && ! this.isOnSlope && this.isJumping ) {

			// ジャンプの処理
			this.velocity.y = this._currentJumpPower * - FALL_VELOCITY;

		}


		// 壁に向かった場合、壁方向の速度を0にする処理
		// vs walls and sliding on the wall
		direction2D.set( this.velocity.x, this.velocity.z );
		// const frontAngle = Math.atan2( direction2D.y, direction2D.x );
		const negativeFrontAngle = Math.atan2( - direction2D.y, - direction2D.x );

		for ( let i = 0, l = this._contactInfo.length; i < l; i ++ ) {

			const normal = this._contactInfo[ i ].triangle.normal;
			// var distance = this._contactInfo[ i ].distance;

			if ( this._slopeLimitCos < normal.y || this.isOnSlope ) {

				// フェイスは地面なので、壁としての衝突の可能性はない。
				// 速度の減衰はしないでいい
				continue;

			}

			if ( ! isHittingCeiling && normal.y < 0 ) {

				isHittingCeiling = true;

			}

			wallNormal2D.set( normal.x, normal.z ).normalize();
			const wallAngle = Math.atan2( wallNormal2D.y, wallNormal2D.x );

			if (
				Math.abs( negativeFrontAngle - wallAngle ) >= PI_HALF &&  //  90deg
			  Math.abs( negativeFrontAngle - wallAngle ) <= PI_ONE_HALF // 270deg
			) {

				// フェイスは進行方向とは逆方向、要は背中側の壁なので
				// 速度の減衰はしないでいい
				continue;

			}

			// 上記までの条件に一致しなければ、フェイスは壁
			// 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする
			wallNormal2D.set(
				direction2D.dot( wallNormal2D ) * wallNormal2D.x,
				direction2D.dot( wallNormal2D ) * wallNormal2D.y
			);
			direction2D.sub( wallNormal2D );

			this.velocity.x = direction2D.x;
			this.velocity.z = direction2D.y;

		}

		// ジャンプ中に天井にぶつかったら、ジャンプを中断する
		if ( isHittingCeiling ) {

			this.velocity.y = Math.min( 0, this.velocity.y );
			this.isJumping = false;

		}

		// 動床から引き継いだ慣性（drift）: 接地したらクリア、空中では水平に加算し続ける
		if ( this.isGrounded ) {

			this._externalVelocity.set( 0, 0, 0 );

		} else {

			this.velocity.x += this._externalVelocity.x;
			this.velocity.z += this._externalVelocity.z;

		}

	}

	_checkGround() {

		// "頭上からほぼ無限に下方向までの線 (segment)" vs "フェイス (triangle)" の
		// 交差判定を行う
		// もし、フェイスとの交差点が「頭上」から「下 groundCheckDepth」までの間だったら
		// 地面上 (isGrounded) にいることとみなす
		//
		//   ___
		//  / | \
		// |  |  | player sphere
		//  \_|_/
		//    |
		//---[+]---- ground
		//    |
		//    |
		//    | segment (player's head to almost -infinity)

		let groundContact: { ground: ComputedTriangle, point: Vector3 } | null = null;
		const triangles = this._nearTriangles;

		groundingHead.set(
			this.position.x,
			this.position.y + this.height,
			this.position.z
		);

		groundingTo.set(
			this.position.x,
			this.position.y - 1e1,
			this.position.z
		);

		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const triangle = triangles[ i ];

			// 壁・天井は接地処理では無視
			if ( triangle.normal.y <= 0 ) continue;

			const isIntersected = intersectsLineTriangle(
				groundingHead,
				groundingTo,
				triangle.a,
				triangle.b,
				triangle.c,
				groundContactPointTmp,
			);

			if ( ! isIntersected ) continue;

			if ( ! groundContact ) {

				groundContactPoint.copy( groundContactPointTmp );
				groundContact = {
					point: groundContactPoint,
					ground: triangle,
				};
				continue;

			}

			if ( groundContactPointTmp.y <= groundContact.point.y ) continue;

			groundContactPoint.copy( groundContactPointTmp );
			groundContact = {
				point: groundContactPoint,
				ground: triangle,
			};

		}

		if ( ! groundContact ) return;

		this.groundHeight = groundContact.point.y;
		this.groundNormal.copy( groundContact.ground.normal );
		// その他、床の属性を追加で取得する場合はここで

		const top    = groundingHead.y;
		const bottom = this.position.y - this.groundCheckDepth;

		// ジャンプ中、かつ上方向に移動中だったら、強制接地しない
		if ( this.isJumping && 0 < this._currentJumpPower ) {

			this.isOnSlope  = false;
			this.isGrounded = false;
			this._isStepping = false;
			return;

		}

		// 低い段差を groundHeight に反映（接地スナップで滑らかに登る）
		this._stepLookAhead();

		this.isGrounded = ( bottom <= this.groundHeight && this.groundHeight <= top );
		this.isOnSlope  = ( this.groundNormal.y <= this._slopeLimitCos );

		if ( this.isGrounded ) {

			this.isJumping = false;
			// 乗っている床の所有ボディを覚える（動床の運搬判定に使う）
			this.groundBody = groundContact.ground.body;

		}

	}

	// 低い段差 (<= stepOffset) を自動で登る（Unity CharacterController.stepOffset 相当）。
	// 進行方向を塞ぐ壁があるとき、前縁の少し先・上（stepOffset 以内）に歩ける面があれば、
	// それを groundHeight として採用する。接地スナップ（_updatePosition）が y を段差へ
	// 滑らかに持ち上げ、その高さでは段差の垂直面がクリアされるので前進できる。
	//
	// ラッチ (_isStepping): 持ち上げると壁接触が一瞬消えてゲートが外れてしまうため、
	// 「一度登り始めたら、前方に段差が無くなる（＝上面に乗り切る）まで登りを継続」する。
	// 連続斜面では壁接触が起きないので発動しない（斜面で浮かせない）。
	_stepLookAhead() {

		if ( this.stepOffset <= 0 || this.isLanding ) return;

		// 望む入力方向を使う（velocity は壁ずりで壁方向成分が 0 にされるため段差判定に使えない）
		const vx = this._moveVelocity.x;
		const vz = this._moveVelocity.z;
		const hSq = vx * vx + vz * vz;
		if ( hSq < 1e-8 ) { this._isStepping = false; return; } // 水平移動していない

		const walkableCos = this._slopeLimitCos;

		// 進行方向を塞ぐ「壁」接触が（直前フレームに）あるか
		let wallAhead = false;
		for ( let i = 0, l = this._contactInfo.length; i < l; i ++ ) {

			const n = this._contactInfo[ i ].triangle.normal;
			if ( n.y > walkableCos ) continue;                          // 歩ける面は壁ではない
			if ( vx * n.x + vz * n.z < 0 ) { wallAhead = true; break; } // 進行方向に対向する面

		}

		// 壁に当たったら登り開始。登り中は壁が一瞬消えても継続（ラッチ）
		if ( ! wallAhead && ! this._isStepping ) return;

		const foot = this.position.y;

		// カプセル前縁（進行方向へ radius）の真下で、足元〜stepOffset の歩ける面の最高点を探す
		const inv = this.radius / Math.sqrt( hSq );
		const px = this.position.x + vx * inv;
		const pz = this.position.z + vz * inv;

		stepProbeFrom.set( px, foot + this.stepOffset + STEP_EPS, pz );
		stepProbeTo.set( px, foot - STEP_EPS, pz );

		let stepTop = - Infinity;
		let stepTriangle: ComputedTriangle | null = null;
		const triangles = this._nearTriangles;
		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const triangle = triangles[ i ];
			if ( triangle.normal.y <= walkableCos ) continue; // 歩ける面のみ
			if ( ! intersectsLineTriangle( stepProbeFrom, stepProbeTo, triangle.a, triangle.b, triangle.c, stepProbePoint ) ) continue;
			if ( stepProbePoint.y > stepTop ) { stepTop = stepProbePoint.y; stepTriangle = triangle; }

		}

		// 現在の地面より高い段差で、かつ stepOffset 以内でなければ登れない（＝壁のまま）
		const valid = ( stepTop > this.groundHeight + STEP_EPS ) && ( stepTop - foot <= this.stepOffset );
		if ( ! valid ) { this._isStepping = false; return; }

		// 頭上チェック: 持ち上げでカプセル頭が天井等に当たるなら登らない
		headroomFrom.set( this.position.x, foot + this.height, this.position.z );
		headroomTo.set( this.position.x, stepTop + this.height, this.position.z );
		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const triangle = triangles[ i ];
			if ( intersectsLineTriangle( headroomFrom, headroomTo, triangle.a, triangle.b, triangle.c, stepProbePoint ) ) { this._isStepping = false; return; }

		}

		this._isStepping = true;
		this.groundHeight = stepTop;
		if ( stepTriangle ) this.groundNormal.copy( stepTriangle.normal );

	}

	_updatePosition( deltaTime: number ) {

		// 壁などを無視してひとまず(速度 * 時間)だけ
		// position の座標を進める
		// 壁との衝突判定はこのこの後のステップで行うのでここではやらない
		// もし isGrounded 状態なら、強制的に y の値を地面に合わせる
		this.position.set(
			this.position.x + this.velocity.x * deltaTime,
			this.isGrounded ? this.groundHeight : this.position.y + this.velocity.y * deltaTime,
			this.position.z + this.velocity.z * deltaTime,
		);

	}

	_collisionDetection() {

		// プレイヤーのカプセルを現在の position から作る
		// start: 下半球の中心、end: 上半球の中心
		const segment = this.height - this.radius * 2;
		capsule.start.set( this.position.x, this.position.y + this.radius, this.position.z );
		capsule.end.set( this.position.x, this.position.y + this.radius + segment, this.position.z );
		capsule.radius = this.radius;

		// 交差していそうなフェイス (nearTriangles) のリストから、
		// 実際に交差している壁フェイスを抜き出して
		// this._contactInfo に追加する

		const triangles = this._nearTriangles;
		this._contactInfo.length = 0;

		for ( let i = 0, l = triangles.length; i < l; i ++ ) {

			const triangle = triangles[ i ];

			if ( ! triangle.boundingSphere ) triangle.computeBoundingSphere();
			if ( ! intersectsCapsuleSphere( capsule, triangle.boundingSphere! ) ) continue;

			const isIntersected = intersectsCapsuleTriangle(
				capsule,
				triangle,
				intersection,
			);

			if ( ! isIntersected ) continue;

			this._contactInfo.push( {
				point: intersection.point.clone(),
				normal: intersection.normal.clone(),
				depth: intersection.depth,
				triangle,
			} );

		}

	}

	_solvePosition() {

		// updatePosition() で position を動かした後
		// 壁と衝突し食い込んでいる場合、
		// ここで壁の外への押し出しをする

		if ( this._contactInfo.length === 0 ) {

			// 何とも衝突していない。position はそのまま、向きだけ更新して終了
			this._updateQuaternion();
			return;

		}

		// vs walls and sliding on the wall
		// 壁に食い込んでいる分だけ、法線方向に押し出す（デペネトレーション）。
		// これを毎ステップ行うことで、斜め・側面から高速で進入しても壁を貫通しない。
		translate.set( 0, 0, 0 );
		for ( let i = 0, l = this._contactInfo.length; i < l; i ++ ) {

			const contact = this._contactInfo[ i ];
			const normal = contact.triangle.normal;

			if ( this._slopeLimitCos < normal.y ) {

				// this triangle is a ground or slope, not a wall or ceil
				// フェイスは急勾配でない坂、つまり地面。
				// 接地の処理は updatePosition() 内で解決しているので無視する
				continue;

			}

			// フェイスは急勾配な坂か否か
			const isSlopeFace = ( this._slopeLimitCos <= normal.y && normal.y < 1 );

			// ジャンプ降下中に、急勾配な坂に衝突したらジャンプ終わり
			if ( this.isJumping && 0 >= this._currentJumpPower && isSlopeFace ) {

				this.isJumping = false;
				this.isGrounded = true;
				// console.log( 'jump end' );

			}

			// 壁・天井: 貫通量 (contact.depth) を「最近点 → 中心」の接触法線方向へ押し出す。
			// フェイス法線ではなく接触法線を使うことで、壁の辺・角に当たったときも
			// 正しく壁の外側へ押し出される（フェイス法線だと角で横方向に弾かれ貫通する）。
			// すでに translate で押し出した分を差し引き、二重押し出しを避ける。
			const pushNormal = contact.normal;
			const remaining = contact.depth - translate.dot( pushNormal );
			if ( 0 < remaining ) translate.addScaledVector( pushNormal, remaining );

		}

		this.position.add( translate );

		// 安全策: 接地しているなら、壁の押し出しによって地面より下へ沈み込ませない（床抜け防止）
		if ( this.isGrounded && this.position.y < this.groundHeight ) this.position.y = this.groundHeight;

		this._updateQuaternion();

	}

	// 向き（facingAngle）を quaternion へ反映する。position と合わせて利用側がメッシュに同期する。
	// 旧実装の object.rotation.y = facingAngle + π と等価。
	private _updateQuaternion() {

		this.quaternion.setFromAxisAngle( _yAxis, this._facingAngle + Math.PI );

	}

	jump() {

		if ( this.isLanding || this.isJumping || ! this.isGrounded || this.isOnSlope ) return;

		this._jumpElapsed = 0;
		this._currentJumpPower = 1;
		this.isJumping = true;

	}

	_updateJumping( deltaTime: number ) {

		if ( ! this.isJumping ) return;

		// 経過時間を deltaTime で積算する（実時計 performance.now に依存しない＝決定論的）。
		// コサイン弧の形は従来と同一で、60fps 実行時は旧実装と一致する。
		this._jumpElapsed += deltaTime;
		const progress = this._jumpElapsed / JUMP_DURATION_SEC;
		this._currentJumpPower = Math.cos( Math.min( progress, 1 ) * Math.PI );

	}

	private _updateLanding( deltaTime: number ) {

		if ( ! this.isLanding ) return;

		this._landingTimeRemaining = Math.max( 0, this._landingTimeRemaining - deltaTime );
		if ( 0 < this._landingTimeRemaining ) return;

		this.isLanding = false;
		this.isRunning = this._moveVelocity.lengthSq() > 1e-8;
		if ( this.isRunning ) this._facingAngle = Math.atan2( - this._moveVelocity.x, - this._moveVelocity.z );
		this.dispatchEvent( { type: 'endLanding' } );

	}

	teleport( position: Vector3 ) {

		this.position.copy( position );
		this.isLanding = false;
		this._landingTimeRemaining = 0;
		this._fallElapsed = 0;
		this.isRunning = this._moveVelocity.lengthSq() > 1e-8;

	}

	dispose(): void {

		this._nearTriangles.length = 0;
		this._contactInfo.length = 0;

	}

}

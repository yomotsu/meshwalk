import { Quaternion, Vector2, Vector3 } from 'three';
import { Body } from './Body';
import { type ComputedTriangle } from '../math/triangle';
import { type ClimbableBody } from './ClimbableBody';
export interface CharacterControllerOptions {
    radius: number;
    height: number;
    slopeLimit?: number;
    stepOffset?: number;
    groundCheckDepth?: number;
    landingLockDuration?: number;
    jumpDuration?: number;
}
export type CharacterControllerEventType = 'startIdling' | 'startWalking' | 'startJumping' | 'startSliding' | 'startFalling' | 'startLanding' | 'endLanding' | 'startClimbing' | 'endClimbing';
export declare class CharacterController extends Body<CharacterControllerEventType> {
    isCharacterController: boolean;
    radius: number;
    height: number;
    position: Vector3;
    quaternion: Quaternion;
    groundCheckDepth: number;
    slopeLimit: number;
    stepOffset: number;
    landingLockDuration: number;
    jumpDuration: number;
    carryRotation: boolean;
    isGrounded: boolean;
    isOnSlope: boolean;
    isIdling: boolean;
    isRunning: boolean;
    isJumping: boolean;
    isLanding: boolean;
    isClimbing: boolean;
    velocity: Vector3;
    groundHeight: number;
    groundNormal: Vector3;
    groundBody: Body | null;
    private _currentJumpPower;
    private _launchSpeed;
    private _launchCancelled;
    private _isStepping;
    private _lastMoveDelta;
    private _integrationVelocity;
    private _nearTriangles;
    private _contactInfo;
    private _contactCount;
    private _moveVelocity;
    private _climbInput;
    private _nearClimbables;
    private _activeClimbable;
    private _climbMountCooldown;
    private _isMantling;
    private _mantleRemaining;
    private _externalVelocity;
    private _facingAngle;
    private _jumpElapsed;
    private _landingTimeRemaining;
    private _fallElapsed;
    private _events;
    private get _slopeLimitCos();
    constructor({ radius, height, slopeLimit, stepOffset, groundCheckDepth, landingLockDuration, jumpDuration }: CharacterControllerOptions);
    setNearTriangles(nearTriangles: ComputedTriangle[]): void;
    setNearClimbables(nearClimbables: ClimbableBody[]): void;
    /**
     * 登り入力を指定する（梯子・壁面に貼り付いている間だけ効く）。
     * x = 横（面に平行、フリークライム用）、y = 上（前方入力を上下へ写す）。範囲は概ね [-1, 1]。
     * 停止させるにはゼロベクトルを渡す。登り中でないときは無視される。
     */
    climb(input: Vector2): void;
    /**
     * 望む水平移動速度をワールド座標で指定する（Unity CharacterController.Move / Godot velocity 相当）。
     * y 成分は無視する（上下は重力・ジャンプ・接地が扱う）。次に move() を呼ぶまで保持される。
     * 停止させるにはゼロベクトルを渡す。
     */
    move(velocity: Vector3): void;
    /**
     * 動く床から離れる瞬間に、その床の水平速度を慣性として引き継ぐ（着地するまで保持）。
     * Godot の platform_on_leave（ADD_VELOCITY）/ Unreal の impart base velocity 相当。
     * y 成分は無視する（ジャンプ弧と干渉させない）。World が離脱を検出して呼ぶ。
     */
    inheritVelocity(velocity: Vector3): void;
    /**
     * 向き（facing）を deltaAngle[rad] だけ回す。回転床の運搬で World が呼ぶ（carryRotation 時）。
     * 移動入力があるフレームは move() が向きを上書きするので、実質は静止時に効く。
     */
    rotateFacing(deltaAngle: number): void;
    update(deltaTime: number): void;
    _updateVelocity(): void;
    _checkGround(deltaTime: number): void;
    _stepLookAhead(deltaTime: number): void;
    _updatePosition(deltaTime: number): void;
    _collisionDetection(): void;
    _solvePosition(): void;
    private _updateQuaternion;
    private _tryStartClimb;
    private _overlapsClimbBody;
    private _isAtopClimbable;
    private _startClimb;
    private _updateClimb;
    private _approachHorizontally;
    private _updateMantle;
    private _endClimb;
    jump(): void;
    /**
     * 接地・斜面に関わらず宙へ出す。上下の速度は verticalSpeed（m/s、上が正）で、
     * ジャンプのコサイン弧の代わりに使う。宙にいる間は setLaunchSpeed() で毎フレーム差し替える。
     * 水平は move() のまま。着地・滑り・天井はジャンプと同じ道筋で解ける。
     */
    launch(verticalSpeed: number): void;
    /** launch 中の上下の速度（m/s、上が正）を差し替える。launch 中でなければ何もしない。 */
    setLaunchSpeed(verticalSpeed: number): void;
    /** launch をやめて普通の落下に戻す。次の接地では startLanding を出すが、硬直させない。 */
    cancelLaunch(): void;
    /** launch() で宙に出ている間 true。 */
    get isLaunched(): boolean;
    _updateJumping(deltaTime: number): void;
    private _updateLanding;
    teleport(position: Vector3): void;
    dispose(): void;
}

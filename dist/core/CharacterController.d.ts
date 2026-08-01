import { Quaternion, Vector3 } from 'three';
import { Body } from './Body';
import { type ComputedTriangle } from '../math/triangle';
export interface CharacterControllerOptions {
    radius: number;
    height: number;
    slopeLimit?: number;
    stepOffset?: number;
    groundCheckDepth?: number;
    landingLockDuration?: number;
}
export type CharacterControllerEventType = 'startIdling' | 'startWalking' | 'startJumping' | 'startSliding' | 'startFalling' | 'startLanding' | 'endLanding';
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
    carryRotation: boolean;
    isGrounded: boolean;
    isOnSlope: boolean;
    isIdling: boolean;
    isRunning: boolean;
    isJumping: boolean;
    isLanding: boolean;
    velocity: Vector3;
    groundHeight: number;
    groundNormal: Vector3;
    groundBody: Body | null;
    private _currentJumpPower;
    private _isStepping;
    private _nearTriangles;
    private _contactInfo;
    private _moveVelocity;
    private _externalVelocity;
    private _facingAngle;
    private _jumpElapsed;
    private _landingTimeRemaining;
    private _fallElapsed;
    private _events;
    private get _slopeLimitCos();
    constructor({ radius, height, slopeLimit, stepOffset, groundCheckDepth, landingLockDuration }: CharacterControllerOptions);
    setNearTriangles(nearTriangles: ComputedTriangle[]): void;
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
    _checkGround(): void;
    _stepLookAhead(): void;
    _updatePosition(deltaTime: number): void;
    _collisionDetection(): void;
    _solvePosition(): void;
    private _updateQuaternion;
    jump(): void;
    _updateJumping(deltaTime: number): void;
    private _updateLanding;
    teleport(position: Vector3): void;
    dispose(): void;
}

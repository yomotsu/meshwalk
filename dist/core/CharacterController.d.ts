import { Quaternion, Vector3 } from 'three';
import { Body } from './Body';
import { type ComputedTriangle } from '../math/triangle';
export interface CharacterControllerOptions {
    radius: number;
    height: number;
    slopeLimit?: number;
    stepOffset?: number;
    groundCheckDepth?: number;
}
export type CharacterControllerEventType = 'startIdling' | 'startWalking' | 'startJumping' | 'startSliding' | 'startFalling';
export declare class CharacterController extends Body<CharacterControllerEventType> {
    isCharacterController: boolean;
    radius: number;
    height: number;
    position: Vector3;
    quaternion: Quaternion;
    groundCheckDepth: number;
    slopeLimit: number;
    stepOffset: number;
    isGrounded: boolean;
    isOnSlope: boolean;
    isIdling: boolean;
    isRunning: boolean;
    isJumping: boolean;
    velocity: Vector3;
    groundHeight: number;
    groundNormal: Vector3;
    private _currentJumpPower;
    private _isStepping;
    private _nearTriangles;
    private _contactInfo;
    private _moveVelocity;
    private _facingAngle;
    private _jumpElapsed;
    private _events;
    private get _slopeLimitCos();
    constructor({ radius, height, slopeLimit, stepOffset, groundCheckDepth }: CharacterControllerOptions);
    setNearTriangles(nearTriangles: ComputedTriangle[]): void;
    /**
     * 望む水平移動速度をワールド座標で指定する（Unity CharacterController.Move / Godot velocity 相当）。
     * y 成分は無視する（上下は重力・ジャンプ・接地が扱う）。次に move() を呼ぶまで保持される。
     * 停止させるにはゼロベクトルを渡す。
     */
    move(velocity: Vector3): void;
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
    teleport(position: Vector3): void;
    dispose(): void;
}

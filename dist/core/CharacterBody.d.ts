import { Vector3 } from 'three';
import { type Object3D } from 'three';
import { Body } from './Body';
import { type ComputedTriangle } from '../math/triangle';
export declare class CharacterBody extends Body {
    isCharacterBody: boolean;
    object: Object3D;
    radius: number;
    height: number;
    position: Vector3;
    groundCheckDepth: number;
    slopeLimit: number;
    isGrounded: boolean;
    isOnSlope: boolean;
    isIdling: boolean;
    isRunning: boolean;
    isJumping: boolean;
    velocity: Vector3;
    currentJumpPower: number;
    groundHeight: number;
    groundNormal: Vector3;
    nearTriangles: ComputedTriangle[];
    contactInfo: {
        depth: number;
        point: Vector3;
        normal: Vector3;
        triangle: ComputedTriangle;
    }[];
    private _moveVelocity;
    private _facingAngle;
    private _jumpElapsed;
    private _events;
    private get _slopeLimitCos();
    constructor(object3d: Object3D, radius: number, height: number);
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
    _updatePosition(deltaTime: number): void;
    _collisionDetection(): void;
    _solvePosition(): void;
    jump(): void;
    _updateJumping(deltaTime: number): void;
    teleport(x: number, y: number, z: number): void;
}

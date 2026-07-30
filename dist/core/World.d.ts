import { Body } from './Body';
import { StaticBody } from './StaticBody';
import { type GravityField } from './CharacterBody';
export declare class World {
    gravity: GravityField;
    private _staticBodies;
    private _characterBodies;
    private _fps;
    private _stepsPerFrame;
    constructor({ fps, stepsPerFrame, gravity }?: {
        fps?: number;
        stepsPerFrame?: number;
        gravity?: GravityField;
    });
    /**
     * 静的ボディ一覧（読み取り専用）。カメラのレイ衝突など内部処理から参照する。
     */
    get colliders(): readonly StaticBody[];
    add(body: Body): void;
    remove(body: Body): void;
    fixedUpdate(): void;
    step(stepDeltaTime: number): void;
    dispose(): void;
}

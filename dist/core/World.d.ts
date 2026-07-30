import { Body } from './Body';
import { StaticBody } from './StaticBody';
export declare class World {
    private _staticBodies;
    private _characterControllers;
    private _fps;
    private _stepsPerFrame;
    constructor({ fps, stepsPerFrame }?: {
        fps?: number | undefined;
        stepsPerFrame?: number | undefined;
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

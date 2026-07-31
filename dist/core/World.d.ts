import { Body } from './Body';
import { StaticBody } from './StaticBody';
import { KinematicBody } from './KinematicBody';
export declare class World {
    private _staticBodies;
    private _kinematicBodies;
    private _characterControllers;
    private _colliders;
    private _fps;
    private _stepsPerFrame;
    private _accumulatedTime;
    constructor({ fps, stepsPerFrame }?: {
        fps?: number | undefined;
        stepsPerFrame?: number | undefined;
    });
    /**
     * 静的ボディ一覧（読み取り専用）。カメラのレイ衝突など内部処理から参照する。
     */
    get colliders(): readonly (StaticBody | KinematicBody)[];
    add(body: Body): void;
    remove(body: Body): void;
    /**
     * 可変フレーム時間 deltaTime（秒）を受け取り、内部の固定ステップ（1/fps）へ
     * 分解して実行する。物理はフレームレートに依存せず一定速度で進む。
     * 毎フレーム `clock.getDelta()` などの実 delta を渡す。
     * 決定論的にちょうど1フレーム進めたい場合（テスト等）は `fixedUpdate()` を直接使う。
     */
    update(deltaTime: number): void;
    fixedUpdate(): void;
    step(stepDeltaTime: number): void;
    dispose(): void;
}

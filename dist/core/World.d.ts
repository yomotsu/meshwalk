import { Octree } from './Octree';
import { CharacterController } from './CharacterController';
export declare class World {
    colliderPool: Octree[];
    characterPool: CharacterController[];
    private _fps;
    private _stepsPerFrame;
    constructor({ fps, stepsPerFrame }?: {
        fps?: number | undefined;
        stepsPerFrame?: number | undefined;
    });
    add(object: Octree | CharacterController): void;
    remove(object: Octree | CharacterController): void;
    fixedUpdate(): void;
    step(stepDeltaTime: number): void;
}

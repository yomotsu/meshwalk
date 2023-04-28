import { Mesh, AnimationMixer } from 'three';
import type { AnimationClip, AnimationAction } from 'three';
export type Motion = {
    [name: string]: AnimationAction;
};
export declare class AnimationController {
    mesh: Mesh;
    motion: Motion;
    mixer: AnimationMixer;
    currentMotionName: string;
    _targetRotY: number | null;
    constructor(mesh: Mesh, animations: AnimationClip[]);
    play(name: string): void;
    turn(rad: number, immediate: boolean): void;
    update(deltaTime: number): void;
}

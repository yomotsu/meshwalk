import { Vector3, Triangle, Sphere } from 'three';
import type { Body } from '../core/Body';
export declare class ComputedTriangle extends Triangle {
    boundingSphere: Sphere | undefined;
    normal: Vector3;
    body: Body | null;
    _queryId: number;
    constructor(a: Vector3, b: Vector3, c: Vector3);
    computeBoundingSphere(): void;
    extend(amount: number): void;
}

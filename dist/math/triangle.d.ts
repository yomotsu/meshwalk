import { Vector3, Triangle, Sphere } from 'three';
export declare class ComputedTriangle extends Triangle {
    boundingSphere: Sphere | undefined;
    normal: Vector3;
    constructor(a: Vector3, b: Vector3, c: Vector3);
    computeBoundingSphere(): void;
    extend(amount: number): void;
}

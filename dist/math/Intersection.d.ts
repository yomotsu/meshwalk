import { Vector3 } from 'three';
export declare class Intersection {
    point: Vector3;
    normal: Vector3;
    depth: number;
    set(point: Vector3, normal: Vector3, depth: number): void;
}

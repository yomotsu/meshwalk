import { Box3, Line3, Sphere, Vector3, type Ray, type Object3D } from 'three';
import { ComputedTriangle } from '../math/triangle';
export declare class Octree {
    box: Box3;
    bounds: Box3;
    triangles: ComputedTriangle[];
    subTrees: Octree[];
    constructor(box?: Box3);
    addTriangle(triangle: ComputedTriangle): void;
    calcBox(): this;
    split(level: number): void;
    build(): this;
    getLineTriangles(line: Line3, result: ComputedTriangle[]): ComputedTriangle[];
    getRayTriangles(ray: Ray, result: ComputedTriangle[]): ComputedTriangle[];
    getSphereTriangles(sphere: Sphere, result: ComputedTriangle[]): ComputedTriangle[];
    getCapsuleTriangles(capsule: Sphere, result: ComputedTriangle[]): void;
    lineIntersect(line: Line3): false | {
        distance: number;
        triangle: ComputedTriangle;
        position: Vector3;
    };
    rayIntersect(ray: Ray): false | {
        distance: number;
        triangle: ComputedTriangle | undefined;
        position: Vector3 | undefined;
    } | undefined;
    addGraphNode(object: Object3D): void;
}

import { Vector3, Line3, Plane, Sphere } from 'three';
import type { Box3 } from 'three';
import type { Capsule } from 'three/examples/jsm/math/Capsule.js';
import type { ComputedTriangle } from './triangle';
export declare class Intersection {
    point: Vector3;
    normal: Vector3;
    depth: number;
    set(point: Vector3, normal: Vector3, depth: number): void;
}
export declare function isIntersectionCapsuleSphere(capsule: Capsule, sphere: Sphere): boolean;
export declare function isIntersectionLineBox(line: Line3, box: Box3, hit?: Vector3): boolean;
export declare function isIntersectionBoxPlane(box: Box3, plane: Plane): boolean;
export declare function isIntersectionTriangleBox(a: Vector3, b: Vector3, c: Vector3, box: Box3): boolean;
export declare function isIntersectionSphereSphere(sphere1: Sphere, sphere2: Sphere): boolean;
export declare function isIntersectionSphereBox(sphere: Sphere, box: Box3): boolean;
export declare function isIntersectionSphereTriangle(sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3, out: Intersection): boolean;
export declare function testLineTriangle(p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3): boolean;
export declare function testTriangleCapsule(capsule: Capsule, triangle: ComputedTriangle, out: Intersection): boolean;

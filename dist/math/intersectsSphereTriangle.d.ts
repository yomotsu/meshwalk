import { Vector3, Sphere } from 'three';
import { Intersection } from './Intersection';
export declare function intersectsSphereTriangle(sphere: Sphere, a: Vector3, b: Vector3, c: Vector3, normal: Vector3, out: Intersection): boolean;

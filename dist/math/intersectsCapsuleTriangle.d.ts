import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
import { type ComputedTriangle } from './triangle';
import { Intersection } from './Intersection';
export declare function intersectsCapsuleTriangle(capsule: Capsule, triangle: ComputedTriangle, out: Intersection): boolean;

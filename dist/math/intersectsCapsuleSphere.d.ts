import { Sphere } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
export { Intersection } from './Intersection';
export { intersectsLineBox } from './intersectsLineBox';
export { intersectsSphereTriangle } from './intersectsSphereTriangle';
export declare function intersectsCapsuleSphere(capsule: Capsule, sphere: Sphere): boolean;

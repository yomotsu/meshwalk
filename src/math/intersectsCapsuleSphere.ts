import { Vector3, Line3, Sphere } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
export { Intersection } from './Intersection';
export { intersectsLineBox } from './intersectsLineBox';
export { intersectsSphereTriangle } from './intersectsSphereTriangle';

const vec3 = new Vector3();
const line = new Line3();

// https://arrowinmyknee.com/2021/03/15/some-math-about-capsule-collision/
export function intersectsCapsuleSphere( capsule: Capsule, sphere: Sphere ) {

	line.start.copy( capsule.start );
	line.end.copy( capsule.end );
	line.closestPointToPoint( sphere.center, true, vec3 );
	const r = capsule.radius + sphere.radius;
	return vec3.distanceToSquared( sphere.center ) <= r * r;

}

import { Sphere } from 'three';
import { type Capsule } from 'three/examples/jsm/math/Capsule.js';
export { Intersection } from './Intersection';
export { intersectsLineBox } from './intersectsLineBox';
export { intersectsSphereTriangle } from './intersectsSphereTriangle';

// https://arrowinmyknee.com/2021/03/15/some-math-about-capsule-collision/
// 中心線上で sphere の中心に最も近い点との距離が半径の和以下なら交差。
// 近傍三角形すべてに対して毎ステップ呼ばれるプレフィルタなので、Vector3 / Line3 を
// 経由せずスカラーで書く（Line3.closestPointToPoint 版は 1 呼び出しあたり
// copy 2 + subVectors 2 + dot 2 + clamp + add + multiplyScalar が走っていた）。
export function intersectsCapsuleSphere( capsule: Capsule, sphere: Sphere ) {

	const startX = capsule.start.x;
	const startY = capsule.start.y;
	const startZ = capsule.start.z;

	const segmentX = capsule.end.x - startX;
	const segmentY = capsule.end.y - startY;
	const segmentZ = capsule.end.z - startZ;

	const toCenterX = sphere.center.x - startX;
	const toCenterY = sphere.center.y - startY;
	const toCenterZ = sphere.center.z - startZ;

	const lengthSquared = segmentX * segmentX + segmentY * segmentY + segmentZ * segmentZ;
	let t = 0;

	if ( lengthSquared > 0 ) {

		t = ( toCenterX * segmentX + toCenterY * segmentY + toCenterZ * segmentZ ) / lengthSquared;
		t = t < 0 ? 0 : t > 1 ? 1 : t;

	}

	const offsetX = toCenterX - segmentX * t;
	const offsetY = toCenterY - segmentY * t;
	const offsetZ = toCenterZ - segmentZ * t;

	const radiusSum = capsule.radius + sphere.radius;
	return offsetX * offsetX + offsetY * offsetY + offsetZ * offsetZ <= radiusSum * radiusSum;

}

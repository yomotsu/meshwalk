import { Vector3, Line3, type Box3 } from 'three';

const vec3 = new Vector3();

// https://3dkingdoms.com/weekly/weekly.php?a=3
export function intersectsLineBox( line: Line3, box: Box3, hit?: Vector3 ) {

	if ( line.end.x < box.min.x && line.start.x < box.min.x ) return false;
	if ( line.end.x > box.max.x && line.start.x > box.max.x ) return false;
	if ( line.end.y < box.min.y && line.start.y < box.min.y ) return false;
	if ( line.end.y > box.max.y && line.start.y > box.max.y ) return false;
	if ( line.end.z < box.min.z && line.start.z < box.min.z ) return false;
	if ( line.end.z > box.max.z && line.start.z > box.max.z ) return false;
	if (
		line.start.x > box.min.x && line.start.x < box.max.x &&
		line.start.y > box.min.y && line.start.y < box.max.y &&
		line.start.z > box.min.z && line.start.z < box.max.z
	) {

		hit && hit.copy( line.start );
		return true;

	}

	const _hit = vec3;

	if (
		( getIntersection( line.start.x - box.min.x, line.end.x - box.min.x, line.start, line.end, _hit ) && inBox( _hit, box, 1 ) ) ||
		( getIntersection( line.start.y - box.min.y, line.end.y - box.min.y, line.start, line.end, _hit ) && inBox( _hit, box, 2 ) ) ||
		( getIntersection( line.start.z - box.min.z, line.end.z - box.min.z, line.start, line.end, _hit ) && inBox( _hit, box, 3 ) ) ||
		( getIntersection( line.start.x - box.max.x, line.end.x - box.max.x, line.start, line.end, _hit ) && inBox( _hit, box, 1 ) ) ||
		( getIntersection( line.start.y - box.max.y, line.end.y - box.max.y, line.start, line.end, _hit ) && inBox( _hit, box, 2 ) ) ||
		( getIntersection( line.start.z - box.max.z, line.end.z - box.max.z, line.start, line.end, _hit ) && inBox( _hit, box, 3 ) )
	) {

		hit && hit.copy( _hit );
		return true;

	}

	return false;

}

function getIntersection( dst1: number, dst2: number, p1: Vector3, p2: Vector3, hit?: Vector3 ) {

	if ( ( dst1 * dst2 ) >= 0 ) return false;
	if ( dst1 == dst2 ) return false;

	if ( hit ) {

		vec3.subVectors( p2, p1 );
		vec3.multiplyScalar( - dst1 / ( dst2 - dst1 ) );
		hit.addVectors( p1, vec3 );

	}

	return true;

}

function inBox( hit: Vector3, box: Box3, axis: number ) {

	if ( axis === 1 && hit.z > box.min.z && hit.z < box.max.z && hit.y > box.min.y && hit.y < box.max.y ) return true;
	if ( axis === 2 && hit.z > box.min.z && hit.z < box.max.z && hit.x > box.min.x && hit.x < box.max.x ) return true;
	if ( axis === 3 && hit.x > box.min.x && hit.x < box.max.x && hit.y > box.min.y && hit.y < box.max.y ) return true;
	return false;

}

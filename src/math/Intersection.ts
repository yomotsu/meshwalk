import { Vector3 } from 'three';

export class Intersection {

	point = new Vector3();
	normal	= new Vector3();
	depth = 0;

	set( point: Vector3, normal: Vector3, depth: number ) {

		this.point.copy( point );
		this.normal.copy( normal );
		this.depth = depth;

	}

}

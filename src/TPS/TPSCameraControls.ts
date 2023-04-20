import {
	MathUtils,
	Vector2,
	Vector3,
	Vector4,
	Quaternion,
	Matrix4,
	Sphere,
	Box3,
	Spherical,
	Raycaster,

	Ray,
	Object3D,
} from 'three';
import CameraControls from 'camera-controls';
import { World } from 'core/World';

const subsetOfTHREE = {
	Vector2   : Vector2,
	Vector3   : Vector3,
	Vector4   : Vector4,
	Quaternion: Quaternion,
	Matrix4   : Matrix4,
	Spherical : Spherical,
	Box3      : Box3,
	Sphere    : Sphere,
	Raycaster : Raycaster,
};

CameraControls.install( { THREE: subsetOfTHREE } );

const _ORIGIN = new Vector3( 0, 0, 0 );
const _v3A = new Vector3();
const _v3B = new Vector3();
const _v3C = new Vector3();
const _ray = new Ray();
const _rotationMatrix = new Matrix4();

export class TPSCameraControls extends CameraControls {

	world: World;

	constructor( camera: THREE.PerspectiveCamera, trackObject: THREE.Object3D, world: World, domElement: HTMLElement ) {

		super( camera, domElement );
		this.minDistance = 1;
		this.maxDistance = 30;
		this.azimuthRotateSpeed = 0.3; // negative value to invert rotation direction
		this.polarRotateSpeed   = - 0.2; // negative value to invert rotation direction
		this.minPolarAngle = 30 * MathUtils.DEG2RAD;
		this.maxPolarAngle = 120 * MathUtils.DEG2RAD;
		this.draggingSmoothTime = 1e-10;

		this.mouseButtons.right = CameraControls.ACTION.NONE;
		this.mouseButtons.middle = CameraControls.ACTION.NONE;
		this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
		this.touches.three = CameraControls.ACTION.TOUCH_DOLLY;

		this.world = world;
		this.colliderMeshes = [ new Object3D() ];

		// this._trackObject = trackObject;
		// this.offset = new Vector3( 0, 1, 0 );
		const offset = new Vector3( 0, 2, 0 );

		this.update = ( delta ) => {

			const x = trackObject.position.x + offset.x;
			const y = trackObject.position.y + offset.y;
			const z = trackObject.position.z + offset.z;
			this.moveTo( x, y, z, false );
			return super.update( delta );

		};

	}

	get frontAngle() {

		return this.azimuthAngle;

	}

	_collisionTest() {

		let distance = Infinity;

		if ( ! this.world ) return distance;

		for ( let i = 0, l = this.world.colliderPool.length; i < l; i ++ ) {

			const octree = this.world.colliderPool[ i ];
			const direction = _v3A.setFromSpherical( this._spherical ).divideScalar( this._spherical.radius );
			_rotationMatrix.lookAt( _ORIGIN, direction, this._camera.up );

			for ( let i = 0; i < 4; i ++ ) {

				const nearPlaneCorner = _v3B.copy( this._nearPlaneCorners[ i ] );
				nearPlaneCorner.applyMatrix4( _rotationMatrix );

				const origin = _v3C.addVectors( this._target, nearPlaneCorner );
				_ray.set( origin, direction );

				const intersect = octree.rayIntersect( _ray );

				if ( intersect && intersect.distance < distance ) {

					distance = intersect.distance;

				}

			}

		}

		return distance;

	}

}

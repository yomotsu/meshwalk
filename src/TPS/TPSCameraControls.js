import { THREE, onInstallHandlers } from '../install.js';
import CameraControls from 'camera-controls';

onInstallHandlers.push( () => {

	CameraControls.install( { THREE } );

} );

export class TPSCameraControls extends CameraControls {

	constructor( camera, trackObject, domElement ) {

		super( camera, domElement );
		this.minDistance = 1;
		this.maxDistance = 30;
		this.azimuthRotateSpeed = 0.3; // negative value to invert rotation direction
		this.polarRotateSpeed   = - 0.2; // negative value to invert rotation direction
		this.minPolarAngle = 30 * THREE.MathUtils.DEG2RAD;
		this.maxPolarAngle = 120 * THREE.MathUtils.DEG2RAD;
		this.draggingSmoothTime = 1e-10;

		this.mouseButtons.right = CameraControls.ACTION.NONE;
		this.mouseButtons.middle = CameraControls.ACTION.NONE;
		this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
		this.touches.three = CameraControls.ACTION.TOUCH_DOLLY;

		// this._trackObject = trackObject;
		// this.offset = new THREE.Vector3( 0, 1, 0 );
		const offset = new THREE.Vector3( 0, 1, 0 );

		this.update = ( delta ) => {

			const x = trackObject.position.x + offset.x;
			const y = trackObject.position.y + offset.y;
			const z = trackObject.position.z + offset.z;
			this.moveTo( x, y, z, false );
			super.update( delta );

		};

	}

	get frontAngle() {

		return this.azimuthAngle;

	}

}

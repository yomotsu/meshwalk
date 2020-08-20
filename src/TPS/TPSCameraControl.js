import { THREE, onInstallHandlers } from '../install.js';
import EventDispatcher from '../core/EventDispatcher.js';

const PI_2     = Math.PI * 2;
const PI_HALF = Math.PI / 2;

let rotationMatrix;
let rotationX;
let rotationY;

onInstallHandlers.push( () => {

	rotationMatrix = new THREE.Matrix4();
	rotationX      = new THREE.Matrix4();
	rotationY      = new THREE.Matrix4();

} );

// camera              instance of THREE.Camera
// trackObject         instance of THREE.Object3D
// params.el           DOM element
// params.radius       number
// params.minRadius    number
// params.maxRadius    number
// params.rigidObjects array of instances of THREE.Mesh
export class TPSCameraControl extends EventDispatcher {

	constructor( camera, trackObject, params = {} ) {

		super();

		this.camera = camera;
		this.trackObject  = trackObject;
		this.el           = params.el || document.body;
		this.offset       = params.offset || new THREE.Vector3( 0, 0, 0 ),
		this.radius       = params.radius    || 10;
		this.minRadius    = params.minRadius || 1;
		this.maxRadius    = params.maxRadius || 30;
		this.rigidObjects = params.rigidObjects || [];
		this.lat   = 0;
		this.lon   = 0;
		this.phi   = 0; // angle of zenith
		this.theta = 0; // angle of azimuth
		this.mouseAccelerationX = params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
		this.mouseAccelerationY = params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
		this._pointerStart = { x: 0, y: 0 };
		this._pointerLast  = { x: 0, y: 0 };

		this.setNearPlainCornersWithPadding();
		this.update();

		this._onMouseDown = onMouseDown.bind( this );
		this._onMouseUp   = onMouseUp.bind( this );
		this._onMouseDrag = onMouseDrag.bind( this );
		this._onScroll    = onScroll.bind( this );

		this.el.addEventListener( 'mousedown', this._onMouseDown );
		this.el.addEventListener( 'mouseup',   this._onMouseUp );
		this.el.addEventListener( 'mousewheel',     this._onScroll );
		this.el.addEventListener( 'DOMMouseScroll', this._onScroll );

	}

	update() {

		this._center = new THREE.Vector3(
			this.trackObject.matrixWorld.elements[ 12 ] + this.offset.x,
			this.trackObject.matrixWorld.elements[ 13 ] + this.offset.y,
			this.trackObject.matrixWorld.elements[ 14 ] + this.offset.z
		);

		const position = new THREE.Vector3(
			Math.cos( this.phi ) * Math.cos( this.theta + PI_HALF ),
			Math.sin( this.phi ),
			Math.cos( this.phi ) * Math.sin( this.theta + PI_HALF )
		);
		const distance = this.collisionTest( position.clone().normalize() );
		position.multiplyScalar( distance );
		position.add( this._center );
		this.camera.position.copy( position );

		if ( this.lat === 90 ) {

			this.camera.up.set(
				Math.cos( this.theta + Math.PI ),
				0,
				Math.sin( this.theta + Math.PI )
			);

		} else if ( this.lat === - 90 ) {

			this.camera.up.set(
				Math.cos( this.theta ),
				0,
				Math.sin( this.theta )
			);

		} else {

			this.camera.up.set( 0, 1, 0 );

		}

		this.camera.lookAt( this._center );
		this.dispatchEvent( { type: 'updated' } );

	}

	getFrontAngle() {

		return PI_2 + this.theta;

	}

	setNearPlainCornersWithPadding() {

		const near = this.camera.near;
		const halfFov = this.camera.fov * 0.5;
		const h = ( Math.tan( halfFov * THREE.Math.DEG2RAD ) * near );
		const w = h * this.camera.aspect;

		this.nearPlainCornersWithPadding = [
			new THREE.Vector3( - w - near, - h - near, 0 ),
			new THREE.Vector3(   w + near, - h - near, 0 ),
			new THREE.Vector3(   w + near,   h + near, 0 ),
			new THREE.Vector3( - w - near,   h + near, 0 )
		];

	}

	setLatLon( lat, lon ) {

		this.lat = lat > 90 ? 90 : lat < - 90 ? - 90 : lat;
		this.lon = lon < 0 ? 360 + lon % 360 : lon % 360;

		this.phi   =   this.lat * THREE.Math.DEG2RAD;
		this.theta = - this.lon * THREE.Math.DEG2RAD;

	}

	collisionTest( direction ) {

		let distance = this.radius;

		rotationX.makeRotationX( this.phi );
		rotationY.makeRotationY( this.theta );
		rotationMatrix.multiplyMatrices( rotationX, rotationY );

		for ( let i = 0; i < 4; i ++ ) {

			const nearPlainCorner = this.nearPlainCornersWithPadding[ i ].clone();
			nearPlainCorner.applyMatrix4( rotationMatrix );

			const origin = new THREE.Vector3(
				this._center.x + nearPlainCorner.x,
				this._center.y + nearPlainCorner.y,
				this._center.z + nearPlainCorner.z
			);
			const raycaster = new THREE.Raycaster(
				origin,           // origin
				direction,        // direction
				this.camera.near, // near
				this.radius       // far
			);
			const intersects = raycaster.intersectObjects( this.rigidObjects );

			if ( intersects.length !== 0 && intersects[ 0 ].distance < distance ) {

				distance = intersects[ 0 ].distance;

			}

		}

		return distance;

	}

}

function onMouseDown( event ) {

	this.dispatchEvent( { type: 'mousedown' } );
	this._pointerStart.x = event.clientX;
	this._pointerStart.y = event.clientY;
	this._pointerLast.x = this.lon;
	this._pointerLast.y = this.lat;
	this.el.removeEventListener( 'mousemove', this._onMouseDrag, false );
	this.el.addEventListener( 'mousemove', this._onMouseDrag, false );
	document.body.classList.add( 'js-TPSCameraDragging' );

}

function onMouseUp() {

	this.dispatchEvent( { type: 'mouseup' } );
	this.el.removeEventListener( 'mousemove', this._onMouseDrag, false );
	document.body.classList.remove( 'js-TPSCameraDragging' );

}

function onMouseDrag( event ) {

	const w = this.el.offsetWidth;
	const h = this.el.offsetHeight;
	const x = ( this._pointerStart.x - event.clientX ) / w * 2;
	const y = ( this._pointerStart.y - event.clientY ) / h * 2;

	this.setLatLon(
		this._pointerLast.y + y * this.mouseAccelerationY,
		this._pointerLast.x + x * this.mouseAccelerationX
	);

}

function onScroll( event ) {

	event.preventDefault();

	if ( event.wheelDeltaY ) {

		// WebKit
		this.radius -= event.wheelDeltaY * 0.05 / 5;

	} else if ( event.wheelDelta ) {

		// IE
		this.radius -= event.wheelDelta * 0.05 / 5;

	} else if ( event.detail ) {

		// Firefox
		this.radius += event.detail / 5;

	}

	this.radius = Math.max( this.radius, this.minRadius );
	this.radius = Math.min( this.radius, this.maxRadius );

}

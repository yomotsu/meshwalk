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
	Object3D,
	PerspectiveCamera,
} from 'three';
import CameraControls from 'camera-controls';
import { World } from 'core/World';
import { CharacterController } from 'core/CharacterController';
import { KinematicBody } from 'core/KinematicBody';

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

const _v3A = new Vector3();

export class ThirdPersonCameraControls extends CameraControls {

	world: World;
	character: CharacterController | null;
	// true のとき、追従キャラが回転床に乗っている間はカメラの正面角度（方位角）も
	// 床の yaw に合わせて回す（肩越し視点が床に対して一定に保たれる）。既定 on。
	// character を渡していない場合は無効（no-op）。
	syncFrontAngleToPlatform = true;

	// カメラを壁から離しておく距離。Unreal の SpringArm.ProbeSize / Unity Cinemachine の
	// Deoccluder.CameraRadius に相当する。判定はこの半径の球を追従点からカメラ方向へ
	// 掃いて行う。
	//
	// 近クリップ面がこの球からはみ出すとカメラの中に壁が映り込むので、下限は
	//   collisionRadius >= camera.near * tan( fov / 2 ) * sqrt( 1 + aspect^2 )
	// （near 0.1 / fov 40 / 16:9 なら 0.074）。near や fov を大きくするときは合わせて上げること。
	collisionRadius = 0.1;

	constructor( camera: PerspectiveCamera, trackObject: Object3D, world: World, domElement: HTMLElement, character: CharacterController | null = null ) {

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
		this.character = character;
		this.colliderMeshes = [ new Object3D() ];

		// this._trackObject = trackObject;
		// this.offset = new Vector3( 0, 1, 0 );
		const offset = new Vector3( 0, 2, 0 );

		this.update = ( delta ) => {

			// 回転床に乗っている間、床の yaw ぶんだけ方位角を回してキャラへの相対視点を保つ
			const character = this.character;

			if (
				this.syncFrontAngleToPlatform &&
				character &&
				character.isGrounded &&
				character.groundBody instanceof KinematicBody
			) {

				this.rotate( character.groundBody.angularVelocity.y * delta, 0, false );

			}

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

		// 追従点からカメラ方向へ、collisionRadius の球を掃く（Unreal の SpringArm と同じ形）。
		// 近クリップ面の4隅から平行なレイを4本飛ばす方式は、隅の間を細い柱がすり抜ける。
		const direction = _v3A.setFromSpherical( this._spherical ).divideScalar( this._spherical.radius );
		const maxDistance = this._spherical.radius;
		const radius = this.collisionRadius;

		for ( let i = 0, l = this.world.colliders.length; i < l; i ++ ) {

			const hit = this.world.colliders[ i ].sphereCast( this._target, direction, maxDistance, radius );

			if ( hit && hit.distance < distance ) {

				distance = hit.distance;

			}

		}

		return distance;

	}

}

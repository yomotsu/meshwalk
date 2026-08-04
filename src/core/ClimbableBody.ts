import { Box3, Vector3 } from 'three';
import { Body } from './Body';

export type ClimbableMode = 'ladder' | 'free';

export interface ClimbableBodyOptions {

	mode: ClimbableMode;
	box: Box3;                 // 登れる領域（ワールド座標の AABB）
	faceDirection?: Vector3;   // ladder: 領域が正面を向く水平方向（プレイヤー側 = 外向き）。既定 (0,0,1)
	speed?: number;            // 登り速度 m/s。既定 3

}

const _center = new Vector3();

/**
 * 登れる領域（梯子・壁面）を表すボディ。`world.add()` で登録する。
 * 衝突コライダーではなく「ここでは登れる」という判定ゾーン。
 *
 * ```js
 * const ladder = new MW.ClimbableBody( {
 * 	mode: 'ladder',
 * 	box: new THREE.Box3( new THREE.Vector3( -0.5, 0, 4.5 ), new THREE.Vector3( 0.5, 6, 5 ) ),
 * 	faceDirection: new THREE.Vector3( 0, 0, 1 ),
 * } );
 * world.add( ladder );
 * ```
 */
export class ClimbableBody extends Body {

	isClimbableBody = true;
	mode: ClimbableMode;
	box: Box3;
	speed: number;
	faceDirection = new Vector3( 0, 0, 1 );    // 外向き（プレイヤー側）水平法線
	intoDirection = new Vector3( 0, 0, - 1 );  // 面へ向かう方向（faceDirection の逆）

	constructor( { mode, box, faceDirection, speed }: ClimbableBodyOptions ) {

		super();

		this.mode = mode;
		this.box = box;
		this.speed = speed !== undefined ? speed : 3;

		if ( faceDirection ) {

			// 水平成分のみを正規化して保持する（up は Y 固定）
			this.faceDirection.set( faceDirection.x, 0, faceDirection.z ).normalize();

		}

		this.intoDirection.copy( this.faceDirection ).multiplyScalar( - 1 );

	}

	/**
	 * 梯子への取り付き点（水平）を返す。外向き面の中心から radius だけ外へ出した位置で、
	 * 横（面に平行な軸）は領域中心へロックする。target に書き込んで返す。
	 */
	getAttachPoint( target: Vector3, radius: number ): Vector3 {

		this.box.getCenter( _center );

		const halfX = ( this.box.max.x - this.box.min.x ) * 0.5;
		const halfZ = ( this.box.max.z - this.box.min.z ) * 0.5;

		target.x = _center.x + this.faceDirection.x * ( halfX + radius );
		target.z = _center.z + this.faceDirection.z * ( halfZ + radius );
		target.y = 0;

		return target;

	}

}

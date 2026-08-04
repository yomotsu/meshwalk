import { Box3, Vector3 } from 'three';
import { Body } from './Body';
export type ClimbableMode = 'ladder' | 'free';
export interface ClimbableBodyOptions {
    mode: ClimbableMode;
    box: Box3;
    faceDirection?: Vector3;
    speed?: number;
}
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
export declare class ClimbableBody extends Body {
    isClimbableBody: boolean;
    mode: ClimbableMode;
    box: Box3;
    speed: number;
    faceDirection: Vector3;
    intoDirection: Vector3;
    constructor({ mode, box, faceDirection, speed }: ClimbableBodyOptions);
    /**
     * 梯子への取り付き点（水平）を返す。外向き面の中心から radius だけ外へ出した位置で、
     * 横（面に平行な軸）は領域中心へロックする。target に書き込んで返す。
     */
    getAttachPoint(target: Vector3, radius: number): Vector3;
}

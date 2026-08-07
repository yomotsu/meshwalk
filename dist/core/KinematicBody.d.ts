import { Object3D, Vector3, Quaternion, Matrix4, Sphere, Ray, BufferGeometry } from 'three';
import { Body } from './Body';
import { ComputedTriangle } from '../math/triangle';
/**
 * 速度駆動のキネマティックボディ（動くトライメッシュ = ムービングプラットフォーム）。
 * 形状はローカル座標で Octree に一度だけ焼き込み、毎サブステップ `velocity` で
 * `position` を進める。近傍三角形はその都度ワールド座標へ変換してキャラクターへ渡す。
 *
 * 反転・停止などの運動ポリシーは利用側が担う（`position` を読んで `velocity` を張り替える）。
 *
 * ```js
 * const platform = MW.KinematicBody.fromBox( { width: 6, height: 1, depth: 6 } );
 * platform.position.set( 0, 2, 0 );
 * platform.velocity.set( 0, 2, 0 ); // 上昇するエレベーター
 * world.add( platform );
 * // 毎フレーム
 * if ( platform.position.y > 8 ) platform.velocity.y = - 2;
 * if ( platform.position.y < 2 ) platform.velocity.y = + 2;
 * world.update( delta );
 * mesh.position.copy( platform.position );
 * ```
 */
export declare class KinematicBody extends Body {
    isKinematicBody: boolean;
    position: Vector3;
    quaternion: Quaternion;
    velocity: Vector3;
    angularVelocity: Vector3;
    surfaceVelocity: Vector3;
    deltaMatrix: Matrix4;
    private _octree;
    private _matrix;
    private _matrixInverse;
    private _worldTriangles;
    private _worldTriangleCount;
    /**
     * 箱を直接生成する糖衣（メッシュを組まずに動く床を定義できる）。原点中心。
     */
    static fromBox({ width, height, depth }: {
        width: number;
        height: number;
        depth: number;
    }): KinematicBody;
    /**
     * Object3D（graph）から生成する。子孫の全 Mesh を「object 自身のローカル座標」で取り込む。
     */
    static fromObject(object: Object3D): KinematicBody;
    /**
     * Object3D（graph）を辿り、含まれる全 Mesh の三角形を object 自身のローカル座標で取り込む（加算）。
     * 取り込み時点の各 Mesh のワールド行列を object のワールド行列で割り戻す（＝ボディ原点基準）。
     */
    addFromObject(object: Object3D): this;
    /**
     * BufferGeometry を直接取り込む（任意で変換行列を適用・ローカル座標で保持）。
     */
    addFromGeometry(geometry: BufferGeometry, matrix?: Matrix4): this;
    /**
     * 固定サブステップぶん `velocity` で `position` を進める。World が毎ステップ呼ぶ。
     */
    step(stepDeltaTime: number): void;
    getSphereTriangles(sphere: Sphere, result: ComputedTriangle[]): ComputedTriangle[];
    /**
     * ワールド座標のレイと交差判定する（カメラの衝突回避などから使う。StaticBody と同じ signature）。
     * レイをボディローカルへ移して Octree に問い合わせ、交点をワールドへ戻す。
     * 剛体変換（並進＋回転）なので距離は不変。
     */
    rayIntersect(ray: Ray, far?: number): false | {
        distance: number;
        triangle: ComputedTriangle | undefined;
        position: Vector3;
    } | undefined;
    dispose(): void;
    private _acquireWorldTriangle;
    private _updateMatrix;
    private _addGeometry;
}

import { Object3D, Vector3, BufferGeometry, Matrix4, type Ray, type Sphere } from 'three';
import { Body } from './Body';
import { type SerializedOctree } from './Octree';
import { ComputedTriangle } from '../math/triangle';
/**
 * 静的な環境コライダー（動かないトライメッシュ）。
 * three.js の Object3D / BufferGeometry を「形状のソース」として取り込み、
 * 三角形を内部の Octree に焼き込む。取り込み時点のワールド座標でスナップショットする。
 *
 * ```js
 * const level = MW.StaticBody.fromObject( scene );
 * world.add( level );
 * ```
 */
export declare class StaticBody extends Body {
    private _octree;
    /**
     * Object3D（graph）から生成する。子孫の全 Mesh を辿って取り込む。
     */
    static fromObject(object: Object3D): StaticBody;
    static fromOctreeData(data: SerializedOctree): StaticBody;
    /**
     * Object3D（graph）を辿り、含まれる全 Mesh の三角形をワールド座標で取り込む（加算）。
     */
    addFromObject(object: Object3D): this;
    /**
     * BufferGeometry を直接取り込む（事前マージ済みジオメトリ向け・任意で変換行列を適用）。
     */
    addFromGeometry(geometry: BufferGeometry, matrix?: Matrix4): this;
    /**
     * Add a baked, world-space triangle mesh from flat position data without
     * creating a three.js BufferGeometry. Positions are xyz-packed; indices are
     * optional and use position indices. The input is already in world space.
     */
    addTriangles(positions: ArrayLike<number>, indices?: ArrayLike<number>): this;
    toOctreeData(): SerializedOctree;
    setOctreeData(data: SerializedOctree): this;
    getSphereTriangles(sphere: Sphere, result: ComputedTriangle[]): ComputedTriangle[];
    rayIntersect(ray: Ray, far?: number): false | {
        distance: number;
        triangle: ComputedTriangle | undefined;
        position: Vector3;
    } | undefined;
    /**
     * 半径 radius の球を origin から direction（単位ベクトル）へ maxDistance まで掃き、
     * 最初に当たる三角形とその距離を返す。当たらなければ false。
     * レイ版（rayIntersect）と同じく背面は無視し、開始時点で既に接触している面も無視する。
     */
    sphereCast(origin: Vector3, direction: Vector3, maxDistance: number, radius: number): false | {
        distance: number;
        triangle: ComputedTriangle;
        position: Vector3;
    };
    dispose(): void;
    private _addGeometry;
    private _addTriangles;
    private _addTriangle;
    private _validateTriangles;
}

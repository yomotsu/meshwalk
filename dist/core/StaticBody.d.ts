import { Object3D, Vector3, BufferGeometry, Matrix4, type Ray, type Sphere } from 'three';
import { Body } from './Body';
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
    /**
     * Object3D（graph）を辿り、含まれる全 Mesh の三角形をワールド座標で取り込む（加算）。
     */
    addFromObject(object: Object3D): this;
    /**
     * BufferGeometry を直接取り込む（事前マージ済みジオメトリ向け・任意で変換行列を適用）。
     */
    addFromGeometry(geometry: BufferGeometry, matrix?: Matrix4): this;
    getSphereTriangles(sphere: Sphere, result: ComputedTriangle[]): ComputedTriangle[];
    rayIntersect(ray: Ray): false | {
        distance: number;
        triangle: ComputedTriangle | undefined;
        position: Vector3 | undefined;
    } | undefined;
    dispose(): void;
    private _addGeometry;
}

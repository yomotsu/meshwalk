import { Box3, Line3, Sphere, Vector3, type Ray } from 'three';
import { ComputedTriangle } from '../math/triangle';
/**
 * Transferable representation of a built static octree.
 *
 * `nodes` stores childStart, childCount, triangleStart and triangleCount per
 * node. `boxes` stores min.xyz and max.xyz per node. Triangle references are
 * stored in each node's triangle range and point into `triangles`/`normals`.
 */
export interface SerializedOctree {
    boxes: Float32Array;
    nodes: Uint32Array;
    triangleRefs: Uint32Array;
    triangles: Float32Array;
    normals: Float32Array;
}
export declare class Octree {
    box: Box3;
    bounds: Box3;
    triangles: ComputedTriangle[];
    subTrees: Octree[];
    constructor(box?: Box3);
    addTriangle(triangle: ComputedTriangle): void;
    calcBox(): this;
    split(level: number): void;
    build(): this;
    toData(): SerializedOctree;
    static fromData(data: SerializedOctree): Octree;
    getLineTriangles(line: Line3, result: ComputedTriangle[], isRoot?: boolean): ComputedTriangle[];
    /**
     * far を渡すと、原点から far より遠いサブツリーを枝刈りする（カメラの衝突判定のように
     * 「ある距離までに何かあるか」だけ知りたい場合に、レベル全体を辿らずに済む）。
     * 三角形はそれが交差するすべての葉ノードに登録されているので、far 以内に交点があるなら
     * その交点を含む葉ノード（＝原点から far 以内）にも必ず登録されている＝枝刈りしても取りこぼさない。
     */
    getRayTriangles(ray: Ray, result: ComputedTriangle[], far?: number, isRoot?: boolean): ComputedTriangle[];
    getSphereTriangles(sphere: Sphere, result: ComputedTriangle[], isRoot?: boolean): ComputedTriangle[];
    getCapsuleTriangles(capsule: Sphere, result: ComputedTriangle[], isRoot?: boolean): void;
    lineIntersect(line: Line3): false | {
        distance: number;
        triangle: ComputedTriangle;
        position: Vector3;
    };
    /**
     * far を渡すと、その距離より遠い交差は無視する（見つからなければ false）。
     */
    rayIntersect(ray: Ray, far?: number): false | {
        distance: number;
        triangle: ComputedTriangle | undefined;
        position: Vector3;
    } | undefined;
}

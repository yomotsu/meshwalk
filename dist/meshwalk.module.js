/*!
 * meshwalk
 * https://github.com/[object Object]
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
import { Vector3, Triangle, Sphere, Box3, Mesh, Matrix4, Ray, Quaternion, BoxGeometry, Plane, MathUtils, Line3, Vector2, AnimationMixer, Raycaster, Spherical, Vector4, Object3D } from 'three';

/**
 * イベント発行・購読の基底クラス。
 * 型引数 `TEventType` にイベント名のユニオンを渡すと、`addEventListener` 等の
 * イベント名が型チェックされる（既定は string で従来どおり任意名を許可）。
 */
let EventDispatcher$1 = class EventDispatcher {
    constructor() {
        this._listeners = {};
    }
    /**
     * Adds the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener(type, listener) {
        const listeners = this._listeners;
        if (listeners[type] === undefined)
            listeners[type] = [];
        if (listeners[type].indexOf(listener) === -1)
            listeners[type].push(listener);
    }
    /**
     * Presence of the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    hasEventListener(type, listener) {
        const listeners = this._listeners;
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }
    /**
     * Removes the specified event listener
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener(type, listener) {
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1)
                listenerArray.splice(index, 1);
        }
    }
    /**
     * Fire an event type.
     * @param event DispatcherEvent
     * @category Methods
     */
    dispatchEvent(event) {
        const listeners = this._listeners;
        const listenerArray = listeners[event.type];
        if (listenerArray !== undefined) {
            event.target = this;
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
};

/**
 * World に add できる物理ボディの基底クラス。
 * `StaticBody`（環境）や `CharacterController`（キャラクター）はこれを継承する。
 * イベント発行のため EventDispatcher を継承している。
 */
class Body extends EventDispatcher$1 {
    constructor() {
        super(...arguments);
        this.isBody = true;
    }
    /**
     * 内部リソース（octree / イベントリスナ等）を解放する。
     * 継承側で必要に応じてオーバーライドする。
     */
    dispose() { }
}

const vec3$4 = new Vector3();
class ComputedTriangle extends Triangle {
    constructor(a, b, c) {
        super(a, b, c);
        // この三角形を所有する Body（動くボディの運搬判定に使う）。静的な焼き込み三角形は null。
        this.body = null;
        // Octree のクエリ中に「すでに結果へ入れた」ことを示すマーク（重複排除用・Octree が管理する）
        this._queryId = -1;
        this.normal = this.getNormal(new Vector3());
    }
    computeBoundingSphere() {
        // すでに Sphere を持っていれば書き込んで使い回す（毎フレーム計算される動くボディ用）
        this.boundingSphere = makeTriangleBoundingSphere(this, this.normal, this.boundingSphere || new Sphere());
    }
    // https://math.stackexchange.com/questions/1397456/how-to-scale-a-triangle-such-that-the-distance-between-original-edges-and-new-ed
    // scale( amount: number ) {
    // 	const incenter = getIncenter( this, vec3 );
    // 	this.a.sub( incenter ).multiplyScalar( amount ).add( incenter );
    // 	this.b.sub( incenter ).multiplyScalar( amount ).add( incenter );
    // 	this.c.sub( incenter ).multiplyScalar( amount ).add( incenter );
    // 	拡張したら、過去の boundingSphere はすでに大きさが違うものとなる。破棄する。
    // 	this.boundingSphere = undefined;
    // }
    extend(amount) {
        const incenter = getIncenter(this, vec3$4);
        const a = incenter.distanceTo(this.a);
        const b = incenter.distanceTo(this.b);
        const c = incenter.distanceTo(this.c);
        this.a.sub(incenter).normalize().multiplyScalar(a + amount).add(incenter);
        this.b.sub(incenter).normalize().multiplyScalar(b + amount).add(incenter);
        this.c.sub(incenter).normalize().multiplyScalar(c + amount).add(incenter);
        // 拡張したら、過去の boundingSphere はすでに大きさが違うものとなる。破棄する。
        this.boundingSphere = undefined;
    }
}
// aka Semiperimeter
function getIncenter(triangle, out) {
    // https://byjus.com/maths/incenter-of-a-triangle/
    const a = triangle.a.distanceTo(triangle.b);
    const b = triangle.b.distanceTo(triangle.c);
    const c = triangle.c.distanceTo(triangle.a);
    const p = a + b + c;
    out.set((a * triangle.a.x + b * triangle.b.x + c * triangle.c.x) / p, (a * triangle.a.y + b * triangle.b.y + c * triangle.c.y) / p, (a * triangle.a.z + b * triangle.b.z + c * triangle.c.z) / p);
    return out;
}
// const edge = new Line3();
// function getInradius( triangle: Triangle ) {
// 	const incenter = getIncenter( triangle, vec3 );
// 	const closestPointToEdge = new Vector3();
// 	edge.start = triangle.a;
// 	edge.end = triangle.b;
// 	edge.closestPointToPoint( incenter, true, closestPointToEdge );
// 	return incenter.distanceTo( closestPointToEdge );
// }
// function makeTriangleBoundingBox( triangle: Triangle ) {
// 	const bb = new Box3();
// 	bb.min = bb.min.min( triangle.a );
// 	bb.min = bb.min.min( triangle.b );
// 	bb.min = bb.min.min( triangle.c );
// 	bb.max = bb.max.max( triangle.a );
// 	bb.max = bb.max.max( triangle.b );
// 	bb.max = bb.max.max( triangle.c );
// 	return bb;
// }
const v = new Vector3();
const v0 = new Vector3();
const v1 = new Vector3();
const e0 = new Vector3();
const e1 = new Vector3();
const triangleNormal = new Vector3();
function makeTriangleBoundingSphere(triangle, normal, bs) {
    // obtuse triangle
    v0.subVectors(triangle.b, triangle.a);
    v1.subVectors(triangle.c, triangle.a);
    if (v0.dot(v1) <= 0) {
        bs.center.addVectors(triangle.b, triangle.c).divideScalar(2);
        bs.radius = v.subVectors(triangle.b, triangle.c).length() / 2;
        return bs;
    }
    v0.subVectors(triangle.a, triangle.b);
    v1.subVectors(triangle.c, triangle.b);
    if (v0.dot(v1) <= 0) {
        bs.center.addVectors(triangle.a, triangle.c).divideScalar(2);
        bs.radius = v.subVectors(triangle.a, triangle.c).length() / 2;
        return bs;
    }
    v0.subVectors(triangle.a, triangle.c);
    v1.subVectors(triangle.b, triangle.c);
    if (v0.dot(v1) <= 0) {
        bs.center.addVectors(triangle.a, triangle.b).divideScalar(2);
        bs.radius = v.subVectors(triangle.a, triangle.b).length() / 2;
        return bs;
    }
    // acute‐angled triangle
    if (!normal) {
        normal = triangle.getNormal(triangleNormal);
    }
    v0.crossVectors(v.subVectors(triangle.c, triangle.b), normal);
    v1.crossVectors(v.subVectors(triangle.c, triangle.a), normal);
    e0.addVectors(triangle.c, triangle.b).multiplyScalar(.5);
    e1.addVectors(triangle.c, triangle.a).multiplyScalar(.5);
    const a = v0.dot(v1);
    const b = v0.dot(v0);
    const d = v1.dot(v1);
    const c = -v.subVectors(e1, e0).dot(v0);
    const e = -v.subVectors(e1, e0).dot(v1);
    const div = -a * a + b * d;
    // t = ( - a * c + b * e ) / div;
    const s = (-c * d + a * e) / div;
    bs.center.copy(e0).addScaledVector(v0, s);
    bs.radius = v.subVectors(bs.center, triangle.a).length();
    return bs;
}

const vec3$3 = new Vector3();
// https://3dkingdoms.com/weekly/weekly.php?a=3
function intersectsLineBox(line, box, hit) {
    if (line.end.x < box.min.x && line.start.x < box.min.x)
        return false;
    if (line.end.x > box.max.x && line.start.x > box.max.x)
        return false;
    if (line.end.y < box.min.y && line.start.y < box.min.y)
        return false;
    if (line.end.y > box.max.y && line.start.y > box.max.y)
        return false;
    if (line.end.z < box.min.z && line.start.z < box.min.z)
        return false;
    if (line.end.z > box.max.z && line.start.z > box.max.z)
        return false;
    if (line.start.x > box.min.x && line.start.x < box.max.x &&
        line.start.y > box.min.y && line.start.y < box.max.y &&
        line.start.z > box.min.z && line.start.z < box.max.z) {
        return true;
    }
    const _hit = vec3$3;
    if ((getIntersection(line.start.x - box.min.x, line.end.x - box.min.x, line.start, line.end, _hit) && inBox(_hit, box, 1)) ||
        (getIntersection(line.start.y - box.min.y, line.end.y - box.min.y, line.start, line.end, _hit) && inBox(_hit, box, 2)) ||
        (getIntersection(line.start.z - box.min.z, line.end.z - box.min.z, line.start, line.end, _hit) && inBox(_hit, box, 3)) ||
        (getIntersection(line.start.x - box.max.x, line.end.x - box.max.x, line.start, line.end, _hit) && inBox(_hit, box, 1)) ||
        (getIntersection(line.start.y - box.max.y, line.end.y - box.max.y, line.start, line.end, _hit) && inBox(_hit, box, 2)) ||
        (getIntersection(line.start.z - box.max.z, line.end.z - box.max.z, line.start, line.end, _hit) && inBox(_hit, box, 3))) {
        return true;
    }
    return false;
}
function getIntersection(dst1, dst2, p1, p2, hit) {
    if ((dst1 * dst2) >= 0)
        return false;
    if (dst1 == dst2)
        return false;
    if (hit) {
        vec3$3.subVectors(p2, p1);
        vec3$3.multiplyScalar(-dst1 / (dst2 - dst1));
        hit.addVectors(p1, vec3$3);
    }
    return true;
}
function inBox(hit, box, axis) {
    if (axis === 1 && hit.z > box.min.z && hit.z < box.max.z && hit.y > box.min.y && hit.y < box.max.y)
        return true;
    if (axis === 2 && hit.z > box.min.z && hit.z < box.max.z && hit.x > box.min.x && hit.x < box.max.x)
        return true;
    if (axis === 3 && hit.x > box.min.x && hit.x < box.max.x && hit.y > box.min.y && hit.y < box.max.y)
        return true;
    return false;
}

const vec3$2 = new Vector3();
// // based on Real-Time Collision Detection Section 5.3.4
// // p: <THREE.Vector3>, // line3.start
// // q: <THREE.Vector3>, // line3.end
// // a: <THREE.Vector3>, // triangle.a
// // b: <THREE.Vector3>, // triangle.b
// // c: <THREE.Vector3>, // triangle.c
// const pq = new Vector3();
// const pa = new Vector3();
// const pb = new Vector3();
// const pc = new Vector3();
// const au = new Vector3();
// const bv = new Vector3();
// const cw = new Vector3();
// export function intersectsLineTriangle( p: Vector3, q: Vector3, a: Vector3, b: Vector3, c: Vector3, hit: Vector3 ) {
// 	pq.subVectors( q, p );
// 	pa.subVectors( a, p );
// 	pb.subVectors( b, p );
// 	pc.subVectors( c, p );
// 	let u: number;
// 	let v: number;
// 	let w: number;
// 	u = scalarTriple( pq, pc, pb );
// 	if ( u < 0 ) return false;
// 	v = scalarTriple( pq, pa, pc );
// 	if ( v < 0 ) return false;
// 	w = scalarTriple( pq, pb, pa );
// 	if ( w < 0 ) return false;
// 	const denom = 1 / ( u + v + w );
// 	u *= denom;
// 	v *= denom;
// 	w *= denom;
// 	au.copy( a ).multiplyScalar( u );
// 	bv.copy( b ).multiplyScalar( v );
// 	cw.copy( c ).multiplyScalar( w );
// 	hit.copy( au ).add( bv ).add( cw );
// 	return true;
// }
// function scalarTriple( a: Vector3, b: Vector3, c: Vector3 ) {
// 	var m = b.clone().cross( c );
// 	return a.dot( m );
// }
// var vectorTriple = function ( a, b, c ) {
//   var m = b.clone().cross( c );
//   return a.clone().cross( m );
// }
const ab$1 = new Vector3();
const ac$1 = new Vector3();
const qp = new Vector3();
const n = new Vector3();
const ap$1 = new Vector3();
const e = new Vector3();
const au = new Vector3();
const bv = new Vector3();
const cw = new Vector3();
function intersectsLineTriangle(p, q, a, b, c, hit) {
    ab$1.subVectors(b, a);
    ac$1.subVectors(c, a);
    qp.subVectors(p, q);
    n.copy(ab$1).cross(ac$1);
    const d = qp.dot(n);
    if (d <= 0)
        return false;
    ap$1.subVectors(p, a);
    let t = ap$1.dot(n);
    if (t < 0)
        return false;
    if (t > d)
        return false;
    e.copy(qp).cross(ap$1);
    let v = ac$1.dot(e);
    if (v < 0 || v > d)
        return false;
    let w = vec3$2.copy(ab$1).dot(e) * -1;
    if (w < 0 || v + w > d)
        return false;
    const ood = 1 / d;
    t *= ood;
    v *= ood;
    w *= ood;
    const u = 1 - v - w;
    au.copy(a).multiplyScalar(u);
    bv.copy(b).multiplyScalar(v);
    cw.copy(c).multiplyScalar(w);
    hit.copy(au).add(bv).add(cw);
    return true;
}

const _v1$1 = new Vector3();
const _v2$1 = new Vector3();
// get*Triangles の重複排除用のマーク。三角形は複数のサブツリーに属するため、
// 1回のクエリで同じ三角形が何度も見つかる。
// クエリごとに ID を1つ進め、結果へ入れた三角形へその ID を書いておくことで、
// 結果配列の線形探索（indexOf・O(n²)）を使わずに重複を弾く。
let _queryId = 0;
// lineIntersect / rayIntersect が使う一時バッファ（呼び出しごとに確保しない）。
// 再帰・入れ子で使わないので1本で足りる。
const _intersectTriangles = [];
const _bestPoint = new Vector3();
// 点から box までの最短距離の2乗（box の内側なら 0）。far による枝刈り用（sqrt を避ける）。
function distanceSquaredToBox(box, point) {
    const dx = Math.max(box.min.x - point.x, 0, point.x - box.max.x);
    const dy = Math.max(box.min.y - point.y, 0, point.y - box.max.y);
    const dz = Math.max(box.min.z - point.z, 0, point.z - box.max.z);
    return dx * dx + dy * dy + dz * dz;
}
// const _plane = new Plane();
// const _line1 = new Line3();
// const _line2 = new Line3();
// const _sphere = new Sphere();
// const _capsule = new Capsule();
class Octree {
    constructor(box = new Box3()) {
        this.bounds = new Box3();
        this.triangles = [];
        this.subTrees = [];
        this.box = box;
    }
    addTriangle(triangle) {
        this.bounds.min.x = Math.min(this.bounds.min.x, triangle.a.x, triangle.b.x, triangle.c.x);
        this.bounds.min.y = Math.min(this.bounds.min.y, triangle.a.y, triangle.b.y, triangle.c.y);
        this.bounds.min.z = Math.min(this.bounds.min.z, triangle.a.z, triangle.b.z, triangle.c.z);
        this.bounds.max.x = Math.max(this.bounds.max.x, triangle.a.x, triangle.b.x, triangle.c.x);
        this.bounds.max.y = Math.max(this.bounds.max.y, triangle.a.y, triangle.b.y, triangle.c.y);
        this.bounds.max.z = Math.max(this.bounds.max.z, triangle.a.z, triangle.b.z, triangle.c.z);
        this.triangles.push(triangle);
    }
    calcBox() {
        this.box.set(this.bounds.min, this.bounds.max);
        // offset small amount to account for regular grid
        this.box.min.x -= 0.01;
        this.box.min.y -= 0.01;
        this.box.min.z -= 0.01;
        return this;
    }
    split(level) {
        const subTrees = [];
        const halfSize = _v2$1.copy(this.box.max).sub(this.box.min).multiplyScalar(0.5);
        for (let x = 0; x < 2; x++) {
            for (let y = 0; y < 2; y++) {
                for (let z = 0; z < 2; z++) {
                    const box = new Box3();
                    const v = _v1$1.set(x, y, z);
                    box.min.copy(this.box.min).add(v.multiply(halfSize));
                    box.max.copy(box.min).add(halfSize);
                    subTrees.push(new Octree(box));
                }
            }
        }
        let triangle;
        while (triangle = this.triangles.pop()) {
            for (let i = 0; i < subTrees.length; i++) {
                if (subTrees[i].box.intersectsTriangle(triangle)) {
                    subTrees[i].triangles.push(triangle);
                }
            }
        }
        for (let i = 0; i < subTrees.length; i++) {
            const len = subTrees[i].triangles.length;
            if (len > 8 && level < 16) {
                subTrees[i].split(level + 1);
            }
            if (len !== 0) {
                this.subTrees.push(subTrees[i]);
            }
        }
    }
    build() {
        this.calcBox();
        this.split(0);
        return this;
    }
    toData() {
        const boxes = [];
        const nodes = [];
        const triangleRefs = [];
        const trianglePositions = [];
        const triangleNormals = [];
        const triangleIds = new Map();
        const addTriangle = (triangle) => {
            const existing = triangleIds.get(triangle);
            if (existing !== undefined)
                return existing;
            const id = triangleIds.size;
            triangleIds.set(triangle, id);
            trianglePositions.push(triangle.a.x, triangle.a.y, triangle.a.z, triangle.b.x, triangle.b.y, triangle.b.z, triangle.c.x, triangle.c.y, triangle.c.z);
            triangleNormals.push(triangle.normal.x, triangle.normal.y, triangle.normal.z);
            return id;
        };
        const visit = (node) => {
            const nodeId = nodes.length / 4;
            const triangleStart = triangleRefs.length;
            boxes.push(node.box.min.x, node.box.min.y, node.box.min.z, node.box.max.x, node.box.max.y, node.box.max.z);
            nodes.push(0, node.subTrees.length, triangleStart, node.triangles.length);
            for (const triangle of node.triangles)
                triangleRefs.push(addTriangle(triangle));
            const childStart = nodes.length / 4;
            nodes[nodeId * 4] = childStart;
            for (const child of node.subTrees)
                visit(child);
        };
        visit(this);
        return {
            boxes: new Float32Array(boxes),
            nodes: new Uint32Array(nodes),
            triangleRefs: new Uint32Array(triangleRefs),
            triangles: new Float32Array(trianglePositions),
            normals: new Float32Array(triangleNormals),
        };
    }
    static fromData(data) {
        if (data.boxes.length % 6 !== 0 || data.nodes.length % 4 !== 0) {
            throw new Error('Octree.fromData: invalid node buffer lengths');
        }
        if (data.triangles.length % 9 !== 0 || data.normals.length % 3 !== 0
            || data.triangles.length / 3 !== data.normals.length) {
            throw new Error('Octree.fromData: invalid triangle buffer lengths');
        }
        const nodeCount = data.nodes.length / 4;
        if (data.boxes.length / 6 !== nodeCount)
            throw new Error('Octree.fromData: node/box count differs');
        const triangles = new Array(data.triangles.length / 9);
        for (let i = 0; i < triangles.length; i++) {
            const p = i * 9;
            const n = i * 3;
            const triangle = new ComputedTriangle(new Vector3(data.triangles[p], data.triangles[p + 1], data.triangles[p + 2]), new Vector3(data.triangles[p + 3], data.triangles[p + 4], data.triangles[p + 5]), new Vector3(data.triangles[p + 6], data.triangles[p + 7], data.triangles[p + 8]));
            triangle.normal.set(data.normals[n], data.normals[n + 1], data.normals[n + 2]);
            triangle.computeBoundingSphere();
            triangles[i] = triangle;
        }
        const create = (nodeId) => {
            if (nodeId < 0 || nodeId >= nodeCount)
                throw new Error('Octree.fromData: invalid child node index');
            const b = nodeId * 6;
            const node = new Octree(new Box3(new Vector3(data.boxes[b], data.boxes[b + 1], data.boxes[b + 2]), new Vector3(data.boxes[b + 3], data.boxes[b + 4], data.boxes[b + 5])));
            node.bounds.copy(node.box);
            const m = nodeId * 4;
            const childStart = data.nodes[m];
            const childCount = data.nodes[m + 1];
            const triangleStart = data.nodes[m + 2];
            const triangleCount = data.nodes[m + 3];
            if (triangleStart + triangleCount > data.triangleRefs.length)
                throw new Error('Octree.fromData: invalid triangle range');
            for (let i = 0; i < triangleCount; i++) {
                const triangleId = data.triangleRefs[triangleStart + i];
                if (triangleId === undefined || triangleId >= triangles.length)
                    throw new Error('Octree.fromData: invalid triangle reference');
                node.triangles.push(triangles[triangleId]);
            }
            if (childStart + childCount > nodeCount)
                throw new Error('Octree.fromData: invalid child range');
            for (let i = 0; i < childCount; i++)
                node.subTrees.push(create(childStart + i));
            return node;
        };
        return create(0);
    }
    getLineTriangles(line, result, isRoot = true) {
        if (isRoot)
            _queryId++;
        for (let i = 0; i < this.subTrees.length; i++) {
            const subTree = this.subTrees[i];
            if (!intersectsLineBox(line, subTree.box))
                continue;
            if (subTree.triangles.length > 0) {
                for (let j = 0; j < subTree.triangles.length; j++) {
                    const triangle = subTree.triangles[j];
                    if (triangle._queryId === _queryId)
                        continue;
                    triangle._queryId = _queryId;
                    result.push(triangle);
                }
            }
            else {
                subTree.getLineTriangles(line, result, false);
            }
        }
        return result;
    }
    /**
     * far を渡すと、原点から far より遠いサブツリーを枝刈りする（カメラの衝突判定のように
     * 「ある距離までに何かあるか」だけ知りたい場合に、レベル全体を辿らずに済む）。
     * 三角形はそれが交差するすべての葉ノードに登録されているので、far 以内に交点があるなら
     * その交点を含む葉ノード（＝原点から far 以内）にも必ず登録されている＝枝刈りしても取りこぼさない。
     */
    getRayTriangles(ray, result, far = Infinity, isRoot = true) {
        if (isRoot)
            _queryId++;
        const farSquared = far === Infinity ? Infinity : far * far;
        for (let i = 0; i < this.subTrees.length; i++) {
            const subTree = this.subTrees[i];
            if (!ray.intersectsBox(subTree.box))
                continue;
            if (farSquared !== Infinity && distanceSquaredToBox(subTree.box, ray.origin) > farSquared)
                continue;
            if (subTree.triangles.length > 0) {
                for (let j = 0; j < subTree.triangles.length; j++) {
                    const triangle = subTree.triangles[j];
                    if (triangle._queryId === _queryId)
                        continue;
                    triangle._queryId = _queryId;
                    result.push(triangle);
                }
            }
            else {
                subTree.getRayTriangles(ray, result, far, false);
            }
        }
        return result;
    }
    getSphereTriangles(sphere, result, isRoot = true) {
        if (isRoot)
            _queryId++;
        for (let i = 0; i < this.subTrees.length; i++) {
            const subTree = this.subTrees[i];
            if (!sphere.intersectsBox(subTree.box))
                continue;
            if (subTree.triangles.length > 0) {
                for (let j = 0; j < subTree.triangles.length; j++) {
                    const triangle = subTree.triangles[j];
                    if (triangle._queryId === _queryId)
                        continue;
                    triangle._queryId = _queryId;
                    result.push(triangle);
                }
            }
            else {
                subTree.getSphereTriangles(sphere, result, false);
            }
        }
        return result;
    }
    getCapsuleTriangles(capsule, result, isRoot = true) {
        if (isRoot)
            _queryId++;
        for (let i = 0; i < this.subTrees.length; i++) {
            const subTree = this.subTrees[i];
            if (!capsule.intersectsBox(subTree.box))
                continue;
            if (subTree.triangles.length > 0) {
                for (let j = 0; j < subTree.triangles.length; j++) {
                    const triangle = subTree.triangles[j];
                    if (triangle._queryId === _queryId)
                        continue;
                    triangle._queryId = _queryId;
                    result.push(triangle);
                }
            }
            else {
                subTree.getCapsuleTriangles(capsule, result, false);
            }
        }
    }
    lineIntersect(line) {
        const triangles = _intersectTriangles;
        triangles.length = 0;
        let distanceSquared = Infinity;
        let triangle = null;
        this.getLineTriangles(line, triangles);
        for (let i = 0; i < triangles.length; i++) {
            const result = _v1$1;
            const isIntersected = intersectsLineTriangle(line.start, line.end, triangles[i].a, triangles[i].b, triangles[i].c, result);
            if (isIntersected) {
                const newDistanceSquared = line.start.distanceToSquared(result);
                if (distanceSquared > newDistanceSquared) {
                    _bestPoint.copy(result);
                    distanceSquared = newDistanceSquared;
                    triangle = triangles[i];
                }
            }
        }
        // 交点は「もっとも近いものが確定してから」1つだけ確保する（候補ごとに clone しない）
        return triangle ? { distance: Math.sqrt(distanceSquared), triangle, position: _bestPoint.clone() } : false;
    }
    /**
     * far を渡すと、その距離より遠い交差は無視する（見つからなければ false）。
     */
    rayIntersect(ray, far = Infinity) {
        if (ray.direction.lengthSq() === 0)
            return;
        const triangles = _intersectTriangles;
        triangles.length = 0;
        let triangle, distanceSquared = 1e100;
        const farSquared = far === Infinity ? Infinity : far * far;
        this.getRayTriangles(ray, triangles, far);
        for (let i = 0; i < triangles.length; i++) {
            const result = ray.intersectTriangle(triangles[i].a, triangles[i].b, triangles[i].c, true, _v1$1);
            if (result) {
                const newDistanceSquared = result.sub(ray.origin).lengthSq();
                if (newDistanceSquared > farSquared)
                    continue;
                if (distanceSquared > newDistanceSquared) {
                    _bestPoint.copy(result).add(ray.origin);
                    distanceSquared = newDistanceSquared;
                    triangle = triangles[i];
                }
            }
        }
        // 交点は「もっとも近いものが確定してから」1つだけ確保する（候補ごとに clone しない）
        return distanceSquared < 1e100 ? { distance: Math.sqrt(distanceSquared), triangle, position: _bestPoint.clone() } : false;
    }
}

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
class StaticBody extends Body {
    constructor() {
        super(...arguments);
        this._octree = new Octree();
    }
    /**
     * Object3D（graph）から生成する。子孫の全 Mesh を辿って取り込む。
     */
    static fromObject(object) {
        return new StaticBody().addFromObject(object);
    }
    static fromOctreeData(data) {
        return new StaticBody().setOctreeData(data);
    }
    /**
     * Object3D（graph）を辿り、含まれる全 Mesh の三角形をワールド座標で取り込む（加算）。
     */
    addFromObject(object) {
        object.updateWorldMatrix(true, true);
        object.traverse((child) => {
            if (child instanceof Mesh)
                this._addGeometry(child.geometry, child.matrixWorld);
        });
        this._octree.build();
        return this;
    }
    /**
     * BufferGeometry を直接取り込む（事前マージ済みジオメトリ向け・任意で変換行列を適用）。
     */
    addFromGeometry(geometry, matrix) {
        this._addGeometry(geometry, matrix);
        this._octree.build();
        return this;
    }
    /**
     * Add a baked, world-space triangle mesh from flat position data without
     * creating a three.js BufferGeometry. Positions are xyz-packed; indices are
     * optional and use position indices. The input is already in world space.
     */
    addTriangles(positions, indices) {
        this._validateTriangles(positions, indices);
        this._addTriangles(positions, indices);
        this._octree.build();
        return this;
    }
    toOctreeData() {
        return this._octree.toData();
    }
    setOctreeData(data) {
        this._octree = Octree.fromData(data);
        return this;
    }
    // --- 内部クエリ（World の broad-phase / カメラのレイ判定から使う） ---
    getSphereTriangles(sphere, result) {
        return this._octree.getSphereTriangles(sphere, result);
    }
    rayIntersect(ray, far = Infinity) {
        return this._octree.rayIntersect(ray, far);
    }
    dispose() {
        this._octree.triangles.length = 0;
        this._octree.subTrees.length = 0;
    }
    _addGeometry(geometry, matrix) {
        // position は fromBufferAttribute 経由で読む。これにより KHR_mesh_quantization
        // などの正規化整数（normalized）属性も正しくデノーマライズされる。変換は頂点ごとに
        // matrix を適用する（元の three.js ジオメトリは変更しない）。
        const position = geometry.attributes.position;
        const index = geometry.index;
        const addTriangle = (a, b, c) => {
            const vA = new Vector3().fromBufferAttribute(position, a);
            const vB = new Vector3().fromBufferAttribute(position, b);
            const vC = new Vector3().fromBufferAttribute(position, c);
            if (matrix) {
                vA.applyMatrix4(matrix);
                vB.applyMatrix4(matrix);
                vC.applyMatrix4(matrix);
            }
            const triangle = new ComputedTriangle(vA, vB, vC);
            // ポリゴンの継ぎ目の辺で raycast が交差しない可能性があるので、わずかに拡大する
            triangle.extend(1e-10);
            triangle.computeBoundingSphere();
            this._octree.addTriangle(triangle);
        };
        if (index) {
            for (let i = 0, l = index.count; i < l; i += 3)
                addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
        }
        else {
            for (let i = 0, l = position.count; i < l; i += 3)
                addTriangle(i, i + 1, i + 2);
        }
    }
    _addTriangles(positions, indices) {
        const triangleCount = indices === undefined ? positions.length / 9 : indices.length / 3;
        for (let triangle = 0; triangle < triangleCount; triangle++) {
            const base = triangle * 3;
            const a = indices === undefined ? base : indices[base];
            const b = indices === undefined ? base + 1 : indices[base + 1];
            const c = indices === undefined ? base + 2 : indices[base + 2];
            this._addTriangle(positions, a, b, c);
        }
    }
    _addTriangle(positions, a, b, c) {
        const vA = new Vector3(positions[a * 3], positions[a * 3 + 1], positions[a * 3 + 2]);
        const vB = new Vector3(positions[b * 3], positions[b * 3 + 1], positions[b * 3 + 2]);
        const vC = new Vector3(positions[c * 3], positions[c * 3 + 1], positions[c * 3 + 2]);
        const triangle = new ComputedTriangle(vA, vB, vC);
        triangle.extend(1e-10);
        triangle.computeBoundingSphere();
        this._octree.addTriangle(triangle);
    }
    _validateTriangles(positions, indices) {
        if (positions.length % 3 !== 0)
            throw new Error('StaticBody: positions length must be a multiple of 3');
        if (indices === undefined && positions.length % 9 !== 0)
            throw new Error('StaticBody: non-indexed positions length must be a multiple of 9');
        if (indices !== undefined && indices.length % 3 !== 0)
            throw new Error('StaticBody: indices length must be a multiple of 3');
        const vertexCount = positions.length / 3;
        if (indices !== undefined) {
            for (let i = 0; i < indices.length; i++) {
                const index = indices[i];
                if (!Number.isInteger(index) || index < 0 || index >= vertexCount) {
                    throw new Error(`StaticBody: index ${index} is outside positions (${vertexCount} vertices)`);
                }
            }
        }
    }
}

const _unitScale = new Vector3(1, 1, 1);
const _localSphere = new Sphere();
const _localResult = [];
const _rootInverse = new Matrix4();
const _previousInverse = new Matrix4();
const _localRay = new Ray();
const _deltaQuaternion = new Quaternion();
const _axis = new Vector3();
const _surfaceDelta = new Matrix4();
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
class KinematicBody extends Body {
    constructor() {
        super(...arguments);
        this.isKinematicBody = true;
        this.position = new Vector3();
        this.quaternion = new Quaternion(); // 現在の姿勢（angularVelocity で積分される）
        this.velocity = new Vector3(); // ワールド座標の並進速度（m/s）
        this.angularVelocity = new Vector3(); // ワールド軸まわりの角速度（rad/s）。向き=軸・大きさ=速さ。yaw なら (0, ω, 0)
        this.surfaceVelocity = new Vector3(); // 表面（ベルト面）の流れ速度（ワールド, m/s）。床は動かさず乗員だけ運ぶ＝コンベア。既定 0
        // 直近 1 ステップの変換差分（T_new · T_old⁻¹）。乗っているキャラの運搬に使う。
        // 並進のみの現状は移動量ぶんの平行移動行列。回転はフェーズ5で velocity に接続する。
        this.deltaMatrix = new Matrix4();
        this._octree = new Octree();
        this._matrix = new Matrix4();
        this._matrixInverse = new Matrix4();
        this._worldTriangles = []; // ワールド変換した三角形の使い回しプール
        this._worldTriangleCount = 0;
    }
    /**
     * 箱を直接生成する糖衣（メッシュを組まずに動く床を定義できる）。原点中心。
     */
    static fromBox({ width, height, depth }) {
        const geometry = new BoxGeometry(width, height, depth);
        const body = new KinematicBody().addFromGeometry(geometry);
        geometry.dispose();
        return body;
    }
    /**
     * Object3D（graph）から生成する。子孫の全 Mesh を「object 自身のローカル座標」で取り込む。
     */
    static fromObject(object) {
        return new KinematicBody().addFromObject(object);
    }
    /**
     * Object3D（graph）を辿り、含まれる全 Mesh の三角形を object 自身のローカル座標で取り込む（加算）。
     * 取り込み時点の各 Mesh のワールド行列を object のワールド行列で割り戻す（＝ボディ原点基準）。
     */
    addFromObject(object) {
        object.updateWorldMatrix(true, true);
        _rootInverse.copy(object.matrixWorld).invert();
        object.traverse((child) => {
            if (child instanceof Mesh) {
                const relative = new Matrix4().multiplyMatrices(_rootInverse, child.matrixWorld);
                this._addGeometry(child.geometry, relative);
            }
        });
        this._octree.build();
        this._updateMatrix();
        return this;
    }
    /**
     * BufferGeometry を直接取り込む（任意で変換行列を適用・ローカル座標で保持）。
     */
    addFromGeometry(geometry, matrix) {
        this._addGeometry(geometry, matrix);
        this._octree.build();
        this._updateMatrix();
        return this;
    }
    /**
     * 固定サブステップぶん `velocity` で `position` を進める。World が毎ステップ呼ぶ。
     */
    step(stepDeltaTime) {
        // T_old は「現在の公開トランスフォーム」から同期する。利用側が position を直接
        // 書き換えた（テレポート）場合もここで取り込まれ、運搬 delta には波及しない
        // （delta はこのステップのエンジン積分ぶんだけになる＝テレポート安全）。
        this._updateMatrix();
        _previousInverse.copy(this._matrix).invert();
        this.position.addScaledVector(this.velocity, stepDeltaTime);
        // 角速度を姿勢へ積分する（ワールド軸まわり＝body 原点まわりの回転なので premultiply）
        const angle = this.angularVelocity.length() * stepDeltaTime;
        if (angle > 1e-9) {
            _axis.copy(this.angularVelocity).normalize();
            _deltaQuaternion.setFromAxisAngle(_axis, angle);
            this.quaternion.premultiply(_deltaQuaternion);
        }
        this._updateMatrix(); // T_new
        // このステップの変換差分（運搬用）: delta = T_new · T_old⁻¹
        this.deltaMatrix.multiplyMatrices(this._matrix, _previousInverse);
        // コンベア: 床（position）は動かさず、表面の流れぶんだけ乗員を運ぶ。
        // 運搬差分にワールド並進 surfaceVelocity·dt を前から足す（deltaMatrix は
        // 乗員のワールド位置に applyMatrix4 されるので premultiply でワールド平行移動になる）。
        // 位置・姿勢は不変なので衝突ジオメトリは静止したまま。並進・回転床との合成も可。
        if (this.surfaceVelocity.lengthSq() > 0) {
            _surfaceDelta.makeTranslation(this.surfaceVelocity.x * stepDeltaTime, this.surfaceVelocity.y * stepDeltaTime, this.surfaceVelocity.z * stepDeltaTime);
            this.deltaMatrix.premultiply(_surfaceDelta);
        }
    }
    // --- 内部クエリ（World の broad-phase から使う。StaticBody と同じ signature） ---
    getSphereTriangles(sphere, result) {
        this._updateMatrix(); // 現在の公開トランスフォームを反映
        // ワールドのクエリ球をボディローカルへ移す（並進＋回転のみ＝半径は不変）
        _localSphere.center.copy(sphere.center).applyMatrix4(this._matrixInverse);
        _localSphere.radius = sphere.radius;
        _localResult.length = 0;
        this._octree.getSphereTriangles(_localSphere, _localResult);
        this._worldTriangleCount = 0;
        for (let i = 0, l = _localResult.length; i < l; i++) {
            const local = _localResult[i];
            const world = this._acquireWorldTriangle();
            world.a.copy(local.a).applyMatrix4(this._matrix);
            world.b.copy(local.b).applyMatrix4(this._matrix);
            world.c.copy(local.c).applyMatrix4(this._matrix);
            world.normal.copy(local.normal).applyQuaternion(this.quaternion).normalize();
            world.body = this;
            // bounding sphere は剛体変換（並進＋回転）なので、ローカルのものを移すだけでよい。
            // 半径は不変。毎フレーム三角形から作り直す（= Sphere の新規確保）のを避ける。
            if (!local.boundingSphere)
                local.computeBoundingSphere();
            const boundingSphere = world.boundingSphere || (world.boundingSphere = new Sphere());
            boundingSphere.center.copy(local.boundingSphere.center).applyMatrix4(this._matrix);
            boundingSphere.radius = local.boundingSphere.radius;
            result.push(world);
        }
        return result;
    }
    /**
     * ワールド座標のレイと交差判定する（カメラの衝突回避などから使う。StaticBody と同じ signature）。
     * レイをボディローカルへ移して Octree に問い合わせ、交点をワールドへ戻す。
     * 剛体変換（並進＋回転）なので距離は不変。
     */
    rayIntersect(ray, far = Infinity) {
        this._updateMatrix(); // 現在の公開トランスフォームを反映
        _localRay.origin.copy(ray.origin).applyMatrix4(this._matrixInverse);
        _localRay.direction.copy(ray.direction).transformDirection(this._matrixInverse);
        // 剛体変換なので距離は不変。far はそのままローカル空間でも使える
        const result = this._octree.rayIntersect(_localRay, far);
        if (!result)
            return result;
        if (result.position)
            result.position.applyMatrix4(this._matrix);
        return result;
    }
    dispose() {
        this._octree.triangles.length = 0;
        this._octree.subTrees.length = 0;
        this._worldTriangles.length = 0;
    }
    _acquireWorldTriangle() {
        let triangle = this._worldTriangles[this._worldTriangleCount];
        if (!triangle) {
            triangle = new ComputedTriangle(new Vector3(), new Vector3(), new Vector3());
            this._worldTriangles[this._worldTriangleCount] = triangle;
        }
        this._worldTriangleCount++;
        return triangle;
    }
    _updateMatrix() {
        this._matrix.compose(this.position, this.quaternion, _unitScale);
        this._matrixInverse.copy(this._matrix).invert();
    }
    _addGeometry(geometry, matrix) {
        // position は fromBufferAttribute 経由で読む。これにより KHR_mesh_quantization
        // などの正規化整数（normalized）属性も正しくデノーマライズされる。変換は頂点ごとに
        // matrix を適用する（元の three.js ジオメトリは変更しない）。
        const position = geometry.attributes.position;
        const index = geometry.index;
        const addTriangle = (a, b, c) => {
            const vA = new Vector3().fromBufferAttribute(position, a);
            const vB = new Vector3().fromBufferAttribute(position, b);
            const vC = new Vector3().fromBufferAttribute(position, c);
            if (matrix) {
                vA.applyMatrix4(matrix);
                vB.applyMatrix4(matrix);
                vC.applyMatrix4(matrix);
            }
            const triangle = new ComputedTriangle(vA, vB, vC);
            // ポリゴンの継ぎ目の辺で raycast が交差しない可能性があるので、わずかに拡大する
            triangle.extend(1e-10);
            triangle.computeBoundingSphere();
            this._octree.addTriangle(triangle);
        };
        if (index) {
            for (let i = 0, l = index.count; i < l; i += 3)
                addTriangle(index.getX(i), index.getX(i + 1), index.getX(i + 2));
        }
        else {
            for (let i = 0, l = position.count; i < l; i += 3)
                addTriangle(i, i + 1, i + 2);
        }
    }
}

/**
 * A capsule is essentially a cylinder with hemispherical caps at both ends.
 * It can be thought of as a swept sphere, where a sphere is moved along a line segment.
 *
 * Capsules are often used as bounding volumes (next to AABBs and bounding spheres).
 *
 * @three_import import { Capsule } from 'three/addons/math/Capsule.js';
 */
class Capsule {

	/**
	 * Constructs a new capsule.
	 *
	 * @param {Vector3} [start] - The start vector.
	 * @param {Vector3} [end] - The end vector.
	 * @param {number} [radius=1] - The capsule's radius.
	 */
	constructor( start = new Vector3( 0, 0, 0 ), end = new Vector3( 0, 1, 0 ), radius = 1 ) {

		/**
		 * The start vector.
		 *
		 * @type {Vector3}
		 */
		this.start = start;

		/**
		 * The end vector.
		 *
		 * @type {Vector3}
		 */
		this.end = end;

		/**
		 * The capsule's radius.
		 *
		 * @type {number}
		 * @default 1
		 */
		this.radius = radius;

	}

	/**
	 * Returns a new capsule with copied values from this instance.
	 *
	 * @return {Capsule} A clone of this instance.
	 */
	clone() {

		return new this.constructor().copy( this );

	}

	/**
	 * Sets the capsule components to the given values.
	 * Please note that this method only copies the values from the given objects.
	 *
	 * @param {Vector3} start - The start vector.
	 * @param {Vector3} end - The end vector
	 * @param {number} radius - The capsule's radius.
	 * @return {Capsule} A reference to this capsule.
	 */
	set( start, end, radius ) {

		this.start.copy( start );
		this.end.copy( end );
		this.radius = radius;

		return this;

	}

	/**
	 * Copies the values of the given capsule to this instance.
	 *
	 * @param {Capsule} capsule - The capsule to copy.
	 * @return {Capsule} A reference to this capsule.
	 */
	copy( capsule ) {

		this.start.copy( capsule.start );
		this.end.copy( capsule.end );
		this.radius = capsule.radius;

		return this;

	}

	/**
	 * Returns the center point of this capsule.
	 *
	 * @param {Vector3} target - The target vector that is used to store the method's result.
	 * @return {Vector3} The center point.
	 */
	getCenter( target ) {

		return target.copy( this.end ).add( this.start ).multiplyScalar( 0.5 );

	}

	/**
	 * Adds the given offset to this capsule, effectively moving it in 3D space.
	 *
	 * @param {Vector3} v - The offset that should be used to translate the capsule.
	 * @return {Capsule} A reference to this capsule.
	 */
	translate( v ) {

		this.start.add( v );
		this.end.add( v );

		return this;

	}

	/**
	 * Returns `true` if the given bounding box intersects with this capsule.
	 *
	 * @param {Box3} box - The bounding box to test.
	 * @return {boolean} Whether the given bounding box intersects with this capsule.
	 */
	intersectsBox( box ) {

		return (
			checkAABBAxis(
				this.start.x, this.start.y, this.end.x, this.end.y,
				box.min.x, box.max.x, box.min.y, box.max.y,
				this.radius ) &&
			checkAABBAxis(
				this.start.x, this.start.z, this.end.x, this.end.z,
				box.min.x, box.max.x, box.min.z, box.max.z,
				this.radius ) &&
			checkAABBAxis(
				this.start.y, this.start.z, this.end.y, this.end.z,
				box.min.y, box.max.y, box.min.z, box.max.z,
				this.radius )
		);

	}

}

function checkAABBAxis( p1x, p1y, p2x, p2y, minx, maxx, miny, maxy, radius ) {

	return (
		( minx - p1x < radius || minx - p2x < radius ) &&
		( p1x - maxx < radius || p2x - maxx < radius ) &&
		( miny - p1y < radius || miny - p2y < radius ) &&
		( p1y - maxy < radius || p2y - maxy < radius )
	);

}

class Intersection {
    constructor() {
        this.point = new Vector3();
        this.normal = new Vector3();
        this.depth = 0;
    }
    set(point, normal, depth) {
        this.point.copy(point);
        this.normal.copy(normal);
        this.depth = depth;
    }
}

const EPSILON$2 = 1e-10;
const ab = new Vector3();
const ac = new Vector3();
const bc = new Vector3();
const ap = new Vector3();
const bp = new Vector3();
const cp = new Vector3();
const closestPoint = new Vector3();
const diff = new Vector3();
// Sphere vs Triangle
// 三角形上で、球の中心に最も近い点 (closestPoint) を求める。
// その点と中心の距離が半径以下なら交差。
//   out.point  : 三角形上の最近点
//   out.normal : 押し出し方向（最近点 → 中心 の単位ベクトル。フェイス内接触ならフェイス法線と一致）
//   out.depth  : 貫通量（正の値）= 半径 - 距離
// フェイス内・辺・頂点のどの領域で接触しても正しい法線・貫通量を返す。
//
// based on "Real-Time Collision Detection" (Christer Ericson) 5.1.5
function intersectsSphereTriangle(sphere, a, b, c, normal, out) {
    const p = sphere.center;
    // 三角形 (a, b, c) 上で p に最も近い点 closestPoint を求める
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    ap.subVectors(p, a);
    const d1 = ab.dot(ap);
    const d2 = ac.dot(ap);
    if (d1 <= 0 && d2 <= 0) {
        // 頂点 a の領域
        closestPoint.copy(a);
    }
    else {
        bp.subVectors(p, b);
        const d3 = ab.dot(bp);
        const d4 = ac.dot(bp);
        cp.subVectors(p, c);
        const d5 = ab.dot(cp);
        const d6 = ac.dot(cp);
        const vc = d1 * d4 - d3 * d2;
        const vb = d5 * d2 - d1 * d6;
        const va = d3 * d6 - d5 * d4;
        if (d3 >= 0 && d4 <= d3) {
            // 頂点 b の領域
            closestPoint.copy(b);
        }
        else if (d6 >= 0 && d5 <= d6) {
            // 頂点 c の領域
            closestPoint.copy(c);
        }
        else if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            // 辺 ab の領域
            const v = d1 / (d1 - d3);
            closestPoint.copy(a).addScaledVector(ab, v);
        }
        else if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            // 辺 ac の領域
            const w = d2 / (d2 - d6);
            closestPoint.copy(a).addScaledVector(ac, w);
        }
        else if (va <= 0 && (d4 - d3) >= 0 && (d5 - d6) >= 0) {
            // 辺 bc の領域
            const w = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            bc.subVectors(c, b);
            closestPoint.copy(b).addScaledVector(bc, w);
        }
        else {
            // フェイス内部の領域
            const denom = 1 / (va + vb + vc);
            const v = vb * denom;
            const w = vc * denom;
            closestPoint.copy(a).addScaledVector(ab, v).addScaledVector(ac, w);
        }
    }
    diff.subVectors(p, closestPoint);
    const distanceSquared = diff.lengthSq();
    if (distanceSquared > sphere.radius * sphere.radius) {
        return false;
    }
    const distance = Math.sqrt(distanceSquared);
    // 中心が三角形上にほぼ乗っている場合は方向が定まらないのでフェイス法線を使う
    if (distance <= EPSILON$2) {
        out.set(closestPoint, normal, sphere.radius);
        return true;
    }
    out.set(closestPoint, diff.divideScalar(distance), // 最近点 → 中心 の単位ベクトル
    sphere.radius - distance);
    return true;
}

const EPSILON$1 = 1e-10;
const vec3$1 = new Vector3();
const vec3_0 = new Vector3();
const vec3_1 = new Vector3();
const sphere$1 = new Sphere();
// based on https://github.com/mrdoob/three.js/blob/master/examples/jsm/math/Octree.js
//
// https://wickedengine.net/2020/04/26/capsule-collision-detection/
// we select the closest point on the capsule line to the triangle,
// place a sphere on that point and then perform the sphere – triangle test.
// also
// 5.1.10
const _v1 = new Vector3();
const _plane = new Plane();
const point1 = new Vector3();
const point2 = new Vector3();
function intersectsCapsuleTriangle(capsule, triangle, out) {
    // 線分長が 0 の退化カプセルは球として扱う（start === end のときの NaN を回避）
    if (capsule.start.distanceToSquared(capsule.end) <= EPSILON$1) {
        sphere$1.center.copy(capsule.start);
        sphere$1.radius = capsule.radius;
        return intersectsSphereTriangle(sphere$1, triangle.a, triangle.b, triangle.c, triangle.normal, out);
    }
    // based on three.js examples/jsm/math/Octree.js triangleCapsuleIntersect
    // 中心線の両端のフェイス平面からの符号付き距離（半径ぶん差し引く）
    triangle.getPlane(_plane);
    const d1 = _plane.distanceToPoint(capsule.start) - capsule.radius;
    const d2 = _plane.distanceToPoint(capsule.end) - capsule.radius;
    if (
    // 両端ともフェイスの表側（+法線側）で半径より遠い → 接触なし
    (d1 > 0 && d2 > 0) ||
        // 両端とも裏側（-法線側）を半径以上通り過ぎている → 接触なし
        // （床面と同じ高さの下向き面などで、上に居るキャラを真下へ押し出す誤検出を防ぐ）
        (d1 < -capsule.radius && d2 < -capsule.radius)) {
        return false;
    }
    // フェイス内部との接触:
    // 中心線上でフェイス平面に最も近づく点がフェイスの内側にあれば、面で接している。
    // （縦カプセル vs 縦壁のように中心線が面と平行でも正しく検出できる）
    const delta = Math.abs(d1 / (Math.abs(d1) + Math.abs(d2)));
    const intersectPoint = _v1.copy(capsule.start).lerp(capsule.end, delta);
    if (triangle.containsPoint(intersectPoint)) {
        out.set(intersectPoint, _plane.normal, // 押し出し方向 = フェイス法線
        Math.abs(Math.min(d1, d2)));
        return true;
    }
    // 辺との接触: 中心線と三角形の各辺の最近点間距離が半径以下なら、辺で接している。
    // もっとも深い（距離が最小の）辺を採用する。3辺は展開して書く（一時配列を作らない）。
    const radiusSquared = capsule.radius * capsule.radius;
    let minDistanceSquared = Infinity;
    minDistanceSquared = testEdge(capsule, triangle.a, triangle.b, radiusSquared, minDistanceSquared, out);
    minDistanceSquared = testEdge(capsule, triangle.b, triangle.c, radiusSquared, minDistanceSquared, out);
    minDistanceSquared = testEdge(capsule, triangle.c, triangle.a, radiusSquared, minDistanceSquared, out);
    return minDistanceSquared !== Infinity;
}
// カプセルの中心線と辺 (edgeStart, edgeEnd) の最近点間距離が半径以下で、
// かつこれまでの最小より近ければ out を更新する。採用したら「その距離^2」を、しなければ渡された値を返す。
function testEdge(capsule, edgeStart, edgeEnd, radiusSquared, minDistanceSquared, out) {
    nearestPointsOnLineSegments(capsule.start, capsule.end, edgeStart, edgeEnd, point1, point2);
    const distanceSquared = point1.distanceToSquared(point2);
    if (distanceSquared >= radiusSquared || distanceSquared >= minDistanceSquared)
        return minDistanceSquared;
    const distance = Math.sqrt(distanceSquared);
    out.set(point1, _v1.subVectors(point1, point2).divideScalar(distance || 1), // 辺 → 中心線 の単位ベクトル
    capsule.radius - distance);
    return distanceSquared;
}
// https://stackoverflow.com/a/67102941/1512272
function nearestPointsOnLineSegments(a0, a1, b0, b1, out0, out1) {
    const r = vec3$1.subVectors(b0, a0);
    const u = vec3_0.subVectors(a1, a0);
    const v = vec3_1.subVectors(b1, b0);
    const ru = r.dot(u);
    const rv = r.dot(v);
    const uu = u.dot(u);
    const uv = u.dot(v);
    const vv = v.dot(v);
    const det = uu * vv - uv * uv;
    let s, t;
    if (det < EPSILON$1 * uu * vv) {
        s = MathUtils.clamp(ru / uu, 0, 1);
        t = 0;
    }
    else {
        s = MathUtils.clamp((ru * vv - rv * uv) / det, 0, 1);
        t = MathUtils.clamp((ru * uv - rv * uu) / det, 0, 1);
    }
    const S = MathUtils.clamp((t * uv + ru) / uu, 0, 1);
    const T = MathUtils.clamp((s * uv - rv) / vv, 0, 1);
    out0.addVectors(a0, u.multiplyScalar(S));
    out1.addVectors(b0, v.multiplyScalar(T));
}

const vec3 = new Vector3();
const line = new Line3();
// https://arrowinmyknee.com/2021/03/15/some-math-about-capsule-collision/
function intersectsCapsuleSphere(capsule, sphere) {
    line.start.copy(capsule.start);
    line.end.copy(capsule.end);
    line.closestPointToPoint(sphere.center, true, vec3);
    const r = capsule.radius + sphere.radius;
    return vec3.distanceToSquared(sphere.center) <= r * r;
}

const FALL_VELOCITY = -20; // 自由落下、崖滑り時の下向きの速度。単位は m/s。
const JUMP_DURATION_SEC = 1; // ジャンプ弧の全長（秒）。
const LANDING_MIN_FALL_DURATION_SEC = 0.1; // 段差補正などの瞬間的な非接地を着地衝撃として扱わない。
const CLIMB_REMOUNT_COOLDOWN_SEC = 0.25; // 天面へマントル後、再取り付きを抑止する時間。縁で W 押しっぱなしのチラつき防止。
const MANTLE_DURATION_SEC = 0.2; // 上端から天面へ乗り移る（マントル）の所要時間。瞬間移動でカメラがカクつくのを防ぐ。
const CLIMB_ALIGN_SPEED_MPS = 6; // グラブ時に取り付き軸へ寄せる水平速度。1フレームの移動量を制限し、位置スナップを滑らかにする。
const PI_HALF$1 = Math.PI * 0.5;
const PI_ONE_HALF = Math.PI * 1.5;
const direction2D = new Vector2();
const wallNormal2D = new Vector2();
const groundingHead = new Vector3();
const groundingTo = new Vector3();
const groundContactPointTmp = new Vector3();
const groundContactPoint = new Vector3();
// const point1 = new Vector3();
// const point2 = new Vector3();
// const direction = new Vector3();
// const translateScoped = new Vector3();
const translate = new Vector3();
const _yAxis = new Vector3(0, 1, 0);
const STEP_EPS = 1e-4;
const stepProbeFrom = new Vector3();
const stepProbeTo = new Vector3();
const stepProbePoint = new Vector3();
const headroomFrom = new Vector3();
const headroomTo = new Vector3();
const capsule = new Capsule(new Vector3(), new Vector3(), 0);
const attachPoint = new Vector3();
const intersection = new Intersection();
// 縦線（真下・真上へ伸ばす線分）と三角形の交差判定の前段フィルタ。
// 三角形の bounding sphere の中心と縦線の xz 距離が半径より遠ければ、絶対に交差しない
// （三角形上のどの点も中心から半径以内なので、交点があればその xz 距離は半径以下になる）。
// bounding sphere を持たない三角形は判定できないので通す。
function isFarFromVerticalLine(triangle, x, z) {
    const boundingSphere = triangle.boundingSphere;
    if (!boundingSphere)
        return false;
    const dx = boundingSphere.center.x - x;
    const dz = boundingSphere.center.z - z;
    return dx * dx + dz * dz > boundingSphere.radius * boundingSphere.radius;
}
class CharacterController extends Body {
    get _slopeLimitCos() {
        return Math.cos(this.slopeLimit * MathUtils.DEG2RAD);
    }
    constructor({ radius, height, slopeLimit, stepOffset, groundCheckDepth, landingLockDuration, jumpDuration }) {
        super();
        this.isCharacterController = true;
        this.position = new Vector3();
        this.quaternion = new Quaternion(); // 向き（利用側がメッシュへ同期する）
        this.groundCheckDepth = .3; // 接地したまま降りられる段差の上限。stepOffset 以上が望ましい（登り降り対称）
        this.slopeLimit = 50; // 度。これより急な面は登れず滑り落ちる（Unity の slopeLimit 相当）
        this.stepOffset = 0.3; // これ以下の高さの段差は自動で登る（0 で無効・Unity の stepOffset 相当）
        this.landingLockDuration = 0.2; // ジャンプ・自由落下から着地した直後、移動・ジャンプ入力を抑止する時間（秒）
        this.jumpDuration = JUMP_DURATION_SEC; // ジャンプ弧の全長（秒）。大きいほど高く長く跳ぶ。既定は定数 JUMP_DURATION_SEC
        this.carryRotation = true; // true のとき、乗っている回転床の yaw に合わせて自分の向きも回す（既定 on）
        this.isGrounded = false;
        this.isOnSlope = false;
        this.isIdling = false;
        this.isRunning = false; // 派生状態: move() で移動が指定されているとき true
        this.isJumping = false;
        this.isLanding = false;
        this.isClimbing = false; // 梯子・壁面に貼り付いて登っている間 true。重力・ジャンプ・接地をバイパスする
        this.velocity = new Vector3(0, 0, 0);
        this.groundHeight = 0;
        this.groundNormal = new Vector3();
        this.groundBody = null; // 接地している床の所有ボディ（動床なら KinematicBody）。無ければ null
        this._currentJumpPower = 0;
        this._isStepping = false; // 段差登り中フラグ（壁接触が一時的に消えても登りを継続させるラッチ）
        this._nearTriangles = [];
        // このステップの接触。配列は使い回し（毎ステップの確保を避ける）で、有効なのは
        // 先頭 _contactCount 件だけ。それより後ろには前のステップの残骸が入っている。
        this._contactInfo = [];
        this._contactCount = 0;
        this._moveVelocity = new Vector3(); // move() で設定する望む水平速度
        this._climbInput = new Vector2(); // climb() で設定する登り入力（x=横, y=上）
        this._nearClimbables = []; // World が渡す近傍の登れる領域
        this._activeClimbable = null; // 現在貼り付いている領域
        this._climbMountCooldown = 0; // 天面へマントルした直後、再取り付きを抑止する残り時間（秒）
        this._isMantling = false; // 上端→天面へ乗り移り中（数フレームかけて滑らかに前進）
        this._mantleRemaining = 0; // マントルで前進する残り距離（m）
        this._externalVelocity = new Vector3(); // 動床から離れる際に引き継いだ水平慣性（着地までの drift）
        this._facingAngle = 0; // 向き（移動方向から算出）
        this._jumpElapsed = 0; // ジャンプ開始からの経過（秒）。deltaTime を積算
        this._landingTimeRemaining = 0;
        this._fallElapsed = 0;
        if (slopeLimit !== undefined)
            this.slopeLimit = slopeLimit;
        if (stepOffset !== undefined)
            this.stepOffset = stepOffset;
        if (groundCheckDepth !== undefined)
            this.groundCheckDepth = groundCheckDepth;
        if (landingLockDuration !== undefined)
            this.landingLockDuration = Math.max(0, landingLockDuration);
        if (jumpDuration !== undefined)
            this.jumpDuration = jumpDuration;
        this.radius = radius;
        // カプセルの全高（先端から先端まで）。幾何学的に最小でも球の直径（2 * radius）
        this.height = Math.max(height, radius * 2);
        this.position.set(0, 0, 0);
        let isFirstUpdate = true;
        let wasGrounded = false;
        let wasOnSlope = false;
        // let wasIdling = false;
        let wasRunning = false;
        let wasJumping = false;
        this._events = (deltaTime) => {
            if (!this.isGrounded && !this.isJumping && !this.isOnSlope)
                this._fallElapsed += deltaTime;
            // 初回のみ、過去状態を作るだけで終わり
            if (isFirstUpdate) {
                isFirstUpdate = false;
                wasGrounded = this.isGrounded;
                wasOnSlope = this.isOnSlope;
                // wasIdling   = this.isIdling;
                wasRunning = this.isRunning;
                wasJumping = this.isJumping;
                return;
            }
            const startedLanding = !wasGrounded &&
                this.isGrounded &&
                !this.isOnSlope &&
                (wasJumping || LANDING_MIN_FALL_DURATION_SEC <= this._fallElapsed);
            if (startedLanding) {
                this.isIdling = false;
                this.isLanding = 0 < this.landingLockDuration;
                this._landingTimeRemaining = this.landingLockDuration;
                this.isRunning = !this.isLanding && this._moveVelocity.lengthSq() > 1e-8;
                if (this.isLanding) {
                    this.velocity.x = 0;
                    this.velocity.z = 0;
                }
                this.dispatchEvent({ type: 'startLanding' });
                if (!this.isLanding)
                    this.dispatchEvent({ type: 'endLanding' });
            }
            else if (!this.isLanding && !wasRunning && !this.isRunning && this.isGrounded && !this.isIdling) {
                this.isIdling = true;
                this.dispatchEvent({ type: 'startIdling' });
            }
            else if (!this.isLanding && ((!wasRunning && this.isRunning && !this.isJumping && this.isGrounded) ||
                (!wasGrounded && this.isGrounded && this.isRunning) ||
                (wasOnSlope && !this.isOnSlope && this.isRunning && this.isGrounded))) {
                this.isIdling = false;
                this.dispatchEvent({ type: 'startWalking' });
            }
            else if (!wasJumping && this.isJumping) {
                this.isIdling = false;
                this.dispatchEvent({ type: 'startJumping' });
            }
            else if (!wasOnSlope && this.isOnSlope) {
                this.dispatchEvent({ type: 'startSliding' });
            }
            else if (wasGrounded && !this.isGrounded && !this.isJumping) {
                this.dispatchEvent({ type: 'startFalling' });
            }
            wasGrounded = this.isGrounded;
            wasOnSlope = this.isOnSlope;
            // wasIdling   = this.isIdling;
            // landingLockDuration=0 でも、次の更新で現在の入力に応じた歩行／待機イベントへ遷移させる。
            wasRunning = startedLanding ? false : this.isRunning;
            wasJumping = this.isJumping;
            if (this.isGrounded)
                this._fallElapsed = 0;
        };
    }
    setNearTriangles(nearTriangles) {
        this._nearTriangles = nearTriangles;
    }
    setNearClimbables(nearClimbables) {
        this._nearClimbables = nearClimbables;
    }
    /**
     * 登り入力を指定する（梯子・壁面に貼り付いている間だけ効く）。
     * x = 横（面に平行、フリークライム用）、y = 上（前方入力を上下へ写す）。範囲は概ね [-1, 1]。
     * 停止させるにはゼロベクトルを渡す。登り中でないときは無視される。
     */
    climb(input) {
        this._climbInput.set(input.x, input.y);
    }
    /**
     * 望む水平移動速度をワールド座標で指定する（Unity CharacterController.Move / Godot velocity 相当）。
     * y 成分は無視する（上下は重力・ジャンプ・接地が扱う）。次に move() を呼ぶまで保持される。
     * 停止させるにはゼロベクトルを渡す。
     */
    move(velocity) {
        this._moveVelocity.set(velocity.x, 0, velocity.z);
        this.isRunning = !this.isLanding && this._moveVelocity.lengthSq() > 1e-8;
        // 向きは移動方向に合わせる（移動している間のみ更新）
        if (this.isRunning)
            this._facingAngle = Math.atan2(-this._moveVelocity.x, -this._moveVelocity.z);
    }
    /**
     * 動く床から離れる瞬間に、その床の水平速度を慣性として引き継ぐ（着地するまで保持）。
     * Godot の platform_on_leave（ADD_VELOCITY）/ Unreal の impart base velocity 相当。
     * y 成分は無視する（ジャンプ弧と干渉させない）。World が離脱を検出して呼ぶ。
     */
    inheritVelocity(velocity) {
        this._externalVelocity.set(velocity.x, 0, velocity.z);
    }
    /**
     * 向き（facing）を deltaAngle[rad] だけ回す。回転床の運搬で World が呼ぶ（carryRotation 時）。
     * 移動入力があるフレームは move() が向きを上書きするので、実質は静止時に効く。
     */
    rotateFacing(deltaAngle) {
        this._facingAngle += deltaAngle;
    }
    update(deltaTime) {
        this._updateLanding(deltaTime);
        if (this._climbMountCooldown > 0)
            this._climbMountCooldown = Math.max(0, this._climbMountCooldown - deltaTime);
        // 登り中は専用ループ（重力・接地・ジャンプをバイパスし、面に沿って動かす）
        if (this.isClimbing) {
            this._updateClimb(deltaTime);
            return;
        }
        // 梯子に取り付けるか判定（領域に重なり、入力が面へ向かっていれば取り付く）
        this._tryStartClimb();
        if (this.isClimbing) {
            this._updateClimb(deltaTime);
            return;
        }
        // 状態をリセットしておく
        this.isGrounded = false;
        this.isOnSlope = false;
        this.groundHeight = -Infinity;
        this.groundNormal.set(0, 1, 0);
        this.groundBody = null;
        this._checkGround();
        this._updateJumping(deltaTime);
        this._updatePosition(deltaTime);
        this._collisionDetection();
        this._solvePosition();
        this._updateVelocity();
        this._events(deltaTime);
    }
    _updateVelocity() {
        let isHittingCeiling = false;
        this.velocity.set(this.isLanding ? 0 : this._moveVelocity.x, FALL_VELOCITY, this.isLanding ? 0 : this._moveVelocity.z);
        // 急勾配や自由落下など、自動で付与される速度の処理
        if (this._contactCount === 0 && !this.isJumping) {
            // 何とも衝突していないので、自由落下
            return;
        }
        else if (this.isGrounded && !this.isOnSlope && !this.isJumping) {
            // 通常の地面上にいる場合、ただしジャンプ開始時は除く
            this.velocity.y = 0;
        }
        else if (this.isOnSlope) {
            const horizontalSpeed = 20 / (1 - this.groundNormal.y) * 0.2;
            this.velocity.x = this.groundNormal.x * horizontalSpeed;
            this.velocity.y = FALL_VELOCITY;
            this.velocity.z = this.groundNormal.z * horizontalSpeed;
        }
        else if (!this.isGrounded && !this.isOnSlope && this.isJumping) {
            // ジャンプの処理
            this.velocity.y = this._currentJumpPower * -FALL_VELOCITY;
        }
        // 壁に向かった場合、壁方向の速度を0にする処理
        // vs walls and sliding on the wall
        direction2D.set(this.velocity.x, this.velocity.z);
        // const frontAngle = Math.atan2( direction2D.y, direction2D.x );
        const negativeFrontAngle = Math.atan2(-direction2D.y, -direction2D.x);
        for (let i = 0, l = this._contactCount; i < l; i++) {
            const normal = this._contactInfo[i].triangle.normal;
            // var distance = this._contactInfo[ i ].distance;
            if (this._slopeLimitCos < normal.y || this.isOnSlope) {
                // フェイスは地面なので、壁としての衝突の可能性はない。
                // 速度の減衰はしないでいい
                continue;
            }
            if (!isHittingCeiling && normal.y < 0) {
                isHittingCeiling = true;
            }
            wallNormal2D.set(normal.x, normal.z).normalize();
            const wallAngle = Math.atan2(wallNormal2D.y, wallNormal2D.x);
            if (Math.abs(negativeFrontAngle - wallAngle) >= PI_HALF$1 && //  90deg
                Math.abs(negativeFrontAngle - wallAngle) <= PI_ONE_HALF // 270deg
            ) {
                // フェイスは進行方向とは逆方向、要は背中側の壁なので
                // 速度の減衰はしないでいい
                continue;
            }
            // 上記までの条件に一致しなければ、フェイスは壁
            // 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする
            wallNormal2D.set(direction2D.dot(wallNormal2D) * wallNormal2D.x, direction2D.dot(wallNormal2D) * wallNormal2D.y);
            direction2D.sub(wallNormal2D);
            this.velocity.x = direction2D.x;
            this.velocity.z = direction2D.y;
        }
        // ジャンプ中に天井にぶつかったら、ジャンプを中断する
        if (isHittingCeiling) {
            this.velocity.y = Math.min(0, this.velocity.y);
            this.isJumping = false;
        }
        // 動床から引き継いだ慣性（drift）: 接地したらクリア、空中では水平に加算し続ける
        if (this.isGrounded) {
            this._externalVelocity.set(0, 0, 0);
        }
        else {
            this.velocity.x += this._externalVelocity.x;
            this.velocity.z += this._externalVelocity.z;
        }
    }
    _checkGround() {
        // "頭上からほぼ無限に下方向までの線 (segment)" vs "フェイス (triangle)" の
        // 交差判定を行う
        // もし、フェイスとの交差点が「頭上」から「下 groundCheckDepth」までの間だったら
        // 地面上 (isGrounded) にいることとみなす
        //
        //   ___
        //  / | \
        // |  |  | player sphere
        //  \_|_/
        //    |
        //---[+]---- ground
        //    |
        //    |
        //    | segment (player's head to almost -infinity)
        let groundContact = null;
        const triangles = this._nearTriangles;
        groundingHead.set(this.position.x, this.position.y + this.height, this.position.z);
        groundingTo.set(this.position.x, this.position.y - 1e1, this.position.z);
        for (let i = 0, l = triangles.length; i < l; i++) {
            const triangle = triangles[i];
            // 壁・天井は接地処理では無視
            if (triangle.normal.y <= 0)
                continue;
            // 真下への線分から xz が離れている三角形は交差しえない
            if (isFarFromVerticalLine(triangle, this.position.x, this.position.z))
                continue;
            const isIntersected = intersectsLineTriangle(groundingHead, groundingTo, triangle.a, triangle.b, triangle.c, groundContactPointTmp);
            if (!isIntersected)
                continue;
            if (!groundContact) {
                groundContactPoint.copy(groundContactPointTmp);
                groundContact = {
                    point: groundContactPoint,
                    ground: triangle,
                };
                continue;
            }
            if (groundContactPointTmp.y <= groundContact.point.y)
                continue;
            groundContactPoint.copy(groundContactPointTmp);
            groundContact = {
                point: groundContactPoint,
                ground: triangle,
            };
        }
        if (!groundContact)
            return;
        this.groundHeight = groundContact.point.y;
        this.groundNormal.copy(groundContact.ground.normal);
        // その他、床の属性を追加で取得する場合はここで
        const top = groundingHead.y;
        const bottom = this.position.y - this.groundCheckDepth;
        // ジャンプ中、かつ上方向に移動中だったら、強制接地しない
        if (this.isJumping && 0 < this._currentJumpPower) {
            this.isOnSlope = false;
            this.isGrounded = false;
            this._isStepping = false;
            return;
        }
        // 低い段差を groundHeight に反映（接地スナップで滑らかに登る）
        this._stepLookAhead();
        this.isGrounded = (bottom <= this.groundHeight && this.groundHeight <= top);
        this.isOnSlope = (this.groundNormal.y <= this._slopeLimitCos);
        if (this.isGrounded) {
            this.isJumping = false;
            // 乗っている床の所有ボディを覚える（動床の運搬判定に使う）
            this.groundBody = groundContact.ground.body;
        }
    }
    // 低い段差 (<= stepOffset) を自動で登る（Unity CharacterController.stepOffset 相当）。
    // 進行方向を塞ぐ壁があるとき、前縁の少し先・上（stepOffset 以内）に歩ける面があれば、
    // それを groundHeight として採用する。接地スナップ（_updatePosition）が y を段差へ
    // 滑らかに持ち上げ、その高さでは段差の垂直面がクリアされるので前進できる。
    //
    // ラッチ (_isStepping): 持ち上げると壁接触が一瞬消えてゲートが外れてしまうため、
    // 「一度登り始めたら、前方に段差が無くなる（＝上面に乗り切る）まで登りを継続」する。
    // 連続斜面では壁接触が起きないので発動しない（斜面で浮かせない）。
    _stepLookAhead() {
        if (this.stepOffset <= 0 || this.isLanding)
            return;
        // 望む入力方向を使う（velocity は壁ずりで壁方向成分が 0 にされるため段差判定に使えない）
        const vx = this._moveVelocity.x;
        const vz = this._moveVelocity.z;
        const hSq = vx * vx + vz * vz;
        if (hSq < 1e-8) {
            this._isStepping = false;
            return;
        } // 水平移動していない
        const walkableCos = this._slopeLimitCos;
        // 進行方向を塞ぐ「壁」接触が（直前フレームに）あるか
        let wallAhead = false;
        for (let i = 0, l = this._contactCount; i < l; i++) {
            const n = this._contactInfo[i].triangle.normal;
            if (n.y > walkableCos)
                continue; // 歩ける面は壁ではない
            if (vx * n.x + vz * n.z < 0) {
                wallAhead = true;
                break;
            } // 進行方向に対向する面
        }
        // 壁に当たったら登り開始。登り中は壁が一瞬消えても継続（ラッチ）
        if (!wallAhead && !this._isStepping)
            return;
        const foot = this.position.y;
        // カプセル前縁（進行方向へ radius）の真下で、足元〜stepOffset の歩ける面の最高点を探す
        const inv = this.radius / Math.sqrt(hSq);
        const px = this.position.x + vx * inv;
        const pz = this.position.z + vz * inv;
        stepProbeFrom.set(px, foot + this.stepOffset + STEP_EPS, pz);
        stepProbeTo.set(px, foot - STEP_EPS, pz);
        let stepTop = -Infinity;
        let stepTriangle = null;
        const triangles = this._nearTriangles;
        for (let i = 0, l = triangles.length; i < l; i++) {
            const triangle = triangles[i];
            if (triangle.normal.y <= walkableCos)
                continue; // 歩ける面のみ
            if (isFarFromVerticalLine(triangle, px, pz))
                continue;
            if (!intersectsLineTriangle(stepProbeFrom, stepProbeTo, triangle.a, triangle.b, triangle.c, stepProbePoint))
                continue;
            if (stepProbePoint.y > stepTop) {
                stepTop = stepProbePoint.y;
                stepTriangle = triangle;
            }
        }
        // 現在の地面より高い段差で、かつ stepOffset 以内でなければ登れない（＝壁のまま）
        const valid = (stepTop > this.groundHeight + STEP_EPS) && (stepTop - foot <= this.stepOffset);
        if (!valid) {
            this._isStepping = false;
            return;
        }
        // 頭上チェック: 持ち上げでカプセル頭が天井等に当たるなら登らない
        headroomFrom.set(this.position.x, foot + this.height, this.position.z);
        headroomTo.set(this.position.x, stepTop + this.height, this.position.z);
        for (let i = 0, l = triangles.length; i < l; i++) {
            const triangle = triangles[i];
            if (isFarFromVerticalLine(triangle, this.position.x, this.position.z))
                continue;
            if (intersectsLineTriangle(headroomFrom, headroomTo, triangle.a, triangle.b, triangle.c, stepProbePoint)) {
                this._isStepping = false;
                return;
            }
        }
        this._isStepping = true;
        this.groundHeight = stepTop;
        if (stepTriangle)
            this.groundNormal.copy(stepTriangle.normal);
    }
    _updatePosition(deltaTime) {
        // 壁などを無視してひとまず(速度 * 時間)だけ
        // position の座標を進める
        // 壁との衝突判定はこのこの後のステップで行うのでここではやらない
        // もし isGrounded 状態なら、強制的に y の値を地面に合わせる
        this.position.set(this.position.x + this.velocity.x * deltaTime, this.isGrounded ? this.groundHeight : this.position.y + this.velocity.y * deltaTime, this.position.z + this.velocity.z * deltaTime);
    }
    _collisionDetection() {
        // プレイヤーのカプセルを現在の position から作る
        // start: 下半球の中心、end: 上半球の中心
        const segment = this.height - this.radius * 2;
        capsule.start.set(this.position.x, this.position.y + this.radius, this.position.z);
        capsule.end.set(this.position.x, this.position.y + this.radius + segment, this.position.z);
        capsule.radius = this.radius;
        // 交差していそうなフェイス (nearTriangles) のリストから、
        // 実際に交差している壁フェイスを抜き出して
        // this._contactInfo に追加する
        const triangles = this._nearTriangles;
        this._contactCount = 0;
        for (let i = 0, l = triangles.length; i < l; i++) {
            const triangle = triangles[i];
            if (!triangle.boundingSphere)
                triangle.computeBoundingSphere();
            if (!intersectsCapsuleSphere(capsule, triangle.boundingSphere))
                continue;
            const isIntersected = intersectsCapsuleTriangle(capsule, triangle, intersection);
            if (!isIntersected)
                continue;
            // 接触は使い回しのインスタンスへ書き込む（毎ステップ生成すると数 KB/frame のゴミになる）
            let contact = this._contactInfo[this._contactCount];
            if (!contact) {
                contact = { point: new Vector3(), normal: new Vector3(), depth: 0, triangle };
                this._contactInfo[this._contactCount] = contact;
            }
            contact.point.copy(intersection.point);
            contact.normal.copy(intersection.normal);
            contact.depth = intersection.depth;
            contact.triangle = triangle;
            this._contactCount++;
        }
    }
    _solvePosition() {
        // updatePosition() で position を動かした後
        // 壁と衝突し食い込んでいる場合、
        // ここで壁の外への押し出しをする
        if (this._contactCount === 0) {
            // 何とも衝突していない。position はそのまま、向きだけ更新して終了
            this._updateQuaternion();
            return;
        }
        // vs walls and sliding on the wall
        // 壁に食い込んでいる分だけ、法線方向に押し出す（デペネトレーション）。
        // これを毎ステップ行うことで、斜め・側面から高速で進入しても壁を貫通しない。
        translate.set(0, 0, 0);
        for (let i = 0, l = this._contactCount; i < l; i++) {
            const contact = this._contactInfo[i];
            const normal = contact.triangle.normal;
            if (this._slopeLimitCos < normal.y) {
                // this triangle is a ground or slope, not a wall or ceil
                // フェイスは急勾配でない坂、つまり地面。
                // 接地の処理は updatePosition() 内で解決しているので無視する
                continue;
            }
            // フェイスは急勾配な坂か否か
            const isSlopeFace = (this._slopeLimitCos <= normal.y && normal.y < 1);
            // ジャンプ降下中に、急勾配な坂に衝突したらジャンプ終わり
            if (this.isJumping && 0 >= this._currentJumpPower && isSlopeFace) {
                this.isJumping = false;
                this.isGrounded = true;
                // console.log( 'jump end' );
            }
            // 壁・天井: 貫通量 (contact.depth) を「最近点 → 中心」の接触法線方向へ押し出す。
            // フェイス法線ではなく接触法線を使うことで、壁の辺・角に当たったときも
            // 正しく壁の外側へ押し出される（フェイス法線だと角で横方向に弾かれ貫通する）。
            // すでに translate で押し出した分を差し引き、二重押し出しを避ける。
            const pushNormal = contact.normal;
            const remaining = contact.depth - translate.dot(pushNormal);
            if (0 < remaining)
                translate.addScaledVector(pushNormal, remaining);
        }
        this.position.add(translate);
        // 安全策: 接地しているなら、壁の押し出しによって地面より下へ沈み込ませない（床抜け防止）
        if (this.isGrounded && this.position.y < this.groundHeight)
            this.position.y = this.groundHeight;
        this._updateQuaternion();
    }
    // 向き（facingAngle）を quaternion へ反映する。position と合わせて利用側がメッシュに同期する。
    // 旧実装の object.rotation.y = facingAngle + π と等価。
    _updateQuaternion() {
        this.quaternion.setFromAxisAngle(_yAxis, this._facingAngle + Math.PI);
    }
    // 近傍の梯子に取り付けるか判定する。取り付き方は 2 通り:
    //  1) 下・側面から: 面へ向かって（into）押し、足元が上端より下 → 掴んで登る（fromTop=false）。
    //  2) 天面から:     上端付近に立ち、縁へ向かって（外向き faceDirection）押す → 掴んで降りる（fromTop=true）。
    // （フリークライム mode:'free' は Phase B で対応。ここでは 'ladder' のみ扱う）
    _tryStartClimb() {
        // ジャンプ中・自由落下中でも掴める（空中グラブ）。飛び降り直後の即・再グラブは
        // クールダウン（jump() で設定）で抑止する。
        if (this._nearClimbables.length === 0 || this.isLanding || this._climbMountCooldown > 0)
            return;
        for (let i = 0, l = this._nearClimbables.length; i < l; i++) {
            const climbable = this._nearClimbables[i];
            if (climbable.mode !== 'ladder')
                continue;
            const into = climbable.intoDirection;
            const mvDotInto = this._moveVelocity.x * into.x + this._moveVelocity.z * into.z;
            // 下・側面から登る: 面へ向かって入力し、上端の縁より下にいる
            if (mvDotInto > 0 && this._overlapsClimbBody(climbable)) {
                this._startClimb(climbable, false);
                return;
            }
            // 天面から降りる: 縁（外向き）へ向かって入力し、上端付近に立っている
            if (mvDotInto < 0 && this._isAtopClimbable(climbable)) {
                this._startClimb(climbable, true);
                return;
            }
        }
    }
    // キャラの足元が梯子の胴体（上端の縁より下）に重なっているか。水平は radius ぶんの余裕を持つ。
    _overlapsClimbBody(climbable) {
        const box = climbable.box;
        const r = this.radius;
        const px = this.position.x;
        const py = this.position.y;
        const pz = this.position.z;
        if (px < box.min.x - r || px > box.max.x + r)
            return false;
        if (pz < box.min.z - r || pz > box.max.z + r)
            return false;
        // 上端（天面）に立っている／それより上にいるときは、この判定では掴まない。
        // これがないと、上端でマントルした直後に「面へ向かう入力」が再取り付きを誘発し、
        // 掴む → 即マントル → 掴む… を繰り返してガクガクする。天面からの降りは _isAtopClimbable が扱う。
        if (py < box.min.y - this.height || py > box.max.y - r)
            return false;
        return true;
    }
    // キャラが梯子の上端（天面）付近に立ち、水平に梯子と重なっているか（天面から降りる取り付き用）。
    _isAtopClimbable(climbable) {
        const box = climbable.box;
        const r = this.radius;
        const px = this.position.x;
        const py = this.position.y;
        const pz = this.position.z;
        if (px < box.min.x - r || px > box.max.x + r)
            return false;
        if (pz < box.min.z - r || pz > box.max.z + r)
            return false;
        // 足元が上端（box.max.y）付近にある = 天面に立っている
        if (Math.abs(py - box.max.y) > r)
            return false;
        return true;
    }
    _startClimb(climbable, fromTop) {
        this.isClimbing = true;
        this._activeClimbable = climbable;
        // 接地・ジャンプ系の状態を解除する
        this.isGrounded = false;
        this.isOnSlope = false;
        this.isJumping = false;
        this.isRunning = false;
        this.isIdling = false;
        this.groundBody = null;
        this._currentJumpPower = 0;
        this._isStepping = false;
        this._externalVelocity.set(0, 0, 0);
        this._climbInput.set(0, 0);
        // 天面から取り付いたら、上端の高さから始める
        if (fromTop)
            this.position.y = climbable.box.max.y;
        // 面へ正対する
        const into = climbable.intoDirection;
        this._facingAngle = Math.atan2(-into.x, -into.z);
        this._updateQuaternion();
        this.dispatchEvent({ type: 'startClimbing' });
    }
    // 登り中の移動。梯子は 1D（上下のみ）。横位置は軸へロックする。
    // 上端に達したら天面へ乗り移り（マントル）、下端に達したら接地して離脱する。
    _updateClimb(deltaTime) {
        const climbable = this._activeClimbable;
        const box = climbable.box;
        // 天面への乗り移り中は、軸ロックせず滑らかに前進させる
        if (this._isMantling) {
            this._updateMantle(deltaTime);
            return;
        }
        // 横位置を梯子の取り付き軸へ寄せて面へ正対し続ける。初回グラブ時の位置スナップを
        // 1 フレームでやらず、移動量を制限して滑らかに寄せる（カメラのカクつき防止）。
        // 軸に乗り切ったあとは毎フレーム目標＝現在位置となり、そのまま軸上にロックされる。
        climbable.getAttachPoint(attachPoint, this.radius);
        this._approachHorizontally(attachPoint.x, attachPoint.z, CLIMB_ALIGN_SPEED_MPS * deltaTime);
        const into = climbable.intoDirection;
        this._facingAngle = Math.atan2(-into.x, -into.z);
        this._updateQuaternion();
        // 前方入力（y）を上下速度へ写す（W=前=上 / S=後=下、カメラ非依存で一貫）。
        const verticalSpeed = this._climbInput.y * climbable.speed;
        const nextY = this.position.y + verticalSpeed * deltaTime;
        // 下端: 下方向に降りて底へ着いたら接地状態へ戻して離脱する。
        // （静止時や base ちょうどでの誤離脱を避けるため「降下中」に限定する）
        if (verticalSpeed < 0 && nextY <= box.min.y) {
            this.position.y = box.min.y;
            this.velocity.set(0, 0, 0);
            this._endClimb();
            return;
        }
        // 上端: 上方向に登り切ったら、天面へ乗り移る（マントル）を開始する。
        // 面の向こう側へ radius*2 進むと天面に乗り、次フレームの接地判定が拾う。
        // 瞬間移動するとカメラがカクつくため、_updateMantle で数フレームに分けて滑らかに前進させる。
        if (verticalSpeed > 0 && nextY >= box.max.y) {
            this.position.y = box.max.y;
            this._isMantling = true;
            this._mantleRemaining = this.radius * 2;
            return;
        }
        // 梯子の範囲内へクランプ（静止時は現在高度を保持して貼り付き続ける）
        this.position.y = MathUtils.clamp(nextY, box.min.y, box.max.y);
        this.velocity.set(0, verticalSpeed, 0);
    }
    // 現在の水平位置を目標 (targetX, targetZ) へ、1 フレームの移動量を maxStep に制限して寄せる。
    // 目標との距離が maxStep 以下ならその場で到達させる（以後は目標＝現在位置でロック）。
    _approachHorizontally(targetX, targetZ, maxStep) {
        const dx = targetX - this.position.x;
        const dz = targetZ - this.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist <= maxStep || dist < 1e-6) {
            this.position.x = targetX;
            this.position.z = targetZ;
            return;
        }
        const t = maxStep / dist;
        this.position.x += dx * t;
        this.position.z += dz * t;
    }
    // 天面への乗り移り（マントル）。上端の高さを保ったまま into 方向へ一定速度で前進し、
    // radius*2 進み切ったら登りを終える。瞬間移動を避けてカメラのカクつきを防ぐ。
    _updateMantle(deltaTime) {
        const climbable = this._activeClimbable;
        const into = climbable.intoDirection;
        const speed = this.radius * 2 / MANTLE_DURATION_SEC;
        const move = Math.min(speed * deltaTime, this._mantleRemaining);
        this.position.x += into.x * move;
        this.position.z += into.z * move;
        this.position.y = climbable.box.max.y;
        this._mantleRemaining -= move;
        this.velocity.set(into.x * speed, 0, into.z * speed);
        if (this._mantleRemaining <= 1e-6) {
            this._endClimb();
            // 天面へ抜けた直後は、縁へ向かう入力を押し続けても即・再取り付きしないよう少し抑止する
            this._climbMountCooldown = CLIMB_REMOUNT_COOLDOWN_SEC;
        }
    }
    _endClimb() {
        if (!this.isClimbing)
            return;
        this.isClimbing = false;
        this._activeClimbable = null;
        this._isMantling = false;
        this._mantleRemaining = 0;
        this._climbInput.set(0, 0);
        this.dispatchEvent({ type: 'endClimbing' });
    }
    jump() {
        // 登り中のジャンプは「壁から離脱して外向きへポップ」する
        if (this.isClimbing) {
            const climbable = this._activeClimbable;
            this._endClimb();
            this._jumpElapsed = 0;
            this._currentJumpPower = 1;
            this.isJumping = true;
            // 外向き（faceDirection）へ水平慣性を与える。空中の drift として着地まで効く
            if (climbable)
                this._externalVelocity.set(climbable.faceDirection.x * climbable.speed, 0, climbable.faceDirection.z * climbable.speed);
            // 飛び降りた直後に（空中グラブで）即・再取り付きしないよう少し抑止する
            this._climbMountCooldown = CLIMB_REMOUNT_COOLDOWN_SEC;
            return;
        }
        if (this.isLanding || this.isJumping || !this.isGrounded || this.isOnSlope)
            return;
        this._jumpElapsed = 0;
        this._currentJumpPower = 1;
        this.isJumping = true;
    }
    _updateJumping(deltaTime) {
        if (!this.isJumping)
            return;
        // 経過時間を deltaTime で積算する（実時計 performance.now に依存しない＝決定論的）。
        // コサイン弧の形は従来と同一で、60fps 実行時は旧実装と一致する。
        this._jumpElapsed += deltaTime;
        const progress = this._jumpElapsed / this.jumpDuration;
        this._currentJumpPower = Math.cos(Math.min(progress, 1) * Math.PI);
    }
    _updateLanding(deltaTime) {
        if (!this.isLanding)
            return;
        this._landingTimeRemaining = Math.max(0, this._landingTimeRemaining - deltaTime);
        if (0 < this._landingTimeRemaining)
            return;
        this.isLanding = false;
        this.isRunning = this._moveVelocity.lengthSq() > 1e-8;
        if (this.isRunning)
            this._facingAngle = Math.atan2(-this._moveVelocity.x, -this._moveVelocity.z);
        this.dispatchEvent({ type: 'endLanding' });
    }
    teleport(position) {
        this._endClimb();
        this.position.copy(position);
        this.isLanding = false;
        this._landingTimeRemaining = 0;
        this._fallElapsed = 0;
        this.isRunning = this._moveVelocity.lengthSq() > 1e-8;
    }
    dispose() {
        this._nearTriangles.length = 0;
        this._nearClimbables.length = 0;
        this._contactInfo.length = 0;
        this._contactCount = 0;
    }
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
class ClimbableBody extends Body {
    constructor({ mode, box, faceDirection, speed }) {
        super();
        this.isClimbableBody = true;
        this.faceDirection = new Vector3(0, 0, 1); // 外向き（プレイヤー側）水平法線
        this.intoDirection = new Vector3(0, 0, -1); // 面へ向かう方向（faceDirection の逆）
        this.mode = mode;
        this.box = box;
        this.speed = speed !== undefined ? speed : 3;
        if (faceDirection) {
            // 水平成分のみを正規化して保持する（up は Y 固定）
            this.faceDirection.set(faceDirection.x, 0, faceDirection.z).normalize();
        }
        this.intoDirection.copy(this.faceDirection).multiplyScalar(-1);
    }
    /**
     * 梯子への取り付き点（水平）を返す。外向き面の中心から radius だけ外へ出した位置で、
     * 横（面に平行な軸）は領域中心へロックする。target に書き込んで返す。
     */
    getAttachPoint(target, radius) {
        this.box.getCenter(_center);
        const halfX = (this.box.max.x - this.box.min.x) * 0.5;
        const halfZ = (this.box.max.z - this.box.min.z) * 0.5;
        target.x = _center.x + this.faceDirection.x * (halfX + radius);
        target.z = _center.z + this.faceDirection.z * (halfZ + radius);
        target.y = 0;
        return target;
    }
}

const sphere = new Sphere();
const _staticQuerySphere = new Sphere();
const _leaveVelocity = new Vector3();
// 巨大な deltaTime（タブ復帰・ブレークポイント復帰など）で追いつき処理が暴走
// （spiral of death）しないよう、1回の update で進める固定ステップ数の上限。
const MAX_CATCH_UP_FRAMES = 5;
// 静的ジオメトリの broad-phase をフレーム先頭で1回だけ引くときに、1フレーム分の移動を
// 包むために半径へ足す余裕の下限（m）。速度から算出した余裕がこれ未満ならこの値を使う。
const STATIC_QUERY_PADDING_MIN = 0.1;
class World {
    constructor({ fps = 60, stepsPerFrame = 4 } = {}) {
        this._staticBodies = [];
        this._kinematicBodies = [];
        this._characterControllers = [];
        this._climbableBodies = [];
        // broad-phase 結果の使い回しバッファ（キャラごとに1本。毎ステップの配列確保を避ける）
        // バッファの先頭 _staticTriangleCounts[ i ] 件は「フレーム先頭で引いた静的ジオメトリの
        // 三角形」で、substep 間で使い回す。その後ろへ substep ごとに動的ボディぶんを足す。
        this._triangleBuffers = [];
        this._climbableBuffers = [];
        this._staticTriangleCounts = [];
        // 静的ぶんを引いたときの sphere（キャッシュの有効範囲）。substep の sphere がこの中に
        // 収まっている限り、必要な葉ノードは必ずキャッシュに含まれているので引き直さなくてよい。
        this._staticQueryCenters = [];
        this._staticQueryRadii = [];
        // カメラのレイ衝突など「レイを当てる対象」。静的＋動的ボディ（キャラは含めない）。
        this._colliders = [];
        this._accumulatedTime = 0;
        this._fps = fps;
        this._stepsPerFrame = stepsPerFrame;
    }
    /**
     * 静的ボディ一覧（読み取り専用）。カメラのレイ衝突など内部処理から参照する。
     */
    get colliders() {
        return this._colliders;
    }
    add(body) {
        if (body instanceof StaticBody) {
            if (this._staticBodies.indexOf(body) === -1) {
                this._staticBodies.push(body);
                this._colliders.push(body);
            }
        }
        else if (body instanceof KinematicBody) {
            if (this._kinematicBodies.indexOf(body) === -1) {
                this._kinematicBodies.push(body);
                this._colliders.push(body);
            }
        }
        else if (body instanceof CharacterController) {
            if (this._characterControllers.indexOf(body) === -1)
                this._characterControllers.push(body);
        }
        else if (body instanceof ClimbableBody) {
            if (this._climbableBodies.indexOf(body) === -1)
                this._climbableBodies.push(body);
        }
    }
    remove(body) {
        if (body instanceof StaticBody) {
            const index = this._staticBodies.indexOf(body);
            if (index !== -1)
                this._staticBodies.splice(index, 1);
            const colliderIndex = this._colliders.indexOf(body);
            if (colliderIndex !== -1)
                this._colliders.splice(colliderIndex, 1);
        }
        else if (body instanceof KinematicBody) {
            const index = this._kinematicBodies.indexOf(body);
            if (index !== -1)
                this._kinematicBodies.splice(index, 1);
            const colliderIndex = this._colliders.indexOf(body);
            if (colliderIndex !== -1)
                this._colliders.splice(colliderIndex, 1);
        }
        else if (body instanceof CharacterController) {
            const index = this._characterControllers.indexOf(body);
            if (index !== -1)
                this._characterControllers.splice(index, 1);
        }
        else if (body instanceof ClimbableBody) {
            const index = this._climbableBodies.indexOf(body);
            if (index !== -1)
                this._climbableBodies.splice(index, 1);
        }
    }
    /**
     * 可変フレーム時間 deltaTime（秒）を受け取り、内部の固定ステップ（1/fps）へ
     * 分解して実行する。物理はフレームレートに依存せず一定速度で進む。
     * 毎フレーム `timer.update()` 後の `timer.getDelta()` など、実時間の delta を渡す。
     * 決定論的にちょうど1フレーム進めたい場合（テスト等）は `fixedUpdate()` を直接使う。
     */
    update(deltaTime) {
        const frameTime = 1 / this._fps;
        // 巨大な delta が来ても追いつき過多にならないよう上限でクランプする
        this._accumulatedTime += Math.min(deltaTime, frameTime * MAX_CATCH_UP_FRAMES);
        while (this._accumulatedTime >= frameTime) {
            this.fixedUpdate();
            this._accumulatedTime -= frameTime;
        }
    }
    fixedUpdate() {
        const deltaTime = 1 / this._fps;
        const stepDeltaTime = deltaTime / this._stepsPerFrame;
        // 静的ジオメトリは substep 間で動かないので、broad-phase はフレーム先頭で1回だけ引く。
        // 1フレーム分の移動を包む余裕を持たせておき、足りなかった substep だけ引き直す。
        for (let i = 0, l = this._characterControllers.length; i < l; i++) {
            this._queryStaticTriangles(this._characterControllers[i], i, deltaTime);
        }
        for (let i = 0; i < this._stepsPerFrame; i++) {
            this.step(stepDeltaTime);
        }
    }
    /**
     * キャラの近傍にある静的ジオメトリの三角形をバッファ先頭へ引き直す。
     * 半径には「1フレームで動きうる距離」ぶんの余裕を足す（足りなければ step() が引き直す
     * ので、この余裕は速度のためのチューニングであって正しさの条件ではない）。
     */
    _queryStaticTriangles(character, index, deltaTime) {
        const triangles = this._triangleBuffers[index] || (this._triangleBuffers[index] = []);
        const center = this._staticQueryCenters[index] || (this._staticQueryCenters[index] = new Vector3());
        // 乗っている動く床の運搬ぶんも移動量に含める
        const groundBody = character.groundBody;
        const platformSpeed = groundBody instanceof KinematicBody
            ? groundBody.velocity.length() + groundBody.surfaceVelocity.length()
            : 0;
        const padding = Math.max((character.velocity.length() + platformSpeed) * deltaTime, STATIC_QUERY_PADDING_MIN);
        center.set(0, character.height / 2, 0).add(character.position);
        const radius = character.height / 2 + character.groundCheckDepth + padding;
        _staticQuerySphere.center.copy(center);
        _staticQuerySphere.radius = radius;
        triangles.length = 0;
        for (let i = 0, l = this._staticBodies.length; i < l; i++) {
            this._staticBodies[i].getSphereTriangles(_staticQuerySphere, triangles);
        }
        this._staticTriangleCounts[index] = triangles.length;
        this._staticQueryRadii[index] = radius;
    }
    step(stepDeltaTime) {
        // キャラクターの broad-phase より前に動的ボディを進める（キャラが新位置の床を見るため）
        for (let i = 0, l = this._kinematicBodies.length; i < l; i++) {
            this._kinematicBodies[i].step(stepDeltaTime);
        }
        for (let i = 0, l = this._characterControllers.length; i < l; i++) {
            const character = this._characterControllers[i];
            const triangles = this._triangleBuffers[i] || (this._triangleBuffers[i] = []);
            // 前ステップで接地していた床（運搬・離脱慣性の判定に使う「1つ前の土台」）
            const previousGroundBody = character.groundBody;
            // 運搬: 前ステップで動く床に接地していたら、その床のこのステップの変換差分を
            // キャラ位置へ適用してから接地判定する（Unreal の MovementBase / Godod の
            // move_and_slide と同じく「1つ前の土台」を使う）。縦成分は直後の接地スナップが
            // 再確定し、横成分だけが実質の運搬になる。
            if (previousGroundBody instanceof KinematicBody) {
                // 位置の運搬（並進＋回転床の軌道）。deltaMatrix が回転を含むので軌道運搬は自動。
                character.position.applyMatrix4(previousGroundBody.deltaMatrix);
                // 任意: 乗員の向きも床の yaw に追従させる
                if (character.carryRotation) {
                    character.rotateFacing(previousGroundBody.angularVelocity.y * stepDeltaTime);
                }
            }
            // キャラクターのカプセル全体を囲む sphere で broad-phase して、
            // 近傍の三角形だけを character に渡して判定する
            sphere.center.set(0, character.height / 2, 0).add(character.position);
            sphere.radius = character.height / 2 + character.groundCheckDepth;
            // 静的ぶんはフレーム先頭で引いたものを使い回す。このステップで必要な sphere が
            // キャッシュの sphere に収まっていなければ（ジャンプ開始・速い運搬・テレポートなど）
            // 引き直す。収まっていれば必要な葉ノードは必ず含まれている。
            const cachedCenter = this._staticQueryCenters[i];
            const isCacheValid = cachedCenter !== undefined &&
                cachedCenter.distanceTo(sphere.center) + sphere.radius <= this._staticQueryRadii[i];
            if (!isCacheValid)
                this._queryStaticTriangles(character, i, stepDeltaTime * this._stepsPerFrame);
            // 静的ぶんだけ残して、動的ボディの近傍三角形を現在位置でワールド座標へ変換して混ぜる（所有ボディ tag 付き）
            // 動的ボディが無ければ静的ぶんそのままなので、length 代入自体を避ける
            // （V8 は length 代入で backing store を作り直すことがあり、毎ステップ確保になる）
            const staticCount = this._staticTriangleCounts[i];
            if (triangles.length !== staticCount)
                triangles.length = staticCount;
            for (let ii = 0, ll = this._kinematicBodies.length; ii < ll; ii++) {
                this._kinematicBodies[ii].getSphereTriangles(sphere, triangles);
            }
            character.setNearTriangles(triangles);
            // 近傍の登れる領域（梯子・壁面）を渡す。broad-phase はキャラの sphere と box の交差。
            const climbables = this._climbableBuffers[i] || (this._climbableBuffers[i] = []);
            climbables.length = 0;
            for (let ii = 0, ll = this._climbableBodies.length; ii < ll; ii++) {
                if (this._climbableBodies[ii].box.intersectsSphere(sphere))
                    climbables.push(this._climbableBodies[ii]);
            }
            character.setNearClimbables(climbables);
            character.update(stepDeltaTime);
            // 離脱慣性: 動く床に乗っていたが、このステップで空中に出た（ジャンプ・端から落下）
            // なら、足元での床面速度を引き継ぐ。静的な地面へ歩き移った場合は接地したままなので
            // 引き継がない。床面速度は deltaMatrix から算出する: v = (deltaMatrix·p − p) / dt。
            // これは並進も回転（接線 ω×r）も乗員の位置で正しく含む。
            if (previousGroundBody instanceof KinematicBody && !character.isGrounded) {
                _leaveVelocity.copy(character.position).applyMatrix4(previousGroundBody.deltaMatrix);
                _leaveVelocity.sub(character.position).divideScalar(stepDeltaTime);
                character.inheritVelocity(_leaveVelocity);
            }
        }
    }
    dispose() {
        for (let i = 0; i < this._staticBodies.length; i++)
            this._staticBodies[i].dispose();
        for (let i = 0; i < this._kinematicBodies.length; i++)
            this._kinematicBodies[i].dispose();
        for (let i = 0; i < this._characterControllers.length; i++)
            this._characterControllers[i].dispose();
        for (let i = 0; i < this._climbableBodies.length; i++)
            this._climbableBodies[i].dispose();
        this._staticBodies.length = 0;
        this._kinematicBodies.length = 0;
        this._characterControllers.length = 0;
        this._climbableBodies.length = 0;
        this._colliders.length = 0;
        this._triangleBuffers.length = 0;
        this._climbableBuffers.length = 0;
        this._staticTriangleCounts.length = 0;
        this._staticQueryCenters.length = 0;
        this._staticQueryRadii.length = 0;
    }
}

const TURN_DURATION = 200;
const TAU = 2 * Math.PI;
const modulo = (n, d) => ((n % d) + d) % d;
const getDeltaTurnAngle = (current, target) => {
    const a = modulo((current - target), TAU);
    const b = modulo((target - current), TAU);
    return a < b ? -a : b;
};
class AnimationController {
    constructor(mesh, animations) {
        this._targetRotY = null;
        this.mesh = mesh;
        this.actions = {};
        this.mixer = new AnimationMixer(mesh);
        this.currentMotionName = '';
        for (let i = 0, l = animations.length; i < l; i++) {
            const anim = animations[i];
            this.actions[anim.name] = this.mixer.clipAction(anim);
            this.actions[anim.name].setEffectiveWeight(1);
        }
    }
    play(name) {
        if (this.currentMotionName === name)
            return;
        if (this.actions[this.currentMotionName]) {
            const from = this.actions[this.currentMotionName].play();
            const to = this.actions[name].play();
            from.enabled = true;
            to.enabled = true;
            from.crossFadeTo(to, .3, false);
        }
        else {
            this.actions[name].enabled = true;
            this.actions[name].play();
        }
        this.currentMotionName = name;
    }
    turn(rad, immediate) {
        const that = this;
        const prevRotY = this.mesh.rotation.y;
        const targetRotY = rad;
        const deltaY = getDeltaTurnAngle(prevRotY, targetRotY);
        // const duration   = Math.abs( deltaY ) * 100;
        const start = Date.now();
        const end = start + TURN_DURATION;
        let progress = 0;
        if (immediate) {
            this.mesh.rotation.y = targetRotY;
            return;
        }
        if (this._targetRotY === targetRotY)
            return;
        this._targetRotY = targetRotY;
        {
            let _targetRotY = targetRotY;
            (function interval() {
                const now = Date.now();
                const isAborted = _targetRotY !== that._targetRotY;
                if (isAborted)
                    return;
                if (now >= end) {
                    that.mesh.rotation.y = _targetRotY;
                    that._targetRotY = null;
                    return;
                }
                requestAnimationFrame(interval);
                progress = (now - start) / TURN_DURATION;
                that.mesh.rotation.y = prevRotY + deltaY * progress;
            })();
        }
    }
    update(deltaTime) {
        this.mixer.update(deltaTime);
    }
    dispose() {
        this.mixer.stopAllAction();
        this.mixer.uncacheRoot(this.mesh);
    }
}

const KEY_W = 'KeyW';
const KEY_UP = 'ArrowUp';
const KEY_S = 'KeyS';
const KEY_DOWN = 'ArrowDown';
const KEY_A = 'KeyA';
const KEY_LEFT = 'ArrowLeft';
const KEY_D = 'KeyD';
const KEY_RIGHT = 'ArrowRight';
const KEY_SPACE = 'Space';
class KeyboardControls extends EventDispatcher$1 {
    constructor() {
        super();
        this.isDisabled = false;
        this.isUp = false;
        this.isDown = false;
        this.isLeft = false;
        this.isRight = false;
        this.isMoveKeyHolding = false;
        // 望む移動入力。x = 右(+)/左(-)、y = 前(+)/後(-)。大きさ 0〜1（斜めは正規化）。
        // 無入力は長さ 0。利用側でカメラ向きに回して CharacterController.move() へ渡す。
        this.inputVector = new Vector2();
        this._keydownListener = (event) => {
            if (this.isDisabled)
                return;
            if (isInputEvent(event))
                return;
            switch (event.code) {
                case KEY_W:
                case KEY_UP:
                    this.isUp = true;
                    break;
                case KEY_S:
                case KEY_DOWN:
                    this.isDown = true;
                    break;
                case KEY_A:
                case KEY_LEFT:
                    this.isLeft = true;
                    break;
                case KEY_D:
                case KEY_RIGHT:
                    this.isRight = true;
                    break;
                case KEY_SPACE:
                    this.jump();
                    break;
                default:
                    return;
            }
            const prevX = this.inputVector.x;
            const prevY = this.inputVector.y;
            this._updateInputVector();
            if (prevX !== this.inputVector.x || prevY !== this.inputVector.y) {
                this.dispatchEvent({ type: 'movekeychange' });
            }
            if ((this.isUp || this.isDown || this.isLeft || this.isRight) &&
                !this.isMoveKeyHolding) {
                this.isMoveKeyHolding = true;
                this.dispatchEvent({ type: 'movekeyon' });
            }
        };
        this._keyupListener = (event) => {
            if (this.isDisabled)
                return;
            switch (event.code) {
                case KEY_W:
                case KEY_UP:
                    this.isUp = false;
                    break;
                case KEY_S:
                case KEY_DOWN:
                    this.isDown = false;
                    break;
                case KEY_A:
                case KEY_LEFT:
                    this.isLeft = false;
                    break;
                case KEY_D:
                case KEY_RIGHT:
                    this.isRight = false;
                    break;
                case KEY_SPACE:
                    break;
                default:
                    return;
            }
            const prevX = this.inputVector.x;
            const prevY = this.inputVector.y;
            this._updateInputVector();
            if (prevX !== this.inputVector.x || prevY !== this.inputVector.y) {
                this.dispatchEvent({ type: 'movekeychange' });
            }
            if (!this.isUp && !this.isDown && !this.isLeft && !this.isRight &&
                (event.code === KEY_W ||
                    event.code === KEY_UP ||
                    event.code === KEY_S ||
                    event.code === KEY_DOWN ||
                    event.code === KEY_A ||
                    event.code === KEY_LEFT ||
                    event.code === KEY_D ||
                    event.code === KEY_RIGHT)) {
                this.isMoveKeyHolding = false;
                this.dispatchEvent({ type: 'movekeyoff' });
            }
        };
        this._blurListener = () => {
            this.isUp = false;
            this.isDown = false;
            this.isLeft = false;
            this.isRight = false;
            this._updateInputVector();
            if (this.isMoveKeyHolding) {
                this.isMoveKeyHolding = false;
                this.dispatchEvent({ type: 'movekeyoff' });
            }
        };
        function isInputEvent(event) {
            const target = event.target;
            if (!(target instanceof HTMLElement))
                return false;
            return (target.tagName === 'INPUT' ||
                target.tagName === 'SELECT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'BUTTON' ||
                target.isContentEditable);
        }
        window.addEventListener('keydown', this._keydownListener);
        window.addEventListener('keyup', this._keyupListener);
        window.addEventListener('blur', this._blurListener);
        window.addEventListener('contextmenu', this._blurListener);
    }
    jump() {
        this.dispatchEvent({ type: 'jumpkeypress' });
    }
    // 押下フラグから inputVector を再計算する（対向キーは相殺、斜めは正規化して長さ 1）。
    _updateInputVector() {
        this.inputVector.set((this.isRight ? 1 : 0) - (this.isLeft ? 1 : 0), (this.isUp ? 1 : 0) - (this.isDown ? 1 : 0));
        if (this.inputVector.lengthSq() > 1)
            this.inputVector.normalize();
    }
    dispose() {
        window.removeEventListener('keydown', this._keydownListener);
        window.removeEventListener('keyup', this._keyupListener);
        window.removeEventListener('blur', this._blurListener);
        window.removeEventListener('contextmenu', this._blurListener);
        this._blurListener();
    }
}

/*!
 * camera-controls
 * https://github.com/yomotsu/camera-controls
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
// see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#value
const MOUSE_BUTTON = {
    LEFT: 1,
    RIGHT: 2,
    MIDDLE: 4,
};
const ACTION = Object.freeze({
    NONE: 0b0,
    ROTATE: 0b1,
    TRUCK: 0b10,
    SCREEN_PAN: 0b100,
    OFFSET: 0b1000,
    DOLLY: 0b10000,
    ZOOM: 0b100000,
    TOUCH_ROTATE: 0b1000000,
    TOUCH_TRUCK: 0b10000000,
    TOUCH_SCREEN_PAN: 0b100000000,
    TOUCH_OFFSET: 0b1000000000,
    TOUCH_DOLLY: 0b10000000000,
    TOUCH_ZOOM: 0b100000000000,
    TOUCH_DOLLY_TRUCK: 0b1000000000000,
    TOUCH_DOLLY_SCREEN_PAN: 0b10000000000000,
    TOUCH_DOLLY_OFFSET: 0b100000000000000,
    TOUCH_DOLLY_ROTATE: 0b1000000000000000,
    TOUCH_ZOOM_TRUCK: 0b10000000000000000,
    TOUCH_ZOOM_OFFSET: 0b100000000000000000,
    TOUCH_ZOOM_SCREEN_PAN: 0b1000000000000000000,
    TOUCH_ZOOM_ROTATE: 0b10000000000000000000,
});
const DOLLY_DIRECTION = {
    NONE: 0,
    IN: 1,
    OUT: -1,
};
function isPerspectiveCamera(camera) {
    return camera.isPerspectiveCamera;
}
function isOrthographicCamera(camera) {
    return camera.isOrthographicCamera;
}

const PI_2 = Math.PI * 2;
const PI_HALF = Math.PI / 2;

const EPSILON = 1e-5;
const DEG2RAD = Math.PI / 180;
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
function approxZero(number, error = EPSILON) {
    return Math.abs(number) < error;
}
function approxEquals(a, b, error = EPSILON) {
    return approxZero(a - b, error);
}
function roundToStep(value, step) {
    return Math.round(value / step) * step;
}
function infinityToMaxNumber(value) {
    if (isFinite(value))
        return value;
    if (value < 0)
        return -Number.MAX_VALUE;
    return Number.MAX_VALUE;
}
function maxNumberToInfinity(value) {
    if (Math.abs(value) < Number.MAX_VALUE)
        return value;
    return value * Infinity;
}
// https://docs.unity3d.com/ScriptReference/Mathf.SmoothDamp.html
// https://github.com/Unity-Technologies/UnityCsReference/blob/a2bdfe9b3c4cd4476f44bf52f848063bfaf7b6b9/Runtime/Export/Math/Mathf.cs#L308
function smoothDamp(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime) {
    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const originalTo = target;
    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    change = clamp(change, -maxChange, maxChange);
    target = current - change;
    const temp = (currentVelocityRef.value + omega * change) * deltaTime;
    currentVelocityRef.value = (currentVelocityRef.value - omega * temp) * exp;
    let output = target + (change + temp) * exp;
    // Prevent overshooting
    if (originalTo - current > 0.0 === output > originalTo) {
        output = originalTo;
        currentVelocityRef.value = (output - originalTo) / deltaTime;
    }
    return output;
}
// https://docs.unity3d.com/ScriptReference/Vector3.SmoothDamp.html
// https://github.com/Unity-Technologies/UnityCsReference/blob/a2bdfe9b3c4cd4476f44bf52f848063bfaf7b6b9/Runtime/Export/Math/Vector3.cs#L97
function smoothDampVec3(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime, out) {
    // Based on Game Programming Gems 4 Chapter 1.10
    smoothTime = Math.max(0.0001, smoothTime);
    const omega = 2 / smoothTime;
    const x = omega * deltaTime;
    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
    let targetX = target.x;
    let targetY = target.y;
    let targetZ = target.z;
    let changeX = current.x - targetX;
    let changeY = current.y - targetY;
    let changeZ = current.z - targetZ;
    const originalToX = targetX;
    const originalToY = targetY;
    const originalToZ = targetZ;
    // Clamp maximum speed
    const maxChange = maxSpeed * smoothTime;
    const maxChangeSq = maxChange * maxChange;
    const magnitudeSq = changeX * changeX + changeY * changeY + changeZ * changeZ;
    if (magnitudeSq > maxChangeSq) {
        const magnitude = Math.sqrt(magnitudeSq);
        changeX = changeX / magnitude * maxChange;
        changeY = changeY / magnitude * maxChange;
        changeZ = changeZ / magnitude * maxChange;
    }
    targetX = current.x - changeX;
    targetY = current.y - changeY;
    targetZ = current.z - changeZ;
    const tempX = (currentVelocityRef.x + omega * changeX) * deltaTime;
    const tempY = (currentVelocityRef.y + omega * changeY) * deltaTime;
    const tempZ = (currentVelocityRef.z + omega * changeZ) * deltaTime;
    currentVelocityRef.x = (currentVelocityRef.x - omega * tempX) * exp;
    currentVelocityRef.y = (currentVelocityRef.y - omega * tempY) * exp;
    currentVelocityRef.z = (currentVelocityRef.z - omega * tempZ) * exp;
    out.x = targetX + (changeX + tempX) * exp;
    out.y = targetY + (changeY + tempY) * exp;
    out.z = targetZ + (changeZ + tempZ) * exp;
    // Prevent overshooting
    const origMinusCurrentX = originalToX - current.x;
    const origMinusCurrentY = originalToY - current.y;
    const origMinusCurrentZ = originalToZ - current.z;
    const outMinusOrigX = out.x - originalToX;
    const outMinusOrigY = out.y - originalToY;
    const outMinusOrigZ = out.z - originalToZ;
    if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY + origMinusCurrentZ * outMinusOrigZ > 0) {
        out.x = originalToX;
        out.y = originalToY;
        out.z = originalToZ;
        currentVelocityRef.x = (out.x - originalToX) / deltaTime;
        currentVelocityRef.y = (out.y - originalToY) / deltaTime;
        currentVelocityRef.z = (out.z - originalToZ) / deltaTime;
    }
    return out;
}

function extractClientCoordFromEvent(pointers, out) {
    out.set(0, 0);
    pointers.forEach((pointer) => {
        out.x += pointer.clientX;
        out.y += pointer.clientY;
    });
    out.x /= pointers.length;
    out.y /= pointers.length;
}

function notSupportedInOrthographicCamera(camera, message) {
    if (isOrthographicCamera(camera)) {
        console.warn(`${message} is not supported in OrthographicCamera`);
        return true;
    }
    return false;
}

class EventDispatcher {
    _listeners = {};
    /**
     * Adds the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener(type, listener) {
        const listeners = this._listeners;
        if (listeners[type] === undefined)
            listeners[type] = [];
        if (listeners[type].indexOf(listener) === -1)
            listeners[type].push(listener);
    }
    /**
     * Presence of the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    hasEventListener(type, listener) {
        const listeners = this._listeners;
        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }
    /**
     * Removes the specified event listener
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener(type, listener) {
        const listeners = this._listeners;
        const listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            const index = listenerArray.indexOf(listener);
            if (index !== -1)
                listenerArray.splice(index, 1);
        }
    }
    /**
     * Removes all event listeners
     * @param type event name
     * @category Methods
     */
    removeAllEventListeners(type) {
        if (!type) {
            this._listeners = {};
            return;
        }
        if (Array.isArray(this._listeners[type]))
            this._listeners[type].length = 0;
    }
    /**
     * Fire an event type.
     * @param event DispatcherEvent
     * @category Methods
     */
    dispatchEvent(event) {
        const listeners = this._listeners;
        const listenerArray = listeners[event.type];
        if (listenerArray !== undefined) {
            event.target = this;
            const array = listenerArray.slice(0);
            for (let i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    }
}

const VERSION = '3.1.2'; // will be replaced with `version` in package.json during the build process.
const TOUCH_DOLLY_FACTOR = 1 / 8;
const isMac = /Mac/.test(globalThis?.navigator?.platform);
let THREE;
let _ORIGIN$1;
let _AXIS_Y;
let _AXIS_Z;
let _v2;
let _v3A$1;
let _v3B$1;
let _v3C$1;
let _cameraDirection;
let _xColumn;
let _yColumn;
let _zColumn;
let _deltaTarget;
let _deltaOffset;
let _sphericalA;
let _sphericalB;
let _box3A;
let _box3B;
let _sphere;
let _quaternionA;
let _quaternionB;
let _rotationMatrix$1;
let _raycaster;
class CameraControls extends EventDispatcher {
    /**
     * Injects THREE as the dependency. You can then proceed to use CameraControls.
     *
     * e.g
     * ```javascript
     * CameraControls.install( { THREE: THREE } );
     * ```
     *
     * Note: If you do not wish to use enter three.js to reduce file size(tree-shaking for example), make a subset to install.
     *
     * ```js
     * import {
     * 	Vector2,
     * 	Vector3,
     * 	Vector4,
     * 	Quaternion,
     * 	Matrix4,
     * 	Spherical,
     * 	Box3,
     * 	Sphere,
     * 	Raycaster,
     * 	MathUtils,
     * } from 'three';
     *
     * const subsetOfTHREE = {
     * 	Vector2   : Vector2,
     * 	Vector3   : Vector3,
     * 	Vector4   : Vector4,
     * 	Quaternion: Quaternion,
     * 	Matrix4   : Matrix4,
     * 	Spherical : Spherical,
     * 	Box3      : Box3,
     * 	Sphere    : Sphere,
     * 	Raycaster : Raycaster,
     * };

     * CameraControls.install( { THREE: subsetOfTHREE } );
     * ```
     * @category Statics
     */
    static install(libs) {
        THREE = libs.THREE;
        _ORIGIN$1 = Object.freeze(new THREE.Vector3(0, 0, 0));
        _AXIS_Y = Object.freeze(new THREE.Vector3(0, 1, 0));
        _AXIS_Z = Object.freeze(new THREE.Vector3(0, 0, 1));
        _v2 = new THREE.Vector2();
        _v3A$1 = new THREE.Vector3();
        _v3B$1 = new THREE.Vector3();
        _v3C$1 = new THREE.Vector3();
        _cameraDirection = new THREE.Vector3();
        _xColumn = new THREE.Vector3();
        _yColumn = new THREE.Vector3();
        _zColumn = new THREE.Vector3();
        _deltaTarget = new THREE.Vector3();
        _deltaOffset = new THREE.Vector3();
        _sphericalA = new THREE.Spherical();
        _sphericalB = new THREE.Spherical();
        _box3A = new THREE.Box3();
        _box3B = new THREE.Box3();
        _sphere = new THREE.Sphere();
        _quaternionA = new THREE.Quaternion();
        _quaternionB = new THREE.Quaternion();
        _rotationMatrix$1 = new THREE.Matrix4();
        _raycaster = new THREE.Raycaster();
    }
    /**
     * list all ACTIONs
     * @category Statics
     */
    static get ACTION() {
        return ACTION;
    }
    /**
     * Minimum vertical angle in radians.
     * The angle has to be between `0` and `.maxPolarAngle` inclusive.
     * The default value is `0`.
     *
     * e.g.
     * ```
     * cameraControls.maxPolarAngle = 0;
     * ```
     * @category Properties
     */
    minPolarAngle = 0; // radians
    /**
     * Maximum vertical angle in radians.
     * The angle has to be between `.maxPolarAngle` and `Math.PI` inclusive.
     * The default value is `Math.PI`.
     *
     * e.g.
     * ```
     * cameraControls.maxPolarAngle = Math.PI;
     * ```
     * @category Properties
     */
    maxPolarAngle = Math.PI; // radians
    /**
     * Minimum horizontal angle in radians.
     * The angle has to be less than `.maxAzimuthAngle`.
     * The default value is `- Infinity`.
     *
     * e.g.
     * ```
     * cameraControls.minAzimuthAngle = - Infinity;
     * ```
     * @category Properties
     */
    minAzimuthAngle = -Infinity; // radians
    /**
     * Maximum horizontal angle in radians.
     * The angle has to be greater than `.minAzimuthAngle`.
     * The default value is `Infinity`.
     *
     * e.g.
     * ```
     * cameraControls.maxAzimuthAngle = Infinity;
     * ```
     * @category Properties
     */
    maxAzimuthAngle = Infinity; // radians
    // How far you can dolly in and out ( PerspectiveCamera only )
    /**
     * Minimum distance for dolly. The value must be higher than `0`. Default is `Number.EPSILON`.
     * PerspectiveCamera only.
     * @category Properties
     */
    minDistance = Number.EPSILON;
    /**
     * Maximum distance for dolly. The value must be higher than `minDistance`. Default is `Infinity`.
     * PerspectiveCamera only.
     * @category Properties
     */
    maxDistance = Infinity;
    /**
     * `true` to enable Infinity Dolly for wheel and pinch. Use this with `minDistance` and `maxDistance`
     * If the Dolly distance is less (or over) than the `minDistance` (or `maxDistance`), `infinityDolly` will keep the distance and pushes the target position instead.
     * @category Properties
     */
    infinityDolly = false;
    /**
     * Minimum camera zoom.
     * @category Properties
     */
    minZoom = 0.01;
    /**
     * Maximum camera zoom.
     * @category Properties
     */
    maxZoom = Infinity;
    /**
     * Approximate time in seconds to reach the target. A smaller value will reach the target faster.
     * @category Properties
     */
    smoothTime = 0.25;
    /**
     * the smoothTime while dragging
     * @category Properties
     */
    draggingSmoothTime = 0.125;
    /**
     * Max transition speed in unit-per-seconds
     * @category Properties
     */
    maxSpeed = Infinity;
    /**
     * Speed of azimuth (horizontal) rotation.
     * @category Properties
     */
    azimuthRotateSpeed = 1.0;
    /**
     * Speed of polar (vertical) rotation.
     * @category Properties
     */
    polarRotateSpeed = 1.0;
    /**
     * Speed of mouse-wheel dollying.
     * @category Properties
     */
    dollySpeed = 1.0;
    /**
     * `true` to invert direction when dollying or zooming via drag
     * @category Properties
     */
    dollyDragInverted = false;
    /**
     * Speed of drag for truck and pedestal.
     * @category Properties
     */
    truckSpeed = 2.0;
    /**
     * `true` to enable Dolly-in to the mouse cursor coords.
     * @category Properties
     */
    dollyToCursor = false;
    /**
     * @category Properties
     */
    dragToOffset = false;
    /**
     * Friction ratio of the boundary.
     * @category Properties
     */
    boundaryFriction = 0.0;
    /**
     * Controls how soon the `rest` event fires as the camera slows.
     * @category Properties
     */
    restThreshold = 0.01;
    /**
     * An array of Meshes to collide with camera.
     * Be aware colliderMeshes may decrease performance. The collision test uses 4 raycasters from the camera since the near plane has 4 corners.
     * @category Properties
     */
    colliderMeshes = [];
    // button configs
    /**
     * User's mouse input config.
     *
     * | button to assign      | behavior |
     * | --------------------- | -------- |
     * | `mouseButtons.left`   | `CameraControls.ACTION.ROTATE`* \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.right`  | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.TRUCK`* \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.wheel` ¹ | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY` \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     * | `mouseButtons.middle` ² | `CameraControls.ACTION.ROTATE` \| `CameraControls.ACTION.TRUCK` \| `CameraControls.ACTION.OFFSET` \| `CameraControls.ACTION.DOLLY`* \| `CameraControls.ACTION.ZOOM` \| `CameraControls.ACTION.NONE` |
     *
     * 1. Mouse wheel event for scroll "up/down" on mac "up/down/left/right"
     * 2. Mouse click on wheel event "button"
     * - \* is the default.
     * - The default of `mouseButtons.wheel` is:
     *   - `DOLLY` for Perspective camera.
     *   - `ZOOM` for Orthographic camera, and can't set `DOLLY`.
     * @category Properties
     */
    mouseButtons;
    /**
     * User's touch input config.
     *
     * | fingers to assign     | behavior |
     * | --------------------- | -------- |
     * | `touches.one` | `CameraControls.ACTION.TOUCH_ROTATE`* \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.DOLLY` | `CameraControls.ACTION.ZOOM` | `CameraControls.ACTION.NONE` |
     * | `touches.two` | `ACTION.TOUCH_DOLLY_TRUCK` \| `ACTION.TOUCH_DOLLY_OFFSET` \| `ACTION.TOUCH_DOLLY_ROTATE` \| `ACTION.TOUCH_ZOOM_TRUCK` \| `ACTION.TOUCH_ZOOM_OFFSET` \| `ACTION.TOUCH_ZOOM_ROTATE` \| `ACTION.TOUCH_DOLLY` \| `ACTION.TOUCH_ZOOM` \| `CameraControls.ACTION.TOUCH_ROTATE` \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.NONE` |
     * | `touches.three` | `ACTION.TOUCH_DOLLY_TRUCK` \| `ACTION.TOUCH_DOLLY_OFFSET` \| `ACTION.TOUCH_DOLLY_ROTATE` \| `ACTION.TOUCH_ZOOM_TRUCK` \| `ACTION.TOUCH_ZOOM_OFFSET` \| `ACTION.TOUCH_ZOOM_ROTATE` \| `CameraControls.ACTION.TOUCH_ROTATE` \| `CameraControls.ACTION.TOUCH_TRUCK` \| `CameraControls.ACTION.TOUCH_OFFSET` \| `CameraControls.ACTION.NONE` |
     *
     * - \* is the default.
     * - The default of `touches.two` and `touches.three` is:
     *   - `TOUCH_DOLLY_TRUCK` for Perspective camera.
     *   - `TOUCH_ZOOM_TRUCK` for Orthographic camera, and can't set `TOUCH_DOLLY_TRUCK` and `TOUCH_DOLLY`.
     * @category Properties
     */
    touches;
    /**
     * Force cancel user dragging.
     * @category Methods
     */
    // cancel will be overwritten in the constructor.
    cancel = () => { };
    /**
     * Still an experimental feature.
     * This could change at any time.
     * @category Methods
     */
    lockPointer;
    /**
     * Still an experimental feature.
     * This could change at any time.
     * @category Methods
     */
    unlockPointer;
    _enabled = true;
    _camera;
    _yAxisUpSpace;
    _yAxisUpSpaceInverse;
    _state = ACTION.NONE;
    _domElement;
    _viewport = null;
    // the location of focus, where the object orbits around
    _target;
    _targetEnd;
    _focalOffset;
    _focalOffsetEnd;
    // rotation and dolly distance
    _spherical;
    _sphericalEnd;
    _lastDistance;
    _zoom;
    _zoomEnd;
    _lastZoom;
    // reset
    _cameraUp0;
    _target0;
    _position0;
    _zoom0;
    _focalOffset0;
    _dollyControlCoord;
    _changedDolly = 0;
    _changedZoom = 0;
    // collisionTest uses nearPlane. ( PerspectiveCamera only )
    _nearPlaneCorners;
    _hasRested = true;
    _boundary;
    _boundaryEnclosesCamera = false;
    _needsUpdate = true;
    _updatedLastTime = false;
    _elementRect = new DOMRect();
    _isDragging = false;
    _dragNeedsUpdate = true;
    _activePointers = [];
    _lockedPointer = null;
    _interactiveArea = new DOMRect(0, 0, 1, 1);
    // Use draggingSmoothTime over smoothTime while true.
    // set automatically true on user-dragging start.
    // set automatically false on programmable methods call.
    _isUserControllingRotate = false;
    _isUserControllingDolly = false;
    _isUserControllingTruck = false;
    _isUserControllingOffset = false;
    _isUserControllingZoom = false;
    _lastDollyDirection = DOLLY_DIRECTION.NONE;
    // velocities for smoothDamp
    _thetaVelocity = { value: 0 };
    _phiVelocity = { value: 0 };
    _radiusVelocity = { value: 0 };
    _targetVelocity = new THREE.Vector3();
    _focalOffsetVelocity = new THREE.Vector3();
    _zoomVelocity = { value: 0 };
    /**
     * @deprecated Use `cameraControls.mouseButtons.left = CameraControls.ACTION.SCREEN_PAN` instead.
     */
    set verticalDragToForward(_) {
        console.warn('camera-controls: `verticalDragToForward` was removed. Use `mouseButtons.left = CameraControls.ACTION.SCREEN_PAN` instead.');
    }
    /**
     * Creates a `CameraControls` instance.
     *
     * Note:
     * You **must install** three.js before using camera-controls. see [#install](#install)
     * Not doing so will lead to runtime errors (`undefined` references to THREE).
     *
     * e.g.
     * ```
     * CameraControls.install( { THREE } );
     * const cameraControls = new CameraControls( camera, domElement );
     * ```
     *
     * @param camera A `THREE.PerspectiveCamera` or `THREE.OrthographicCamera` to be controlled.
     * @param domElement A `HTMLElement` for the draggable area, usually `renderer.domElement`.
     * @category Constructor
     */
    constructor(camera, domElement) {
        super();
        // Check if the user has installed THREE
        if (typeof THREE === 'undefined') {
            console.error('camera-controls: `THREE` is undefined. You must first run `CameraControls.install( { THREE: THREE } )`. Check the docs for further information.');
        }
        this._camera = camera;
        this._yAxisUpSpace = new THREE.Quaternion().setFromUnitVectors(this._camera.up, _AXIS_Y);
        this._yAxisUpSpaceInverse = this._yAxisUpSpace.clone().invert();
        this._state = ACTION.NONE;
        // the location
        this._target = new THREE.Vector3();
        this._targetEnd = this._target.clone();
        this._focalOffset = new THREE.Vector3();
        this._focalOffsetEnd = this._focalOffset.clone();
        // rotation
        this._spherical = new THREE.Spherical().setFromVector3(_v3A$1.copy(this._camera.position).applyQuaternion(this._yAxisUpSpace));
        this._sphericalEnd = this._spherical.clone();
        this._lastDistance = this._spherical.radius;
        this._zoom = this._camera.zoom;
        this._zoomEnd = this._zoom;
        this._lastZoom = this._zoom;
        // collisionTest uses nearPlane.s
        this._nearPlaneCorners = [
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
            new THREE.Vector3(),
        ];
        this._updateNearPlaneCorners();
        // Target cannot move outside of this box
        this._boundary = new THREE.Box3(new THREE.Vector3(-Infinity, -Infinity, -Infinity), new THREE.Vector3(Infinity, Infinity, Infinity));
        // reset
        this._cameraUp0 = this._camera.up.clone();
        this._target0 = this._target.clone();
        this._position0 = this._camera.position.clone();
        this._zoom0 = this._zoom;
        this._focalOffset0 = this._focalOffset.clone();
        this._dollyControlCoord = new THREE.Vector2();
        // configs
        this.mouseButtons = {
            left: ACTION.ROTATE,
            middle: ACTION.DOLLY,
            right: ACTION.TRUCK,
            wheel: isPerspectiveCamera(this._camera) ? ACTION.DOLLY :
                isOrthographicCamera(this._camera) ? ACTION.ZOOM :
                    ACTION.NONE,
        };
        this.touches = {
            one: ACTION.TOUCH_ROTATE,
            two: isPerspectiveCamera(this._camera) ? ACTION.TOUCH_DOLLY_TRUCK :
                isOrthographicCamera(this._camera) ? ACTION.TOUCH_ZOOM_TRUCK :
                    ACTION.NONE,
            three: ACTION.TOUCH_TRUCK,
        };
        const dragStartPosition = new THREE.Vector2();
        const lastDragPosition = new THREE.Vector2();
        const dollyStart = new THREE.Vector2();
        const onPointerDown = (event) => {
            if (!this._enabled || !this._domElement)
                return;
            if (this._interactiveArea.left !== 0 ||
                this._interactiveArea.top !== 0 ||
                this._interactiveArea.width !== 1 ||
                this._interactiveArea.height !== 1) {
                const elRect = this._domElement.getBoundingClientRect();
                const left = event.clientX / elRect.width;
                const top = event.clientY / elRect.height;
                // check if the interactiveArea contains the drag start position.
                if (left < this._interactiveArea.left ||
                    left > this._interactiveArea.right ||
                    top < this._interactiveArea.top ||
                    top > this._interactiveArea.bottom)
                    return;
            }
            // Don't call `event.preventDefault()` on the pointerdown event
            // to keep receiving pointermove evens outside dragging iframe
            // https://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
            const mouseButton = event.pointerType !== 'mouse' ? null :
                (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT ? MOUSE_BUTTON.LEFT :
                    (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE ? MOUSE_BUTTON.MIDDLE :
                        (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT ? MOUSE_BUTTON.RIGHT :
                            null;
            if (mouseButton !== null) {
                const zombiePointer = this._findPointerByMouseButton(mouseButton);
                zombiePointer && this._disposePointer(zombiePointer);
            }
            if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT && this._lockedPointer)
                return;
            const pointer = {
                pointerId: event.pointerId,
                clientX: event.clientX,
                clientY: event.clientY,
                deltaX: 0,
                deltaY: 0,
                mouseButton,
            };
            this._activePointers.push(pointer);
            // eslint-disable-next-line no-undef
            this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
            this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
            this._domElement.ownerDocument.addEventListener('pointermove', onPointerMove, { passive: false });
            this._domElement.ownerDocument.addEventListener('pointerup', onPointerUp);
            this._isDragging = true;
            startDragging(event);
        };
        const onPointerMove = (event) => {
            if (event.cancelable)
                event.preventDefault();
            const pointerId = event.pointerId;
            const pointer = this._lockedPointer || this._findPointerById(pointerId);
            if (!pointer)
                return;
            pointer.clientX = event.clientX;
            pointer.clientY = event.clientY;
            pointer.deltaX = event.movementX;
            pointer.deltaY = event.movementY;
            this._state = 0;
            if (event.pointerType === 'touch') {
                switch (this._activePointers.length) {
                    case 1:
                        this._state = this.touches.one;
                        break;
                    case 2:
                        this._state = this.touches.two;
                        break;
                    case 3:
                        this._state = this.touches.three;
                        break;
                }
            }
            else {
                if ((!this._isDragging && this._lockedPointer) ||
                    this._isDragging && (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
                    this._state = this._state | this.mouseButtons.left;
                }
                if (this._isDragging && (event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
                    this._state = this._state | this.mouseButtons.middle;
                }
                if (this._isDragging && (event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
                    this._state = this._state | this.mouseButtons.right;
                }
            }
            dragging();
        };
        const onPointerUp = (event) => {
            const pointer = this._findPointerById(event.pointerId);
            if (pointer && pointer === this._lockedPointer)
                return;
            pointer && this._disposePointer(pointer);
            if (event.pointerType === 'touch') {
                switch (this._activePointers.length) {
                    case 0:
                        this._state = ACTION.NONE;
                        break;
                    case 1:
                        this._state = this.touches.one;
                        break;
                    case 2:
                        this._state = this.touches.two;
                        break;
                    case 3:
                        this._state = this.touches.three;
                        break;
                }
            }
            else {
                this._state = ACTION.NONE;
            }
            endDragging();
        };
        let lastScrollTimeStamp = -1;
        const onMouseWheel = (event) => {
            if (!this._domElement)
                return;
            if (!this._enabled || this.mouseButtons.wheel === ACTION.NONE)
                return;
            if (this._interactiveArea.left !== 0 ||
                this._interactiveArea.top !== 0 ||
                this._interactiveArea.width !== 1 ||
                this._interactiveArea.height !== 1) {
                const elRect = this._domElement.getBoundingClientRect();
                const left = event.clientX / elRect.width;
                const top = event.clientY / elRect.height;
                // check if the interactiveArea contains the drag start position.
                if (left < this._interactiveArea.left ||
                    left > this._interactiveArea.right ||
                    top < this._interactiveArea.top ||
                    top > this._interactiveArea.bottom)
                    return;
            }
            event.preventDefault();
            if (this.dollyToCursor ||
                this.mouseButtons.wheel === ACTION.ROTATE ||
                this.mouseButtons.wheel === ACTION.TRUCK) {
                const now = performance.now();
                // only need to fire this at scroll start.
                if (lastScrollTimeStamp - now < 1000)
                    this._getClientRect(this._elementRect);
                lastScrollTimeStamp = now;
            }
            // Ref: https://github.com/cedricpinson/osgjs/blob/00e5a7e9d9206c06fdde0436e1d62ab7cb5ce853/sources/osgViewer/input/source/InputSourceMouse.js#L89-L103
            const deltaYFactor = isMac ? -1 : -3;
            // Checks event.ctrlKey to detect multi-touch gestures on a trackpad.
            const delta = (event.deltaMode === 1 && !event.ctrlKey) ? event.deltaY / deltaYFactor : event.deltaY / (deltaYFactor * 10);
            const x = this.dollyToCursor ? (event.clientX - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
            const y = this.dollyToCursor ? (event.clientY - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
            // event.ctrlKey is set to true on macOS trackpad pinch gesture. In this case, always zoom.
            const controlMode = event.ctrlKey ? ACTION.ZOOM : this.mouseButtons.wheel;
            switch (controlMode) {
                case ACTION.ROTATE: {
                    this._rotateInternal(event.deltaX, event.deltaY);
                    this._isUserControllingRotate = true;
                    break;
                }
                case ACTION.TRUCK: {
                    this._truckInternal(event.deltaX, event.deltaY, false, false);
                    this._isUserControllingTruck = true;
                    break;
                }
                case ACTION.SCREEN_PAN: {
                    this._truckInternal(event.deltaX, event.deltaY, false, true);
                    this._isUserControllingTruck = true;
                    break;
                }
                case ACTION.OFFSET: {
                    this._truckInternal(event.deltaX, event.deltaY, true, false);
                    this._isUserControllingOffset = true;
                    break;
                }
                case ACTION.DOLLY: {
                    this._dollyInternal(-delta, x, y);
                    this._isUserControllingDolly = true;
                    break;
                }
                case ACTION.ZOOM: {
                    this._zoomInternal(-delta, x, y);
                    this._isUserControllingZoom = true;
                    break;
                }
            }
            this.dispatchEvent({ type: 'control' });
        };
        const onContextMenu = (event) => {
            if (!this._domElement || !this._enabled)
                return;
            // contextmenu event is fired right after pointerdown
            // remove attached handlers and active pointer, if interrupted by contextmenu.
            if (this.mouseButtons.right === CameraControls.ACTION.NONE) {
                const pointerId = event instanceof PointerEvent ? event.pointerId : 0;
                const pointer = this._findPointerById(pointerId);
                pointer && this._disposePointer(pointer);
                // eslint-disable-next-line no-undef
                this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
                this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
                return;
            }
            event.preventDefault();
        };
        const startDragging = (event) => {
            if (!this._enabled)
                return;
            extractClientCoordFromEvent(this._activePointers, _v2);
            this._getClientRect(this._elementRect);
            dragStartPosition.copy(_v2);
            lastDragPosition.copy(_v2);
            const isMultiTouch = this._activePointers.length >= 2;
            if (isMultiTouch) {
                // 2 finger pinch
                const dx = _v2.x - this._activePointers[1].clientX;
                const dy = _v2.y - this._activePointers[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                dollyStart.set(0, distance);
                // center coords of 2 finger truck
                const x = (this._activePointers[0].clientX + this._activePointers[1].clientX) * 0.5;
                const y = (this._activePointers[0].clientY + this._activePointers[1].clientY) * 0.5;
                lastDragPosition.set(x, y);
            }
            this._state = 0;
            if (!event) {
                if (this._lockedPointer)
                    this._state = this._state | this.mouseButtons.left;
            }
            else if ('pointerType' in event && event.pointerType === 'touch') {
                switch (this._activePointers.length) {
                    case 1:
                        this._state = this.touches.one;
                        break;
                    case 2:
                        this._state = this.touches.two;
                        break;
                    case 3:
                        this._state = this.touches.three;
                        break;
                }
            }
            else {
                if (!this._lockedPointer && (event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
                    this._state = this._state | this.mouseButtons.left;
                }
                if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
                    this._state = this._state | this.mouseButtons.middle;
                }
                if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
                    this._state = this._state | this.mouseButtons.right;
                }
            }
            // stop current movement on drag start
            // - rotate
            if ((this._state & ACTION.ROTATE) === ACTION.ROTATE ||
                (this._state & ACTION.TOUCH_ROTATE) === ACTION.TOUCH_ROTATE ||
                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
                this._sphericalEnd.theta = this._spherical.theta;
                this._sphericalEnd.phi = this._spherical.phi;
                this._thetaVelocity.value = 0;
                this._phiVelocity.value = 0;
            }
            // - truck and screen-pan
            if ((this._state & ACTION.TRUCK) === ACTION.TRUCK ||
                (this._state & ACTION.SCREEN_PAN) === ACTION.SCREEN_PAN ||
                (this._state & ACTION.TOUCH_TRUCK) === ACTION.TOUCH_TRUCK ||
                (this._state & ACTION.TOUCH_SCREEN_PAN) === ACTION.TOUCH_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
                (this._state & ACTION.TOUCH_DOLLY_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK ||
                (this._state & ACTION.TOUCH_ZOOM_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN) {
                this._targetEnd.copy(this._target);
                this._targetVelocity.set(0, 0, 0);
            }
            // - dolly
            if ((this._state & ACTION.DOLLY) === ACTION.DOLLY ||
                (this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY ||
                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
                (this._state & ACTION.TOUCH_DOLLY_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE) {
                this._sphericalEnd.radius = this._spherical.radius;
                this._radiusVelocity.value = 0;
            }
            // - zoom
            if ((this._state & ACTION.ZOOM) === ACTION.ZOOM ||
                (this._state & ACTION.TOUCH_ZOOM) === ACTION.TOUCH_ZOOM ||
                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK ||
                (this._state & ACTION.TOUCH_ZOOM_SCREEN_PAN) === ACTION.TOUCH_ZOOM_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET ||
                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
                this._zoomEnd = this._zoom;
                this._zoomVelocity.value = 0;
            }
            // - offset
            if ((this._state & ACTION.OFFSET) === ACTION.OFFSET ||
                (this._state & ACTION.TOUCH_OFFSET) === ACTION.TOUCH_OFFSET ||
                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET) {
                this._focalOffsetEnd.copy(this._focalOffset);
                this._focalOffsetVelocity.set(0, 0, 0);
            }
            this.dispatchEvent({ type: 'controlstart' });
        };
        const dragging = () => {
            if (!this._enabled || !this._dragNeedsUpdate)
                return;
            this._dragNeedsUpdate = false;
            extractClientCoordFromEvent(this._activePointers, _v2);
            // When pointer lock is enabled clientX, clientY, screenX, and screenY remain 0.
            // If pointer lock is enabled, use the Delta directory, and assume active-pointer is not multiple.
            const isPointerLockActive = this._domElement && this._domElement.ownerDocument.pointerLockElement === this._domElement;
            const lockedPointer = isPointerLockActive ? this._lockedPointer || this._activePointers[0] : null;
            const deltaX = lockedPointer ? -lockedPointer.deltaX : lastDragPosition.x - _v2.x;
            const deltaY = lockedPointer ? -lockedPointer.deltaY : lastDragPosition.y - _v2.y;
            lastDragPosition.copy(_v2);
            // rotate
            if ((this._state & ACTION.ROTATE) === ACTION.ROTATE ||
                (this._state & ACTION.TOUCH_ROTATE) === ACTION.TOUCH_ROTATE ||
                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
                this._rotateInternal(deltaX, deltaY);
                this._isUserControllingRotate = true;
            }
            // mouse dolly or zoom
            if ((this._state & ACTION.DOLLY) === ACTION.DOLLY ||
                (this._state & ACTION.ZOOM) === ACTION.ZOOM) {
                const dollyX = this.dollyToCursor ? (dragStartPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
                const dollyY = this.dollyToCursor ? (dragStartPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
                const dollyDirection = this.dollyDragInverted ? -1 : 1;
                if ((this._state & ACTION.DOLLY) === ACTION.DOLLY) {
                    this._dollyInternal(dollyDirection * deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                    this._isUserControllingDolly = true;
                }
                else {
                    this._zoomInternal(dollyDirection * deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                    this._isUserControllingZoom = true;
                }
            }
            // touch dolly or zoom
            if ((this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY ||
                (this._state & ACTION.TOUCH_ZOOM) === ACTION.TOUCH_ZOOM ||
                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK ||
                (this._state & ACTION.TOUCH_DOLLY_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_ZOOM_SCREEN_PAN) === ACTION.TOUCH_ZOOM_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET ||
                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
                const dx = _v2.x - this._activePointers[1].clientX;
                const dy = _v2.y - this._activePointers[1].clientY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const dollyDelta = dollyStart.y - distance;
                dollyStart.set(0, distance);
                const dollyX = this.dollyToCursor ? (lastDragPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
                const dollyY = this.dollyToCursor ? (lastDragPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
                if ((this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY ||
                    (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
                    (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
                    (this._state & ACTION.TOUCH_DOLLY_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN ||
                    (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET) {
                    this._dollyInternal(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                    this._isUserControllingDolly = true;
                }
                else {
                    this._zoomInternal(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
                    this._isUserControllingZoom = true;
                }
            }
            // truck
            if ((this._state & ACTION.TRUCK) === ACTION.TRUCK ||
                (this._state & ACTION.TOUCH_TRUCK) === ACTION.TOUCH_TRUCK ||
                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK) {
                this._truckInternal(deltaX, deltaY, false, false);
                this._isUserControllingTruck = true;
            }
            // screen-pan
            if ((this._state & ACTION.SCREEN_PAN) === ACTION.SCREEN_PAN ||
                (this._state & ACTION.TOUCH_SCREEN_PAN) === ACTION.TOUCH_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_DOLLY_SCREEN_PAN) === ACTION.TOUCH_DOLLY_SCREEN_PAN ||
                (this._state & ACTION.TOUCH_ZOOM_SCREEN_PAN) === ACTION.TOUCH_ZOOM_SCREEN_PAN) {
                this._truckInternal(deltaX, deltaY, false, true);
                this._isUserControllingTruck = true;
            }
            // offset
            if ((this._state & ACTION.OFFSET) === ACTION.OFFSET ||
                (this._state & ACTION.TOUCH_OFFSET) === ACTION.TOUCH_OFFSET ||
                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET) {
                this._truckInternal(deltaX, deltaY, true, false);
                this._isUserControllingOffset = true;
            }
            this.dispatchEvent({ type: 'control' });
        };
        const endDragging = () => {
            extractClientCoordFromEvent(this._activePointers, _v2);
            lastDragPosition.copy(_v2);
            this._dragNeedsUpdate = false;
            if (this._activePointers.length === 0 ||
                (this._activePointers.length === 1 && this._activePointers[0] === this._lockedPointer)) {
                this._isDragging = false;
            }
            if (this._activePointers.length === 0 && this._domElement) {
                // eslint-disable-next-line no-undef
                this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
                this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
                this.dispatchEvent({ type: 'controlend' });
            }
        };
        this.lockPointer = () => {
            if (!this._enabled || !this._domElement)
                return;
            this.cancel();
            // Element.requestPointerLock is allowed to happen without any pointer active - create a faux one for compatibility with controls
            this._lockedPointer = {
                pointerId: -1,
                clientX: 0,
                clientY: 0,
                deltaX: 0,
                deltaY: 0,
                mouseButton: null,
            };
            this._activePointers.push(this._lockedPointer);
            // eslint-disable-next-line no-undef
            this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
            this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
            this._domElement.requestPointerLock();
            this._domElement.ownerDocument.addEventListener('pointerlockchange', onPointerLockChange);
            this._domElement.ownerDocument.addEventListener('pointerlockerror', onPointerLockError);
            this._domElement.ownerDocument.addEventListener('pointermove', onPointerMove, { passive: false });
            this._domElement.ownerDocument.addEventListener('pointerup', onPointerUp);
            startDragging();
        };
        this.unlockPointer = () => {
            if (this._lockedPointer !== null) {
                this._disposePointer(this._lockedPointer);
                this._lockedPointer = null;
            }
            this._domElement?.ownerDocument.exitPointerLock();
            this._domElement?.ownerDocument.removeEventListener('pointerlockchange', onPointerLockChange);
            this._domElement?.ownerDocument.removeEventListener('pointerlockerror', onPointerLockError);
            this.cancel();
        };
        const onPointerLockChange = () => {
            const isPointerLockActive = this._domElement && this._domElement.ownerDocument.pointerLockElement === this._domElement;
            if (!isPointerLockActive)
                this.unlockPointer();
        };
        const onPointerLockError = () => {
            this.unlockPointer();
        };
        this._addAllEventListeners = (domElement) => {
            this._domElement = domElement;
            this._domElement.style.touchAction = 'none';
            this._domElement.style.userSelect = 'none';
            this._domElement.style.webkitUserSelect = 'none';
            this._domElement.addEventListener('pointerdown', onPointerDown);
            this._domElement.addEventListener('pointercancel', onPointerUp);
            this._domElement.addEventListener('wheel', onMouseWheel, { passive: false });
            this._domElement.addEventListener('contextmenu', onContextMenu);
        };
        this._removeAllEventListeners = () => {
            if (!this._domElement)
                return;
            this._domElement.style.touchAction = '';
            this._domElement.style.userSelect = '';
            this._domElement.style.webkitUserSelect = '';
            this._domElement.removeEventListener('pointerdown', onPointerDown);
            this._domElement.removeEventListener('pointercancel', onPointerUp);
            // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener#matching_event_listeners_for_removal
            // > it's probably wise to use the same values used for the call to `addEventListener()` when calling `removeEventListener()`
            // see https://github.com/microsoft/TypeScript/issues/32912#issuecomment-522142969
            // eslint-disable-next-line no-undef
            this._domElement.removeEventListener('wheel', onMouseWheel, { passive: false });
            this._domElement.removeEventListener('contextmenu', onContextMenu);
            // eslint-disable-next-line no-undef
            this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
            this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
            this._domElement.ownerDocument.removeEventListener('pointerlockchange', onPointerLockChange);
            this._domElement.ownerDocument.removeEventListener('pointerlockerror', onPointerLockError);
        };
        this.cancel = () => {
            if (this._state === ACTION.NONE)
                return;
            this._state = ACTION.NONE;
            this._activePointers.length = 0;
            endDragging();
        };
        if (domElement)
            this.connect(domElement);
        this.update(0);
    }
    /**
     * The camera to be controlled
     * @category Properties
     */
    get camera() {
        return this._camera;
    }
    set camera(camera) {
        this._camera = camera;
        this.updateCameraUp();
        this._camera.updateProjectionMatrix();
        this._updateNearPlaneCorners();
        this._needsUpdate = true;
    }
    /**
     * Whether or not the controls are enabled.
     * `false` to disable user dragging/touch-move, but all methods works.
     * @category Properties
     */
    get enabled() {
        return this._enabled;
    }
    set enabled(enabled) {
        this._enabled = enabled;
        if (!this._domElement)
            return;
        if (enabled) {
            this._domElement.style.touchAction = 'none';
            this._domElement.style.userSelect = 'none';
            this._domElement.style.webkitUserSelect = 'none';
        }
        else {
            this.cancel();
            this._domElement.style.touchAction = '';
            this._domElement.style.userSelect = '';
            this._domElement.style.webkitUserSelect = '';
        }
    }
    /**
     * Returns `true` if the controls are active updating.
     * readonly value.
     * @category Properties
     */
    get active() {
        return !this._hasRested;
    }
    /**
     * Getter for the current `ACTION`.
     * readonly value.
     * @category Properties
     */
    get currentAction() {
        return this._state;
    }
    /**
     * get/set Current distance.
     * @category Properties
     */
    get distance() {
        return this._spherical.radius;
    }
    set distance(distance) {
        if (this._spherical.radius === distance &&
            this._sphericalEnd.radius === distance)
            return;
        this._spherical.radius = distance;
        this._sphericalEnd.radius = distance;
        this._needsUpdate = true;
    }
    // horizontal angle
    /**
     * get/set the azimuth angle (horizontal) in radians.
     * Every 360 degrees turn is added to `.azimuthAngle` value, which is accumulative.
     * @category Properties
     */
    get azimuthAngle() {
        return this._spherical.theta;
    }
    set azimuthAngle(azimuthAngle) {
        if (this._spherical.theta === azimuthAngle &&
            this._sphericalEnd.theta === azimuthAngle)
            return;
        this._spherical.theta = azimuthAngle;
        this._sphericalEnd.theta = azimuthAngle;
        this._needsUpdate = true;
    }
    // vertical angle
    /**
     * get/set the polar angle (vertical) in radians.
     * @category Properties
     */
    get polarAngle() {
        return this._spherical.phi;
    }
    set polarAngle(polarAngle) {
        if (this._spherical.phi === polarAngle &&
            this._sphericalEnd.phi === polarAngle)
            return;
        this._spherical.phi = polarAngle;
        this._sphericalEnd.phi = polarAngle;
        this._needsUpdate = true;
    }
    /**
     * Whether camera position should be enclosed in the boundary or not.
     * @category Properties
     */
    get boundaryEnclosesCamera() {
        return this._boundaryEnclosesCamera;
    }
    set boundaryEnclosesCamera(boundaryEnclosesCamera) {
        this._boundaryEnclosesCamera = boundaryEnclosesCamera;
        this._needsUpdate = true;
    }
    /**
     * Set drag-start, touches and wheel enable area in the domElement.
     * each values are between `0` and `1` inclusive, where `0` is left/top and `1` is right/bottom of the screen.
     * e.g. `{ x: 0, y: 0, width: 1, height: 1 }` for entire area.
     * @category Properties
     */
    set interactiveArea(interactiveArea) {
        this._interactiveArea.width = clamp(interactiveArea.width, 0, 1);
        this._interactiveArea.height = clamp(interactiveArea.height, 0, 1);
        this._interactiveArea.x = clamp(interactiveArea.x, 0, 1 - this._interactiveArea.width);
        this._interactiveArea.y = clamp(interactiveArea.y, 0, 1 - this._interactiveArea.height);
    }
    /**
     * Adds the specified event listener.
     * Applicable event types (which is `K`) are:
     * | Event name          | Timing |
     * | ------------------- | ------ |
     * | `'controlstart'`    | When the user starts to control the camera via mouse / touches. ¹ |
     * | `'control'`         | When the user controls the camera (dragging). |
     * | `'controlend'`      | When the user ends to control the camera. ¹ |
     * | `'transitionstart'` | When any kind of transition starts, either user control or using a method with `enableTransition = true` |
     * | `'update'`          | When the camera position is updated. |
     * | `'wake'`            | When the camera starts moving. |
     * | `'rest'`            | When the camera movement is below `.restThreshold` ². |
     * | `'sleep'`           | When the camera end moving. |
     *
     * 1. `mouseButtons.wheel` (Mouse wheel control) does not emit `'controlstart'` and `'controlend'`. `mouseButtons.wheel` uses scroll-event internally, and scroll-event happens intermittently. That means "start" and "end" cannot be detected.
     * 2. Due to damping, `sleep` will usually fire a few seconds after the camera _appears_ to have stopped moving. If you want to do something (e.g. enable UI, perform another transition) at the point when the camera has stopped, you probably want the `rest` event. This can be fine tuned using the `.restThreshold` parameter. See the [Rest and Sleep Example](https://yomotsu.github.io/camera-controls/examples/rest-and-sleep.html).
     *
     * e.g.
     * ```
     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
     * ```
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener(type, listener) {
        super.addEventListener(type, listener);
    }
    /**
     * Removes the specified event listener
     * e.g.
     * ```
     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
     * ```
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener(type, listener) {
        super.removeEventListener(type, listener);
    }
    /**
     * Rotate azimuthal angle(horizontal) and polar angle(vertical).
     * Every value is added to the current value.
     * @param azimuthAngle Azimuth rotate angle. In radian.
     * @param polarAngle Polar rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotate(azimuthAngle, polarAngle, enableTransition = false) {
        return this.rotateTo(this._sphericalEnd.theta + azimuthAngle, this._sphericalEnd.phi + polarAngle, enableTransition);
    }
    /**
     * Rotate azimuthal angle(horizontal) to the given angle and keep the same polar angle(vertical) target.
     *
     * e.g.
     * ```
     * cameraControls.rotateAzimuthTo( 30 * THREE.MathUtils.DEG2RAD, true );
     * ```
     * @param azimuthAngle Azimuth rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotateAzimuthTo(azimuthAngle, enableTransition = false) {
        return this.rotateTo(azimuthAngle, this._sphericalEnd.phi, enableTransition);
    }
    /**
     * Rotate polar angle(vertical) to the given angle and keep the same azimuthal angle(horizontal) target.
     *
     * e.g.
     * ```
     * cameraControls.rotatePolarTo( 30 * THREE.MathUtils.DEG2RAD, true );
     * ```
     * @param polarAngle Polar rotate angle. In radian.
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    rotatePolarTo(polarAngle, enableTransition = false) {
        return this.rotateTo(this._sphericalEnd.theta, polarAngle, enableTransition);
    }
    /**
     * Rotate azimuthal angle(horizontal) and polar angle(vertical) to the given angle.
     * Camera view will rotate over the orbit pivot absolutely:
     *
     * azimuthAngle
     * ```
     *       0º
     *         \
     * 90º -----+----- -90º
     *           \
     *           180º
     * ```
     * | direction | angle                  |
     * | --------- | ---------------------- |
     * | front     | 0º                     |
     * | left      | 90º (`Math.PI / 2`)    |
     * | right     | -90º (`- Math.PI / 2`) |
     * | back      | 180º (`Math.PI`)       |
     *
     * polarAngle
     * ```
     *     180º
     *      |
     *      90º
     *      |
     *      0º
     * ```
     * | direction            | angle                  |
     * | -------------------- | ---------------------- |
     * | top/sky              | 180º (`Math.PI`)       |
     * | horizontal from view | 90º (`Math.PI / 2`)    |
     * | bottom/floor         | 0º                     |
     *
     * @param azimuthAngle Azimuth rotate angle to. In radian.
     * @param polarAngle Polar rotate angle to. In radian.
     * @param enableTransition  Whether to move smoothly or immediately
     * @category Methods
     */
    rotateTo(azimuthAngle, polarAngle, enableTransition = false) {
        this._isUserControllingRotate = false;
        const theta = clamp(azimuthAngle, this.minAzimuthAngle, this.maxAzimuthAngle);
        const phi = clamp(polarAngle, this.minPolarAngle, this.maxPolarAngle);
        this._sphericalEnd.theta = theta;
        this._sphericalEnd.phi = phi;
        this._sphericalEnd.makeSafe();
        this._needsUpdate = true;
        if (!enableTransition) {
            this._spherical.theta = this._sphericalEnd.theta;
            this._spherical.phi = this._sphericalEnd.phi;
        }
        const resolveImmediately = !enableTransition ||
            approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Dolly in/out camera position.
     * @param distance Distance of dollyIn. Negative number for dollyOut.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dolly(distance, enableTransition = false) {
        return this.dollyTo(this._sphericalEnd.radius - distance, enableTransition);
    }
    /**
     * Dolly in/out camera position to given distance.
     * @param distance Distance of dolly.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dollyTo(distance, enableTransition = false) {
        this._isUserControllingDolly = false;
        this._lastDollyDirection = DOLLY_DIRECTION.NONE;
        this._changedDolly = 0;
        return this._dollyToNoClamp(clamp(distance, this.minDistance, this.maxDistance), enableTransition);
    }
    _dollyToNoClamp(distance, enableTransition = false) {
        const lastRadius = this._sphericalEnd.radius;
        const hasCollider = this.colliderMeshes.length >= 1;
        if (hasCollider) {
            const maxDistanceByCollisionTest = this._collisionTest();
            const isCollided = approxEquals(maxDistanceByCollisionTest, this._spherical.radius);
            const isDollyIn = lastRadius > distance;
            if (!isDollyIn && isCollided)
                return Promise.resolve();
            this._sphericalEnd.radius = Math.min(distance, maxDistanceByCollisionTest);
        }
        else {
            this._sphericalEnd.radius = distance;
        }
        this._needsUpdate = true;
        if (!enableTransition) {
            this._spherical.radius = this._sphericalEnd.radius;
        }
        const resolveImmediately = !enableTransition || approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Dolly in, but does not change the distance between the target and the camera, and moves the target position instead.
     * Specify a negative value for dolly out.
     * @param distance Distance of dolly.
     * @param enableTransition Whether to move smoothly or immediately.
     * @category Methods
     */
    dollyInFixed(distance, enableTransition = false) {
        this._targetEnd.add(this._getCameraDirection(_cameraDirection).multiplyScalar(distance));
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        const resolveImmediately = !enableTransition ||
            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Zoom in/out camera. The value is added to camera zoom.
     * Limits set with `.minZoom` and `.maxZoom`
     * @param zoomStep zoom scale
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    zoom(zoomStep, enableTransition = false) {
        return this.zoomTo(this._zoomEnd + zoomStep, enableTransition);
    }
    /**
     * Zoom in/out camera to given scale. The value overwrites camera zoom.
     * Limits set with .minZoom and .maxZoom
     * @param zoom
     * @param enableTransition
     * @category Methods
     */
    zoomTo(zoom, enableTransition = false) {
        this._isUserControllingZoom = false;
        this._zoomEnd = clamp(zoom, this.minZoom, this.maxZoom);
        this._needsUpdate = true;
        if (!enableTransition) {
            this._zoom = this._zoomEnd;
        }
        const resolveImmediately = !enableTransition || approxEquals(this._zoom, this._zoomEnd, this.restThreshold);
        this._changedZoom = 0;
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * @deprecated `pan()` has been renamed to `truck()`
     * @category Methods
     */
    pan(x, y, enableTransition = false) {
        console.warn('`pan` has been renamed to `truck`');
        return this.truck(x, y, enableTransition);
    }
    /**
     * Truck and pedestal camera using current azimuthal angle
     * @param x Horizontal translate amount
     * @param y Vertical translate amount
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    truck(x, y, enableTransition = false) {
        this._camera.updateMatrix();
        _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
        _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
        _xColumn.multiplyScalar(x);
        _yColumn.multiplyScalar(-y);
        const offset = _v3A$1.copy(_xColumn).add(_yColumn);
        const to = _v3B$1.copy(this._targetEnd).add(offset);
        return this.moveTo(to.x, to.y, to.z, enableTransition);
    }
    /**
     * Move forward / backward.
     * @param distance Amount to move forward / backward. Negative value to move backward
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    forward(distance, enableTransition = false) {
        _v3A$1.setFromMatrixColumn(this._camera.matrix, 0);
        _v3A$1.crossVectors(this._camera.up, _v3A$1);
        _v3A$1.multiplyScalar(distance);
        const to = _v3B$1.copy(this._targetEnd).add(_v3A$1);
        return this.moveTo(to.x, to.y, to.z, enableTransition);
    }
    /**
     * Move up / down.
     * @param height Amount to move up / down. Negative value to move down
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    elevate(height, enableTransition = false) {
        _v3A$1.copy(this._camera.up).multiplyScalar(height);
        return this.moveTo(this._targetEnd.x + _v3A$1.x, this._targetEnd.y + _v3A$1.y, this._targetEnd.z + _v3A$1.z, enableTransition);
    }
    /**
     * Move target position to given point.
     * @param x x coord to move center position
     * @param y y coord to move center position
     * @param z z coord to move center position
     * @param enableTransition Whether to move smoothly or immediately
     * @category Methods
     */
    moveTo(x, y, z, enableTransition = false) {
        this._isUserControllingTruck = false;
        const offset = _v3A$1.set(x, y, z).sub(this._targetEnd);
        this._encloseToBoundary(this._targetEnd, offset, this.boundaryFriction);
        this._needsUpdate = true;
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        const resolveImmediately = !enableTransition ||
            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Look in the given point direction.
     * @param x point x.
     * @param y point y.
     * @param z point z.
     * @param enableTransition Whether to move smoothly or immediately.
     * @returns Transition end promise
     * @category Methods
     */
    lookInDirectionOf(x, y, z, enableTransition = false) {
        const point = _v3A$1.set(x, y, z);
        const direction = point.sub(this._targetEnd).normalize();
        const position = direction.multiplyScalar(-this._sphericalEnd.radius).add(this._targetEnd);
        return this.setPosition(position.x, position.y, position.z, enableTransition);
    }
    /**
     * Fit the viewport to the box or the bounding box of the object, using the nearest axis. paddings are in unit.
     * set `cover: true` to fill enter screen.
     * e.g.
     * ```
     * cameraControls.fitToBox( myMesh );
     * ```
     * @param box3OrObject Axis aligned bounding box to fit the view.
     * @param enableTransition Whether to move smoothly or immediately.
     * @param options | `<object>` { cover: boolean, paddingTop: number, paddingLeft: number, paddingBottom: number, paddingRight: number }
     * @returns Transition end promise
     * @category Methods
     */
    fitToBox(box3OrObject, enableTransition, { cover = false, paddingLeft = 0, paddingRight = 0, paddingBottom = 0, paddingTop = 0 } = {}) {
        const promises = [];
        const aabb = box3OrObject.isBox3
            ? _box3A.copy(box3OrObject)
            : _box3A.setFromObject(box3OrObject);
        if (aabb.isEmpty()) {
            console.warn('camera-controls: fitTo() cannot be used with an empty box. Aborting');
            Promise.resolve();
        }
        // round to closest axis ( forward | backward | right | left | top | bottom )
        const theta = roundToStep(this._sphericalEnd.theta, PI_HALF);
        const phi = roundToStep(this._sphericalEnd.phi, PI_HALF);
        promises.push(this.rotateTo(theta, phi, enableTransition));
        const normal = _v3A$1.setFromSpherical(this._sphericalEnd).normalize();
        const rotation = _quaternionA.setFromUnitVectors(normal, _AXIS_Z);
        const viewFromPolar = approxEquals(Math.abs(normal.y), 1);
        if (viewFromPolar) {
            rotation.multiply(_quaternionB.setFromAxisAngle(_AXIS_Y, theta));
        }
        rotation.multiply(this._yAxisUpSpaceInverse);
        // make oriented bounding box
        const bb = _box3B.makeEmpty();
        // left bottom back corner
        _v3B$1.copy(aabb.min).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // right bottom back corner
        _v3B$1.copy(aabb.min).setX(aabb.max.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // left top back corner
        _v3B$1.copy(aabb.min).setY(aabb.max.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // right top back corner
        _v3B$1.copy(aabb.max).setZ(aabb.min.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // left bottom front corner
        _v3B$1.copy(aabb.min).setZ(aabb.max.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // right bottom front corner
        _v3B$1.copy(aabb.max).setY(aabb.min.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // left top front corner
        _v3B$1.copy(aabb.max).setX(aabb.min.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // right top front corner
        _v3B$1.copy(aabb.max).applyQuaternion(rotation);
        bb.expandByPoint(_v3B$1);
        // add padding
        bb.min.x -= paddingLeft;
        bb.min.y -= paddingBottom;
        bb.max.x += paddingRight;
        bb.max.y += paddingTop;
        rotation.setFromUnitVectors(_AXIS_Z, normal);
        if (viewFromPolar) {
            rotation.premultiply(_quaternionB.invert());
        }
        rotation.premultiply(this._yAxisUpSpace);
        const bbSize = bb.getSize(_v3A$1);
        const center = bb.getCenter(_v3B$1).applyQuaternion(rotation);
        if (isPerspectiveCamera(this._camera)) {
            const distance = this.getDistanceToFitBox(bbSize.x, bbSize.y, bbSize.z, cover);
            promises.push(this.moveTo(center.x, center.y, center.z, enableTransition));
            promises.push(this.dollyTo(distance, enableTransition));
            promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
        }
        else if (isOrthographicCamera(this._camera)) {
            const camera = this._camera;
            const width = camera.right - camera.left;
            const height = camera.top - camera.bottom;
            const zoom = cover ? Math.max(width / bbSize.x, height / bbSize.y) : Math.min(width / bbSize.x, height / bbSize.y);
            promises.push(this.moveTo(center.x, center.y, center.z, enableTransition));
            promises.push(this.zoomTo(zoom, enableTransition));
            promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
        }
        return Promise.all(promises);
    }
    /**
     * Fit the viewport to the sphere or the bounding sphere of the object.
     * @param sphereOrMesh
     * @param enableTransition
     * @category Methods
     */
    fitToSphere(sphereOrMesh, enableTransition) {
        const promises = [];
        const isObject3D = 'isObject3D' in sphereOrMesh;
        const boundingSphere = isObject3D ?
            CameraControls.createBoundingSphere(sphereOrMesh, _sphere) :
            _sphere.copy(sphereOrMesh);
        promises.push(this.moveTo(boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z, enableTransition));
        if (isPerspectiveCamera(this._camera)) {
            const distanceToFit = this.getDistanceToFitSphere(boundingSphere.radius);
            promises.push(this.dollyTo(distanceToFit, enableTransition));
        }
        else if (isOrthographicCamera(this._camera)) {
            const width = this._camera.right - this._camera.left;
            const height = this._camera.top - this._camera.bottom;
            const diameter = 2 * boundingSphere.radius;
            const zoom = Math.min(width / diameter, height / diameter);
            promises.push(this.zoomTo(zoom, enableTransition));
        }
        promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
        return Promise.all(promises);
    }
    /**
     * Look at the `target` from the `position`.
     * @param positionX
     * @param positionY
     * @param positionZ
     * @param targetX
     * @param targetY
     * @param targetZ
     * @param enableTransition
     * @category Methods
     */
    setLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition = false) {
        this._isUserControllingRotate = false;
        this._isUserControllingDolly = false;
        this._isUserControllingTruck = false;
        this._lastDollyDirection = DOLLY_DIRECTION.NONE;
        this._changedDolly = 0;
        const target = _v3B$1.set(targetX, targetY, targetZ);
        const position = _v3A$1.set(positionX, positionY, positionZ);
        this._targetEnd.copy(target);
        this._sphericalEnd.setFromVector3(position.sub(target).applyQuaternion(this._yAxisUpSpace));
        this._needsUpdate = true;
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        const resolveImmediately = !enableTransition ||
            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold) &&
                approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold) &&
                approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Interpolates between two states.
     * @param stateA
     * @param stateB
     * @param t
     * @param enableTransition
     * @category Methods
     */
    lerp(stateA, stateB, t, enableTransition = false) {
        this._isUserControllingRotate = false;
        this._isUserControllingDolly = false;
        this._isUserControllingTruck = false;
        this._lastDollyDirection = DOLLY_DIRECTION.NONE;
        this._changedDolly = 0;
        const targetA = _v3A$1.set(...stateA.target);
        if ('spherical' in stateA) {
            _sphericalA.set(...stateA.spherical);
        }
        else {
            const positionA = _v3B$1.set(...stateA.position);
            _sphericalA.setFromVector3(positionA.sub(targetA).applyQuaternion(this._yAxisUpSpace));
        }
        const targetB = _v3C$1.set(...stateB.target);
        if ('spherical' in stateB) {
            _sphericalB.set(...stateB.spherical);
        }
        else {
            const positionB = _v3B$1.set(...stateB.position);
            _sphericalB.setFromVector3(positionB.sub(targetB).applyQuaternion(this._yAxisUpSpace));
        }
        this._targetEnd.copy(targetA.lerp(targetB, t)); // tricky
        const deltaTheta = _sphericalB.theta - _sphericalA.theta;
        const deltaPhi = _sphericalB.phi - _sphericalA.phi;
        const deltaRadius = _sphericalB.radius - _sphericalA.radius;
        this._sphericalEnd.set(_sphericalA.radius + deltaRadius * t, _sphericalA.phi + deltaPhi * t, _sphericalA.theta + deltaTheta * t);
        this._needsUpdate = true;
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        const resolveImmediately = !enableTransition ||
            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold) &&
                approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold) &&
                approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Similar to setLookAt, but it interpolates between two states.
     * @param positionAX
     * @param positionAY
     * @param positionAZ
     * @param targetAX
     * @param targetAY
     * @param targetAZ
     * @param positionBX
     * @param positionBY
     * @param positionBZ
     * @param targetBX
     * @param targetBY
     * @param targetBZ
     * @param t
     * @param enableTransition
     * @category Methods
     */
    lerpLookAt(positionAX, positionAY, positionAZ, targetAX, targetAY, targetAZ, positionBX, positionBY, positionBZ, targetBX, targetBY, targetBZ, t, enableTransition = false) {
        return this.lerp({
            position: [positionAX, positionAY, positionAZ],
            target: [targetAX, targetAY, targetAZ],
        }, {
            position: [positionBX, positionBY, positionBZ],
            target: [targetBX, targetBY, targetBZ],
        }, t, enableTransition);
    }
    /**
     * Set angle and distance by given position.
     * An alias of `setLookAt()`, without target change. Thus keep gazing at the current target
     * @param positionX
     * @param positionY
     * @param positionZ
     * @param enableTransition
     * @category Methods
     */
    setPosition(positionX, positionY, positionZ, enableTransition = false) {
        return this.setLookAt(positionX, positionY, positionZ, this._targetEnd.x, this._targetEnd.y, this._targetEnd.z, enableTransition);
    }
    /**
     * Set the target position where gaze at.
     * An alias of `setLookAt()`, without position change. Thus keep the same position.
     * @param targetX
     * @param targetY
     * @param targetZ
     * @param enableTransition
     * @category Methods
     */
    setTarget(targetX, targetY, targetZ, enableTransition = false) {
        const pos = this.getPosition(_v3A$1);
        const promise = this.setLookAt(pos.x, pos.y, pos.z, targetX, targetY, targetZ, enableTransition);
        // see https://github.com/yomotsu/camera-controls/issues/335
        this._sphericalEnd.phi = clamp(this._sphericalEnd.phi, this.minPolarAngle, this.maxPolarAngle);
        return promise;
    }
    /**
     * Set focal offset using the screen parallel coordinates. z doesn't affect in Orthographic as with Dolly.
     * @param x
     * @param y
     * @param z
     * @param enableTransition
     * @category Methods
     */
    setFocalOffset(x, y, z, enableTransition = false) {
        this._isUserControllingOffset = false;
        this._focalOffsetEnd.set(x, y, z);
        this._needsUpdate = true;
        if (!enableTransition)
            this._focalOffset.copy(this._focalOffsetEnd);
        const resolveImmediately = !enableTransition ||
            approxEquals(this._focalOffset.x, this._focalOffsetEnd.x, this.restThreshold) &&
                approxEquals(this._focalOffset.y, this._focalOffsetEnd.y, this.restThreshold) &&
                approxEquals(this._focalOffset.z, this._focalOffsetEnd.z, this.restThreshold);
        return this._createOnRestPromise(resolveImmediately);
    }
    /**
     * Set orbit point without moving the camera.
     * SHOULD NOT RUN DURING ANIMATIONS. `setOrbitPoint()` will immediately fix the positions.
     * @param targetX
     * @param targetY
     * @param targetZ
     * @category Methods
     */
    setOrbitPoint(targetX, targetY, targetZ) {
        this._camera.updateMatrixWorld();
        _xColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 0);
        _yColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 1);
        _zColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 2);
        const position = _v3A$1.set(targetX, targetY, targetZ);
        const distance = position.distanceTo(this._camera.position);
        const cameraToPoint = position.sub(this._camera.position);
        _xColumn.multiplyScalar(cameraToPoint.x);
        _yColumn.multiplyScalar(cameraToPoint.y);
        _zColumn.multiplyScalar(cameraToPoint.z);
        _v3A$1.copy(_xColumn).add(_yColumn).add(_zColumn);
        _v3A$1.z = _v3A$1.z + distance;
        this.dollyTo(distance, false);
        this.setFocalOffset(-_v3A$1.x, _v3A$1.y, -_v3A$1.z, false);
        this.moveTo(targetX, targetY, targetZ, false);
    }
    /**
     * Set the boundary box that encloses the target of the camera. box3 is in THREE.Box3
     * @param box3
     * @category Methods
     */
    setBoundary(box3) {
        if (!box3) {
            this._boundary.min.set(-Infinity, -Infinity, -Infinity);
            this._boundary.max.set(Infinity, Infinity, Infinity);
            this._needsUpdate = true;
            return;
        }
        this._boundary.copy(box3);
        this._boundary.clampPoint(this._targetEnd, this._targetEnd);
        this._needsUpdate = true;
    }
    /**
     * Set (or unset) the current viewport.
     * Set this when you want to use renderer viewport and .dollyToCursor feature at the same time.
     * @param viewportOrX
     * @param y
     * @param width
     * @param height
     * @category Methods
     */
    setViewport(viewportOrX, y, width, height) {
        if (viewportOrX === null) { // null
            this._viewport = null;
            return;
        }
        this._viewport = this._viewport || new THREE.Vector4();
        if (typeof viewportOrX === 'number') { // number
            this._viewport.set(viewportOrX, y, width, height);
        }
        else { // Vector4
            this._viewport.copy(viewportOrX);
        }
    }
    /**
     * Calculate the distance to fit the box.
     * @param width box width
     * @param height box height
     * @param depth box depth
     * @returns distance
     * @category Methods
     */
    getDistanceToFitBox(width, height, depth, cover = false) {
        if (notSupportedInOrthographicCamera(this._camera, 'getDistanceToFitBox'))
            return this._spherical.radius;
        const boundingRectAspect = width / height;
        const fov = this._camera.getEffectiveFOV() * DEG2RAD;
        const aspect = this._camera.aspect;
        const heightToFit = (cover ? boundingRectAspect > aspect : boundingRectAspect < aspect) ? height : width / aspect;
        return heightToFit * 0.5 / Math.tan(fov * 0.5) + depth * 0.5;
    }
    /**
     * Calculate the distance to fit the sphere.
     * @param radius sphere radius
     * @returns distance
     * @category Methods
     */
    getDistanceToFitSphere(radius) {
        if (notSupportedInOrthographicCamera(this._camera, 'getDistanceToFitSphere'))
            return this._spherical.radius;
        // https://stackoverflow.com/a/44849975
        const vFOV = this._camera.getEffectiveFOV() * DEG2RAD;
        const hFOV = Math.atan(Math.tan(vFOV * 0.5) * this._camera.aspect) * 2;
        const fov = 1 < this._camera.aspect ? vFOV : hFOV;
        return radius / (Math.sin(fov * 0.5));
    }
    /**
     * Returns the orbit center position, where the camera looking at.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getTarget(out, receiveEndValue = true) {
        const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
        return _out.copy(receiveEndValue ? this._targetEnd : this._target);
    }
    /**
     * Returns the camera position.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getPosition(out, receiveEndValue = true) {
        const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
        return _out.setFromSpherical(receiveEndValue ? this._sphericalEnd : this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(receiveEndValue ? this._targetEnd : this._target);
    }
    /**
     * Returns the spherical coordinates of the orbit.
     * @param out The receiving Spherical instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getSpherical(out, receiveEndValue = true) {
        const _out = out || new THREE.Spherical();
        return _out.copy(receiveEndValue ? this._sphericalEnd : this._spherical);
    }
    /**
     * Returns the focal offset, which is how much the camera appears to be translated in screen parallel coordinates.
     * @param out The receiving Vector3 instance to copy the result
     * @param receiveEndValue Whether receive the transition end coords or current. default is `true`
     * @category Methods
     */
    getFocalOffset(out, receiveEndValue = true) {
        const _out = !!out && out.isVector3 ? out : new THREE.Vector3();
        return _out.copy(receiveEndValue ? this._focalOffsetEnd : this._focalOffset);
    }
    /**
     * Normalize camera azimuth angle (horizontal rotation) between -180 and 180 degrees.
     * @returns This CameraControls instance.
     * @category Methods
     */
    normalizeRotations() {
        this._sphericalEnd.theta = ((this._sphericalEnd.theta % PI_2) + PI_2) % PI_2;
        if (this._sphericalEnd.theta > Math.PI)
            this._sphericalEnd.theta -= PI_2;
        this._spherical.theta += PI_2 * Math.round((this._sphericalEnd.theta - this._spherical.theta) / PI_2);
        return this;
    }
    /**
     * stop all transitions.
     */
    stop() {
        this._focalOffset.copy(this._focalOffsetEnd);
        this._target.copy(this._targetEnd);
        this._spherical.copy(this._sphericalEnd);
        this._zoom = this._zoomEnd;
    }
    /**
     * Reset all rotation and position to defaults.
     * @param enableTransition
     * @category Methods
     */
    reset(enableTransition = false) {
        if (!approxEquals(this._camera.up.x, this._cameraUp0.x) ||
            !approxEquals(this._camera.up.y, this._cameraUp0.y) ||
            !approxEquals(this._camera.up.z, this._cameraUp0.z)) {
            this._camera.up.copy(this._cameraUp0);
            const position = this.getPosition(_v3A$1);
            this.updateCameraUp();
            this.setPosition(position.x, position.y, position.z);
        }
        const promises = [
            this.setLookAt(this._position0.x, this._position0.y, this._position0.z, this._target0.x, this._target0.y, this._target0.z, enableTransition),
            this.setFocalOffset(this._focalOffset0.x, this._focalOffset0.y, this._focalOffset0.z, enableTransition),
            this.zoomTo(this._zoom0, enableTransition),
        ];
        return Promise.all(promises);
    }
    /**
     * Set current camera position as the default position.
     * @category Methods
     */
    saveState() {
        this._cameraUp0.copy(this._camera.up);
        this.getTarget(this._target0);
        this.getPosition(this._position0);
        this._zoom0 = this._zoom;
        this._focalOffset0.copy(this._focalOffset);
    }
    /**
     * Sync camera-up direction.
     * When camera-up vector is changed, `.updateCameraUp()` must be called.
     * @category Methods
     */
    updateCameraUp() {
        this._yAxisUpSpace.setFromUnitVectors(this._camera.up, _AXIS_Y);
        this._yAxisUpSpaceInverse.copy(this._yAxisUpSpace).invert();
    }
    /**
     * Apply current camera-up direction to the camera.
     * The orbit system will be re-initialized with the current position.
     * @category Methods
     */
    applyCameraUp() {
        const cameraDirection = _v3A$1.subVectors(this._target, this._camera.position).normalize();
        // So first find the vector off to the side, orthogonal to both this.object.up and
        // the "view" vector.
        const side = _v3B$1.crossVectors(cameraDirection, this._camera.up);
        // Then find the vector orthogonal to both this "side" vector and the "view" vector.
        // This vector will be the new "up" vector.
        this._camera.up.crossVectors(side, cameraDirection).normalize();
        this._camera.updateMatrixWorld();
        const position = this.getPosition(_v3A$1);
        this.updateCameraUp();
        this.setPosition(position.x, position.y, position.z);
    }
    /**
     * Update camera position and directions.
     * This should be called in your tick loop every time, and returns true if re-rendering is needed.
     * @param delta
     * @returns updated
     * @category Methods
     */
    update(delta) {
        const deltaTheta = this._sphericalEnd.theta - this._spherical.theta;
        const deltaPhi = this._sphericalEnd.phi - this._spherical.phi;
        const deltaRadius = this._sphericalEnd.radius - this._spherical.radius;
        const deltaTarget = _deltaTarget.subVectors(this._targetEnd, this._target);
        const deltaOffset = _deltaOffset.subVectors(this._focalOffsetEnd, this._focalOffset);
        const deltaZoom = this._zoomEnd - this._zoom;
        // update theta
        if (approxZero(deltaTheta)) {
            this._thetaVelocity.value = 0;
            this._spherical.theta = this._sphericalEnd.theta;
        }
        else {
            const smoothTime = this._isUserControllingRotate ? this.draggingSmoothTime : this.smoothTime;
            this._spherical.theta = smoothDamp(this._spherical.theta, this._sphericalEnd.theta, this._thetaVelocity, smoothTime, Infinity, delta);
            this._needsUpdate = true;
        }
        // update phi
        if (approxZero(deltaPhi)) {
            this._phiVelocity.value = 0;
            this._spherical.phi = this._sphericalEnd.phi;
        }
        else {
            const smoothTime = this._isUserControllingRotate ? this.draggingSmoothTime : this.smoothTime;
            this._spherical.phi = smoothDamp(this._spherical.phi, this._sphericalEnd.phi, this._phiVelocity, smoothTime, Infinity, delta);
            this._needsUpdate = true;
        }
        // update distance
        if (approxZero(deltaRadius)) {
            this._radiusVelocity.value = 0;
            this._spherical.radius = this._sphericalEnd.radius;
        }
        else {
            const smoothTime = this._isUserControllingDolly ? this.draggingSmoothTime : this.smoothTime;
            this._spherical.radius = smoothDamp(this._spherical.radius, this._sphericalEnd.radius, this._radiusVelocity, smoothTime, this.maxSpeed, delta);
            this._needsUpdate = true;
        }
        // update target position
        if (approxZero(deltaTarget.x) && approxZero(deltaTarget.y) && approxZero(deltaTarget.z)) {
            this._targetVelocity.set(0, 0, 0);
            this._target.copy(this._targetEnd);
        }
        else {
            const smoothTime = this._isUserControllingTruck ? this.draggingSmoothTime : this.smoothTime;
            smoothDampVec3(this._target, this._targetEnd, this._targetVelocity, smoothTime, this.maxSpeed, delta, this._target);
            this._needsUpdate = true;
        }
        // update focalOffset
        if (approxZero(deltaOffset.x) && approxZero(deltaOffset.y) && approxZero(deltaOffset.z)) {
            this._focalOffsetVelocity.set(0, 0, 0);
            this._focalOffset.copy(this._focalOffsetEnd);
        }
        else {
            const smoothTime = this._isUserControllingOffset ? this.draggingSmoothTime : this.smoothTime;
            smoothDampVec3(this._focalOffset, this._focalOffsetEnd, this._focalOffsetVelocity, smoothTime, this.maxSpeed, delta, this._focalOffset);
            this._needsUpdate = true;
        }
        // update zoom
        if (approxZero(deltaZoom)) {
            this._zoomVelocity.value = 0;
            this._zoom = this._zoomEnd;
        }
        else {
            const smoothTime = this._isUserControllingZoom ? this.draggingSmoothTime : this.smoothTime;
            this._zoom = smoothDamp(this._zoom, this._zoomEnd, this._zoomVelocity, smoothTime, Infinity, delta);
        }
        if (this.dollyToCursor) {
            if (isPerspectiveCamera(this._camera) && this._changedDolly !== 0) {
                const dollyControlAmount = this._spherical.radius - this._lastDistance;
                const camera = this._camera;
                const cameraDirection = this._getCameraDirection(_cameraDirection);
                const planeX = _v3A$1.copy(cameraDirection).cross(camera.up).normalize();
                if (planeX.lengthSq() === 0)
                    planeX.x = 1.0;
                const planeY = _v3B$1.crossVectors(planeX, cameraDirection);
                const worldToScreen = this._sphericalEnd.radius * Math.tan(camera.getEffectiveFOV() * DEG2RAD * 0.5);
                const prevRadius = this._sphericalEnd.radius - dollyControlAmount;
                const lerpRatio = (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius;
                const cursor = _v3C$1.copy(this._targetEnd)
                    .add(planeX.multiplyScalar(this._dollyControlCoord.x * worldToScreen * camera.aspect))
                    .add(planeY.multiplyScalar(this._dollyControlCoord.y * worldToScreen));
                const newTargetEnd = _v3A$1.copy(this._targetEnd).lerp(cursor, lerpRatio);
                const isMin = this._lastDollyDirection === DOLLY_DIRECTION.IN && this._spherical.radius <= this.minDistance;
                const isMax = this._lastDollyDirection === DOLLY_DIRECTION.OUT && this.maxDistance <= this._spherical.radius;
                if (this.infinityDolly && (isMin || isMax)) {
                    this._sphericalEnd.radius -= dollyControlAmount;
                    this._spherical.radius -= dollyControlAmount;
                    const dollyAmount = _v3B$1.copy(cameraDirection).multiplyScalar(-dollyControlAmount);
                    newTargetEnd.add(dollyAmount);
                }
                // target position may be moved beyond boundary.
                this._boundary.clampPoint(newTargetEnd, newTargetEnd);
                const targetEndDiff = _v3B$1.subVectors(newTargetEnd, this._targetEnd);
                this._targetEnd.copy(newTargetEnd);
                this._target.add(targetEndDiff);
                this._changedDolly -= dollyControlAmount;
                if (approxZero(this._changedDolly))
                    this._changedDolly = 0;
            }
            else if (isOrthographicCamera(this._camera) && this._changedZoom !== 0) {
                const dollyControlAmount = this._zoom - this._lastZoom;
                const camera = this._camera;
                const worldCursorPosition = _v3A$1.set(this._dollyControlCoord.x, this._dollyControlCoord.y, (camera.near + camera.far) / (camera.near - camera.far)).unproject(camera);
                const quaternion = _v3B$1.set(0, 0, -1).applyQuaternion(camera.quaternion);
                const cursor = _v3C$1.copy(worldCursorPosition).add(quaternion.multiplyScalar(-worldCursorPosition.dot(camera.up)));
                const prevZoom = this._zoom - dollyControlAmount;
                const lerpRatio = -(prevZoom - this._zoom) / this._zoom;
                // find the "distance" (aka plane constant in three.js) of Plane
                // from a given position (this._targetEnd) and normal vector (cameraDirection)
                // https://www.maplesoft.com/support/help/maple/view.aspx?path=MathApps%2FEquationOfAPlaneNormal#bkmrk0
                const cameraDirection = this._getCameraDirection(_cameraDirection);
                const prevPlaneConstant = this._targetEnd.dot(cameraDirection);
                const newTargetEnd = _v3A$1.copy(this._targetEnd).lerp(cursor, lerpRatio);
                const newPlaneConstant = newTargetEnd.dot(cameraDirection);
                // Pull back the camera depth that has moved, to be the camera stationary as zoom
                const pullBack = cameraDirection.multiplyScalar(newPlaneConstant - prevPlaneConstant);
                newTargetEnd.sub(pullBack);
                // target position may be moved beyond boundary.
                this._boundary.clampPoint(newTargetEnd, newTargetEnd);
                const targetEndDiff = _v3B$1.subVectors(newTargetEnd, this._targetEnd);
                this._targetEnd.copy(newTargetEnd);
                this._target.add(targetEndDiff);
                // this._target.copy( this._targetEnd );
                this._changedZoom -= dollyControlAmount;
                if (approxZero(this._changedZoom))
                    this._changedZoom = 0;
            }
        }
        if (this._camera.zoom !== this._zoom) {
            this._camera.zoom = this._zoom;
            this._camera.updateProjectionMatrix();
            this._updateNearPlaneCorners();
            this._needsUpdate = true;
        }
        this._dragNeedsUpdate = true;
        // collision detection
        const maxDistance = this._collisionTest();
        this._spherical.radius = Math.min(this._spherical.radius, maxDistance);
        // decompose spherical to the camera position
        this._spherical.makeSafe();
        this._camera.position.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(this._target);
        this._camera.lookAt(this._target);
        // set offset after the orbit movement
        const affectOffset = !approxZero(this._focalOffset.x) ||
            !approxZero(this._focalOffset.y) ||
            !approxZero(this._focalOffset.z);
        if (affectOffset) {
            this._camera.matrix.compose(this._camera.position, this._camera.quaternion, this._camera.scale);
            _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
            _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
            _zColumn.setFromMatrixColumn(this._camera.matrix, 2);
            _xColumn.multiplyScalar(this._focalOffset.x);
            _yColumn.multiplyScalar(-this._focalOffset.y);
            _zColumn.multiplyScalar(this._focalOffset.z); // notice: z-offset will not affect in Orthographic.
            _v3A$1.copy(_xColumn).add(_yColumn).add(_zColumn);
            this._camera.position.add(_v3A$1);
            this._camera.updateMatrixWorld();
        }
        if (this._boundaryEnclosesCamera) {
            this._encloseToBoundary(this._camera.position.copy(this._target), _v3A$1.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse), 1.0);
        }
        const updated = this._needsUpdate;
        if (updated && !this._updatedLastTime) {
            this._hasRested = false;
            this.dispatchEvent({ type: 'wake' });
            this.dispatchEvent({ type: 'update' });
        }
        else if (updated) {
            this.dispatchEvent({ type: 'update' });
            if (approxZero(deltaTheta, this.restThreshold) &&
                approxZero(deltaPhi, this.restThreshold) &&
                approxZero(deltaRadius, this.restThreshold) &&
                approxZero(deltaTarget.x, this.restThreshold) &&
                approxZero(deltaTarget.y, this.restThreshold) &&
                approxZero(deltaTarget.z, this.restThreshold) &&
                approxZero(deltaOffset.x, this.restThreshold) &&
                approxZero(deltaOffset.y, this.restThreshold) &&
                approxZero(deltaOffset.z, this.restThreshold) &&
                approxZero(deltaZoom, this.restThreshold) &&
                !this._hasRested) {
                this._hasRested = true;
                this.dispatchEvent({ type: 'rest' });
            }
        }
        else if (!updated && this._updatedLastTime) {
            this.dispatchEvent({ type: 'sleep' });
        }
        this._lastDistance = this._spherical.radius;
        this._lastZoom = this._zoom;
        this._updatedLastTime = updated;
        this._needsUpdate = false;
        return updated;
    }
    /**
     * Get all state in JSON string
     * @category Methods
     */
    toJSON() {
        return JSON.stringify({
            enabled: this._enabled,
            minDistance: this.minDistance,
            maxDistance: infinityToMaxNumber(this.maxDistance),
            minZoom: this.minZoom,
            maxZoom: infinityToMaxNumber(this.maxZoom),
            minPolarAngle: this.minPolarAngle,
            maxPolarAngle: infinityToMaxNumber(this.maxPolarAngle),
            minAzimuthAngle: infinityToMaxNumber(this.minAzimuthAngle),
            maxAzimuthAngle: infinityToMaxNumber(this.maxAzimuthAngle),
            smoothTime: this.smoothTime,
            draggingSmoothTime: this.draggingSmoothTime,
            dollySpeed: this.dollySpeed,
            truckSpeed: this.truckSpeed,
            dollyToCursor: this.dollyToCursor,
            target: this._targetEnd.toArray(),
            position: _v3A$1.setFromSpherical(this._sphericalEnd).add(this._targetEnd).toArray(),
            zoom: this._zoomEnd,
            focalOffset: this._focalOffsetEnd.toArray(),
            target0: this._target0.toArray(),
            position0: this._position0.toArray(),
            zoom0: this._zoom0,
            focalOffset0: this._focalOffset0.toArray(),
        });
    }
    /**
     * Reproduce the control state with JSON. enableTransition is where anim or not in a boolean.
     * @param json
     * @param enableTransition
     * @category Methods
     */
    fromJSON(json, enableTransition = false) {
        const obj = JSON.parse(json);
        this.enabled = obj.enabled;
        this.minDistance = obj.minDistance;
        this.maxDistance = maxNumberToInfinity(obj.maxDistance);
        this.minZoom = obj.minZoom;
        this.maxZoom = maxNumberToInfinity(obj.maxZoom);
        this.minPolarAngle = obj.minPolarAngle;
        this.maxPolarAngle = maxNumberToInfinity(obj.maxPolarAngle);
        this.minAzimuthAngle = maxNumberToInfinity(obj.minAzimuthAngle);
        this.maxAzimuthAngle = maxNumberToInfinity(obj.maxAzimuthAngle);
        this.smoothTime = obj.smoothTime;
        this.draggingSmoothTime = obj.draggingSmoothTime;
        this.dollySpeed = obj.dollySpeed;
        this.truckSpeed = obj.truckSpeed;
        this.dollyToCursor = obj.dollyToCursor;
        this._target0.fromArray(obj.target0);
        this._position0.fromArray(obj.position0);
        this._zoom0 = obj.zoom0;
        this._focalOffset0.fromArray(obj.focalOffset0);
        this.moveTo(obj.target[0], obj.target[1], obj.target[2], enableTransition);
        _sphericalA.setFromVector3(_v3A$1.fromArray(obj.position).sub(this._targetEnd).applyQuaternion(this._yAxisUpSpace));
        this.rotateTo(_sphericalA.theta, _sphericalA.phi, enableTransition);
        this.dollyTo(_sphericalA.radius, enableTransition);
        this.zoomTo(obj.zoom, enableTransition);
        this.setFocalOffset(obj.focalOffset[0], obj.focalOffset[1], obj.focalOffset[2], enableTransition);
        this._needsUpdate = true;
    }
    /**
     * Attach all internal event handlers to enable drag control.
     * @category Methods
     */
    connect(domElement) {
        if (this._domElement) {
            console.warn('camera-controls is already connected.');
            return;
        }
        domElement.setAttribute('data-camera-controls-version', VERSION);
        this._addAllEventListeners(domElement);
        this._getClientRect(this._elementRect);
    }
    /**
     * Detach all internal event handlers to disable drag control.
     */
    disconnect() {
        this.cancel();
        this._removeAllEventListeners();
        if (this._domElement) {
            this._domElement.removeAttribute('data-camera-controls-version');
            this._domElement = undefined;
        }
    }
    /**
     * Dispose the cameraControls instance itself, remove all eventListeners.
     * @category Methods
     */
    dispose() {
        // remove all user event listeners
        this.removeAllEventListeners();
        // remove all internal event listeners
        this.disconnect();
    }
    // it's okay to expose public though
    _getTargetDirection(out) {
        // divide by distance to normalize, lighter than `Vector3.prototype.normalize()`
        return out.setFromSpherical(this._spherical).divideScalar(this._spherical.radius).applyQuaternion(this._yAxisUpSpaceInverse);
    }
    // it's okay to expose public though
    _getCameraDirection(out) {
        return this._getTargetDirection(out).negate();
    }
    _findPointerById(pointerId) {
        return this._activePointers.find((activePointer) => activePointer.pointerId === pointerId);
    }
    _findPointerByMouseButton(mouseButton) {
        return this._activePointers.find((activePointer) => activePointer.mouseButton === mouseButton);
    }
    _disposePointer(pointer) {
        this._activePointers.splice(this._activePointers.indexOf(pointer), 1);
    }
    _encloseToBoundary(position, offset, friction) {
        const offsetLength2 = offset.lengthSq();
        if (offsetLength2 === 0.0) { // sanity check
            return position;
        }
        // See: https://twitter.com/FMS_Cat/status/1106508958640988161
        const newTarget = _v3B$1.copy(offset).add(position); // target
        const clampedTarget = this._boundary.clampPoint(newTarget, _v3C$1); // clamped target
        const deltaClampedTarget = clampedTarget.sub(newTarget); // newTarget -> clampedTarget
        const deltaClampedTargetLength2 = deltaClampedTarget.lengthSq(); // squared length of deltaClampedTarget
        if (deltaClampedTargetLength2 === 0.0) { // when the position doesn't have to be clamped
            return position.add(offset);
        }
        else if (deltaClampedTargetLength2 === offsetLength2) { // when the position is completely stuck
            return position;
        }
        else if (friction === 0.0) {
            return position.add(offset).add(deltaClampedTarget);
        }
        else {
            const offsetFactor = 1.0 + friction * deltaClampedTargetLength2 / offset.dot(deltaClampedTarget);
            return position
                .add(_v3B$1.copy(offset).multiplyScalar(offsetFactor))
                .add(deltaClampedTarget.multiplyScalar(1.0 - friction));
        }
    }
    _updateNearPlaneCorners() {
        if (isPerspectiveCamera(this._camera)) {
            const camera = this._camera;
            const near = camera.near;
            const fov = camera.getEffectiveFOV() * DEG2RAD;
            const heightHalf = Math.tan(fov * 0.5) * near; // near plain half height
            const widthHalf = heightHalf * camera.aspect; // near plain half width
            this._nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[2].set(widthHalf, heightHalf, 0);
            this._nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);
        }
        else if (isOrthographicCamera(this._camera)) {
            const camera = this._camera;
            const zoomInv = 1 / camera.zoom;
            const left = camera.left * zoomInv;
            const right = camera.right * zoomInv;
            const top = camera.top * zoomInv;
            const bottom = camera.bottom * zoomInv;
            this._nearPlaneCorners[0].set(left, top, 0);
            this._nearPlaneCorners[1].set(right, top, 0);
            this._nearPlaneCorners[2].set(right, bottom, 0);
            this._nearPlaneCorners[3].set(left, bottom, 0);
        }
    }
    _truckInternal = (deltaX, deltaY, dragToOffset, screenSpacePanning) => {
        let truckX;
        let pedestalY;
        if (isPerspectiveCamera(this._camera)) {
            const offset = _v3A$1.copy(this._camera.position).sub(this._target);
            // half of the fov is center to top of screen
            const fov = this._camera.getEffectiveFOV() * DEG2RAD;
            const targetDistance = offset.length() * Math.tan(fov * 0.5);
            truckX = (this.truckSpeed * deltaX * targetDistance / this._elementRect.height);
            pedestalY = (this.truckSpeed * deltaY * targetDistance / this._elementRect.height);
        }
        else if (isOrthographicCamera(this._camera)) {
            const camera = this._camera;
            truckX = this.truckSpeed * deltaX * (camera.right - camera.left) / camera.zoom / this._elementRect.width;
            pedestalY = this.truckSpeed * deltaY * (camera.top - camera.bottom) / camera.zoom / this._elementRect.height;
        }
        else {
            return;
        }
        if (screenSpacePanning) {
            dragToOffset ?
                this.setFocalOffset(this._focalOffsetEnd.x + truckX, this._focalOffsetEnd.y, this._focalOffsetEnd.z, true) :
                this.truck(truckX, 0, true);
            this.forward(-pedestalY, true);
        }
        else {
            dragToOffset ?
                this.setFocalOffset(this._focalOffsetEnd.x + truckX, this._focalOffsetEnd.y + pedestalY, this._focalOffsetEnd.z, true) :
                this.truck(truckX, pedestalY, true);
        }
    };
    _rotateInternal = (deltaX, deltaY) => {
        const theta = PI_2 * this.azimuthRotateSpeed * deltaX / this._elementRect.height; // divide by *height* to refer the resolution
        const phi = PI_2 * this.polarRotateSpeed * deltaY / this._elementRect.height;
        this.rotate(theta, phi, true);
    };
    _dollyInternal = (delta, x, y) => {
        const dollyScale = Math.pow(0.95, -delta * this.dollySpeed);
        const lastDistance = this._sphericalEnd.radius;
        const distance = this._sphericalEnd.radius * dollyScale;
        const clampedDistance = clamp(distance, this.minDistance, this.maxDistance);
        const overflowedDistance = clampedDistance - distance;
        if (this.infinityDolly && this.dollyToCursor) {
            this._dollyToNoClamp(distance, true);
        }
        else if (this.infinityDolly && !this.dollyToCursor) {
            this.dollyInFixed(overflowedDistance, true);
            this._dollyToNoClamp(clampedDistance, true);
        }
        else {
            this._dollyToNoClamp(clampedDistance, true);
        }
        if (this.dollyToCursor) {
            this._changedDolly += (this.infinityDolly ? distance : clampedDistance) - lastDistance;
            this._dollyControlCoord.set(x, y);
        }
        this._lastDollyDirection = Math.sign(-delta);
    };
    _zoomInternal = (delta, x, y) => {
        const zoomScale = Math.pow(0.95, delta * this.dollySpeed);
        const lastZoom = this._zoom;
        const zoom = this._zoom * zoomScale;
        // for both PerspectiveCamera and OrthographicCamera
        this.zoomTo(zoom, true);
        if (this.dollyToCursor) {
            this._changedZoom += zoom - lastZoom;
            this._dollyControlCoord.set(x, y);
        }
    };
    // lateUpdate
    _collisionTest() {
        let distance = Infinity;
        const hasCollider = this.colliderMeshes.length >= 1;
        if (!hasCollider)
            return distance;
        if (notSupportedInOrthographicCamera(this._camera, '_collisionTest'))
            return distance;
        const rayDirection = this._getTargetDirection(_cameraDirection);
        _rotationMatrix$1.lookAt(_ORIGIN$1, rayDirection, this._camera.up);
        for (let i = 0; i < 4; i++) {
            const nearPlaneCorner = _v3B$1.copy(this._nearPlaneCorners[i]);
            nearPlaneCorner.applyMatrix4(_rotationMatrix$1);
            const origin = _v3C$1.addVectors(this._target, nearPlaneCorner);
            _raycaster.set(origin, rayDirection);
            _raycaster.far = this._spherical.radius + 1;
            const intersects = _raycaster.intersectObjects(this.colliderMeshes);
            if (intersects.length !== 0 && intersects[0].distance < distance) {
                distance = intersects[0].distance;
            }
        }
        return distance;
    }
    /**
     * Get its client rect and package into given `DOMRect` .
     */
    _getClientRect(target) {
        if (!this._domElement)
            return;
        const rect = this._domElement.getBoundingClientRect();
        target.x = rect.left;
        target.y = rect.top;
        if (this._viewport) {
            target.x += this._viewport.x;
            target.y += rect.height - this._viewport.w - this._viewport.y;
            target.width = this._viewport.z;
            target.height = this._viewport.w;
        }
        else {
            target.width = rect.width;
            target.height = rect.height;
        }
        return target;
    }
    _createOnRestPromise(resolveImmediately) {
        if (resolveImmediately)
            return Promise.resolve();
        this._hasRested = false;
        this.dispatchEvent({ type: 'transitionstart' });
        return new Promise((resolve) => {
            const onResolve = () => {
                this.removeEventListener('rest', onResolve);
                resolve();
            };
            this.addEventListener('rest', onResolve);
        });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _addAllEventListeners(_domElement) { }
    _removeAllEventListeners() { }
    /**
     * backward compatible
     * @deprecated use smoothTime (in seconds) instead
     * @category Properties
     */
    get dampingFactor() {
        console.warn('.dampingFactor has been deprecated. use smoothTime (in seconds) instead.');
        return 0;
    }
    /**
     * backward compatible
     * @deprecated use smoothTime (in seconds) instead
     * @category Properties
     */
    set dampingFactor(_) {
        console.warn('.dampingFactor has been deprecated. use smoothTime (in seconds) instead.');
    }
    /**
     * backward compatible
     * @deprecated use draggingSmoothTime (in seconds) instead
     * @category Properties
     */
    get draggingDampingFactor() {
        console.warn('.draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead.');
        return 0;
    }
    /**
     * backward compatible
     * @deprecated use draggingSmoothTime (in seconds) instead
     * @category Properties
     */
    set draggingDampingFactor(_) {
        console.warn('.draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead.');
    }
    static createBoundingSphere(object3d, out = new THREE.Sphere()) {
        const boundingSphere = out;
        const center = boundingSphere.center;
        _box3A.makeEmpty();
        // find the center
        object3d.traverseVisible((object) => {
            if (!object.isMesh)
                return;
            _box3A.expandByObject(object);
        });
        _box3A.getCenter(center);
        // find the radius
        let maxRadiusSq = 0;
        object3d.traverseVisible((object) => {
            if (!object.isMesh)
                return;
            const mesh = object;
            if (!mesh.geometry)
                return;
            const geometry = mesh.geometry.clone();
            geometry.applyMatrix4(mesh.matrixWorld);
            const bufferGeometry = geometry;
            const position = bufferGeometry.attributes.position;
            for (let i = 0, l = position.count; i < l; i++) {
                _v3A$1.fromBufferAttribute(position, i);
                maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_v3A$1));
            }
        });
        boundingSphere.radius = Math.sqrt(maxRadiusSq);
        return boundingSphere;
    }
}

const subsetOfTHREE = {
    Vector2: Vector2,
    Vector3: Vector3,
    Vector4: Vector4,
    Quaternion: Quaternion,
    Matrix4: Matrix4,
    Spherical: Spherical,
    Box3: Box3,
    Sphere: Sphere,
    Raycaster: Raycaster,
};
CameraControls.install({ THREE: subsetOfTHREE });
const _ORIGIN = new Vector3(0, 0, 0);
const _v3A = new Vector3();
const _v3B = new Vector3();
const _v3C = new Vector3();
const _ray = new Ray();
const _rotationMatrix = new Matrix4();
class ThirdPersonCameraControls extends CameraControls {
    constructor(camera, trackObject, world, domElement, character = null) {
        super(camera, domElement);
        // true のとき、追従キャラが回転床に乗っている間はカメラの正面角度（方位角）も
        // 床の yaw に合わせて回す（肩越し視点が床に対して一定に保たれる）。既定 on。
        // character を渡していない場合は無効（no-op）。
        this.syncFrontAngleToPlatform = true;
        this.minDistance = 1;
        this.maxDistance = 30;
        this.azimuthRotateSpeed = 0.3; // negative value to invert rotation direction
        this.polarRotateSpeed = -0.2; // negative value to invert rotation direction
        this.minPolarAngle = 30 * MathUtils.DEG2RAD;
        this.maxPolarAngle = 120 * MathUtils.DEG2RAD;
        this.draggingSmoothTime = 1e-10;
        this.mouseButtons.right = CameraControls.ACTION.NONE;
        this.mouseButtons.middle = CameraControls.ACTION.NONE;
        this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
        this.touches.three = CameraControls.ACTION.TOUCH_DOLLY;
        this.world = world;
        this.character = character;
        this.colliderMeshes = [new Object3D()];
        // this._trackObject = trackObject;
        // this.offset = new Vector3( 0, 1, 0 );
        const offset = new Vector3(0, 2, 0);
        this.update = (delta) => {
            // 回転床に乗っている間、床の yaw ぶんだけ方位角を回してキャラへの相対視点を保つ
            const character = this.character;
            if (this.syncFrontAngleToPlatform &&
                character &&
                character.isGrounded &&
                character.groundBody instanceof KinematicBody) {
                this.rotate(character.groundBody.angularVelocity.y * delta, 0, false);
            }
            const x = trackObject.position.x + offset.x;
            const y = trackObject.position.y + offset.y;
            const z = trackObject.position.z + offset.z;
            this.moveTo(x, y, z, false);
            return super.update(delta);
        };
    }
    get frontAngle() {
        return this.azimuthAngle;
    }
    _collisionTest() {
        let distance = Infinity;
        if (!this.world)
            return distance;
        // 本家 camera-controls の _collisionTest が raycaster.far に入れているのと同じ上限。
        // これより遠い衝突は結果に影響しないので、Octree の探索を打ち切ってよい。
        const far = this._spherical.radius + 1;
        for (let i = 0, l = this.world.colliders.length; i < l; i++) {
            const staticBody = this.world.colliders[i];
            const direction = _v3A.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
            _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);
            for (let i = 0; i < 4; i++) {
                const nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
                nearPlaneCorner.applyMatrix4(_rotationMatrix);
                const origin = _v3C.addVectors(this._target, nearPlaneCorner);
                _ray.set(origin, direction);
                const intersect = staticBody.rayIntersect(_ray, far);
                if (intersect && intersect.distance < distance) {
                    distance = intersect.distance;
                }
            }
        }
        return distance;
    }
}

export { AnimationController, Body, CharacterController, ClimbableBody, KeyboardControls, KinematicBody, StaticBody, ThirdPersonCameraControls, World };

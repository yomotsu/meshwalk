import {
	Object3D,
	Mesh,
	Vector3,
	Quaternion,
	Matrix4,
	Sphere,
	Ray,
	BoxGeometry,
	BufferGeometry,
} from 'three';
import { Body } from './Body';
import { Octree } from './Octree';
import { ComputedTriangle } from '../math/triangle';

const _unitScale = new Vector3( 1, 1, 1 );
const _localSphere = new Sphere();
const _localResult: ComputedTriangle[] = [];
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
export class KinematicBody extends Body {

	isKinematicBody = true;
	position = new Vector3();
	quaternion = new Quaternion();      // 現在の姿勢（angularVelocity で積分される）
	velocity = new Vector3();           // ワールド座標の並進速度（m/s）
	angularVelocity = new Vector3();    // ワールド軸まわりの角速度（rad/s）。向き=軸・大きさ=速さ。yaw なら (0, ω, 0)
	surfaceVelocity = new Vector3();    // 表面（ベルト面）の流れ速度（ワールド, m/s）。床は動かさず乗員だけ運ぶ＝コンベア。既定 0

	// 直近 1 ステップの変換差分（T_new · T_old⁻¹）。乗っているキャラの運搬に使う。
	// 並進のみの現状は移動量ぶんの平行移動行列。回転はフェーズ5で velocity に接続する。
	deltaMatrix = new Matrix4();

	private _octree = new Octree();
	private _matrix = new Matrix4();
	private _matrixInverse = new Matrix4();
	private _worldTriangles: ComputedTriangle[] = []; // ワールド変換した三角形の使い回しプール
	private _worldTriangleCount = 0;

	/**
	 * 箱を直接生成する糖衣（メッシュを組まずに動く床を定義できる）。原点中心。
	 */
	static fromBox( { width, height, depth }: { width: number; height: number; depth: number } ): KinematicBody {

		const geometry = new BoxGeometry( width, height, depth );
		const body = new KinematicBody().addFromGeometry( geometry );
		geometry.dispose();
		return body;

	}

	/**
	 * Object3D（graph）から生成する。子孫の全 Mesh を「object 自身のローカル座標」で取り込む。
	 */
	static fromObject( object: Object3D ): KinematicBody {

		return new KinematicBody().addFromObject( object );

	}

	/**
	 * Object3D（graph）を辿り、含まれる全 Mesh の三角形を object 自身のローカル座標で取り込む（加算）。
	 * 取り込み時点の各 Mesh のワールド行列を object のワールド行列で割り戻す（＝ボディ原点基準）。
	 */
	addFromObject( object: Object3D ): this {

		object.updateWorldMatrix( true, true );
		_rootInverse.copy( object.matrixWorld ).invert();

		object.traverse( ( child ) => {

			if ( child instanceof Mesh ) {

				const relative = new Matrix4().multiplyMatrices( _rootInverse, child.matrixWorld );
				this._addGeometry( child.geometry, relative );

			}

		} );

		this._octree.build();
		this._updateMatrix();
		return this;

	}

	/**
	 * BufferGeometry を直接取り込む（任意で変換行列を適用・ローカル座標で保持）。
	 */
	addFromGeometry( geometry: BufferGeometry, matrix?: Matrix4 ): this {

		this._addGeometry( geometry, matrix );
		this._octree.build();
		this._updateMatrix();
		return this;

	}

	/**
	 * 固定サブステップぶん `velocity` で `position` を進める。World が毎ステップ呼ぶ。
	 */
	step( stepDeltaTime: number ): void {

		// T_old は「現在の公開トランスフォーム」から同期する。利用側が position を直接
		// 書き換えた（テレポート）場合もここで取り込まれ、運搬 delta には波及しない
		// （delta はこのステップのエンジン積分ぶんだけになる＝テレポート安全）。
		this._updateMatrix();
		_previousInverse.copy( this._matrix ).invert();

		this.position.addScaledVector( this.velocity, stepDeltaTime );

		// 角速度を姿勢へ積分する（ワールド軸まわり＝body 原点まわりの回転なので premultiply）
		const angle = this.angularVelocity.length() * stepDeltaTime;
		if ( angle > 1e-9 ) {

			_axis.copy( this.angularVelocity ).normalize();
			_deltaQuaternion.setFromAxisAngle( _axis, angle );
			this.quaternion.premultiply( _deltaQuaternion );

		}

		this._updateMatrix(); // T_new

		// このステップの変換差分（運搬用）: delta = T_new · T_old⁻¹
		this.deltaMatrix.multiplyMatrices( this._matrix, _previousInverse );

		// コンベア: 床（position）は動かさず、表面の流れぶんだけ乗員を運ぶ。
		// 運搬差分にワールド並進 surfaceVelocity·dt を前から足す（deltaMatrix は
		// 乗員のワールド位置に applyMatrix4 されるので premultiply でワールド平行移動になる）。
		// 位置・姿勢は不変なので衝突ジオメトリは静止したまま。並進・回転床との合成も可。
		if ( this.surfaceVelocity.lengthSq() > 0 ) {

			_surfaceDelta.makeTranslation(
				this.surfaceVelocity.x * stepDeltaTime,
				this.surfaceVelocity.y * stepDeltaTime,
				this.surfaceVelocity.z * stepDeltaTime,
			);
			this.deltaMatrix.premultiply( _surfaceDelta );

		}

	}

	// --- 内部クエリ（World の broad-phase から使う。StaticBody と同じ signature） ---

	getSphereTriangles( sphere: Sphere, result: ComputedTriangle[] ): ComputedTriangle[] {

		this._updateMatrix(); // 現在の公開トランスフォームを反映

		// ワールドのクエリ球をボディローカルへ移す（並進＋回転のみ＝半径は不変）
		_localSphere.center.copy( sphere.center ).applyMatrix4( this._matrixInverse );
		_localSphere.radius = sphere.radius;

		_localResult.length = 0;
		this._octree.getSphereTriangles( _localSphere, _localResult );

		this._worldTriangleCount = 0;

		for ( let i = 0, l = _localResult.length; i < l; i ++ ) {

			const local = _localResult[ i ];
			const world = this._acquireWorldTriangle();

			world.a.copy( local.a ).applyMatrix4( this._matrix );
			world.b.copy( local.b ).applyMatrix4( this._matrix );
			world.c.copy( local.c ).applyMatrix4( this._matrix );
			world.normal.copy( local.normal ).applyQuaternion( this.quaternion ).normalize();
			world.body = this;

			// bounding sphere は剛体変換（並進＋回転）なので、ローカルのものを移すだけでよい。
			// 半径は不変。毎フレーム三角形から作り直す（= Sphere の新規確保）のを避ける。
			if ( ! local.boundingSphere ) local.computeBoundingSphere();

			const boundingSphere = world.boundingSphere || ( world.boundingSphere = new Sphere() );
			boundingSphere.center.copy( local.boundingSphere!.center ).applyMatrix4( this._matrix );
			boundingSphere.radius = local.boundingSphere!.radius;

			result.push( world );

		}

		return result;

	}

	/**
	 * ワールド座標のレイと交差判定する（カメラの衝突回避などから使う。StaticBody と同じ signature）。
	 * レイをボディローカルへ移して Octree に問い合わせ、交点をワールドへ戻す。
	 * 剛体変換（並進＋回転）なので距離は不変。
	 */
	rayIntersect( ray: Ray ) {

		this._updateMatrix(); // 現在の公開トランスフォームを反映

		_localRay.origin.copy( ray.origin ).applyMatrix4( this._matrixInverse );
		_localRay.direction.copy( ray.direction ).transformDirection( this._matrixInverse );

		const result = this._octree.rayIntersect( _localRay );
		if ( ! result ) return result;

		if ( result.position ) result.position.applyMatrix4( this._matrix );
		return result;

	}

	dispose(): void {

		this._octree.triangles.length = 0;
		this._octree.subTrees.length = 0;
		this._worldTriangles.length = 0;

	}

	private _acquireWorldTriangle(): ComputedTriangle {

		let triangle = this._worldTriangles[ this._worldTriangleCount ];

		if ( ! triangle ) {

			triangle = new ComputedTriangle( new Vector3(), new Vector3(), new Vector3() );
			this._worldTriangles[ this._worldTriangleCount ] = triangle;

		}

		this._worldTriangleCount ++;
		return triangle;

	}

	private _updateMatrix(): void {

		this._matrix.compose( this.position, this.quaternion, _unitScale );
		this._matrixInverse.copy( this._matrix ).invert();

	}

	private _addGeometry( geometry: BufferGeometry, matrix?: Matrix4 ): void {

		// position は fromBufferAttribute 経由で読む。これにより KHR_mesh_quantization
		// などの正規化整数（normalized）属性も正しくデノーマライズされる。変換は頂点ごとに
		// matrix を適用する（元の three.js ジオメトリは変更しない）。
		const position = geometry.attributes.position;
		const index = geometry.index;

		const addTriangle = ( a: number, b: number, c: number ) => {

			const vA = new Vector3().fromBufferAttribute( position, a );
			const vB = new Vector3().fromBufferAttribute( position, b );
			const vC = new Vector3().fromBufferAttribute( position, c );

			if ( matrix ) {

				vA.applyMatrix4( matrix );
				vB.applyMatrix4( matrix );
				vC.applyMatrix4( matrix );

			}

			const triangle = new ComputedTriangle( vA, vB, vC );
			// ポリゴンの継ぎ目の辺で raycast が交差しない可能性があるので、わずかに拡大する
			triangle.extend( 1e-10 );
			triangle.computeBoundingSphere();
			this._octree.addTriangle( triangle );

		};

		if ( index ) {

			for ( let i = 0, l = index.count; i < l; i += 3 ) addTriangle( index.getX( i ), index.getX( i + 1 ), index.getX( i + 2 ) );

		} else {

			for ( let i = 0, l = position.count; i < l; i += 3 ) addTriangle( i, i + 1, i + 2 );

		}

	}

}

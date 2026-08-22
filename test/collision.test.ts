import { describe, it, expect } from 'vitest';
import {
	Mesh,
	Object3D,
	Vector2,
	Vector3,
	Box3,
	Sphere,
	PlaneGeometry,
	BoxGeometry,
	BufferGeometry,
	BufferAttribute,
	Matrix4,
	MeshBasicMaterial,
	MathUtils,
} from 'three';
import { World } from '../src/core/World';
import { StaticBody } from '../src/core/StaticBody';
import { KinematicBody } from '../src/core/KinematicBody';
import { CharacterController } from '../src/core/CharacterController';
import { ClimbableBody } from '../src/core/ClimbableBody';

const PLAYER_RADIUS = 0.75;
const PLAYER_HEIGHT = 3;

const STOP = new Vector3();
// dir(角度: 0=-z, 0.5PI=-x, 1.0PI=+z, 1.5PI=+x) から水平移動速度ベクトルを作る
const moveVec = ( dir: number, speed = 10 ) => new Vector3( - Math.sin( dir ), 0, - Math.cos( dir ) ).multiplyScalar( speed );

// demo2 相当のシーン（床 + 箱）を作る。
// floor は端で落ちないよう十分大きく、セルサイズは demo2 と同じ 3 に合わせる。
function makeScene( { boxSize = [ 5, 5, 10 ] as [ number, number, number ] } = {} ) {

	const world = new World();

	const floor = new Mesh( new PlaneGeometry( 198, 198, 66, 66 ), new MeshBasicMaterial() );
	floor.rotation.x = - 90 * MathUtils.DEG2RAD;
	floor.updateMatrixWorld( true );

	const [ bx, by, bz ] = boxSize;
	const box = new Mesh( new BoxGeometry( bx, by, bz ), new MeshBasicMaterial() );
	box.position.set( 0, by / 2, 0 ); // 床の上に載せる
	box.updateMatrixWorld( true );

	const level = new StaticBody();
	level.addFromObject( floor );
	level.addFromObject( box );
	world.add( level );

	const player = new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT } );
	world.add( player );

	// 箱の水平フットプリント（中心がこの内側に入る = 箱にめり込み）
	const footprint = { minX: - bx / 2, maxX: bx / 2, minZ: - bz / 2, maxZ: bz / 2 };

	return { world, player, footprint };

}

function isInsideFootprint( p: { x: number; z: number }, fp: ReturnType<typeof makeScene>[ 'footprint' ] ) {

	const m = 0.05;
	return p.x > fp.minX + m && p.x < fp.maxX - m && p.z > fp.minZ + m && p.z < fp.maxZ - m;

}

// startX, startZ に着地させてから dir 方向へ iterations フレーム移動させ、最小 y を返す。
function drive( world: World, player: CharacterController, startX: number, startZ: number, dir: number, iterations: number ) {

	player.teleport( new Vector3( startX, 0, startZ ) );
	player.velocity.set( 0, 0, 0 );
	for ( let i = 0; i < 20; i ++ ) {

		player.move( STOP );
		world.fixedUpdate();

	}

	let minY = Infinity;
	for ( let i = 0; i < iterations; i ++ ) {

		player.move( moveVec( dir ) );
		world.fixedUpdate();
		if ( player.position.y < minY ) minY = player.position.y;

	}

	return { minY };

}

// dir: 0=-z, 0.5PI=-x, 1.0PI=+z, 1.5PI=+x
const DIR = { negZ: 0, negX: Math.PI * 0.5, posZ: Math.PI, posX: Math.PI * 1.5 };

// 階段シーン: 床 + 段 box 列（+z 方向に並ぶ）。tops[k] は k 段目の上面 y。
// 各段は box( 10, top, 2 ) を z=1+2k（span [2k, 2k+2]）に置く。ceilingY 指定時は天井板を足す。
function makeStairScene( tops: number[], { ceilingY }: { ceilingY?: number } = {} ) {

	const world = new World();
	const level = new StaticBody();

	const floor = new Mesh( new PlaneGeometry( 200, 200 ), new MeshBasicMaterial() );
	floor.rotation.x = - 90 * MathUtils.DEG2RAD;
	floor.updateMatrixWorld( true );
	level.addFromObject( floor );

	tops.forEach( ( top, k ) => {

		const box = new Mesh( new BoxGeometry( 10, top, 2 ), new MeshBasicMaterial() );
		box.position.set( 0, top / 2, 1 + 2 * k );
		box.updateMatrixWorld( true );
		level.addFromObject( box );

	} );

	if ( ceilingY !== undefined ) {

		const ceiling = new Mesh( new BoxGeometry( 40, 0.2, 40 ), new MeshBasicMaterial() );
		ceiling.position.set( 0, ceilingY + 0.1, 0 ); // 板下面が ceilingY
		ceiling.updateMatrixWorld( true );
		level.addFromObject( ceiling );

	}

	world.add( level );

	const player = new CharacterController( { radius: 0.5, height: 2 } );
	world.add( player );

	return { world, player };

}

describe( 'CharacterController capsule collision', () => {

	it( '平らな地面の上で接地したまま静止する', () => {

		const { world, player } = makeScene();
		player.teleport( new Vector3( 10, 5, 10 ) ); // 箱から離れた床の上、少し高い位置
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}
		expect( player.position.y ).toBeCloseTo( 0, 1 );
		expect( player.isGrounded ).toBe( true );

	} );

	it( '壁面に正面から突入しても貫通しない（あらゆる z オフセット）', () => {

		const { world, player, footprint } = makeScene();

		for ( let z = - 4; z <= 4.0001; z += 0.5 ) {

			player.teleport( new Vector3( - 6, 0, z ) );
			player.velocity.set( 0, 0, 0 );
			for ( let i = 0; i < 20; i ++ ) {

				player.move( STOP ); world.fixedUpdate();

			}

			let tunneled = false;
			for ( let i = 0; i < 300; i ++ ) {

				player.move( moveVec( DIR.posX ) ); // +x（左面 x=-2.5 へ突入）
				world.fixedUpdate();
				if ( isInsideFootprint( player.position, footprint ) ) tunneled = true;

			}

			expect( tunneled, `z=${z} で箱にめり込んだ` ).toBe( false );

		}

	} );

	it( '壁面に斜めから突入しても solid にめり込まない（全周方向）', () => {

		const { world, player, footprint } = makeScene();

		for ( let k = 0; k < 16; k ++ ) {

			const dir = ( Math.PI * 2 ) * k / 16;
			player.teleport( new Vector3( - 6, 0, 0 ) );
			player.velocity.set( 0, 0, 0 );
			for ( let i = 0; i < 20; i ++ ) {

				player.move( STOP ); world.fixedUpdate();

			}

			let tunneled = false;
			for ( let i = 0; i < 260; i ++ ) {

				player.move( moveVec( dir ) );
				world.fixedUpdate();
				if ( isInsideFootprint( player.position, footprint ) ) tunneled = true;

			}

			expect( tunneled, `dir=${dir.toFixed( 2 )} で箱にめり込んだ` ).toBe( false );

		}

	} );

	it( '箱に押し付けながらスライドしても床を突き抜けて落ちない（各面）', () => {

		const { world, player } = makeScene();
		const P = Math.PI;
		const cases: Array<[ string, number, number, number ]> = [
			[ 'left +z',   - 3.3, - 4, P * 1.25 ],
			[ 'left -z',   - 3.3,   4, P * 1.75 ],
			[ 'right +z',    3.3, - 4, P * 0.75 ],
			[ 'right -z',    3.3,   4, P * 0.25 ],
			[ 'front +x',    - 4, 5.8, P * 1.75 ],
			[ 'front -x',      4, 5.8, P * 0.25 ],
			[ 'back +x',     - 4, - 5.8, P * 1.25 ],
			[ 'back -x',       4, - 5.8, P * 0.75 ],
		];

		for ( const [ label, sx, sz, dir ] of cases ) {

			const { minY } = drive( world, player, sx, sz, dir, 200 );
			expect( minY, `${label} で床下へ落下 (minY=${minY.toFixed( 2 )})` ).toBeGreaterThan( - 0.5 );

		}

	} );

	it( '箱の上から歩いて端から降りても床にちゃんと着地する（床抜けしない）', () => {

		const { world, player } = makeScene();

		for ( const x of [ - 2, - 1, 0, 1, 2 ] ) {

			player.teleport( new Vector3( x, 10, 0 ) ); // 箱の上に落とす
			player.velocity.set( 0, 0, 0 );
			for ( let i = 0; i < 60; i ++ ) {

				player.move( STOP ); world.fixedUpdate();

			}
			expect( player.position.y, `x=${x} で上面に着地していない` ).toBeCloseTo( 5, 0 );

			let minY = Infinity;
			for ( let i = 0; i < 220; i ++ ) {

				player.move( moveVec( DIR.negZ ) ); // 奥(-z)へ歩いて端から降りる
				world.fixedUpdate();
				if ( player.position.y < minY ) minY = player.position.y;

			}
			// 端から降りて床(y=0)に着地。床より下へ沈み込まない。
			expect( minY, `x=${x} で床抜け (minY=${minY.toFixed( 2 )})` ).toBeGreaterThan( - 0.5 );
			expect( player.position.y ).toBeCloseTo( 0, 1 );

		}

	} );

	// ---- Phase 0 ゴールデン（現行 W2 の安定挙動を数値で固定。以降の各フェーズはこれを維持する）----

	it( '[golden] 壁に沿って摺りながら進む（引っかからず・貫通せず）', () => {

		const { world, player, footprint } = makeScene();

		// 箱の左面(x=-2.5)へ斜めに押し当てつつ +z へ滑らせる
		player.teleport( new Vector3( - 6, 0, - 3 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 20; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		const startZ = player.position.z;
		const into = new Vector3( 1, 0, 1 ).normalize().multiplyScalar( 10 ); // +x(壁へ) & +z(壁に沿う)
		let tunneled = false;
		for ( let i = 0; i < 120; i ++ ) {

			player.move( into );
			world.fixedUpdate();
			if ( isInsideFootprint( player.position, footprint ) ) tunneled = true;

		}

		// 壁に沿って +z 方向へ確実に前進している（＝摺りが機能）
		expect( player.position.z - startZ, '壁に沿って前進していない（引っかかり）' ).toBeGreaterThan( 5 );
		// その間、箱に一度もめり込んでいない
		expect( tunneled, '壁にめり込んだ' ).toBe( false );
		// 地面に接地したまま
		expect( player.isGrounded ).toBe( true );

	} );

	it( '[golden] 急な坂（60°）を終端速度で滑り下り、表面から離れない', () => {

		const world = new World();
		const ramp = new Mesh( new PlaneGeometry( 200, 200 ), new MeshBasicMaterial() );
		ramp.rotation.x = - 30 * MathUtils.DEG2RAD; // 60° 斜面。法線 ≈ (0, 0.5, 0.866)
		ramp.updateMatrixWorld( true );
		const level = new StaticBody();
		level.addFromObject( ramp );
		world.add( level );

		const player = new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT } );
		world.add( player );
		player.teleport( new Vector3( 0, 3, 0 ) );
		player.velocity.set( 0, 0, 0 );

		let maxFall = 0;
		for ( let i = 0; i < 80; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();
			maxFall = Math.max( maxFall, - player.velocity.y );

		}

		// 下り方向(+z)へ滑り、しっかり下降している
		expect( player.position.z, '滑り下りていない' ).toBeGreaterThan( 8 );
		expect( player.position.y, '下降していない' ).toBeLessThan( - 15 );
		// 表面上に留まっている（弾き出されていない）
		const distToSurface = Math.abs( 0.5 * player.position.y + 0.866 * player.position.z );
		expect( distToSurface, `表面から離れている (dist=${distToSurface.toFixed( 2 )})` ).toBeLessThan( 0.6 );
		// 垂直速度が終端速度(20)で頭打ち＝発散しない（W2b で壊れた核心の性質を固定）
		expect( maxFall, `終端速度を超えて発散 (maxFall=${maxFall.toFixed( 2 )})` ).toBeLessThanOrEqual( 20.1 );

	} );

	it( '[golden] jump() で上昇し、約1秒で頂点→着地して再接地する', () => {

		// Phase 1 でジャンプ時間源を deltaTime 積算へ置換したので、フェイクタイマー無しで決定論的。
		// コサイン弧の形・到達高さ(≈6.3)・滞空(頂点≈0.5s / 再接地≈1s)を維持する基準。
		const { world, player } = makeScene();
		player.teleport( new Vector3( 10, 0, 10 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 60; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		expect( player.isGrounded ).toBe( true );
		const restY = player.position.y;

		player.jump();
		expect( player.isJumping ).toBe( true );

		let maxY = restY;
		for ( let i = 0; i < 120; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();
			if ( player.position.y > maxY ) maxY = player.position.y;

		}

		// 到達高さは現行(≈6.3)近傍（コサイン弧・FALL_VELOCITY=20・JUMP_DURATION=1s）
		expect( maxY - restY, `到達高さが想定外 (rise=${( maxY - restY ).toFixed( 2 )})` ).toBeGreaterThan( 5 );
		expect( maxY - restY ).toBeLessThan( 9 );
		// 着地して再接地している
		expect( player.position.y, '着地して地面に戻っていない' ).toBeCloseTo( restY, 1 );
		expect( player.isGrounded, '再接地していない' ).toBe( true );

	} );

	it( '自由落下からの着地で startLanding を発火し、指定時間は移動とジャンプを抑止する', () => {

		const { world, player } = makeScene();
		player.landingLockDuration = 0.2;
		player.teleport( new Vector3( 10, 5, 10 ) );
		player.move( new Vector3( 4, 0, 0 ) );

		let landingCount = 0;
		player.addEventListener( 'startLanding', () => landingCount ++ );

		for ( let i = 0; i < 120 && landingCount === 0; i ++ ) world.fixedUpdate();

		expect( landingCount ).toBe( 1 );
		expect( player.isLanding ).toBe( true );
		const landingX = player.position.x;

		player.jump();
		expect( player.isJumping ).toBe( false );

		// 入力を渡し続けても、硬直時間の前半はその場から動かない。
		for ( let i = 0; i < 6; i ++ ) {

			player.move( new Vector3( 4, 0, 0 ) );
			world.fixedUpdate();

		}
		expect( player.position.x ).toBeCloseTo( landingX, 6 );

		// 入力は保持されているため、硬直終了後は再入力なしでも移動を再開する。
		for ( let i = 0; i < 12; i ++ ) world.fixedUpdate();
		expect( player.isLanding ).toBe( false );
		expect( player.position.x ).toBeGreaterThan( landingX );
		expect( landingCount ).toBe( 1 );

	} );

	it( 'jumpDuration を大きくすると高く長く跳ぶ（既定は 1・コンストラクタでも指定可）', () => {

		// 既定値は定数 JUMP_DURATION_SEC（=1）
		expect( new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT } ).jumpDuration ).toBe( 1 );
		// コンストラクタ option でも指定できる
		expect( new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT, jumpDuration: 2 } ).jumpDuration ).toBe( 2 );

		// 平地からジャンプし、到達高さと滞空フレーム数を測る
		const measure = ( jumpDuration?: number ) => {

			const { world, player } = makeScene();
			if ( jumpDuration !== undefined ) player.jumpDuration = jumpDuration;
			player.teleport( new Vector3( 10, 0, 10 ) );
			player.velocity.set( 0, 0, 0 );
			for ( let i = 0; i < 60; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
			const restY = player.position.y;

			player.jump();
			let maxY = restY;
			let airborneFrames = 0;
			for ( let i = 0; i < 600; i ++ ) {

				player.move( STOP );
				world.fixedUpdate();
				maxY = Math.max( maxY, player.position.y );
				if ( player.isJumping || ! player.isGrounded ) airborneFrames ++;
				else if ( airborneFrames > 0 ) break; // 再接地したら終了

			}

			return { rise: maxY - restY, airborneFrames };

		};

		const def = measure();       // 既定 1s
		const long = measure( 2 );   // 2s

		expect( long.rise, `長い方が高く跳んでいない (def=${def.rise.toFixed( 2 )}, long=${long.rise.toFixed( 2 )})` ).toBeGreaterThan( def.rise + 1 );
		expect( long.airborneFrames, '長い方が滞空が長くない' ).toBeGreaterThan( def.airborneFrames );

	} );

	it( '通常のジャンプ着地でも startLanding を発火し、硬直解除時に endLanding を発火する', () => {

		const { world, player } = makeScene();
		player.teleport( new Vector3( 10, 0, 10 ) );
		for ( let i = 0; i < 10; i ++ ) world.fixedUpdate();

		let landingCount = 0;
		let endLandingCount = 0;
		player.addEventListener( 'startLanding', () => landingCount ++ );
		player.addEventListener( 'endLanding', () => endLandingCount ++ );
		player.jump();
		for ( let i = 0; i < 120; i ++ ) world.fixedUpdate();

		expect( player.isGrounded ).toBe( true );
		expect( player.isLanding ).toBe( false );
		expect( landingCount ).toBe( 1 );
		expect( endLandingCount ).toBe( 1 );

	} );

	// ---- Phase 4 ゴールデン（固定ステップ・アキュムレータ world.update(dt)）----

	it( '[golden] update(1/60) を N 回は fixedUpdate() を N 回と同一軌跡', () => {

		const a = makeScene();
		const b = makeScene();
		a.player.teleport( new Vector3( 10, 8, 10 ) ); a.player.velocity.set( 0, 0, 0 );
		b.player.teleport( new Vector3( 10, 8, 10 ) ); b.player.velocity.set( 0, 0, 0 );

		for ( let i = 0; i < 150; i ++ ) { a.player.move( STOP ); a.world.fixedUpdate(); }
		for ( let i = 0; i < 150; i ++ ) { b.player.move( STOP ); b.world.update( 1 / 60 ); }

		// 60fps ちょうどでは 1 呼び出し = 1 fixedUpdate なので完全一致する
		expect( b.player.position.y ).toBeCloseTo( a.player.position.y, 6 );
		expect( b.player.position.x ).toBeCloseTo( a.player.position.x, 6 );

	} );

	it( '[golden] 端数 delta は蓄積され、固定ステップ(1/60)到達時のみ進む', () => {

		const { world, player } = makeScene();
		player.teleport( new Vector3( 10, 8, 10 ) ); // 空中
		player.velocity.set( 0, 0, 0 );

		// 1/120 は閾値 1/60 未満 → まだ 1 ステップも実行されず位置は不変
		player.move( STOP ); world.update( 1 / 120 );
		expect( player.position.y, '閾値未満で進んでしまった' ).toBe( 8 );

		// もう 1/120 で合計 1/60 到達 → 1 ステップ実行され落下開始
		player.move( STOP ); world.update( 1 / 120 );
		expect( player.position.y, '閾値到達で進んでいない' ).toBeLessThan( 8 );

	} );

	it( '[golden] 巨大 delta は追いつき上限(5フレーム)で打ち切る', () => {

		const a = makeScene();
		const b = makeScene();
		a.player.teleport( new Vector3( 10, 50, 10 ) ); a.player.velocity.set( 0, 0, 0 );
		b.player.teleport( new Vector3( 10, 50, 10 ) ); b.player.velocity.set( 0, 0, 0 );

		// a: fixedUpdate 5回 / b: update(100) 1回（上限5フレームに丸められる）
		for ( let i = 0; i < 5; i ++ ) { a.player.move( STOP ); a.world.fixedUpdate(); }
		b.player.move( STOP ); b.world.update( 100 );

		expect( b.player.position.y, '上限を超えて（または未満で）進んだ' ).toBeCloseTo( a.player.position.y, 6 );

	} );

	// ---- stepOffset ゴールデン ----

	it( '[golden] stepOffset 以下の段差を登って上面に乗る', () => {

		const { world, player } = makeStairScene( [ 0.25 ] ); // rise 0.25 <= 0.3
		player.teleport( new Vector3( 0, 1, - 2 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		// 段(奥行き2)を登り→上を歩き→奥端から降りる。登った瞬間の最大高さで判定する。
		let maxY = 0;
		let maxZ = - Infinity;
		for ( let i = 0; i < 120; i ++ ) {

			player.move( moveVec( DIR.posZ ) );
			world.fixedUpdate();
			maxY = Math.max( maxY, player.position.y );
			maxZ = Math.max( maxZ, player.position.z );

		}

		expect( maxY, '段差を登れていない' ).toBeCloseTo( 0.25, 1 );
		expect( maxZ, '段差の上へ前進していない' ).toBeGreaterThan( 0.5 );

	} );

	it( '[golden] stepOffset を超える段差は登れず壁として止まる', () => {

		const { world, player } = makeStairScene( [ 0.6 ] ); // rise 0.6 > 0.3
		player.teleport( new Vector3( 0, 1, - 2 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		for ( let i = 0; i < 120; i ++ ) { player.move( moveVec( DIR.posZ ) ); world.fixedUpdate(); }

		expect( player.position.y, '高い段差を登ってしまった' ).toBeLessThan( 0.1 );
		expect( player.position.z, '壁（段差前面 z=0）を越えて前進してしまった' ).toBeLessThan( 0 );

	} );

	it( '[golden] 階段: 低い段は登り、stepOffset 超の段で止まる', () => {

		// tops 0.2,0.45,0.75,1.15 => rise 0.2,0.25,0.30(=stepOffset),0.40(超)
		const { world, player } = makeStairScene( [ 0.2, 0.45, 0.75, 1.15 ] );
		player.teleport( new Vector3( 0, 1, - 2 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		for ( let i = 0; i < 300; i ++ ) { player.move( moveVec( DIR.posZ ) ); world.fixedUpdate(); }

		// 3段目(top 0.75)まで登り、4段目(rise 0.4 > 0.3)で停止
		expect( player.position.y, '3段目まで登れていない' ).toBeCloseTo( 0.75, 1 );
		expect( player.position.z, '4段目手前(z=6)で停止していない' ).toBeLessThan( 6 );
		expect( player.position.z, '3段目(z>=4)に到達していない' ).toBeGreaterThan( 4 );

	} );

	it( '[golden] 段差の頭上に天井があると登らない', () => {

		// 0.25 の登れる段だが、頭上 2.1 に天井 → 登ると頭(2.25)が当たるので登らない。
		// プレイヤー身長 2 なので足元 0 で頭 2.0 <天井 2.1 に収まる（頭を天井に貫通させない）。
		const { world, player } = makeStairScene( [ 0.25 ], { ceilingY: 2.1 } );
		player.teleport( new Vector3( 0, 0, - 2 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		let maxY = 0;
		for ( let i = 0; i < 120; i ++ ) {

			player.move( moveVec( DIR.posZ ) );
			world.fixedUpdate();
			maxY = Math.max( maxY, player.position.y );

		}

		expect( maxY, '天井があるのに登ってしまった' ).toBeLessThan( 0.1 );

	} );

} );

// ---- Phase 1（KinematicBody）ゴールデン ----
// 動く床の上に立てること、および縦方向（エレベーター）の運搬が接地スナップで
// 創発的に成立することを数値で固定する。水平運搬はフェーズ2で追加する。

// 床（静的な大平面）＋ 箱の動く床（原点中心・上面 = position.y + height/2）を作る。
function makeElevatorScene( { platformY = 3, size = [ 6, 1, 6 ] as [ number, number, number ] } = {} ) {

	const world = new World();

	const floor = new Mesh( new PlaneGeometry( 200, 200 ), new MeshBasicMaterial() );
	floor.rotation.x = - 90 * MathUtils.DEG2RAD;
	floor.updateMatrixWorld( true );
	const level = new StaticBody();
	level.addFromObject( floor );
	world.add( level );

	const [ w, h, d ] = size;
	const platform = KinematicBody.fromBox( { width: w, height: h, depth: d } );
	platform.position.set( 0, platformY, 0 );
	world.add( platform );

	const player = new CharacterController( { radius: 0.5, height: 2 } );
	world.add( player );

	const platformTop = () => platform.position.y + h / 2;

	return { world, player, platform, platformTop };

}

describe( 'KinematicBody moving platform', () => {

	it( '[golden] 動く床の上面に立てる（貫通せず接地）', () => {

		const { world, player, platform, platformTop } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) ); // 動く床の真上に落とす
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		expect( player.position.y, '上面に着地していない' ).toBeCloseTo( platformTop(), 1 );
		expect( player.isGrounded, '接地していない' ).toBe( true );
		expect( player.groundBody, '接地ボディが動く床として認識されていない' ).toBe( platform );

	} );

	it( '[golden] 上昇エレベーターに乗って一緒に上がる', () => {

		const { world, player, platform, platformTop } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const startY = player.position.y;

		platform.velocity.set( 0, 2, 0 ); // 上昇
		for ( let i = 0; i < 120; i ++ ) { // 2 m/s × 2s = +4m
			player.move( STOP );
			world.fixedUpdate();
			// 追随している（常に床上面に乗ったまま）
			expect( player.position.y ).toBeCloseTo( platformTop(), 1 );

		}

		expect( player.position.y - startY, '一緒に上昇していない' ).toBeGreaterThan( 3.5 );
		expect( player.isGrounded ).toBe( true );

	} );

	it( '[golden] 下降エレベーターに乗って一緒に下がる（浮かない）', () => {

		const { world, player, platform, platformTop } = makeElevatorScene( { platformY: 6 } );

		player.teleport( new Vector3( 0, 11, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const startY = player.position.y;

		platform.velocity.set( 0, - 2, 0 ); // 下降
		for ( let i = 0; i < 120; i ++ ) {
			player.move( STOP );
			world.fixedUpdate();
			expect( player.position.y, '床から浮いた/沈んだ' ).toBeCloseTo( platformTop(), 1 );

		}

		expect( startY - player.position.y, '一緒に下降していない' ).toBeGreaterThan( 3.5 );
		expect( player.isGrounded ).toBe( true );

	} );

	it( '[golden] 横移動する床に乗って一緒に運ばれる（Phase 2 運搬）', () => {

		const { world, player, platform, platformTop } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		expect( player.position.y ).toBeCloseTo( platformTop(), 1 );
		const startOffsetX = player.position.x - platform.position.x;

		platform.velocity.set( 2, 0, 0 ); // +x へ横移動
		for ( let i = 0; i < 120; i ++ ) { // 2 m/s × 2s = +4m
			player.move( STOP );
			world.fixedUpdate();
			// 床との相対位置を保ったまま運ばれている（床上から滑り落ちない）
			expect( player.position.x - platform.position.x, '床に対してずれた' ).toBeCloseTo( startOffsetX, 1 );
			expect( player.position.y, '床上面から外れた' ).toBeCloseTo( platformTop(), 1 );

		}

		expect( platform.position.x, '床が動いていない' ).toBeGreaterThan( 3.5 );
		expect( player.position.x, '一緒に運ばれていない' ).toBeGreaterThan( 3.5 );
		expect( player.isGrounded ).toBe( true );

	} );

	it( '[golden] 横移動する床の上を歩ける（運搬＋入力の合成）', () => {

		// 端から落ちないよう十分大きい床で、ゆっくり歩く
		const { world, player, platform, platformTop } = makeElevatorScene( { size: [ 30, 1, 30 ] } );

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const startZ = player.position.z;

		platform.velocity.set( 2, 0, 0 ); // 床は +x へ
		for ( let i = 0; i < 90; i ++ ) { // キャラは床の上で -z へ 4 m/s で歩く
			player.move( moveVec( DIR.negZ, 4 ) );
			world.fixedUpdate();
			expect( player.position.y, '床上面から外れた' ).toBeCloseTo( platformTop(), 1 );

		}

		// 運搬(+x)と入力(-z)が両立している
		expect( player.position.x, '床と一緒に +x へ運ばれていない' ).toBeGreaterThan( 2.5 );
		expect( startZ - player.position.z, '入力方向(-z)へ歩けていない' ).toBeGreaterThan( 2 );

	} );

	it( '[golden] 床を position で瞬間移動してもライダーは吹っ飛ばない（テレポート安全）', () => {

		const { world, player, platform } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		expect( player.groundBody ).toBe( platform );

		// 床を +x へ 100 瞬間移動（velocity は 0 のまま）。運搬 delta は積分ぶんだけなので
		// ライダーはその場に留まり（＝床が消えて落下）、100 も引きずられない。
		platform.position.x += 100;
		for ( let i = 0; i < 10; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		expect( Math.abs( player.position.x ), 'テレポートに引きずられた' ).toBeLessThan( 1 );

	} );

	it( '[golden] 動く床からジャンプすると水平速度を引き継いで流れる（Phase 4 離脱慣性）', () => {

		const { world, player, platform } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		platform.velocity.set( 3, 0, 0 ); // 床は +x へ
		for ( let i = 0; i < 10; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 数フレーム運ばれる
		const xAtJump = player.position.x;

		player.jump(); // 真上へジャンプ（入力は無し）
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		// 入力ゼロでも床の水平速度(+x)を引き継いで確実に流れる（引き継がなければ ~0）
		expect( player.position.x - xAtJump, '離脱慣性で流れていない' ).toBeGreaterThan( 1.5 );

	} );

	it( '[golden] 静止した床からのジャンプでは流れない（慣性は動床由来のみ）', () => {

		const { world, player, platform } = makeElevatorScene();

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		platform.velocity.set( 0, 0, 0 ); // 床は静止
		const xAtJump = player.position.x;

		player.jump();
		for ( let i = 0; i < 40; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		expect( Math.abs( player.position.x - xAtJump ), '静止床なのに水平に流れた' ).toBeLessThan( 0.2 );

	} );

	it( '[golden] 回転する床（ターンテーブル）に乗ると軌道運搬される（Phase 5）', () => {

		const { world, player, platform, platformTop } = makeElevatorScene( { size: [ 12, 1, 12 ] } );

		player.teleport( new Vector3( 3, 8, 0 ) ); // 中心から半径3の位置
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const r0 = Math.hypot( player.position.x, player.position.z );
		expect( r0 ).toBeCloseTo( 3, 1 );

		platform.angularVelocity.set( 0, Math.PI / 2, 0 ); // 90°/s
		for ( let i = 0; i < 60; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 1s = 1/4回転

		const r1 = Math.hypot( player.position.x, player.position.z );
		expect( r1, '半径が保たれていない（軌道運搬失敗）' ).toBeCloseTo( 3, 0 );
		expect( Math.abs( player.position.z ), '回転方向へ運ばれていない' ).toBeGreaterThan( 2 );
		expect( Math.abs( player.position.x ), '1/4回転で x が 0 近傍に来ていない' ).toBeLessThan( 1 );
		expect( player.position.y, '床上面から外れた' ).toBeCloseTo( platformTop(), 1 );

	} );

	it( '[golden] carryRotation で回転床に乗ると向きも追従する（off にすると不変）', () => {

		const fwd = ( p: CharacterController ) => new Vector3( 0, 0, 1 ).applyQuaternion( p.quaternion );

		// off: 向きは変わらない
		const a = makeElevatorScene();
		a.player.carryRotation = false;
		a.player.teleport( new Vector3( 0, 8, 0 ) ); // 中心（軌道並進なし・向きだけ見る）
		a.player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { a.player.move( STOP ); a.world.fixedUpdate(); }
		const aBefore = fwd( a.player );
		a.platform.angularVelocity.set( 0, Math.PI / 2, 0 );
		for ( let i = 0; i < 60; i ++ ) { a.player.move( STOP ); a.world.fixedUpdate(); }
		expect( aBefore.angleTo( fwd( a.player ) ), 'off なのに向きが回った' ).toBeLessThan( 0.1 );

		// 既定 on: 床の yaw に追従（1s で 90°）
		const b = makeElevatorScene();
		b.player.teleport( new Vector3( 0, 8, 0 ) );
		b.player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { b.player.move( STOP ); b.world.fixedUpdate(); }
		const bBefore = fwd( b.player );
		b.platform.angularVelocity.set( 0, Math.PI / 2, 0 );
		for ( let i = 0; i < 60; i ++ ) { b.player.move( STOP ); b.world.fixedUpdate(); }
		expect( bBefore.angleTo( fwd( b.player ) ), 'carryRotation on で向きが追従していない' ).toBeCloseTo( Math.PI / 2, 1 );

	} );

	it( '[golden] 回転床の外周でジャンプすると接線方向へ飛ばされる（回転の離脱慣性）', () => {

		const { world, player, platform } = makeElevatorScene( { size: [ 12, 1, 12 ] } );

		player.teleport( new Vector3( 3, 8, 0 ) ); // 中心から +x に半径3
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		platform.angularVelocity.set( 0, Math.PI / 2, 0 ); // ω×r = (0,0,-3π/2) ≈ -z 方向へ接線
		for ( let i = 0; i < 4; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const zAtJump = player.position.z;

		player.jump();
		for ( let i = 0; i < 30; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 入力なし

		// 接線速度(-z)を引き継いで確実に -z へ飛んだ（引き継がなければ ~0）
		expect( player.position.z - zAtJump, '接線方向へ飛ばされていない' ).toBeLessThan( - 1.5 );

	} );

	it( '[golden] コンベア（surfaceVelocity）: 床は静止したまま乗員だけ運ばれる', () => {

		const { world, player, platform, platformTop } = makeElevatorScene( { size: [ 12, 1, 12 ] } );

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		expect( player.position.y ).toBeCloseTo( platformTop(), 1 );
		const platformX0 = platform.position.x;
		const playerX0 = player.position.x;

		platform.surfaceVelocity.set( 2, 0, 0 ); // 表面が +x へ 2 m/s で流れる
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 2s

		expect( platform.position.x, '床（位置）が動いてしまった' ).toBeCloseTo( platformX0, 5 );
		expect( player.position.x - playerX0, '乗員が表面の流れで運ばれていない' ).toBeGreaterThan( 3.5 );
		expect( player.position.y, '床上面から外れた' ).toBeCloseTo( platformTop(), 1 );
		expect( player.isGrounded ).toBe( true );

	} );

	it( '[golden] コンベアの上でジャンプすると表面速度を引き継いで飛ぶ（離脱慣性）', () => {

		const { world, player, platform } = makeElevatorScene( { size: [ 12, 1, 12 ] } );

		player.teleport( new Vector3( 0, 8, 0 ) );
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 120; i ++ ) { player.move( STOP ); world.fixedUpdate(); }

		platform.surfaceVelocity.set( 3, 0, 0 );
		for ( let i = 0; i < 4; i ++ ) { player.move( STOP ); world.fixedUpdate(); }
		const xAtJump = player.position.x;

		player.jump();
		for ( let i = 0; i < 30; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 入力なし

		expect( player.position.x - xAtJump, '表面速度を引き継いで +x へ飛んでいない' ).toBeGreaterThan( 1 );

	} );

	// 板ポリゴン（単一面・端に立ち面が無い）の傾斜ベルトを作る。水平な面を pivot に入れて
	// 焼き、呼び出し側が body の quaternion で傾ける。箱と違い高端に「壁」が生じない。
	function makePlaneBelt( { width, depth }: { width: number; depth: number } ): KinematicBody {

		const pivot = new Object3D();
		const plane = new Mesh( new PlaneGeometry( width, depth ), new MeshBasicMaterial() );
		plane.rotation.x = - 90 * MathUtils.DEG2RAD; // 面を上向き（水平）に
		pivot.add( plane );
		pivot.updateWorldMatrix( true, true );
		return KinematicBody.fromObject( pivot );

	}

	it( '[golden] エスカレーター（傾斜コンベア）: 床は静止したまま乗員が斜面を上る', () => {

		const world = new World();

		const floor = new Mesh( new PlaneGeometry( 200, 200 ), new MeshBasicMaterial() );
		floor.rotation.x = - 90 * MathUtils.DEG2RAD;
		floor.updateMatrixWorld( true );
		const level = new StaticBody();
		level.addFromObject( floor );
		world.add( level );

		// +x 側が持ち上がる 30° の傾斜ベルト（歩ける勾配: slopeLimit 既定 50° 未満）
		const theta = 30 * MathUtils.DEG2RAD;
		const speed = 4;
		const belt = makePlaneBelt( { width: 30, depth: 4 } );
		belt.position.set( 0, 8, 0 );
		belt.quaternion.setFromAxisAngle( new Vector3( 0, 0, 1 ), theta );
		belt.surfaceVelocity.set( Math.cos( theta ) * speed, Math.sin( theta ) * speed, 0 ); // 斜面に沿って上向き
		world.add( belt );

		const player = new CharacterController( { radius: 0.5, height: 2 } );
		world.add( player );

		player.teleport( new Vector3( 0, 12, 0 ) ); // ベルト中央へ落とす
		player.velocity.set( 0, 0, 0 );
		for ( let i = 0; i < 90; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 着地して運ばれ始める
		expect( player.isGrounded, 'ベルトに接地していない' ).toBe( true );

		const beltX0 = belt.position.x;
		const beltY0 = belt.position.y;
		const x0 = player.position.x;
		const y0 = player.position.y;

		for ( let i = 0; i < 60; i ++ ) { player.move( STOP ); world.fixedUpdate(); } // 1s

		expect( belt.position.x, '床（位置）が動いてしまった' ).toBeCloseTo( beltX0, 5 );
		expect( belt.position.y, '床（位置）が動いてしまった' ).toBeCloseTo( beltY0, 5 );
		expect( player.position.x - x0, '斜面に沿って +x へ進んでいない' ).toBeGreaterThan( 1 );
		expect( player.position.y - y0, '斜面を上っていない（高度が増えていない）' ).toBeGreaterThan( 1 );
		expect( player.isGrounded, '運搬中に接地が外れた' ).toBe( true );

	} );

	it( '[golden] 板ポリゴンの傾斜ベルト上端では固着せず前方へ離脱して降りる', () => {

		// 箱ベルトだと高端キャップが壁になり上端で固着する（前進も落下もしない）。板ポリゴンなら
		// 上端に壁が無く、表面速度を引き継いでそのまま前方へ離脱→落下できることを固定する。
		const world = new World();

		const floor = new Mesh( new PlaneGeometry( 200, 200 ), new MeshBasicMaterial() );
		floor.rotation.x = - 90 * MathUtils.DEG2RAD;
		floor.updateMatrixWorld( true );
		const level = new StaticBody();
		level.addFromObject( floor );
		world.add( level );

		const theta = 30 * MathUtils.DEG2RAD;
		const speed = 5;
		const belt = makePlaneBelt( { width: 12, depth: 4 } );
		belt.position.set( - 14, 2.6, - 8 ); // demo と同配置（高端 ≈ (-8.8, 5.6)）
		belt.quaternion.setFromAxisAngle( new Vector3( 0, 0, 1 ), theta );
		belt.surfaceVelocity.set( Math.cos( theta ) * speed, Math.sin( theta ) * speed, 0 );
		world.add( belt );

		const player = new CharacterController( { radius: 0.5, height: 2 } );
		world.add( player );

		player.teleport( new Vector3( - 18, 3, - 8 ) ); // 低い端付近に置く
		player.velocity.set( 0, 0, 0 );

		let maxY = - Infinity;
		let detachedAtTop = false;
		for ( let i = 0; i < 240; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();
			maxY = Math.max( maxY, player.position.y );
			// 上端付近（高度 > 4）で接地が外れた瞬間 = 壁で固着せず離脱できた証拠
			if ( ! player.isGrounded && player.position.y > 4 ) detachedAtTop = true;

		}

		expect( maxY, '斜面をほとんど登れていない' ).toBeGreaterThan( 5 );
		expect( detachedAtTop, '上端で固着し離脱していない（板ポリゴンの狙いが崩れた）' ).toBe( true );
		expect( player.position.y, '最終的に降りていない（上端に張り付いたまま）' ).toBeLessThan( 1 );

	} );

} );

// 梯子（ClimbableBody mode:'ladder'）: 面へ入力して取り付き、上下に登り、上端で天面へ乗り移る。
// シーン: 床 + 上部プラットフォーム（上面 y=6・前面 z=0・x[-3,3]・z[-6,0]）＋
// その前面に取り付いた梯子（box z[0,0.3]・y[0,6]・faceDirection +Z）。
function makeLadderScene() {

	const world = new World();

	const floor = new Mesh( new PlaneGeometry( 198, 198, 66, 66 ), new MeshBasicMaterial() );
	floor.rotation.x = - 90 * MathUtils.DEG2RAD;
	floor.updateMatrixWorld( true );

	const platform = new Mesh( new BoxGeometry( 6, 6, 6 ), new MeshBasicMaterial() );
	platform.position.set( 0, 3, - 3 ); // x[-3,3], y[0,6], z[-6,0]
	platform.updateMatrixWorld( true );

	const level = new StaticBody();
	level.addFromObject( floor );
	level.addFromObject( platform );
	world.add( level );

	const ladder = new ClimbableBody( {
		mode: 'ladder',
		box: new Box3( new Vector3( - 0.5, 0, 0 ), new Vector3( 0.5, 6, 0.3 ) ),
		faceDirection: new Vector3( 0, 0, 1 ),
		speed: 3,
	} );
	world.add( ladder );

	const player = new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT } );
	world.add( player );

	return { world, player, ladder };

}

// 梯子の前に着地させ、面へ押し込んで取り付くまで進める。取り付いたら true。
function mountLadder( world: World, player: CharacterController ): boolean {

	player.teleport( new Vector3( 0, 0, 3 ) );
	for ( let i = 0; i < 20; i ++ ) {

		player.move( STOP );
		world.fixedUpdate();

	}

	for ( let i = 0; i < 60; i ++ ) {

		player.move( moveVec( DIR.negZ ) ); // -Z（梯子へ押し込む）
		world.fixedUpdate();
		if ( player.isClimbing ) return true;

	}

	return false;

}

describe( 'CharacterController ladder climbing', () => {

	it( '面へ入力すると梯子に取り付き、上へ登れる', () => {

		const { world, player } = makeLadderScene();
		expect( mountLadder( world, player ), '梯子に取り付けていない' ).toBe( true );

		const yAtMount = player.position.y;
		for ( let i = 0; i < 30; i ++ ) {

			player.climb( new Vector2( 0, 1 ) ); // 上へ
			world.fixedUpdate();
			if ( ! player.isClimbing ) break;

		}

		expect( player.position.y, '登って高くなっていない' ).toBeGreaterThan( yAtMount + 1 );

	} );

	it( '上端でマントルして天面へ乗り移り、接地する', () => {

		const { world, player } = makeLadderScene();
		expect( mountLadder( world, player ), '梯子に取り付けていない' ).toBe( true );

		for ( let i = 0; i < 400; i ++ ) {

			player.climb( new Vector2( 0, 1 ) );
			world.fixedUpdate();
			if ( ! player.isClimbing ) break;

		}

		expect( player.isClimbing, '登り状態から抜けていない' ).toBe( false );

		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.isGrounded, '天面に接地していない' ).toBe( true );
		expect( player.position.y, '天面(y=6)付近にいない' ).toBeGreaterThan( 5.5 );
		expect( player.position.z, '天面(z<=0)へ乗り移れていない' ).toBeLessThan( 0 );

	} );

	it( '上端→歩行の遷移で瞬間移動しない（カメラのカクつき防止）', () => {

		// マントル（天面への乗り移り）を 1 フレームでテレポートすると、位置追従のカメラがカクつく。
		// 登り〜天面到達の間、1 フレームあたりの水平移動が小さく保たれること（滑らかに前進）を固定する。
		const { world, player } = makeLadderScene();
		expect( mountLadder( world, player ), '梯子に取り付けていない' ).toBe( true );

		let maxHorizStep = 0;
		let reachedTop = false;
		let prevX = player.position.x;
		let prevZ = player.position.z;
		let prevY = player.position.y;

		for ( let i = 0; i < 400; i ++ ) {

			if ( player.isClimbing ) player.climb( new Vector2( 0, 1 ) ); // 上へ
			player.move( STOP );
			world.fixedUpdate();

			// 接地高さ付近のグラブ地点は除外し、登り〜天面遷移だけを測る
			if ( player.position.y > 1 && prevY > 1 ) {

				const d = Math.hypot( player.position.x - prevX, player.position.z - prevZ );
				maxHorizStep = Math.max( maxHorizStep, d );

			}

			prevX = player.position.x;
			prevZ = player.position.z;
			prevY = player.position.y;

			if ( ! player.isClimbing && player.position.y > 5 ) reachedTop = true;

		}

		expect( reachedTop, '天面に到達していない' ).toBe( true );
		// 旧実装は radius*2（≈1.5m）を 1 フレームで瞬間移動していた。滑らかなら 1 フレーム移動は十分小さい。
		expect( maxHorizStep, '上端の遷移で位置が瞬間移動している' ).toBeLessThan( 0.3 );

	} );

	it( '下入力で降りると最下端で接地して離脱する', () => {

		const { world, player } = makeLadderScene();
		expect( mountLadder( world, player ), '梯子に取り付けていない' ).toBe( true );

		// いったん少し登ってから
		for ( let i = 0; i < 20; i ++ ) {

			player.climb( new Vector2( 0, 1 ) );
			world.fixedUpdate();

		}

		// 下入力で降りる
		for ( let i = 0; i < 60; i ++ ) {

			player.climb( new Vector2( 0, - 1 ) );
			world.fixedUpdate();
			if ( ! player.isClimbing ) break;

		}

		expect( player.isClimbing, '最下端で離脱していない' ).toBe( false );
		expect( player.position.y, '地面付近まで降りていない' ).toBeLessThan( 0.5 );

	} );

	it( '登り中にジャンプすると離脱して外向き(+Z)へポップする', () => {

		const { world, player } = makeLadderScene();
		expect( mountLadder( world, player ), '梯子に取り付けていない' ).toBe( true );

		for ( let i = 0; i < 20; i ++ ) {

			player.climb( new Vector2( 0, 1 ) );
			world.fixedUpdate();

		}

		const zBefore = player.position.z;
		player.jump();

		expect( player.isClimbing, 'ジャンプで登りを抜けていない' ).toBe( false );
		expect( player.isJumping, 'ジャンプが始まっていない' ).toBe( true );

		for ( let i = 0; i < 10; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.position.z, '外向き(+Z)へ離れていない' ).toBeGreaterThan( zBefore );

	} );

	it( 'ジャンプで梯子へ向かうと空中で貼り付ける', () => {

		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 0, 2.5 ) ); // 梯子の手前の床
		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.isGrounded, '床に接地していない' ).toBe( true );

		player.jump();
		let grabbedAirborne = false;
		let grabY = - 1;
		for ( let i = 0; i < 60; i ++ ) {

			player.move( moveVec( DIR.negZ ) ); // 梯子(-Z)へ向かう
			world.fixedUpdate();
			if ( player.isClimbing ) { grabbedAirborne = true; grabY = player.position.y; break; }

		}

		expect( grabbedAirborne, 'ジャンプ中に梯子へ貼り付けていない' ).toBe( true );
		expect( grabY, '接地せず空中で掴めていない' ).toBeGreaterThan( 1 );

	} );

	it( '自由落下中に梯子へ向かうと空中で貼り付ける', () => {

		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 4, 1.5 ) ); // 梯子前面の外側・空中

		let grabbedFalling = false;
		let grabY = - 1;
		for ( let i = 0; i < 60; i ++ ) {

			player.move( moveVec( DIR.negZ ) ); // 梯子(-Z)へ向かう
			world.fixedUpdate();
			if ( player.isClimbing ) { grabbedFalling = true; grabY = player.position.y; break; }

		}

		expect( grabbedFalling, '落下中に梯子へ貼り付けていない' ).toBe( true );
		expect( grabY, '接地せず空中で掴めていない' ).toBeGreaterThan( 1 );

	} );

	it( '天面から梯子の上端に取り付いて降りられる', () => {

		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 6, - 0.4 ) ); // 天面（y=6）の縁付近
		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.isGrounded, '天面に接地していない' ).toBe( true );

		// 縁（外向き +Z）へ向かって押す → 天面から取り付く
		let mounted = false;
		for ( let i = 0; i < 30 && ! mounted; i ++ ) {

			player.move( moveVec( DIR.posZ ) );
			world.fixedUpdate();
			if ( player.isClimbing ) mounted = true;

		}

		expect( mounted, '天面から梯子に取り付けていない' ).toBe( true );
		const yAtMount = player.position.y;

		// 下入力（S）で降りる。デモでは「縁へ歩く」も「降りる」も同じ S キー
		// （move はカメラ相対で +Z、climb は生入力 -1）なので押しっぱなしで繋がる。
		for ( let i = 0; i < 400; i ++ ) {

			player.climb( new Vector2( 0, - 1 ) );
			player.move( STOP );
			world.fixedUpdate();
			if ( ! player.isClimbing ) break;

		}

		expect( player.position.y, '降りて低くなっていない' ).toBeLessThan( yAtMount - 1 );
		expect( player.isClimbing, '降り切って離脱していない' ).toBe( false );

		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.position.y, '地面まで降りていない' ).toBeLessThan( 0.5 );

	} );

	it( '天面から梯子に掴まる遷移で瞬間移動しない（カメラのカクつき防止）', () => {

		// 天面グラブ時、縁 → 梯子前面（attach）へ x/z を 1 フレームでスナップするとカメラがカクつく。
		// グラブ〜降り始めの間、1 フレームあたりの水平移動が小さく保たれること（滑らかに寄せる）を固定する。
		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 6, - 0.4 ) ); // 天面の縁付近
		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		let maxHorizStep = 0;
		let mounted = false;
		let prevX = player.position.x;
		let prevZ = player.position.z;

		for ( let i = 0; i < 200; i ++ ) {

			if ( player.isClimbing ) player.climb( new Vector2( 0, - 1 ) ); // 降りる
			player.move( moveVec( DIR.posZ ) ); // 縁（外向き +Z）へ
			world.fixedUpdate();

			if ( player.isClimbing ) {

				mounted = true;
				const d = Math.hypot( player.position.x - prevX, player.position.z - prevZ );
				maxHorizStep = Math.max( maxHorizStep, d );

			}

			prevX = player.position.x;
			prevZ = player.position.z;
			if ( ! player.isClimbing && mounted ) break; // 降り切ったら終了

		}

		expect( mounted, '天面から梯子に取り付けていない' ).toBe( true );
		// 旧実装は縁→前面（≈0.8m）を 1 フレームで瞬間移動していた。滑らかなら 1 フレーム移動は十分小さい。
		expect( maxHorizStep, '天面グラブの遷移で位置が瞬間移動している' ).toBeLessThan( 0.3 );

	} );

	it( '上端で前方入力を押し続けても再取り付きせず暴れない', () => {

		// demo と同じ入力ルーティングを再現する:
		//   登り中   -> climb(0,1) で上へ、move は停止
		//   非登り中 -> move(前方=梯子/天面側 -Z)
		// 修正前は、上端でマントルした直後に「前方入力」が再取り付きを誘発し、
		// 掴む → 即マントル → 掴む… を繰り返して位置が振動していた。
		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 0, 3 ) );
		for ( let i = 0; i < 20; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		let everMounted = false;
		let didTop = false;
		let topped = false; // 「上端到達フレームより後」の測定を始めるフラグ（マントルの一度きりの跳びを除外）
		let remountedAfterTop = false;
		let maxZStep = 0;
		let prevZ = player.position.z;

		for ( let i = 0; i < 400; i ++ ) {

			if ( player.isClimbing ) {

				everMounted = true;
				player.climb( new Vector2( 0, 1 ) );
				player.move( STOP );

			} else {

				player.move( moveVec( DIR.negZ ) ); // 前方（梯子・天面側 -Z）

			}

			world.fixedUpdate();

			// 上端到達の「次フレーム以降」だけを測る（マントル自体の一度きりの水平跳びは正常なので除外）
			if ( topped ) {

				if ( player.isClimbing ) remountedAfterTop = true; // 再び掴んだ = ガクガクの再取り付き
				maxZStep = Math.max( maxZStep, Math.abs( player.position.z - prevZ ) );

			}

			if ( everMounted && ! player.isClimbing && player.position.y > 5 ) { didTop = true; topped = true; }

			prevZ = player.position.z;

		}

		expect( everMounted, '梯子に取り付けていない' ).toBe( true );
		expect( didTop, '上端まで登り切れていない' ).toBe( true );
		expect( remountedAfterTop, '上端で再取り付きしている（ガクガクの原因）' ).toBe( false );
		// 天面では滑らかに歩くだけ（1ステップの z 変位は移動量程度）。振動時は取り付き点へ跳ね戻り大きく変位する。
		expect( maxZStep, '上端で z が跳ねている（振動）' ).toBeLessThan( 0.3 );

	} );

	it( '背を向けて入力しても取り付かない（誤発動しない）', () => {

		const { world, player } = makeLadderScene();
		player.teleport( new Vector3( 0, 0, 1 ) ); // 梯子の直前
		for ( let i = 0; i < 30; i ++ ) {

			player.move( moveVec( DIR.posZ ) ); // +Z（梯子から離れる向き）
			world.fixedUpdate();

		}

		expect( player.isClimbing, '離れる入力なのに取り付いた' ).toBe( false );

	} );

} );

describe( 'StaticBody quantized geometry (KHR_mesh_quantization)', () => {

	// 正規化 Int16 の POSITION（KHR_mesh_quantization 相当）で ±100 の床を作る。
	// 実座標は scale 100 の行列で復元される（int / 32767 * 100）。
	function makeQuantizedFloor() {

		const S = 32767;
		const positions = new Int16Array( [
			- S, 0, - S,
			  S, 0, - S,
			  S, 0,   S,
			- S, 0,   S,
		] );
		const attribute = new BufferAttribute( positions, 3 );
		attribute.normalized = true;

		const geometry = new BufferGeometry();
		geometry.setAttribute( 'position', attribute );
		geometry.setIndex( [ 0, 2, 1, 0, 3, 2 ] );

		const body = new StaticBody();
		body.addFromGeometry( geometry, new Matrix4().makeScale( 100, 100, 100 ) );
		return body;

	}

	it( '正規化整数の頂点を復元して取り込む（生の整数値のままにならない）', () => {

		const triangles = makeQuantizedFloor().getSphereTriangles( new Sphere( new Vector3( 0, 0, 0 ), 5 ), [] );

		expect( triangles.length ).toBe( 2 );

		for ( const triangle of triangles ) {

			for ( const v of [ triangle.a, triangle.b, triangle.c ] ) {

				// 復元されていれば ±100 前後。バグ時は ±32767 相当の巨大値になる。
				expect( Math.abs( v.x ) ).toBeLessThanOrEqual( 101 );
				expect( Math.abs( v.z ) ).toBeLessThanOrEqual( 101 );
				expect( Math.abs( v.y ) ).toBeLessThan( 1e-3 );

			}

			// 水平な床なので法線は鉛直
			expect( Math.abs( triangle.normal.y ) ).toBeGreaterThan( 0.99 );

		}

	} );

	it( 'キャラクターが量子化された床に接地する（すり抜けて落下しない）', () => {

		const world = new World();
		world.add( makeQuantizedFloor() );

		const player = new CharacterController( { radius: PLAYER_RADIUS, height: PLAYER_HEIGHT } );
		world.add( player );
		player.teleport( new Vector3( 0, 5, 0 ) );
		player.velocity.set( 0, 0, 0 );

		for ( let i = 0; i < 120; i ++ ) {

			player.move( STOP );
			world.fixedUpdate();

		}

		expect( player.isGrounded ).toBe( true );
		expect( player.position.y ).toBeCloseTo( 0, 1 );

	} );

} );

describe( 'StaticBody triangle buffers', () => {

	const positions = new Float32Array( [
		- 10, 0, - 10,
		  10, 0, - 10,
		  10, 0,   10,
		- 10, 0,   10,
	] );
	const indices = new Uint32Array( [ 0, 2, 1, 0, 3, 2 ] );

	it( 'TypedArray の三角形を直接取り込む', () => {

		const bakedPositions = positions.slice();
		for ( let i = 0; i < bakedPositions.length; i += 3 ) {
			bakedPositions[ i ]! += 5;
			bakedPositions[ i + 1 ]! += 2;
			bakedPositions[ i + 2 ]! += 7;
		}

		const body = new StaticBody().addTriangles( bakedPositions, indices );
		const triangles = body.getSphereTriangles( new Sphere( new Vector3( 5, 2, 7 ), 1 ), [] );

		expect( triangles ).toHaveLength( 2 );
		expect( triangles[ 0 ]!.normal.y ).toBeGreaterThan( 0.99 );
		expect( triangles[ 0 ]!.a.x ).toBeGreaterThanOrEqual( - 6 );

	} );

	it( '構築済みoctreeをシリアライズしてhydrateできる', () => {

		const source = new StaticBody().addTriangles( positions, indices );
		const data = source.toOctreeData();
		const body = StaticBody.fromOctreeData( data );
		const triangles = body.getSphereTriangles( new Sphere( new Vector3( 0, 0, 0 ), 1 ), [] );

		expect( triangles ).toHaveLength( 2 );
		expect( data.triangleRefs ).toBeInstanceOf( Uint32Array );

	} );

} );

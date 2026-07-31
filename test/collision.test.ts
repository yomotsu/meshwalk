import { describe, it, expect } from 'vitest';
import {
	Mesh,
	Vector3,
	PlaneGeometry,
	BoxGeometry,
	MeshBasicMaterial,
	MathUtils,
} from 'three';
import { World } from '../src/core/World';
import { StaticBody } from '../src/core/StaticBody';
import { CharacterController } from '../src/core/CharacterController';

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

} );

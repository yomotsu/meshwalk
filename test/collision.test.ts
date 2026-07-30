import { describe, it, expect } from 'vitest';
import {
	Object3D,
	Mesh,
	Vector3,
	PlaneGeometry,
	BoxGeometry,
	MeshBasicMaterial,
	MathUtils,
} from 'three';
import { World } from '../src/core/World';
import { StaticBody } from '../src/core/StaticBody';
import { CharacterBody } from '../src/core/CharacterBody';

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

	const player = new CharacterBody( new Object3D(), PLAYER_RADIUS, PLAYER_HEIGHT );
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
function drive( world: World, player: CharacterBody, startX: number, startZ: number, dir: number, iterations: number ) {

	player.teleport( startX, 0, startZ );
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
		player.teleport( 10, 5, 10 ); // 箱から離れた床の上、少し高い位置
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

			player.teleport( - 6, 0, z );
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
			player.teleport( - 6, 0, 0 );
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

			player.teleport( x, 10, 0 ); // 箱の上に落とす
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

} );

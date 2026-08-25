import { describe, it, expect } from 'vitest';
import { Mesh, Vector3, PlaneGeometry, BoxGeometry, MeshBasicMaterial, MathUtils, Ray } from 'three';
import { StaticBody } from '../src/core/StaticBody';
import { ComputedTriangle } from '../src/math/triangle';
import { sweepSphereTriangle } from '../src/math/sweepSphereTriangle';

const NO_HIT = - 1;

// xy 平面上の三角形（法線 +z）。原点まわりを覆う大きさ。
function facingTriangle() {

	return new ComputedTriangle(
		new Vector3( - 5, - 5, 0 ),
		new Vector3( 5, - 5, 0 ),
		new Vector3( 0, 5, 0 ),
	);

}

describe( 'sweepSphereTriangle', () => {

	it( '正面から面へ突っ込む: 半径ぶん手前で接触する', () => {

		const triangle = facingTriangle();
		const distance = sweepSphereTriangle(
			new Vector3( 0, 0, 10 ), new Vector3( 0, 0, - 1 ), 20, 0.5, triangle,
		);
		expect( distance ).toBeCloseTo( 9.5, 10 );

	} );

	it( '半径を変えると接触距離もその分だけ変わる', () => {

		const triangle = facingTriangle();
		const at = ( radius: number ) => sweepSphereTriangle(
			new Vector3( 0, 0, 10 ), new Vector3( 0, 0, - 1 ), 20, radius, triangle,
		);
		expect( at( 0 ) ).toBeCloseTo( 10, 10 );
		expect( at( 2 ) ).toBeCloseTo( 8, 10 );

	} );

	it( '最大距離に届かなければヒットしない', () => {

		const triangle = facingTriangle();
		const distance = sweepSphereTriangle(
			new Vector3( 0, 0, 10 ), new Vector3( 0, 0, - 1 ), 9, 0.5, triangle,
		);
		expect( distance ).toBe( NO_HIT );

	} );

	it( '背面（法線と同じ側へ進む面）は無視する', () => {

		const triangle = facingTriangle();
		// 三角形の裏側（-z）から +z へ進む = 背面に当たる
		const distance = sweepSphereTriangle(
			new Vector3( 0, 0, - 10 ), new Vector3( 0, 0, 1 ), 20, 0.5, triangle,
		);
		expect( distance ).toBe( NO_HIT );

	} );

	it( '開始時点で既に重なっていたら無視する（カメラがターゲットへ張り付かないように）', () => {

		const triangle = facingTriangle();
		const distance = sweepSphereTriangle(
			new Vector3( 0, 0, 0.2 ), new Vector3( 0, 0, - 1 ), 20, 0.5, triangle,
		);
		expect( distance ).toBe( NO_HIT );

	} );

	it( '面を外れて進む場合はヒットしない', () => {

		const triangle = facingTriangle();
		const distance = sweepSphereTriangle(
			new Vector3( 50, 0, 10 ), new Vector3( 0, 0, - 1 ), 20, 0.5, triangle,
		);
		expect( distance ).toBe( NO_HIT );

	} );

	it( '辺に当たる: 面の外側を通っても、辺との距離が半径以下なら接触する', () => {

		// 辺 (-5,-5,0)-(5,-5,0) を含む直線は y=-5, z=0。
		// 球の中心が y=-5 の平面上を z=10 から -z へ進むと、辺との距離が半径になる位置で接触。
		const triangle = facingTriangle();
		const radius = 0.5;
		const distance = sweepSphereTriangle(
			new Vector3( 0, - 5, 10 ), new Vector3( 0, 0, - 1 ), 20, radius, triangle,
		);
		expect( distance ).toBeCloseTo( 10 - radius, 10 );

	} );

	it( '頂点に当たる: 面からも辺からも外れた側から頂点へ向かうと接触する', () => {

		// 頂点 (0,5,0) へ、三角形の外側（y が大きい側）から斜めに向かう
		const triangle = facingTriangle();
		const radius = 0.5;
		const apex = new Vector3( 0, 5, 0 );
		const from = new Vector3( 0, 15, 10 );
		const direction = apex.clone().sub( from ).normalize();
		const distance = sweepSphereTriangle( from, direction, 100, radius, triangle );
		expect( distance ).toBeCloseTo( from.distanceTo( apex ) - radius, 8 );

	} );

	it( '辺のわずかに外側をかすめる場合はヒットしない', () => {

		const triangle = facingTriangle();
		const radius = 0.5;
		// 辺 y=-5 から半径より少し離れた位置を通す
		const distance = sweepSphereTriangle(
			new Vector3( 0, - 5 - radius * 1.01, 10 ), new Vector3( 0, 0, - 1 ), 20, radius, triangle,
		);
		expect( distance ).toBe( NO_HIT );

	} );

	it( '斜めに進んでも、接触時の中心と三角形の距離が半径に一致する', () => {

		const triangle = facingTriangle();
		const radius = 0.75;
		const from = new Vector3( - 3, 2, 8 );
		const direction = new Vector3( 0.4, - 0.3, - 1 ).normalize();
		const distance = sweepSphereTriangle( from, direction, 100, radius, triangle );
		expect( distance ).toBeGreaterThan( 0 );

		const center = from.clone().addScaledVector( direction, distance );
		const closest = new Vector3();
		triangle.closestPointToPoint( center, closest );
		expect( center.distanceTo( closest ) ).toBeCloseTo( radius, 8 );

	} );

} );

describe( 'StaticBody.sphereCast', () => {

	function scene() {

		const body = new StaticBody();
		const floor = new Mesh( new PlaneGeometry( 40, 40, 10, 10 ), new MeshBasicMaterial() );
		floor.rotation.x = - 90 * MathUtils.DEG2RAD;
		floor.updateMatrixWorld( true );
		body.addFromObject( floor );

		const wall = new Mesh( new BoxGeometry( 10, 10, 1 ), new MeshBasicMaterial() );
		wall.position.set( 0, 5, - 8 ); // 手前の面は z = -7.5
		wall.updateMatrixWorld( true );
		body.addFromObject( wall );

		return body;

	}

	it( '壁の手前で、半径ぶん離れて止まる', () => {

		const body = scene();
		const result = body.sphereCast( new Vector3( 0, 5, 0 ), new Vector3( 0, 0, - 1 ), 20, 0.5 );
		expect( result ).not.toBe( false );
		expect( ( result as any ).distance ).toBeCloseTo( 7.5 - 0.5, 6 );

	} );

	it( '最大距離を超えるヒットは返さない', () => {

		const body = scene();
		expect( body.sphereCast( new Vector3( 0, 5, 0 ), new Vector3( 0, 0, - 1 ), 5, 0.5 ) ).toBe( false );

	} );

	it( '何も無い方向へはヒットしない', () => {

		const body = scene();
		expect( body.sphereCast( new Vector3( 0, 5, 0 ), new Vector3( 0, 1, 0 ), 20, 0.5 ) ).toBe( false );

	} );

	it( '半径を極小にすると rayIntersect と一致する', () => {

		const body = scene();
		const origin = new Vector3( 1.3, 5.2, 0 );
		const direction = new Vector3( 0.15, - 0.1, - 1 ).normalize();

		const swept = body.sphereCast( origin, direction, 40, 1e-7 );
		const ray = body.rayIntersect( new Ray( origin.clone(), direction.clone() ), 40 );

		expect( swept ).not.toBe( false );
		expect( ray ).not.toBe( false );
		expect( ( swept as any ).distance ).toBeCloseTo( ( ray as any ).distance, 5 );

	} );

	it( '半径が大きいほど手前で止まる', () => {

		const body = scene();
		const at = ( radius: number ) =>
			( body.sphereCast( new Vector3( 0, 5, 0 ), new Vector3( 0, 0, - 1 ), 20, radius ) as any ).distance;

		expect( at( 0.1 ) ).toBeGreaterThan( at( 0.5 ) );
		expect( at( 0.5 ) ).toBeGreaterThan( at( 1.5 ) );

	} );

} );

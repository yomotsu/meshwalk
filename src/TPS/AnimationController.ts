import { Mesh, AnimationMixer } from 'three';
import type { AnimationClip, AnimationAction } from 'three';

const TURN_DURATION = 200;
const TAU = 2 * Math.PI;
const modulo = ( n: number, d: number ) => ( ( n % d ) + d ) % d;
const getDeltaTurnAngle = ( current: number, target: number ) => {

	const a = modulo( ( current - target ), TAU );
	const b = modulo( ( target - current ), TAU );

	return a < b ? - a : b;

};

export type Motion = {
	[ name: string ]: AnimationAction;
}

export class AnimationController {

	mesh: Mesh;
	motion: Motion;
	mixer: AnimationMixer;
	currentMotionName: string;
	_targetRotY: number | null = null;

	constructor( mesh: Mesh, animations: AnimationClip[] ) {

		this.mesh   = mesh;
		this.motion = {};
		this.mixer  = new AnimationMixer( mesh );
		this.currentMotionName = '';

		for ( let i = 0, l = animations.length; i < l; i ++ ) {

			const anim = animations[ i ];
			this.motion[ anim.name ] = this.mixer.clipAction( anim );
			this.motion[ anim.name ].setEffectiveWeight( 1 );

		}

	}

	play( name: string ) {

		if ( this.currentMotionName === name ) return;

		if ( this.motion[ this.currentMotionName ] ) {

			const from = this.motion[ this.currentMotionName ].play();
			const to   = this.motion[ name ].play();

			from.enabled = true;
			to.enabled = true;

			from.crossFadeTo( to, .3, false );

		} else {

			this.motion[ name ].enabled = true;
			this.motion[ name ].play();

		}

		this.currentMotionName = name;

	}

	turn( rad: number, immediate: boolean ) {

		const that       = this;
		const prevRotY   = this.mesh.rotation.y;
		const targetRotY = rad;
		const deltaY     = getDeltaTurnAngle( prevRotY, targetRotY );
		// const duration   = Math.abs( deltaY ) * 100;
		const start      = Date.now();
		const end        = start + TURN_DURATION;

		let progress   = 0;

		if ( immediate ) {

			this.mesh.rotation.y = targetRotY;
			return;

		}

		if ( this._targetRotY === targetRotY ) return;

		this._targetRotY = targetRotY;

		{

			let _targetRotY = targetRotY;

			( function interval() {

				const now = Date.now();
				const isAborted = _targetRotY !== that._targetRotY;

				if ( isAborted ) return;

				if ( now >= end ) {

					that.mesh.rotation.y = _targetRotY;
					that._targetRotY = null;
					return;

				}

				requestAnimationFrame( interval );
				progress = ( now - start ) / TURN_DURATION;
				that.mesh.rotation.y = prevRotY + deltaY * progress;

			} )();

		}

	}

	update( deltaTime: number ) {

		this.mixer.update( deltaTime );

	}

}

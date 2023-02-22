import { THREE } from '../install.js';

const TURN_DURATION = 200;
const TAU = 2 * Math.PI;
const modulo = ( n, d ) => ( ( n % d ) + d ) % d;
const getDeltaTurnAngle = ( current, target ) => {

	const a = modulo( ( current - target ), TAU );
	const b = modulo( ( target - current ), TAU );

	return a < b ? - a : b;

};

export class AnimationController {

	constructor( mesh ) {

		this.mesh   = mesh;
		this.motion = {};
		this.mixer  = new THREE.AnimationMixer( mesh );
		this.currentMotionName = '';

		for ( let i = 0, l = this.mesh.geometry.animations.length; i < l; i ++ ) {

			const anim = this.mesh.geometry.animations[ i ];
			this.motion[ anim.name ] = this.mixer.clipAction( anim );
			this.motion[ anim.name ].setEffectiveWeight( 1 );

		}

	}

	play( name ) {

		if ( this.currentMotionName === name ) return;

		if ( this.motion[ this.currentMotionName ] ) {

			const from = this.motion[ this.currentMotionName ].play();
			const to   = this.motion[ name ].play();

			from.enabled = true;
			to.enabled = true;

			from.crossFadeTo( to, .3 );

		} else {

			this.motion[ name ].enabled = true;
			this.motion[ name ].play();

		}

		this.currentMotionName = name;

	}

	turn( rad, immediate ) {

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
					delete that._targetRotY;
					return;

				}

				requestAnimationFrame( interval );
				progress = ( now - start ) / TURN_DURATION;
				that.mesh.rotation.y = prevRotY + deltaY * progress;

			} )();

		}

	}

	update( delta ) {

		this.mixer.update( delta );

	}

}

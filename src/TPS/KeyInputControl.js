import EventDispatcher from '../core/EventDispatcher.js';

const KEY_W     = 87;
const KEY_UP    = 38;
const KEY_S     = 83;
const KEY_DOWN  = 40;
const KEY_A     = 65;
const KEY_LEFT  = 37;
const KEY_D     = 68;
const KEY_RIGHT = 39;
const KEY_SPACE = 32;

const DEG2RAD = Math.PI / 180;
const DEG_0   =   0 * DEG2RAD;
const DEG_45  =  45 * DEG2RAD;
const DEG_90  =  90 * DEG2RAD;
const DEG_135 = 135 * DEG2RAD;
const DEG_180 = 180 * DEG2RAD;
const DEG_225 = 225 * DEG2RAD;
const DEG_270 = 270 * DEG2RAD;
const DEG_315 = 315 * DEG2RAD;
const DEG_360 = 360 * DEG2RAD;

export class KeyInputControl extends EventDispatcher {

	constructor() {

		super();

		this.isDisabled = false;

		this.isUp    = false;
		this.isDown  = false;
		this.isLeft  = false;
		this.isRight = false;
		this.isMoveKeyHolded = false;
		this.frontAngle = 0;

		this._keydownListener = onkeydown.bind( this );
		this._keyupListener   = onkeyup.bind( this );
		this._blurListener    = onblur.bind( this );

		window.addEventListener( 'keydown', this._keydownListener );
		window.addEventListener( 'keyup',   this._keyupListener   );
		window.addEventListener( 'blur',    this._blurListener    );

	}

	jump() {

		this.dispatchEvent( { type: 'jumpkeypress' } );

	}

	updateAngle() {

		var up    = this.isUp;
		var down  = this.isDown;
		var left  = this.isLeft;
		var right = this.isRight;

		if      (   up && ! left && ! down && ! right ) this.frontAngle = DEG_0;
		else if (   up &&   left && ! down && ! right ) this.frontAngle = DEG_45;
		else if ( ! up &&   left && ! down && ! right ) this.frontAngle = DEG_90;
		else if ( ! up &&   left &&   down && ! right ) this.frontAngle = DEG_135;
		else if ( ! up && ! left &&   down && ! right ) this.frontAngle = DEG_180;
		else if ( ! up && ! left &&   down &&   right ) this.frontAngle = DEG_225;
		else if ( ! up && ! left && ! down &&   right ) this.frontAngle = DEG_270;
		else if (   up && ! left && ! down &&   right ) this.frontAngle = DEG_315;

	}

}

function onkeydown( event ) {

	if ( this.isDisabled ) return;

	switch ( event.keyCode ) {

		case KEY_W :
		case KEY_UP :
			this.isUp = true;
			break;

		case KEY_S :
		case KEY_DOWN :
			this.isDown = true;
			break;

		case KEY_A :
		case KEY_LEFT :
			this.isLeft = true;
			break;

		case KEY_D :
		case KEY_RIGHT :
			this.isRight = true;
			break;

		case KEY_SPACE :
			this.jump();
			break;

		default:
			return;

	}

	var prevAngle = this.frontAngle;

	this.updateAngle();

	if ( prevAngle !== this.frontAngle ) {

		this.dispatchEvent( { type: 'movekeychange' } );

	}

	if (
		( this.isUp || this.isDown || this.isLeft || this.isRight ) &&
		! this.isMoveKeyHolded
	) {

		this.isMoveKeyHolded = true;
		this.dispatchEvent( { type: 'movekeyon' } );

	}

}

function onkeyup( event ) {

	if ( this.isDisabled ) return;

	switch ( event.keyCode ) {

		case KEY_W :
		case KEY_UP :
			this.isUp = false;
			break;

		case KEY_S :
		case KEY_DOWN :
			this.isDown = false;
			break;

		case KEY_A :
		case KEY_LEFT :
			this.isLeft = false;
			break;

		case KEY_D :
		case KEY_RIGHT :
			this.isRight = false;
			break;

		case KEY_SPACE :
			break;

		default:
			return;

	}

	var prevAngle = this.frontAngle;

	this.updateAngle();

	if ( prevAngle !== this.frontAngle ) {

		this.dispatchEvent( { type: 'movekeychange' } );

	}

	if ( ! this.isUp && ! this.isDown && ! this.isLeft && ! this.isRight &&
		(
			   event.keyCode === KEY_W
			|| event.keyCode === KEY_UP
			|| event.keyCode === KEY_S
			|| event.keyCode === KEY_DOWN
			|| event.keyCode === KEY_A
			|| event.keyCode === KEY_LEFT
			|| event.keyCode === KEY_D
			|| event.keyCode === KEY_RIGHT
		)
	) {

		this.isMoveKeyHolded = false;
		this.dispatchEvent( { type: 'movekeyoff' } );

	}

}

function onblur() {

	this.isUp    = false;
	this.isDown  = false;
	this.isLeft  = false;
	this.isRight = false;

	if ( this.isMoveKeyHolded ) {

		this.isMoveKeyHolded = false;
		this.dispatchEvent( { type: 'movekeyoff' } );

	}

}

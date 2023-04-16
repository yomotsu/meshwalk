import { EventDispatcher } from '../core/EventDispatcher';

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

export class KeyInputControl extends EventDispatcher {

	private isDisabled = false;

	private isUp    = false;
	private isDown  = false;
	private isLeft  = false;
	private isRight = false;
	private isMoveKeyHolding = false;
	private frontAngle = 0;

	private _keydownListener: ( event: KeyboardEvent ) => void;
	private _keyupListener: ( event: KeyboardEvent ) => void;
	private _blurListener: () => void;

	constructor() {

		super();

		this._keydownListener = ( event: KeyboardEvent ) => {

			if ( this.isDisabled ) return;
			if ( isInputEvent( event ) ) return;

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

			const prevAngle = this.frontAngle;

			this.updateAngle();

			if ( prevAngle !== this.frontAngle ) {

				this.dispatchEvent( { type: 'movekeychange' } );

			}

			if (
				( this.isUp || this.isDown || this.isLeft || this.isRight ) &&
				! this.isMoveKeyHolding
			) {

				this.isMoveKeyHolding = true;
				this.dispatchEvent( { type: 'movekeyon' } );

			}

		};

		this._keyupListener = ( event: KeyboardEvent ) => {

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

			const prevAngle = this.frontAngle;

			this.updateAngle();

			if ( prevAngle !== this.frontAngle ) {

				this.dispatchEvent( { type: 'movekeychange' } );

			}

			if ( ! this.isUp && ! this.isDown && ! this.isLeft && ! this.isRight &&
				(
					event.keyCode === KEY_W    ||
					event.keyCode === KEY_UP   ||
					event.keyCode === KEY_S    ||
					event.keyCode === KEY_DOWN ||
					event.keyCode === KEY_A    ||
					event.keyCode === KEY_LEFT ||
					event.keyCode === KEY_D    ||
					event.keyCode === KEY_RIGHT
				)
			) {

				this.isMoveKeyHolding = false;
				this.dispatchEvent( { type: 'movekeyoff' } );

			}

		};

		this._blurListener = () => {

			this.isUp    = false;
			this.isDown  = false;
			this.isLeft  = false;
			this.isRight = false;

			if ( this.isMoveKeyHolding ) {

				this.isMoveKeyHolding = false;
				this.dispatchEvent( { type: 'movekeyoff' } );

			}

		};

		function isInputEvent( event: KeyboardEvent ) {

			const target = event.target;

			if ( ! ( target instanceof HTMLElement ) ) return false;

			return (
				target.tagName === 'INPUT' ||
				target.tagName === 'SELECT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable
			);

		}


		window.addEventListener( 'keydown', this._keydownListener );
		window.addEventListener( 'keyup',   this._keyupListener );
		window.addEventListener( 'blur',    this._blurListener );
		window.addEventListener( 'contextmenu', this._blurListener );

	}

	jump() {

		this.dispatchEvent( { type: 'jumpkeypress' } );

	}

	updateAngle() {

		const up    = this.isUp;
		const down  = this.isDown;
		const left  = this.isLeft;
		const right = this.isRight;

		if      (   up && ! left && ! down && ! right ) this.frontAngle = DEG_0;
		else if (   up &&   left && ! down && ! right ) this.frontAngle = DEG_45;
		else if ( ! up &&   left && ! down && ! right ) this.frontAngle = DEG_90;
		else if ( ! up &&   left &&   down && ! right ) this.frontAngle = DEG_135;
		else if ( ! up && ! left &&   down && ! right ) this.frontAngle = DEG_180;
		else if ( ! up && ! left &&   down &&   right ) this.frontAngle = DEG_225;
		else if ( ! up && ! left && ! down &&   right ) this.frontAngle = DEG_270;
		else if (   up && ! left && ! down &&   right ) this.frontAngle = DEG_315;

	}

	dispose() {

		window.removeEventListener( 'keydown', this._keydownListener );
		window.removeEventListener( 'keyup',   this._keyupListener );
		window.removeEventListener( 'blur',    this._blurListener );
		this._blurListener();

	}

}


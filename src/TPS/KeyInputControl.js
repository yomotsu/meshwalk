// @author yomotsu
// MIT License

;( function ( ns ) {

var KEY_W     = 87,
    KEY_UP    = 38,
    KEY_S     = 83,
    KEY_DOWN  = 40,
    KEY_A     = 65,
    KEY_LEFT  = 37,
    KEY_D     = 68,
    KEY_RIGHT = 39,
    KEY_SPACE = 32;


  ns.KeyInputControl = function () {
    
    THREE.EventDispatcher.prototype.apply( this );
    this.mouseAccelarationX = 100;
    this.mouseAccelarationY = 20;
    this.isDisabled = false;

    this.isUp = false;
    this.isDown = false;
    this.isLeft = false;
    this.isRight = false;
    this.frontAngle = 0;

    this._mousedownListener = onkeydown.bind( this );
    this._mouseupListener   = onkeyup.bind( this );

    window.addEventListener( 'keydown', this._mousedownListener, false );
    window.addEventListener( 'keyup',   this._mouseupListener,   false );

  }

  ns.KeyInputControl.prototype.jump = function () {

    this.dispatchEvent( { type: 'jumpkeypress' } );

  };

  ns.KeyInputControl.prototype.updateAngle = function () {

    var up    = this.isUp;
    var down  = this.isDown;
    var left  = this.isLeft;
    var right = this.isRight;

    if (  up && !left && !down && !right ) { this.frontAngle =   0; }
    else if (  up &&  left && !down && !right ) { this.frontAngle =  45; }
    else if ( !up &&  left && !down && !right ) { this.frontAngle =  90; }
    else if ( !up &&  left &&  down && !right ) { this.frontAngle = 135; }
    else if ( !up && !left &&  down && !right ) { this.frontAngle = 180; }
    else if ( !up && !left &&  down &&  right ) { this.frontAngle = 225; }
    else if ( !up && !left && !down &&  right ) { this.frontAngle = 270; }
    else if (  up && !left && !down &&  right ) { this.frontAngle = 315; }

  };

  
  ns.KeyInputControl.prototype.getFrontAngle = function () {

    return this.frontAngle;

  };



  function onkeydown ( e ) {

    if ( this.isDisabled ) { return; }

    switch ( e.keyCode ) {

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

    }

    this.updateAngle();

    if ( this.isUp || this.isDown || this.isLeft || this.isRight ) {

      this.isMoveKeyHolded = true;
      this.dispatchEvent( { type: 'movekeyhold' } );

    }

  }

  function onkeyup ( e ) {

    if ( this.isDisabled ) { return; }

    switch ( e.keyCode ) {

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

    }

    this.updateAngle();

    if ( !this.isUp && !this.isDown && !this.isLeft && !this.isRight &&
      (
           e.keyCode === KEY_W
        || e.keyCode === KEY_UP
        || e.keyCode === KEY_S
        || e.keyCode === KEY_DOWN
        || e.keyCode === KEY_A
        || e.keyCode === KEY_LEFT
        || e.keyCode === KEY_D
        || e.keyCode === KEY_RIGHT
      )
    ) {

      this.dispatchEvent( { type: 'movekeyrelease' } );

    }

  }

} )( THREEFIELD );

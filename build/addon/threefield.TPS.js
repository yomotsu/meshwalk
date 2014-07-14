// @author yomotsu
// MIT License

THREEFIELD.CharacterController = function ( object3d, radius, world ) {

  THREE.EventDispatcher.prototype.apply( this );
  this.object = object3d;
  this.position = new THREE.Vector3().copy( this.object.position );
  this.radius = radius;
  this.world = world;
  this.maxSlopeGradient = Math.cos( THREE.Math.degToRad( 50 ) );
  this.isIdling   = false;
  this.isGrounded = false;
  this.isOnSlope  = false;
  this.isWalking  = false;
  this.isJumping  = false;
  this.frontAngle = 0; // 0 to 360 deg
  this.movementSpeed = 15;
  this.velocity = new THREE.Vector3( 0, -10, 0 );
  this.currentJumpPower = 0;
  this.groundPadding = 1;
  this.groundHeight = 0;
  this.groundNormal = new THREE.Vector3();
  this.contactInfo = [];
  this._previouseMosion = {
    isGounded: null,
    isSlope  : null,
    isWalking: null,
    isJumping: null
  };
  world.addCharacter( this );

};

THREEFIELD.CharacterController.prototype.update = function ( dt ) {

  this._updateVelocity();
  this._updateGrounding();
  this._updatePosition( dt );
  this._eventEmitter();
  this._previouseMosion = {
    isGrounded: this.isGrounded,
    isSlope  : this.isOnSlope,
    isWalking: this.isWalking,
    isJumping: this.isJumping,
  };

};

THREEFIELD.CharacterController.prototype._eventEmitter = function () {


  if ( !this._previouseMosion.isWalking && !this.isWalking && this.isGrounded && !this.isIdling ) {

    this.isIdling = true;
    this.dispatchEvent( { type: 'startIdling' } );

  } else if (
    ( !this._previouseMosion.isWalking && this.isWalking && !this.isJumping ) ||
    ( !this._previouseMosion.isGrounded && this.isGrounded && this.isWalking ) ||
    ( this._previouseMosion.isSlope && !this.isOnSlope && this.isWalking )
  ) {

    this.isIdling = false;
    this.dispatchEvent( { type: 'startWalking' } );

  } else if ( !this._previouseMosion.isJumping && this.isJumping ) {

    this.isIdling = false;
    this.dispatchEvent( { type: 'startJumping' } );

  }

  if ( !this._previouseMosion.isGrounded && this.isGrounded ) {

    this.dispatchEvent( { type: 'endJumping' } );

  }

};

THREEFIELD.CharacterController.prototype._updateVelocity = function () {

  var FALL_VELOCITY = -20,
      frontDierction = -Math.cos( THREE.Math.degToRad( this.frontAngle ) ),
      rightDierction = -Math.sin( THREE.Math.degToRad( this.frontAngle ) ),
      normal,
      distance,
      wallNomal2D,
      direction2D,
      wallAngle,
      frontAngle,
      frontAngleInverted,
      baseY,
      i, l;
      
  this.velocity.x = rightDierction * this.movementSpeed * this.isWalking;
  this.velocity.y = FALL_VELOCITY;
  this.velocity.z = frontDierction * this.movementSpeed * this.isWalking;

  if ( this.contactInfo.length === 0 && !this.isJumping ) {

    // free falling, aside of jumping
    return;

  }

  if ( this.isGrounded && !this.isOnSlope && !this.isJumping ) {

    this.velocity.y = 0;

  } else if ( this.isGrounded && this.isOnSlope && !this.isJumping ) {

    this.velocity.x = this.groundNormal.x * this.movementSpeed;
    this.velocity.y = 1 - this.groundNormal.y;
    this.velocity.z = this.groundNormal.z * this.movementSpeed;

  } else if ( !this.isGrounded && !this.isOnSlope && this.isJumping ) {

    this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;

  }

  // vs walls and sliding on the wall
  direction2D = new THREE.Vector2( rightDierction, frontDierction );
  frontAngle = Math.atan2( direction2D.y, direction2D.x );
  frontAngleInverted = Math.atan2( -direction2D.y, -direction2D.x );

  for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

    normal = this.contactInfo[ i ].normal;
    distance = this.contactInfo[ i ].distance;

    // if ( normal.y <= -1 || this.maxSlopeGradient < normal.y ) {
    if ( this.maxSlopeGradient < normal.y || this.isOnSlope) {

      // this triangle is a ground or slope, not a wall or ceil
      continue;

    }

    wallNomal2D = new THREE.Vector2( normal.x, normal.z ).normalize();
    wallAngle = Math.atan2( wallNomal2D.y, wallNomal2D.x );

    if (
      Math.abs( frontAngleInverted - wallAngle ) >= Math.PI * 0.5 && //  90deg
      Math.abs( frontAngleInverted - wallAngle ) <= Math.PI * 1.5    // 270deg
    ) {

      continue;

    }

    wallNomal2D.set(
      direction2D.dot( wallNomal2D ) * wallNomal2D.x,
      direction2D.dot( wallNomal2D ) * wallNomal2D.y
    );
    direction2D.subVectors( direction2D, wallNomal2D );

    this.velocity.x = direction2D.x * this.movementSpeed * this.isWalking;
    this.velocity.z = direction2D.y * this.movementSpeed * this.isWalking;

    // TODO: updatePositionと被っているから結果がおかしくなるかも
    if ( distance < -this.radius / 2 && this.isGrounded ) {

      // pulling back from inside of the wall
      baseY = normal.y * distance / Math.tan( ( 1 - normal.y ) * Math.PI / 2 );
      this.position.x -= normal.x * distance - normal.x * baseY;
      this.position.z -= normal.z * distance - normal.z * baseY;

    } else if ( distance < 0 && !this.isGrounded ) {

      // pulling back from inside of the ceil
      this.position.x -= normal.x * distance;
      this.position.y -= normal.y * distance;
      this.position.z -= normal.z * distance;

    }

  }

};


THREEFIELD.CharacterController.prototype._updateGrounding = function () {

  var groundPadding,
      origin,
      raycaster,
      objects,
      intersects,
      i, l;

  this.isOnSlope = false;

  if ( ( 0 < this.currentJumpPower ) && this.isJumping ) {

    groundPadding = -this.radius;

  } else {

    groundPadding = this.groundPadding;

  }

  origin = new THREE.Vector3(
    this.position.x,
    this.position.y + this.radius,
    this.position.z
  );

  raycaster = new THREE.Raycaster(
    origin,                         // origin
    new THREE.Vector3( 0, -1, 0 ),  // direction
    0,                              // near
    this.radius * 2 + groundPadding // far
  );
  objects = [];

  for ( i = 0, l = this.world.colliders.length; i < l; i ++ ) {
    //あとで最適化する
    objects.push( this.world.colliders[ i ].mesh );

  }

  intersects = raycaster.intersectObjects( objects );

  if ( intersects.length === 0 ) {

    this.isGrounded = false;
    this.groundNormal.set( 0, 0, 0 );
    return;

  }

  this.isGrounded = true;
  this.isJumping = false;
  this.groundHeight = intersects[ 0 ].point.y;
  this.groundNormal.copy( intersects[ 0 ].face.normal );

  if ( intersects[ 0 ].face.normal.y <= this.maxSlopeGradient ) {

    this.isOnSlope = true;

  }

};

THREEFIELD.CharacterController.prototype._updatePosition = function ( dt ) {

  var x = this.position.x + this.velocity.x * dt,
      y = this.position.y + this.velocity.y * dt,
      z = this.position.z + this.velocity.z * dt;

  if ( this.isGrounded ) {

    y = this.groundHeight + this.radius;

  }

  this.position.set( x, y, z );
  this.object.position.copy( this.position );

};

THREEFIELD.CharacterController.prototype.jump = function () {

  if ( this.isJumping || this.isOnSlope ) {

    return;

  }

  this.isJumping = true;

  var that = this;
  var jumpStartTime = Date.now();
  var jumpMaxDuration = 1000;

  ( function jump () {

    var elapsedTime = Date.now() - jumpStartTime;
    var progress = elapsedTime / jumpMaxDuration;

    if ( elapsedTime < jumpMaxDuration ){

      that.currentJumpPower = Math.cos( Math.min( progress, 1 ) * Math.PI );
      requestAnimationFrame( jump );

    }

  } )();

};

// @author yomotsu
// MIT License


THREEFIELD.AnimationController = function ( mesh, actions ) {

  this.mesh = mesh;
  this.action = {};
  var i, l, anim;

  for ( i = 0, l = this.mesh.geometry.animations.length; i < l; i ++ ) {

    anim = this.mesh.geometry.animations[ i ];

    THREE.AnimationHandler.add( anim );

    this.action[ anim.name ] = {

      anim: new THREE.Animation(
        mesh,
        anim.name,
        THREE.AnimationHandler.CATMULLROM
      ),

      duration: anim.length * 1000

    };

  }

};

THREEFIELD.AnimationController.prototype.play = function ( name ) {

  var i;

  for ( i in this.action ) {

    this.action[ i ].anim.stop();

  }

  this.action[ name ].anim.play();

};

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

// @author yomotsu
// MIT License

;( function ( ns ) {

  var vec3 = new THREE.Vector3();

  // camera              isntance of THREE.Camera
  // trackObject         isntance of THREE.Object3D
  // params.el           DOM element
  // params.radius       number
  // params.minRadius    number
  // params.maxRadius    number
  // params.rigidObjects array of inctances of THREE.Mesh
  ns.GyroscopeCameraControl = function ( camera, trackObject, params ) {

    THREE.EventDispatcher.prototype.apply( this );
    this.camera = camera;
    this.trackObject  = trackObject;
    this.el           = params && params.el || window;
    this.offset       = params && params.offset || new THREE.Vector3( 0, 0, 0 ),
    this.radius       = params && params.radius    || 10;
    this.minRadius    = params && params.minRadius || 1;
    this.maxRadius    = params && params.maxRadius || 30;
    this.rigidObjects = params && params.rigidObjects || [];
    this.lat = 0;
    this.lon = 0;
    this._phi;   // angle of zenith
    this._theta; // angle of azimuth
    this.mouseAccelerationX = params && params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
    this.mouseAccelerationY = params && params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
    this._pointerStart = { x: 0, y: 0 };
    this._pointerLast  = { x: 0, y: 0 };

    this.camera.position.set(
      this.trackObject.position.x + this.offset.x,
      this.trackObject.position.y + this.offset.y,
      this.trackObject.position.z + this.offset.z + 1
    );
    this.update();

    this._mousedownListener = onmousedown.bind( this );
    this._mouseupListener   = onmouseup.bind( this );
    this._mousedragListener = onmousedrag.bind( this )
    this._scrollListener    = onscroll.bind( this );

    this.el.addEventListener( 'mousedown', this._mousedownListener, false );
    this.el.addEventListener( 'mouseup',   this._mouseupListener,   false );
    this.el.addEventListener( 'mousewheel',     this._scrollListener, false );
    this.el.addEventListener( 'DOMMouseScroll', this._scrollListener, false );
    
  }

  ns.GyroscopeCameraControl.prototype.update = function () {

    this.lat = this.lat >  90 ?  90 :
               this.lat < -90 ? -90 :
               this.lat;
    this.lon = this.lon < 0 ? 360 + this.lon % 360 : this.lon % 360;
    this._phi   =  THREE.Math.degToRad( this.lat );
    this._theta = -THREE.Math.degToRad( this.lon - 90 );

    this._center = new THREE.Vector3(
      this.trackObject.matrixWorld.elements[ 12 ] + this.offset.x,
      this.trackObject.matrixWorld.elements[ 13 ] + this.offset.y,
      this.trackObject.matrixWorld.elements[ 14 ] + this.offset.z
    );
    var distance = collisionTest( this );
    var position = new THREE.Vector3( 
      Math.cos( this._phi ) * Math.cos( this._theta ), 
      Math.sin( this._phi ), 
      Math.cos( this._phi ) * Math.sin( this._theta )
    ).multiplyScalar( distance );
    position = vec3.addVectors( position, this._center );
    this.camera.position.copy( position );

    if ( this.lat === 90 ) {

      this.camera.up.set(
        Math.cos( this._theta + THREE.Math.degToRad( 180 ) ),
        0,
        Math.sin( this._theta + THREE.Math.degToRad( 180 ) )
      );

    } else if ( this.lat === -90 ) {

      this.camera.up.set(
        Math.cos( this._theta ),
        0,
        Math.sin( this._theta )
      );

    } else {

      this.camera.up.set( 0, 1, 0 );

    }
    this.camera.lookAt( this._center );
    this.dispatchEvent( { type: 'updated' } );

  }

  ns.GyroscopeCameraControl.prototype.getFrontAngle = function () {

    return 360 - this.lon;

  }

  function collisionTest ( instance ) {

    if ( instance.rigidObjects.length === 0 ) {

      return instance.radius;

    }

    var direction = new THREE.Vector3(
      instance.camera.position.x - instance._center.x,
      instance.camera.position.y - instance._center.y,
      instance.camera.position.z - instance._center.z
    ).normalize();
    var raycaster = new THREE.Raycaster(
      instance._center,    // origin
      direction,          // direction
      instance.minRadius, // near
      instance.radius     // far
    );
    var intersects = raycaster.intersectObjects( instance.rigidObjects );

    if ( intersects.length >= 1 ){

      return intersects[ 0 ].distance;

    } else {

      return instance.radius
    }

  };

  function onmousedown ( event ) {

    this.dispatchEvent( { type: 'mousedown' } );
    this._pointerStart.x = event.clientX;
    this._pointerStart.y = event.clientY;
    this._pointerLast.x = this.lon;
    this._pointerLast.y = this.lat;
    this.el.removeEventListener( 'mousemove', this._mousedragListener, false );
    this.el.addEventListener( 'mousemove', this._mousedragListener, false );

  }

  function onmouseup () {

    this.dispatchEvent( { type: 'mouseup' } );
    this.el.removeEventListener( 'mousemove', this._mousedragListener, false );

  }

  function onmousedrag ( event ) {

    var w = this.el.offsetWidth;
    var h = this.el.offsetHeight;
    var x = ( this._pointerStart.x - event.clientX ) / w * 2;
    var y = ( this._pointerStart.y - event.clientY ) / h * 2;
    this.lon = this._pointerLast.x + x * this.mouseAccelerationX;
    this.lat = this._pointerLast.y + y * this.mouseAccelerationY;
    // this.update();

  }

  function onscroll ( event ) {

    event.preventDefault();
    // WebKit
    if ( event.wheelDeltaY ) {
      this.radius -= event.wheelDeltaY * 0.05 / 5;
    // IE
    } else if ( event.wheelDelta ) {
      this.radius -= event.wheelDelta * 0.05 / 5;
    // Firefox
    } else if ( event.detail ) {
      this.radius += event.detail / 5;
    }
    this.radius = Math.max( this.radius, this.minRadius );
    this.radius = Math.min( this.radius, this.maxRadius );
    this.update();

  }

} )( THREEFIELD );

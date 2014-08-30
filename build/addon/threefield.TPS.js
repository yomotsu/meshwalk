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
      wallNomal2D,
      direction2D,
      wallAngle,
      frontAngle,
      frontAngleInverted,
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

    if ( this.maxSlopeGradient < normal.y || this.isOnSlope ) {

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

};

THREEFIELD.CharacterController.prototype.fixPosition = function () {


  var face,
      normal,
      distance,
      point1 = new THREE.Vector3(),
      point2 = new THREE.Vector3(),
      direction = new THREE.Vector3(),
      plainD,
      t,
      translateScoped = new THREE.Vector3(),
      translate = new THREE.Vector3(),
      i, l;
      
  if ( this.contactInfo.length === 0 && !this.isJumping ) {

    // free falling, aside of jumping
    this.object.position.copy( this.position );
    return;

  }

  // vs walls and sliding on the wall

  for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

    face = this.contactInfo[ i ].face;
    normal = this.contactInfo[ i ].normal;
    distance = this.contactInfo[ i ].distance;

    if ( this.maxSlopeGradient < normal.y || this.isOnSlope ) {

      // this triangle is a ground or slope, not a wall or ceil
      continue;

    }

    if ( distance < 0 && this.isGrounded ) {

      // resolve player vs wall collistion while on the ground
      point1.copy( normal ).multiplyScalar( -this.radius ).add( this.position );
      direction.set( normal.x, 0, normal.z ).normalize();
      plainD = face.a.dot( normal );
      t = ( plainD - ( normal.x * point1.x + normal.y * point1.y + normal.z * point1.z ) ) / ( normal.x * direction.x + normal.y * direction.y + normal.z * direction.z );
      point2.copy( direction ).multiplyScalar( t ).add( point1 );
      translateScoped.subVectors( point2, point1 );

      if ( Math.abs( translate.x ) > Math.abs( translateScoped.x ) ) {

        translate.x += translateScoped.x;

      }

      if ( Math.abs( translate.z ) > Math.abs( translateScoped.z ) ) {

        translate.z += translateScoped.z;

      }

    } else if ( distance < 0 && !this.isGrounded ) {

      // resolve player vs wall collistion while jumping
      translate.x += -normal.x * distance;
      translate.y += -normal.y * distance;
      translate.z += -normal.z * distance;

    }

  }

  this.position.add( translate );
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

  // camera              isntance of THREE.Camera
  // trackObject         isntance of THREE.Object3D
  // params.el           DOM element
  // params.radius       number
  // params.minRadius    number
  // params.maxRadius    number
  // params.rigidObjects array of inctances of THREE.Mesh
  ns.TPSCameraControl = function ( camera, trackObject, params ) {

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
    this.phi = 0;   // angle of zenith
    this.theta = 0; // angle of azimuth
    this.mouseAccelerationX = params && params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
    this.mouseAccelerationY = params && params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
    this._pointerStart = { x: 0, y: 0 };
    this._pointerLast  = { x: 0, y: 0 };

    this.setNearPlainCorners();
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

  ns.TPSCameraControl.prototype.update = function () {

    var position,
        distance;

    this._center = new THREE.Vector3(
      this.trackObject.matrixWorld.elements[ 12 ] + this.offset.x,
      this.trackObject.matrixWorld.elements[ 13 ] + this.offset.y,
      this.trackObject.matrixWorld.elements[ 14 ] + this.offset.z
    );
    position = new THREE.Vector3(
      Math.cos( this.phi ) * Math.cos( this.theta + Math.PI / 2 ), 
      Math.sin( this.phi ), 
      Math.cos( this.phi ) * Math.sin( this.theta + Math.PI / 2 )
    );
    distance = this.collisionTest( position.clone().normalize() );
    position.multiplyScalar( distance );
    position.add( this._center );
    this.camera.position.copy( position );

    if ( this.lat === 90 ) {

      this.camera.up.set(
        Math.cos( this.theta + Math.PI ),
        0,
        Math.sin( this.theta + Math.PI )
      );

    } else if ( this.lat === -90 ) {

      this.camera.up.set(
        Math.cos( this.theta ),
        0,
        Math.sin( this.theta )
      );

    } else {

      this.camera.up.set( 0, 1, 0 );

    }

    this.camera.lookAt( this._center );
    this.dispatchEvent( { type: 'updated' } );

  }

  ns.TPSCameraControl.prototype.getFrontAngle = function () {

    return 360 - this.lon;

  }

  ns.TPSCameraControl.prototype.setNearPlainCorners = function () {

    var near = this.camera.near,
        halfFov = this.camera.fov * 0.5,
        h = ( Math.tan( THREE.Math.degToRad( halfFov ) ) * near ),
        w = h * this.camera.aspect;

    this.nearPlainCorners = [
      new THREE.Vector3( -w, -h, 0 ),
      new THREE.Vector3(  w, -h, 0 ),
      new THREE.Vector3(  w,  h, 0 ),
      new THREE.Vector3( -w,  h, 0 )
    ];

  }

  ns.TPSCameraControl.prototype.setLatLon = function ( lat, lon ) {

    this.lat = lat >  90 ?  90 :
               lat < -90 ? -90 :
               lat;
    this.lon = lon < 0 ? 360 + lon % 360 : lon % 360;

    this.phi   =  THREE.Math.degToRad( this.lat );
    this.theta = -THREE.Math.degToRad( this.lon );

  }

  ns.TPSCameraControl.prototype.collisionTest = function ( direction ) {

    var i,
        distance = this.radius,
        nearPlainCorner,
        rotationMatrix = new THREE.Matrix4(),
        rotationX = new THREE.Matrix4().makeRotationX( this.phi ),
        rotationY = new THREE.Matrix4().makeRotationY( this.theta ),
        origin,
        raycaster,
        intersects;

    rotationMatrix.multiplyMatrices( rotationX, rotationY );

    for ( i = 0; i < 4; i ++ ) {

      nearPlainCorner = this.nearPlainCorners[ i ].clone();
      nearPlainCorner.applyMatrix4( rotationMatrix );

      origin = new THREE.Vector3(
        this._center.x + nearPlainCorner.x,
        this._center.y + nearPlainCorner.y,
        this._center.z + nearPlainCorner.z
      );
      raycaster = new THREE.Raycaster(
        origin,           // origin
        direction,        // direction
        this.camera.near, // near
        this.radius       // far
      );
      intersects = raycaster.intersectObjects( this.rigidObjects );

      if ( intersects.length !== 0 && intersects[ 0 ].distance < distance ) {

        distance = intersects[ 0 ].distance;

      }

    }

    return distance;

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

    var w = this.el.offsetWidth,
        h = this.el.offsetHeight,
        x = ( this._pointerStart.x - event.clientX ) / w * 2,
        y = ( this._pointerStart.y - event.clientY ) / h * 2;

    this.setLatLon(
      this._pointerLast.y + y * this.mouseAccelerationY,
      this._pointerLast.x + x * this.mouseAccelerationX
    );

  }

  function onscroll ( event ) {

    event.preventDefault();
    
    if ( event.wheelDeltaY ) {

      // WebKit
      this.radius -= event.wheelDeltaY * 0.05 / 5;
    
    } else if ( event.wheelDelta ) {

      // IE
      this.radius -= event.wheelDelta * 0.05 / 5;

    } else if ( event.detail ) {

      // Firefox
      this.radius += event.detail / 5;

    }

    this.radius = Math.max( this.radius, this.minRadius );
    this.radius = Math.min( this.radius, this.maxRadius );
    this.update();

  }

} )( THREEFIELD );

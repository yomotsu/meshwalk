/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */

var THREEFIELD = {};

// @author yomotsu
// MIT License

THREEFIELD.normalizeAngle = function ( angleInDeg ) {

  return ( angleInDeg >= 0 ) ? ( angleInDeg % 360 ) : ( angleInDeg  % 360 + 360 );

};


THREEFIELD.howCloseBetweenAngles = function ( angle1, angle2 ) {

  var angle = Math.min(
    THREEFIELD.normalizeAngle( angle1 - angle2 ),
    THREEFIELD.normalizeAngle( angle2 - angle1 )
  );
  
  return angle;

};

// @author yomotsu
// MIT License

THREEFIELD.World = function () {

  console.log( 'THREEFIELD.World' );

  this.colliders  = [];
  this.characters = [];

};

THREEFIELD.World.prototype.add = function ( collider ) {

  this.colliders.push( collider );

}

THREEFIELD.World.prototype.addCharacter = function ( character ) {

  this.characters.push( character );

}

THREEFIELD.World.prototype.step = function ( dt ) {

  var character,
      collider,
      isInAABB,
      contactInfo,
      hasAdded,
      contactPoint = new THREE.Vector3(),
      i, ii, iii, iiii, l, ll, lll, llll;

  for ( i = 0, l = this.characters.length; i < l; i ++ ) {

    character = this.characters[ i ];
    character.contactInfo.length = 0;

    for ( ii = 0, ll = this.colliders.length; ii < ll; ii ++ ) {

      collider = this.colliders[ ii ];
      isInAABB = THREEFIELD.World.sphereInAABB( character.object.position, character.radius, collider.aabb );
      
      if ( !isInAABB ) {

        continue;

      }

      for ( iii = 0, lll = collider.faces.length; iii < lll; iii ++ ) {

        contactInfo = THREEFIELD.World.sphereVsTriangle( collider.faces[ iii ], collider.normals[ iii ], character.object.position, character.radius );

        if ( !contactInfo ) {

          continue;

        }

        for ( iiii = 0, llll = character.contactInfo.length; iiii < llll; iiii ++ ) {

          if (
            character.contactInfo[ iiii ].normal.x === contactInfo.normal.x &&
            character.contactInfo[ iiii ].normal.y === contactInfo.normal.y &&
            character.contactInfo[ iiii ].normal.z === contactInfo.normal.z
          ) {

            hasAdded = true;
            break;

          }

        }

        if ( hasAdded ) {

          continue;

        }

        character.contactInfo.push( contactInfo );

      }

    }

    character.update( dt );

  }

};

THREEFIELD.World.sphereInAABB = function ( position, radius, aabb ) {
  // http://d.hatena.ne.jp/taiyakisun/20120205/1328410006
  // http://marupeke296.com/COL_3D_No11_AABBvsPoint.html
  // http://stackoverflow.com/questions/4578967/cube-sphere-intersection-test#answer-4579192
  var rr = Math.pow( radius, 2 ),
      dmin = 0,
      axis,
      axisKey = [ 'x', 'y', 'z' ],
      i;

  for ( i in axisKey ) {

    axis = axisKey[ i ];

    if( position[ axis ] < aabb.min[ axis ] ) {

      dmin += Math.pow( ( position[ axis ] - aabb.min[ axis ] ), 2 );

    } else if( position[ axis ] > aabb.max[ axis ] ) {

      dmin += Math.pow( ( position[ axis ] - aabb.max[ axis ] ), 2 );

    }

  }

  return dmin <= rr;

};

THREEFIELD.World.sphereVsTriangle = function ( face, normal, position, radius ) {
  // http://realtimecollisiondetection.net/blog/?p=103

  // var distance = THREEFIELD.World.getDistanceTriangleVsSphere( face, normal, position, radius );
  // vs plain of traiangle face
  var A = new THREE.Vector3(),
      B = new THREE.Vector3(),
      C = new THREE.Vector3(),
      rr,
      V = new THREE.Vector3(),
      d,
      e;

  A.subVectors( face.a, position );
  B.subVectors( face.b, position );
  C.subVectors( face.c, position );
  rr = radius * radius;
  V.crossVectors( B.clone().sub( A ), C.clone().sub( A ) );
  d = A.dot( V );
  e = V.dot( V );

  if ( d * d > rr * e ) {

    return false;

  }

  // vs triangle vertex
  var aa,
      ab,
      ac,
      bb,
      bc,
      cc;

  aa = A.dot( A );
  ab = A.dot( B );
  ac = A.dot( C );
  bb = B.dot( B );
  bc = B.dot( C );
  cc = C.dot( C );

  if (
    ( aa > rr ) & ( ab > aa ) & ( ac > aa ) ||
    ( bb > rr ) & ( ab > bb ) & ( bc > bb ) ||
    ( cc > rr ) & ( ac > cc ) & ( bc > cc )
  ) {

    return false;

  }

  // vs edge
  var AB = new THREE.Vector3(),
      BC = new THREE.Vector3(),
      CA = new THREE.Vector3(),
      d1,
      d2,
      d3,
      e1,
      e2,
      e3,
      Q1 = new THREE.Vector3(),
      Q2 = new THREE.Vector3(),
      Q3 = new THREE.Vector3(),
      QC = new THREE.Vector3(),
      QA = new THREE.Vector3(),
      QB = new THREE.Vector3();

  AB.subVectors( B, A );
  BC.subVectors( C, B );
  CA.subVectors( A, C );
  d1 = ab - aa;
  d2 = bc - bb;
  d3 = ac - cc;
  e1 = AB.dot( AB );
  e2 = BC.dot( BC );
  e3 = CA.dot( CA );
  Q1.subVectors( A.multiplyScalar( e1 ), AB.multiplyScalar( d1 ) );
  Q2.subVectors( B.multiplyScalar( e2 ), BC.multiplyScalar( d2 ) );
  Q3.subVectors( C.multiplyScalar( e3 ), CA.multiplyScalar( d3 ) );
  QC.subVectors( C.multiplyScalar( e1 ), Q1 );
  QA.subVectors( A.multiplyScalar( e2 ), Q2 );
  QB.subVectors( B.multiplyScalar( e3 ), Q3 );

  if (
    ( Q1.dot( Q1 ) > rr * e1 * e1 ) && ( Q1.dot( QC ) > 0 ) ||
    ( Q2.dot( Q2 ) > rr * e2 * e2 ) && ( Q2.dot( QA ) > 0 ) ||
    ( Q3.dot( Q3 ) > rr * e3 * e3 ) && ( Q3.dot( QB ) > 0 )
  ) {

    return false;

  }

  var distance = Math.sqrt( d * d / e ) - radius,
      contactPoint = THREEFIELD.World.getContactPoint( normal, position, distance );

  return {
    plainD      : d,
    face        : face,
    normal      : normal,
    distance    : distance,
    contactPoint: contactPoint
  };

};

THREEFIELD.World.getContactPoint = function ( normal, position, distance ) {

  var contactPoint = new THREE.Vector3(),
      inversedNormal = new THREE.Vector3( -normal.x, -normal.y, -normal.z );

  contactPoint.copy( position ).add( inversedNormal.multiplyScalar( distance ) );
  return contactPoint;

}

// @author yomotsu
// MIT License

THREEFIELD.Collider = function ( threeMesh ) {

  var geometry,
      i, l;

  this.mesh = threeMesh;
  this.faces   = [];
  this.normals = [];
  this.aabb    = null;

  // http://stackoverflow.com/questions/23990354/how-to-update-vertices-geometry-after-rotate-or-move-object#answer-24001626
  threeMesh.updateMatrix(); 
  threeMesh.geometry.applyMatrix( threeMesh.matrix );
  threeMesh.matrix.identity();
  threeMesh.position.set( 0, 0, 0 );
  threeMesh.rotation.set( 0, 0, 0 );
  threeMesh.scale.set( 1, 1, 1 );
  threeMesh.geometry.verticesNeedUpdate = true;
  threeMesh.updateMatrixWorld();
  threeMesh.geometry.computeFaceNormals();
  threeMesh.geometry.computeVertexNormals();
  threeMesh.geometry.computeBoundingBox();

  this.aabb = threeMesh.geometry.boundingBox;
  geometry = this.mesh.geometry;

  for ( i = 0, l = geometry.faces.length; i < l; i ++ ) {

    if ( geometry.faces[ i ].d ) {

      console.log( 'still not supported' );

    }

    var a = geometry.vertices[ geometry.faces[ i ].a ];
    var b = geometry.vertices[ geometry.faces[ i ].b ];
    var c = geometry.vertices[ geometry.faces[ i ].c ];

    this.faces.push( { a: a, b: b, c: c } );
    this.normals.push( geometry.faces[ i ].normal );

  }

};

// @author yomotsu
// MIT License

THREEFIELD.CharacterController = function ( object3d, radius, world ) {

  THREE.EventDispatcher.prototype.apply( this );
  this.object = object3d;
  this.radius = radius;
  this.world = world;
  this.maxSlopeGradient = Math.cos( THREE.Math.degToRad( 50 ) );
  this.isIdling   = false;
  this.isGrounded = false;
  this.isOnSlope = false;
  this.isWalking = false;
  this.isJumping = false;
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

// THREEFIELD.CharacterController.prototype.getGroundHeight = function ( face, normal ) {
//   // http://marupeke296.com/COL_3D_No8_HightOfFloor.html
//   var a = face.a;
//   var n = normal;
//   var o = this.object.position;
//   return a.y - ( n.x * ( o.x - a.x ) + n.z * ( o.z - a.z ) ) / n.y;

// }

THREEFIELD.CharacterController.prototype.update = function ( dt ) {

  this._updateGrounding();
  this._updateVelocity();
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
      newPosition = new THREE.Vector3(),
      wallNomal2D,
      frontVelocity2D,
      wallAngle,
      frontAngle,
      frontAngleInverted,
      vsWallAngle,
      i, l;
      
  this.velocity.x = rightDierction * this.movementSpeed * this.isWalking;
  this.velocity.y = FALL_VELOCITY;
  this.velocity.z = frontDierction * this.movementSpeed * this.isWalking;

  if ( this.contactInfo.length === 0 && !this.isJumping ) {

    // 自由落下中 (ジャンプ中とは別)
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
  frontVelocity2D = new THREE.Vector2(  this.velocity.x, this.velocity.z );
  frontAngle = Math.atan2( frontVelocity2D.y, frontVelocity2D.x ) * 180 / Math.PI;
  frontAngle = THREEFIELD.normalizeAngle( frontAngle );
  frontAngleInverted = Math.atan2( -frontVelocity2D.y, -frontVelocity2D.x ) * 180 / Math.PI;
  frontAngleInverted = THREEFIELD.normalizeAngle( frontAngleInverted );

  for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

    normal = this.contactInfo[ i ].normal;

    if ( normal.y <= -1 || this.maxSlopeGradient < normal.y ) {

      // this triangle is a ground or ceil, not a wall
      continue;

    }

    // if ( this.contactInfo[ i ].distance < -0.01 ) {

    //   // pulling back to out of collider
    //   newPosition.set( this.velocity.x, this.velocity.y, this.velocity.z ).normalize();
    //   newPosition.multiplyScalar( this.contactInfo[ i ].distance );
    //   newPosition.add( this.object.position );
    //   this.object.position.copy( newPosition );

    // }

    // 壁との衝突による壁ずりの処理
    // TODO めり込んだ場合、めり込み量を元に壁の法線方向にpull outする処理
    //      めりこみ量は、中心とフェイスの距離から求めることができる
    //      複数にめり込んでいたら、全フェイスを平均してそれを使う。
    // TODO 衝突対象 (壁) が エッジ * 2 の時の処理 - > ノーマルの角度がプレイヤーに一番向いているエッジを使う。エッジの組み合わせが壁と床である可能性もあるから、その時は壁となるエッジは無視する
    // TODO 衝突対象 (壁) が フェイス * 2 の時の処理 -> フェイス同士のノーマルが鋭角なら止まる。鈍角なら壁ずりで進める

    wallNomal2D = new THREE.Vector2( normal.x, normal.z ).normalize();
    wallAngle  = Math.atan2( wallNomal2D.y, wallNomal2D.x ) * 180 / Math.PI;
    wallAngle = THREEFIELD.normalizeAngle( wallAngle );

    if (
      Math.abs( frontAngleInverted - wallAngle ) >= 90 &&
      Math.abs( frontAngleInverted - wallAngle ) <= 270
    ) {

      continue;

    }

    wallNomal2D.set(
      frontVelocity2D.dot( wallNomal2D ) * wallNomal2D.x,
      frontVelocity2D.dot( wallNomal2D ) * wallNomal2D.y
    );
    frontVelocity2D.subVectors( frontVelocity2D, wallNomal2D );

    this.velocity.x = frontVelocity2D.x;
    this.velocity.z = frontVelocity2D.y;

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
    this.object.position.x,
    this.object.position.y + this.radius,
    this.object.position.z
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

  var x = this.object.position.x + this.velocity.x * dt,
      y = this.object.position.y + this.velocity.y * dt,
      z = this.object.position.z + this.velocity.z * dt;

  if ( this.isGrounded ) {

    y = this.groundHeight + this.radius;

  }

  this.object.position.set( x, y, z );

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

// THREEFIELD.CharacterController.prototype.sortTriagnlesByFrontAngle = function ( frontAngle ) {

//   var wallTriangles = [],
//       angleList = [ 0 ],
//       normal,
//       wallAngle2DInversed,
//       angleFrontAndWall,
//       i, ii, l, ll;

//   for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

//     normal = this.contactInfo[ i ].normal;

//     if ( this.maxSlopeGradient < normal.y ) {
//       // this triangle is a ground, not a wall
//       continue;

//     }

//     wallAngle2DInversed = THREEFIELD.normalizeAngle( 180 - Math.atan2( normal.y, normal.x ) * 180 / Math.PI );
//     angleFrontAndWall = THREEFIELD.howCloseBetweenAngles( frontAngle, wallAngle2DInversed );

//     for ( ii = 0, ll = angleList.length; ii < ll; ii ++ ) {

//       if ( angleList[ ii ] === angleFrontAndWall ) {

//         //既に格納されている角度と同じなら上書きして終了
//         wallTriangles[ ii ] = this.contactInfo[ i ];
//         break;

//       } else if ( angleList[ ii ] < angleFrontAndWall ) {

//         //既に格納されている角度より小さければ、[ ii-1 ] に新たに要素を挿入して終了
//         wallTriangles.splice( [ ii - 1 ], 0, this.contactInfo[ i ] );
//         angleList.splice( [ ii - 1 ], 0, angleFrontAndWall );
//         break;

//       }
//       // 既に格納されている角度より大きければ繰り返す

//     }

//   }

//   return wallTriangles;

// }

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

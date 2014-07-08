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

// THREEFIELD.CharacterController.prototype.getGroundHeight = function ( face, normal ) {
//   // http://marupeke296.com/COL_3D_No8_HightOfFloor.html
//   var a = face.a;
//   var n = normal;
//   var o = this.object.position;
//   return a.y - ( n.x * ( o.x - a.x ) + n.z * ( o.z - a.z ) ) / n.y;

// }

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
      newPosition = new THREE.Vector3(),
      wallNomal2D,
      frontVelocity2D,
      wallAngle,
      frontAngle,
      frontAngleInverted,
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
  frontVelocity2D = new THREE.Vector2( this.velocity.x, this.velocity.z );
  frontAngle = Math.atan2( frontVelocity2D.y, frontVelocity2D.x );
  frontAngleInverted = Math.atan2( -frontVelocity2D.y, -frontVelocity2D.x );

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
    wallAngle = Math.atan2( wallNomal2D.y, wallNomal2D.x );

    if (
      Math.abs( frontAngleInverted - wallAngle ) >= Math.PI * 0.5 && //  90deg
      Math.abs( frontAngleInverted - wallAngle ) <= Math.PI * 1.5    // 270deg
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

// @author yomotsu
// MIT License

THREEFIELD.CharacterController = function ( object3d, radius, world ) {

  this.object = object3d;
  this.radius = radius;
  this.world = world;
  this.maxSlopeGradient = Math.cos( THREE.Math.degToRad( 50 ) );
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
  this.collidedTriangles = [];
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

};

THREEFIELD.CharacterController.prototype._updateVelocity = function () {

  var FALL_VELOCITY = -20,
      frontDierction = -Math.cos( THREE.Math.degToRad( this.frontAngle ) ),
      rightDierction = -Math.sin( THREE.Math.degToRad( this.frontAngle ) ),
      normal,
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

  if ( this.collidedTriangles.length === 0 && !this.isJumping ) {

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

// ここから vs壁と、壁ずりの処理
  frontVelocity2D = new THREE.Vector2(  this.velocity.x, this.velocity.z );
  frontAngle = Math.atan2( frontVelocity2D.y, frontVelocity2D.x ) * 180 / Math.PI;
  frontAngle = THREEFIELD.normalizeAngle( frontAngle );

  frontAngleInverted = Math.atan2( -frontVelocity2D.y, -frontVelocity2D.x ) * 180 / Math.PI;
  frontAngleInverted = THREEFIELD.normalizeAngle( frontAngleInverted );

  for ( i = 0, l = this.collidedTriangles.length; i < l; i ++ ) {

    normal = this.collidedTriangles[ i ].normal;

    if ( normal.y <= this.maxSlopeGradient ) {

    // y が this.maxSlopeGradient 以下なら急な坂または壁
    // 壁との衝突による壁ずりの処理
    // TODO めり込んだ場合、めり込み量を元に壁の法線方向にpull outする処理
    //      めりこみ量は、中心とフェイスの距離から求めることができる
    //      複数にめり込んでいたら、全フェイスを平均してそれを使う。
    // TODO 衝突対象 (壁) が エッジ * 2 の時の処理 - > ノーマルの角度がプレイヤーに一番向いているエッジを使う。エッジの組み合わせが壁と床である可能性もあるから、その時は壁となるエッジは無視する
    // TODO 衝突対象 (壁) が フェイス * 2 の時の処理 -> フェイス同士のノーマルが鋭角なら止まる。鈍角なら壁ずりで進める

    wallNomal2D = new THREE.Vector2( normal.x, normal.z );
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

  }

};


THREEFIELD.CharacterController.prototype._updateGrounding = function () {

  var groundPadding,
      origin,
      raycaster,
      objects,
      intersects,
      i, l;

  this.isGrounded = false;
  this.isOnSlope = false;

  if ( 0 <= this.velocity.y && this.isJumping ) {

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

  if ( this.isJumping ) { return; }

  this.isJumping = true;
  this.isGrounded = false;

  var that = this;
  var jumpStartTime = Date.now();
  var jumpMaxDuration = 1000;

  ( function jump () {

    var elapsedTime = Date.now() - jumpStartTime;
    var progress = elapsedTime / jumpMaxDuration;

    if( elapsedTime < jumpMaxDuration ){

      that.currentJumpPower = Math.cos( Math.min( progress, 1 ) * Math.PI );
      requestAnimationFrame( jump );

    }

  } )();

};

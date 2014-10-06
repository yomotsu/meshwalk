// @author yomotsu
// MIT License
;( function ( THREE, ns ) {

  'use strict';

  ns.CharacterController = function ( object3d, radius, world ) {

    THREE.EventDispatcher.prototype.apply( this );
    this.object = object3d;
    this.center = new THREE.Vector3().copy( this.object.position );
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
    this.collisionCandidate;
    this.contactInfo = [];
    this._previouseMosion = {
      isGounded: null,
      isSlope  : null,
      isWalking: null,
      isJumping: null
    };
    world.addCharacter( this );

  };

  ns.CharacterController.prototype = {

    constructor: ns.CharacterController,

    update: function ( dt ) {

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
      this.collisionDetection();
      this.solvePosition();

    },

    _updateVelocity: function () {

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

      // 急勾配や自由落下など、自動で付与される速度の処理
      if ( this.contactInfo.length === 0 && !this.isJumping ) {

        // 何とも衝突していないので、自由落下
        return;

      } else if ( this.isGrounded && !this.isOnSlope && !this.isJumping ) {

        // 通常の地面上にいる場合、ただしジャンプ開始時は除く
        this.velocity.y = 0;

      } else if ( this.isGrounded && this.isOnSlope && !this.isJumping ) {

        // 急勾配な斜面にいる場合
        // 斜面に平行して下る
        // TODO y方向をFALL_VELOCITYと同じになるようにノーマライズして使う
        this.velocity.x = this.groundNormal.x * this.movementSpeed;
        this.velocity.y = 1 - this.groundNormal.y * this.movementSpeed;
        this.velocity.z = this.groundNormal.z * this.movementSpeed;

      } else if ( !this.isGrounded && !this.isOnSlope && this.isJumping ) {

        // TODO ジャンプの処理
        this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;

      }

      // 壁に向かった場合、壁方向の速度を0にする処理
      // vs walls and sliding on the wall
      direction2D = new THREE.Vector2( rightDierction, frontDierction );
      frontAngle = Math.atan2( direction2D.y, direction2D.x );
      frontAngleInverted = Math.atan2( -direction2D.y, -direction2D.x );

      for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

        normal = this.contactInfo[ i ].face.normal;

        if ( this.maxSlopeGradient < normal.y || this.isOnSlope ) {

          // フェイスは地面なので、壁としての衝突の可能性はない。
          // 速度の減衰はしないでいい
          // this triangle is a ground or slope, not a wall or ceil
          continue;

        }

        wallNomal2D = new THREE.Vector2( normal.x, normal.z ).normalize();
        wallAngle = Math.atan2( wallNomal2D.y, wallNomal2D.x );

        if (
          Math.abs( frontAngleInverted - wallAngle ) >= Math.PI * 0.5 && //  90deg
          Math.abs( frontAngleInverted - wallAngle ) <= Math.PI * 1.5    // 270deg
        ) {

          // フェイスは進行方向とは逆方向、要は背中側の壁なので
          // 速度の減衰はしないでいい
          continue;

        }


        // 上記までの条件に一致しなければ、フェイスは壁
        // 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする
        wallNomal2D.set(
          direction2D.dot( wallNomal2D ) * wallNomal2D.x,
          direction2D.dot( wallNomal2D ) * wallNomal2D.y
        );
        direction2D.subVectors( direction2D, wallNomal2D );

        this.velocity.x = direction2D.x * this.movementSpeed * this.isWalking;
        this.velocity.z = direction2D.y * this.movementSpeed * this.isWalking;

      }

    },

    _updateGrounding: function () {

      // "頭上からほぼ無限に下方向までの線 (segment)" vs "フェイス (triangle)" の
      // 交差判定を行う
      // もし、フェイスとの交差点が「頭上」から「下groundPadding」までの間だったら
      // 地面上 (isGrounded) にいることとみなす
      //
      //   ___
      //  / | \
      // |  |  | player sphere
      //  \_|_/
      //    |
      //---[+]---- ground
      //    |
      //    |
      //    | segment (player's head to almost -infinity)


      var i, l,
          groundContactInfo,
          groundContactInfoTmp,
          faces = this.collisionCandidate,
          distanceToGround;

      if ( ( 0 < this.currentJumpPower ) ) {

        // ジャンプ上昇中
        this.isGrounded = false;
        this.groundNormal.set( 0, 0, 0 );
        return;

      }

      var head = new THREE.Vector3(
        this.center.x,
        this.center.y + this.radius,
        this.center.z
      );

      var to = new THREE.Vector3(
        this.center.x,
        -1e10,
        this.center.z
      );

      this.isOnSlope = false;

      for ( i = 0, l = faces.length; i < l; i ++ ) {

        groundContactInfoTmp = ns.collision.testSegmentTriangle( head, to, faces[ i ].a, faces[ i ].b, faces[ i ].c );

        if ( !!groundContactInfoTmp && !groundContactInfo ) {

          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[ i ];

        } else if (
          !!groundContactInfoTmp &&
          groundContactInfoTmp.contactPoint.y > groundContactInfo.contactPoint.y
        ) {

          // 新しいcontactPointが既に交差判定したcontactPointよりも上にあれば
          // それを正とする

          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[ i ];

        }

      }
      
      if ( !groundContactInfo ) {

        this.isGrounded = false;
        this.groundNormal.set( 0, 0, 0 );
        return;

      }

      this.isGrounded = true;
      this.isJumping = false;
      this.groundHeight = groundContactInfo.contactPoint.y;
      this.groundNormal.copy( groundContactInfo.face.normal );

      if ( groundContactInfo.face.normal.y <= this.maxSlopeGradient ) {

        this.isOnSlope = true;

      }

    },

    _updatePosition: function ( dt ) {

      // 壁などを無視してひとまず(速度 * 時間)だけ
      // centerの座標を進める
      // 壁との衝突判定はこのこの後のステップで行うのでここではやらない
      // もしisGrounded状態なら、強制的にyの値を地面に合わせる

      var x = this.center.x + this.velocity.x * dt,
          y = this.center.y + this.velocity.y * dt,
          z = this.center.z + this.velocity.z * dt;

      if ( this.isGrounded ) {

        y = this.groundHeight + this.radius;

      }

      this.center.set( x, y, z );

    },

    _eventEmitter: function () {


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

    },

    collisionDetection: function () {

      // 交差していそうなフェイス (collisionCandidate) のリストから、
      // 実際に交差している壁フェイスを抜き出して
      // this.contactInfoに追加する

      var i, l,
          faces = this.collisionCandidate,
          contactInfo;

      this.contactInfo.length = 0;

      for ( i = 0, l = faces.length; i < l; i ++ ) {

        contactInfo = ns.collision.testSphereTriangle( this, faces[ i ].a, faces[ i ].b, faces[ i ].c, faces[ i ].normal );

        if ( !contactInfo ) {

          continue;

        }

        contactInfo.face = faces[ i ];
        this.contactInfo.push( contactInfo );

        // もし、updateGrounding() 内で
        // 急勾配の坂の上にいるかの判定ができていなくて、
        // !grounded かつ この時点で急勾配と交差している場合は
        // 坂の上にいる (isOnSlope) ことにする
        var isSlopeFace = ( this.maxSlopeGradient <= faces[ i ].normal.y && faces[ i ].normal.y  < 1 );

        if(
          !this.isGrounded &&
          !this.isOnSlope  &&
          isSlopeFace
        ) {

          this.isOnSlope = true;
          this.groundNormal = faces[ i ].normal;

        }

      }

    },

    solvePosition: function () {

      // updatePosition() で center を動かした後
      // 壁と衝突し食い込んでいる場合、
      // ここで壁の外への押し出しをする

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

      if ( this.contactInfo.length === 0 ) {

        // 何とも衝突していない。
        // 押し出す必要はないためcenterの値をそのままつかって終了
        this.object.position.copy( this.center );
        return;

      }

      // vs walls and sliding on the wall

      for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

        face = this.contactInfo[ i ].face;
        normal = this.contactInfo[ i ].face.normal;
        distance = this.contactInfo[ i ].distance;

        if ( this.maxSlopeGradient < normal.y || this.isOnSlope ) {

          // this triangle is a ground or slope, not a wall or ceil
          continue;

        }

        if ( distance < 0 && ( this.isGrounded || this.isOnSlope ) ) {

          // resolve player vs wall collistion while on the ground
          point1.copy( normal ).multiplyScalar( -this.radius ).add( this.center );
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

      this.center.add( translate );
      this.object.position.copy( this.center );

    },


    jump: function () {

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

    }

  }



} )( THREE, THREEFIELD );

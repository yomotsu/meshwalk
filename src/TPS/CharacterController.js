// @author yomotsu
// MIT License
;( function ( THREE, ns ) {

  'use strict';

  ns.CharacterController = function ( object3d, radius ) {

    THREE.EventDispatcher.prototype.apply( this );
    this.object = object3d;
    this.center = this.object.position.clone();
    this.radius = radius;
    this.groundPadding = .5;
    this.maxSlopeGradient = Math.cos( THREE.Math.degToRad( 50 ) );
    this.isGrounded = false;
    this.isOnSlope  = false;
    this.isIdling   = false;
    this.isWalking  = false;
    this.isJumping  = false;
    this.frontAngle = 0; // 0 to 360 deg
    this.movementSpeed = 15;
    this.velocity = new THREE.Vector3( 0, -10, 0 );
    this.groundHeight = 0;
    this.groundNormal = new THREE.Vector3();
    this.collisionCandidate;
    this.contactInfo = [];

  };

  ns.CharacterController.prototype = {

    constructor: ns.CharacterController,

    update: function ( dt ) {
// console.log( this.isGrounded, this.isOnSlope )

      // 状態をリセットしておく      
      this.isGrounded = false;
      this.isOnSlope  = false;
      this.groundHeight = -Infinity;
      this.groundNormal.set( 0, 1, 0 );

      this.updateGrounding();
      this.updatePosition( dt );
      this.collisionDetection();
      this.solvePosition();
      // this.emitEvent();
      this.updateVelocity();

    },

    updateVelocity: function () {

      var FALL_VELOCITY = -20,
          frontDierction = -Math.cos( THREE.Math.degToRad( this.frontAngle ) ),
          rightDierction = -Math.sin( THREE.Math.degToRad( this.frontAngle ) ),
          normal,
          wallNomal2D,
          direction2D,
          wallAngle,
          frontAngle,
          negativeFrontAngle,
          i, l;
      
      this.velocity.set(
        rightDierction * this.movementSpeed * this.isWalking, 
        FALL_VELOCITY,
        frontDierction * this.movementSpeed * this.isWalking
      );

      // 急勾配や自由落下など、自動で付与される速度の処理
      if ( this.contactInfo.length === 0 && !this.isJumping ) {

        // 何とも衝突していないので、自由落下
        return;

      } else if ( this.isGrounded && !this.isOnSlope && !this.isJumping ) {

        // 通常の地面上にいる場合、ただしジャンプ開始時は除く
        this.velocity.y = 0;

      } else if ( this.isOnSlope ) {

        this.velocity.x = this.groundNormal.x * this.movementSpeed;
        this.velocity.y = 1 - this.groundNormal.y * this.movementSpeed;
        this.velocity.z = this.groundNormal.z * this.movementSpeed;

      // TODO ジャンプの処理
      //} else if ( !this.isGrounded && !this.isOnSlope && this.isJumping ) {

      //   this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;

      }


      // 壁に向かった場合、壁方向の速度を0にする処理
      // vs walls and sliding on the wall
      direction2D = new THREE.Vector2( rightDierction, frontDierction );
      frontAngle = Math.atan2( direction2D.y, direction2D.x );
      negativeFrontAngle = Math.atan2( -direction2D.y, -direction2D.x );
      
      for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

        normal = this.contactInfo[ i ].face.normal;
        // var distance = this.contactInfo[ i ].distance;


        if ( this.maxSlopeGradient < normal.y || this.isOnSlope ) {

          // フェイスは地面なので、壁としての衝突の可能性はない。
          // 速度の減衰はしないでいい
          // this triangle is a ground or slope, not a wall or ceil
          continue;

        }

        wallNomal2D = new THREE.Vector2( normal.x, normal.z ).normalize();
        wallAngle = Math.atan2( wallNomal2D.y, wallNomal2D.x );

        if (
          Math.abs( negativeFrontAngle - wallAngle ) >= Math.PI * 0.5 && //  90deg
          Math.abs( negativeFrontAngle - wallAngle ) <= Math.PI * 1.5    // 270deg
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

    updateGrounding: function () {

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

      for ( i = 0, l = faces.length; i < l; i ++ ) {

        groundContactInfoTmp = ns.collision.testSegmentTriangle( head, to, faces[ i ].a, faces[ i ].b, faces[ i ].c );

        if ( groundContactInfoTmp && !groundContactInfo ) {

          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[ i ];

        } else if (
          groundContactInfoTmp &&
          groundContactInfoTmp.contactPoint.y > groundContactInfo.contactPoint.y
        ) {
          
          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[ i ];

        }

      }

      if ( !groundContactInfo ) {

        return;

      }

      this.groundHeight = groundContactInfo.contactPoint.y;
      this.groundNormal.copy( groundContactInfo.face.normal );

      var top    = head.y;
      var bottom = this.center.y - this.radius - this.groundPadding;

      this.isOnSlope  = ( this.groundNormal.y <= this.maxSlopeGradient );
      this.isGrounded = ( bottom <= this.groundHeight && this.groundHeight <= top );
// console.log( this.isGrounded, this.isOnSlope )
    },

    updatePosition: function ( dt ) {

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

    emitEvent: function () {

      var wasWalking;

      return function () {

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

        contactInfo = ns.collision.isIntersectionSphereTriangle( this, faces[ i ].a, faces[ i ].b, faces[ i ].c, faces[ i ].normal );

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

        // 何とも衝突していない
        // centerの値をそのままつかって終了
        this.object.position.copy( this.center );
        return;

      }

      // 
      // vs walls and sliding on the wall

      for ( i = 0, l = this.contactInfo.length; i < l; i ++ ) {

        face = this.contactInfo[ i ].face;
        normal = this.contactInfo[ i ].face.normal;
        distance = this.contactInfo[ i ].distance;

        // if ( 0 <= distance ) {

        //   // 交差点までの距離が 0 以上ならこのフェイスとは衝突していない
        //   // 無視する
        //   continue;

        // }

        if ( this.maxSlopeGradient < normal.y ) {

          // this triangle is a ground or slope, not a wall or ceil
          // フェイスは急勾配でない坂、つまり地面。
          // 接地の処理は updatePosition() 内で解決しているので無視する
          continue;

        }

        if ( this.isGrounded || this.isOnSlope ) {

          // 地面の上にいる場合はy(縦)方向は同一のまま
          // x, z (横) 方向だけを変更して押し出す

          // solve player vs wall collistion while on the ground
          // http://gamedev.stackexchange.com/questions/80293/how-do-i-resolve-a-sphere-triangle-collision-in-a-given-direction
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

          break;
          continue;

        }
// console.log( 111, this.contactInfo[0].distance );
        // 接地していない、かつ、急勾配野坂
        // 降下中やジャンプ中に壁まはた屋根と衝突した場合は
        // 法線と逆方向に押し出す
        // translate.x += -normal.x * distance;
        // translate.y += -normal.y * distance;
        // translate.z += -normal.z * distance;

      }

      this.center.add( translate );
      this.object.position.copy( this.center );

    },

    jump: function () {

      console.log( 'jump' );
    }

  }



} )( THREE, THREEFIELD );

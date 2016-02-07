// @author yomotsu
// MIT License

MW.AnimationController = function ( mesh ) {

  this.mesh   = mesh;
  this.motion = {};
  this.mixer  = new THREE.AnimationMixer( mesh );
  this.currentMotionName = '';

  var i, l, anim;

  for ( i = 0, l = this.mesh.geometry.animations.length; i < l; i ++ ) {

    anim = this.mesh.geometry.animations[ i ];
    this.motion[ anim.name ] = this.mixer.clipAction( anim );
    this.motion[ anim.name ].setEffectiveWeight( 1 );

  }

};

MW.AnimationController.prototype = {

  play: function ( name ) {

    if ( this.currentMotionName === name ) { return; }

    if ( this.motion[ this.currentMotionName ] ) {

      var from = this.motion[ this.currentMotionName ].play();
      var to   = this.motion[ name ].play();

      from.enabled = true;
      to.enabled = true;

      from.crossFadeTo( to, .3 );

    } else {

      this.motion[ name ].enabled = true;
      this.motion[ name ].play();

    }

    this.currentMotionName = name;

  },

  turn: function () {

    var DURATION  = 200;
    var TAU = 2 * Math.PI;

    var mod = function ( a, n ) { return ( a % n + n ) % n; }

    var getDeltaAngle = function ( current, target ) {

      var a = mod( ( current - target ), TAU );
      var b = mod( ( target - current ), TAU );

      return a < b ? -a : b;

    };

    return function ( rad, immediate ) {


      var that       = this;
      var progress   = 0;
      var prevRotY   = this.mesh.rotation.y;
      var targetRotY = rad;
      var deltaY     = getDeltaAngle( prevRotY, targetRotY );
      // var duration   = Math.abs( deltaY ) * 100;
      var start      = Date.now();
      var end        = start + DURATION;

      if ( immediate ) {

        this.mesh.rotation.y = targetRotY;
        return;

      }

      if ( this._targetRotY === targetRotY ) { return; }

      this._targetRotY = targetRotY;

      ( function () {

        var _targetRotY = targetRotY;

        ( function interval () {

          var now = Date.now();
          var isAborted = _targetRotY !== that._targetRotY;

          if ( isAborted ) { return; }

          if ( now >= end ) {

            that.mesh.rotation.y = _targetRotY;
            delete that._targetRotY;
            return;

          }

          requestAnimationFrame( interval );
          progress = ( now - start ) / DURATION;
          that.mesh.rotation.y = prevRotY + deltaY * progress;

        } )();

      } )();

    }

  }(),

  update: function ( delta ) {

    this.mixer.update( delta );

  }

};

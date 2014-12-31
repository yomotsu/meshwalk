// @author yomotsu
// MIT License


THREEFIELD.AnimationController = function ( mesh ) {

  this.mesh = mesh;
  this.motion = {};
  var i, l, anim;

  for ( i = 0, l = this.mesh.geometry.animations.length; i < l; i ++ ) {

    anim = this.mesh.geometry.animations[ i ];

    this.motion[ anim.name ] = {

      anim: new THREE.Animation(
        mesh,
        anim,
        THREE.AnimationHandler.CATMULLROM
      ),

      duration: anim.length * 1000

    };

  }

};

THREEFIELD.AnimationController.prototype.play = function ( name ) {

  var i;

  for ( i in this.motion ) {

    this.motion[ i ].anim.stop();

  }

  this.motion[ name ].anim.play();

};

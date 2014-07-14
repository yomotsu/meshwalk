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

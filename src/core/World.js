// @author yomotsu
// MIT License

;( function ( THREE, ns ) {

  'use strict';

  ns.World = function () {

    // console.log( 'THREEFIELD.World' );

    this.colliderPool  = [];
    this.characterPool = [];

  };

  ns.World.prototype.add = function ( object ) {
    
    if ( object instanceof ns.Octree ) {

      this.colliderPool.push( object );

    } else if ( object instanceof ns.CharacterController ) {

      this.characterPool.push( object );

    }

  };

  ns.World.prototype.step = function ( dt ) {

    var character,
        octree,
        sphere,
        intersectedNodes,
        faces,
        contactInfo,
        i, ii, iii, l, ll, lll;

    for ( i = 0, l = this.characterPool.length; i < l; i ++ ) {

      character = this.characterPool[ i ];

      // octree で絞られた node に含まれる face だけを
      // charactore に渡して判定する
      for ( ii = 0, ll = this.colliderPool.length; ii < ll; ii ++ ) {

        octree = this.colliderPool[ ii ];
        sphere = new THREE.Sphere( character.center, character.radius + character.groundPadding );
        intersectedNodes = octree.getIntersectedNodes( sphere, octree.maxDepth );
        faces = ns.Octree.uniqTriangkesfromNodes( intersectedNodes );

      }
      
      character.collisionCandidate = faces;
      character.update( dt );

    }

  };

} )( THREE, THREEFIELD );

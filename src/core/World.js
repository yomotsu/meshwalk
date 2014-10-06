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
      i, ii, l, ll;

  for ( i = 0, l = this.characters.length; i < l; i ++ ) {

    character = this.characters[ i ];

    // octree で絞られた node に含まれる face だけを
    // character に渡して判定する
    // for ( ii = 0, ll = this.colliders.length; ii < ll; ii ++ ) {

      // octree = this.colliders[ ii ];
      sphere = new THREE.Sphere( character.center, character.radius + character.groundPadding );
      intersectedNodes = octree.getIntersectedNodes( sphere, octree.maxDepth );
      faces = THREEFIELD.Octree.uniqTriangkesfromNodes( intersectedNodes );

    // }
    
    character.collisionCandidate = faces;
    character.update( dt );

  }

};

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
      isCollided,
      i, ii, iii, l, ll, lll;

  for ( i = 0, l = this.characters.length; i < l; i ++ ) {

    character = this.characters[ i ];
    character.collidedTriangles.length = 0;

    for ( ii = 0, ll = this.colliders.length; ii < ll; ii ++ ) {

      collider = this.colliders[ ii ];
      isInAABB = THREEFIELD.sphereInAABB( character.object.position, character.radius, collider.aabb );
      
      if ( !isInAABB ) {

        continue;

      }

      for ( iii = 0, lll = collider.faces.length; iii < lll; iii ++ ) {

        isCollided = THREEFIELD.sphereVsTriangle( collider.faces[ iii ], character.object.position, character.radius );

        if ( !isCollided ) {

          continue;

        }

        character.collidedTriangles.push( {
          face: collider.faces[ iii ],
          normal: collider.normals[ iii ]
        } );
      }

    }

    character.update( dt );

  }

};

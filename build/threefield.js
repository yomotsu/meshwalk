/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */

var THREEFIELD = {};

// @author yomotsu
// MIT License

THREEFIELD.normalizeAngle = function ( angleInDeg ) {

  return ( angleInDeg >= 0 ) ? ( angleInDeg % 360 ) : ( angleInDeg  % 360 + 360 );

};


THREEFIELD.howCloseBetweenAngles = function ( angle1, angle2 ) {

  var angle = Math.min(
    THREEFIELD.normalizeAngle( angle1 - angle2 ),
    THREEFIELD.normalizeAngle( angle2 - angle1 )
  );
  
  return angle;

};

THREEFIELD.triangle = {}

THREEFIELD.triangle.makeBoundingBox = function ( triangle ) {

  var bb = new THREE.Box3();

  bb.min = bb.min.min( triangle.a );
  bb.min = bb.min.min( triangle.b );
  bb.min = bb.min.min( triangle.c );

  bb.max = bb.max.max( triangle.a );
  bb.max = bb.max.max( triangle.b );
  bb.max = bb.max.max( triangle.c );

  return bb;

}

THREEFIELD.triangle.makeBoundingSphere = function ( triangle, normal ) {
 
  var bs = new THREE.Sphere(),
      v = new THREE.Vector3(),
      v0 = new THREE.Vector3(),
      v1 = new THREE.Vector3(),
      e0 = new THREE.Vector3(),
      e1 = new THREE.Vector3(),
      a, b, c, d, e,
      div, t, s;
 
  // obtuse triangle
 
  v0.subVectors( triangle.b, triangle.a );
  v1.subVectors( triangle.c, triangle.a );
 
  if ( v0.dot( v1 ) <= 0 ) {
 
    bs.center.addVectors( triangle.b, triangle.c ).divideScalar( 2 );
    bs.radius = v.subVectors( triangle.b, triangle.c ).length() / 2;
    return bs;
 
  }
 
  v0.subVectors( triangle.a, triangle.b );
  v1.subVectors( triangle.c, triangle.b );
 
  if ( v0.dot( v1 ) <= 0 ) {
 
    bs.center.addVectors( triangle.a, triangle.c ).divideScalar( 2 );
    bs.radius = v.subVectors( triangle.a, triangle.c ).length() / 2;
    return bs;
 
  }
 
  v0.subVectors( triangle.a, triangle.c );
  v1.subVectors( triangle.b, triangle.c );
 
  if ( v0.dot( v1 ) <= 0 ) {
 
    bs.center.addVectors( triangle.a, triangle.b ).divideScalar( 2 );
    bs.radius = v.subVectors( triangle.a, triangle.b ).length() / 2;
    return bs;
 
  }
 
  // acute‐angled triangle
 
  if ( !normal ) {
 
    normal = triangle.normal();
 
  }
 
  v0.crossVectors( v.subVectors( triangle.c, triangle.b ), normal );
  v1.crossVectors( v.subVectors( triangle.c, triangle.a ), normal );
 
  e0.addVectors( triangle.c, triangle.b ).multiplyScalar( .5 );
  e1.addVectors( triangle.c, triangle.a ).multiplyScalar( .5 );
 
  a = v0.dot( v1 );
  b = v0.dot( v0 );
  d = v1.dot( v1 );
  c = -v.subVectors( e1, e0 ).dot( v0 );
  e = -v.subVectors( e1, e0 ).dot( v1 );
 
  div = - a * a + b * d;
  // t = ( - a * c + b * e ) / div;
  s = ( - c * d + a * e ) / div;
 
  bs.center = e0.clone().add( v0.clone().multiplyScalar( s ) );
  bs.radius = v.subVectors( bs.center, triangle.a ).length();
  return bs;
 
}

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

// @author yomotsu
// MIT License

;( function ( THREE, ns ) {

  'use strict';

  THREEFIELD.Collider = function ( threeMesh ) {

    var geometry,
        face,
        normal,
        i, l;

    this.mesh = threeMesh;
    this.faces   = [];
    this.normals = [];
    this.boxes   = [];
    this.sphere  = null;
    this.aabb    = null;

    // http://stackoverflow.com/questions/23990354/how-to-update-vertices-geometry-after-rotate-or-move-object#answer-24001626
    threeMesh.updateMatrix(); 
    threeMesh.geometry.applyMatrix( threeMesh.matrix );
    threeMesh.matrix.identity();
    threeMesh.position.set( 0, 0, 0 );
    threeMesh.rotation.set( 0, 0, 0 );
    threeMesh.scale.set( 1, 1, 1 );
    threeMesh.geometry.verticesNeedUpdate = true;
    threeMesh.updateMatrixWorld();
    threeMesh.geometry.computeFaceNormals();
    threeMesh.geometry.computeVertexNormals();

    if ( threeMesh.geometry.boundingSphere === null ) {

      threeMesh.geometry.computeBoundingSphere();

    }

    if ( threeMesh.geometry.boundingBox === null ) {

      threeMesh.geometry.computeBoundingBox();

    }

    this.sphere = threeMesh.geometry.boundingSphere;
    this.aabb   = threeMesh.geometry.boundingBox;
    geometry = this.mesh.geometry;

    for ( i = 0, l = geometry.faces.length; i < l; i ++ ) {

      face = new THREE.Triangle(
        geometry.vertices[ geometry.faces[ i ].a ],
        geometry.vertices[ geometry.faces[ i ].b ],
        geometry.vertices[ geometry.faces[ i ].c ]
      );
      normal = geometry.faces[ i ].normal;

      this.faces.push( face );
      this.normals.push( normal );
      this.boxes.push( THREEFIELD.triangle.makeBoundingBox( face ) );

    }

  };

} )( THREE, THREEFIELD );

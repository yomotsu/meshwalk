// @author yomotsu
// MIT License

THREEFIELD.Collider = function ( threeMesh ) {

  var geometry,
      matrix = threeMesh.matrixWorld.clone(),
      i, l;

  this.mesh = threeMesh;
  this.faces   = [];
  this.normals = [];
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
  threeMesh.geometry.computeBoundingBox();

  this.aabb = threeMesh.geometry.boundingBox;
  geometry = this.mesh.geometry;

  for ( i = 0, l = geometry.faces.length; i < l; i ++ ) {

    if ( geometry.faces[ i ].d ) {

      console.log( 'still not supported' );

    }

    var a = geometry.vertices[ geometry.faces[ i ].a ];
    var b = geometry.vertices[ geometry.faces[ i ].b ];
    var c = geometry.vertices[ geometry.faces[ i ].c ];

    this.faces.push( { a: a, b: b, c: c } );
    this.normals.push( geometry.faces[ i ].normal );

  }

};

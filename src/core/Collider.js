// @author yomotsu
// MIT License

;( function ( THREE, ns ) {

  'use strict';

  THREEFIELD.Collider = function ( threeMesh, name ) {

    var geometry,
        face,
        normal,
        i, l;

    this.mesh = threeMesh;
    this.name = name;
    this.uuid = THREE.Math.generateUUID();
    this.faces   = [];
    this.normals = [];
    this.boxes   = [];
    this.boundingSphere = null;
    this.boundingBox    = null;

    // bake the matrix for performance
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

    geometry = this.mesh.geometry;

    if ( geometry.boundingSphere === null ) {

      geometry.computeBoundingSphere();

    }

    if ( geometry.boundingBox === null ) {

      geometry.computeBoundingBox();

    }

    this.boundingSphere = geometry.boundingSphere;
    this.boundingBox    = geometry.boundingBox;

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

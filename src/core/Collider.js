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

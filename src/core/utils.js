// @author yomotsu
// MIT License

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

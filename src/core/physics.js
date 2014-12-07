
var physics = {};

// aabb: <THREE.Box3>
// Plane: <THREE.Plane>
physics.isIntersectionAABBPlane = function ( aabb, Plane ) {

  var center = new THREE.Vector3().addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 );
  var extents = new THREE.Vector3().subVectors( aabb.max, center );

  var r = extents.x * Math.abs( Plane.normal.x ) + extents.y * Math.abs( Plane.normal.y ) + extents.z * Math.abs( Plane.normal.z );
  var s = Plane.normal.dot( center ) - Plane.constant;

  return Math.abs( s ) <= r;

}

// based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
//
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// aabb: <THREE.Box3>
physics.isIntersectionTriangleAABB = function ( a, b, c, aabb ) {

  var p0, p1, p2, r;
  var axis = new THREE.Vector3();
  var p_Min;
  var p_Max;

  var x_Min;
  var y_Min;
  var z_Min;
  var x_Max;
  var y_Max;
  var z_Max;
  
  // Compute box center and extents of AABoundingBox (if not already given in that format)
  var c = new THREE.Vector3().addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 );
  var e0 = ( aabb.max.x - aabb.min.x ) * 0.5;
  var e1 = ( aabb.max.y - aabb.min.y ) * 0.5;
  var e2 = ( aabb.max.z - aabb.min.z ) * 0.5;

  // Translate triangle as conceptually moving AABB to origin
  var v0 = new THREE.Vector3().subVectors( a, c );
  var v1 = new THREE.Vector3().subVectors( b, c );
  var v2 = new THREE.Vector3().subVectors( c, c );

  // Compute edge vectors for triangle
  var f0 = new THREE.Vector3().subVectors( v1, v0 );
  var f1 = new THREE.Vector3().subVectors( v2, v1 );
  var f2 = new THREE.Vector3().subVectors( v0, v2 );

  // Test axes a00..a22 (category 3)

  // Test axis a00
  p0 = v0.z * v1.y - v0.y * v1.z;
  p2 = v2.z * ( v1.y - v0.y ) - v2.z * ( v1.z - v0.z );

  r = e1 * Math.abs( f0.z ) + e2 * Math.abs( f0.y );

  if ( Math.max( -Math.max( p0, p2 ), Math.min( p0, p2 ) ) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a01 (a01 = new THREE.Vector3(0, -f1.z, f1.y))
  axis.set( 0, -f1.z, f1.y );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max( -p_Max, p_Min ) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a02 (a02 = new THREE.Vector3(0, -f2.z, f2.y))
  axis.set( 0, -f2.z, f2.y );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max( -p_Max, p_Min ) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a10 (a10 = new THREE.Vector3( f0.z, 0, -f0.X))
  axis.set( f0.z, 0, -f0.x );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max( -p_Max, p_Min ) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a11 (a11 = new THREE.Vector3( f1.z, 0, -f1.x))
  axis.set( f1.z, 0, -f1.x );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max( -p_Max, p_Min ) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a12 (a12 = new THREE.Vector3( f2.z, 0, -f2.x))
  axis.set( f2.z, 0, -f2.x );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max( -p_Max, p_Min ) > r ) {
    return false; // Axis is a separating axis
  }

  // Test axis a20 (a20 = new THREE.Vector3(-f0.y, -f0.x, 0))
  axis.set( -f0.y, -f0.x, 0 );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min( p0, p1 );
  p_Min = Math.min( p_Min, p2 );
  p_Max = Math.max( p0, p1 );
  p_Max = Math.max( p_Max, p2 );

  if ( Math.max(-p_Max, p_Min) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a21 (a21 = new THREE.Vector3(-f1.y, -f1.x, 0))
  axis.set( -f1.y, -f1.x, 0 );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min(p0, p1);
  p_Min = Math.min(p_Min, p2);
  p_Max = Math.max(p0, p1);
  p_Max = Math.max(p_Max, p2);

  if ( Math.max(-p_Max, p_Min) > r ) {

    return false; // Axis is a separating axis

  }

  // Test axis a22 (a22 = new THREE.Vector3(-f2.y, -f2.x, 0))
  axis.set( -f2.y, -f2.x, 0 );
  p0 = v0.dot( axis );
  p1 = v1.dot( axis );
  p2 = v2.dot( axis );

  // [-r, r] and [min(p0, p1, p2), max(p0, p1, p2)] should be disjoint for this axis
  p_Min = Math.min(p0, p1);
  p_Min = Math.min(p_Min, p2);
  p_Max = Math.max(p0, p1);
  p_Max = Math.max(p_Max, p2);

  if ( Math.max(-p_Max, p_Min) > r ) {

    return false; // Axis is a separating axis

  }

  // Test the three axes corresponding to the face normals of AABB b (category 1).
  x_Max = Math.max( v0.x, v1.x );
  x_Max = Math.max( x_Max, v2.x );

  x_Min = Math.min( v0.x, v1.x );
  x_Min = Math.min( x_Min, v2.x );

  y_Max = Math.max( v0.y, v1.y );
  y_Max = Math.max( y_Max, v2.y );

  y_Min = Math.min( v0.y, v1.y );
  y_Min = Math.min( y_Min, v2.y );

  z_Max = Math.max( v0.z, v1.z );
  z_Max = Math.max( z_Max, v2.z );

  z_Min = Math.min( v0.z, v1.z );
  z_Min = Math.min( z_Min, v2.z );

  // Exit if [-e0, e0] and [min(v0.x,v1.x,v2.x), max(v0.x,v1.x,v2.x)] do not overlap
  if ( x_Max < -e0 || x_Min > e0 ) {

    return false;

  }

  // ... [-e1, e1] and [min(v0.y,v1.y,v2.y), max(v0.y,v1.y,v2.y)] do not overlap
  if ( y_Max < -e1 || y_Min > e1 ) {

    return false;

  }

  // ... [-e2, e2] and [min(v0.z,v1.z,v2.z), max(v0.z,v1.z,v2.z)] do not overlap
  if ( z_Max < -e2 || z_Min > e2 ) {

    return false;

  }

  // Test separating axis corresponding to triangle face normal (category 2)
  // Face Normal is -ve as Triangle is clockwise winding (and XNA uses -z for into screen)
  var plane = new THREE.Plane();
  plane.normal = new THREE.Vector3().copy( f0 ).cross( f1 ).normalize();
  plane.constant = plane.normal.dot( a );
  return physics.isIntersectionAABBPlane( aabb, plane );

}


// sphere1: <THREE.Sphere>
// sphere2: <THREE.Sphere>
physics.isIntersectionSphereSphere = function ( sphere1, sphere2 ) {

  var radiusSum = sphere1.radius + sphere2.radius;

  return sphere1.center.distanceToSquared( sphere2.center ) <= ( radiusSum * radiusSum );

};

// sphere: <THREE.Sphere>
// aabb: <THREE.Box3>
physics.isIntersectionSphereAABB = function ( sphere, aabb ) {

  var i,
      rr = sphere.radius * sphere.radius,
      dmin = 0;

  if ( sphere.center.x < aabb.min.x )     { dmin += Math.sqrt( sphere.center.x - aabb.min.x ) }
  else if( sphere.center.x > aabb.max.x ) { dmin += Math.sqrt( sphere.center.x - aabb.max.x ) }

  if ( sphere.center.y < aabb.min.y )     { dmin += Math.sqrt( sphere.center.y - aabb.min.y ) }
  else if( sphere.center.y > aabb.max.y ) { dmin += Math.sqrt( sphere.center.y - aabb.max.y ) }

  if ( sphere.center.z < aabb.min.z )     { dmin += Math.sqrt( sphere.center.z - aabb.min.z ) }
  else if( sphere.center.z > aabb.max.z ) { dmin += Math.sqrt( sphere.center.z - aabb.max.z ) }

  return dmin <= rr;

};
//http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle
physics.isIntersectionSphereTriangle = function ( sphere, a, b, c, normal ) {
  // http://realtimecollisiondetection.net/blog/?p=103

  // vs plain of traiangle face
  var A = new THREE.Vector3(),
      B = new THREE.Vector3(),
      C = new THREE.Vector3(),
      rr,
      V = new THREE.Vector3(),
      d,
      e;

  A.subVectors( a, sphere.center );
  B.subVectors( b, sphere.center );
  C.subVectors( c, sphere.center );
  rr = sphere.radius * sphere.radius;
  V.crossVectors( B.clone().sub( A ), C.clone().sub( A ) );
  d = A.dot( V );
  e = V.dot( V );

  if ( d * d > rr * e ) {

    return false;

  }

  // vs triangle vertex
  var aa,
      ab,
      ac,
      bb,
      bc,
      cc;

  aa = A.dot( A );
  ab = A.dot( B );
  ac = A.dot( C );
  bb = B.dot( B );
  bc = B.dot( C );
  cc = C.dot( C );

  if (
    ( aa > rr ) & ( ab > aa ) & ( ac > aa ) ||
    ( bb > rr ) & ( ab > bb ) & ( bc > bb ) ||
    ( cc > rr ) & ( ac > cc ) & ( bc > cc )
  ) {

    return false;

  }

  // vs edge
  var AB = new THREE.Vector3(),
      BC = new THREE.Vector3(),
      CA = new THREE.Vector3(),
      d1,
      d2,
      d3,
      e1,
      e2,
      e3,
      Q1 = new THREE.Vector3(),
      Q2 = new THREE.Vector3(),
      Q3 = new THREE.Vector3(),
      QC = new THREE.Vector3(),
      QA = new THREE.Vector3(),
      QB = new THREE.Vector3();

  AB.subVectors( B, A );
  BC.subVectors( C, B );
  CA.subVectors( A, C );
  d1 = ab - aa;
  d2 = bc - bb;
  d3 = ac - cc;
  e1 = AB.dot( AB );
  e2 = BC.dot( BC );
  e3 = CA.dot( CA );
  Q1.subVectors( A.multiplyScalar( e1 ), AB.multiplyScalar( d1 ) );
  Q2.subVectors( B.multiplyScalar( e2 ), BC.multiplyScalar( d2 ) );
  Q3.subVectors( C.multiplyScalar( e3 ), CA.multiplyScalar( d3 ) );
  QC.subVectors( C.multiplyScalar( e1 ), Q1 );
  QA.subVectors( A.multiplyScalar( e2 ), Q2 );
  QB.subVectors( B.multiplyScalar( e3 ), Q3 );

  if (
    ( Q1.dot( Q1 ) > rr * e1 * e1 ) && ( Q1.dot( QC ) >= 0 ) ||
    ( Q2.dot( Q2 ) > rr * e2 * e2 ) && ( Q2.dot( QA ) >= 0 ) ||
    ( Q3.dot( Q3 ) > rr * e3 * e3 ) && ( Q3.dot( QB ) >= 0 )
  ) {

    return false;

  }

  var distance = Math.sqrt( d * d / e ) - sphere.radius,
      contactPoint = new THREE.Vector3(),
      negatedNormal = new THREE.Vector3( -normal.x, -normal.y, -normal.z );

  contactPoint.copy( sphere.center ).add( negatedNormal.multiplyScalar( distance ) );

  return {
    distance    : distance,
    contactPoint: contactPoint
  };

};


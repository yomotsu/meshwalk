// @author yomotsu
// MIT License

;( function ( THREE, ns ) {

  'use strict';

  ns.collision = {};
 
  ns.collision.helper = {
   
    scalarTriple: function ( a, b, c ) {
   
      var m = b.clone().cross( c );
      return a.dot( m );
   
    }
   
  };

  // aabb: <THREE.Box3>
  // Plane: <THREE.Plane>
  ns.collision.testAABBPlane = function ( aabb, Plane ) {

    var center = new THREE.Vector3().addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 ),
        extents = new THREE.Vector3().subVectors( aabb.max, center );

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
  ns.collision.testTriangleAABB = function ( a, b, c, aabb ) {

    var p0, p1, p2, r;
    
    // Compute box center and extents of AABoundingBox (if not already given in that format)
    var center = new THREE.Vector3().addVectors( aabb.max, aabb.min ).multiplyScalar( 0.5 ),
        extents = new THREE.Vector3().subVectors( aabb.max, center );

    // Translate triangle as conceptually moving AABB to origin
    var v0 = new THREE.Vector3().subVectors( a, center ),
        v1 = new THREE.Vector3().subVectors( b, center ),
        v2 = new THREE.Vector3().subVectors( c, center );

    // Compute edge vectors for triangle
    var f0 = new THREE.Vector3().subVectors( v1, v0 ),
        f1 = new THREE.Vector3().subVectors( v2, v1 ),
        f2 = new THREE.Vector3().subVectors( v0, v2 );

    // Test axes a00..a22 (category 3)
    var a00 = new THREE.Vector3( 0, -f0.z, f0.y ),
        a01 = new THREE.Vector3( 0, -f1.z, f1.y ),
        a02 = new THREE.Vector3( 0, -f2.z, f2.y ),
        a10 = new THREE.Vector3( f0.z, 0, -f0.x ),
        a11 = new THREE.Vector3( f1.z, 0, -f1.x ),
        a12 = new THREE.Vector3( f2.z, 0, -f2.x ),
        a20 = new THREE.Vector3( -f0.y, f0.x, 0 ),
        a21 = new THREE.Vector3( -f1.y, f1.x, 0 ),
        a22 = new THREE.Vector3( -f2.y, f2.x, 0 );

    // Test axis a00
    p0 = v0.dot( a00 );
    p1 = v1.dot( a00 );
    p2 = v2.dot( a00 );
    r = extents.y * Math.abs( f0.z ) + extents.z * Math.abs( f0.y );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a01
    p0 = v0.dot( a01 );
    p1 = v1.dot( a01 );
    p2 = v2.dot( a01 );
    r = extents.y * Math.abs( f1.z ) + extents.z * Math.abs( f1.y );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a02
    p0 = v0.dot( a02 );
    p1 = v1.dot( a02 );
    p2 = v2.dot( a02 );
    r = extents.y * Math.abs( f2.z ) + extents.z * Math.abs( f2.y );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a10
    p0 = v0.dot( a10 );
    p1 = v1.dot( a10 );
    p2 = v2.dot( a10 );
    r = extents.x * Math.abs( f0.z ) + extents.z * Math.abs( f0.x );
    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a11
    p0 = v0.dot( a11 );
    p1 = v1.dot( a11 );
    p2 = v2.dot( a11 );
    r = extents.x * Math.abs( f1.z ) + extents.z * Math.abs( f1.x );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a12
    p0 = v0.dot( a12 );
    p1 = v1.dot( a12 );
    p2 = v2.dot( a12 );
    r = extents.x * Math.abs( f2.z ) + extents.z * Math.abs( f2.x );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a20
    p0 = v0.dot( a20 );
    p1 = v1.dot( a20 );
    p2 = v2.dot( a20 );
    r = extents.x * Math.abs( f0.y ) + extents.y * Math.abs( f0.x );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a21
    p0 = v0.dot( a21 );
    p1 = v1.dot( a21 );
    p2 = v2.dot( a21 );
    r = extents.x * Math.abs( f1.y ) + extents.y * Math.abs( f1.x );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test axis a22
    p0 = v0.dot( a22 );
    p1 = v1.dot( a22 );
    p2 = v2.dot( a22 );
    r = extents.x * Math.abs( f2.y ) + extents.y * Math.abs( f2.x );

    if ( Math.max( -Math.max( p0, p1, p2 ), Math.min( p0, p1, p2 ) ) > r ) {

      return false; // Axis is a separating axis

    }

    // Test the three axes corresponding to the face normals of AABB b (category 1).
    // Exit if...
    // ... [-extents.x, extents.x] and [min(v0.x,v1.x,v2.x), max(v0.x,v1.x,v2.x)] do not overlap
    if ( Math.max( v0.x, v1.x, v2.x ) < -extents.x || Math.min( v0.x, v1.x, v2.x ) > extents.x ) {

      return false;

    }
    // ... [-extents.y, extents.y] and [min(v0.y,v1.y,v2.y), max(v0.y,v1.y,v2.y)] do not overlap
    if ( Math.max( v0.y, v1.y, v2.y ) < -extents.y || Math.min( v0.y, v1.y, v2.y ) > extents.y ) {

      return false;

    }
    // ... [-extents.z, extents.z] and [min(v0.z,v1.z,v2.z), max(v0.z,v1.z,v2.z)] do not overlap
    if ( Math.max( v0.z, v1.z, v2.z ) < -extents.z || Math.min( v0.z, v1.z, v2.z ) > extents.z ) {

      return false;

    }

    // Test separating axis corresponding to triangle face normal (category 2)
    // Face Normal is -ve as Triangle is clockwise winding (and XNA uses -z for into screen)
    var plane = new THREE.Plane();
    plane.normal = new THREE.Vector3().copy( f1 ).cross( f0 ).normalize();
    plane.constant = plane.normal.dot( a );
    
    return ns.collision.testAABBPlane( aabb, plane );

  }


  // sphere1: <THREE.Sphere>
  // sphere2: <THREE.Sphere>
  ns.collision.testSphereSphere = function ( sphere1, sphere2 ) {

    var radiusSum = sphere1.radius + sphere2.radius;

    return sphere1.center.distanceToSquared( sphere2.center ) <= ( radiusSum * radiusSum );

  };

  // Section 5.1.3
  // sphere: <THREE.Sphere>
  // aabb: <THREE.Box3>

  ns.collision.testSphereAABB = function ( sphere, aabb ) {

    var sqDist = 0;

    if ( sphere.center.x < aabb.min.x ) { sqDist += ( aabb.min.x - sphere.center.x ) * ( aabb.min.x - sphere.center.x ); }
    if ( sphere.center.x > aabb.max.x ) { sqDist += ( sphere.center.x - aabb.max.x ) * ( sphere.center.x - aabb.max.x ); }

    if ( sphere.center.y < aabb.min.y ) { sqDist += ( aabb.min.y - sphere.center.y ) * ( aabb.min.y - sphere.center.y ); }
    if ( sphere.center.y > aabb.max.y ) { sqDist += ( sphere.center.y - aabb.max.y ) * ( sphere.center.y - aabb.max.y ); }

    if ( sphere.center.z < aabb.min.z ) { sqDist += ( aabb.min.z - sphere.center.z ) * ( aabb.min.z - sphere.center.z ); }
    if ( sphere.center.z > aabb.max.z ) { sqDist += ( sphere.center.z - aabb.max.z ) * ( sphere.center.z - aabb.max.z ); }

    return sqDist <= sphere.radius * sphere.radius;

  }


  //http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

  // sphere: <THREE.Sphere>
  // a: <THREE.Vector3>, // vertex of a triangle
  // b: <THREE.Vector3>, // vertex of a triangle
  // c: <THREE.Vector3>, // vertex of a triangle
  // normal: <THREE.Vector3>, // normal of a triangle
  ns.collision.testSphereTriangle = function ( sphere, a, b, c, normal ) {
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

    var distance = Math.sqrt( d * d / e ) - sphere.radius - 1,
        contactPoint = new THREE.Vector3(),
        negatedNormal = new THREE.Vector3( -normal.x, -normal.y, -normal.z );

    contactPoint.copy( sphere.center ).add( negatedNormal.multiplyScalar( distance ) );

    return {
      distance    : distance,
      contactPoint: contactPoint
    };

  };

  // based on Real-Time Collision Detection Section 5.3.4
  // p: <THREE.Vector3>, // line3.start
  // q: <THREE.Vector3>, // line3.end
  // a: <THREE.Vector3>, // triangle.a
  // b: <THREE.Vector3>, // triangle.b
  // c: <THREE.Vector3>, // triangle.c
  // normal: <THREE.Vector3>, // triangle.normal, optional

  // var scalarTriple = function ( a, b, c ) {

  //   var m = b.clone().cross( c );
  //   return a.dot( m );

  // }

  // var vectorTriple = function ( a, b, c ) {

  //   var m = b.clone().cross( c );
  //   return a.clone().cross( m );

  // }

  // ns.collision.testLineTriangle = function ( p, q, a, b, c, precision ) {

  //   var pq = q.clone().sub( p ),
  //       pa = a.clone().sub( p ),
  //       pb = b.clone().sub( p ),
  //       pc = c.clone().sub( p ),
  //       u, v, w;

  //   u = scalarTriple( pq, pc, pb );

  //   if ( u < 0 ) { return false; }

  //   v = scalarTriple( pq, pa, pc );

  //   if ( v < 0 ) { return false; }

  //   w = scalarTriple( pq, pb, pa );

  //   if ( w < 0 ) { return false; }

  //   var denom = 1 / ( u + v + w );
  //   u *= denom;
  //   v *= denom;
  //   w *= denom;

  //   var au = a.clone().multiplyScalar( u ),
  //       bv = b.clone().multiplyScalar( v ),
  //       cw = c.clone().multiplyScalar( w ),
  //       contactPoint = au.clone().add( bv ).add( cw );

  //   return {
  //     contactPoint: contactPoint
  //   }

  // }

  // based on Real-Time Collision Detection Section 5.3.4
  // p: <THREE.Vector3>, // line3.start
  // q: <THREE.Vector3>, // line3.end
  // a: <THREE.Vector3>, // triangle.a
  // b: <THREE.Vector3>, // triangle.b
  // c: <THREE.Vector3>, // triangle.c
  ns.collision.testSegmentTriangle = function ( p, q, a, b, c ) {
   
    var ab = b.clone().sub( a );
    var ac = c.clone().sub( a );
    var qp = p.clone().sub( q );
   
    var n = ab.clone().cross( ac );
   
    var d = qp.dot( n );
    if ( d <= 0 ) { return false; }
   
    var ap = p.clone().sub( a );
    var t = ap.dot( n );
   
    if ( t < 0 ) { return false; }
    if ( t > d ) { return false; }
   
    var e = qp.clone().cross( ap );
    var v = ac.dot( e );
   
    if ( v < 0 || v > d ) { return false; }
   
    var w = ab.clone().dot( e ) * -1;
   
    if ( w < 0 || v + w > d ) { return false; }
   
    var ood = 1 / d;
    t *= ood;
    v *= ood;
    w *= ood;
    var u = 1 - v - w;
   
    var au = a.clone().multiplyScalar( u ),
        bv = b.clone().multiplyScalar( v ),
        cw = c.clone().multiplyScalar( w ),
        contactPoint = au.clone().add( bv ).add( cw );
   
    return {
      contactPoint: contactPoint
    }
  }

} )( THREE, THREEFIELD );


/*!
 * @author yomotsu http://yomotsu.net/
 * MIT License
 */

var MW = {};

// @author yomotsu
// MIT License

MW.triangle = {}

MW.triangle.makeBoundingBox = function ( triangle ) {

  var bb = new THREE.Box3();

  bb.min = bb.min.min( triangle.a );
  bb.min = bb.min.min( triangle.b );
  bb.min = bb.min.min( triangle.c );

  bb.max = bb.max.max( triangle.a );
  bb.max = bb.max.max( triangle.b );
  bb.max = bb.max.max( triangle.c );

  return bb;

}

MW.triangle.makeBoundingSphere = function ( triangle, normal ) {
 
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

;( function ( THREE, ns ) {

  'use strict';

  ns.collision = {};

  // aabb: <THREE.Box3>
  // Plane: <THREE.Plane>
  ns.collision.isIntersectionAABBPlane = function ( aabb, Plane ) {

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
  ns.collision.isIntersectionTriangleAABB = function ( a, b, c, aabb ) {

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
    
    return ns.collision.isIntersectionAABBPlane( aabb, plane );

  }


  // sphere1: <THREE.Sphere>
  // sphere2: <THREE.Sphere>
  ns.collision.isIntersectionSphereSphere = function ( sphere1, sphere2 ) {

    var radiusSum = sphere1.radius + sphere2.radius;

    return sphere1.center.distanceToSquared( sphere2.center ) <= ( radiusSum * radiusSum );

  };

  // Section 5.1.3
  // sphere: <THREE.Sphere>
  // aabb: <THREE.Box3>

  ns.collision.isIntersectionSphereAABB = function ( sphere, aabb ) {

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
  ns.collision.isIntersectionSphereTriangle = function ( sphere, a, b, c, normal ) {
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

  // ns.collision.isIntersectionLineTriangle = function ( p, q, a, b, c, precision ) {

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

  ns.collision.testSegmentTriangle = function ( p, q, a, b, c ) {

    var ab = b.clone().sub( a );
    var ac = c.clone().sub( a );
    var qp = p.clone().sub( q );

    var n = ab.clone().cross( ac );

    var d = qp.dot( n );
    if ( d <= 0 ) { return false; }

    var ap = p.clone().sub( a );
    var t = ap.dot( n );

    if ( t < 0 ) { return 0; }
    if ( t > d ) { return 0; }

    var e = qp.clone().cross( ap );
    var v = ac.dot( e );

    if ( v < 0 || v > d ) { return 0; }

    var w = ab.clone().dot( e ) * -1;

    if ( w < 0 || v + w > d ) { return 0; }

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

} )( THREE, MW );


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
      object.world = this;

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

} )( THREE, MW );

// @author yomotsu
// MIT License

// OcTree with Morton Order
// based on http://marupeke296.com/COL_3D_No15_Octree.html
//
//       +------+------+
//       |\   2  \   3  \
//       | +------+------+
//       + |\      \      \
//       |\| +------+------+
//       | + |      |      |
//       +0|\|   6  |   7  |
//        \| +------+------+
//         + |      |      |
//    y     \|   4  |   5  |
//    |      +------+------+
//    +--x
//     \
//      z
//
//
//       +------+------+
//       |\   6  \   7  \
//       | +------+------+
//       + |\      \      \
//       |\| +------+------+
//       | + |      |      |
//       +4|\|   2  |   3  |
//        \| +------+------+
//         + |      |      |
//  z y     \|   0  |   1  |
//   \|      +------+------+
//    +--x
//

;( function ( THREE, ns ) {

  'use strict';

  // min: <THREE.Vector3>
  // max: <THREE.Vector3>
  // maxDepth: <Number>
  ns.Octree = function ( min, max, maxDepth ) {

    this.min = min;
    this.max = max;
    this.maxDepth = maxDepth;
    this.nodes = [];

    var i, length, depth, mortonNumber,
        pow2, pow4,
        indexX, indexY, indexZ,
        nodeBoxSize = new THREE.Vector3(),
        nodeBoxMin = new THREE.Vector3(),
        nodeBoxMax = new THREE.Vector3();

    for ( depth = 0; depth < this.maxDepth; depth ++ ) {

      this.nodes.push( [] );
      pow2 = Math.pow( 2, depth );
      pow4 = Math.pow( 4, depth );
      nodeBoxSize.subVectors( this.max, this.min ).divideScalar( pow2 );

      for ( i = 0, length = Math.pow( 8, depth ); i < length; i ++ ) {

        indexX = i % pow2;
        indexY = ( i / pow4 )|0;
        indexZ = ( ( i / pow2 )|0 ) % pow2;

        nodeBoxMin.set(
          this.min.x + indexX * nodeBoxSize.x,
          this.min.y + indexY * nodeBoxSize.y,
          this.min.z + indexZ * nodeBoxSize.z
        );
        nodeBoxMax.copy( nodeBoxMin ).add( nodeBoxSize );

        mortonNumber = ns.Octree.getMortonNumber( indexX, indexY, indexZ );
        this.nodes[ depth ][ mortonNumber ] = new ns.OctreeNode( this, depth, mortonNumber, nodeBoxMin, nodeBoxMax );

      }

    }

  }

  ns.Octree.prototype = {

    constructor: ns.Octree,

    importThreeMesh: function ( threeMesh ) {


      var i, ii, l, ll,
          vec3 = new THREE.Vector3(),
          geometry,
          geometryId,
          face,
          normal,
          index,
          count,
          start,
          a, b, c,
        	vA  = new THREE.Vector3(),
        	vB  = new THREE.Vector3(),
        	vC  = new THREE.Vector3(),
        	vnA = new THREE.Vector3(),
        	vnB = new THREE.Vector3(),
        	vnC = new THREE.Vector3(),
          ab  = new THREE.Vector3(),
          cb  = new THREE.Vector3(),
          faceNormal;

      threeMesh.updateMatrix();

      geometryId = threeMesh.geometry.uuid;
      geometry   = threeMesh.geometry.clone();
      geometry.applyMatrix( threeMesh.matrix );
      geometry.computeVertexNormals();

      if ( geometry instanceof THREE.BufferGeometry ) {

        if ( geometry.index !== undefined ) {

          var indices   = geometry.index.array;
          var positions = geometry.attributes.position.array;
          var normals   = geometry.attributes.normal.array;
          var offsets   = geometry.groups;

          if ( offsets.length === 0 ) {

            offsets = [ { start: 0, count: indices.length, index: 0 } ];

          }

          for ( i = 0, l = offsets.length; i < l; ++ i ) {
            
            start  = offsets[ i ].start;
            count  = offsets[ i ].count;
            index  = offsets[ i ].materialIndex;

            for ( ii = start, ll = start + count; ii < ll; ii += 3 ) {

              a = index + indices[ ii ];
              b = index + indices[ ii + 1 ];
              c = index + indices[ ii + 2 ];

              vA = vec3.fromArray( positions, a * 3 ).clone();
              vB = vec3.fromArray( positions, b * 3 ).clone();
              vC = vec3.fromArray( positions, c * 3 ).clone();

              // https://github.com/mrdoob/three.js/issues/4691
              // make face normal
              cb.subVectors( vC, vB );
              ab.subVectors( vA, vB );
              faceNormal = cb.cross( ab ).normalize().clone();

              face = new ns.Face(
                vA,
                vB,
                vC,
                faceNormal,
                geometryId
              );

              this.addFace( face );

            }

          }

        }

        return;

      }

      geometry.computeFaceNormals();

      for ( i = 0, l = geometry.faces.length; i < l; i ++ ) {

        face = new ns.Face(
          geometry.vertices[ geometry.faces[ i ].a ],
          geometry.vertices[ geometry.faces[ i ].b ],
          geometry.vertices[ geometry.faces[ i ].c ],
          geometry.faces[ i ].normal,
          geometryId
        );
        this.addFace( face );

      }

    },

    addFace: function ( face ) {

      var i, ii, l, ll, node, targetNodes = [], tmp = [], isIntersected;

      targetNodes = this.nodes[ 0 ].slice( 0 );

      for ( i = 0, l = this.maxDepth; i < l; i ++ ) {

        for ( ii = 0, ll = targetNodes.length; ii < ll; ii ++ ) {

          node = targetNodes[ ii ];
          isIntersected = ns.collision.isIntersectionTriangleAABB( face.a, face.b, face.c, node );

          if ( isIntersected ) {

            node.trianglePool.push( face );

            if ( i + 1 !== this.maxDepth ) {

              tmp = tmp.concat( node.getChildNodes() );

            }

          }

        }

        if ( tmp.length === 0 ) {

          break;

        }

        targetNodes = tmp.slice( 0 );
        tmp.length = 0;

      }

    },

    removeFace: function ( meshID ) {},

    getIntersectedNodes: function ( sphere, depth ) {

      var i, ii, l, ll, node, targetNodes = [], tmp = [],
          isIntersected, intersectedNodes = [], isAtMaxDepth;

      isIntersected = ns.collision.isIntersectionSphereAABB( sphere, this );

      if ( !isIntersected ) {

        return [];

      }

      targetNodes = this.nodes[ 0 ].slice( 0 );

      for ( i = 0, l = depth; i < l; i ++ ) {

        for ( ii = 0, ll = targetNodes.length; ii < ll; ii ++ ) {

          node = targetNodes[ ii ];
          isIntersected = ns.collision.isIntersectionSphereAABB( sphere, node );

          if ( isIntersected ) {

            isAtMaxDepth = ( i + 1 === depth );

            if ( isAtMaxDepth ) {

              if ( node.trianglePool.length !== 0 ) {

                intersectedNodes.push( node );

              }

            } else {

              tmp = tmp.concat( node.getChildNodes() );

            }

          }

        }

        targetNodes = tmp.slice( 0 );
        tmp.length = 0;

      }

      return intersectedNodes;

    }

  }

  ns.Octree.separate3Bit = function ( n ) {

    n = ( n | n << 8 ) & 0x0000f00f;
    n = ( n | n << 4 ) & 0x000c30c3;
    n = ( n | n << 2 ) & 0x00249249;
    return n;

  }

  ns.Octree.getMortonNumber = function ( x, y, z ) {

    return ns.Octree.separate3Bit( x ) |
           ns.Octree.separate3Bit( y ) << 1 |
           ns.Octree.separate3Bit( z ) << 2;

  }

  ns.Octree.uniqTriangkesfromNodes = function ( nodes ) {

    var i, ii, iii, l, ll, lll, uniq = [], isContained = false;

    if ( nodes.length === 0 ) {

      return [];

    } else if ( nodes.length === 1 ) {

      return nodes[ 0 ].trianglePool.slice( 0 );

    }

    for ( i = 0, l = nodes.length; i < l; i ++ ) {

      for ( ii = 0, ll = nodes[ i ].trianglePool.length; ii < ll; ii ++ ) {

        for ( iii = 0, lll = uniq.length; iii < lll; iii ++ ) {

          if ( nodes[ i ].trianglePool[ ii ] === uniq[ iii ] ) {

            isContained = true;

          }

        }

        if ( !isContained ) {

          uniq.push( nodes[ i ].trianglePool[ ii ] );

        }

        isContained = false;

      }

    }

    return uniq;

  }

  //

  ns.OctreeNode = function ( tree, depth, mortonNumber, min, max ) {

    this.tree = tree;
    this.depth = depth;
    this.mortonNumber = mortonNumber;
    this.min = new THREE.Vector3( min.x, min.y, min.z );
    this.max = new THREE.Vector3( max.x, max.y, max.z );
    this.trianglePool = [];

  }

  ns.OctreeNode.prototype = {

    constructor: ns.OctreeNode,

    getParentNode: function () {

      if ( this.depth === 0 ) {

        return null;

      }

      this.tree.nodes[ this.depth ][ this.mortonNumber >> 3 ];

    },

    getChildNodes: function () {

      if ( this.tree.maxDepth === this.depth ) {

        return null;

      }

      var firstChild = this.mortonNumber << 3;

      return [
        this.tree.nodes[ this.depth + 1 ][ firstChild ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 1 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 2 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 3 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 4 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 5 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 6 ],
        this.tree.nodes[ this.depth + 1 ][ firstChild + 7 ]
      ];

    }

  }

  //

  // a: <THREE.Vector3>
  // b: <THREE.Vector3>
  // c: <THREE.Vector3>
  // normal: <THREE.Vector3>
  // meshID: <String>
  ns.Face = function ( a, b, c, normal, meshID ) {

    this.a = a.clone();
    this.b = b.clone();
    this.c = c.clone();
    this.normal = normal.clone();
    this.meshID = meshID;

  }

  ns.Face.prototype = {

    constructor: ns.Face

  }

  // origin   : <THREE.Vector3>
  // direction: <THREE.Vector3>
  // distance : <Float>
  ns.Ray = function ( origin, direction, distance ) {
    this.origin = origin;
    this.direction = direction;
    this.distance = distance;
  }

} )( THREE, MW );

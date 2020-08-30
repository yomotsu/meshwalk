/*!
* meshwalk
 * https://github.com/yomotsu/meshwalk.js
 * (c) 2015 @yomotsu
 * Released under the MIT License.
 */
var THREE$1; // bind on install

var onInstallHandlers = [];
function install(_THREE) {
  if (THREE$1 && _THREE === THREE$1) {
    console.error('[THREE] already installed. `install` should be called only once.');
    return;
  }

  THREE$1 = _THREE;
  onInstallHandlers.forEach(function (handler) {
    return handler();
  });
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function");
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      writable: true,
      configurable: true
    }
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
    return o.__proto__ || Object.getPrototypeOf(o);
  };
  return _getPrototypeOf(o);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === "undefined" || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === "function") return true;

  try {
    Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return self;
}

function _possibleConstructorReturn(self, call) {
  if (call && (typeof call === "object" || typeof call === "function")) {
    return call;
  }

  return _assertThisInitialized(self);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();

  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
        result;

    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;

      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }

    return _possibleConstructorReturn(this, result);
  };
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }

  return object;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== "undefined" && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);

      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);

      if (desc.get) {
        return desc.get.call(receiver);
      }

      return desc.value;
    };
  }

  return _get(target, property, receiver || target);
}

var vec3;
var vec3_0;
var vec3_1;
var center;
var extents;
onInstallHandlers.push(function () {
  vec3 = new THREE$1.Vector3();
  vec3_0 = new THREE$1.Vector3();
  vec3_1 = new THREE$1.Vector3();
  center = new THREE$1.Vector3();
  extents = new THREE$1.Vector3();
}); // aabb: <THREE.Box3>
// Plane: <THREE.Plane>

function isIntersectionAABBPlane(aabb, Plane) {
  center.addVectors(aabb.max, aabb.min).multiplyScalar(0.5);
  extents.subVectors(aabb.max, center);
  var r = extents.x * Math.abs(Plane.normal.x) + extents.y * Math.abs(Plane.normal.y) + extents.z * Math.abs(Plane.normal.z);
  var s = Plane.normal.dot(center) - Plane.constant;
  return Math.abs(s) <= r;
}
var v0;
var v1;
var v2;
var f0;
var f1;
var f2;
var a00;
var a01;
var a02;
var a10;
var a11;
var a12;
var a20;
var a21;
var a22;
var plane;
onInstallHandlers.push(function () {
  v0 = new THREE$1.Vector3();
  v1 = new THREE$1.Vector3();
  v2 = new THREE$1.Vector3();
  f0 = new THREE$1.Vector3();
  f1 = new THREE$1.Vector3();
  f2 = new THREE$1.Vector3();
  a00 = new THREE$1.Vector3();
  a01 = new THREE$1.Vector3();
  a02 = new THREE$1.Vector3();
  a10 = new THREE$1.Vector3();
  a11 = new THREE$1.Vector3();
  a12 = new THREE$1.Vector3();
  a20 = new THREE$1.Vector3();
  a21 = new THREE$1.Vector3();
  a22 = new THREE$1.Vector3();
  plane = new THREE$1.Plane();
}); // based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
//
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// aabb: <THREE.Box3>

function isIntersectionTriangleAABB(a, b, c, aabb) {
  var p0, p1, p2, r; // Compute box center and extents of AABoundingBox (if not already given in that format)

  center.addVectors(aabb.max, aabb.min).multiplyScalar(0.5);
  extents.subVectors(aabb.max, center); // Translate triangle as conceptually moving AABB to origin

  v0.subVectors(a, center);
  v1.subVectors(b, center);
  v2.subVectors(c, center); // Compute edge vectors for triangle

  f0.subVectors(v1, v0);
  f1.subVectors(v2, v1);
  f2.subVectors(v0, v2); // Test axes a00..a22 (category 3)

  a00.set(0, -f0.z, f0.y);
  a01.set(0, -f1.z, f1.y);
  a02.set(0, -f2.z, f2.y);
  a10.set(f0.z, 0, -f0.x);
  a11.set(f1.z, 0, -f1.x);
  a12.set(f2.z, 0, -f2.x);
  a20.set(-f0.y, f0.x, 0);
  a21.set(-f1.y, f1.x, 0);
  a22.set(-f2.y, f2.x, 0); // Test axis a00

  p0 = v0.dot(a00);
  p1 = v1.dot(a00);
  p2 = v2.dot(a00);
  r = extents.y * Math.abs(f0.z) + extents.z * Math.abs(f0.y);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a01


  p0 = v0.dot(a01);
  p1 = v1.dot(a01);
  p2 = v2.dot(a01);
  r = extents.y * Math.abs(f1.z) + extents.z * Math.abs(f1.y);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a02


  p0 = v0.dot(a02);
  p1 = v1.dot(a02);
  p2 = v2.dot(a02);
  r = extents.y * Math.abs(f2.z) + extents.z * Math.abs(f2.y);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a10


  p0 = v0.dot(a10);
  p1 = v1.dot(a10);
  p2 = v2.dot(a10);
  r = extents.x * Math.abs(f0.z) + extents.z * Math.abs(f0.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a11


  p0 = v0.dot(a11);
  p1 = v1.dot(a11);
  p2 = v2.dot(a11);
  r = extents.x * Math.abs(f1.z) + extents.z * Math.abs(f1.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a12


  p0 = v0.dot(a12);
  p1 = v1.dot(a12);
  p2 = v2.dot(a12);
  r = extents.x * Math.abs(f2.z) + extents.z * Math.abs(f2.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a20


  p0 = v0.dot(a20);
  p1 = v1.dot(a20);
  p2 = v2.dot(a20);
  r = extents.x * Math.abs(f0.y) + extents.y * Math.abs(f0.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a21


  p0 = v0.dot(a21);
  p1 = v1.dot(a21);
  p2 = v2.dot(a21);
  r = extents.x * Math.abs(f1.y) + extents.y * Math.abs(f1.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test axis a22


  p0 = v0.dot(a22);
  p1 = v1.dot(a22);
  p2 = v2.dot(a22);
  r = extents.x * Math.abs(f2.y) + extents.y * Math.abs(f2.x);

  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
    return false; // Axis is a separating axis
  } // Test the three axes corresponding to the face normals of AABB b (category 1).
  // Exit if...
  // ... [-extents.x, extents.x] and [min(v0.x,v1.x,v2.x), max(v0.x,v1.x,v2.x)] do not overlap


  if (Math.max(v0.x, v1.x, v2.x) < -extents.x || Math.min(v0.x, v1.x, v2.x) > extents.x) {
    return false;
  } // ... [-extents.y, extents.y] and [min(v0.y,v1.y,v2.y), max(v0.y,v1.y,v2.y)] do not overlap


  if (Math.max(v0.y, v1.y, v2.y) < -extents.y || Math.min(v0.y, v1.y, v2.y) > extents.y) {
    return false;
  } // ... [-extents.z, extents.z] and [min(v0.z,v1.z,v2.z), max(v0.z,v1.z,v2.z)] do not overlap


  if (Math.max(v0.z, v1.z, v2.z) < -extents.z || Math.min(v0.z, v1.z, v2.z) > extents.z) {
    return false;
  } // Test separating axis corresponding to triangle face normal (category 2)
  // Face Normal is -ve as Triangle is clockwise winding (and XNA uses -z for into screen)


  plane.normal.copy(f1).cross(f0).normalize();
  plane.constant = plane.normal.dot(a);
  return isIntersectionAABBPlane(aabb, plane);
} // sphere1: <THREE.Sphere>
// sphere: <THREE.Sphere>
// aabb: <THREE.Box3>

function isIntersectionSphereAABB(sphere, aabb) {
  var sqDist = 0;
  if (sphere.center.x < aabb.min.x) sqDist += (aabb.min.x - sphere.center.x) * (aabb.min.x - sphere.center.x);
  if (sphere.center.x > aabb.max.x) sqDist += (sphere.center.x - aabb.max.x) * (sphere.center.x - aabb.max.x);
  if (sphere.center.y < aabb.min.y) sqDist += (aabb.min.y - sphere.center.y) * (aabb.min.y - sphere.center.y);
  if (sphere.center.y > aabb.max.y) sqDist += (sphere.center.y - aabb.max.y) * (sphere.center.y - aabb.max.y);
  if (sphere.center.z < aabb.min.z) sqDist += (aabb.min.z - sphere.center.z) * (aabb.min.z - sphere.center.z);
  if (sphere.center.z > aabb.max.z) sqDist += (sphere.center.z - aabb.max.z) * (sphere.center.z - aabb.max.z);
  return sqDist <= sphere.radius * sphere.radius;
}
var A;
var B;
var C;
var V;
var AB;
var BC;
var CA;
var Q1;
var Q2;
var Q3;
var QC;
var QA;
var QB;
var negatedNormal;
onInstallHandlers.push(function () {
  A = new THREE$1.Vector3();
  B = new THREE$1.Vector3();
  C = new THREE$1.Vector3();
  V = new THREE$1.Vector3();
  AB = new THREE$1.Vector3();
  BC = new THREE$1.Vector3();
  CA = new THREE$1.Vector3();
  Q1 = new THREE$1.Vector3();
  Q2 = new THREE$1.Vector3();
  Q3 = new THREE$1.Vector3();
  QC = new THREE$1.Vector3();
  QA = new THREE$1.Vector3();
  QB = new THREE$1.Vector3();
  negatedNormal = new THREE$1.Vector3();
}); //http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459
// sphere: <THREE.Sphere>
// a: <THREE.Vector3>, // vertex of a triangle
// b: <THREE.Vector3>, // vertex of a triangle
// c: <THREE.Vector3>, // vertex of a triangle
// normal: <THREE.Vector3>, // normal of a triangle

function isIntersectionSphereTriangle(sphere, a, b, c, normal) {
  // http://realtimecollisiondetection.net/blog/?p=103
  // vs plain of triangle face
  A.subVectors(a, sphere.center);
  B.subVectors(b, sphere.center);
  C.subVectors(c, sphere.center);
  var rr = sphere.radius * sphere.radius;
  V.crossVectors(vec3_0.subVectors(B, A), vec3_1.subVectors(C, A));
  var d = A.dot(V);
  var e = V.dot(V);

  if (d * d > rr * e) {
    return false;
  } // vs triangle vertex


  var aa = A.dot(A);
  var ab = A.dot(B);
  var ac = A.dot(C);
  var bb = B.dot(B);
  var bc = B.dot(C);
  var cc = C.dot(C);

  if (aa > rr & ab > aa & ac > aa || bb > rr & ab > bb & bc > bb || cc > rr & ac > cc & bc > cc) {
    return false;
  } // vs edge


  AB.subVectors(B, A);
  BC.subVectors(C, B);
  CA.subVectors(A, C);
  var d1 = ab - aa;
  var d2 = bc - bb;
  var d3 = ac - cc;
  var e1 = AB.dot(AB);
  var e2 = BC.dot(BC);
  var e3 = CA.dot(CA);
  Q1.subVectors(A.multiplyScalar(e1), AB.multiplyScalar(d1));
  Q2.subVectors(B.multiplyScalar(e2), BC.multiplyScalar(d2));
  Q3.subVectors(C.multiplyScalar(e3), CA.multiplyScalar(d3));
  QC.subVectors(C.multiplyScalar(e1), Q1);
  QA.subVectors(A.multiplyScalar(e2), Q2);
  QB.subVectors(B.multiplyScalar(e3), Q3);

  if (Q1.dot(Q1) > rr * e1 * e1 && Q1.dot(QC) >= 0 || Q2.dot(Q2) > rr * e2 * e2 && Q2.dot(QA) >= 0 || Q3.dot(Q3) > rr * e3 * e3 && Q3.dot(QB) >= 0) {
    return false;
  }

  var distance = Math.sqrt(d * d / e) - sphere.radius - 1;
  negatedNormal.set(-normal.x, -normal.y, -normal.z);
  var contactPoint = sphere.center.clone().add(negatedNormal.multiplyScalar(distance));
  return {
    distance: distance,
    contactPoint: contactPoint
  };
} // based on Real-Time Collision Detection Section 5.3.4
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
// export function isIntersectionLineTrianglefunction ( p, q, a, b, c, precisio{
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

var ab;
var ac;
var qp;
var n;
var ap;
var e;
var au;
var bv;
var cw;
onInstallHandlers.push(function () {
  ab = new THREE$1.Vector3();
  ac = new THREE$1.Vector3();
  qp = new THREE$1.Vector3();
  n = new THREE$1.Vector3();
  ap = new THREE$1.Vector3();
  e = new THREE$1.Vector3();
  au = new THREE$1.Vector3();
  bv = new THREE$1.Vector3();
  cw = new THREE$1.Vector3();
});
function testSegmentTriangle(p, q, a, b, c) {
  ab.subVectors(b, a);
  ac.subVectors(c, a);
  qp.subVectors(p, q);
  n.copy(ab).cross(ac);
  var d = qp.dot(n);
  if (d <= 0) return false;
  ap.subVectors(p, a);
  var t = ap.dot(n);
  if (t < 0) return 0;
  if (t > d) return 0;
  e.copy(qp).cross(ap);
  var v = ac.dot(e);
  if (v < 0 || v > d) return 0;
  var w = vec3.copy(ab).dot(e) * -1;
  if (w < 0 || v + w > d) return 0;
  var ood = 1 / d;
  t *= ood;
  v *= ood;
  w *= ood;
  var u = 1 - v - w;
  au.copy(a).multiplyScalar(u);
  bv.copy(b).multiplyScalar(v);
  cw.copy(c).multiplyScalar(w);
  var contactPoint = au.clone().add(bv).add(cw);
  return {
    contactPoint: contactPoint
  };
}

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
// min: <THREE.Vector3>
// max: <THREE.Vector3>
// maxDepth: <Number>

var Octree = /*#__PURE__*/function () {
  function Octree(min, max, maxDepth) {
    _classCallCheck(this, Octree);

    this.min = min;
    this.max = max;
    this.maxDepth = maxDepth;
    this.nodes = [];
    this.isOctree = true;
    var nodeBoxSize = new THREE$1.Vector3();
    var nodeBoxMin = new THREE$1.Vector3();
    var nodeBoxMax = new THREE$1.Vector3();

    for (var depth = 0; depth < this.maxDepth; depth++) {
      this.nodes.push([]);
      var pow2 = Math.pow(2, depth);
      var pow4 = Math.pow(4, depth);
      nodeBoxSize.subVectors(this.max, this.min).divideScalar(pow2);

      for (var i = 0, length = Math.pow(8, depth); i < length; i++) {
        var indexX = i % pow2;
        var indexY = i / pow4 | 0;
        var indexZ = (i / pow2 | 0) % pow2;
        nodeBoxMin.set(this.min.x + indexX * nodeBoxSize.x, this.min.y + indexY * nodeBoxSize.y, this.min.z + indexZ * nodeBoxSize.z);
        nodeBoxMax.copy(nodeBoxMin).add(nodeBoxSize);
        var mortonNumber = Octree.getMortonNumber(indexX, indexY, indexZ);
        this.nodes[depth][mortonNumber] = new OctreeNode(this, depth, mortonNumber, nodeBoxMin, nodeBoxMax);
      }
    }
  }

  _createClass(Octree, [{
    key: "importThreeMesh",
    value: function importThreeMesh(threeMesh) {
      threeMesh.updateMatrix();
      var geometryId = threeMesh.geometry.uuid;
      var geometry = threeMesh.geometry.clone();
      geometry.applyMatrix4(threeMesh.matrix);
      geometry.computeVertexNormals();

      if (geometry instanceof THREE$1.BufferGeometry) {
        if (geometry.index !== undefined) {
          var indices = geometry.index.array;
          var positions = geometry.attributes.position.array; // const normals   = geometry.attributes.normal.array;

          var offsets = geometry.groups.length !== 0 ? geometry.groups : [{
            start: 0,
            count: indices.length,
            materialIndex: 0
          }];

          for (var i = 0, l = offsets.length; i < l; ++i) {
            var start = offsets[i].start;
            var count = offsets[i].count;
            var index = offsets[i].materialIndex;

            for (var ii = start, ll = start + count; ii < ll; ii += 3) {
              var a = index + indices[ii];
              var b = index + indices[ii + 1];
              var c = index + indices[ii + 2];
              var vA = new THREE$1.Vector3().fromArray(positions, a * 3);
              var vB = new THREE$1.Vector3().fromArray(positions, b * 3);
              var vC = new THREE$1.Vector3().fromArray(positions, c * 3); // https://github.com/mrdoob/three.js/issues/4691
              // make face normal

              var cb = new THREE$1.Vector3().subVectors(vC, vB);
              var ab = new THREE$1.Vector3().subVectors(vA, vB);
              var faceNormal = cb.cross(ab).normalize().clone();
              var face = new Face(vA, vB, vC, faceNormal, geometryId);
              this.addFace(face);
            }
          }
        }

        return;
      }

      geometry.computeFaceNormals();

      for (var _i = 0, _l = geometry.faces.length; _i < _l; _i++) {
        var _face = new Face(geometry.vertices[geometry.faces[_i].a], geometry.vertices[geometry.faces[_i].b], geometry.vertices[geometry.faces[_i].c], geometry.faces[_i].normal, geometryId);

        this.addFace(_face);
      }
    }
  }, {
    key: "addFace",
    value: function addFace(face) {
      var tmp = [];
      var targetNodes = this.nodes[0].slice(0);

      for (var i = 0, l = this.maxDepth; i < l; i++) {
        for (var ii = 0, ll = targetNodes.length; ii < ll; ii++) {
          var node = targetNodes[ii];
          var isIntersected = isIntersectionTriangleAABB(face.a, face.b, face.c, node);

          if (isIntersected) {
            node.trianglePool.push(face);

            if (i + 1 !== this.maxDepth) {
              tmp = tmp.concat(node.getChildNodes());
            }
          }
        }

        if (tmp.length === 0) {
          break;
        }

        targetNodes = tmp.slice(0);
        tmp.length = 0;
      }
    }
  }, {
    key: "removeThreeMesh",
    value: function removeThreeMesh(meshID) {
      this.nodes.forEach(function (nodeDepth) {
        nodeDepth.forEach(function (node) {
          var newTrianglePool = [];
          node.trianglePool.forEach(function (face) {
            if (face.meshID !== meshID) {
              newTrianglePool.push(face);
            }
          });
          node.trianglePool = newTrianglePool;
        });
      });
    }
  }, {
    key: "getIntersectedNodes",
    value: function getIntersectedNodes(sphere, depth) {
      var tmp = [];
      var intersectedNodes = [];
      var isIntersected = isIntersectionSphereAABB(sphere, this);
      if (!isIntersected) return [];
      var targetNodes = this.nodes[0].slice(0);

      for (var i = 0, l = depth; i < l; i++) {
        for (var ii = 0, ll = targetNodes.length; ii < ll; ii++) {
          var node = targetNodes[ii];

          var _isIntersected = isIntersectionSphereAABB(sphere, node);

          if (_isIntersected) {
            var isAtMaxDepth = i + 1 === depth;

            if (isAtMaxDepth) {
              if (node.trianglePool.length !== 0) {
                intersectedNodes.push(node);
              }
            } else {
              tmp = tmp.concat(node.getChildNodes());
            }
          }
        }

        targetNodes = tmp.slice(0);
        tmp.length = 0;
      }

      return intersectedNodes;
    }
  }]);

  return Octree;
}();

Octree.separate3Bit = function (n) {
  n = (n | n << 8) & 0x0000f00f;
  n = (n | n << 4) & 0x000c30c3;
  n = (n | n << 2) & 0x00249249;
  return n;
};

Octree.getMortonNumber = function (x, y, z) {
  return Octree.separate3Bit(x) | Octree.separate3Bit(y) << 1 | Octree.separate3Bit(z) << 2;
};

Octree.uniqTrianglesFromNodes = function (nodes) {
  var uniq = [];
  var isContained = false;
  if (nodes.length === 0) return [];
  if (nodes.length === 1) return nodes[0].trianglePool.slice(0);

  for (var i = 0, l = nodes.length; i < l; i++) {
    for (var ii = 0, ll = nodes[i].trianglePool.length; ii < ll; ii++) {
      for (var iii = 0, lll = uniq.length; iii < lll; iii++) {
        if (nodes[i].trianglePool[ii] === uniq[iii]) {
          isContained = true;
        }
      }

      if (!isContained) {
        uniq.push(nodes[i].trianglePool[ii]);
      }

      isContained = false;
    }
  }

  return uniq;
}; //


var OctreeNode = /*#__PURE__*/function () {
  function OctreeNode(tree, depth, mortonNumber, min, max) {
    _classCallCheck(this, OctreeNode);

    this.tree = tree;
    this.depth = depth;
    this.mortonNumber = mortonNumber;
    this.min = new THREE$1.Vector3(min.x, min.y, min.z);
    this.max = new THREE$1.Vector3(max.x, max.y, max.z);
    this.trianglePool = [];
  }

  _createClass(OctreeNode, [{
    key: "getParentNode",
    value: function getParentNode() {
      if (this.depth === 0) return null;
      this.tree.nodes[this.depth][this.mortonNumber >> 3];
    }
  }, {
    key: "getChildNodes",
    value: function getChildNodes() {
      if (this.tree.maxDepth === this.depth) {
        return null;
      }

      var firstChild = this.mortonNumber << 3;
      return [this.tree.nodes[this.depth + 1][firstChild], this.tree.nodes[this.depth + 1][firstChild + 1], this.tree.nodes[this.depth + 1][firstChild + 2], this.tree.nodes[this.depth + 1][firstChild + 3], this.tree.nodes[this.depth + 1][firstChild + 4], this.tree.nodes[this.depth + 1][firstChild + 5], this.tree.nodes[this.depth + 1][firstChild + 6], this.tree.nodes[this.depth + 1][firstChild + 7]];
    }
  }]);

  return OctreeNode;
}(); //
// a: <THREE.Vector3>
// b: <THREE.Vector3>
// c: <THREE.Vector3>
// normal: <THREE.Vector3>
// meshID: <String>


var Face = function Face(a, b, c, normal, meshID) {
  _classCallCheck(this, Face);

  this.a = a.clone();
  this.b = b.clone();
  this.c = c.clone();
  this.normal = normal.clone();
  this.meshID = meshID;
}; // origin   : <THREE.Vector3>
// direction: <THREE.Vector3>
// distance : <Float>
// class Ray{
// 	constructor( origin, direction, distance ) {
// 		this.origin = origin;
// 		this.direction = direction;
// 		this.distance = distance;
// 	}
// }

var sphere;
onInstallHandlers.push(function () {
  sphere = new THREE$1.Sphere();
});
var World = /*#__PURE__*/function () {
  function World() {
    _classCallCheck(this, World);

    this.colliderPool = [];
    this.characterPool = [];
  }

  _createClass(World, [{
    key: "add",
    value: function add(object) {
      if (object.isOctree) {
        this.colliderPool.push(object);
      } else if (object.isCharacterController) {
        this.characterPool.push(object);
        object.world = this;
      }
    }
  }, {
    key: "step",
    value: function step(dt) {
      for (var i = 0, l = this.characterPool.length; i < l; i++) {
        var character = this.characterPool[i];
        var faces = void 0; // octree で絞られた node に含まれる face だけを
        // character に渡して判定する

        for (var ii = 0, ll = this.colliderPool.length; ii < ll; ii++) {
          var octree = this.colliderPool[ii];
          sphere.set(character.center, character.radius + character.groundPadding);
          var intersectedNodes = octree.getIntersectedNodes(sphere, octree.maxDepth);
          faces = Octree.uniqTrianglesFromNodes(intersectedNodes);
        }

        character.collisionCandidate = faces;
        character.update(dt);
      }
    }
  }]);

  return World;
}();

// based on https://github.com/mrdoob/eventdispatcher.js/
var EventDispatcher = /*#__PURE__*/function () {
  function EventDispatcher() {
    _classCallCheck(this, EventDispatcher);

    this._listeners = {};
  }

  _createClass(EventDispatcher, [{
    key: "addEventListener",
    value: function addEventListener(type, listener) {
      var listeners = this._listeners;

      if (listeners[type] === undefined) {
        listeners[type] = [];
      }

      if (listeners[type].indexOf(listener) === -1) {
        listeners[type].push(listener);
      }
    }
  }, {
    key: "hasEventListener",
    value: function hasEventListener(type, listener) {
      var listeners = this._listeners;
      return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(type, listener) {
      var listeners = this._listeners;
      var listenerArray = listeners[type];

      if (listenerArray !== undefined) {
        var index = listenerArray.indexOf(listener);

        if (index !== -1) {
          listenerArray.splice(index, 1);
        }
      }
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event) {
      var listeners = this._listeners;
      var listenerArray = listeners[event.type];

      if (listenerArray !== undefined) {
        event.target = this;
        var array = listenerArray.slice(0);

        for (var i = 0, l = array.length; i < l; i++) {
          array[i].call(this, event);
        }
      }
    }
  }]);

  return EventDispatcher;
}();

var FALL_VELOCITY = -20;
var JUMP_DURATION = 1000;
var PI_HALF = Math.PI * 0.5;
var PI_ONE_HALF = Math.PI * 1.5;
var direction2D;
var wallNormal2D;
var groundingHead;
var groundingTo;
var point1;
var point2;
var direction;
var translateScoped;
var translate;
onInstallHandlers.push(function () {
  direction2D = new THREE$1.Vector2();
  wallNormal2D = new THREE$1.Vector2();
  groundingHead = new THREE$1.Vector3();
  groundingTo = new THREE$1.Vector3();
  point1 = new THREE$1.Vector3();
  point2 = new THREE$1.Vector3();
  direction = new THREE$1.Vector3();
  translateScoped = new THREE$1.Vector3();
  translate = new THREE$1.Vector3();
});
var CharacterController = /*#__PURE__*/function (_EventDispatcher) {
  _inherits(CharacterController, _EventDispatcher);

  var _super = _createSuper(CharacterController);

  function CharacterController(object3d, radius) {
    var _this;

    _classCallCheck(this, CharacterController);

    _this = _super.call(this);
    _this.isCharacterController = true;
    _this.object = object3d;
    _this.center = _this.object.position.clone();
    _this.radius = radius;
    _this.groundPadding = .5;
    _this.maxSlopeGradient = Math.cos(50 * THREE$1.Math.DEG2RAD);
    _this.isGrounded = false;
    _this.isOnSlope = false;
    _this.isIdling = false;
    _this.isRunning = false;
    _this.isJumping = false;
    _this.direction = 0; // 0 to 2PI(=360deg) in rad

    _this.movementSpeed = 10; // Meters Per Second

    _this.velocity = new THREE$1.Vector3(0, -10, 0);
    _this.currentJumpPower = 0;
    _this.jumpStartTime = 0;
    _this.groundHeight = 0;
    _this.groundNormal = new THREE$1.Vector3();
    _this.collisionCandidate;
    _this.contactInfo = [];
    var isFirstUpdate = true;
    var wasGrounded;
    var wasOnSlope; // let wasIdling;

    var wasRunning;
    var wasJumping;

    _this._events = function () {
      // 初回のみ、過去状態を作るだけで終わり
      if (isFirstUpdate) {
        isFirstUpdate = false;
        wasGrounded = _this.isGrounded;
        wasOnSlope = _this.isOnSlope; // wasIdling   = this.isIdling;

        wasRunning = _this.isRunning;
        wasJumping = _this.isJumping;
        return;
      }

      if (!wasRunning && !_this.isRunning && _this.isGrounded && !_this.isIdling) {
        _this.isIdling = true;

        _this.dispatchEvent({
          type: 'startIdling'
        });
      } else if (!wasRunning && _this.isRunning && !_this.isJumping && _this.isGrounded || !wasGrounded && _this.isGrounded && _this.isRunning || wasOnSlope && !_this.isOnSlope && _this.isRunning && _this.isGrounded) {
        _this.isIdling = false;

        _this.dispatchEvent({
          type: 'startWalking'
        });
      } else if (!wasJumping && _this.isJumping) {
        _this.isIdling = false;

        _this.dispatchEvent({
          type: 'startJumping'
        });
      } else if (!wasOnSlope && _this.isOnSlope) {
        _this.dispatchEvent({
          type: 'startSliding'
        });
      } else if (wasGrounded && !_this.isGrounded && !_this.isJumping) {
        _this.dispatchEvent({
          type: 'startFalling'
        });
      }

      if (!wasGrounded && _this.isGrounded) ;

      wasGrounded = _this.isGrounded;
      wasOnSlope = _this.isOnSlope; // wasIdling   = this.isIdling;

      wasRunning = _this.isRunning;
      wasJumping = _this.isJumping;
    };

    return _this;
  }

  _createClass(CharacterController, [{
    key: "update",
    value: function update(dt) {
      // 状態をリセットしておく
      this.isGrounded = false;
      this.isOnSlope = false;
      this.groundHeight = -Infinity;
      this.groundNormal.set(0, 1, 0);

      this._updateGrounding();

      this._updateJumping();

      this._updatePosition(dt);

      this._collisionDetection();

      this._solvePosition();

      this._updateVelocity();

      this._events();
    }
  }, {
    key: "_updateVelocity",
    value: function _updateVelocity() {
      var frontDirection = -Math.cos(this.direction);
      var rightDirection = -Math.sin(this.direction);
      var isHittingCeiling = false;
      this.velocity.set(rightDirection * this.movementSpeed * this.isRunning, FALL_VELOCITY, frontDirection * this.movementSpeed * this.isRunning); // 急勾配や自由落下など、自動で付与される速度の処理

      if (this.contactInfo.length === 0 && !this.isJumping) {
        // 何とも衝突していないので、自由落下
        return;
      } else if (this.isGrounded && !this.isOnSlope && !this.isJumping) {
        // 通常の地面上にいる場合、ただしジャンプ開始時は除く
        this.velocity.y = 0;
      } else if (this.isOnSlope) {
        // TODO 0.2 はマジックナンバーなので、幾何学的な求め方を考える
        var slidingDownVelocity = FALL_VELOCITY;
        var horizontalSpeed = -slidingDownVelocity / (1 - this.groundNormal.y) * 0.2;
        this.velocity.x = this.groundNormal.x * horizontalSpeed;
        this.velocity.y = FALL_VELOCITY;
        this.velocity.z = this.groundNormal.z * horizontalSpeed;
      } else if (!this.isGrounded && !this.isOnSlope && this.isJumping) {
        // ジャンプの処理
        this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;
      } // 壁に向かった場合、壁方向の速度を0にする処理
      // vs walls and sliding on the wall


      direction2D.set(rightDirection, frontDirection); // const frontAngle = Math.atan2( direction2D.y, direction2D.x );

      var negativeFrontAngle = Math.atan2(-direction2D.y, -direction2D.x);

      for (var i = 0, l = this.contactInfo.length; i < l; i++) {
        var normal = this.contactInfo[i].face.normal; // var distance = this.contactInfo[ i ].distance;

        if (this.maxSlopeGradient < normal.y || this.isOnSlope) {
          // フェイスは地面なので、壁としての衝突の可能性はない。
          // 速度の減衰はしないでいい
          continue;
        }

        if (!isHittingCeiling && normal.y < 0) {
          isHittingCeiling = true;
        }

        wallNormal2D.set(normal.x, normal.z).normalize();
        var wallAngle = Math.atan2(wallNormal2D.y, wallNormal2D.x);

        if (Math.abs(negativeFrontAngle - wallAngle) >= PI_HALF && //  90deg
        Math.abs(negativeFrontAngle - wallAngle) <= PI_ONE_HALF // 270deg
        ) {
            // フェイスは進行方向とは逆方向、要は背中側の壁なので
            // 速度の減衰はしないでいい
            continue;
          } // 上記までの条件に一致しなければ、フェイスは壁
        // 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする


        wallNormal2D.set(direction2D.dot(wallNormal2D) * wallNormal2D.x, direction2D.dot(wallNormal2D) * wallNormal2D.y);
        direction2D.sub(wallNormal2D);
        this.velocity.x = direction2D.x * this.movementSpeed * this.isRunning;
        this.velocity.z = direction2D.y * this.movementSpeed * this.isRunning;
      } // ジャンプ中に天井にぶつかったら、ジャンプを中断する


      if (isHittingCeiling) {
        this.velocity.y = Math.min(0, this.velocity.y);
        this.isJumping = false;
      }
    }
  }, {
    key: "_updateGrounding",
    value: function _updateGrounding() {
      // "頭上からほぼ無限に下方向までの線 (segment)" vs "フェイス (triangle)" の
      // 交差判定を行う
      // もし、フェイスとの交差点が「頭上」から「下groundPadding」までの間だったら
      // 地面上 (isGrounded) にいることとみなす
      //
      //   ___
      //  / | \
      // |  |  | player sphere
      //  \_|_/
      //    |
      //---[+]---- ground
      //    |
      //    |
      //    | segment (player's head to almost -infinity)
      var groundContactInfo;
      var groundContactInfoTmp;
      var faces = this.collisionCandidate;
      groundingHead.set(this.center.x, this.center.y + this.radius, this.center.z);
      groundingTo.set(this.center.x, this.center.y - 1e10, this.center.z);

      for (var i = 0, l = faces.length; i < l; i++) {
        groundContactInfoTmp = testSegmentTriangle(groundingHead, groundingTo, faces[i].a, faces[i].b, faces[i].c);

        if (groundContactInfoTmp && !groundContactInfo) {
          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[i];
        } else if (groundContactInfoTmp && groundContactInfoTmp.contactPoint.y > groundContactInfo.contactPoint.y) {
          groundContactInfo = groundContactInfoTmp;
          groundContactInfo.face = faces[i];
        }
      }

      if (!groundContactInfo) {
        return;
      }

      this.groundHeight = groundContactInfo.contactPoint.y;
      this.groundNormal.copy(groundContactInfo.face.normal);
      var top = groundingHead.y;
      var bottom = this.center.y - this.radius - this.groundPadding; // ジャンプ中、かつ上方向に移動中だったら、強制接地しない

      if (this.isJumping && 0 < this.currentJumpPower) {
        this.isOnSlope = false;
        this.isGrounded = false;
        return;
      }

      this.isGrounded = bottom <= this.groundHeight && this.groundHeight <= top;
      this.isOnSlope = this.groundNormal.y <= this.maxSlopeGradient;

      if (this.isGrounded) {
        this.isJumping = false;
      }
    }
  }, {
    key: "_updatePosition",
    value: function _updatePosition(dt) {
      // 壁などを無視してひとまず(速度 * 時間)だけ
      // centerの座標を進める
      // 壁との衝突判定はこのこの後のステップで行うのでここではやらない
      // もしisGrounded状態なら、強制的にyの値を地面に合わせる
      var groundedY = this.groundHeight + this.radius;
      var x = this.center.x + this.velocity.x * dt;
      var y = this.center.y + this.velocity.y * dt;
      var z = this.center.z + this.velocity.z * dt;
      this.center.set(x, this.isGrounded ? groundedY : y, z);
    }
  }, {
    key: "_collisionDetection",
    value: function _collisionDetection() {
      // 交差していそうなフェイス (collisionCandidate) のリストから、
      // 実際に交差している壁フェイスを抜き出して
      // this.contactInfoに追加する
      var faces = this.collisionCandidate;
      this.contactInfo.length = 0;

      for (var i = 0, l = faces.length; i < l; i++) {
        var contactInfo = isIntersectionSphereTriangle(this, faces[i].a, faces[i].b, faces[i].c, faces[i].normal);
        if (!contactInfo) continue;
        contactInfo.face = faces[i];
        this.contactInfo.push(contactInfo);
      }
    }
  }, {
    key: "_solvePosition",
    value: function _solvePosition() {
      // updatePosition() で center を動かした後
      // 壁と衝突し食い込んでいる場合、
      // ここで壁の外への押し出しをする
      var face;
      var normal; // let distance;

      if (this.contactInfo.length === 0) {
        // 何とも衝突していない
        // centerの値をそのままつかって終了
        this.object.position.copy(this.center);
        return;
      } //
      // vs walls and sliding on the wall


      translate.set(0, 0, 0);

      for (var i = 0, l = this.contactInfo.length; i < l; i++) {
        face = this.contactInfo[i].face;
        normal = this.contactInfo[i].face.normal; // distance = this.contactInfo[ i ].distance;
        // if ( 0 <= distance ) {
        //   // 交差点までの距離が 0 以上ならこのフェイスとは衝突していない
        //   // 無視する
        //   continue;
        // }

        if (this.maxSlopeGradient < normal.y) {
          // this triangle is a ground or slope, not a wall or ceil
          // フェイスは急勾配でない坂、つまり地面。
          // 接地の処理は updatePosition() 内で解決しているので無視する
          continue;
        } // フェイスは急勾配な坂か否か


        var isSlopeFace = this.maxSlopeGradient <= face.normal.y && face.normal.y < 1; // ジャンプ降下中に、急勾配な坂に衝突したらジャンプ終わり

        if (this.isJumping && 0 >= this.currentJumpPower && isSlopeFace) {
          this.isJumping = false;
          this.isGrounded = true; // console.log( 'jump end' );
        }

        if (this.isGrounded || this.isOnSlope) {
          // 地面の上にいる場合はy(縦)方向は同一のまま
          // x, z (横) 方向だけを変更して押し出す
          // http://gamedev.stackexchange.com/questions/80293/how-do-i-resolve-a-sphere-triangle-collision-in-a-given-direction
          point1.copy(normal).multiplyScalar(-this.radius).add(this.center);
          direction.set(normal.x, 0, normal.z).normalize();
          var plainD = face.a.dot(normal);
          var t = (plainD - (normal.x * point1.x + normal.y * point1.y + normal.z * point1.z)) / (normal.x * direction.x + normal.y * direction.y + normal.z * direction.z);
          point2.copy(direction).multiplyScalar(t).add(point1);
          translateScoped.subVectors(point2, point1);

          if (Math.abs(translate.x) > Math.abs(translateScoped.x)) {
            translate.x += translateScoped.x;
          }

          if (Math.abs(translate.z) > Math.abs(translateScoped.z)) {
            translate.z += translateScoped.z;
          } // break;


          continue;
        }
      }

      this.center.add(translate);
      this.object.position.copy(this.center);
    }
  }, {
    key: "setDirection",
    value: function setDirection() {}
  }, {
    key: "jump",
    value: function jump() {
      if (this.isJumping || !this.isGrounded || this.isOnSlope) return;
      this.jumpStartTime = performance.now();
      this.currentJumpPower = 1;
      this.isJumping = true;
    }
  }, {
    key: "_updateJumping",
    value: function _updateJumping() {
      if (!this.isJumping) return;
      var elapsed = performance.now() - this.jumpStartTime;
      var progress = elapsed / JUMP_DURATION;
      this.currentJumpPower = Math.cos(Math.min(progress, 1) * Math.PI);
    }
  }]);

  return CharacterController;
}(EventDispatcher);

var TURN_DURATION = 200;
var TAU = 2 * Math.PI;

var modulo = function modulo(n, d) {
  return (n % d + d) % d;
};

var getDeltaTurnAngle = function getDeltaTurnAngle(current, target) {
  var a = modulo(current - target, TAU);
  var b = modulo(target - current, TAU);
  return a < b ? -a : b;
};

var AnimationController = /*#__PURE__*/function () {
  function AnimationController(mesh) {
    _classCallCheck(this, AnimationController);

    this.mesh = mesh;
    this.motion = {};
    this.mixer = new THREE.AnimationMixer(mesh);
    this.currentMotionName = '';

    for (var i = 0, l = this.mesh.geometry.animations.length; i < l; i++) {
      var anim = this.mesh.geometry.animations[i];
      this.motion[anim.name] = this.mixer.clipAction(anim);
      this.motion[anim.name].setEffectiveWeight(1);
    }
  }

  _createClass(AnimationController, [{
    key: "play",
    value: function play(name) {
      if (this.currentMotionName === name) return;

      if (this.motion[this.currentMotionName]) {
        var from = this.motion[this.currentMotionName].play();
        var to = this.motion[name].play();
        from.enabled = true;
        to.enabled = true;
        from.crossFadeTo(to, .3);
      } else {
        this.motion[name].enabled = true;
        this.motion[name].play();
      }

      this.currentMotionName = name;
    }
  }, {
    key: "turn",
    value: function turn(rad, immediate) {
      var that = this;
      var prevRotY = this.mesh.rotation.y;
      var targetRotY = rad;
      var deltaY = getDeltaTurnAngle(prevRotY, targetRotY); // const duration   = Math.abs( deltaY ) * 100;

      var start = Date.now();
      var end = start + TURN_DURATION;
      var progress = 0;

      if (immediate) {
        this.mesh.rotation.y = targetRotY;
        return;
      }

      if (this._targetRotY === targetRotY) return;
      this._targetRotY = targetRotY;
      {
        var _targetRotY = targetRotY;

        (function interval() {
          var now = Date.now();
          var isAborted = _targetRotY !== that._targetRotY;
          if (isAborted) return;

          if (now >= end) {
            that.mesh.rotation.y = _targetRotY;
            delete that._targetRotY;
            return;
          }

          requestAnimationFrame(interval);
          progress = (now - start) / TURN_DURATION;
          that.mesh.rotation.y = prevRotY + deltaY * progress;
        })();
      }
    }
  }, {
    key: "update",
    value: function update(delta) {
      this.mixer.update(delta);
    }
  }]);

  return AnimationController;
}();

var KEY_W = 87;
var KEY_UP = 38;
var KEY_S = 83;
var KEY_DOWN = 40;
var KEY_A = 65;
var KEY_LEFT = 37;
var KEY_D = 68;
var KEY_RIGHT = 39;
var KEY_SPACE = 32;
var DEG2RAD = Math.PI / 180;
var DEG_0 = 0 * DEG2RAD;
var DEG_45 = 45 * DEG2RAD;
var DEG_90 = 90 * DEG2RAD;
var DEG_135 = 135 * DEG2RAD;
var DEG_180 = 180 * DEG2RAD;
var DEG_225 = 225 * DEG2RAD;
var DEG_270 = 270 * DEG2RAD;
var DEG_315 = 315 * DEG2RAD;
var KeyInputControl = /*#__PURE__*/function (_EventDispatcher) {
  _inherits(KeyInputControl, _EventDispatcher);

  var _super = _createSuper(KeyInputControl);

  function KeyInputControl() {
    var _this;

    _classCallCheck(this, KeyInputControl);

    _this = _super.call(this);
    _this.isDisabled = false;
    _this.isUp = false;
    _this.isDown = false;
    _this.isLeft = false;
    _this.isRight = false;
    _this.isMoveKeyHolding = false;
    _this.frontAngle = 0;
    _this._keydownListener = onKeyDown.bind(_assertThisInitialized(_this));
    _this._keyupListener = onKeyUp.bind(_assertThisInitialized(_this));
    _this._blurListener = onBlur.bind(_assertThisInitialized(_this));
    window.addEventListener('keydown', _this._keydownListener);
    window.addEventListener('keyup', _this._keyupListener);
    window.addEventListener('blur', _this._blurListener);
    return _this;
  }

  _createClass(KeyInputControl, [{
    key: "jump",
    value: function jump() {
      this.dispatchEvent({
        type: 'jumpkeypress'
      });
    }
  }, {
    key: "updateAngle",
    value: function updateAngle() {
      var up = this.isUp;
      var down = this.isDown;
      var left = this.isLeft;
      var right = this.isRight;
      if (up && !left && !down && !right) this.frontAngle = DEG_0;else if (up && left && !down && !right) this.frontAngle = DEG_45;else if (!up && left && !down && !right) this.frontAngle = DEG_90;else if (!up && left && down && !right) this.frontAngle = DEG_135;else if (!up && !left && down && !right) this.frontAngle = DEG_180;else if (!up && !left && down && right) this.frontAngle = DEG_225;else if (!up && !left && !down && right) this.frontAngle = DEG_270;else if (up && !left && !down && right) this.frontAngle = DEG_315;
    }
  }]);

  return KeyInputControl;
}(EventDispatcher);

function onKeyDown(event) {
  if (this.isDisabled) return;
  if (isInputEvent(event)) return;

  switch (event.keyCode) {
    case KEY_W:
    case KEY_UP:
      this.isUp = true;
      break;

    case KEY_S:
    case KEY_DOWN:
      this.isDown = true;
      break;

    case KEY_A:
    case KEY_LEFT:
      this.isLeft = true;
      break;

    case KEY_D:
    case KEY_RIGHT:
      this.isRight = true;
      break;

    case KEY_SPACE:
      this.jump();
      break;

    default:
      return;
  }

  var prevAngle = this.frontAngle;
  this.updateAngle();

  if (prevAngle !== this.frontAngle) {
    this.dispatchEvent({
      type: 'movekeychange'
    });
  }

  if ((this.isUp || this.isDown || this.isLeft || this.isRight) && !this.isMoveKeyHolding) {
    this.isMoveKeyHolding = true;
    this.dispatchEvent({
      type: 'movekeyon'
    });
  }
}

function onKeyUp(event) {
  if (this.isDisabled) return;

  switch (event.keyCode) {
    case KEY_W:
    case KEY_UP:
      this.isUp = false;
      break;

    case KEY_S:
    case KEY_DOWN:
      this.isDown = false;
      break;

    case KEY_A:
    case KEY_LEFT:
      this.isLeft = false;
      break;

    case KEY_D:
    case KEY_RIGHT:
      this.isRight = false;
      break;

    case KEY_SPACE:
      break;

    default:
      return;
  }

  var prevAngle = this.frontAngle;
  this.updateAngle();

  if (prevAngle !== this.frontAngle) {
    this.dispatchEvent({
      type: 'movekeychange'
    });
  }

  if (!this.isUp && !this.isDown && !this.isLeft && !this.isRight && (event.keyCode === KEY_W || event.keyCode === KEY_UP || event.keyCode === KEY_S || event.keyCode === KEY_DOWN || event.keyCode === KEY_A || event.keyCode === KEY_LEFT || event.keyCode === KEY_D || event.keyCode === KEY_RIGHT)) {
    this.isMoveKeyHolding = false;
    this.dispatchEvent({
      type: 'movekeyoff'
    });
  }
}

function onBlur() {
  this.isUp = false;
  this.isDown = false;
  this.isLeft = false;
  this.isRight = false;

  if (this.isMoveKeyHolding) {
    this.isMoveKeyHolding = false;
    this.dispatchEvent({
      type: 'movekeyoff'
    });
  }
}

function isInputEvent(event) {
  var target = event.target;
  return target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}

/*!
 * camera-controls
 * https://github.com/yomotsu/camera-controls
 * (c) 2017 @yomotsu
 * Released under the MIT License.
 */
/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var ACTION;
(function (ACTION) {
    ACTION[ACTION["NONE"] = 0] = "NONE";
    ACTION[ACTION["ROTATE"] = 1] = "ROTATE";
    ACTION[ACTION["TRUCK"] = 2] = "TRUCK";
    ACTION[ACTION["DOLLY"] = 3] = "DOLLY";
    ACTION[ACTION["ZOOM"] = 4] = "ZOOM";
    ACTION[ACTION["TOUCH_ROTATE"] = 5] = "TOUCH_ROTATE";
    ACTION[ACTION["TOUCH_TRUCK"] = 6] = "TOUCH_TRUCK";
    ACTION[ACTION["TOUCH_DOLLY"] = 7] = "TOUCH_DOLLY";
    ACTION[ACTION["TOUCH_ZOOM"] = 8] = "TOUCH_ZOOM";
    ACTION[ACTION["TOUCH_DOLLY_TRUCK"] = 9] = "TOUCH_DOLLY_TRUCK";
    ACTION[ACTION["TOUCH_ZOOM_TRUCK"] = 10] = "TOUCH_ZOOM_TRUCK";
})(ACTION || (ACTION = {}));

var PI_2 = Math.PI * 2;
var PI_HALF$1 = Math.PI / 2;
var FPS_60 = 1 / 0.016;

var EPSILON = 1e-5;
function approxZero(number) {
    return Math.abs(number) < EPSILON;
}
function approxEquals(a, b) {
    return approxZero(a - b);
}
function roundToStep(value, step) {
    return Math.round(value / step) * step;
}
function infinityToMaxNumber(value) {
    if (isFinite(value))
        return value;
    if (value < 0)
        return -Number.MAX_VALUE;
    return Number.MAX_VALUE;
}
function maxNumberToInfinity(value) {
    if (Math.abs(value) < Number.MAX_VALUE)
        return value;
    return value * Infinity;
}

function isTouchEvent(event) {
    return 'TouchEvent' in window && event instanceof TouchEvent;
}

function extractClientCoordFromEvent(event, out) {
    out.set(0, 0);
    if (isTouchEvent(event)) {
        var touchEvent = event;
        for (var i = 0; i < touchEvent.touches.length; i++) {
            out.x += touchEvent.touches[i].clientX;
            out.y += touchEvent.touches[i].clientY;
        }
        out.x /= touchEvent.touches.length;
        out.y /= touchEvent.touches.length;
        return out;
    }
    else {
        var mouseEvent = event;
        out.set(mouseEvent.clientX, mouseEvent.clientY);
        return out;
    }
}

function notSupportedInOrthographicCamera(camera, message) {
    if (!camera.isPerspectiveCamera) {
        console.warn(message + " is not supported in OrthographicCamera");
        return true;
    }
    return false;
}

var EventDispatcher$1 = (function () {
    function EventDispatcher() {
        this._listeners = {};
    }
    EventDispatcher.prototype.addEventListener = function (type, listener) {
        var listeners = this._listeners;
        if (listeners[type] === undefined)
            listeners[type] = [];
        if (listeners[type].indexOf(listener) === -1)
            listeners[type].push(listener);
    };
    EventDispatcher.prototype.removeEventListener = function (type, listener) {
        var listeners = this._listeners;
        var listenerArray = listeners[type];
        if (listenerArray !== undefined) {
            var index = listenerArray.indexOf(listener);
            if (index !== -1)
                listenerArray.splice(index, 1);
        }
    };
    EventDispatcher.prototype.removeAllEventListeners = function (type) {
        if (!type) {
            this._listeners = {};
            return;
        }
        if (Array.isArray(this._listeners[type]))
            this._listeners[type].length = 0;
    };
    EventDispatcher.prototype.dispatchEvent = function (event) {
        var listeners = this._listeners;
        var listenerArray = listeners[event.type];
        if (listenerArray !== undefined) {
            event.target = this;
            var array = listenerArray.slice(0);
            for (var i = 0, l = array.length; i < l; i++) {
                array[i].call(this, event);
            }
        }
    };
    return EventDispatcher;
}());

var isMac = /Mac/.test(navigator.platform);
var readonlyACTION = Object.freeze(ACTION);
var TOUCH_DOLLY_FACTOR = 1 / 8;
var THREE$2;
var _ORIGIN;
var _AXIS_Y;
var _AXIS_Z;
var _v2;
var _v3A;
var _v3B;
var _v3C;
var _xColumn;
var _yColumn;
var _sphericalA;
var _sphericalB;
var _box3A;
var _box3B;
var _quaternionA;
var _quaternionB;
var _rotationMatrix;
var _raycaster;
var CameraControls = (function (_super) {
    __extends(CameraControls, _super);
    function CameraControls(camera, domElement) {
        var _this = _super.call(this) || this;
        _this.enabled = true;
        _this.minPolarAngle = 0;
        _this.maxPolarAngle = Math.PI;
        _this.minAzimuthAngle = -Infinity;
        _this.maxAzimuthAngle = Infinity;
        _this.minDistance = 0;
        _this.maxDistance = Infinity;
        _this.minZoom = 0.01;
        _this.maxZoom = Infinity;
        _this.dampingFactor = 0.05;
        _this.draggingDampingFactor = 0.25;
        _this.azimuthRotateSpeed = 1.0;
        _this.polarRotateSpeed = 1.0;
        _this.dollySpeed = 1.0;
        _this.truckSpeed = 2.0;
        _this.dollyToCursor = false;
        _this.verticalDragToForward = false;
        _this.boundaryFriction = 0.0;
        _this.colliderMeshes = [];
        _this._state = ACTION.NONE;
        _this._viewport = null;
        _this._dollyControlAmount = 0;
        _this._boundaryEnclosesCamera = false;
        _this._needsUpdate = true;
        _this._updatedLastTime = false;
        _this._camera = camera;
        _this._yAxisUpSpace = new THREE$2.Quaternion().setFromUnitVectors(_this._camera.up, _AXIS_Y);
        _this._yAxisUpSpaceInverse = _this._yAxisUpSpace.clone().inverse();
        _this._state = ACTION.NONE;
        _this._domElement = domElement;
        _this._target = new THREE$2.Vector3();
        _this._targetEnd = _this._target.clone();
        _this._spherical = new THREE$2.Spherical().setFromVector3(_v3A.copy(_this._camera.position).applyQuaternion(_this._yAxisUpSpace));
        _this._sphericalEnd = _this._spherical.clone();
        _this._zoom = _this._camera.zoom;
        _this._zoomEnd = _this._zoom;
        _this._nearPlaneCorners = [
            new THREE$2.Vector3(),
            new THREE$2.Vector3(),
            new THREE$2.Vector3(),
            new THREE$2.Vector3(),
        ];
        _this._updateNearPlaneCorners();
        _this._boundary = new THREE$2.Box3(new THREE$2.Vector3(-Infinity, -Infinity, -Infinity), new THREE$2.Vector3(Infinity, Infinity, Infinity));
        _this._target0 = _this._target.clone();
        _this._position0 = _this._camera.position.clone();
        _this._zoom0 = _this._zoom;
        _this._dollyControlAmount = 0;
        _this._dollyControlCoord = new THREE$2.Vector2();
        _this.mouseButtons = {
            left: ACTION.ROTATE,
            middle: ACTION.DOLLY,
            right: ACTION.TRUCK,
            wheel: _this._camera.isPerspectiveCamera ? ACTION.DOLLY :
                _this._camera.isOrthographicCamera ? ACTION.ZOOM :
                    ACTION.NONE,
        };
        _this.touches = {
            one: ACTION.TOUCH_ROTATE,
            two: _this._camera.isPerspectiveCamera ? ACTION.TOUCH_DOLLY_TRUCK :
                _this._camera.isOrthographicCamera ? ACTION.TOUCH_ZOOM_TRUCK :
                    ACTION.NONE,
            three: ACTION.TOUCH_TRUCK,
        };
        if (_this._domElement) {
            var dragStartPosition_1 = new THREE$2.Vector2();
            var lastDragPosition_1 = new THREE$2.Vector2();
            var dollyStart_1 = new THREE$2.Vector2();
            var elementRect_1 = new THREE$2.Vector4();
            var truckInternal_1 = function (deltaX, deltaY) {
                if (_this._camera.isPerspectiveCamera) {
                    var camera_1 = _this._camera;
                    var offset = _v3A.copy(camera_1.position).sub(_this._target);
                    var fov = camera_1.getEffectiveFOV() * THREE$2.Math.DEG2RAD;
                    var targetDistance = offset.length() * Math.tan(fov * 0.5);
                    var truckX = (_this.truckSpeed * deltaX * targetDistance / elementRect_1.w);
                    var pedestalY = (_this.truckSpeed * deltaY * targetDistance / elementRect_1.w);
                    if (_this.verticalDragToForward) {
                        _this.truck(truckX, 0, true);
                        _this.forward(-pedestalY, true);
                    }
                    else {
                        _this.truck(truckX, pedestalY, true);
                    }
                }
                else if (_this._camera.isOrthographicCamera) {
                    var camera_2 = _this._camera;
                    var truckX = deltaX * (camera_2.right - camera_2.left) / camera_2.zoom / elementRect_1.z;
                    var pedestalY = deltaY * (camera_2.top - camera_2.bottom) / camera_2.zoom / elementRect_1.w;
                    _this.truck(truckX, pedestalY, true);
                }
            };
            var rotateInternal_1 = function (deltaX, deltaY) {
                var theta = PI_2 * _this.azimuthRotateSpeed * deltaX / elementRect_1.w;
                var phi = PI_2 * _this.polarRotateSpeed * deltaY / elementRect_1.w;
                _this.rotate(theta, phi, true);
            };
            var dollyInternal_1 = function (delta, x, y) {
                var dollyScale = Math.pow(0.95, -delta * _this.dollySpeed);
                var distance = _this._sphericalEnd.radius * dollyScale;
                var prevRadius = _this._sphericalEnd.radius;
                _this.dollyTo(distance);
                if (_this.dollyToCursor) {
                    _this._dollyControlAmount += _this._sphericalEnd.radius - prevRadius;
                    _this._dollyControlCoord.set(x, y);
                }
                return;
            };
            var zoomInternal_1 = function (delta) {
                var zoomScale = Math.pow(0.95, delta * _this.dollySpeed);
                _this.zoomTo(_this._zoom * zoomScale);
                return;
            };
            var onMouseDown_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                var prevState = _this._state;
                switch (event.button) {
                    case THREE$2.MOUSE.LEFT:
                        _this._state = _this.mouseButtons.left;
                        break;
                    case THREE$2.MOUSE.MIDDLE:
                        _this._state = _this.mouseButtons.middle;
                        break;
                    case THREE$2.MOUSE.RIGHT:
                        _this._state = _this.mouseButtons.right;
                        break;
                }
                if (prevState !== _this._state) {
                    startDragging_1(event);
                }
            };
            var onTouchStart_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                var prevState = _this._state;
                switch (event.touches.length) {
                    case 1:
                        _this._state = _this.touches.one;
                        break;
                    case 2:
                        _this._state = _this.touches.two;
                        break;
                    case 3:
                        _this._state = _this.touches.three;
                        break;
                }
                if (prevState !== _this._state) {
                    startDragging_1(event);
                }
            };
            var lastScrollTimeStamp_1 = -1;
            var onMouseWheel_1 = function (event) {
                if (!_this.enabled || _this.mouseButtons.wheel === ACTION.NONE)
                    return;
                event.preventDefault();
                if (_this.dollyToCursor ||
                    _this.mouseButtons.wheel === ACTION.ROTATE ||
                    _this.mouseButtons.wheel === ACTION.TRUCK) {
                    var now = performance.now();
                    if (lastScrollTimeStamp_1 - now < 1000)
                        _this._getClientRect(elementRect_1);
                    lastScrollTimeStamp_1 = now;
                }
                var deltaYFactor = isMac ? -1 : -3;
                var delta = (event.deltaMode === 1) ? event.deltaY / deltaYFactor : event.deltaY / (deltaYFactor * 10);
                var x = _this.dollyToCursor ? (event.clientX - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                var y = _this.dollyToCursor ? (event.clientY - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                switch (_this.mouseButtons.wheel) {
                    case ACTION.ROTATE: {
                        rotateInternal_1(event.deltaX, event.deltaY);
                        break;
                    }
                    case ACTION.TRUCK: {
                        truckInternal_1(event.deltaX, event.deltaY);
                        break;
                    }
                    case ACTION.DOLLY: {
                        dollyInternal_1(-delta, x, y);
                        break;
                    }
                    case ACTION.ZOOM: {
                        zoomInternal_1(-delta);
                        break;
                    }
                }
                _this.dispatchEvent({
                    type: 'control',
                    originalEvent: event,
                });
            };
            var onContextMenu_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
            };
            var startDragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                extractClientCoordFromEvent(event, _v2);
                _this._getClientRect(elementRect_1);
                dragStartPosition_1.copy(_v2);
                lastDragPosition_1.copy(_v2);
                var isMultiTouch = isTouchEvent(event) && event.touches.length >= 2;
                if (isMultiTouch) {
                    var touchEvent = event;
                    var dx = _v2.x - touchEvent.touches[1].clientX;
                    var dy = _v2.y - touchEvent.touches[1].clientY;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    dollyStart_1.set(0, distance);
                    var x = (touchEvent.touches[0].clientX + touchEvent.touches[1].clientX) * 0.5;
                    var y = (touchEvent.touches[0].clientY + touchEvent.touches[1].clientY) * 0.5;
                    lastDragPosition_1.set(x, y);
                }
                document.addEventListener('mousemove', dragging_1);
                document.addEventListener('touchmove', dragging_1, { passive: false });
                document.addEventListener('mouseup', endDragging_1);
                document.addEventListener('touchend', endDragging_1);
                _this.dispatchEvent({
                    type: 'controlstart',
                    originalEvent: event,
                });
            };
            var dragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                event.preventDefault();
                extractClientCoordFromEvent(event, _v2);
                var deltaX = lastDragPosition_1.x - _v2.x;
                var deltaY = lastDragPosition_1.y - _v2.y;
                lastDragPosition_1.copy(_v2);
                switch (_this._state) {
                    case ACTION.ROTATE:
                    case ACTION.TOUCH_ROTATE: {
                        rotateInternal_1(deltaX, deltaY);
                        break;
                    }
                    case ACTION.DOLLY:
                    case ACTION.ZOOM: {
                        var dollyX = _this.dollyToCursor ? (dragStartPosition_1.x - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                        var dollyY = _this.dollyToCursor ? (dragStartPosition_1.y - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                        _this._state === ACTION.DOLLY ?
                            dollyInternal_1(deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
                            zoomInternal_1(deltaY * TOUCH_DOLLY_FACTOR);
                        break;
                    }
                    case ACTION.TOUCH_DOLLY:
                    case ACTION.TOUCH_ZOOM:
                    case ACTION.TOUCH_DOLLY_TRUCK:
                    case ACTION.TOUCH_ZOOM_TRUCK: {
                        var touchEvent = event;
                        var dx = _v2.x - touchEvent.touches[1].clientX;
                        var dy = _v2.y - touchEvent.touches[1].clientY;
                        var distance = Math.sqrt(dx * dx + dy * dy);
                        var dollyDelta = dollyStart_1.y - distance;
                        dollyStart_1.set(0, distance);
                        var dollyX = _this.dollyToCursor ? (lastDragPosition_1.x - elementRect_1.x) / elementRect_1.z * 2 - 1 : 0;
                        var dollyY = _this.dollyToCursor ? (lastDragPosition_1.y - elementRect_1.y) / elementRect_1.w * -2 + 1 : 0;
                        _this._state === ACTION.TOUCH_DOLLY ||
                            _this._state === ACTION.TOUCH_DOLLY_TRUCK ?
                            dollyInternal_1(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
                            zoomInternal_1(dollyDelta * TOUCH_DOLLY_FACTOR);
                        if (_this._state === ACTION.TOUCH_DOLLY_TRUCK ||
                            _this._state === ACTION.TOUCH_ZOOM_TRUCK) {
                            truckInternal_1(deltaX, deltaY);
                        }
                        break;
                    }
                    case ACTION.TRUCK:
                    case ACTION.TOUCH_TRUCK: {
                        truckInternal_1(deltaX, deltaY);
                        break;
                    }
                }
                _this.dispatchEvent({
                    type: 'control',
                    originalEvent: event,
                });
            };
            var endDragging_1 = function (event) {
                if (!_this.enabled)
                    return;
                _this._state = ACTION.NONE;
                document.removeEventListener('mousemove', dragging_1);
                document.removeEventListener('touchmove', dragging_1, { passive: false });
                document.removeEventListener('mouseup', endDragging_1);
                document.removeEventListener('touchend', endDragging_1);
                _this.dispatchEvent({
                    type: 'controlend',
                    originalEvent: event,
                });
            };
            _this._domElement.addEventListener('mousedown', onMouseDown_1);
            _this._domElement.addEventListener('touchstart', onTouchStart_1);
            _this._domElement.addEventListener('wheel', onMouseWheel_1);
            _this._domElement.addEventListener('contextmenu', onContextMenu_1);
            _this._removeAllEventListeners = function () {
                _this._domElement.removeEventListener('mousedown', onMouseDown_1);
                _this._domElement.removeEventListener('touchstart', onTouchStart_1);
                _this._domElement.removeEventListener('wheel', onMouseWheel_1);
                _this._domElement.removeEventListener('contextmenu', onContextMenu_1);
                document.removeEventListener('mousemove', dragging_1);
                document.removeEventListener('touchmove', dragging_1, { passive: false });
                document.removeEventListener('mouseup', endDragging_1);
                document.removeEventListener('touchend', endDragging_1);
            };
        }
        _this.update(0);
        return _this;
    }
    CameraControls.install = function (libs) {
        THREE$2 = libs.THREE;
        _ORIGIN = Object.freeze(new THREE$2.Vector3(0, 0, 0));
        _AXIS_Y = Object.freeze(new THREE$2.Vector3(0, 1, 0));
        _AXIS_Z = Object.freeze(new THREE$2.Vector3(0, 0, 1));
        _v2 = new THREE$2.Vector2();
        _v3A = new THREE$2.Vector3();
        _v3B = new THREE$2.Vector3();
        _v3C = new THREE$2.Vector3();
        _xColumn = new THREE$2.Vector3();
        _yColumn = new THREE$2.Vector3();
        _sphericalA = new THREE$2.Spherical();
        _sphericalB = new THREE$2.Spherical();
        _box3A = new THREE$2.Box3();
        _box3B = new THREE$2.Box3();
        _quaternionA = new THREE$2.Quaternion();
        _quaternionB = new THREE$2.Quaternion();
        _rotationMatrix = new THREE$2.Matrix4();
        _raycaster = new THREE$2.Raycaster();
    };
    Object.defineProperty(CameraControls, "ACTION", {
        get: function () {
            return readonlyACTION;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "currentAction", {
        get: function () {
            return this._state;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "distance", {
        get: function () {
            return this._spherical.radius;
        },
        set: function (distance) {
            if (this._spherical.radius === distance &&
                this._sphericalEnd.radius === distance)
                return;
            this._spherical.radius = distance;
            this._sphericalEnd.radius = distance;
            this._needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "azimuthAngle", {
        get: function () {
            return this._spherical.theta;
        },
        set: function (azimuthAngle) {
            if (this._spherical.theta === azimuthAngle &&
                this._sphericalEnd.theta === azimuthAngle)
                return;
            this._spherical.theta = azimuthAngle;
            this._sphericalEnd.theta = azimuthAngle;
            this._needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "polarAngle", {
        get: function () {
            return this._spherical.phi;
        },
        set: function (polarAngle) {
            if (this._spherical.phi === polarAngle &&
                this._sphericalEnd.phi === polarAngle)
                return;
            this._spherical.phi = polarAngle;
            this._sphericalEnd.phi = polarAngle;
            this._needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "phiSpeed", {
        set: function (speed) {
            console.warn('phiSpeed was renamed. use azimuthRotateSpeed instead');
            this.azimuthRotateSpeed = speed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "thetaSpeed", {
        set: function (speed) {
            console.warn('thetaSpeed was renamed. use polarRotateSpeed instead');
            this.polarRotateSpeed = speed;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(CameraControls.prototype, "boundaryEnclosesCamera", {
        get: function () {
            return this._boundaryEnclosesCamera;
        },
        set: function (boundaryEnclosesCamera) {
            this._boundaryEnclosesCamera = boundaryEnclosesCamera;
            this._needsUpdate = true;
        },
        enumerable: true,
        configurable: true
    });
    CameraControls.prototype.rotate = function (azimuthAngle, polarAngle, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.rotateTo(this._sphericalEnd.theta + azimuthAngle, this._sphericalEnd.phi + polarAngle, enableTransition);
    };
    CameraControls.prototype.rotateTo = function (azimuthAngle, polarAngle, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var theta = THREE$2.Math.clamp(azimuthAngle, this.minAzimuthAngle, this.maxAzimuthAngle);
        var phi = THREE$2.Math.clamp(polarAngle, this.minPolarAngle, this.maxPolarAngle);
        this._sphericalEnd.theta = theta;
        this._sphericalEnd.phi = phi;
        this._sphericalEnd.makeSafe();
        if (!enableTransition) {
            this._spherical.theta = this._sphericalEnd.theta;
            this._spherical.phi = this._sphericalEnd.phi;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.dolly = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.dollyTo(this._sphericalEnd.radius - distance, enableTransition);
    };
    CameraControls.prototype.dollyTo = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        if (notSupportedInOrthographicCamera(this._camera, 'dolly'))
            return;
        this._sphericalEnd.radius = THREE$2.Math.clamp(distance, this.minDistance, this.maxDistance);
        if (!enableTransition) {
            this._spherical.radius = this._sphericalEnd.radius;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.zoom = function (zoomStep, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.zoomTo(this._zoomEnd + zoomStep, enableTransition);
    };
    CameraControls.prototype.zoomTo = function (zoom, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._zoomEnd = THREE$2.Math.clamp(zoom, this.minZoom, this.maxZoom);
        if (!enableTransition) {
            this._zoom = this._zoomEnd;
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.pan = function (x, y, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        console.log('`pan` has been renamed to `truck`');
        this.truck(x, y, enableTransition);
    };
    CameraControls.prototype.truck = function (x, y, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._camera.updateMatrix();
        _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
        _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
        _xColumn.multiplyScalar(x);
        _yColumn.multiplyScalar(-y);
        var offset = _v3A.copy(_xColumn).add(_yColumn);
        this._encloseToBoundary(this._targetEnd, offset, this.boundaryFriction);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.forward = function (distance, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        _v3A.setFromMatrixColumn(this._camera.matrix, 0);
        _v3A.crossVectors(this._camera.up, _v3A);
        _v3A.multiplyScalar(distance);
        this._encloseToBoundary(this._targetEnd, _v3A, this.boundaryFriction);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.moveTo = function (x, y, z, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this._targetEnd.set(x, y, z);
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.fitTo = function (box3OrObject, enableTransition, _a) {
        var _b = _a === void 0 ? {} : _a, _c = _b.paddingLeft, paddingLeft = _c === void 0 ? 0 : _c, _d = _b.paddingRight, paddingRight = _d === void 0 ? 0 : _d, _e = _b.paddingBottom, paddingBottom = _e === void 0 ? 0 : _e, _f = _b.paddingTop, paddingTop = _f === void 0 ? 0 : _f;
        var aabb = box3OrObject.isBox3
            ? _box3A.copy(box3OrObject)
            : _box3A.setFromObject(box3OrObject);
        var theta = roundToStep(this._sphericalEnd.theta, PI_HALF$1);
        var phi = roundToStep(this._sphericalEnd.phi, PI_HALF$1);
        this.rotateTo(theta, phi, enableTransition);
        var normal = _v3A.setFromSpherical(this._sphericalEnd).normalize();
        var rotation = _quaternionA.setFromUnitVectors(normal, _AXIS_Z);
        var viewFromPolar = approxEquals(Math.abs(normal.y), 1);
        if (viewFromPolar) {
            rotation.multiply(_quaternionB.setFromAxisAngle(_AXIS_Y, theta));
        }
        var bb = _box3B.makeEmpty();
        _v3B.copy(aabb.min).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setX(aabb.max.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setY(aabb.max.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setZ(aabb.min.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.min).setZ(aabb.max.z).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setY(aabb.min.y).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).setX(aabb.min.x).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        _v3B.copy(aabb.max).applyQuaternion(rotation);
        bb.expandByPoint(_v3B);
        rotation.setFromUnitVectors(_AXIS_Z, normal);
        bb.min.x -= paddingLeft;
        bb.min.y -= paddingBottom;
        bb.max.x += paddingRight;
        bb.max.y += paddingTop;
        var bbSize = bb.getSize(_v3A);
        var center = bb.getCenter(_v3B).applyQuaternion(rotation);
        var isPerspectiveCamera = this._camera.isPerspectiveCamera;
        var isOrthographicCamera = this._camera.isOrthographicCamera;
        if (isPerspectiveCamera) {
            var distance = this.getDistanceToFit(bbSize.x, bbSize.y, bbSize.z);
            this.moveTo(center.x, center.y, center.z, enableTransition);
            this.dollyTo(distance, enableTransition);
            return;
        }
        else if (isOrthographicCamera) {
            var camera = this._camera;
            var width = camera.right - camera.left;
            var height = camera.top - camera.bottom;
            var zoom = Math.min(width / bbSize.x, height / bbSize.y);
            this.moveTo(center.x, center.y, center.z, enableTransition);
            this.zoomTo(zoom, enableTransition);
            return;
        }
    };
    CameraControls.prototype.setLookAt = function (positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var position = _v3A.set(positionX, positionY, positionZ);
        var target = _v3B.set(targetX, targetY, targetZ);
        this._targetEnd.copy(target);
        this._sphericalEnd.setFromVector3(position.sub(target).applyQuaternion(this._yAxisUpSpace));
        this.normalizeRotations();
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.lerpLookAt = function (positionAX, positionAY, positionAZ, targetAX, targetAY, targetAZ, positionBX, positionBY, positionBZ, targetBX, targetBY, targetBZ, t, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var positionA = _v3A.set(positionAX, positionAY, positionAZ);
        var targetA = _v3B.set(targetAX, targetAY, targetAZ);
        _sphericalA.setFromVector3(positionA.sub(targetA).applyQuaternion(this._yAxisUpSpace));
        var targetB = _v3A.set(targetBX, targetBY, targetBZ);
        this._targetEnd.copy(targetA).lerp(targetB, t);
        var positionB = _v3B.set(positionBX, positionBY, positionBZ);
        _sphericalB.setFromVector3(positionB.sub(targetB).applyQuaternion(this._yAxisUpSpace));
        var deltaTheta = _sphericalB.theta - _sphericalA.theta;
        var deltaPhi = _sphericalB.phi - _sphericalA.phi;
        var deltaRadius = _sphericalB.radius - _sphericalA.radius;
        this._sphericalEnd.set(_sphericalA.radius + deltaRadius * t, _sphericalA.phi + deltaPhi * t, _sphericalA.theta + deltaTheta * t);
        this.normalizeRotations();
        if (!enableTransition) {
            this._target.copy(this._targetEnd);
            this._spherical.copy(this._sphericalEnd);
        }
        this._needsUpdate = true;
    };
    CameraControls.prototype.setPosition = function (positionX, positionY, positionZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.setLookAt(positionX, positionY, positionZ, this._targetEnd.x, this._targetEnd.y, this._targetEnd.z, enableTransition);
    };
    CameraControls.prototype.setTarget = function (targetX, targetY, targetZ, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var pos = this.getPosition(_v3A);
        this.setLookAt(pos.x, pos.y, pos.z, targetX, targetY, targetZ, enableTransition);
    };
    CameraControls.prototype.setBoundary = function (box3) {
        if (!box3) {
            this._boundary.min.set(-Infinity, -Infinity, -Infinity);
            this._boundary.max.set(Infinity, Infinity, Infinity);
            this._needsUpdate = true;
            return;
        }
        this._boundary.copy(box3);
        this._boundary.clampPoint(this._targetEnd, this._targetEnd);
        this._needsUpdate = true;
    };
    CameraControls.prototype.setViewport = function (viewportOrX, y, width, height) {
        if (viewportOrX === null) {
            this._viewport = null;
            return;
        }
        this._viewport = this._viewport || new THREE$2.Vector4();
        if (typeof viewportOrX === 'number') {
            this._viewport.set(viewportOrX, y, width, height);
        }
        else {
            this._viewport.copy(viewportOrX);
        }
    };
    CameraControls.prototype.getDistanceToFit = function (width, height, depth) {
        if (notSupportedInOrthographicCamera(this._camera, 'getDistanceToFit'))
            return this._spherical.radius;
        var camera = this._camera;
        var boundingRectAspect = width / height;
        var fov = camera.getEffectiveFOV() * THREE$2.Math.DEG2RAD;
        var aspect = camera.aspect;
        var heightToFit = boundingRectAspect < aspect ? height : width / aspect;
        return heightToFit * 0.5 / Math.tan(fov * 0.5) + depth * 0.5;
    };
    CameraControls.prototype.getTarget = function (out) {
        var _out = !!out && out.isVector3 ? out : new THREE$2.Vector3();
        return _out.copy(this._targetEnd);
    };
    CameraControls.prototype.getPosition = function (out) {
        var _out = !!out && out.isVector3 ? out : new THREE$2.Vector3();
        return _out.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).add(this._targetEnd);
    };
    CameraControls.prototype.normalizeRotations = function () {
        this._sphericalEnd.theta = this._sphericalEnd.theta % PI_2;
        if (this._sphericalEnd.theta < 0)
            this._sphericalEnd.theta += PI_2;
        this._spherical.theta += PI_2 * Math.round((this._sphericalEnd.theta - this._spherical.theta) / PI_2);
    };
    CameraControls.prototype.reset = function (enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        this.setLookAt(this._position0.x, this._position0.y, this._position0.z, this._target0.x, this._target0.y, this._target0.z, enableTransition);
        this.zoomTo(this._zoom0, enableTransition);
    };
    CameraControls.prototype.saveState = function () {
        this._target0.copy(this._target);
        this._position0.copy(this._camera.position);
        this._zoom0 = this._zoom;
    };
    CameraControls.prototype.updateCameraUp = function () {
        this._yAxisUpSpace.setFromUnitVectors(this._camera.up, _AXIS_Y);
        this._yAxisUpSpaceInverse.copy(this._yAxisUpSpace).inverse();
    };
    CameraControls.prototype.update = function (delta) {
        var dampingFactor = this._state === ACTION.NONE ? this.dampingFactor : this.draggingDampingFactor;
        var lerpRatio = 1.0 - Math.exp(-dampingFactor * delta * FPS_60);
        var deltaTheta = this._sphericalEnd.theta - this._spherical.theta;
        var deltaPhi = this._sphericalEnd.phi - this._spherical.phi;
        var deltaRadius = this._sphericalEnd.radius - this._spherical.radius;
        var deltaTarget = _v3A.subVectors(this._targetEnd, this._target);
        if (!approxZero(deltaTheta) ||
            !approxZero(deltaPhi) ||
            !approxZero(deltaRadius) ||
            !approxZero(deltaTarget.x) ||
            !approxZero(deltaTarget.y) ||
            !approxZero(deltaTarget.z)) {
            this._spherical.set(this._spherical.radius + deltaRadius * lerpRatio, this._spherical.phi + deltaPhi * lerpRatio, this._spherical.theta + deltaTheta * lerpRatio);
            this._target.add(deltaTarget.multiplyScalar(lerpRatio));
            this._needsUpdate = true;
        }
        else {
            this._spherical.copy(this._sphericalEnd);
            this._target.copy(this._targetEnd);
        }
        if (this._dollyControlAmount !== 0) {
            if (this._camera.isPerspectiveCamera) {
                var camera = this._camera;
                var direction = _v3A.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
                var planeX = _v3B.copy(direction).cross(camera.up).normalize();
                if (planeX.lengthSq() === 0)
                    planeX.x = 1.0;
                var planeY = _v3C.crossVectors(planeX, direction);
                var worldToScreen = this._sphericalEnd.radius * Math.tan(camera.getEffectiveFOV() * THREE$2.Math.DEG2RAD * 0.5);
                var prevRadius = this._sphericalEnd.radius - this._dollyControlAmount;
                var lerpRatio_1 = (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius;
                var cursor = _v3A.copy(this._targetEnd)
                    .add(planeX.multiplyScalar(this._dollyControlCoord.x * worldToScreen * camera.aspect))
                    .add(planeY.multiplyScalar(this._dollyControlCoord.y * worldToScreen));
                this._targetEnd.lerp(cursor, lerpRatio_1);
                this._target.copy(this._targetEnd);
            }
            this._dollyControlAmount = 0;
        }
        var maxDistance = this._collisionTest();
        this._spherical.radius = Math.min(this._spherical.radius, maxDistance);
        this._spherical.makeSafe();
        this._camera.position.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(this._target);
        this._camera.lookAt(this._target);
        if (this._boundaryEnclosesCamera) {
            this._encloseToBoundary(this._camera.position.copy(this._target), _v3A.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse), 1.0);
        }
        var zoomDelta = this._zoomEnd - this._zoom;
        this._zoom += zoomDelta * lerpRatio;
        if (this._camera.zoom !== this._zoom) {
            if (approxZero(zoomDelta))
                this._zoom = this._zoomEnd;
            this._camera.zoom = this._zoom;
            this._camera.updateProjectionMatrix();
            this._updateNearPlaneCorners();
            this._needsUpdate = true;
        }
        var updated = this._needsUpdate;
        if (updated && !this._updatedLastTime) {
            this.dispatchEvent({ type: 'wake' });
            this.dispatchEvent({ type: 'update' });
        }
        else if (updated) {
            this.dispatchEvent({ type: 'update' });
        }
        else if (!updated && this._updatedLastTime) {
            this.dispatchEvent({ type: 'sleep' });
        }
        this._updatedLastTime = updated;
        this._needsUpdate = false;
        return updated;
    };
    CameraControls.prototype.toJSON = function () {
        return JSON.stringify({
            enabled: this.enabled,
            minDistance: this.minDistance,
            maxDistance: infinityToMaxNumber(this.maxDistance),
            minZoom: this.minZoom,
            maxZoom: infinityToMaxNumber(this.maxZoom),
            minPolarAngle: this.minPolarAngle,
            maxPolarAngle: infinityToMaxNumber(this.maxPolarAngle),
            minAzimuthAngle: infinityToMaxNumber(this.minAzimuthAngle),
            maxAzimuthAngle: infinityToMaxNumber(this.maxAzimuthAngle),
            dampingFactor: this.dampingFactor,
            draggingDampingFactor: this.draggingDampingFactor,
            dollySpeed: this.dollySpeed,
            truckSpeed: this.truckSpeed,
            dollyToCursor: this.dollyToCursor,
            verticalDragToForward: this.verticalDragToForward,
            target: this._targetEnd.toArray(),
            position: this._camera.position.toArray(),
            zoom: this._camera.zoom,
            target0: this._target0.toArray(),
            position0: this._position0.toArray(),
            zoom0: this._zoom0,
        });
    };
    CameraControls.prototype.fromJSON = function (json, enableTransition) {
        if (enableTransition === void 0) { enableTransition = false; }
        var obj = JSON.parse(json);
        var position = _v3A.fromArray(obj.position);
        this.enabled = obj.enabled;
        this.minDistance = obj.minDistance;
        this.maxDistance = maxNumberToInfinity(obj.maxDistance);
        this.minZoom = obj.minZoom;
        this.maxZoom = maxNumberToInfinity(obj.maxZoom);
        this.minPolarAngle = obj.minPolarAngle;
        this.maxPolarAngle = maxNumberToInfinity(obj.maxPolarAngle);
        this.minAzimuthAngle = maxNumberToInfinity(obj.minAzimuthAngle);
        this.maxAzimuthAngle = maxNumberToInfinity(obj.maxAzimuthAngle);
        this.dampingFactor = obj.dampingFactor;
        this.draggingDampingFactor = obj.draggingDampingFactor;
        this.dollySpeed = obj.dollySpeed;
        this.truckSpeed = obj.truckSpeed;
        this.dollyToCursor = obj.dollyToCursor;
        this.verticalDragToForward = obj.verticalDragToForward;
        this._target0.fromArray(obj.target0);
        this._position0.fromArray(obj.position0);
        this._zoom0 = obj.zoom0;
        this.moveTo(obj.target[0], obj.target[1], obj.target[2], enableTransition);
        _sphericalA.setFromVector3(position.sub(this._targetEnd).applyQuaternion(this._yAxisUpSpace));
        this.rotateTo(_sphericalA.theta, _sphericalA.phi, enableTransition);
        this.zoomTo(obj.zoom, enableTransition);
        this._needsUpdate = true;
    };
    CameraControls.prototype.dispose = function () {
        this._removeAllEventListeners();
    };
    CameraControls.prototype._encloseToBoundary = function (position, offset, friction) {
        var offsetLength2 = offset.lengthSq();
        if (offsetLength2 === 0.0) {
            return position;
        }
        var newTarget = _v3B.copy(offset).add(position);
        var clampedTarget = this._boundary.clampPoint(newTarget, _v3C);
        var deltaClampedTarget = clampedTarget.sub(newTarget);
        var deltaClampedTargetLength2 = deltaClampedTarget.lengthSq();
        if (deltaClampedTargetLength2 === 0.0) {
            return position.add(offset);
        }
        else if (deltaClampedTargetLength2 === offsetLength2) {
            return position;
        }
        else if (friction === 0.0) {
            return position.add(offset).add(deltaClampedTarget);
        }
        else {
            var offsetFactor = 1.0 + friction * deltaClampedTargetLength2 / offset.dot(deltaClampedTarget);
            return position
                .add(_v3B.copy(offset).multiplyScalar(offsetFactor))
                .add(deltaClampedTarget.multiplyScalar(1.0 - friction));
        }
    };
    CameraControls.prototype._updateNearPlaneCorners = function () {
        if (this._camera.isPerspectiveCamera) {
            var camera = this._camera;
            var near = camera.near;
            var fov = camera.getEffectiveFOV() * THREE$2.Math.DEG2RAD;
            var heightHalf = Math.tan(fov * 0.5) * near;
            var widthHalf = heightHalf * camera.aspect;
            this._nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);
            this._nearPlaneCorners[2].set(widthHalf, heightHalf, 0);
            this._nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);
        }
        else if (this._camera.isOrthographicCamera) {
            var camera = this._camera;
            var zoomInv = 1 / camera.zoom;
            var left = camera.left * zoomInv;
            var right = camera.right * zoomInv;
            var top_1 = camera.top * zoomInv;
            var bottom = camera.bottom * zoomInv;
            this._nearPlaneCorners[0].set(left, top_1, 0);
            this._nearPlaneCorners[1].set(right, top_1, 0);
            this._nearPlaneCorners[2].set(right, bottom, 0);
            this._nearPlaneCorners[3].set(left, bottom, 0);
        }
    };
    CameraControls.prototype._collisionTest = function () {
        var distance = Infinity;
        var hasCollider = this.colliderMeshes.length >= 1;
        if (!hasCollider)
            return distance;
        if (notSupportedInOrthographicCamera(this._camera, '_collisionTest'))
            return distance;
        distance = this._spherical.radius;
        var direction = _v3A.setFromSpherical(this._spherical).divideScalar(distance);
        _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);
        for (var i = 0; i < 4; i++) {
            var nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
            nearPlaneCorner.applyMatrix4(_rotationMatrix);
            var origin_1 = _v3C.addVectors(this._target, nearPlaneCorner);
            _raycaster.set(origin_1, direction);
            _raycaster.far = distance;
            var intersects = _raycaster.intersectObjects(this.colliderMeshes);
            if (intersects.length !== 0 && intersects[0].distance < distance) {
                distance = intersects[0].distance;
            }
        }
        return distance;
    };
    CameraControls.prototype._getClientRect = function (target) {
        var rect = this._domElement.getBoundingClientRect();
        target.x = rect.left;
        target.y = rect.top;
        if (this._viewport) {
            target.x += this._viewport.x;
            target.y += rect.height - this._viewport.w - this._viewport.y;
            target.z = this._viewport.z;
            target.w = this._viewport.w;
        }
        else {
            target.z = rect.width;
            target.w = rect.height;
        }
        return target;
    };
    CameraControls.prototype._removeAllEventListeners = function () { };
    return CameraControls;
}(EventDispatcher$1));

onInstallHandlers.push(function () {
  CameraControls.install({
    THREE: THREE$1
  });
});
var TPSCameraControls = /*#__PURE__*/function (_CameraControls) {
  _inherits(TPSCameraControls, _CameraControls);

  var _super = _createSuper(TPSCameraControls);

  function TPSCameraControls(camera, trackObject, domElement) {
    var _thisSuper, _this;

    _classCallCheck(this, TPSCameraControls);

    _this = _super.call(this, camera, domElement);
    _this.minDistance = 1;
    _this.maxDistance = 30;
    _this.azimuthRotateSpeed = -0.3; // negative value to invert rotation direction

    _this.polarRotateSpeed = -0.2; // negative value to invert rotation direction

    _this.minPolarAngle = 30 * THREE$1.Math.DEG2RAD;
    _this.maxPolarAngle = 120 * THREE$1.Math.DEG2RAD;
    _this.mouseButtons.right = CameraControls.ACTION.NONE;
    _this.mouseButtons.middle = CameraControls.ACTION.NONE;
    _this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
    _this.touches.three = CameraControls.ACTION.TOUCH_DOLLY; // this._trackObject = trackObject;
    // this.offset = new THREE.Vector3( 0, 1, 0 );

    var offset = new THREE$1.Vector3(0, 1, 0);

    _this.update = function (delta) {
      var x = trackObject.position.x + offset.x;
      var y = trackObject.position.y + offset.y;
      var z = trackObject.position.z + offset.z;

      _this.moveTo(x, y, z, false);

      _get((_thisSuper = _assertThisInitialized(_this), _getPrototypeOf(TPSCameraControls.prototype)), "update", _thisSuper).call(_thisSuper, delta);
    };

    return _this;
  }

  _createClass(TPSCameraControls, [{
    key: "frontAngle",
    get: function get() {
      return this.azimuthAngle;
    }
  }]);

  return TPSCameraControls;
}(CameraControls);

export { AnimationController, CharacterController, KeyInputControl, Octree, TPSCameraControls, World, install };

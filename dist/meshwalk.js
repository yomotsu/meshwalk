/*!
* meshwalk
 * https://github.com/yomotsu/meshwalk.js
 * (c) 2015 @yomotsu
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MW = {}));
})(this, (function (exports) { 'use strict';

	var THREE$2; // bind on install

	var onInstallHandlers = [];
	function install(_THREE) {
	  if (THREE$2 && _THREE === THREE$2) {
	    console.error('[THREE] already installed. `install` should be called only once.');
	    return;
	  }
	  THREE$2 = _THREE;
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
	    Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
	  }
	}
	function _createClass(Constructor, protoProps, staticProps) {
	  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
	  if (staticProps) _defineProperties(Constructor, staticProps);
	  Object.defineProperty(Constructor, "prototype", {
	    writable: false
	  });
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
	  Object.defineProperty(subClass, "prototype", {
	    writable: false
	  });
	  if (superClass) _setPrototypeOf(subClass, superClass);
	}
	function _getPrototypeOf(o) {
	  _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function _getPrototypeOf(o) {
	    return o.__proto__ || Object.getPrototypeOf(o);
	  };
	  return _getPrototypeOf(o);
	}
	function _setPrototypeOf(o, p) {
	  _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
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
	    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
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
	  } else if (call !== void 0) {
	    throw new TypeError("Derived constructors may only return object or undefined");
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
	function _get() {
	  if (typeof Reflect !== "undefined" && Reflect.get) {
	    _get = Reflect.get.bind();
	  } else {
	    _get = function _get(target, property, receiver) {
	      var base = _superPropBase(target, property);
	      if (!base) return;
	      var desc = Object.getOwnPropertyDescriptor(base, property);
	      if (desc.get) {
	        return desc.get.call(arguments.length < 3 ? target : receiver);
	      }
	      return desc.value;
	    };
	  }
	  return _get.apply(this, arguments);
	}
	function _toPrimitive(input, hint) {
	  if (typeof input !== "object" || input === null) return input;
	  var prim = input[Symbol.toPrimitive];
	  if (prim !== undefined) {
	    var res = prim.call(input, hint || "default");
	    if (typeof res !== "object") return res;
	    throw new TypeError("@@toPrimitive must return a primitive value.");
	  }
	  return (hint === "string" ? String : Number)(input);
	}
	function _toPropertyKey(arg) {
	  var key = _toPrimitive(arg, "string");
	  return typeof key === "symbol" ? key : String(key);
	}

	var vec3;
	var vec3_0;
	var vec3_1;
	var center;
	var extents;
	onInstallHandlers.push(function () {
	  vec3 = new THREE$2.Vector3();
	  vec3_0 = new THREE$2.Vector3();
	  vec3_1 = new THREE$2.Vector3();
	  center = new THREE$2.Vector3();
	  extents = new THREE$2.Vector3();
	});

	// aabb: <THREE.Box3>
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
	  v0 = new THREE$2.Vector3();
	  v1 = new THREE$2.Vector3();
	  v2 = new THREE$2.Vector3();
	  f0 = new THREE$2.Vector3();
	  f1 = new THREE$2.Vector3();
	  f2 = new THREE$2.Vector3();
	  a00 = new THREE$2.Vector3();
	  a01 = new THREE$2.Vector3();
	  a02 = new THREE$2.Vector3();
	  a10 = new THREE$2.Vector3();
	  a11 = new THREE$2.Vector3();
	  a12 = new THREE$2.Vector3();
	  a20 = new THREE$2.Vector3();
	  a21 = new THREE$2.Vector3();
	  a22 = new THREE$2.Vector3();
	  plane = new THREE$2.Plane();
	});

	// based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
	//
	// a: <THREE.Vector3>, // vertex of a triangle
	// b: <THREE.Vector3>, // vertex of a triangle
	// c: <THREE.Vector3>, // vertex of a triangle
	// aabb: <THREE.Box3>
	function isIntersectionTriangleAABB(a, b, c, aabb) {
	  var p0, p1, p2, r;

	  // Compute box center and extents of AABoundingBox (if not already given in that format)
	  center.addVectors(aabb.max, aabb.min).multiplyScalar(0.5);
	  extents.subVectors(aabb.max, center);

	  // Translate triangle as conceptually moving AABB to origin
	  v0.subVectors(a, center);
	  v1.subVectors(b, center);
	  v2.subVectors(c, center);

	  // Compute edge vectors for triangle
	  f0.subVectors(v1, v0);
	  f1.subVectors(v2, v1);
	  f2.subVectors(v0, v2);

	  // Test axes a00..a22 (category 3)
	  a00.set(0, -f0.z, f0.y);
	  a01.set(0, -f1.z, f1.y);
	  a02.set(0, -f2.z, f2.y);
	  a10.set(f0.z, 0, -f0.x);
	  a11.set(f1.z, 0, -f1.x);
	  a12.set(f2.z, 0, -f2.x);
	  a20.set(-f0.y, f0.x, 0);
	  a21.set(-f1.y, f1.x, 0);
	  a22.set(-f2.y, f2.x, 0);

	  // Test axis a00
	  p0 = v0.dot(a00);
	  p1 = v1.dot(a00);
	  p2 = v2.dot(a00);
	  r = extents.y * Math.abs(f0.z) + extents.z * Math.abs(f0.y);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a01
	  p0 = v0.dot(a01);
	  p1 = v1.dot(a01);
	  p2 = v2.dot(a01);
	  r = extents.y * Math.abs(f1.z) + extents.z * Math.abs(f1.y);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a02
	  p0 = v0.dot(a02);
	  p1 = v1.dot(a02);
	  p2 = v2.dot(a02);
	  r = extents.y * Math.abs(f2.z) + extents.z * Math.abs(f2.y);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a10
	  p0 = v0.dot(a10);
	  p1 = v1.dot(a10);
	  p2 = v2.dot(a10);
	  r = extents.x * Math.abs(f0.z) + extents.z * Math.abs(f0.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a11
	  p0 = v0.dot(a11);
	  p1 = v1.dot(a11);
	  p2 = v2.dot(a11);
	  r = extents.x * Math.abs(f1.z) + extents.z * Math.abs(f1.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a12
	  p0 = v0.dot(a12);
	  p1 = v1.dot(a12);
	  p2 = v2.dot(a12);
	  r = extents.x * Math.abs(f2.z) + extents.z * Math.abs(f2.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a20
	  p0 = v0.dot(a20);
	  p1 = v1.dot(a20);
	  p2 = v2.dot(a20);
	  r = extents.x * Math.abs(f0.y) + extents.y * Math.abs(f0.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a21
	  p0 = v0.dot(a21);
	  p1 = v1.dot(a21);
	  p2 = v2.dot(a21);
	  r = extents.x * Math.abs(f1.y) + extents.y * Math.abs(f1.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test axis a22
	  p0 = v0.dot(a22);
	  p1 = v1.dot(a22);
	  p2 = v2.dot(a22);
	  r = extents.x * Math.abs(f2.y) + extents.y * Math.abs(f2.x);
	  if (Math.max(-Math.max(p0, p1, p2), Math.min(p0, p1, p2)) > r) {
	    return false; // Axis is a separating axis
	  }

	  // Test the three axes corresponding to the face normals of AABB b (category 1).
	  // Exit if...
	  // ... [-extents.x, extents.x] and [min(v0.x,v1.x,v2.x), max(v0.x,v1.x,v2.x)] do not overlap
	  if (Math.max(v0.x, v1.x, v2.x) < -extents.x || Math.min(v0.x, v1.x, v2.x) > extents.x) {
	    return false;
	  }

	  // ... [-extents.y, extents.y] and [min(v0.y,v1.y,v2.y), max(v0.y,v1.y,v2.y)] do not overlap
	  if (Math.max(v0.y, v1.y, v2.y) < -extents.y || Math.min(v0.y, v1.y, v2.y) > extents.y) {
	    return false;
	  }

	  // ... [-extents.z, extents.z] and [min(v0.z,v1.z,v2.z), max(v0.z,v1.z,v2.z)] do not overlap
	  if (Math.max(v0.z, v1.z, v2.z) < -extents.z || Math.min(v0.z, v1.z, v2.z) > extents.z) {
	    return false;
	  }

	  // Test separating axis corresponding to triangle face normal (category 2)
	  // Face Normal is -ve as Triangle is clockwise winding (and XNA uses -z for into screen)
	  plane.normal.copy(f1).cross(f0).normalize();
	  plane.constant = plane.normal.dot(a);
	  return isIntersectionAABBPlane(aabb, plane);
	}

	// Section 5.1.3
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
	  A = new THREE$2.Vector3();
	  B = new THREE$2.Vector3();
	  C = new THREE$2.Vector3();
	  V = new THREE$2.Vector3();
	  AB = new THREE$2.Vector3();
	  BC = new THREE$2.Vector3();
	  CA = new THREE$2.Vector3();
	  Q1 = new THREE$2.Vector3();
	  Q2 = new THREE$2.Vector3();
	  Q3 = new THREE$2.Vector3();
	  QC = new THREE$2.Vector3();
	  QA = new THREE$2.Vector3();
	  QB = new THREE$2.Vector3();
	  negatedNormal = new THREE$2.Vector3();
	});

	//http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

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
	  }

	  // vs triangle vertex
	  var aa = A.dot(A);
	  var ab = A.dot(B);
	  var ac = A.dot(C);
	  var bb = B.dot(B);
	  var bc = B.dot(C);
	  var cc = C.dot(C);
	  if (aa > rr & ab > aa & ac > aa || bb > rr & ab > bb & bc > bb || cc > rr & ac > cc & bc > cc) {
	    return false;
	  }

	  // vs edge
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
	}

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
	  ab = new THREE$2.Vector3();
	  ac = new THREE$2.Vector3();
	  qp = new THREE$2.Vector3();
	  n = new THREE$2.Vector3();
	  ap = new THREE$2.Vector3();
	  e = new THREE$2.Vector3();
	  au = new THREE$2.Vector3();
	  bv = new THREE$2.Vector3();
	  cw = new THREE$2.Vector3();
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
	    var nodeBoxSize = new THREE$2.Vector3();
	    var nodeBoxMin = new THREE$2.Vector3();
	    var nodeBoxMax = new THREE$2.Vector3();
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
	      if (geometry instanceof THREE$2.BufferGeometry) {
	        if (geometry.index !== undefined) {
	          var indices = geometry.index.array;
	          var positions = geometry.attributes.position.array;
	          // const normals   = geometry.attributes.normal.array;
	          var groups = geometry.groups.length !== 0 ? geometry.groups : [{
	            start: 0,
	            count: indices.length,
	            materialIndex: 0
	          }];
	          for (var i = 0, l = groups.length; i < l; ++i) {
	            var start = groups[i].start;
	            var count = groups[i].count;
	            for (var ii = start, ll = start + count; ii < ll; ii += 3) {
	              var a = indices[ii];
	              var b = indices[ii + 1];
	              var c = indices[ii + 2];
	              var vA = new THREE$2.Vector3().fromArray(positions, a * 3);
	              var vB = new THREE$2.Vector3().fromArray(positions, b * 3);
	              var vC = new THREE$2.Vector3().fromArray(positions, c * 3);

	              // https://github.com/mrdoob/three.js/issues/4691
	              // make face normal
	              var cb = new THREE$2.Vector3().subVectors(vC, vB);
	              var ab = new THREE$2.Vector3().subVectors(vA, vB);
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
	};

	//
	var OctreeNode = /*#__PURE__*/function () {
	  function OctreeNode(tree, depth, mortonNumber, min, max) {
	    _classCallCheck(this, OctreeNode);
	    this.tree = tree;
	    this.depth = depth;
	    this.mortonNumber = mortonNumber;
	    this.min = new THREE$2.Vector3(min.x, min.y, min.z);
	    this.max = new THREE$2.Vector3(max.x, max.y, max.z);
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
	var Face = /*#__PURE__*/_createClass(function Face(a, b, c, normal, meshID) {
	  _classCallCheck(this, Face);
	  this.a = a.clone();
	  this.b = b.clone();
	  this.c = c.clone();
	  this.normal = normal.clone();
	  this.meshID = meshID;
	}); // origin   : <THREE.Vector3>
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
	  sphere = new THREE$2.Sphere();
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
	        var faces = void 0;

	        // octree で絞られた node に含まれる face だけを
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
	var EventDispatcher$1 = /*#__PURE__*/function () {
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
	var PI_HALF$1 = Math.PI * 0.5;
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
	  direction2D = new THREE$2.Vector2();
	  wallNormal2D = new THREE$2.Vector2();
	  groundingHead = new THREE$2.Vector3();
	  groundingTo = new THREE$2.Vector3();
	  point1 = new THREE$2.Vector3();
	  point2 = new THREE$2.Vector3();
	  direction = new THREE$2.Vector3();
	  translateScoped = new THREE$2.Vector3();
	  translate = new THREE$2.Vector3();
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
	    _this.maxSlopeGradient = Math.cos(50 * THREE$2.MathUtils.DEG2RAD);
	    _this.isGrounded = false;
	    _this.isOnSlope = false;
	    _this.isIdling = false;
	    _this.isRunning = false;
	    _this.isJumping = false;
	    _this.direction = 0; // 0 to 2PI(=360deg) in rad
	    _this.movementSpeed = 10; // Meters Per Second
	    _this.velocity = new THREE$2.Vector3(0, -10, 0);
	    _this.currentJumpPower = 0;
	    _this.jumpStartTime = 0;
	    _this.groundHeight = 0;
	    _this.groundNormal = new THREE$2.Vector3();
	    _this.collisionCandidate;
	    _this.contactInfo = [];
	    var isFirstUpdate = true;
	    var wasGrounded;
	    var wasOnSlope;
	    // let wasIdling;
	    var wasRunning;
	    var wasJumping;
	    _this._events = function () {
	      // 初回のみ、過去状態を作るだけで終わり
	      if (isFirstUpdate) {
	        isFirstUpdate = false;
	        wasGrounded = _this.isGrounded;
	        wasOnSlope = _this.isOnSlope;
	        // wasIdling   = this.isIdling;
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
	      wasOnSlope = _this.isOnSlope;
	      // wasIdling   = this.isIdling;
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
	      this.velocity.set(rightDirection * this.movementSpeed * this.isRunning, FALL_VELOCITY, frontDirection * this.movementSpeed * this.isRunning);

	      // 急勾配や自由落下など、自動で付与される速度の処理
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
	      }

	      // 壁に向かった場合、壁方向の速度を0にする処理
	      // vs walls and sliding on the wall
	      direction2D.set(rightDirection, frontDirection);
	      // const frontAngle = Math.atan2( direction2D.y, direction2D.x );
	      var negativeFrontAngle = Math.atan2(-direction2D.y, -direction2D.x);
	      for (var i = 0, l = this.contactInfo.length; i < l; i++) {
	        var normal = this.contactInfo[i].face.normal;
	        // var distance = this.contactInfo[ i ].distance;

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
	        if (Math.abs(negativeFrontAngle - wallAngle) >= PI_HALF$1 &&
	        //  90deg
	        Math.abs(negativeFrontAngle - wallAngle) <= PI_ONE_HALF // 270deg
	        ) {
	          // フェイスは進行方向とは逆方向、要は背中側の壁なので
	          // 速度の減衰はしないでいい
	          continue;
	        }

	        // 上記までの条件に一致しなければ、フェイスは壁
	        // 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする
	        wallNormal2D.set(direction2D.dot(wallNormal2D) * wallNormal2D.x, direction2D.dot(wallNormal2D) * wallNormal2D.y);
	        direction2D.sub(wallNormal2D);
	        this.velocity.x = direction2D.x * this.movementSpeed * this.isRunning;
	        this.velocity.z = direction2D.y * this.movementSpeed * this.isRunning;
	      }

	      // ジャンプ中に天井にぶつかったら、ジャンプを中断する
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
	      var bottom = this.center.y - this.radius - this.groundPadding;

	      // ジャンプ中、かつ上方向に移動中だったら、強制接地しない
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
	      var normal;
	      // let distance;

	      if (this.contactInfo.length === 0) {
	        // 何とも衝突していない
	        // centerの値をそのままつかって終了
	        this.object.position.copy(this.center);
	        return;
	      }

	      //
	      // vs walls and sliding on the wall
	      translate.set(0, 0, 0);
	      for (var i = 0, l = this.contactInfo.length; i < l; i++) {
	        face = this.contactInfo[i].face;
	        normal = this.contactInfo[i].face.normal;
	        // distance = this.contactInfo[ i ].distance;

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
	        }

	        // フェイスは急勾配な坂か否か
	        var isSlopeFace = this.maxSlopeGradient <= face.normal.y && face.normal.y < 1;

	        // ジャンプ降下中に、急勾配な坂に衝突したらジャンプ終わり
	        if (this.isJumping && 0 >= this.currentJumpPower && isSlopeFace) {
	          this.isJumping = false;
	          this.isGrounded = true;
	          // console.log( 'jump end' );
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
	          }

	          // break;
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
	}(EventDispatcher$1);

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
	      var deltaY = getDeltaTurnAngle(prevRotY, targetRotY);
	      // const duration   = Math.abs( deltaY ) * 100;
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
	var DEG2RAD$1 = Math.PI / 180;
	var DEG_0 = 0 * DEG2RAD$1;
	var DEG_45 = 45 * DEG2RAD$1;
	var DEG_90 = 90 * DEG2RAD$1;
	var DEG_135 = 135 * DEG2RAD$1;
	var DEG_180 = 180 * DEG2RAD$1;
	var DEG_225 = 225 * DEG2RAD$1;
	var DEG_270 = 270 * DEG2RAD$1;
	var DEG_315 = 315 * DEG2RAD$1;
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
	}(EventDispatcher$1);
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
	// see https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons#value
	const MOUSE_BUTTON = {
	    LEFT: 1,
	    RIGHT: 2,
	    MIDDLE: 4,
	};
	const ACTION = Object.freeze({
	    NONE: 0,
	    ROTATE: 1,
	    TRUCK: 2,
	    OFFSET: 4,
	    DOLLY: 8,
	    ZOOM: 16,
	    TOUCH_ROTATE: 32,
	    TOUCH_TRUCK: 64,
	    TOUCH_OFFSET: 128,
	    TOUCH_DOLLY: 256,
	    TOUCH_ZOOM: 512,
	    TOUCH_DOLLY_TRUCK: 1024,
	    TOUCH_DOLLY_OFFSET: 2048,
	    TOUCH_DOLLY_ROTATE: 4096,
	    TOUCH_ZOOM_TRUCK: 8192,
	    TOUCH_ZOOM_OFFSET: 16384,
	    TOUCH_ZOOM_ROTATE: 32768,
	});
	function isPerspectiveCamera(camera) {
	    return camera.isPerspectiveCamera;
	}
	function isOrthographicCamera(camera) {
	    return camera.isOrthographicCamera;
	}

	const PI_2 = Math.PI * 2;
	const PI_HALF = Math.PI / 2;

	const EPSILON = 1e-5;
	const DEG2RAD = Math.PI / 180;
	function clamp(value, min, max) {
	    return Math.max(min, Math.min(max, value));
	}
	function approxZero(number, error = EPSILON) {
	    return Math.abs(number) < error;
	}
	function approxEquals(a, b, error = EPSILON) {
	    return approxZero(a - b, error);
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
	// https://docs.unity3d.com/ScriptReference/Mathf.SmoothDamp.html
	// https://github.com/Unity-Technologies/UnityCsReference/blob/a2bdfe9b3c4cd4476f44bf52f848063bfaf7b6b9/Runtime/Export/Math/Mathf.cs#L308
	function smoothDamp(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime) {
	    // Based on Game Programming Gems 4 Chapter 1.10
	    smoothTime = Math.max(0.0001, smoothTime);
	    const omega = 2 / smoothTime;
	    const x = omega * deltaTime;
	    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
	    let change = current - target;
	    const originalTo = target;
	    // Clamp maximum speed
	    const maxChange = maxSpeed * smoothTime;
	    change = clamp(change, -maxChange, maxChange);
	    target = current - change;
	    const temp = (currentVelocityRef.value + omega * change) * deltaTime;
	    currentVelocityRef.value = (currentVelocityRef.value - omega * temp) * exp;
	    let output = target + (change + temp) * exp;
	    // Prevent overshooting
	    if (originalTo - current > 0.0 === output > originalTo) {
	        output = originalTo;
	        currentVelocityRef.value = (output - originalTo) / deltaTime;
	    }
	    return output;
	}
	// https://docs.unity3d.com/ScriptReference/Vector3.SmoothDamp.html
	// https://github.com/Unity-Technologies/UnityCsReference/blob/a2bdfe9b3c4cd4476f44bf52f848063bfaf7b6b9/Runtime/Export/Math/Vector3.cs#L97
	function smoothDampVec3(current, target, currentVelocityRef, smoothTime, maxSpeed = Infinity, deltaTime, out) {
	    // Based on Game Programming Gems 4 Chapter 1.10
	    smoothTime = Math.max(0.0001, smoothTime);
	    const omega = 2 / smoothTime;
	    const x = omega * deltaTime;
	    const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
	    let changeX = current.x - target.x;
	    let changeY = current.y - target.y;
	    let changeZ = current.z - target.z;
	    const originalToX = target.x;
	    const originalToY = target.y;
	    const originalToZ = target.z;
	    // Clamp maximum speed
	    const maxChange = maxSpeed * smoothTime;
	    const maxChangeSq = maxChange * maxChange;
	    const magnitudeSq = changeX * changeX + changeY * changeY + changeZ * changeZ;
	    if (magnitudeSq > maxChangeSq) {
	        const magnitude = Math.sqrt(magnitudeSq);
	        changeX = changeX / magnitude * maxChange;
	        changeY = changeY / magnitude * maxChange;
	        changeZ = changeZ / magnitude * maxChange;
	    }
	    target.x = current.x - changeX;
	    target.y = current.y - changeY;
	    target.z = current.z - changeZ;
	    const tempX = (currentVelocityRef.x + omega * changeX) * deltaTime;
	    const tempY = (currentVelocityRef.y + omega * changeY) * deltaTime;
	    const tempZ = (currentVelocityRef.z + omega * changeZ) * deltaTime;
	    currentVelocityRef.x = (currentVelocityRef.x - omega * tempX) * exp;
	    currentVelocityRef.y = (currentVelocityRef.y - omega * tempY) * exp;
	    currentVelocityRef.z = (currentVelocityRef.z - omega * tempZ) * exp;
	    out.x = target.x + (changeX + tempX) * exp;
	    out.y = target.y + (changeY + tempY) * exp;
	    out.z = target.z + (changeZ + tempZ) * exp;
	    // Prevent overshooting
	    const origMinusCurrentX = originalToX - current.x;
	    const origMinusCurrentY = originalToY - current.y;
	    const origMinusCurrentZ = originalToZ - current.z;
	    const outMinusOrigX = out.x - originalToX;
	    const outMinusOrigY = out.y - originalToY;
	    const outMinusOrigZ = out.z - originalToZ;
	    if (origMinusCurrentX * outMinusOrigX + origMinusCurrentY * outMinusOrigY + origMinusCurrentZ * outMinusOrigZ > 0) {
	        out.x = originalToX;
	        out.y = originalToY;
	        out.z = originalToZ;
	        currentVelocityRef.x = (out.x - originalToX) / deltaTime;
	        currentVelocityRef.y = (out.y - originalToY) / deltaTime;
	        currentVelocityRef.z = (out.z - originalToZ) / deltaTime;
	    }
	    return out;
	}

	function extractClientCoordFromEvent(pointers, out) {
	    out.set(0, 0);
	    pointers.forEach((pointer) => {
	        out.x += pointer.clientX;
	        out.y += pointer.clientY;
	    });
	    out.x /= pointers.length;
	    out.y /= pointers.length;
	}

	function notSupportedInOrthographicCamera(camera, message) {
	    if (isOrthographicCamera(camera)) {
	        console.warn(`${message} is not supported in OrthographicCamera`);
	        return true;
	    }
	    return false;
	}

	class EventDispatcher {
	    constructor() {
	        this._listeners = {};
	    }
	    /**
	     * Adds the specified event listener.
	     * @param type event name
	     * @param listener handler function
	     * @category Methods
	     */
	    addEventListener(type, listener) {
	        const listeners = this._listeners;
	        if (listeners[type] === undefined)
	            listeners[type] = [];
	        if (listeners[type].indexOf(listener) === -1)
	            listeners[type].push(listener);
	    }
	    /**
	     * Presence of the specified event listener.
	     * @param type event name
	     * @param listener handler function
	     * @category Methods
	     */
	    hasEventListener(type, listener) {
	        const listeners = this._listeners;
	        return listeners[type] !== undefined && listeners[type].indexOf(listener) !== -1;
	    }
	    /**
	     * Removes the specified event listener
	     * @param type event name
	     * @param listener handler function
	     * @category Methods
	     */
	    removeEventListener(type, listener) {
	        const listeners = this._listeners;
	        const listenerArray = listeners[type];
	        if (listenerArray !== undefined) {
	            const index = listenerArray.indexOf(listener);
	            if (index !== -1)
	                listenerArray.splice(index, 1);
	        }
	    }
	    /**
	     * Removes all event listeners
	     * @param type event name
	     * @category Methods
	     */
	    removeAllEventListeners(type) {
	        if (!type) {
	            this._listeners = {};
	            return;
	        }
	        if (Array.isArray(this._listeners[type]))
	            this._listeners[type].length = 0;
	    }
	    /**
	     * Fire an event type.
	     * @param event DispatcherEvent
	     * @category Methods
	     */
	    dispatchEvent(event) {
	        const listeners = this._listeners;
	        const listenerArray = listeners[event.type];
	        if (listenerArray !== undefined) {
	            event.target = this;
	            const array = listenerArray.slice(0);
	            for (let i = 0, l = array.length; i < l; i++) {
	                array[i].call(this, event);
	            }
	        }
	    }
	}

	const VERSION = '2.0.0'; // will be replaced with `version` in package.json during the build process.
	const TOUCH_DOLLY_FACTOR = 1 / 8;
	const isBrowser = typeof window !== 'undefined';
	const isMac = isBrowser && /Mac/.test(navigator.platform);
	const isPointerEventsNotSupported = !(isBrowser && 'PointerEvent' in window); // Safari 12 does not support PointerEvents API
	let THREE$1;
	let _ORIGIN;
	let _AXIS_Y;
	let _AXIS_Z;
	let _v2;
	let _v3A;
	let _v3B;
	let _v3C;
	let _xColumn;
	let _yColumn;
	let _zColumn;
	let _deltaTarget;
	let _deltaOffset;
	let _sphericalA;
	let _sphericalB;
	let _box3A;
	let _box3B;
	let _sphere;
	let _quaternionA;
	let _quaternionB;
	let _rotationMatrix;
	let _raycaster;
	class CameraControls extends EventDispatcher {
	    /**
	     * Injects THREE as the dependency. You can then proceed to use CameraControls.
	     *
	     * e.g
	     * ```javascript
	     * CameraControls.install( { THREE: THREE } );
	     * ```
	     *
	     * Note: If you do not wish to use enter three.js to reduce file size(tree-shaking for example), make a subset to install.
	     *
	     * ```js
	     * import {
	     * 	Vector2,
	     * 	Vector3,
	     * 	Vector4,
	     * 	Quaternion,
	     * 	Matrix4,
	     * 	Spherical,
	     * 	Box3,
	     * 	Sphere,
	     * 	Raycaster,
	     * 	MathUtils,
	     * } from 'three';
	     *
	     * const subsetOfTHREE = {
	     * 	Vector2   : Vector2,
	     * 	Vector3   : Vector3,
	     * 	Vector4   : Vector4,
	     * 	Quaternion: Quaternion,
	     * 	Matrix4   : Matrix4,
	     * 	Spherical : Spherical,
	     * 	Box3      : Box3,
	     * 	Sphere    : Sphere,
	     * 	Raycaster : Raycaster,
	     * };

	     * CameraControls.install( { THREE: subsetOfTHREE } );
	     * ```
	     * @category Statics
	     */
	    static install(libs) {
	        THREE$1 = libs.THREE;
	        _ORIGIN = Object.freeze(new THREE$1.Vector3(0, 0, 0));
	        _AXIS_Y = Object.freeze(new THREE$1.Vector3(0, 1, 0));
	        _AXIS_Z = Object.freeze(new THREE$1.Vector3(0, 0, 1));
	        _v2 = new THREE$1.Vector2();
	        _v3A = new THREE$1.Vector3();
	        _v3B = new THREE$1.Vector3();
	        _v3C = new THREE$1.Vector3();
	        _xColumn = new THREE$1.Vector3();
	        _yColumn = new THREE$1.Vector3();
	        _zColumn = new THREE$1.Vector3();
	        _deltaTarget = new THREE$1.Vector3();
	        _deltaOffset = new THREE$1.Vector3();
	        _sphericalA = new THREE$1.Spherical();
	        _sphericalB = new THREE$1.Spherical();
	        _box3A = new THREE$1.Box3();
	        _box3B = new THREE$1.Box3();
	        _sphere = new THREE$1.Sphere();
	        _quaternionA = new THREE$1.Quaternion();
	        _quaternionB = new THREE$1.Quaternion();
	        _rotationMatrix = new THREE$1.Matrix4();
	        _raycaster = new THREE$1.Raycaster();
	    }
	    /**
	     * list all ACTIONs
	     * @category Statics
	     */
	    static get ACTION() {
	        return ACTION;
	    }
	    /**
	     * Creates a `CameraControls` instance.
	     *
	     * Note:
	     * You **must install** three.js before using camera-controls. see [#install](#install)
	     * Not doing so will lead to runtime errors (`undefined` references to THREE).
	     *
	     * e.g.
	     * ```
	     * CameraControls.install( { THREE } );
	     * const cameraControls = new CameraControls( camera, domElement );
	     * ```
	     *
	     * @param camera A `THREE.PerspectiveCamera` or `THREE.OrthographicCamera` to be controlled.
	     * @param domElement A `HTMLElement` for the draggable area, usually `renderer.domElement`.
	     * @category Constructor
	     */
	    constructor(camera, domElement) {
	        super();
	        /**
	         * Minimum vertical angle in radians.
	         * The angle has to be between `0` and `.maxPolarAngle` inclusive.
	         * The default value is `0`.
	         *
	         * e.g.
	         * ```
	         * cameraControls.maxPolarAngle = 0;
	         * ```
	         * @category Properties
	         */
	        this.minPolarAngle = 0; // radians
	        /**
	         * Maximum vertical angle in radians.
	         * The angle has to be between `.maxPolarAngle` and `Math.PI` inclusive.
	         * The default value is `Math.PI`.
	         *
	         * e.g.
	         * ```
	         * cameraControls.maxPolarAngle = Math.PI;
	         * ```
	         * @category Properties
	         */
	        this.maxPolarAngle = Math.PI; // radians
	        /**
	         * Minimum horizontal angle in radians.
	         * The angle has to be less than `.maxAzimuthAngle`.
	         * The default value is `- Infinity`.
	         *
	         * e.g.
	         * ```
	         * cameraControls.minAzimuthAngle = - Infinity;
	         * ```
	         * @category Properties
	         */
	        this.minAzimuthAngle = -Infinity; // radians
	        /**
	         * Maximum horizontal angle in radians.
	         * The angle has to be greater than `.minAzimuthAngle`.
	         * The default value is `Infinity`.
	         *
	         * e.g.
	         * ```
	         * cameraControls.maxAzimuthAngle = Infinity;
	         * ```
	         * @category Properties
	         */
	        this.maxAzimuthAngle = Infinity; // radians
	        // How far you can dolly in and out ( PerspectiveCamera only )
	        /**
	         * Minimum distance for dolly. The value must be higher than `0`.
	         * PerspectiveCamera only.
	         * @category Properties
	         */
	        this.minDistance = 0;
	        /**
	         * Maximum distance for dolly. The value must be higher than `minDistance`.
	         * PerspectiveCamera only.
	         * @category Properties
	         */
	        this.maxDistance = Infinity;
	        /**
	         * `true` to enable Infinity Dolly.
	         * When the Dolly distance is less than the `minDistance`, radius of the sphere will be set `minDistance` automatically.
	         * @category Properties
	         */
	        this.infinityDolly = false;
	        /**
	         * Minimum camera zoom.
	         * @category Properties
	         */
	        this.minZoom = 0.01;
	        /**
	         * Maximum camera zoom.
	         * @category Properties
	         */
	        this.maxZoom = Infinity;
	        /**
	         * Approximate time in seconds to reach the target. A smaller value will reach the target faster.
	         * @category Properties
	         */
	        this.smoothTime = 0.25;
	        /**
	         * the smoothTime while dragging
	         * @category Properties
	         */
	        this.draggingSmoothTime = 0.125;
	        /**
	         * Max transition speed in unit-per-seconds
	         * @category Properties
	         */
	        this.maxSpeed = Infinity;
	        /**
	         * Speed of azimuth (horizontal) rotation.
	         * @category Properties
	         */
	        this.azimuthRotateSpeed = 1.0;
	        /**
	         * Speed of polar (vertical) rotation.
	         * @category Properties
	         */
	        this.polarRotateSpeed = 1.0;
	        /**
	         * Speed of mouse-wheel dollying.
	         * @category Properties
	         */
	        this.dollySpeed = 1.0;
	        /**
	         * Speed of drag for truck and pedestal.
	         * @category Properties
	         */
	        this.truckSpeed = 2.0;
	        /**
	         * `true` to enable Dolly-in to the mouse cursor coords.
	         * @category Properties
	         */
	        this.dollyToCursor = false;
	        /**
	         * @category Properties
	         */
	        this.dragToOffset = false;
	        /**
	         * The same as `.screenSpacePanning` in three.js's OrbitControls.
	         * @category Properties
	         */
	        this.verticalDragToForward = false;
	        /**
	         * Friction ratio of the boundary.
	         * @category Properties
	         */
	        this.boundaryFriction = 0.0;
	        /**
	         * Controls how soon the `rest` event fires as the camera slows.
	         * @category Properties
	         */
	        this.restThreshold = 0.01;
	        /**
	         * An array of Meshes to collide with camera.
	         * Be aware colliderMeshes may decrease performance. The collision test uses 4 raycasters from the camera since the near plane has 4 corners.
	         * @category Properties
	         */
	        this.colliderMeshes = [];
	        /**
	         * Force cancel user dragging.
	         * @category Methods
	         */
	        // cancel will be overwritten in the constructor.
	        this.cancel = () => { };
	        this._enabled = true;
	        this._state = ACTION.NONE;
	        this._viewport = null;
	        this._affectOffset = false;
	        this._dollyControlAmount = 0;
	        this._hasRested = true;
	        this._boundaryEnclosesCamera = false;
	        this._isLastDragging = false;
	        this._needsUpdate = true;
	        this._updatedLastTime = false;
	        this._elementRect = new DOMRect();
	        this._activePointers = [];
	        // velocities for smoothDamp
	        this._thetaVelocity = { value: 0 };
	        this._phiVelocity = { value: 0 };
	        this._radiusVelocity = { value: 0 };
	        this._targetVelocity = new THREE$1.Vector3();
	        this._focalOffsetVelocity = new THREE$1.Vector3();
	        this._zoomVelocity = { value: 0 };
	        this._truckInternal = (deltaX, deltaY, dragToOffset) => {
	            if (isPerspectiveCamera(this._camera)) {
	                const offset = _v3A.copy(this._camera.position).sub(this._target);
	                // half of the fov is center to top of screen
	                const fov = this._camera.getEffectiveFOV() * DEG2RAD;
	                const targetDistance = offset.length() * Math.tan(fov * 0.5);
	                const truckX = (this.truckSpeed * deltaX * targetDistance / this._elementRect.height);
	                const pedestalY = (this.truckSpeed * deltaY * targetDistance / this._elementRect.height);
	                if (this.verticalDragToForward) {
	                    dragToOffset ?
	                        this.setFocalOffset(this._focalOffsetEnd.x + truckX, this._focalOffsetEnd.y, this._focalOffsetEnd.z, true) :
	                        this.truck(truckX, 0, true);
	                    this.forward(-pedestalY, true);
	                }
	                else {
	                    dragToOffset ?
	                        this.setFocalOffset(this._focalOffsetEnd.x + truckX, this._focalOffsetEnd.y + pedestalY, this._focalOffsetEnd.z, true) :
	                        this.truck(truckX, pedestalY, true);
	                }
	            }
	            else if (isOrthographicCamera(this._camera)) {
	                // orthographic
	                const camera = this._camera;
	                const truckX = deltaX * (camera.right - camera.left) / camera.zoom / this._elementRect.width;
	                const pedestalY = deltaY * (camera.top - camera.bottom) / camera.zoom / this._elementRect.height;
	                dragToOffset ?
	                    this.setFocalOffset(this._focalOffsetEnd.x + truckX, this._focalOffsetEnd.y + pedestalY, this._focalOffsetEnd.z, true) :
	                    this.truck(truckX, pedestalY, true);
	            }
	        };
	        this._rotateInternal = (deltaX, deltaY) => {
	            const theta = PI_2 * this.azimuthRotateSpeed * deltaX / this._elementRect.height; // divide by *height* to refer the resolution
	            const phi = PI_2 * this.polarRotateSpeed * deltaY / this._elementRect.height;
	            this.rotate(theta, phi, true);
	        };
	        this._dollyInternal = (delta, x, y) => {
	            const dollyScale = Math.pow(0.95, -delta * this.dollySpeed);
	            const distance = this._sphericalEnd.radius * dollyScale;
	            const prevRadius = this._sphericalEnd.radius;
	            const signedPrevRadius = prevRadius * (delta >= 0 ? -1 : 1);
	            this.dollyTo(distance);
	            if (this.infinityDolly && (distance < this.minDistance || this.maxDistance === this.minDistance)) {
	                this._camera.getWorldDirection(_v3A);
	                this._targetEnd.add(_v3A.normalize().multiplyScalar(signedPrevRadius));
	                this._target.add(_v3A.normalize().multiplyScalar(signedPrevRadius));
	            }
	            if (this.dollyToCursor) {
	                this._dollyControlAmount += this._sphericalEnd.radius - prevRadius;
	                if (this.infinityDolly && (distance < this.minDistance || this.maxDistance === this.minDistance)) {
	                    this._dollyControlAmount -= signedPrevRadius;
	                }
	                this._dollyControlCoord.set(x, y);
	            }
	            return;
	        };
	        this._zoomInternal = (delta, x, y) => {
	            const zoomScale = Math.pow(0.95, delta * this.dollySpeed);
	            const prevZoom = this._zoomEnd;
	            // for both PerspectiveCamera and OrthographicCamera
	            this.zoomTo(this._zoom * zoomScale);
	            if (this.dollyToCursor) {
	                this._dollyControlAmount += this._zoomEnd - prevZoom;
	                this._dollyControlCoord.set(x, y);
	            }
	            return;
	        };
	        // Check if the user has installed THREE
	        if (typeof THREE$1 === 'undefined') {
	            console.error('camera-controls: `THREE` is undefined. You must first run `CameraControls.install( { THREE: THREE } )`. Check the docs for further information.');
	        }
	        this._camera = camera;
	        this._yAxisUpSpace = new THREE$1.Quaternion().setFromUnitVectors(this._camera.up, _AXIS_Y);
	        this._yAxisUpSpaceInverse = this._yAxisUpSpace.clone().invert();
	        this._state = ACTION.NONE;
	        // the location
	        this._target = new THREE$1.Vector3();
	        this._targetEnd = this._target.clone();
	        this._focalOffset = new THREE$1.Vector3();
	        this._focalOffsetEnd = this._focalOffset.clone();
	        // rotation
	        this._spherical = new THREE$1.Spherical().setFromVector3(_v3A.copy(this._camera.position).applyQuaternion(this._yAxisUpSpace));
	        this._sphericalEnd = this._spherical.clone();
	        this._zoom = this._camera.zoom;
	        this._zoomEnd = this._zoom;
	        // collisionTest uses nearPlane.s
	        this._nearPlaneCorners = [
	            new THREE$1.Vector3(),
	            new THREE$1.Vector3(),
	            new THREE$1.Vector3(),
	            new THREE$1.Vector3(),
	        ];
	        this._updateNearPlaneCorners();
	        // Target cannot move outside of this box
	        this._boundary = new THREE$1.Box3(new THREE$1.Vector3(-Infinity, -Infinity, -Infinity), new THREE$1.Vector3(Infinity, Infinity, Infinity));
	        // reset
	        this._target0 = this._target.clone();
	        this._position0 = this._camera.position.clone();
	        this._zoom0 = this._zoom;
	        this._focalOffset0 = this._focalOffset.clone();
	        this._dollyControlAmount = 0;
	        this._dollyControlCoord = new THREE$1.Vector2();
	        // configs
	        this.mouseButtons = {
	            left: ACTION.ROTATE,
	            middle: ACTION.DOLLY,
	            right: ACTION.TRUCK,
	            wheel: isPerspectiveCamera(this._camera) ? ACTION.DOLLY :
	                isOrthographicCamera(this._camera) ? ACTION.ZOOM :
	                    ACTION.NONE,
	        };
	        this.touches = {
	            one: ACTION.TOUCH_ROTATE,
	            two: isPerspectiveCamera(this._camera) ? ACTION.TOUCH_DOLLY_TRUCK :
	                isOrthographicCamera(this._camera) ? ACTION.TOUCH_ZOOM_TRUCK :
	                    ACTION.NONE,
	            three: ACTION.TOUCH_TRUCK,
	        };
	        const dragStartPosition = new THREE$1.Vector2();
	        const lastDragPosition = new THREE$1.Vector2();
	        const dollyStart = new THREE$1.Vector2();
	        const onPointerDown = (event) => {
	            if (!this._enabled || !this._domElement)
	                return;
	            // Don't call `event.preventDefault()` on the pointerdown event
	            // to keep receiving pointermove evens outside dragging iframe
	            // https://taye.me/blog/tips/2015/11/16/mouse-drag-outside-iframe/
	            const pointer = {
	                pointerId: event.pointerId,
	                clientX: event.clientX,
	                clientY: event.clientY,
	                deltaX: 0,
	                deltaY: 0,
	            };
	            this._activePointers.push(pointer);
	            // eslint-disable-next-line no-undef
	            this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
	            this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
	            this._domElement.ownerDocument.addEventListener('pointermove', onPointerMove, { passive: false });
	            this._domElement.ownerDocument.addEventListener('pointerup', onPointerUp);
	            startDragging(event);
	        };
	        const onMouseDown = (event) => {
	            if (!this._enabled || !this._domElement)
	                return;
	            const pointer = {
	                pointerId: 0,
	                clientX: event.clientX,
	                clientY: event.clientY,
	                deltaX: 0,
	                deltaY: 0,
	            };
	            this._activePointers.push(pointer);
	            // see https://github.com/microsoft/TypeScript/issues/32912#issuecomment-522142969
	            // eslint-disable-next-line no-undef
	            this._domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
	            this._domElement.ownerDocument.removeEventListener('mouseup', onMouseUp);
	            this._domElement.ownerDocument.addEventListener('mousemove', onMouseMove);
	            this._domElement.ownerDocument.addEventListener('mouseup', onMouseUp);
	            startDragging(event);
	        };
	        const onTouchStart = (event) => {
	            if (!this._enabled || !this._domElement)
	                return;
	            event.preventDefault();
	            Array.prototype.forEach.call(event.changedTouches, (touch) => {
	                const pointer = {
	                    pointerId: touch.identifier,
	                    clientX: touch.clientX,
	                    clientY: touch.clientY,
	                    deltaX: 0,
	                    deltaY: 0,
	                };
	                this._activePointers.push(pointer);
	            });
	            // eslint-disable-next-line no-undef
	            this._domElement.ownerDocument.removeEventListener('touchmove', onTouchMove, { passive: false });
	            this._domElement.ownerDocument.removeEventListener('touchend', onTouchEnd);
	            this._domElement.ownerDocument.addEventListener('touchmove', onTouchMove, { passive: false });
	            this._domElement.ownerDocument.addEventListener('touchend', onTouchEnd);
	            startDragging(event);
	        };
	        const onPointerMove = (event) => {
	            if (event.cancelable)
	                event.preventDefault();
	            const pointerId = event.pointerId;
	            const pointer = this._findPointerById(pointerId);
	            if (!pointer)
	                return;
	            pointer.clientX = event.clientX;
	            pointer.clientY = event.clientY;
	            pointer.deltaX = event.movementX;
	            pointer.deltaY = event.movementY;
	            if (event.pointerType === 'touch') {
	                switch (this._activePointers.length) {
	                    case 1:
	                        this._state = this.touches.one;
	                        break;
	                    case 2:
	                        this._state = this.touches.two;
	                        break;
	                    case 3:
	                        this._state = this.touches.three;
	                        break;
	                }
	            }
	            else {
	                this._state = 0;
	                if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
	                    this._state = this._state | this.mouseButtons.left;
	                }
	                if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
	                    this._state = this._state | this.mouseButtons.middle;
	                }
	                if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
	                    this._state = this._state | this.mouseButtons.right;
	                }
	            }
	            dragging();
	        };
	        const onMouseMove = (event) => {
	            const pointer = this._findPointerById(0);
	            if (!pointer)
	                return;
	            pointer.clientX = event.clientX;
	            pointer.clientY = event.clientY;
	            pointer.deltaX = event.movementX;
	            pointer.deltaY = event.movementY;
	            this._state = 0;
	            if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
	                this._state = this._state | this.mouseButtons.left;
	            }
	            if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
	                this._state = this._state | this.mouseButtons.middle;
	            }
	            if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
	                this._state = this._state | this.mouseButtons.right;
	            }
	            dragging();
	        };
	        const onTouchMove = (event) => {
	            if (event.cancelable)
	                event.preventDefault();
	            Array.prototype.forEach.call(event.changedTouches, (touch) => {
	                const pointerId = touch.identifier;
	                const pointer = this._findPointerById(pointerId);
	                if (!pointer)
	                    return;
	                pointer.clientX = touch.clientX;
	                pointer.clientY = touch.clientY;
	                // touch event does not have movementX and movementY.
	            });
	            dragging();
	        };
	        const onPointerUp = (event) => {
	            const pointerId = event.pointerId;
	            const pointer = this._findPointerById(pointerId);
	            pointer && this._activePointers.splice(this._activePointers.indexOf(pointer), 1);
	            if (event.pointerType === 'touch') {
	                switch (this._activePointers.length) {
	                    case 0:
	                        this._state = ACTION.NONE;
	                        break;
	                    case 1:
	                        this._state = this.touches.one;
	                        break;
	                    case 2:
	                        this._state = this.touches.two;
	                        break;
	                    case 3:
	                        this._state = this.touches.three;
	                        break;
	                }
	            }
	            else {
	                this._state = ACTION.NONE;
	            }
	            endDragging();
	        };
	        const onMouseUp = () => {
	            const pointer = this._findPointerById(0);
	            pointer && this._activePointers.splice(this._activePointers.indexOf(pointer), 1);
	            this._state = ACTION.NONE;
	            endDragging();
	        };
	        const onTouchEnd = (event) => {
	            Array.prototype.forEach.call(event.changedTouches, (touch) => {
	                const pointerId = touch.identifier;
	                const pointer = this._findPointerById(pointerId);
	                pointer && this._activePointers.splice(this._activePointers.indexOf(pointer), 1);
	            });
	            switch (this._activePointers.length) {
	                case 0:
	                    this._state = ACTION.NONE;
	                    break;
	                case 1:
	                    this._state = this.touches.one;
	                    break;
	                case 2:
	                    this._state = this.touches.two;
	                    break;
	                case 3:
	                    this._state = this.touches.three;
	                    break;
	            }
	            endDragging();
	        };
	        let lastScrollTimeStamp = -1;
	        const onMouseWheel = (event) => {
	            if (!this._enabled || this.mouseButtons.wheel === ACTION.NONE)
	                return;
	            event.preventDefault();
	            if (this.dollyToCursor ||
	                this.mouseButtons.wheel === ACTION.ROTATE ||
	                this.mouseButtons.wheel === ACTION.TRUCK) {
	                const now = performance.now();
	                // only need to fire this at scroll start.
	                if (lastScrollTimeStamp - now < 1000)
	                    this._getClientRect(this._elementRect);
	                lastScrollTimeStamp = now;
	            }
	            // Ref: https://github.com/cedricpinson/osgjs/blob/00e5a7e9d9206c06fdde0436e1d62ab7cb5ce853/sources/osgViewer/input/source/InputSourceMouse.js#L89-L103
	            const deltaYFactor = isMac ? -1 : -3;
	            const delta = (event.deltaMode === 1) ? event.deltaY / deltaYFactor : event.deltaY / (deltaYFactor * 10);
	            const x = this.dollyToCursor ? (event.clientX - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
	            const y = this.dollyToCursor ? (event.clientY - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
	            switch (this.mouseButtons.wheel) {
	                case ACTION.ROTATE: {
	                    this._rotateInternal(event.deltaX, event.deltaY);
	                    break;
	                }
	                case ACTION.TRUCK: {
	                    this._truckInternal(event.deltaX, event.deltaY, false);
	                    break;
	                }
	                case ACTION.OFFSET: {
	                    this._truckInternal(event.deltaX, event.deltaY, true);
	                    break;
	                }
	                case ACTION.DOLLY: {
	                    this._dollyInternal(-delta, x, y);
	                    break;
	                }
	                case ACTION.ZOOM: {
	                    this._zoomInternal(-delta, x, y);
	                    break;
	                }
	            }
	            this.dispatchEvent({ type: 'control' });
	        };
	        const onContextMenu = (event) => {
	            if (!this._enabled)
	                return;
	            event.preventDefault();
	        };
	        const startDragging = (event) => {
	            if (!this._enabled)
	                return;
	            extractClientCoordFromEvent(this._activePointers, _v2);
	            this._getClientRect(this._elementRect);
	            dragStartPosition.copy(_v2);
	            lastDragPosition.copy(_v2);
	            const isMultiTouch = this._activePointers.length >= 2;
	            if (isMultiTouch) {
	                // 2 finger pinch
	                const dx = _v2.x - this._activePointers[1].clientX;
	                const dy = _v2.y - this._activePointers[1].clientY;
	                const distance = Math.sqrt(dx * dx + dy * dy);
	                dollyStart.set(0, distance);
	                // center coords of 2 finger truck
	                const x = (this._activePointers[0].clientX + this._activePointers[1].clientX) * 0.5;
	                const y = (this._activePointers[0].clientY + this._activePointers[1].clientY) * 0.5;
	                lastDragPosition.set(x, y);
	            }
	            if ('touches' in event ||
	                'pointerType' in event && event.pointerType === 'touch') {
	                switch (this._activePointers.length) {
	                    case 1:
	                        this._state = this.touches.one;
	                        break;
	                    case 2:
	                        this._state = this.touches.two;
	                        break;
	                    case 3:
	                        this._state = this.touches.three;
	                        break;
	                }
	            }
	            else {
	                this._state = 0;
	                if ((event.buttons & MOUSE_BUTTON.LEFT) === MOUSE_BUTTON.LEFT) {
	                    this._state = this._state | this.mouseButtons.left;
	                }
	                if ((event.buttons & MOUSE_BUTTON.MIDDLE) === MOUSE_BUTTON.MIDDLE) {
	                    this._state = this._state | this.mouseButtons.middle;
	                }
	                if ((event.buttons & MOUSE_BUTTON.RIGHT) === MOUSE_BUTTON.RIGHT) {
	                    this._state = this._state | this.mouseButtons.right;
	                }
	            }
	            this.dispatchEvent({ type: 'controlstart' });
	        };
	        const dragging = () => {
	            if (!this._enabled)
	                return;
	            extractClientCoordFromEvent(this._activePointers, _v2);
	            // When pointer lock is enabled clientX, clientY, screenX, and screenY remain 0.
	            // If pointer lock is enabled, use the Delta directory, and assume active-pointer is not multiple.
	            const isPointerLockActive = this._domElement && document.pointerLockElement === this._domElement;
	            const deltaX = isPointerLockActive ? -this._activePointers[0].deltaX : lastDragPosition.x - _v2.x;
	            const deltaY = isPointerLockActive ? -this._activePointers[0].deltaY : lastDragPosition.y - _v2.y;
	            lastDragPosition.copy(_v2);
	            if ((this._state & ACTION.ROTATE) === ACTION.ROTATE ||
	                (this._state & ACTION.TOUCH_ROTATE) === ACTION.TOUCH_ROTATE ||
	                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
	                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
	                this._rotateInternal(deltaX, deltaY);
	            }
	            if ((this._state & ACTION.DOLLY) === ACTION.DOLLY ||
	                (this._state & ACTION.ZOOM) === ACTION.ZOOM) {
	                const dollyX = this.dollyToCursor ? (dragStartPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
	                const dollyY = this.dollyToCursor ? (dragStartPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
	                (this._state & ACTION.DOLLY) === ACTION.DOLLY ?
	                    this._dollyInternal(deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
	                    this._zoomInternal(deltaY * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
	            }
	            if ((this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY ||
	                (this._state & ACTION.TOUCH_ZOOM) === ACTION.TOUCH_ZOOM ||
	                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
	                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK ||
	                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
	                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET ||
	                (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
	                (this._state & ACTION.TOUCH_ZOOM_ROTATE) === ACTION.TOUCH_ZOOM_ROTATE) {
	                const dx = _v2.x - this._activePointers[1].clientX;
	                const dy = _v2.y - this._activePointers[1].clientY;
	                const distance = Math.sqrt(dx * dx + dy * dy);
	                const dollyDelta = dollyStart.y - distance;
	                dollyStart.set(0, distance);
	                const dollyX = this.dollyToCursor ? (lastDragPosition.x - this._elementRect.x) / this._elementRect.width * 2 - 1 : 0;
	                const dollyY = this.dollyToCursor ? (lastDragPosition.y - this._elementRect.y) / this._elementRect.height * -2 + 1 : 0;
	                (this._state & ACTION.TOUCH_DOLLY) === ACTION.TOUCH_DOLLY ||
	                    (this._state & ACTION.TOUCH_DOLLY_ROTATE) === ACTION.TOUCH_DOLLY_ROTATE ||
	                    (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
	                    (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ?
	                    this._dollyInternal(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY) :
	                    this._zoomInternal(dollyDelta * TOUCH_DOLLY_FACTOR, dollyX, dollyY);
	            }
	            if ((this._state & ACTION.TRUCK) === ACTION.TRUCK ||
	                (this._state & ACTION.TOUCH_TRUCK) === ACTION.TOUCH_TRUCK ||
	                (this._state & ACTION.TOUCH_DOLLY_TRUCK) === ACTION.TOUCH_DOLLY_TRUCK ||
	                (this._state & ACTION.TOUCH_ZOOM_TRUCK) === ACTION.TOUCH_ZOOM_TRUCK) {
	                this._truckInternal(deltaX, deltaY, false);
	            }
	            if ((this._state & ACTION.OFFSET) === ACTION.OFFSET ||
	                (this._state & ACTION.TOUCH_OFFSET) === ACTION.TOUCH_OFFSET ||
	                (this._state & ACTION.TOUCH_DOLLY_OFFSET) === ACTION.TOUCH_DOLLY_OFFSET ||
	                (this._state & ACTION.TOUCH_ZOOM_OFFSET) === ACTION.TOUCH_ZOOM_OFFSET) {
	                this._truckInternal(deltaX, deltaY, true);
	            }
	            this.dispatchEvent({ type: 'control' });
	        };
	        const endDragging = () => {
	            extractClientCoordFromEvent(this._activePointers, _v2);
	            lastDragPosition.copy(_v2);
	            if (this._activePointers.length === 0 && this._domElement) {
	                // eslint-disable-next-line no-undef
	                this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
	                this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
	                // eslint-disable-next-line no-undef
	                this._domElement.ownerDocument.removeEventListener('touchmove', onTouchMove, { passive: false });
	                this._domElement.ownerDocument.removeEventListener('touchend', onTouchEnd);
	                this.dispatchEvent({ type: 'controlend' });
	            }
	        };
	        this._addAllEventListeners = (domElement) => {
	            this._domElement = domElement;
	            this._domElement.style.touchAction = 'none';
	            this._domElement.style.userSelect = 'none';
	            this._domElement.style.webkitUserSelect = 'none';
	            this._domElement.addEventListener('pointerdown', onPointerDown);
	            isPointerEventsNotSupported && this._domElement.addEventListener('mousedown', onMouseDown);
	            isPointerEventsNotSupported && this._domElement.addEventListener('touchstart', onTouchStart);
	            this._domElement.addEventListener('pointercancel', onPointerUp);
	            this._domElement.addEventListener('wheel', onMouseWheel, { passive: false });
	            this._domElement.addEventListener('contextmenu', onContextMenu);
	        };
	        this._removeAllEventListeners = () => {
	            if (!this._domElement)
	                return;
	            this._domElement.removeEventListener('pointerdown', onPointerDown);
	            this._domElement.removeEventListener('mousedown', onMouseDown);
	            this._domElement.removeEventListener('touchstart', onTouchStart);
	            this._domElement.removeEventListener('pointercancel', onPointerUp);
	            // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/removeEventListener#matching_event_listeners_for_removal
	            // > it's probably wise to use the same values used for the call to `addEventListener()` when calling `removeEventListener()`
	            // see https://github.com/microsoft/TypeScript/issues/32912#issuecomment-522142969
	            // eslint-disable-next-line no-undef
	            this._domElement.removeEventListener('wheel', onMouseWheel, { passive: false });
	            this._domElement.removeEventListener('contextmenu', onContextMenu);
	            // eslint-disable-next-line no-undef
	            this._domElement.ownerDocument.removeEventListener('pointermove', onPointerMove, { passive: false });
	            this._domElement.ownerDocument.removeEventListener('mousemove', onMouseMove);
	            // eslint-disable-next-line no-undef
	            this._domElement.ownerDocument.removeEventListener('touchmove', onTouchMove, { passive: false });
	            this._domElement.ownerDocument.removeEventListener('pointerup', onPointerUp);
	            this._domElement.ownerDocument.removeEventListener('mouseup', onMouseUp);
	            this._domElement.ownerDocument.removeEventListener('touchend', onTouchEnd);
	        };
	        this.cancel = () => {
	            if (this._state === ACTION.NONE)
	                return;
	            this._state = ACTION.NONE;
	            this._activePointers.length = 0;
	            endDragging();
	        };
	        if (domElement)
	            this.connect(domElement);
	        this.update(0);
	    }
	    /**
	     * The camera to be controlled
	     * @category Properties
	     */
	    get camera() {
	        return this._camera;
	    }
	    set camera(camera) {
	        this._camera = camera;
	        this.updateCameraUp();
	        this._camera.updateProjectionMatrix();
	        this._updateNearPlaneCorners();
	        this._needsUpdate = true;
	    }
	    /**
	     * Whether or not the controls are enabled.
	     * `false` to disable user dragging/touch-move, but all methods works.
	     * @category Properties
	     */
	    get enabled() {
	        return this._enabled;
	    }
	    set enabled(enabled) {
	        if (!this._domElement)
	            return;
	        this._enabled = enabled;
	        if (enabled) {
	            this._domElement.style.touchAction = 'none';
	            this._domElement.style.userSelect = 'none';
	            this._domElement.style.webkitUserSelect = 'none';
	        }
	        else {
	            this.cancel();
	            this._domElement.style.touchAction = '';
	            this._domElement.style.userSelect = '';
	            this._domElement.style.webkitUserSelect = '';
	        }
	    }
	    /**
	     * Returns `true` if the controls are active updating.
	     * readonly value.
	     * @category Properties
	     */
	    get active() {
	        return !this._hasRested;
	    }
	    /**
	     * Getter for the current `ACTION`.
	     * readonly value.
	     * @category Properties
	     */
	    get currentAction() {
	        return this._state;
	    }
	    /**
	     * get/set Current distance.
	     * @category Properties
	     */
	    get distance() {
	        return this._spherical.radius;
	    }
	    set distance(distance) {
	        if (this._spherical.radius === distance &&
	            this._sphericalEnd.radius === distance)
	            return;
	        this._spherical.radius = distance;
	        this._sphericalEnd.radius = distance;
	        this._needsUpdate = true;
	    }
	    // horizontal angle
	    /**
	     * get/set the azimuth angle (horizontal) in radians.
	     * Every 360 degrees turn is added to `.azimuthAngle` value, which is accumulative.
	     * @category Properties
	     */
	    get azimuthAngle() {
	        return this._spherical.theta;
	    }
	    set azimuthAngle(azimuthAngle) {
	        if (this._spherical.theta === azimuthAngle &&
	            this._sphericalEnd.theta === azimuthAngle)
	            return;
	        this._spherical.theta = azimuthAngle;
	        this._sphericalEnd.theta = azimuthAngle;
	        this._needsUpdate = true;
	    }
	    // vertical angle
	    /**
	     * get/set the polar angle (vertical) in radians.
	     * @category Properties
	     */
	    get polarAngle() {
	        return this._spherical.phi;
	    }
	    set polarAngle(polarAngle) {
	        if (this._spherical.phi === polarAngle &&
	            this._sphericalEnd.phi === polarAngle)
	            return;
	        this._spherical.phi = polarAngle;
	        this._sphericalEnd.phi = polarAngle;
	        this._needsUpdate = true;
	    }
	    /**
	     * Whether camera position should be enclosed in the boundary or not.
	     * @category Properties
	     */
	    get boundaryEnclosesCamera() {
	        return this._boundaryEnclosesCamera;
	    }
	    set boundaryEnclosesCamera(boundaryEnclosesCamera) {
	        this._boundaryEnclosesCamera = boundaryEnclosesCamera;
	        this._needsUpdate = true;
	    }
	    /**
	     * Adds the specified event listener.
	     * Applicable event types (which is `K`) are:
	     * | Event name          | Timing |
	     * | ------------------- | ------ |
	     * | `'controlstart'`    | When the user starts to control the camera via mouse / touches. ¹ |
	     * | `'control'`         | When the user controls the camera (dragging). |
	     * | `'controlend'`      | When the user ends to control the camera. ¹ |
	     * | `'transitionstart'` | When any kind of transition starts, either user control or using a method with `enableTransition = true` |
	     * | `'update'`          | When the camera position is updated. |
	     * | `'wake'`            | When the camera starts moving. |
	     * | `'rest'`            | When the camera movement is below `.restThreshold` ². |
	     * | `'sleep'`           | When the camera end moving. |
	     *
	     * 1. `mouseButtons.wheel` (Mouse wheel control) does not emit `'controlstart'` and `'controlend'`. `mouseButtons.wheel` uses scroll-event internally, and scroll-event happens intermittently. That means "start" and "end" cannot be detected.
	     * 2. Due to damping, `sleep` will usually fire a few seconds after the camera _appears_ to have stopped moving. If you want to do something (e.g. enable UI, perform another transition) at the point when the camera has stopped, you probably want the `rest` event. This can be fine tuned using the `.restThreshold` parameter. See the [Rest and Sleep Example](https://yomotsu.github.io/camera-controls/examples/rest-and-sleep.html).
	     *
	     * e.g.
	     * ```
	     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
	     * ```
	     * @param type event name
	     * @param listener handler function
	     * @category Methods
	     */
	    addEventListener(type, listener) {
	        super.addEventListener(type, listener);
	    }
	    /**
	     * Removes the specified event listener
	     * e.g.
	     * ```
	     * cameraControl.addEventListener( 'controlstart', myCallbackFunction );
	     * ```
	     * @param type event name
	     * @param listener handler function
	     * @category Methods
	     */
	    removeEventListener(type, listener) {
	        super.removeEventListener(type, listener);
	    }
	    /**
	     * Rotate azimuthal angle(horizontal) and polar angle(vertical).
	     * Every value is added to the current value.
	     * @param azimuthAngle Azimuth rotate angle. In radian.
	     * @param polarAngle Polar rotate angle. In radian.
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    rotate(azimuthAngle, polarAngle, enableTransition = false) {
	        return this.rotateTo(this._sphericalEnd.theta + azimuthAngle, this._sphericalEnd.phi + polarAngle, enableTransition);
	    }
	    /**
	     * Rotate azimuthal angle(horizontal) to the given angle and keep the same polar angle(vertical) target.
	     *
	     * e.g.
	     * ```
	     * cameraControls.rotateAzimuthTo( 30 * THREE.MathUtils.DEG2RAD, true );
	     * ```
	     * @param azimuthAngle Azimuth rotate angle. In radian.
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    rotateAzimuthTo(azimuthAngle, enableTransition = false) {
	        return this.rotateTo(azimuthAngle, this._sphericalEnd.phi, enableTransition);
	    }
	    /**
	     * Rotate polar angle(vertical) to the given angle and keep the same azimuthal angle(horizontal) target.
	     *
	     * e.g.
	     * ```
	     * cameraControls.rotatePolarTo( 30 * THREE.MathUtils.DEG2RAD, true );
	     * ```
	     * @param polarAngle Polar rotate angle. In radian.
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    rotatePolarTo(polarAngle, enableTransition = false) {
	        return this.rotateTo(this._sphericalEnd.theta, polarAngle, enableTransition);
	    }
	    /**
	     * Rotate azimuthal angle(horizontal) and polar angle(vertical) to the given angle.
	     * Camera view will rotate over the orbit pivot absolutely:
	     *
	     * azimuthAngle
	     * ```
	     *       0º
	     *         \
	     * 90º -----+----- -90º
	     *           \
	     *           180º
	     * ```
	     * | direction | angle                  |
	     * | --------- | ---------------------- |
	     * | front     | 0º                     |
	     * | left      | 90º (`Math.PI / 2`)    |
	     * | right     | -90º (`- Math.PI / 2`) |
	     * | back      | 180º (`Math.PI`)       |
	     *
	     * polarAngle
	     * ```
	     *     180º
	     *      |
	     *      90º
	     *      |
	     *      0º
	     * ```
	     * | direction            | angle                  |
	     * | -------------------- | ---------------------- |
	     * | top/sky              | 180º (`Math.PI`)       |
	     * | horizontal from view | 90º (`Math.PI / 2`)    |
	     * | bottom/floor         | 0º                     |
	     *
	     * @param azimuthAngle Azimuth rotate angle to. In radian.
	     * @param polarAngle Polar rotate angle to. In radian.
	     * @param enableTransition  Whether to move smoothly or immediately
	     * @category Methods
	     */
	    rotateTo(azimuthAngle, polarAngle, enableTransition = false) {
	        const theta = clamp(azimuthAngle, this.minAzimuthAngle, this.maxAzimuthAngle);
	        const phi = clamp(polarAngle, this.minPolarAngle, this.maxPolarAngle);
	        this._sphericalEnd.theta = theta;
	        this._sphericalEnd.phi = phi;
	        this._sphericalEnd.makeSafe();
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._spherical.theta = this._sphericalEnd.theta;
	            this._spherical.phi = this._sphericalEnd.phi;
	        }
	        const resolveImmediately = !enableTransition ||
	            approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
	                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Dolly in/out camera position.
	     * @param distance Distance of dollyIn. Negative number for dollyOut.
	     * @param enableTransition Whether to move smoothly or immediately.
	     * @category Methods
	     */
	    dolly(distance, enableTransition = false) {
	        return this.dollyTo(this._sphericalEnd.radius - distance, enableTransition);
	    }
	    /**
	     * Dolly in/out camera position to given distance.
	     * @param distance Distance of dolly.
	     * @param enableTransition Whether to move smoothly or immediately.
	     * @category Methods
	     */
	    dollyTo(distance, enableTransition = false) {
	        const lastRadius = this._sphericalEnd.radius;
	        const newRadius = clamp(distance, this.minDistance, this.maxDistance);
	        const hasCollider = this.colliderMeshes.length >= 1;
	        if (hasCollider) {
	            const maxDistanceByCollisionTest = this._collisionTest();
	            const isCollided = approxEquals(maxDistanceByCollisionTest, this._spherical.radius);
	            const isDollyIn = lastRadius > newRadius;
	            if (!isDollyIn && isCollided)
	                return Promise.resolve();
	            this._sphericalEnd.radius = Math.min(newRadius, maxDistanceByCollisionTest);
	        }
	        else {
	            this._sphericalEnd.radius = newRadius;
	        }
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._spherical.radius = this._sphericalEnd.radius;
	        }
	        const resolveImmediately = !enableTransition || approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Zoom in/out camera. The value is added to camera zoom.
	     * Limits set with `.minZoom` and `.maxZoom`
	     * @param zoomStep zoom scale
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    zoom(zoomStep, enableTransition = false) {
	        return this.zoomTo(this._zoomEnd + zoomStep, enableTransition);
	    }
	    /**
	     * Zoom in/out camera to given scale. The value overwrites camera zoom.
	     * Limits set with .minZoom and .maxZoom
	     * @param zoom
	     * @param enableTransition
	     * @category Methods
	     */
	    zoomTo(zoom, enableTransition = false) {
	        this._zoomEnd = clamp(zoom, this.minZoom, this.maxZoom);
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._zoom = this._zoomEnd;
	        }
	        const resolveImmediately = !enableTransition || approxEquals(this._zoom, this._zoomEnd, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * @deprecated `pan()` has been renamed to `truck()`
	     * @category Methods
	     */
	    pan(x, y, enableTransition = false) {
	        console.warn('`pan` has been renamed to `truck`');
	        return this.truck(x, y, enableTransition);
	    }
	    /**
	     * Truck and pedestal camera using current azimuthal angle
	     * @param x Horizontal translate amount
	     * @param y Vertical translate amount
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    truck(x, y, enableTransition = false) {
	        this._camera.updateMatrix();
	        _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
	        _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
	        _xColumn.multiplyScalar(x);
	        _yColumn.multiplyScalar(-y);
	        const offset = _v3A.copy(_xColumn).add(_yColumn);
	        const to = _v3B.copy(this._targetEnd).add(offset);
	        return this.moveTo(to.x, to.y, to.z, enableTransition);
	    }
	    /**
	     * Move forward / backward.
	     * @param distance Amount to move forward / backward. Negative value to move backward
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    forward(distance, enableTransition = false) {
	        _v3A.setFromMatrixColumn(this._camera.matrix, 0);
	        _v3A.crossVectors(this._camera.up, _v3A);
	        _v3A.multiplyScalar(distance);
	        const to = _v3B.copy(this._targetEnd).add(_v3A);
	        return this.moveTo(to.x, to.y, to.z, enableTransition);
	    }
	    /**
	     * Move target position to given point.
	     * @param x x coord to move center position
	     * @param y y coord to move center position
	     * @param z z coord to move center position
	     * @param enableTransition Whether to move smoothly or immediately
	     * @category Methods
	     */
	    moveTo(x, y, z, enableTransition = false) {
	        const offset = _v3A.set(x, y, z).sub(this._targetEnd);
	        this._encloseToBoundary(this._targetEnd, offset, this.boundaryFriction);
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._target.copy(this._targetEnd);
	        }
	        const resolveImmediately = !enableTransition ||
	            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
	                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
	                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Look in the given point direction.
	     * @param x point x.
	     * @param y point y.
	     * @param z point z.
	     * @param enableTransition Whether to move smoothly or immediately.
	     * @returns Transition end promise
	     * @category Methods
	     */
	    lookInDirectionOf(x, y, z, enableTransition = false) {
	        const point = _v3A.set(x, y, z);
	        const direction = point.sub(this._targetEnd).normalize();
	        const position = direction.multiplyScalar(-this._sphericalEnd.radius);
	        return this.setPosition(position.x, position.y, position.z, enableTransition);
	    }
	    /**
	     * Fit the viewport to the box or the bounding box of the object, using the nearest axis. paddings are in unit.
	     * set `cover: true` to fill enter screen.
	     * e.g.
	     * ```
	     * cameraControls.fitToBox( myMesh );
	     * ```
	     * @param box3OrObject Axis aligned bounding box to fit the view.
	     * @param enableTransition Whether to move smoothly or immediately.
	     * @param options | `<object>` { cover: boolean, paddingTop: number, paddingLeft: number, paddingBottom: number, paddingRight: number }
	     * @returns Transition end promise
	     * @category Methods
	     */
	    fitToBox(box3OrObject, enableTransition, { cover = false, paddingLeft = 0, paddingRight = 0, paddingBottom = 0, paddingTop = 0 } = {}) {
	        const promises = [];
	        const aabb = box3OrObject.isBox3
	            ? _box3A.copy(box3OrObject)
	            : _box3A.setFromObject(box3OrObject);
	        if (aabb.isEmpty()) {
	            console.warn('camera-controls: fitTo() cannot be used with an empty box. Aborting');
	            Promise.resolve();
	        }
	        // round to closest axis ( forward | backward | right | left | top | bottom )
	        const theta = roundToStep(this._sphericalEnd.theta, PI_HALF);
	        const phi = roundToStep(this._sphericalEnd.phi, PI_HALF);
	        promises.push(this.rotateTo(theta, phi, enableTransition));
	        const normal = _v3A.setFromSpherical(this._sphericalEnd).normalize();
	        const rotation = _quaternionA.setFromUnitVectors(normal, _AXIS_Z);
	        const viewFromPolar = approxEquals(Math.abs(normal.y), 1);
	        if (viewFromPolar) {
	            rotation.multiply(_quaternionB.setFromAxisAngle(_AXIS_Y, theta));
	        }
	        rotation.multiply(this._yAxisUpSpaceInverse);
	        // make oriented bounding box
	        const bb = _box3B.makeEmpty();
	        // left bottom back corner
	        _v3B.copy(aabb.min).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // right bottom back corner
	        _v3B.copy(aabb.min).setX(aabb.max.x).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // left top back corner
	        _v3B.copy(aabb.min).setY(aabb.max.y).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // right top back corner
	        _v3B.copy(aabb.max).setZ(aabb.min.z).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // left bottom front corner
	        _v3B.copy(aabb.min).setZ(aabb.max.z).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // right bottom front corner
	        _v3B.copy(aabb.max).setY(aabb.min.y).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // left top front corner
	        _v3B.copy(aabb.max).setX(aabb.min.x).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // right top front corner
	        _v3B.copy(aabb.max).applyQuaternion(rotation);
	        bb.expandByPoint(_v3B);
	        // add padding
	        bb.min.x -= paddingLeft;
	        bb.min.y -= paddingBottom;
	        bb.max.x += paddingRight;
	        bb.max.y += paddingTop;
	        rotation.setFromUnitVectors(_AXIS_Z, normal);
	        if (viewFromPolar) {
	            rotation.premultiply(_quaternionB.invert());
	        }
	        rotation.premultiply(this._yAxisUpSpace);
	        const bbSize = bb.getSize(_v3A);
	        const center = bb.getCenter(_v3B).applyQuaternion(rotation);
	        if (isPerspectiveCamera(this._camera)) {
	            const distance = this.getDistanceToFitBox(bbSize.x, bbSize.y, bbSize.z, cover);
	            promises.push(this.moveTo(center.x, center.y, center.z, enableTransition));
	            promises.push(this.dollyTo(distance, enableTransition));
	            promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
	        }
	        else if (isOrthographicCamera(this._camera)) {
	            const camera = this._camera;
	            const width = camera.right - camera.left;
	            const height = camera.top - camera.bottom;
	            const zoom = cover ? Math.max(width / bbSize.x, height / bbSize.y) : Math.min(width / bbSize.x, height / bbSize.y);
	            promises.push(this.moveTo(center.x, center.y, center.z, enableTransition));
	            promises.push(this.zoomTo(zoom, enableTransition));
	            promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
	        }
	        return Promise.all(promises);
	    }
	    /**
	     * Fit the viewport to the sphere or the bounding sphere of the object.
	     * @param sphereOrMesh
	     * @param enableTransition
	     * @category Methods
	     */
	    fitToSphere(sphereOrMesh, enableTransition) {
	        const promises = [];
	        const isSphere = sphereOrMesh instanceof THREE$1.Sphere;
	        const boundingSphere = isSphere ?
	            _sphere.copy(sphereOrMesh) :
	            createBoundingSphere(sphereOrMesh, _sphere);
	        promises.push(this.moveTo(boundingSphere.center.x, boundingSphere.center.y, boundingSphere.center.z, enableTransition));
	        if (isPerspectiveCamera(this._camera)) {
	            const distanceToFit = this.getDistanceToFitSphere(boundingSphere.radius);
	            promises.push(this.dollyTo(distanceToFit, enableTransition));
	        }
	        else if (isOrthographicCamera(this._camera)) {
	            const width = this._camera.right - this._camera.left;
	            const height = this._camera.top - this._camera.bottom;
	            const diameter = 2 * boundingSphere.radius;
	            const zoom = Math.min(width / diameter, height / diameter);
	            promises.push(this.zoomTo(zoom, enableTransition));
	        }
	        promises.push(this.setFocalOffset(0, 0, 0, enableTransition));
	        return Promise.all(promises);
	    }
	    /**
	     * Look at the `target` from the `position`.
	     * @param positionX
	     * @param positionY
	     * @param positionZ
	     * @param targetX
	     * @param targetY
	     * @param targetZ
	     * @param enableTransition
	     * @category Methods
	     */
	    setLookAt(positionX, positionY, positionZ, targetX, targetY, targetZ, enableTransition = false) {
	        const target = _v3B.set(targetX, targetY, targetZ);
	        const position = _v3A.set(positionX, positionY, positionZ);
	        this._targetEnd.copy(target);
	        this._sphericalEnd.setFromVector3(position.sub(target).applyQuaternion(this._yAxisUpSpace));
	        this.normalizeRotations();
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._target.copy(this._targetEnd);
	            this._spherical.copy(this._sphericalEnd);
	        }
	        const resolveImmediately = !enableTransition ||
	            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
	                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
	                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold) &&
	                approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
	                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold) &&
	                approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Similar to setLookAt, but it interpolates between two states.
	     * @param positionAX
	     * @param positionAY
	     * @param positionAZ
	     * @param targetAX
	     * @param targetAY
	     * @param targetAZ
	     * @param positionBX
	     * @param positionBY
	     * @param positionBZ
	     * @param targetBX
	     * @param targetBY
	     * @param targetBZ
	     * @param t
	     * @param enableTransition
	     * @category Methods
	     */
	    lerpLookAt(positionAX, positionAY, positionAZ, targetAX, targetAY, targetAZ, positionBX, positionBY, positionBZ, targetBX, targetBY, targetBZ, t, enableTransition = false) {
	        const targetA = _v3A.set(targetAX, targetAY, targetAZ);
	        const positionA = _v3B.set(positionAX, positionAY, positionAZ);
	        _sphericalA.setFromVector3(positionA.sub(targetA).applyQuaternion(this._yAxisUpSpace));
	        const targetB = _v3C.set(targetBX, targetBY, targetBZ);
	        const positionB = _v3B.set(positionBX, positionBY, positionBZ);
	        _sphericalB.setFromVector3(positionB.sub(targetB).applyQuaternion(this._yAxisUpSpace));
	        this._targetEnd.copy(targetA.lerp(targetB, t)); // tricky
	        const deltaTheta = _sphericalB.theta - _sphericalA.theta;
	        const deltaPhi = _sphericalB.phi - _sphericalA.phi;
	        const deltaRadius = _sphericalB.radius - _sphericalA.radius;
	        this._sphericalEnd.set(_sphericalA.radius + deltaRadius * t, _sphericalA.phi + deltaPhi * t, _sphericalA.theta + deltaTheta * t);
	        this.normalizeRotations();
	        this._needsUpdate = true;
	        if (!enableTransition) {
	            this._target.copy(this._targetEnd);
	            this._spherical.copy(this._sphericalEnd);
	        }
	        const resolveImmediately = !enableTransition ||
	            approxEquals(this._target.x, this._targetEnd.x, this.restThreshold) &&
	                approxEquals(this._target.y, this._targetEnd.y, this.restThreshold) &&
	                approxEquals(this._target.z, this._targetEnd.z, this.restThreshold) &&
	                approxEquals(this._spherical.theta, this._sphericalEnd.theta, this.restThreshold) &&
	                approxEquals(this._spherical.phi, this._sphericalEnd.phi, this.restThreshold) &&
	                approxEquals(this._spherical.radius, this._sphericalEnd.radius, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Set angle and distance by given position.
	     * An alias of `setLookAt()`, without target change. Thus keep gazing at the current target
	     * @param positionX
	     * @param positionY
	     * @param positionZ
	     * @param enableTransition
	     * @category Methods
	     */
	    setPosition(positionX, positionY, positionZ, enableTransition = false) {
	        return this.setLookAt(positionX, positionY, positionZ, this._targetEnd.x, this._targetEnd.y, this._targetEnd.z, enableTransition);
	    }
	    /**
	     * Set the target position where gaze at.
	     * An alias of `setLookAt()`, without position change. Thus keep the same position.
	     * @param targetX
	     * @param targetY
	     * @param targetZ
	     * @param enableTransition
	     * @category Methods
	     */
	    setTarget(targetX, targetY, targetZ, enableTransition = false) {
	        const pos = this.getPosition(_v3A);
	        const promise = this.setLookAt(pos.x, pos.y, pos.z, targetX, targetY, targetZ, enableTransition);
	        // see https://github.com/yomotsu/camera-controls/issues/335
	        this._sphericalEnd.phi = clamp(this.polarAngle, this.minPolarAngle, this.maxPolarAngle);
	        return promise;
	    }
	    /**
	     * Set focal offset using the screen parallel coordinates. z doesn't affect in Orthographic as with Dolly.
	     * @param x
	     * @param y
	     * @param z
	     * @param enableTransition
	     * @category Methods
	     */
	    setFocalOffset(x, y, z, enableTransition = false) {
	        this._focalOffsetEnd.set(x, y, z);
	        this._needsUpdate = true;
	        if (!enableTransition)
	            this._focalOffset.copy(this._focalOffsetEnd);
	        this._affectOffset =
	            !approxZero(x) ||
	                !approxZero(y) ||
	                !approxZero(z);
	        const resolveImmediately = !enableTransition ||
	            approxEquals(this._focalOffset.x, this._focalOffsetEnd.x, this.restThreshold) &&
	                approxEquals(this._focalOffset.y, this._focalOffsetEnd.y, this.restThreshold) &&
	                approxEquals(this._focalOffset.z, this._focalOffsetEnd.z, this.restThreshold);
	        return this._createOnRestPromise(resolveImmediately);
	    }
	    /**
	     * Set orbit point without moving the camera.
	     * SHOULD NOT RUN DURING ANIMATIONS. `setOrbitPoint()` will immediately fix the positions.
	     * @param targetX
	     * @param targetY
	     * @param targetZ
	     * @category Methods
	     */
	    setOrbitPoint(targetX, targetY, targetZ) {
	        this._camera.updateMatrixWorld();
	        _xColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 0);
	        _yColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 1);
	        _zColumn.setFromMatrixColumn(this._camera.matrixWorldInverse, 2);
	        const position = _v3A.set(targetX, targetY, targetZ);
	        const distance = position.distanceTo(this._camera.position);
	        const cameraToPoint = position.sub(this._camera.position);
	        _xColumn.multiplyScalar(cameraToPoint.x);
	        _yColumn.multiplyScalar(cameraToPoint.y);
	        _zColumn.multiplyScalar(cameraToPoint.z);
	        _v3A.copy(_xColumn).add(_yColumn).add(_zColumn);
	        _v3A.z = _v3A.z + distance;
	        this.dollyTo(distance, false);
	        this.setFocalOffset(-_v3A.x, _v3A.y, -_v3A.z, false);
	        this.moveTo(targetX, targetY, targetZ, false);
	    }
	    /**
	     * Set the boundary box that encloses the target of the camera. box3 is in THREE.Box3
	     * @param box3
	     * @category Methods
	     */
	    setBoundary(box3) {
	        if (!box3) {
	            this._boundary.min.set(-Infinity, -Infinity, -Infinity);
	            this._boundary.max.set(Infinity, Infinity, Infinity);
	            this._needsUpdate = true;
	            return;
	        }
	        this._boundary.copy(box3);
	        this._boundary.clampPoint(this._targetEnd, this._targetEnd);
	        this._needsUpdate = true;
	    }
	    /**
	     * Set (or unset) the current viewport.
	     * Set this when you want to use renderer viewport and .dollyToCursor feature at the same time.
	     * @param viewportOrX
	     * @param y
	     * @param width
	     * @param height
	     * @category Methods
	     */
	    setViewport(viewportOrX, y, width, height) {
	        if (viewportOrX === null) { // null
	            this._viewport = null;
	            return;
	        }
	        this._viewport = this._viewport || new THREE$1.Vector4();
	        if (typeof viewportOrX === 'number') { // number
	            this._viewport.set(viewportOrX, y, width, height);
	        }
	        else { // Vector4
	            this._viewport.copy(viewportOrX);
	        }
	    }
	    /**
	     * Calculate the distance to fit the box.
	     * @param width box width
	     * @param height box height
	     * @param depth box depth
	     * @returns distance
	     * @category Methods
	     */
	    getDistanceToFitBox(width, height, depth, cover = false) {
	        if (notSupportedInOrthographicCamera(this._camera, 'getDistanceToFitBox'))
	            return this._spherical.radius;
	        const boundingRectAspect = width / height;
	        const fov = this._camera.getEffectiveFOV() * DEG2RAD;
	        const aspect = this._camera.aspect;
	        const heightToFit = (cover ? boundingRectAspect > aspect : boundingRectAspect < aspect) ? height : width / aspect;
	        return heightToFit * 0.5 / Math.tan(fov * 0.5) + depth * 0.5;
	    }
	    /**
	     * Calculate the distance to fit the sphere.
	     * @param radius sphere radius
	     * @returns distance
	     * @category Methods
	     */
	    getDistanceToFitSphere(radius) {
	        if (notSupportedInOrthographicCamera(this._camera, 'getDistanceToFitSphere'))
	            return this._spherical.radius;
	        // https://stackoverflow.com/a/44849975
	        const vFOV = this._camera.getEffectiveFOV() * DEG2RAD;
	        const hFOV = Math.atan(Math.tan(vFOV * 0.5) * this._camera.aspect) * 2;
	        const fov = 1 < this._camera.aspect ? vFOV : hFOV;
	        return radius / (Math.sin(fov * 0.5));
	    }
	    /**
	     * Returns its current gazing target, which is the center position of the orbit.
	     * @param out current gazing target
	     * @category Methods
	     */
	    getTarget(out) {
	        const _out = !!out && out.isVector3 ? out : new THREE$1.Vector3();
	        return _out.copy(this._targetEnd);
	    }
	    /**
	     * Returns its current position.
	     * @param out current position
	     * @category Methods
	     */
	    getPosition(out) {
	        const _out = !!out && out.isVector3 ? out : new THREE$1.Vector3();
	        return _out.setFromSpherical(this._sphericalEnd).applyQuaternion(this._yAxisUpSpaceInverse).add(this._targetEnd);
	    }
	    /**
	     * Returns its current focal offset, which is how much the camera appears to be translated in screen parallel coordinates.
	     * @param out current focal offset
	     * @category Methods
	     */
	    getFocalOffset(out) {
	        const _out = !!out && out.isVector3 ? out : new THREE$1.Vector3();
	        return _out.copy(this._focalOffsetEnd);
	    }
	    /**
	     * Normalize camera azimuth angle rotation between 0 and 360 degrees.
	     * @category Methods
	     */
	    normalizeRotations() {
	        this._sphericalEnd.theta = this._sphericalEnd.theta % PI_2;
	        if (this._sphericalEnd.theta < 0)
	            this._sphericalEnd.theta += PI_2;
	        this._spherical.theta += PI_2 * Math.round((this._sphericalEnd.theta - this._spherical.theta) / PI_2);
	    }
	    /**
	     * Reset all rotation and position to defaults.
	     * @param enableTransition
	     * @category Methods
	     */
	    reset(enableTransition = false) {
	        const promises = [
	            this.setLookAt(this._position0.x, this._position0.y, this._position0.z, this._target0.x, this._target0.y, this._target0.z, enableTransition),
	            this.setFocalOffset(this._focalOffset0.x, this._focalOffset0.y, this._focalOffset0.z, enableTransition),
	            this.zoomTo(this._zoom0, enableTransition),
	        ];
	        return Promise.all(promises);
	    }
	    /**
	     * Set current camera position as the default position.
	     * @category Methods
	     */
	    saveState() {
	        this.getTarget(this._target0);
	        this.getPosition(this._position0);
	        this._zoom0 = this._zoom;
	        this._focalOffset0.copy(this._focalOffset);
	    }
	    /**
	     * Sync camera-up direction.
	     * When camera-up vector is changed, `.updateCameraUp()` must be called.
	     * @category Methods
	     */
	    updateCameraUp() {
	        this._yAxisUpSpace.setFromUnitVectors(this._camera.up, _AXIS_Y);
	        this._yAxisUpSpaceInverse.copy(this._yAxisUpSpace).invert;
	    }
	    /**
	     * Update camera position and directions.
	     * This should be called in your tick loop every time, and returns true if re-rendering is needed.
	     * @param delta
	     * @returns updated
	     * @category Methods
	     */
	    update(delta) {
	        const isDragging = this._state !== ACTION.NONE;
	        const hasDragStateChanged = isDragging !== this._isLastDragging;
	        this._isLastDragging = isDragging;
	        const smoothTime = isDragging ? this.draggingSmoothTime : this.smoothTime;
	        if (hasDragStateChanged && isDragging) {
	            const changedSpeed = this.smoothTime / this.draggingSmoothTime;
	            this._thetaVelocity.value *= changedSpeed;
	            this._phiVelocity.value *= changedSpeed;
	            this._radiusVelocity.value *= changedSpeed;
	            this._targetVelocity.multiplyScalar(changedSpeed);
	            this._focalOffsetVelocity.multiplyScalar(changedSpeed);
	            this._zoomVelocity.value *= changedSpeed;
	        }
	        else if (hasDragStateChanged && !isDragging) {
	            const changedSpeed = this.draggingSmoothTime / this.smoothTime;
	            this._thetaVelocity.value *= changedSpeed;
	            this._phiVelocity.value *= changedSpeed;
	            this._radiusVelocity.value *= changedSpeed;
	            this._targetVelocity.multiplyScalar(changedSpeed);
	            this._focalOffsetVelocity.multiplyScalar(changedSpeed);
	            this._zoomVelocity.value *= changedSpeed;
	        }
	        const deltaTheta = this._sphericalEnd.theta - this._spherical.theta;
	        const deltaPhi = this._sphericalEnd.phi - this._spherical.phi;
	        const deltaRadius = this._sphericalEnd.radius - this._spherical.radius;
	        const deltaTarget = _deltaTarget.subVectors(this._targetEnd, this._target);
	        const deltaOffset = _deltaOffset.subVectors(this._focalOffsetEnd, this._focalOffset);
	        const deltaZoom = this._zoomEnd - this._zoom;
	        // update theta
	        if (approxZero(deltaTheta)) {
	            this._thetaVelocity.value = 0;
	            this._spherical.theta = this._sphericalEnd.theta;
	        }
	        else {
	            this._spherical.theta = smoothDamp(this._spherical.theta, this._sphericalEnd.theta, this._thetaVelocity, smoothTime, Infinity, delta);
	            this._needsUpdate = true;
	        }
	        // update phi
	        if (approxZero(deltaPhi)) {
	            this._phiVelocity.value = 0;
	            this._spherical.phi = this._sphericalEnd.phi;
	        }
	        else {
	            this._spherical.phi = smoothDamp(this._spherical.phi, this._sphericalEnd.phi, this._phiVelocity, smoothTime, Infinity, delta);
	            this._needsUpdate = true;
	        }
	        // update distance
	        if (approxZero(deltaRadius)) {
	            this._radiusVelocity.value = 0;
	            this._spherical.radius = this._sphericalEnd.radius;
	        }
	        else {
	            this._spherical.radius = smoothDamp(this._spherical.radius, this._sphericalEnd.radius, this._radiusVelocity, smoothTime, this.maxSpeed, delta);
	            this._needsUpdate = true;
	        }
	        // update target position
	        if (approxZero(deltaTarget.x) && approxZero(deltaTarget.y) && approxZero(deltaTarget.z)) {
	            this._targetVelocity.set(0, 0, 0);
	            this._target.copy(this._targetEnd);
	        }
	        else {
	            smoothDampVec3(this._target, this._targetEnd, this._targetVelocity, smoothTime, this.maxSpeed, delta, this._target);
	            this._needsUpdate = true;
	        }
	        // update focalOffset
	        if (approxZero(deltaOffset.x) && approxZero(deltaOffset.y) && approxZero(deltaOffset.z)) {
	            this._focalOffsetVelocity.set(0, 0, 0);
	            this._focalOffset.copy(this._focalOffsetEnd);
	        }
	        else {
	            smoothDampVec3(this._focalOffset, this._focalOffsetEnd, this._focalOffsetVelocity, smoothTime, this.maxSpeed, delta, this._focalOffset);
	            this._needsUpdate = true;
	        }
	        if (this._dollyControlAmount !== 0) {
	            if (isPerspectiveCamera(this._camera)) {
	                const camera = this._camera;
	                const cameraDirection = _v3A.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
	                const planeX = _v3B.copy(cameraDirection).cross(camera.up).normalize();
	                if (planeX.lengthSq() === 0)
	                    planeX.x = 1.0;
	                const planeY = _v3C.crossVectors(planeX, cameraDirection);
	                const worldToScreen = this._sphericalEnd.radius * Math.tan(camera.getEffectiveFOV() * DEG2RAD * 0.5);
	                const prevRadius = this._sphericalEnd.radius - this._dollyControlAmount;
	                const lerpRatio = (prevRadius - this._sphericalEnd.radius) / this._sphericalEnd.radius;
	                const cursor = _v3A.copy(this._targetEnd)
	                    .add(planeX.multiplyScalar(this._dollyControlCoord.x * worldToScreen * camera.aspect))
	                    .add(planeY.multiplyScalar(this._dollyControlCoord.y * worldToScreen));
	                this._targetEnd.lerp(cursor, lerpRatio);
	            }
	            else if (isOrthographicCamera(this._camera)) {
	                const camera = this._camera;
	                const worldCursorPosition = _v3A.set(this._dollyControlCoord.x, this._dollyControlCoord.y, (camera.near + camera.far) / (camera.near - camera.far)).unproject(camera); //.sub( _v3B.set( this._focalOffset.x, this._focalOffset.y, 0 ) );
	                const quaternion = _v3B.set(0, 0, -1).applyQuaternion(camera.quaternion);
	                const cursor = _v3C.copy(worldCursorPosition).add(quaternion.multiplyScalar(-worldCursorPosition.dot(camera.up)));
	                const prevZoom = this._zoom - this._dollyControlAmount;
	                const lerpRatio = -(prevZoom - this._zoomEnd) / this._zoom;
	                // find the "distance" (aka plane constant in three.js) of Plane
	                // from a given position (this._targetEnd) and normal vector (cameraDirection)
	                // https://www.maplesoft.com/support/help/maple/view.aspx?path=MathApps%2FEquationOfAPlaneNormal#bkmrk0
	                const cameraDirection = _v3A.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).normalize().negate();
	                const prevPlaneConstant = this._targetEnd.dot(cameraDirection);
	                this._targetEnd.lerp(cursor, lerpRatio);
	                const newPlaneConstant = this._targetEnd.dot(cameraDirection);
	                // Pull back the camera depth that has moved, to be the camera stationary as zoom
	                const pullBack = cameraDirection.multiplyScalar(newPlaneConstant - prevPlaneConstant);
	                this._targetEnd.sub(pullBack);
	            }
	            this._target.copy(this._targetEnd);
	            // target position may be moved beyond boundary.
	            this._boundary.clampPoint(this._targetEnd, this._targetEnd);
	            this._dollyControlAmount = 0;
	        }
	        // update zoom
	        if (approxZero(deltaZoom)) {
	            this._zoomVelocity.value = 0;
	            this._zoom = this._zoomEnd;
	        }
	        else {
	            this._zoom = smoothDamp(this._zoom, this._zoomEnd, this._zoomVelocity, this.smoothTime, Infinity, delta);
	        }
	        if (this._camera.zoom !== this._zoom) {
	            this._camera.zoom = this._zoom;
	            this._camera.updateProjectionMatrix();
	            this._updateNearPlaneCorners();
	            this._needsUpdate = true;
	        }
	        // collision detection
	        const maxDistance = this._collisionTest();
	        this._spherical.radius = Math.min(this._spherical.radius, maxDistance);
	        // decompose spherical to the camera position
	        this._spherical.makeSafe();
	        this._camera.position.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse).add(this._target);
	        this._camera.lookAt(this._target);
	        // set offset after the orbit movement
	        if (this._affectOffset) {
	            this._camera.updateMatrixWorld();
	            _xColumn.setFromMatrixColumn(this._camera.matrix, 0);
	            _yColumn.setFromMatrixColumn(this._camera.matrix, 1);
	            _zColumn.setFromMatrixColumn(this._camera.matrix, 2);
	            _xColumn.multiplyScalar(this._focalOffset.x);
	            _yColumn.multiplyScalar(-this._focalOffset.y);
	            _zColumn.multiplyScalar(this._focalOffset.z); // notice: z-offset will not affect in Orthographic.
	            _v3A.copy(_xColumn).add(_yColumn).add(_zColumn);
	            this._camera.position.add(_v3A);
	        }
	        if (this._boundaryEnclosesCamera) {
	            this._encloseToBoundary(this._camera.position.copy(this._target), _v3A.setFromSpherical(this._spherical).applyQuaternion(this._yAxisUpSpaceInverse), 1.0);
	        }
	        const updated = this._needsUpdate;
	        if (updated && !this._updatedLastTime) {
	            this._hasRested = false;
	            this.dispatchEvent({ type: 'wake' });
	            this.dispatchEvent({ type: 'update' });
	        }
	        else if (updated) {
	            this.dispatchEvent({ type: 'update' });
	            if (approxZero(deltaTheta, this.restThreshold) &&
	                approxZero(deltaPhi, this.restThreshold) &&
	                approxZero(deltaRadius, this.restThreshold) &&
	                approxZero(deltaTarget.x, this.restThreshold) &&
	                approxZero(deltaTarget.y, this.restThreshold) &&
	                approxZero(deltaTarget.z, this.restThreshold) &&
	                approxZero(deltaOffset.x, this.restThreshold) &&
	                approxZero(deltaOffset.y, this.restThreshold) &&
	                approxZero(deltaOffset.z, this.restThreshold) &&
	                approxZero(deltaZoom, this.restThreshold) &&
	                !this._hasRested) {
	                this._hasRested = true;
	                this.dispatchEvent({ type: 'rest' });
	            }
	        }
	        else if (!updated && this._updatedLastTime) {
	            this.dispatchEvent({ type: 'sleep' });
	        }
	        this._updatedLastTime = updated;
	        this._needsUpdate = false;
	        return updated;
	    }
	    /**
	     * Get all state in JSON string
	     * @category Methods
	     */
	    toJSON() {
	        return JSON.stringify({
	            enabled: this._enabled,
	            minDistance: this.minDistance,
	            maxDistance: infinityToMaxNumber(this.maxDistance),
	            minZoom: this.minZoom,
	            maxZoom: infinityToMaxNumber(this.maxZoom),
	            minPolarAngle: this.minPolarAngle,
	            maxPolarAngle: infinityToMaxNumber(this.maxPolarAngle),
	            minAzimuthAngle: infinityToMaxNumber(this.minAzimuthAngle),
	            maxAzimuthAngle: infinityToMaxNumber(this.maxAzimuthAngle),
	            smoothTime: this.smoothTime,
	            draggingSmoothTime: this.draggingSmoothTime,
	            dollySpeed: this.dollySpeed,
	            truckSpeed: this.truckSpeed,
	            dollyToCursor: this.dollyToCursor,
	            verticalDragToForward: this.verticalDragToForward,
	            target: this._targetEnd.toArray(),
	            position: _v3A.setFromSpherical(this._sphericalEnd).add(this._targetEnd).toArray(),
	            zoom: this._zoomEnd,
	            focalOffset: this._focalOffsetEnd.toArray(),
	            target0: this._target0.toArray(),
	            position0: this._position0.toArray(),
	            zoom0: this._zoom0,
	            focalOffset0: this._focalOffset0.toArray(),
	        });
	    }
	    /**
	     * Reproduce the control state with JSON. enableTransition is where anim or not in a boolean.
	     * @param json
	     * @param enableTransition
	     * @category Methods
	     */
	    fromJSON(json, enableTransition = false) {
	        const obj = JSON.parse(json);
	        const position = _v3A.fromArray(obj.position);
	        this.enabled = obj.enabled;
	        this.minDistance = obj.minDistance;
	        this.maxDistance = maxNumberToInfinity(obj.maxDistance);
	        this.minZoom = obj.minZoom;
	        this.maxZoom = maxNumberToInfinity(obj.maxZoom);
	        this.minPolarAngle = obj.minPolarAngle;
	        this.maxPolarAngle = maxNumberToInfinity(obj.maxPolarAngle);
	        this.minAzimuthAngle = maxNumberToInfinity(obj.minAzimuthAngle);
	        this.maxAzimuthAngle = maxNumberToInfinity(obj.maxAzimuthAngle);
	        this.smoothTime = obj.smoothTime;
	        this.draggingSmoothTime = obj.draggingSmoothTime;
	        this.dollySpeed = obj.dollySpeed;
	        this.truckSpeed = obj.truckSpeed;
	        this.dollyToCursor = obj.dollyToCursor;
	        this.verticalDragToForward = obj.verticalDragToForward;
	        this._target0.fromArray(obj.target0);
	        this._position0.fromArray(obj.position0);
	        this._zoom0 = obj.zoom0;
	        this._focalOffset0.fromArray(obj.focalOffset0);
	        this.moveTo(obj.target[0], obj.target[1], obj.target[2], enableTransition);
	        _sphericalA.setFromVector3(position.sub(this._targetEnd).applyQuaternion(this._yAxisUpSpace));
	        this.rotateTo(_sphericalA.theta, _sphericalA.phi, enableTransition);
	        this.zoomTo(obj.zoom, enableTransition);
	        this.setFocalOffset(obj.focalOffset[0], obj.focalOffset[1], obj.focalOffset[2], enableTransition);
	        this._needsUpdate = true;
	    }
	    /**
	     * Attach all internal event handlers to enable drag control.
	     * @category Methods
	     */
	    connect(domElement) {
	        if (this._domElement) {
	            console.warn('camera-controls is already connected.');
	            return;
	        }
	        domElement.setAttribute('data-camera-controls-version', VERSION);
	        this._addAllEventListeners(domElement);
	    }
	    /**
	     * Detach all internal event handlers to disable drag control.
	     */
	    disconnect() {
	        this._removeAllEventListeners();
	        this._domElement = undefined;
	    }
	    /**
	     * Dispose the cameraControls instance itself, remove all eventListeners.
	     * @category Methods
	     */
	    dispose() {
	        this.disconnect();
	        if (this._domElement && 'setAttribute' in this._domElement)
	            this._domElement.removeAttribute('data-camera-controls-version');
	    }
	    _findPointerById(pointerId) {
	        // to support IE11 use some instead of Array#find (will be removed when IE11 is deprecated)
	        let pointer = null;
	        this._activePointers.some((activePointer) => {
	            if (activePointer.pointerId === pointerId) {
	                pointer = activePointer;
	                return true;
	            }
	            return false;
	        });
	        return pointer;
	    }
	    _encloseToBoundary(position, offset, friction) {
	        const offsetLength2 = offset.lengthSq();
	        if (offsetLength2 === 0.0) { // sanity check
	            return position;
	        }
	        // See: https://twitter.com/FMS_Cat/status/1106508958640988161
	        const newTarget = _v3B.copy(offset).add(position); // target
	        const clampedTarget = this._boundary.clampPoint(newTarget, _v3C); // clamped target
	        const deltaClampedTarget = clampedTarget.sub(newTarget); // newTarget -> clampedTarget
	        const deltaClampedTargetLength2 = deltaClampedTarget.lengthSq(); // squared length of deltaClampedTarget
	        if (deltaClampedTargetLength2 === 0.0) { // when the position doesn't have to be clamped
	            return position.add(offset);
	        }
	        else if (deltaClampedTargetLength2 === offsetLength2) { // when the position is completely stuck
	            return position;
	        }
	        else if (friction === 0.0) {
	            return position.add(offset).add(deltaClampedTarget);
	        }
	        else {
	            const offsetFactor = 1.0 + friction * deltaClampedTargetLength2 / offset.dot(deltaClampedTarget);
	            return position
	                .add(_v3B.copy(offset).multiplyScalar(offsetFactor))
	                .add(deltaClampedTarget.multiplyScalar(1.0 - friction));
	        }
	    }
	    _updateNearPlaneCorners() {
	        if (isPerspectiveCamera(this._camera)) {
	            const camera = this._camera;
	            const near = camera.near;
	            const fov = camera.getEffectiveFOV() * DEG2RAD;
	            const heightHalf = Math.tan(fov * 0.5) * near; // near plain half height
	            const widthHalf = heightHalf * camera.aspect; // near plain half width
	            this._nearPlaneCorners[0].set(-widthHalf, -heightHalf, 0);
	            this._nearPlaneCorners[1].set(widthHalf, -heightHalf, 0);
	            this._nearPlaneCorners[2].set(widthHalf, heightHalf, 0);
	            this._nearPlaneCorners[3].set(-widthHalf, heightHalf, 0);
	        }
	        else if (isOrthographicCamera(this._camera)) {
	            const camera = this._camera;
	            const zoomInv = 1 / camera.zoom;
	            const left = camera.left * zoomInv;
	            const right = camera.right * zoomInv;
	            const top = camera.top * zoomInv;
	            const bottom = camera.bottom * zoomInv;
	            this._nearPlaneCorners[0].set(left, top, 0);
	            this._nearPlaneCorners[1].set(right, top, 0);
	            this._nearPlaneCorners[2].set(right, bottom, 0);
	            this._nearPlaneCorners[3].set(left, bottom, 0);
	        }
	    }
	    // lateUpdate
	    _collisionTest() {
	        let distance = Infinity;
	        const hasCollider = this.colliderMeshes.length >= 1;
	        if (!hasCollider)
	            return distance;
	        if (notSupportedInOrthographicCamera(this._camera, '_collisionTest'))
	            return distance;
	        // divide by distance to normalize, lighter than `Vector3.prototype.normalize()`
	        const direction = _v3A.setFromSpherical(this._spherical).divideScalar(this._spherical.radius);
	        _rotationMatrix.lookAt(_ORIGIN, direction, this._camera.up);
	        for (let i = 0; i < 4; i++) {
	            const nearPlaneCorner = _v3B.copy(this._nearPlaneCorners[i]);
	            nearPlaneCorner.applyMatrix4(_rotationMatrix);
	            const origin = _v3C.addVectors(this._target, nearPlaneCorner);
	            _raycaster.set(origin, direction);
	            _raycaster.far = this._spherical.radius + 1;
	            const intersects = _raycaster.intersectObjects(this.colliderMeshes);
	            if (intersects.length !== 0 && intersects[0].distance < distance) {
	                distance = intersects[0].distance;
	            }
	        }
	        return distance;
	    }
	    /**
	     * Get its client rect and package into given `DOMRect` .
	     */
	    _getClientRect(target) {
	        if (!this._domElement)
	            return;
	        const rect = this._domElement.getBoundingClientRect();
	        target.x = rect.left;
	        target.y = rect.top;
	        if (this._viewport) {
	            target.x += this._viewport.x;
	            target.y += rect.height - this._viewport.w - this._viewport.y;
	            target.width = this._viewport.z;
	            target.height = this._viewport.w;
	        }
	        else {
	            target.width = rect.width;
	            target.height = rect.height;
	        }
	        return target;
	    }
	    _createOnRestPromise(resolveImmediately) {
	        if (resolveImmediately)
	            return Promise.resolve();
	        this._hasRested = false;
	        this.dispatchEvent({ type: 'transitionstart' });
	        return new Promise((resolve) => {
	            const onResolve = () => {
	                this.removeEventListener('rest', onResolve);
	                resolve();
	            };
	            this.addEventListener('rest', onResolve);
	        });
	    }
	    // eslint-disable-next-line @typescript-eslint/no-unused-vars
	    _addAllEventListeners(_domElement) { }
	    _removeAllEventListeners() { }
	    /**
	     * backward compatible
	     * @deprecated use smoothTime (in seconds) instead
	     * @category Properties
	     */
	    get dampingFactor() {
	        console.warn('.dampingFactor has been deprecated. use smoothTime (in seconds) instead.');
	        return 0;
	    }
	    /**
	     * backward compatible
	     * @deprecated use smoothTime (in seconds) instead
	     * @category Properties
	     */
	    set dampingFactor(_) {
	        console.warn('.dampingFactor has been deprecated. use smoothTime (in seconds) instead.');
	    }
	    /**
	     * backward compatible
	     * @deprecated use draggingSmoothTime (in seconds) instead
	     * @category Properties
	     */
	    get draggingDampingFactor() {
	        console.warn('.draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead.');
	        return 0;
	    }
	    /**
	     * backward compatible
	     * @deprecated use draggingSmoothTime (in seconds) instead
	     * @category Properties
	     */
	    set draggingDampingFactor(_) {
	        console.warn('.draggingDampingFactor has been deprecated. use draggingSmoothTime (in seconds) instead.');
	    }
	}
	function createBoundingSphere(object3d, out) {
	    const boundingSphere = out;
	    const center = boundingSphere.center;
	    _box3A.makeEmpty();
	    // find the center
	    object3d.traverseVisible((object) => {
	        if (!object.isMesh)
	            return;
	        _box3A.expandByObject(object);
	    });
	    _box3A.getCenter(center);
	    // find the radius
	    let maxRadiusSq = 0;
	    object3d.traverseVisible((object) => {
	        if (!object.isMesh)
	            return;
	        const mesh = object;
	        const geometry = mesh.geometry.clone();
	        geometry.applyMatrix4(mesh.matrixWorld);
	        if (geometry.isBufferGeometry) {
	            const bufferGeometry = geometry;
	            const position = bufferGeometry.attributes.position;
	            for (let i = 0, l = position.count; i < l; i++) {
	                _v3A.fromBufferAttribute(position, i);
	                maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_v3A));
	            }
	        }
	        else {
	            // for old three.js, which supports both BufferGeometry and Geometry
	            // this condition block will be removed in the near future.
	            const position = geometry.attributes.position;
	            for (let i = 0, l = position.count; i < l; i++) {
	                _v3A.fromBufferAttribute(position, i);
	                maxRadiusSq = Math.max(maxRadiusSq, center.distanceToSquared(_v3A));
	            }
	        }
	    });
	    boundingSphere.radius = Math.sqrt(maxRadiusSq);
	    return boundingSphere;
	}

	onInstallHandlers.push(function () {
	  CameraControls.install({
	    THREE: THREE$2
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
	    _this.azimuthRotateSpeed = 0.3; // negative value to invert rotation direction
	    _this.polarRotateSpeed = -0.2; // negative value to invert rotation direction
	    _this.minPolarAngle = 30 * THREE$2.MathUtils.DEG2RAD;
	    _this.maxPolarAngle = 120 * THREE$2.MathUtils.DEG2RAD;
	    _this.draggingSmoothTime = 1e-10;
	    _this.mouseButtons.right = CameraControls.ACTION.NONE;
	    _this.mouseButtons.middle = CameraControls.ACTION.NONE;
	    _this.touches.two = CameraControls.ACTION.TOUCH_DOLLY;
	    _this.touches.three = CameraControls.ACTION.TOUCH_DOLLY;

	    // this._trackObject = trackObject;
	    // this.offset = new THREE.Vector3( 0, 1, 0 );
	    var offset = new THREE$2.Vector3(0, 1, 0);
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

	exports.AnimationController = AnimationController;
	exports.CharacterController = CharacterController;
	exports.KeyInputControl = KeyInputControl;
	exports.Octree = Octree;
	exports.TPSCameraControls = TPSCameraControls;
	exports.World = World;
	exports.install = install;

}));

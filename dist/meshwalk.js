/*!
 * meshwalk.js
 * https://github.com/yomotsu/meshwalk.js
 * (c) 2015 @yomotsu
 * Released under the MIT License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.MW = {})));
}(this, (function (exports) { 'use strict';

	var THREE$1 = void 0; // bind on install

	function install(_THREE) {

		if (THREE$1 && _THREE === THREE$1) {

			if (process.env.NODE_ENV !== 'production') {

				console.error('[THREE] already installed. `install` should be called only once.');
			}

			return;
		}

		THREE$1 = _THREE;
	}

	// aabb: <THREE.Box3>
	// Plane: <THREE.Plane>
	function isIntersectionAABBPlane(aabb, Plane) {

		var center = new THREE.Vector3().addVectors(aabb.max, aabb.min).multiplyScalar(0.5);
		var extents = new THREE.Vector3().subVectors(aabb.max, center);

		var r = extents.x * Math.abs(Plane.normal.x) + extents.y * Math.abs(Plane.normal.y) + extents.z * Math.abs(Plane.normal.z);
		var s = Plane.normal.dot(center) - Plane.constant;

		return Math.abs(s) <= r;
	}

	// based on http://www.gamedev.net/topic/534655-aabb-triangleplane-intersection--distance-to-plane-is-incorrect-i-have-solved-it/
	//
	// a: <THREE.Vector3>, // vertex of a triangle
	// b: <THREE.Vector3>, // vertex of a triangle
	// c: <THREE.Vector3>, // vertex of a triangle
	// aabb: <THREE.Box3>
	function isIntersectionTriangleAABB(a, b, c, aabb) {

		var p0 = void 0,
		    p1 = void 0,
		    p2 = void 0,
		    r = void 0;

		// Compute box center and extents of AABoundingBox (if not already given in that format)
		var center = new THREE.Vector3().addVectors(aabb.max, aabb.min).multiplyScalar(0.5);
		var extents = new THREE.Vector3().subVectors(aabb.max, center);

		// Translate triangle as conceptually moving AABB to origin
		var v0 = new THREE.Vector3().subVectors(a, center);
		var v1 = new THREE.Vector3().subVectors(b, center);
		var v2 = new THREE.Vector3().subVectors(c, center);

		// Compute edge vectors for triangle
		var f0 = new THREE.Vector3().subVectors(v1, v0);
		var f1 = new THREE.Vector3().subVectors(v2, v1);
		var f2 = new THREE.Vector3().subVectors(v0, v2);

		// Test axes a00..a22 (category 3)
		var a00 = new THREE.Vector3(0, -f0.z, f0.y);
		var a01 = new THREE.Vector3(0, -f1.z, f1.y);
		var a02 = new THREE.Vector3(0, -f2.z, f2.y);
		var a10 = new THREE.Vector3(f0.z, 0, -f0.x);
		var a11 = new THREE.Vector3(f1.z, 0, -f1.x);
		var a12 = new THREE.Vector3(f2.z, 0, -f2.x);
		var a20 = new THREE.Vector3(-f0.y, f0.x, 0);
		var a21 = new THREE.Vector3(-f1.y, f1.x, 0);
		var a22 = new THREE.Vector3(-f2.y, f2.x, 0);

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
		var plane = new THREE.Plane();
		plane.normal = new THREE.Vector3().copy(f1).cross(f0).normalize();
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

	//http://clb.demon.fi/MathGeoLib/docs/Triangle.cpp_code.html#459

	// sphere: <THREE.Sphere>
	// a: <THREE.Vector3>, // vertex of a triangle
	// b: <THREE.Vector3>, // vertex of a triangle
	// c: <THREE.Vector3>, // vertex of a triangle
	// normal: <THREE.Vector3>, // normal of a triangle
	function isIntersectionSphereTriangle(sphere, a, b, c, normal) {

		// http://realtimecollisiondetection.net/blog/?p=103

		// vs plain of traiangle face
		var A = new THREE.Vector3().subVectors(a, sphere.center);
		var B = new THREE.Vector3().subVectors(b, sphere.center);
		var C = new THREE.Vector3().subVectors(c, sphere.center);
		var rr = sphere.radius * sphere.radius;
		var V = new THREE.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A));
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
		var AB = new THREE.Vector3().subVectors(B, A);
		var BC = new THREE.Vector3().subVectors(C, B);
		var CA = new THREE.Vector3().subVectors(A, C);
		var d1 = ab - aa;
		var d2 = bc - bb;
		var d3 = ac - cc;
		var e1 = AB.dot(AB);
		var e2 = BC.dot(BC);
		var e3 = CA.dot(CA);
		var Q1 = new THREE.Vector3().subVectors(A.multiplyScalar(e1), AB.multiplyScalar(d1));
		var Q2 = new THREE.Vector3().subVectors(B.multiplyScalar(e2), BC.multiplyScalar(d2));
		var Q3 = new THREE.Vector3().subVectors(C.multiplyScalar(e3), CA.multiplyScalar(d3));
		var QC = new THREE.Vector3().subVectors(C.multiplyScalar(e1), Q1);
		var QA = new THREE.Vector3().subVectors(A.multiplyScalar(e2), Q2);
		var QB = new THREE.Vector3().subVectors(B.multiplyScalar(e3), Q3);

		if (Q1.dot(Q1) > rr * e1 * e1 && Q1.dot(QC) >= 0 || Q2.dot(Q2) > rr * e2 * e2 && Q2.dot(QA) >= 0 || Q3.dot(Q3) > rr * e3 * e3 && Q3.dot(QB) >= 0) {

			return false;
		}

		var distance = Math.sqrt(d * d / e) - sphere.radius - 1;
		var negatedNormal = new THREE.Vector3(-normal.x, -normal.y, -normal.z);
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


	function testSegmentTriangle(p, q, a, b, c) {

		var ab = b.clone().sub(a);
		var ac = c.clone().sub(a);
		var qp = p.clone().sub(q);

		var n = ab.clone().cross(ac);

		var d = qp.dot(n);
		if (d <= 0) return false;

		var ap = p.clone().sub(a);
		var t = ap.dot(n);

		if (t < 0) return 0;
		if (t > d) return 0;

		var e = qp.clone().cross(ap);
		var v = ac.dot(e);

		if (v < 0 || v > d) return 0;

		var w = ab.clone().dot(e) * -1;

		if (w < 0 || v + w > d) return 0;

		var ood = 1 / d;
		t *= ood;
		v *= ood;
		w *= ood;
		var u = 1 - v - w;

		var au = a.clone().multiplyScalar(u);
		var bv = b.clone().multiplyScalar(v);
		var cw = c.clone().multiplyScalar(w);
		var contactPoint = au.clone().add(bv).add(cw);

		return { contactPoint: contactPoint };
	}

	var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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
	var Octree = function () {
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
					key: 'importThreeMesh',
					value: function importThreeMesh(threeMesh) {

							threeMesh.updateMatrix();

							var geometryId = threeMesh.geometry.uuid;
							var geometry = threeMesh.geometry.clone();
							geometry.applyMatrix(threeMesh.matrix);
							geometry.computeVertexNormals();

							if (geometry instanceof THREE$1.BufferGeometry) {

									if (geometry.index !== undefined) {

											var indices = geometry.index.array;
											var positions = geometry.attributes.position.array;
											// const normals   = geometry.attributes.normal.array;
											var offsets = geometry.groups.length !== 0 ? geometry.groups : [{ start: 0, count: indices.length, index: 0 }];

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
															var vC = new THREE$1.Vector3().fromArray(positions, c * 3);

															// https://github.com/mrdoob/three.js/issues/4691
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
					key: 'addFace',
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
					key: 'removeThreeMesh',
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
					key: 'getIntersectedNodes',
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

	Octree.uniqTriangkesfromNodes = function (nodes) {

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

	var OctreeNode = function () {
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
					key: 'getParentNode',
					value: function getParentNode() {

							if (this.depth === 0) return null;
							this.tree.nodes[this.depth][this.mortonNumber >> 3];
					}
			}, {
					key: 'getChildNodes',
					value: function getChildNodes() {

							if (this.tree.maxDepth === this.depth) {

									return null;
							}

							var firstChild = this.mortonNumber << 3;

							return [this.tree.nodes[this.depth + 1][firstChild], this.tree.nodes[this.depth + 1][firstChild + 1], this.tree.nodes[this.depth + 1][firstChild + 2], this.tree.nodes[this.depth + 1][firstChild + 3], this.tree.nodes[this.depth + 1][firstChild + 4], this.tree.nodes[this.depth + 1][firstChild + 5], this.tree.nodes[this.depth + 1][firstChild + 6], this.tree.nodes[this.depth + 1][firstChild + 7]];
					}
			}]);

			return OctreeNode;
	}();

	//

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
	};

	// origin   : <THREE.Vector3>
	// direction: <THREE.Vector3>
	// distance : <Float>
	// class Ray{

	// 	constructor( origin, direction, distance ) {

	// 		this.origin = origin;
	// 		this.direction = direction;
	// 		this.distance = distance;

	// 	}

	// }

	var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	var World = function () {
				function World() {
							_classCallCheck$1(this, World);

							this.colliderPool = [];
							this.characterPool = [];
				}

				_createClass$1(World, [{
							key: 'add',
							value: function add(object) {

										if (object.isOctree) {

													this.colliderPool.push(object);
										} else if (object.isCharacterController) {

													this.characterPool.push(object);
													object.world = this;
										}
							}
				}, {
							key: 'step',
							value: function step(dt) {

										for (var i = 0, l = this.characterPool.length; i < l; i++) {

													var character = this.characterPool[i];
													var faces = void 0;

													// octree で絞られた node に含まれる face だけを
													// charactore に渡して判定する
													for (var ii = 0, ll = this.colliderPool.length; ii < ll; ii++) {

																var octree = this.colliderPool[ii];
																var sphere = new THREE$1.Sphere(character.center, character.radius + character.groundPadding);
																var intersectedNodes = octree.getIntersectedNodes(sphere, octree.maxDepth);
																faces = Octree.uniqTriangkesfromNodes(intersectedNodes);
													}

													character.collisionCandidate = faces;
													character.update(dt);
										}
							}
				}]);

				return World;
	}();

	var _createClass$2 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

	var AnimationController = function () {
			function AnimationController(mesh) {
					_classCallCheck$2(this, AnimationController);

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

			_createClass$2(AnimationController, [{
					key: 'play',
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
					key: 'turn',
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
					key: 'update',
					value: function update(delta) {

							this.mixer.update(delta);
					}
			}]);

			return AnimationController;
	}();

	var _createClass$3 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	// based on https://github.com/mrdoob/eventdispatcher.js/

	var EventDispatcher = function () {
			function EventDispatcher() {
					_classCallCheck$3(this, EventDispatcher);

					this._listeners = {};
			}

			_createClass$3(EventDispatcher, [{
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

	var _createClass$4 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$4(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var CharacterController = function (_EventDispatcher) {
				_inherits(CharacterController, _EventDispatcher);

				function CharacterController(object3d, radius) {
							_classCallCheck$4(this, CharacterController);

							var _this = _possibleConstructorReturn(this, (CharacterController.__proto__ || Object.getPrototypeOf(CharacterController)).call(this));

							_this.isCharacterController = true;
							_this.object = object3d;
							_this.center = _this.object.position.clone();
							_this.radius = radius;
							_this.groundPadding = .5;
							_this.maxSlopeGradient = Math.cos(50 * THREE.Math.DEG2RAD);
							_this.isGrounded = false;
							_this.isOnSlope = false;
							_this.isIdling = false;
							_this.isRunning = false;
							_this.isJumping = false;
							_this.direction = 0; // 0 to 2PI(=360deg) in rad
							_this.movementSpeed = 10; // Meters Per Second
							_this.velocity = new THREE.Vector3(0, -10, 0);
							_this.currentJumpPower = 0;
							_this.jumpStartTime = 0;
							_this.groundHeight = 0;
							_this.groundNormal = new THREE.Vector3();
							_this.collisionCandidate;
							_this.contactInfo = [];

							var isFirstUpdate = true;
							var wasGrounded = void 0;
							var wasOnSlope = void 0;
							var wasIdling = void 0;
							var wasRunning = void 0;
							var wasJumping = void 0;

							_this.events = function () {

										// 初回のみ、過去状態を作るだけで終わり
										if (isFirstUpdate) {

													isFirstUpdate = false;
													wasGrounded = _this.isGrounded;
													wasOnSlope = _this.isOnSlope;
													wasIdling = _this.isIdling;
													wasRunning = _this.isRunning;
													wasJumping = _this.isJumping;
													return;
										}

										if (!wasRunning && !_this.isRunning && _this.isGrounded && !_this.isIdling) {

													_this.isIdling = true;
													_this.dispatchEvent({ type: 'startIdling' });
										} else if (!wasRunning && _this.isRunning && !_this.isJumping && _this.isGrounded || !wasGrounded && _this.isGrounded && _this.isRunning || wasOnSlope && !_this.isOnSlope && _this.isRunning && _this.isGrounded) {

													_this.isIdling = false;
													_this.dispatchEvent({ type: 'startWalking' });
										} else if (!wasJumping && _this.isJumping) {

													_this.isIdling = false;
													_this.dispatchEvent({ type: 'startJumping' });
										} else if (!wasOnSlope && _this.isOnSlope) {

													_this.dispatchEvent({ type: 'startSliding' });
										} else if (wasGrounded && !_this.isGrounded && !_this.isJumping) {

													_this.dispatchEvent({ type: 'startFalling' });
										}

										if (!wasGrounded && _this.isGrounded) ;

										wasGrounded = _this.isGrounded;
										wasOnSlope = _this.isOnSlope;
										wasIdling = _this.isIdling;
										wasRunning = _this.isRunning;
										wasJumping = _this.isJumping;
							};

							return _this;
				}

				_createClass$4(CharacterController, [{
							key: 'update',
							value: function update(dt) {

										// 状態をリセットしておく
										this.isGrounded = false;
										this.isOnSlope = false;
										this.groundHeight = -Infinity;
										this.groundNormal.set(0, 1, 0);

										this.updateGrounding();
										this.updateJumping();
										this.updatePosition(dt);
										this.collisionDetection();
										this.solvePosition();
										this.updateVelocity();
										this.events();
							}
				}, {
							key: 'updateVelocity',
							value: function updateVelocity() {

										var FALL_VELOCITY = -20;
										var frontDierction = -Math.cos(this.direction);
										var rightDierction = -Math.sin(this.direction);

										var isHittingCeiling = false;

										this.velocity.set(rightDierction * this.movementSpeed * this.isRunning, FALL_VELOCITY, frontDierction * this.movementSpeed * this.isRunning);

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
													var holizontalSpead = -slidingDownVelocity / (1 - this.groundNormal.y) * 0.2;

													this.velocity.x = this.groundNormal.x * holizontalSpead;
													this.velocity.y = FALL_VELOCITY;
													this.velocity.z = this.groundNormal.z * holizontalSpead;

													// ジャンプの処理
										} else if (!this.isGrounded && !this.isOnSlope && this.isJumping) {

													this.velocity.y = this.currentJumpPower * -FALL_VELOCITY;
										}

										// 壁に向かった場合、壁方向の速度を0にする処理
										// vs walls and sliding on the wall
										var direction2D = new THREE.Vector2(rightDierction, frontDierction);
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

													var wallNomal2D = new THREE.Vector2(normal.x, normal.z).normalize();
													var wallAngle = Math.atan2(wallNomal2D.y, wallNomal2D.x);

													if (Math.abs(negativeFrontAngle - wallAngle) >= Math.PI * 0.5 && //  90deg
													Math.abs(negativeFrontAngle - wallAngle) <= Math.PI * 1.5 // 270deg
													) {

																			// フェイスは進行方向とは逆方向、要は背中側の壁なので
																			// 速度の減衰はしないでいい
																			continue;
																}

													// 上記までの条件に一致しなければ、フェイスは壁
													// 壁の法線を求めて、その逆方向に向いている速度ベクトルを0にする
													wallNomal2D.set(direction2D.dot(wallNomal2D) * wallNomal2D.x, direction2D.dot(wallNomal2D) * wallNomal2D.y);
													direction2D.sub(wallNomal2D);

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
							key: 'updateGrounding',
							value: function updateGrounding() {

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

										var groundContactInfo = void 0;
										var groundContactInfoTmp = void 0;
										var faces = this.collisionCandidate;

										var head = new THREE.Vector3(this.center.x, this.center.y + this.radius, this.center.z);

										var to = new THREE.Vector3(this.center.x, this.center.y - 1e10, this.center.z);

										for (var i = 0, l = faces.length; i < l; i++) {

													groundContactInfoTmp = testSegmentTriangle(head, to, faces[i].a, faces[i].b, faces[i].c);

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

										var top = head.y;
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
							key: 'updatePosition',
							value: function updatePosition(dt) {

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
							key: 'collisionDetection',
							value: function collisionDetection() {

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
							key: 'solvePosition',
							value: function solvePosition() {

										// updatePosition() で center を動かした後
										// 壁と衝突し食い込んでいる場合、
										// ここで壁の外への押し出しをする

										var face = void 0;
										var normal = void 0;
										// let distance;
										var point1 = new THREE.Vector3();
										var point2 = new THREE.Vector3();
										var direction = new THREE.Vector3();
										var translateScoped = new THREE.Vector3();
										var translate = new THREE.Vector3();

										if (this.contactInfo.length === 0) {

													// 何とも衝突していない
													// centerの値をそのままつかって終了
													this.object.position.copy(this.center);
													return;
										}

										//
										// vs walls and sliding on the wall

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
							key: 'setDirection',
							value: function setDirection() {}
				}, {
							key: 'jump',
							value: function jump() {

										if (this.isJumping || !this.isGrounded || this.isOnSlope) return;

										// since ios dose not support porformance.now()
										// this.jumpStartTime = performance.now();
										this.jumpStartTime = Date.now();
										this.currentJumpPower = 1;
										this.isJumping = true;
							}
				}, {
							key: 'updateJumping',
							value: function updateJumping() {

										var JUMP_DURATION = 1000;

										if (!this.isJumping) return;

										// since ios dose not support porformance.now()
										// var elapsed = performance.now() - this.jumpStartTime;
										var elapsed = Date.now() - this.jumpStartTime;
										var progress = elapsed / JUMP_DURATION;
										this.currentJumpPower = Math.cos(Math.min(progress, 1) * Math.PI);
							}
				}]);

				return CharacterController;
	}(EventDispatcher);

	var _createClass$5 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$5(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn$1(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits$1(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

	var KeyInputControl = function (_EventDispatcher) {
		_inherits$1(KeyInputControl, _EventDispatcher);

		function KeyInputControl() {
			_classCallCheck$5(this, KeyInputControl);

			var _this = _possibleConstructorReturn$1(this, (KeyInputControl.__proto__ || Object.getPrototypeOf(KeyInputControl)).call(this));

			_this.isDisabled = false;

			_this.isUp = false;
			_this.isDown = false;
			_this.isLeft = false;
			_this.isRight = false;
			_this.isMoveKeyHolded = false;
			_this.frontAngle = 0;

			_this._keydownListener = onkeydown.bind(_this);
			_this._keyupListener = onkeyup.bind(_this);
			_this._blurListener = onblur.bind(_this);

			window.addEventListener('keydown', _this._keydownListener);
			window.addEventListener('keyup', _this._keyupListener);
			window.addEventListener('blur', _this._blurListener);

			return _this;
		}

		_createClass$5(KeyInputControl, [{
			key: 'jump',
			value: function jump() {

				this.dispatchEvent({ type: 'jumpkeypress' });
			}
		}, {
			key: 'updateAngle',
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

	function onkeydown(event) {

		if (this.isDisabled) return;

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

			this.dispatchEvent({ type: 'movekeychange' });
		}

		if ((this.isUp || this.isDown || this.isLeft || this.isRight) && !this.isMoveKeyHolded) {

			this.isMoveKeyHolded = true;
			this.dispatchEvent({ type: 'movekeyon' });
		}
	}

	function onkeyup(event) {

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

			this.dispatchEvent({ type: 'movekeychange' });
		}

		if (!this.isUp && !this.isDown && !this.isLeft && !this.isRight && (event.keyCode === KEY_W || event.keyCode === KEY_UP || event.keyCode === KEY_S || event.keyCode === KEY_DOWN || event.keyCode === KEY_A || event.keyCode === KEY_LEFT || event.keyCode === KEY_D || event.keyCode === KEY_RIGHT)) {

			this.isMoveKeyHolded = false;
			this.dispatchEvent({ type: 'movekeyoff' });
		}
	}

	function onblur() {

		this.isUp = false;
		this.isDown = false;
		this.isLeft = false;
		this.isRight = false;

		if (this.isMoveKeyHolded) {

			this.isMoveKeyHolded = false;
			this.dispatchEvent({ type: 'movekeyoff' });
		}
	}

	var _createClass$6 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

	function _classCallCheck$6(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	function _possibleConstructorReturn$2(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

	function _inherits$2(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

	var PI2 = Math.PI * 2;
	var PI_HALF = Math.PI / 2;

	var rotationMatrix = new THREE.Matrix4();
	var rotationX = new THREE.Matrix4();
	var rotationY = new THREE.Matrix4();

	// camera              isntance of THREE.Camera
	// trackObject         isntance of THREE.Object3D
	// params.el           DOM element
	// params.radius       number
	// params.minRadius    number
	// params.maxRadius    number
	// params.rigidObjects array of inctances of THREE.Mesh
	var TPSCameraControl = function (_EventDispatcher) {
		_inherits$2(TPSCameraControl, _EventDispatcher);

		function TPSCameraControl(camera, trackObject) {
			var params = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

			_classCallCheck$6(this, TPSCameraControl);

			var _this = _possibleConstructorReturn$2(this, (TPSCameraControl.__proto__ || Object.getPrototypeOf(TPSCameraControl)).call(this));

			_this.camera = camera;
			_this.trackObject = trackObject;
			_this.el = params.el || document.body;
			_this.offset = params.offset || new THREE.Vector3(0, 0, 0), _this.radius = params.radius || 10;
			_this.minRadius = params.minRadius || 1;
			_this.maxRadius = params.maxRadius || 30;
			_this.rigidObjects = params.rigidObjects || [];
			_this.lat = 0;
			_this.lon = 0;
			_this.phi = 0; // angle of zenith
			_this.theta = 0; // angle of azimuth
			_this.mouseAccelerationX = params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
			_this.mouseAccelerationY = params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
			_this._pointerStart = { x: 0, y: 0 };
			_this._pointerLast = { x: 0, y: 0 };

			_this.setNearPlainCornersWithPadding();
			_this.update();

			_this._mousedownListener = onmousedown.bind(_this);
			_this._mouseupListener = onmouseup.bind(_this);
			_this._mousedragListener = onmousedrag.bind(_this);
			_this._scrollListener = onscroll.bind(_this);

			_this.el.addEventListener('mousedown', _this._mousedownListener);
			_this.el.addEventListener('mouseup', _this._mouseupListener);
			_this.el.addEventListener('mousewheel', _this._scrollListener);
			_this.el.addEventListener('DOMMouseScroll', _this._scrollListener);

			return _this;
		}

		_createClass$6(TPSCameraControl, [{
			key: 'update',
			value: function update() {

				this._center = new THREE.Vector3(this.trackObject.matrixWorld.elements[12] + this.offset.x, this.trackObject.matrixWorld.elements[13] + this.offset.y, this.trackObject.matrixWorld.elements[14] + this.offset.z);

				var position = new THREE.Vector3(Math.cos(this.phi) * Math.cos(this.theta + PI_HALF), Math.sin(this.phi), Math.cos(this.phi) * Math.sin(this.theta + PI_HALF));
				var distance = this.collisionTest(position.clone().normalize());
				position.multiplyScalar(distance);
				position.add(this._center);
				this.camera.position.copy(position);

				if (this.lat === 90) {

					this.camera.up.set(Math.cos(this.theta + Math.PI), 0, Math.sin(this.theta + Math.PI));
				} else if (this.lat === -90) {

					this.camera.up.set(Math.cos(this.theta), 0, Math.sin(this.theta));
				} else {

					this.camera.up.set(0, 1, 0);
				}

				this.camera.lookAt(this._center);
				this.dispatchEvent({ type: 'updated' });
			}
		}, {
			key: 'getFrontAngle',
			value: function getFrontAngle() {

				return PI2 + this.theta;
			}
		}, {
			key: 'setNearPlainCornersWithPadding',
			value: function setNearPlainCornersWithPadding() {

				var near = this.camera.near;
				var halfFov = this.camera.fov * 0.5;
				var h = Math.tan(halfFov * THREE.Math.DEG2RAD) * near;
				var w = h * this.camera.aspect;

				this.nearPlainCornersWithPadding = [new THREE.Vector3(-w - near, -h - near, 0), new THREE.Vector3(w + near, -h - near, 0), new THREE.Vector3(w + near, h + near, 0), new THREE.Vector3(-w - near, h + near, 0)];
			}
		}, {
			key: 'setLatLon',
			value: function setLatLon(lat, lon) {

				this.lat = lat > 90 ? 90 : lat < -90 ? -90 : lat;
				this.lon = lon < 0 ? 360 + lon % 360 : lon % 360;

				this.phi = this.lat * THREE.Math.DEG2RAD;
				this.theta = -this.lon * THREE.Math.DEG2RAD;
			}
		}, {
			key: 'collisionTest',
			value: function collisionTest(direction) {

				var distance = this.radius;

				rotationX.makeRotationX(this.phi);
				rotationY.makeRotationY(this.theta);
				rotationMatrix.multiplyMatrices(rotationX, rotationY);

				for (var i = 0; i < 4; i++) {

					var nearPlainCorner = this.nearPlainCornersWithPadding[i].clone();
					nearPlainCorner.applyMatrix4(rotationMatrix);

					var origin = new THREE.Vector3(this._center.x + nearPlainCorner.x, this._center.y + nearPlainCorner.y, this._center.z + nearPlainCorner.z);
					var raycaster = new THREE.Raycaster(origin, // origin
					direction, // direction
					this.camera.near, // near
					this.radius // far
					);
					var intersects = raycaster.intersectObjects(this.rigidObjects);

					if (intersects.length !== 0 && intersects[0].distance < distance) {

						distance = intersects[0].distance;
					}
				}

				return distance;
			}
		}]);

		return TPSCameraControl;
	}(EventDispatcher);

	function onmousedown(event) {

		this.dispatchEvent({ type: 'mousedown' });
		this._pointerStart.x = event.clientX;
		this._pointerStart.y = event.clientY;
		this._pointerLast.x = this.lon;
		this._pointerLast.y = this.lat;
		this.el.removeEventListener('mousemove', this._mousedragListener, false);
		this.el.addEventListener('mousemove', this._mousedragListener, false);
		document.body.classList.add('js-TPSCameraDragging');
	}

	function onmouseup() {

		this.dispatchEvent({ type: 'mouseup' });
		this.el.removeEventListener('mousemove', this._mousedragListener, false);
		document.body.classList.remove('js-TPSCameraDragging');
	}

	function onmousedrag(event) {

		var w = this.el.offsetWidth;
		var h = this.el.offsetHeight;
		var x = (this._pointerStart.x - event.clientX) / w * 2;
		var y = (this._pointerStart.y - event.clientY) / h * 2;

		this.setLatLon(this._pointerLast.y + y * this.mouseAccelerationY, this._pointerLast.x + x * this.mouseAccelerationX);
	}

	function onscroll(event) {

		event.preventDefault();

		if (event.wheelDeltaY) {

			// WebKit
			this.radius -= event.wheelDeltaY * 0.05 / 5;
		} else if (event.wheelDelta) {

			// IE
			this.radius -= event.wheelDelta * 0.05 / 5;
		} else if (event.detail) {

			// Firefox
			this.radius += event.detail / 5;
		}

		this.radius = Math.max(this.radius, this.minRadius);
		this.radius = Math.min(this.radius, this.maxRadius);
	}

	exports.install = install;
	exports.World = World;
	exports.Octree = Octree;
	exports.AnimationController = AnimationController;
	exports.CharacterController = CharacterController;
	exports.KeyInputControl = KeyInputControl;
	exports.TPSCameraControl = TPSCameraControl;

	Object.defineProperty(exports, '__esModule', { value: true });

})));

# MeshWalk.js

MeshWalk.js is a JS library which helps your TPS game development with three.js.

## Version Compatability

THREE.js [r88 development](https://github.com/mrdoob/three.js/blob/2b1a620308ce4cd3388a840cc291773a74cfa52f/build/three.min.js)

BLUEBIRD.js [3.5.0](https://cdn.jsdelivr.net/bluebird/latest/bluebird.min.js)

`THREE.r74+ EventDispatcher.prototype.apply() changed to: EventDispatcher.apply()`

`THREE.r84+ EventDispatcher.apply has been removed. Inherit or Object.assign the prototype to mix-in instead.`

`THREE.r88 dev Compatible! :)`

examples
- [walkthrough: since it's done with previous version, the APIs are a little bit different](https://yomotsu.github.io/walkthrough/)
- [xmas walkthrough](https://yomotsu.github.io/xmas2014/)

## Usage and Learning

See following demos and check the source code with some comments.

1. [getstarted](http://yomotsu.github.io/meshwalk.js/example/1_getstarted.html)
2. [keyboardInput](http://yomotsu.github.io/meshwalk.js/example/2_keyboardInput.html)
3. [cameraControl](http://yomotsu.github.io/meshwalk.js/example/3_cameraControl.html)
4. [objects](http://yomotsu.github.io/meshwalk.js/example/4_objects.html)
5. [terrain](http://yomotsu.github.io/meshwalk.js/example/5_terrain.html)
6. [animationController](http://yomotsu.github.io/meshwalk.js/example/6_animationController.html)
7. [all together](http://yomotsu.github.io/meshwalk.js/example/7_allTogether.html)
8. [remove collider](http://yomotsu.github.io/meshwalk.js/example/8_meshRemove.html)

## Outdated:

`ex. 4&5 THREE.WireframeHelper has been removed. Use THREE.WireframeGeometry instead.`

`ex. 6&7 THREE.MeshFaceMaterial has been removed. Use an Array instead.`
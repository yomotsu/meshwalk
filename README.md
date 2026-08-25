## MeshWalk.js

MeshWalk.js is a lightweight character controller library for three.js game development.

examples

- [walkthrough: since it's done with previous version, the APIs are a little bit different](https://yomotsu.github.io/walkthrough/)
- [xmas walkthrough](https://yomotsu.github.io/xmas2014/)

## Usage and Examples

See the following demos and check the source code, which includes comments explaining each feature.
(Requires three.js, installed via peer dependencies or loaded with an import map.)

1. [get started](http://yomotsu.github.io/meshwalk/examples/1_get-started.html)
2. [keyboard Input](http://yomotsu.github.io/meshwalk/examples/2_keyboard-input.html)
3. [the CameraControl](http://yomotsu.github.io/meshwalk/examples/3_camera-control.html)
4. [objects](http://yomotsu.github.io/meshwalk/examples/4_objects.html)
5. [terrain](http://yomotsu.github.io/meshwalk/examples/5_terrain.html)
6. [AnimationController](http://yomotsu.github.io/meshwalk/examples/6_animation-controller.html)
7. [all together](http://yomotsu.github.io/meshwalk/examples/7_all-together.html)
8. [remove collider](http://yomotsu.github.io/meshwalk/examples/8_mesh-remove.html)
9. [moving platform](http://yomotsu.github.io/meshwalk/examples/9_moving-platform.html)
10. [ladder](http://yomotsu.github.io/meshwalk/examples/10_ladder.html)

examples with [recast-navigation-js](https://github.com/isaac-mason/recast-navigation-js):

- [with recast nav-mesh: followers](http://yomotsu.github.io/meshwalk/examples/20_with-recast-nav-mesh-followers.html)
- [with recast nav-mesh: auto navigation](http://yomotsu.github.io/meshwalk/examples/21_with-recast-nav-mesh-navigation.html)

## Getting started

```
npm install three meshwalk
```

```js
import * as THREE from 'three';
import * as MW from 'meshwalk';

const world = new MW.World();

// Bake the level geometry into a collider (a snapshot of its world transform)
const level = MW.StaticBody.fromObject( levelMesh );
world.add( level );

const player = new MW.CharacterController( { radius: 0.5, height: 2 } );
player.teleport( new THREE.Vector3( 0, 10, 0 ) );
world.add( player );

const timer = new THREE.Timer();
timer.connect( document );

( function update() {

	requestAnimationFrame( update );
	timer.update();
	const delta = timer.getDelta();

	player.move( desiredHorizontalVelocity ); // a THREE.Vector3, in m/s
	world.update( delta );

	// The engine never touches your scene graph -- copy the transform yourself
	playerMesh.position.copy( player.position );
	playerMesh.quaternion.copy( player.quaternion );

	renderer.render( scene, camera );

} )();
```

Units are meters and seconds. `world.update( delta )` accepts a real frame delta and runs the
simulation on a fixed step internally, so behavior does not depend on the frame rate.

## API

### `World( { fps = 60, stepsPerFrame = 4 } )`

| member | description |
|---|---|
| `add( body )` | Register a `StaticBody`, `KinematicBody`, `CharacterController` or `ClimbableBody`. |
| `remove( body )` | Unregister it. |
| `update( deltaTime )` | Advance by a real delta (seconds). Accumulates into fixed steps of `1 / fps`, catching up at most 5 frames' worth at once so a long stall cannot spiral. |
| `fixedUpdate()` | Advance exactly one fixed step. Deterministic, useful for tests. |
| `colliders` | Read only list of the registered `StaticBody` / `KinematicBody`. |
| `dispose()` | Dispose every registered body and drop the references. |

### `StaticBody`

The static environment collider: a triangle mesh that never moves, baked into an internal octree.

| member | description |
|---|---|
| `StaticBody.fromObject( object3D )` | Create from an `Object3D`, walking its descendants and taking every `Mesh` in world space. |
| `addFromObject( object3D )` | Same, additive. |
| `addFromGeometry( geometry, matrix? )` | Take a `BufferGeometry` directly, optionally transformed. |
| `addTriangles( positions, indices? )` | Take already baked world-space flat xyz positions and optional triangle indices directly. |
| `rayIntersect( ray, far? )` | Cast a ray. Returns `{ distance, triangle, position }` or `false`. Back faces are ignored. |
| `sphereCast( origin, direction, maxDistance, radius )` | Sweep a sphere. Returns `{ distance, triangle, position }` or `false`. Back faces and faces already touching at the start are ignored. |
| `dispose()` | Drop the baked triangles. |

Geometry is snapshotted at the time it is added, so moving the source `Object3D` afterwards does
not move the collider. Use `KinematicBody` for geometry that moves.

### `KinematicBody`

A velocity driven moving platform: elevators, sliding and rotating floors, conveyor belts. The shape
is baked once in local space; the body is moved by writing its velocities.

| member | description |
|---|---|
| `KinematicBody.fromBox( { width, height, depth } )` | Shorthand for a box shaped platform, centered on the origin. |
| `KinematicBody.fromObject( object3D )` | Create from an `Object3D`, taking every `Mesh` in the object's own local space. |
| `addFromObject( object3D )` / `addFromGeometry( geometry, matrix? )` | Additive variants. |
| `position`, `quaternion` | Current transform. Writing `position` directly teleports the platform without dragging its riders. |
| `velocity` | World space translation, m/s. |
| `angularVelocity` | Rotation around the body origin, rad/s: direction is the axis, length is the speed (yaw is `( 0, ω, 0 )`). |
| `surfaceVelocity` | Surface flow, m/s: the platform stays still and only carries whoever stands on it (a conveyor belt). |
| `rayIntersect( ray, far? )` / `sphereCast( origin, direction, maxDistance, radius )` | Same queries as `StaticBody`, taking the platform's current transform into account. |
| `dispose()` | Drop the baked triangles. |

Motion policy stays on your side: read `position` each frame and flip `velocity` when you want the
platform to turn around. A character standing on the platform is carried, keeps its orbit on a
rotating floor, and inherits the horizontal velocity when it leaves (jumping off, or walking off the
edge).

### `CharacterController( options )`

| option | default | description |
|---|---|---|
| `radius` | required | Capsule radius. |
| `height` | required | Total capsule height, tip to tip (clamped to at least `radius * 2`). |
| `slopeLimit` | `50` | Degrees. Anything steeper cannot be walked up and slides down. |
| `stepOffset` | `0.3` | Steps up to this height are climbed automatically. `0` disables it. |
| `groundCheckDepth` | `0.3` | How far below the feet still counts as grounded, so the character walks down small steps instead of falling. |
| `landingLockDuration` | `0.2` | Seconds of input lock after landing from a jump or a fall. |
| `jumpDuration` | `1` | Total length of the jump arc in seconds. Larger jumps higher and longer. |

| member | description |
|---|---|
| `move( vector3 )` | Desired horizontal velocity in world space, m/s. The `y` component is ignored (gravity, jumping and ground snapping own the vertical axis). It persists until the next call, so pass a zero vector to stop. |
| `jump()` | Start a jump. Ignored while landing, already jumping, airborne or sliding. While climbing it pops off the surface instead. |
| `climb( vector2 )` | Climbing input while attached to a `ClimbableBody`: `x` is sideways, `y` is up. Camera independent, so forward always means up. |
| `teleport( vector3 )` | Move instantly, clearing the landing lock and any climbing state. |
| `position`, `quaternion` | The result of the simulation. Copy them onto your mesh after `world.update()`. |
| `velocity` | The final velocity the engine produced this step. This is an output, not an input -- use `move()` to drive the character. |
| `isGrounded`, `isOnSlope`, `isIdling`, `isRunning`, `isJumping`, `isLanding`, `isClimbing` | State flags. |
| `groundHeight`, `groundNormal`, `groundBody` | The floor under the character. `groundBody` is the owning body, so it is a `KinematicBody` while riding a moving platform. |
| `slopeLimit`, `stepOffset`, `groundCheckDepth`, `landingLockDuration`, `jumpDuration` | The options above, writable at runtime. |
| `carryRotation` | When `true` (default), a rider turns with the yaw of a rotating platform. |
| `dispose()` | Drop internal references. |

Events: `startIdling`, `startWalking`, `startJumping`, `startSliding`, `startFalling`,
`startLanding`, `endLanding`, `startClimbing`, `endClimbing`.

```js
player.addEventListener( 'startWalking', () => animationController.play( 'run' ) );
```

### `ClimbableBody( { mode, box, faceDirection, speed } )`

A zone the character can climb -- a ladder. It is not a collider, it only marks where climbing is
allowed; the ladder you see is your own mesh and does not need to be part of a collider at all.

| option | default | description |
|---|---|---|
| `mode` | required | `'ladder'`. `'free'` (climbing any wall inside the zone) is declared but not implemented yet. |
| `box` | required | `THREE.Box3` in world space. |
| `faceDirection` | `( 0, 0, 1 )` | Horizontal direction the ladder faces, i.e. the side the player approaches from. |
| `speed` | `3` | Climbing speed, m/s. |

The character attaches by pushing into the ladder from below or from the side, by pushing off the
edge while standing on top of it (so walking off the edge continues into climbing down), or by
grabbing it in mid air while jumping or falling. It mantles onto the top at the upper end, steps off
at the lower end, and `jump()` pushes it away from the surface.

### `KeyboardControls`

WASD, the arrow keys and space, listening on `window`. Keystrokes typed into a form field are
ignored, and holding a key while the window loses focus does not stick.

| member | description |
|---|---|
| `inputVector` | `THREE.Vector2`, `x` is right, `y` is forward. Normalized, zero length when nothing is pressed. |
| `jump()` | Dispatch `jumpkeypress` manually (for an on screen button). |
| `dispose()` | Remove the listeners. |

Events: `movekeyon`, `movekeychange`, `movekeyoff`, `jumpkeypress`.

The input is camera independent by design -- rotate it into world space yourself:

```js
const input = keyboardControls.inputVector;
player.move(
	moveDir.set( input.x, 0, - input.y )
		.applyAxisAngle( yAxis, cameraControls.frontAngle )
		.multiplyScalar( 10 ) // speed, m/s
);
```

### `ThirdPersonCameraControls( camera, trackObject, world, domElement, character? )`

A [camera-controls](https://github.com/yomotsu/camera-controls) subclass that follows
`trackObject` and keeps the level geometry registered in `world` out of the way, so the whole
camera-controls API is available on it.

Collision is resolved by sweeping a sphere of `collisionRadius` from the follow point toward the
camera. Keep it at or above the near plane's circumscribed circle, otherwise walls show up inside
the near plane:

```
collisionRadius >= camera.near * Math.tan( fov / 2 ) * Math.sqrt( 1 + aspect ** 2 )
```

| member | description |
|---|---|
| `frontAngle` | The current azimuth angle. Rotate your input by this to get camera relative movement. |
| `syncFrontAngleToPlatform` | When `true` (default) and a `character` was passed, the azimuth follows the yaw of the rotating platform the character rides, keeping the over the shoulder view fixed relative to the platform. |
| `collisionRadius` | How far to keep the camera off the level geometry, default `0.1`. Equivalent to Unreal's `SpringArm.ProbeSize` or Cinemachine's `Deoccluder.CameraRadius`: a sphere of this radius is swept from the follow point toward the camera. |

### `AnimationController( mesh, animationClips )`

A thin `AnimationMixer` wrapper that cross fades between clips.

| member | description |
|---|---|
| `actions` | The `AnimationAction` per clip name, so you can set loop modes and weights. |
| `play( name )` | Cross fade to that clip (0.3s). A no-op if it is already playing. |
| `turn( radians, immediate )` | Turn the mesh towards an angle. |
| `update( deltaTime )` | Advance the mixer. Call it every frame. |
| `dispose()` | Stop everything and uncache the root. |

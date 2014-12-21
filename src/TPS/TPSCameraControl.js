// @author yomotsu
// MIT License

;( function ( THREE, ns ) {

  'use strict';

  var PI2     = Math.PI * 2;
  var PI_HALF = Math.PI / 2;
  var modulo = function ( n, d ) {
    return ( ( n % d ) + d ) % d;
  }
  
  // camera              isntance of THREE.Camera
  // trackObject         isntance of THREE.Object3D
  // params.el           DOM element
  // params.radius       number
  // params.minRadius    number
  // params.maxRadius    number
  // params.rigidObjects array of inctances of THREE.Mesh
  ns.TPSCameraControl = function ( camera, trackObject, params ) {

    THREE.EventDispatcher.prototype.apply( this );
    this.camera = camera;
    this.trackObject  = trackObject;
    this.el           = params && params.el || window;
    this.offset       = params && params.offset || new THREE.Vector3( 0, 0, 0 ),
    this.radius       = params && params.radius    || 10;
    this.minRadius    = params && params.minRadius || 1;
    this.maxRadius    = params && params.maxRadius || 30;
    this.rigidObjects = params && params.rigidObjects || [];
    this.lat   = 0;
    this.lon   = 0;
    this.phi   = 0; // angle of zenith
    this.theta = 0; // angle of azimuth
    this.mouseAccelerationX = params && params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
    this.mouseAccelerationY = params && params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
    this._pointerStart = { x: 0, y: 0 };
    this._pointerLast  = { x: 0, y: 0 };

    this.setNearPlainCornersWithPadding();
    this.update();

    this._mousedownListener = onmousedown.bind( this );
    this._mouseupListener   = onmouseup.bind( this );
    this._mousedragListener = onmousedrag.bind( this )
    this._scrollListener    = onscroll.bind( this );

    this.el.addEventListener( 'mousedown', this._mousedownListener, false );
    this.el.addEventListener( 'mouseup',   this._mouseupListener,   false );
    this.el.addEventListener( 'mousewheel',     this._scrollListener, false );
    this.el.addEventListener( 'DOMMouseScroll', this._scrollListener, false );
    
  };

  ns.TPSCameraControl.prototype = {

    constructor: ns.TPSCameraControl,

    update: function () {

      var position,
          distance;

      this._center = new THREE.Vector3(
        this.trackObject.matrixWorld.elements[ 12 ] + this.offset.x,
        this.trackObject.matrixWorld.elements[ 13 ] + this.offset.y,
        this.trackObject.matrixWorld.elements[ 14 ] + this.offset.z
      );
      position = new THREE.Vector3(
        Math.cos( this.phi ) * Math.cos( this.theta + Math.PI / 2 ), 
        Math.sin( this.phi ), 
        Math.cos( this.phi ) * Math.sin( this.theta + Math.PI / 2 )
      );
      distance = this.collisionTest( position.clone().normalize() );
      position.multiplyScalar( distance );
      position.add( this._center );
      this.camera.position.copy( position );

      if ( this.lat === 90 ) {

        this.camera.up.set(
          Math.cos( this.theta + Math.PI ),
          0,
          Math.sin( this.theta + Math.PI )
        );

      } else if ( this.lat === -90 ) {

        this.camera.up.set(
          Math.cos( this.theta ),
          0,
          Math.sin( this.theta )
        );

      } else {

        this.camera.up.set( 0, 1, 0 );

      }

      this.camera.lookAt( this._center );
      this.dispatchEvent( { type: 'updated' } );

    },

    getFrontAngle: function () {

      return PI2 + this.theta;

    },

    setNearPlainCornersWithPadding: function () {

      var near = this.camera.near,
          halfFov = this.camera.fov * 0.5,
          h = ( Math.tan( THREE.Math.degToRad( halfFov ) ) * near ),
          w = h * this.camera.aspect;

      this.nearPlainCornersWithPadding = [
        new THREE.Vector3( -w - near, -h - near, 0 ),
        new THREE.Vector3(  w + near, -h - near, 0 ),
        new THREE.Vector3(  w + near,  h + near, 0 ),
        new THREE.Vector3( -w - near,  h + near, 0 )
      ];

    },

    setLatLon: function ( lat, lon ) {

      this.lat = lat >  90 ?  90 :
                 lat < -90 ? -90 :
                 lat;
      this.lon = lon < 0 ? 360 + lon % 360 : lon % 360;

      this.phi   =  THREE.Math.degToRad( this.lat );
      this.theta = -THREE.Math.degToRad( this.lon );

    },

    collisionTest: function ( direction ) {

      var i,
          distance = this.radius,
          nearPlainCorner,
          rotationMatrix = new THREE.Matrix4(),
          rotationX = new THREE.Matrix4().makeRotationX( this.phi ),
          rotationY = new THREE.Matrix4().makeRotationY( this.theta ),
          origin,
          raycaster,
          intersects;

      rotationMatrix.multiplyMatrices( rotationX, rotationY );

      for ( i = 0; i < 4; i ++ ) {

        nearPlainCorner = this.nearPlainCornersWithPadding[ i ].clone();
        nearPlainCorner.applyMatrix4( rotationMatrix );

        origin = new THREE.Vector3(
          this._center.x + nearPlainCorner.x,
          this._center.y + nearPlainCorner.y,
          this._center.z + nearPlainCorner.z
        );
        raycaster = new THREE.Raycaster(
          origin,           // origin
          direction,        // direction
          this.camera.near, // near
          this.radius       // far
        );
        intersects = raycaster.intersectObjects( this.rigidObjects );

        if ( intersects.length !== 0 && intersects[ 0 ].distance < distance ) {

          distance = intersects[ 0 ].distance;

        }

      }

      return distance;

    }

  };

  function onmousedown ( event ) {

    this.dispatchEvent( { type: 'mousedown' } );
    this._pointerStart.x = event.clientX;
    this._pointerStart.y = event.clientY;
    this._pointerLast.x = this.lon;
    this._pointerLast.y = this.lat;
    this.el.removeEventListener( 'mousemove', this._mousedragListener, false );
    this.el.addEventListener( 'mousemove', this._mousedragListener, false );

  }

  function onmouseup () {

    this.dispatchEvent( { type: 'mouseup' } );
    this.el.removeEventListener( 'mousemove', this._mousedragListener, false );

  }

  function onmousedrag ( event ) {

    var w = this.el.offsetWidth,
        h = this.el.offsetHeight,
        x = ( this._pointerStart.x - event.clientX ) / w * 2,
        y = ( this._pointerStart.y - event.clientY ) / h * 2;

    this.setLatLon(
      this._pointerLast.y + y * this.mouseAccelerationY,
      this._pointerLast.x + x * this.mouseAccelerationX
    );

  }

  function onscroll ( event ) {

    event.preventDefault();
    
    if ( event.wheelDeltaY ) {

      // WebKit
      this.radius -= event.wheelDeltaY * 0.05 / 5;
    
    } else if ( event.wheelDelta ) {

      // IE
      this.radius -= event.wheelDelta * 0.05 / 5;

    } else if ( event.detail ) {

      // Firefox
      this.radius += event.detail / 5;

    }

    this.radius = Math.max( this.radius, this.minRadius );
    this.radius = Math.min( this.radius, this.maxRadius );
    this.update();

  }

} )( THREE, THREEFIELD );

// @author yomotsu
// MIT License

;( function ( ns ) {

  var vec3 = new THREE.Vector3();

  // camera              isntance of THREE.Camera
  // trackObject         isntance of THREE.Object3D
  // params.el           DOM element
  // params.radius       number
  // params.minRadius    number
  // params.maxRadius    number
  // params.rigidObjects array of inctances of THREE.Mesh
  ns.GyroscopeCameraControl = function ( camera, trackObject, params ) {

    THREE.EventDispatcher.prototype.apply( this );
    this.camera = camera;
    this.trackObject  = trackObject;
    this.el           = params && params.el || window;
    this.offset       = params && params.offset || new THREE.Vector3( 0, 0, 0 ),
    this.radius       = params && params.radius    || 10;
    this.minRadius    = params && params.minRadius || 1;
    this.maxRadius    = params && params.maxRadius || 30;
    this.rigidObjects = params && params.rigidObjects || [];
    this.lat = 0;
    this.lon = 0;
    this._phi;   // angle of zenith
    this._theta; // angle of azimuth
    this.mouseAccelerationX = params && params.mouseAccelerationX !== undefined ? params.mouseAccelerationX : 100;
    this.mouseAccelerationY = params && params.mouseAccelerationY !== undefined ? params.mouseAccelerationY : 30;
    this._pointerStart = { x: 0, y: 0 };
    this._pointerLast  = { x: 0, y: 0 };

    this.camera.position.set(
      this.trackObject.position.x + this.offset.x,
      this.trackObject.position.y + this.offset.y,
      this.trackObject.position.z + this.offset.z + 1
    );
    this.update();

    this._mousedownListener = onmousedown.bind( this );
    this._mouseupListener   = onmouseup.bind( this );
    this._mousedragListener = onmousedrag.bind( this )
    this._scrollListener    = onscroll.bind( this );

    this.el.addEventListener( 'mousedown', this._mousedownListener, false );
    this.el.addEventListener( 'mouseup',   this._mouseupListener,   false );
    this.el.addEventListener( 'mousewheel',     this._scrollListener, false );
    this.el.addEventListener( 'DOMMouseScroll', this._scrollListener, false );
    
  }

  ns.GyroscopeCameraControl.prototype.update = function () {

    this.lat = this.lat >  90 ?  90 :
               this.lat < -90 ? -90 :
               this.lat;
    this.lon = this.lon < 0 ? 360 + this.lon % 360 : this.lon % 360;
    this._phi   =  THREE.Math.degToRad( this.lat );
    this._theta = -THREE.Math.degToRad( this.lon - 90 );

    this._center = new THREE.Vector3(
      this.trackObject.matrixWorld.elements[ 12 ] + this.offset.x,
      this.trackObject.matrixWorld.elements[ 13 ] + this.offset.y,
      this.trackObject.matrixWorld.elements[ 14 ] + this.offset.z
    );
    var distance = collisionTest( this );
    var position = new THREE.Vector3( 
      Math.cos( this._phi ) * Math.cos( this._theta ), 
      Math.sin( this._phi ), 
      Math.cos( this._phi ) * Math.sin( this._theta )
    ).multiplyScalar( distance );
    position = vec3.addVectors( position, this._center );
    this.camera.position.copy( position );

    if ( this.lat === 90 ) {

      this.camera.up.set(
        Math.cos( this._theta + THREE.Math.degToRad( 180 ) ),
        0,
        Math.sin( this._theta + THREE.Math.degToRad( 180 ) )
      );

    } else if ( this.lat === -90 ) {

      this.camera.up.set(
        Math.cos( this._theta ),
        0,
        Math.sin( this._theta )
      );

    } else {

      this.camera.up.set( 0, 1, 0 );

    }
    this.camera.lookAt( this._center );
    this.dispatchEvent( { type: 'updated' } );

  }

  ns.GyroscopeCameraControl.prototype.getFrontAngle = function () {

    return 360 - this.lon;

  }

  function collisionTest ( instance ) {

    if ( instance.rigidObjects.length === 0 ) {

      return instance.radius;

    }

    var direction = new THREE.Vector3(
      instance.camera.position.x - instance._center.x,
      instance.camera.position.y - instance._center.y,
      instance.camera.position.z - instance._center.z
    ).normalize();
    var raycaster = new THREE.Raycaster(
      instance._center,    // origin
      direction,          // direction
      instance.minRadius, // near
      instance.radius     // far
    );
    var intersects = raycaster.intersectObjects( instance.rigidObjects );

    if ( intersects.length >= 1 ){

      return intersects[ 0 ].distance;

    } else {

      return instance.radius
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

    var w = this.el.offsetWidth;
    var h = this.el.offsetHeight;
    var x = ( this._pointerStart.x - event.clientX ) / w * 2;
    var y = ( this._pointerStart.y - event.clientY ) / h * 2;
    this.lon = this._pointerLast.x + x * this.mouseAccelerationX;
    this.lat = this._pointerLast.y + y * this.mouseAccelerationY;
    // this.update();

  }

  function onscroll ( event ) {

    event.preventDefault();
    // WebKit
    if ( event.wheelDeltaY ) {
      this.radius -= event.wheelDeltaY * 0.05 / 5;
    // IE
    } else if ( event.wheelDelta ) {
      this.radius -= event.wheelDelta * 0.05 / 5;
    // Firefox
    } else if ( event.detail ) {
      this.radius += event.detail / 5;
    }
    this.radius = Math.max( this.radius, this.minRadius );
    this.radius = Math.min( this.radius, this.maxRadius );
    this.update();

  }

} )( THREEFIELD );

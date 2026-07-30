import { Object3D, PerspectiveCamera } from 'three';
import CameraControls from 'camera-controls';
import { World } from 'core/World';
export declare class TPSCameraControls extends CameraControls {
    world: World;
    constructor(camera: PerspectiveCamera, trackObject: Object3D, world: World, domElement: HTMLElement);
    get frontAngle(): number;
    _collisionTest(): number;
}

import CameraControls from 'camera-controls';
import { World } from 'core/World';
export declare class TPSCameraControls extends CameraControls {
    world: World;
    constructor(camera: THREE.PerspectiveCamera, trackObject: THREE.Object3D, world: World, domElement: HTMLElement);
    get frontAngle(): number;
    _collisionTest(): number;
}

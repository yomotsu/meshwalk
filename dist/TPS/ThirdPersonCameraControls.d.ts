import { Object3D, PerspectiveCamera } from 'three';
import CameraControls from 'camera-controls';
import { World } from 'core/World';
import { CharacterController } from 'core/CharacterController';
export declare class ThirdPersonCameraControls extends CameraControls {
    world: World;
    character: CharacterController | null;
    syncFrontAngleToPlatform: boolean;
    constructor(camera: PerspectiveCamera, trackObject: Object3D, world: World, domElement: HTMLElement, character?: CharacterController | null);
    get frontAngle(): number;
    _collisionTest(): number;
}

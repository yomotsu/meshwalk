import { EventDispatcher } from '../core/EventDispatcher';
export declare class KeyInputControl extends EventDispatcher {
    private isDisabled;
    private isUp;
    private isDown;
    private isLeft;
    private isRight;
    private isMoveKeyHolding;
    private frontAngle;
    private _keydownListener;
    private _keyupListener;
    private _blurListener;
    constructor();
    jump(): void;
    updateAngle(): void;
    dispose(): void;
}

import { EventDispatcher } from '../core/EventDispatcher';
export type KeyboardControlsEventType = 'movekeyon' | 'movekeyoff' | 'movekeychange' | 'jumpkeypress';
export declare class KeyboardControls extends EventDispatcher<KeyboardControlsEventType> {
    private isDisabled;
    private isUp;
    private isDown;
    private isLeft;
    private isRight;
    private isMoveKeyHolding;
    frontAngle: number;
    private _keydownListener;
    private _keyupListener;
    private _blurListener;
    constructor();
    jump(): void;
    updateAngle(): void;
    dispose(): void;
}

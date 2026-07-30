export type Listener = (event?: DispatcherEvent) => void;
export interface DispatcherEvent {
    type: string;
    [key: string]: any;
}
/**
 * イベント発行・購読の基底クラス。
 * 型引数 `TEventType` にイベント名のユニオンを渡すと、`addEventListener` 等の
 * イベント名が型チェックされる（既定は string で従来どおり任意名を許可）。
 */
export declare class EventDispatcher<TEventType extends string = string> {
    private _listeners;
    /**
     * Adds the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    addEventListener(type: TEventType, listener: Listener): void;
    /**
     * Presence of the specified event listener.
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    hasEventListener(type: TEventType, listener: Listener): boolean;
    /**
     * Removes the specified event listener
     * @param type event name
     * @param listener handler function
     * @category Methods
     */
    removeEventListener(type: TEventType, listener: Listener): void;
    /**
     * Fire an event type.
     * @param event DispatcherEvent
     * @category Methods
     */
    dispatchEvent(event: DispatcherEvent & {
        type: TEventType;
    }): void;
}

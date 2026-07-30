export type Listener = ( event?: DispatcherEvent ) => void;

export interface DispatcherEvent {
	type: string;
	[ key: string ]: any;
}

/**
 * イベント発行・購読の基底クラス。
 * 型引数 `TEventType` にイベント名のユニオンを渡すと、`addEventListener` 等の
 * イベント名が型チェックされる（既定は string で従来どおり任意名を許可）。
 */
export class EventDispatcher<TEventType extends string = string> {

	private _listeners: { [ type: string ]: Listener[] } = {};

	/**
	 * Adds the specified event listener.
	 * @param type event name
	 * @param listener handler function
	 * @category Methods
	 */
	addEventListener( type: TEventType, listener: Listener ): void {

		const listeners = this._listeners;

		if ( listeners[ type ] === undefined ) listeners[ type ] = [];

		if ( listeners[ type ].indexOf( listener ) === - 1 ) listeners[ type ].push( listener );

	}

	/**
	 * Presence of the specified event listener.
	 * @param type event name
	 * @param listener handler function
	 * @category Methods
	 */
	hasEventListener( type: TEventType, listener: Listener ): boolean {

		const listeners = this._listeners;

		return listeners[ type ] !== undefined && listeners[ type ].indexOf( listener ) !== - 1;

	}

	/**
	 * Removes the specified event listener
	 * @param type event name
	 * @param listener handler function
	 * @category Methods
	 */
	removeEventListener( type: TEventType, listener: Listener ): void {

		const listeners = this._listeners;
		const listenerArray = listeners[ type ];

		if ( listenerArray !== undefined ) {

			const index = listenerArray.indexOf( listener );

			if ( index !== - 1 ) listenerArray.splice( index, 1 );

		}

	}

	/**
	 * Fire an event type.
	 * @param event DispatcherEvent
	 * @category Methods
	 */
	dispatchEvent( event: DispatcherEvent & { type: TEventType } ): void {

		const listeners = this._listeners;
		const listenerArray = listeners[ event.type ];

		if ( listenerArray !== undefined ) {

			event.target = this;
			const array = listenerArray.slice( 0 );

			for ( let i = 0, l = array.length; i < l; i ++ ) {

				array[ i ].call( this, event );

			}

		}

	}

}

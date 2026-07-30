import { EventDispatcher } from './EventDispatcher';
/**
 * World に add できる物理ボディの基底クラス。
 * `StaticBody`（環境）や `CharacterController`（キャラクター）はこれを継承する。
 * イベント発行のため EventDispatcher を継承している。
 */
export declare abstract class Body<TEventType extends string = string> extends EventDispatcher<TEventType> {
    readonly isBody = true;
    /**
     * 内部リソース（octree / イベントリスナ等）を解放する。
     * 継承側で必要に応じてオーバーライドする。
     */
    dispose(): void;
}

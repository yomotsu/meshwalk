import { EventDispatcher } from './EventDispatcher';

/**
 * World に add できる物理ボディの基底クラス。
 * `StaticBody`（環境）や `CharacterBody`（キャラクター）はこれを継承する。
 * イベント発行のため EventDispatcher を継承している。
 */
export abstract class Body extends EventDispatcher {

	readonly isBody = true;

	/**
	 * 内部リソース（octree / イベントリスナ等）を解放する。
	 * 継承側で必要に応じてオーバーライドする。
	 */
	dispose(): void {}

}

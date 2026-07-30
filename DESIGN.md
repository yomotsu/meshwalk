# meshwalk 設計改善メモ (DESIGN)

独学ベースで作られた現行 API を、一般的なゲームエンジン（Unity / Godot /
Rapier / cannon-es）および three.js の命名慣習に寄せるための設計方針。

- **後方互換は取らない**（0.x のうちに刷新する）。
- 各ワークストリームごとに vitest でリグレッションを担保しながら進める。
- 本書は「方針の記録」。実装時の最終形はここを基準にする。

---

## 1. 現状の主な違和感

- `World.add()` が `Octree | CharacterController` を型で内部分岐している。
- 空間構造そのもの（`Octree`）をユーザーが生成・登録する（漏れた抽象）。
- 移動が「角度 + フラグ + 固定速度」（`direction` / `isRunning` / `movementSpeed`）。
- 重力・ジャンプ・斜面がマジックナンバー（`FALL_VELOCITY=-20`、`-9.8`、slope の `0.2`、
  ジャンプの `cos()` 時間カーブ）。
- `world.fixedUpdate()` が 60fps 固定前提で実 delta を無視。
- `performance.now()` / `Date.now()` 依存で非決定的（テストしづらい）。
- 空メソッド（`setDirection()`）、型が誤ったスタブ（`getCapsuleTriangles(capsule: Sphere)`）、
  公開されすぎた内部状態。
- 物理側がレンダーを書き戻す（`object.rotation.y` / `object.position`）＝責務の混在。

---

## 2. 目標アーキテクチャ

### 2.1 レイヤ構造

```
World ── holds ──> Body[]                 ← 物理世界の住人。add するのはこれ
                     │ owns
                     ├─ transform (position / quaternion)
                     ├─ type: static | kinematic
                     └─ Shape                ← 衝突形状（Trimesh / Capsule）
```

- **World が持つのは Body**。three.js の Mesh/geometry は「Shape のソース」であって、
  物理世界には入れない（レンダーと物理の分離）。
- `Octree` は `StaticBody` の**内部実装**に降格し、公開 API から消す。

### 2.2 クラス改名

| 現在 | 新 | 備考 |
|---|---|---|
| `Octree`（公開コライダー） | `StaticBody` | trimesh 環境。octree は内部実装 |
| `CharacterController` | `CharacterBody` | kinematic・capsule を内包。Unity/Rapier 準拠 |
| （新規・基底） | `Body` | `StaticBody` / `CharacterBody` の基底。`world.add(body)` を一本化 |
| `KeyInputControl` | `KeyboardControls` | three は `*Controls`。出力を角度→ `inputVector` |
| `TPSCameraControls` | `ThirdPersonCameraControls` | 略語回避 |
| `AnimationController` | 据置 | Unity にも同名。妥当 |
| `World` | 据置 | Rapier/cannon と同じ |

### 2.3 コライダー取り込み（W1 の要）

three.js の慣習に合わせ、**入力の階層で名前を分ける**（`FromObject` は graph を辿る、
`FromGeometry` はジオメトリ階層）。

```js
// graph を traverse して全 Mesh の三角形を焼き込む（主）
const level = MW.StaticBody.fromObject( scene );
level.addFromObject( someGroup );          // 加算
level.addFromGeometry( bufferGeometry );   // 事前マージ済みを直接（上級者向け・任意）
world.add( level );
```

- 名前が実挙動（traverse）と一致する（`addMesh` / `addGraphNode` の誤解・内部語漏れを解消）。
- 単一 Mesh も `addFromObject(mesh)` で通る（Mesh も Object3D）。
- **バグ修正**: 現 `addGraphNode` は `updateWorldMatrix()` 後に `mesh.matrix`（ローカル行列）を
  使っており、ネストした子 Mesh のワールド変換が正しく焼き込まれない。
  新実装では **`mesh.matrixWorld`** を使う。
- 取り込みは呼び出し時点のワールド座標を**スナップショット**する（静的前提）。

### 2.4 World

```js
const world = new MW.World({ gravity: new THREE.Vector3( 0, -9.8, 0 ) });
world.add( body );        // Body 一本化（型分岐なし）
world.remove( body );
world.update( deltaTime ); // 実 delta。内部でアキュムレータ固定ステップ
world.dispose();
```

- `add(Octree|CharacterController)` の型分岐を廃止 → `add(body: Body)`。
- `colliderPool` / `characterPool`（public 配列）→ `_colliders` / `_characters`（private）。
- `fixedUpdate()`（60fps 固定）→ `update(dt)` + 内部アキュムレータで固定ステップ。
- 公開 `step` と内部 `step` の名前衝突を解消（内部は `_substep()`）。

---

## 3. 物理モデル（W2）

角度＋フラグ＋時間カーブをやめ、**速度／インパルス方式**に統一。マジックナンバーを排除。

| 項目 | 現在 | 新 |
|---|---|---|
| 移動 | `direction`(角度)+`isRunning`+`movementSpeed` | `body.move(vec3)` / `body.velocity` |
| 重力 | CharacterController 内に定数直書き | **解決可能な「場」**として持つ（下記）。適用は **CharacterBody 自身**が毎サブステップ実効重力を評価して velocity に積む（kinematic キャラの作法） |
| ジャンプ | `performance.now()` の時間カーブ + `currentJumpPower` | 初速インパルス（`jumpSpeed`、または `jumpHeight`→内部で `v.y=√(2gh)`）。以降は重力任せ |
| 斜面 | `maxSlopeGradient`（cos値を直接set） | `slopeLimit`（**度**）。内部で cos 化（Unity 準拠） |

**重力は「固定ベクトル」ではなく「解決可能な場」にする**（`world.gravity` を単一 Vector3 に
固定すると、惑星の放射状重力・重力ゾーン・壁歩きなど**位置依存の重力**が表現できないため）。

```ts
// 一様（既定・簡単）
world.gravity = new THREE.Vector3( 0, -9.8, 0 );
// 位置の関数（惑星の放射状 / ゾーン）
world.gravity = ( body ) => body.position.clone().sub( center ).normalize().multiplyScalar( -9.8 );
// キャラ個別の上書き / 倍率
characterBody.gravity = ( self ) => customField( self.position );
characterBody.gravityScale = 0; // 飛行中は無重力 等
```

- `CharacterBody` は毎サブステップ `g = resolve( body.gravity ?? world.gravity, this ) * gravityScale`
  を評価して velocity に積む（Godot `CharacterBody3D.get_gravity()` と同じ発想）。
- エンジンの実態: Godot(`Area3D` の Gravity Point / `get_gravity()`)・Unity(`useGravity`+自前力)・
  UE5(per-character 重力方向)・Rapier(`gravityScale`+自前力)。いずれも「重力は最終的に
  per-body・per-position で解決」される。一様ベクトルはその特殊ケース。
- **エスケープハッチ**: `velocity` を read/write 公開（Unity `CharacterController.Move` 流）。
  ライブラリの自動重力を使わず完全自作の場を積みたい上級者向け。

**重力方向の可変（壁歩き・惑星）は別スコープ**。強さ/オンオフ/ゾーンは上記で表現できるが、
重力の**向き**を変えるには、コントローラ本体が Y-up 前提（鉛直カプセル / 真下へ接地レイ /
`normal.y` 斜面 / xz 移動）を捨て、**任意の up ベクトル**で動く必要がある。

| レベル | 内容 | 規模 |
|---|---|---|
| **L1（今回）** | 重力を「場」として解決。強さ・ゾーン・オンオフ・個体差は表現可。接地/斜面/カプセルは Y-up のまま | 小〜中 |
| **L2（将来）** | コントローラを up ベクトル非依存に再設計（カプセル整列・-up へ接地レイ・up 基準の斜面/移動投影）。真の壁歩き・球状惑星 | 大 |

- L2 への布石として、内部で **`up = normalize(-effectiveGravity)`** を1箇所に持たせ、
  まず定数 `(0,1,0)` で運用。L2 化時はここを差し替えるだけにする。

**ジャンプをインパルスにする際の注意**:
1. **上昇中（`velocity.y > 0`）は接地スナップしない**（飛んだ瞬間の再接地でジャンプが消えるのを防ぐ）。
2. **W3（固定ステップ）とセット**にして到達高さを決定論化（`jumpSpeed = √(2·g·h)`）。
3. 天井接触時は `velocity.y` を 0 以下にクランプ（既存 isHittingCeiling 相当）。
   - 利点: 「押し続けて高く跳ぶ」等の可変ジャンプ（離した瞬間 `velocity.y *= k`）が自然に足せる。

```js
const player = new MW.CharacterBody({
	radius: 0.5,
	height: 2,
	moveSpeed: 10,
	slopeLimit: 50,   // degrees
	jumpSpeed: 8,
});
world.add( player );

// 毎フレーム
player.move( inputVector.setLength( player.moveSpeed ) ); // 望む速度/変位
if ( wantJump ) player.jump();
```

- 可変フレームレート・可変速度・アナログ入力・任意方向に自然対応。

---

## 4. ループ / 時間（W3・独立して並列可）

- `world.update(dt)`：実 delta を受け取り、内部アキュムレータで固定タイムステップを回す
  （標準のゲームループ）。
- `jump()` の `performance.now()`、`AnimationController.turn()` の `Date.now()` を廃止し、
  **シミュレーション時間 / delta 駆動**にする。
  - 副次効果：**決定論的**になり、既存の vitest が壁時計に左右されず安定する。

---

## 5. 型 / イベント / 掃除（W4・独立して並列可）

- **options オブジェクトのコンストラクタ**（§3 参照）。位置引数の羅列をやめる。
- **型付きイベント**（three r150+ の generic `EventDispatcher` 方式）＋ペイロード：
  - `landed`（着地時の落下速度）、`jumped`、状態は `state` プロパティ + 単一 `statechange`。
  - 現状の `startIdling/Walking/Jumping/Sliding/Falling` は増殖しがち・型無しなので置換。
- 公開面を絞る（**getter の乱用はしない**）：
  - boolean/scalar（`isGrounded` 等）… `readonly` フィールド or 値を返すだけの getter（JIT
    インライン化で実質ゼロコスト。どちらでも可）。
  - **Vector3 系（`velocity` / `groundNormal` / `position`）… `readonly` の「生参照」を公開**。
    getter で毎回 `clone()` するのは GC 負荷になるので禁止（three.js の `object.position` と同流儀）。
  - getter は「派生値（計算が要る）」か「バッキングフィールドを隠したい時」だけに使う。
  - 内部状態（`contactInfo` / `nearTriangles` / `groundHeight` …）は `_` / `#` で private。
- レンダー分離（§6）。
- 掃除：
  - 空の `setDirection()` を削除。
  - 型が誤ったスタブ `getCapsuleTriangles(capsule: Sphere)` を削除 or 正しく実装。
  - `getSphereTriangles` 等の Octree クエリは `StaticBody` の内部へ隠す。
  - 入力：`keyCode`（廃止 API）→ `event.code`、出力を角度でなく `inputVector: Vector2`。

---

## 6. レンダーと物理の分離（W2 と対）

- 現状 CharacterController が `object.rotation.y = direction + π` と `object.position` を
  勝手に書き戻している＝レンダー責務の混入。
- 新設計：Body は `position` / `quaternion` を公開するだけ。**向きの回転・メッシュ同期は利用側**。

```js
// 利用側で同期
mesh.position.copy( player.position );
mesh.quaternion.copy( player.quaternion ); // 向きを使いたい場合のみ
```

- 当たり判定（capsule）と見た目（任意のモデル）を別にできる。
- Body は three の `Object3D` を必須にしない。

---

## 7. ライフサイクル

- `dispose()` を全クラスに統一（`World` / `StaticBody` / `CharacterBody` / `*Controls`）。
  octree のメモリ・イベントリスナを解放。現状は `KeyInputControl` のみ。

---

## 8. ワークストリーム

| WS | 含む | 依存 |
|---|---|---|
| **W1: コライダー / Body 化** | `Body`/`StaticBody`/`CharacterBody`・`fromObject`/`addFromObject`/`addFromGeometry`・`matrixWorld` 修正・`World.add` 一本化 | 基盤 |
| **W2: 物理モデル** | `move(vec)`・`world.gravity`・ジャンプのインパルス化・`slopeLimit`(度)・レンダー分離(§6) | W1 後 or 並行 |
| **W3: ループ / 時間** | `update(dt)`+アキュムレータ・脱 `performance.now`/`Date.now` | 独立（並列可） |
| **W4: 型 / イベント / 掃除** | options ctor・typed events・private 化・`dispose`・スタブ除去・入力刷新 | 独立（並列可） |

各 WS 完了ごとに、対応する挙動の vitest を追加する（衝突は `test/collision.test.ts` を拡張）。

---

## 9. Before / After 早見

```js
// ── Before ──────────────────────────────────────────────
const world  = new MW.World();
const octree = new MW.Octree();
octree.addGraphNode( ground );
world.add( octree );

const holder = new THREE.Object3D();
const player = new MW.CharacterController( holder, 0.5, 2 );
player.teleport( 0, 10, 0 );
world.add( player );

keyInput.addEventListener( 'movekeychange', () => player.direction = keyInput.frontAngle );
keyInput.addEventListener( 'movekeyon',  () => player.isRunning = true );
( function loop() {
	requestAnimationFrame( loop );
	world.fixedUpdate();      // 60fps 固定
	renderer.render( scene, camera );
} )();

// ── After ───────────────────────────────────────────────
const world = new MW.World({ gravity: new THREE.Vector3( 0, -9.8, 0 ) });
world.add( MW.StaticBody.fromObject( ground ) );

const player = new MW.CharacterBody({ radius: 0.5, height: 2, moveSpeed: 10, slopeLimit: 50, jumpSpeed: 8 });
player.teleport( new THREE.Vector3( 0, 10, 0 ) );
world.add( player );

const input = new MW.KeyboardControls();       // → input.inputVector (Vector2)
player.addEventListener( 'jumped', () => {} );

let last = performance.now();
( function loop( now ) {
	requestAnimationFrame( loop );
	const dt = ( now - last ) / 1000; last = now;
	player.move( toWorld( input.inputVector ).setLength( player.moveSpeed ) );
	world.update( dt );                         // 実 delta・内部で固定ステップ
	mesh.position.copy( player.position );
	renderer.render( scene, camera );
} )( last );
```

---

## 10. 決定事項 / 未決事項

**決定**
- 後方互換なし。
- `Octree` を内部化し、公開は `StaticBody`（`fromObject` / `addFromObject` / `addFromGeometry`）。
- `matrixWorld` バグ修正。
- Body 化（`CharacterBody`）＋ `World.add(body)` 一本化。
- 重力は「解決可能な場」（`Vector3 | (body)=>Vector3`、`CharacterBody` で上書き/`gravityScale`、適用は CharacterBody 自身、`velocity` エスケープハッチあり）。強さ/ゾーン/個体差は L1 で対応。
- 重力**方向**の可変（壁歩き/惑星）は L2 として別スコープ。内部に `up = normalize(-gravity)` を布石として持つ（当面は定数 (0,1,0)）。
- ジャンプは初速インパルス方式（上昇中は接地スナップ抑止・固定ステップで高さ決定論化・天井クランプ）。
- 状態公開は getter 乱用せず、Vector3 は clone しない `readonly` 生参照。

**未決（実装時に確定）**
- ジャンプ入力を `jumpSpeed`（初速）にするか `jumpHeight`（到達高さ）にするか（両対応も可）。
- イベントを「state + statechange」に寄せるか、瞬間イベント（`landed`/`jumped`/`fell`）中心にするか。
- `slopeLimit` 以外の Unity 的パラメータ（`stepOffset` 段差乗り越え等）を入れるか。
- `KeyboardControls` の出力を `inputVector` のみにするか、`frontAngle` 互換 getter を残すか。

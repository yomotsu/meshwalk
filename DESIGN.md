# meshwalk 設計改善メモ (DESIGN)

独学ベースで作られた現行 API を、一般的なゲームエンジン（Unity / Godot /
Rapier / cannon-es）および three.js の命名慣習に寄せるための設計方針。

- **後方互換は取らない**（0.x のうちに刷新する）。
- 各ステップごとに vitest のゴールデンテストで挙動を固定しながら進める。
- 本書は当初「計画」だったが、実装が進んだ現在は **as-built（実装済みの現状）＋残アイデア** の記録。

---

## 0. 実装状況（2026-08-07 時点・master に反映済み）

| 区分 | 項目 |
|---|---|
| **実装済み** | `Body`/`StaticBody`/`CharacterController` 化・`World.add(body)` 一本化。`StaticBody.fromObject`/`addFromObject`/`addFromGeometry`・`matrixWorld` バグ修正。`Octree` 内部化。`move(vec)` 入力。`slopeLimit`（度）。レンダー分離（`position`/`quaternion` 公開・利用側で同期）。`world.update(dt)` 固定ステップ・アキュムレータ。ジャンプの脱 `performance.now`（deltaTime 化・決定論）。`dispose()` 全クラス。型付き `EventDispatcher`。入力 `keyCode`→`event.code`。改名 `KeyInputControl`→`KeyboardControls` / `TPSCameraControls`→`ThirdPersonCameraControls` / `AnimationController.motion`→`actions`。options コンストラクタ。`teleport(Vector3)`。`KeyboardControls.inputVector`（Vector2）。**`stepOffset`（段差自動登り・既定 0.3）＋ `groundCheckDepth` 既定 0.3（登り降り対称）**。**動く床 `KinematicBody`**（`deltaMatrix` 運搬・回転運搬・離脱慣性・`surfaceVelocity`／ベルトコンベア。デモ 9）。**梯子 `ClimbableBody`**（登り状態。§10。デモ `10_ladder.html`）。 |
| **実装済み（性能）** | **パフォーマンス最適化 9 コミット**（§11）。`Octree` の重複排除を `_queryId` マーク化、静的 broad-phase をフレーム単位＋有効範囲キャッシュ、動く床の bounding sphere を剛体変換、縦レイの xz prefilter、接触・バッファのプール化、カメラのレイに `far`。`fixedUpdate` 約 0.30 → 約 0.046 ms/frame。 |
| **ドロップ** | **物理モデル刷新（重力の「場」＋インパルスジャンプ＋`gravityScale`）**。§3 参照。現行のジャンプ／落下仕様を維持する判断。 |
| **保留（未着手）** | 壁面フリークライム（`ClimbableBody` の `mode:'free'`＝Phase B。§10）。`AnimationController.turn()` の `Date.now`/rAF → deltaTime 化。瞬間イベント `landed`/`jumped`（現状は `startIdling/Walking/Jumping/Sliding/Falling` を維持）。壁歩き／惑星重力（L2）。README の API 節更新。 |

---

## 1. 当初の主な違和感（動機・多くは解消済み）

- ~~`World.add()` が `Octree | CharacterController` を型で内部分岐~~ → 解消（`add(body: Body)`）。
- ~~空間構造（`Octree`）をユーザーが生成・登録~~ → 解消（`StaticBody` に内部化）。
- ~~移動が「角度 + フラグ + 固定速度」（`direction` / `isRunning` / `movementSpeed`）~~ → 解消（`move(vec)`）。
- 重力・ジャンプ・斜面のマジックナンバー（`FALL_VELOCITY=-20`、slope の `0.2`、ジャンプの `cos()`
  時間カーブ）→ **一部のみ解消**。`slopeLimit` は度に。ジャンプ時間源は deltaTime 化。ただし
  「一定速度＋コサイン弧」モデル自体は**維持**（§3）。
- ~~`world.fixedUpdate()` が 60fps 固定前提~~ → 解消（`world.update(dt)`＋アキュムレータ。`fixedUpdate()` は決定論用に残置）。
- `performance.now()` → ジャンプは解消。`AnimationController.turn()` の `Date.now()` は**未対応**。
- ~~空メソッド `setDirection()`~~ → 削除。内部状態は `_` private 化。
- ~~物理側がレンダーを書き戻す~~ → 解消（§6）。

---

## 2. アーキテクチャ（実装済み）

### 2.1 レイヤ構造

```
World ── holds ──> Body[]                 ← 物理世界の住人。add するのはこれ
                     │ owns
                     ├─ transform (position / quaternion)
                     └─ 衝突形状（StaticBody=trimesh / CharacterController=capsule）
```

- **World が持つのは Body**。three.js の Mesh/geometry は「形状のソース」であって物理世界には入れない。
- `Octree` は `StaticBody` の**内部実装**。公開 API から見えない。

### 2.2 クラス名（確定）

| 旧 | 現 | 備考 |
|---|---|---|
| `Octree`（公開コライダー） | `StaticBody` | trimesh 環境。octree は内部実装 |
| `CharacterController` | **`CharacterController`（据置）** | kinematic・capsule 内包。Unity 準拠。当初 `CharacterBody` 案は撤回 |
| （新規・基底） | `Body` | `StaticBody` / `CharacterController` の基底。`world.add(body)` を一本化 |
| `KeyInputControl` | `KeyboardControls` | three は `*Controls`。出力は角度→ `inputVector` |
| `TPSCameraControls` | `ThirdPersonCameraControls` | 略語回避 |
| `AnimationController` | 据置（`motion`→`actions`） | Unity にも同名 |
| `World` | 据置 | Rapier/cannon と同じ |

### 2.3 コライダー取り込み（実装済み）

```js
const level = MW.StaticBody.fromObject( scene ); // graph を traverse して全 Mesh の三角形を焼き込む
level.addFromObject( someGroup );                // 加算
level.addFromGeometry( bufferGeometry, matrix ); // 事前マージ済みを直接（任意）
world.add( level );
```

- 名前が実挙動（traverse）と一致。単一 Mesh も `addFromObject(mesh)` で通る。
- **バグ修正済み**: 旧 `addGraphNode` はローカル `matrix` を使い、ネストした子 Mesh の
  ワールド変換が誤っていた。新実装は **`matrixWorld`** を使う。取り込みは呼び出し時点の
  ワールド座標をスナップショット（静的前提）。

### 2.4 World（実装済み）

```js
const world = new MW.World({ fps: 60, stepsPerFrame: 4 });
world.add( body );        // Body 一本化（型分岐なし）
world.remove( body );
world.update( deltaTime ); // 実 delta。内部アキュムレータで固定ステップ（1/fps）を回す
world.fixedUpdate();       // ちょうど 1 固定フレーム（決定論・テスト用）
world.dispose();
```

- 内部配列は `_staticBodies` / `_characterControllers`（private）。`get colliders()` は読み取り専用。
- 巨大 delta は `MAX_CATCH_UP_FRAMES` で上限クランプ（spiral of death 防止）。
- **注**: `world.gravity` は無い（下記のとおり重力モデルはドロップ）。

---

## 3. 物理モデル（重力刷新はドロップ・現行を維持）

当初は「角度＋フラグ＋時間カーブ」をやめ **重力の場＋インパルスジャンプ** に統一する計画だった
が、試作・検討の結果 **ドロップ**した。理由:

- 現行の手触り（キビキビしたジャンプ・素早い落下）を維持したい、という判断。
- 現行のジャンプ／落下は実は「**コサイン弧のジャンプ**＋**一定落下速度 `FALL_VELOCITY=-20`**」という
  2つのアーケード仕掛けで、**9.8 の重力とは別物**。単一の重力加速度では
  「メートル現実の 9.8」「現状の大ジャンプ高さ」「現状の速い落下」を**同時に満たせない**（物理的制約）。
- 質量は無関係（速度・加速度を直接扱う運動学モデル）。強さを変えたければ `jumpSpeed`/重力を個体調整すればよく、`mass` は導入しない。

### 現行モデル（as-built）

| 項目 | 実装 |
|---|---|
| 移動入力 | `character.move(vec3)`：望む**水平**速度をセット（y は無視）。次に呼ぶまで持続。停止はゼロベクトル。 |
| 速度 | `character.velocity`：エンジンが毎ステップ算出する**最終速度（読み取り用）**。y=ジャンプ/落下、x/z=衝突解決後。※入力とは別概念（下記）。 |
| 落下 | 一定 `FALL_VELOCITY = -20`（**速度**であって加速度ではない）。重力積分はしない。 |
| ジャンプ | 時間ベースのコサイン弧（`jump()` → `_updateJumping(deltaTime)`）。全長は **`jumpDuration`（公開・既定 1 秒＝定数 `JUMP_DURATION_SEC`）** で可変（大きいほど高く長い）。既定時は到達高さ ≈ 6.37・滞空 ≈ 1s。deltaTime 駆動で決定論的（脱 `performance.now`）。 |
| 斜面 | `slopeLimit`（**度**、既定 50）。内部で cos 化（Unity 準拠）。急勾配は `FALL_VELOCITY` で滑走。 |
| 段差 | `stepOffset`（既定 0.3）以下の段は自動で登る。`_checkGround` の `_stepLookAhead` が前縁を先読みし `groundHeight` を段上面へ上げる。壁接触ゲート＋ラッチ＋天井チェック（詳細はコード）。降りは `groundCheckDepth`（既定 0.3）が対称に担う。 |

**入力と `velocity` を分ける理由**: `velocity` は y をエンジンが管理する「最終速度（出力）」。
そこに水平入力を同居させると所有権が衝突する（誰が y を書く？壁ずり後の x/z は？）。Godot の
単一 `velocity`（ユーザーが y も毎フレーム書く）方式は、内部でジャンプ/重力を持つ本実装と
矛盾するため採らない。→ 入力は `move()`、`velocity` は読み取り、で分離（現行どおり）。

```js
const player = new MW.CharacterController({
	radius: 0.5,
	height: 2,
	slopeLimit: 50,      // degrees（任意・既定 50）
	groundCheckDepth: 0.2, // 任意・既定 0.2
});
world.add( player );

// 毎フレーム
player.move( worldMoveVector );  // 望む水平速度
if ( wantJump ) player.jump();
```

> 参考（ドロップした案）: 重力を `Vector3 | (body)=>Vector3` の「解決可能な場」にし、`gravityScale`・
> インパルスジャンプ（`jumpSpeed=√(2gh)`）・壁歩き（L2）へ拡張する構想。将来やるなら、
> 最初から終端速度クランプを入れ、上昇中は接地スナップ抑止、ジャンプ高さ/滞空をゴールデンに
> 合わせて調整（合わなければ不採用）。非対称重力（上昇は強め・落下は 9.8）なら「現実の落下＋
> 現状に近いジャンプ」を両立できる。

---

## 4. ループ / 時間（実装済み・一部保留）

- `world.update(dt)`：実 delta を受け取り、内部アキュムレータで固定タイムステップ（1/fps）を回す。**実装済み**。
- `jump()` の `performance.now()` → **deltaTime 積算に置換済み**（決定論化。既存 vitest が壁時計に左右されない）。
- `AnimationController.turn()` の `Date.now()`＋`requestAnimationFrame` → **未対応（保留）**。視覚のみ・rAF 自走のため、レンダー/アニメ整理時に deltaTime 駆動へ。

---

## 5. 型 / イベント / 掃除（実装済み・一部保留）

- **options コンストラクタ**：`new CharacterController({ radius, height, slopeLimit?, groundCheckDepth? })`。**実装済み**。
- **型付きイベント**：`EventDispatcher<TEventType>`（既定 string で後方互換）＋ `Body<TEventType>`。
  `CharacterControllerEventType` / `KeyboardControlsEventType` を定義。**実装済み**。
  - ただし現状イベントは `startIdling/Walking/Jumping/Sliding/Falling` を**維持**。瞬間イベント
    `landed`/`jumped` 等への置換は**保留**。
- 公開面：Vector3 系（`velocity`/`groundNormal`/`position`/`quaternion`）は clone しない生参照を公開。
  内部状態（`_contactInfo`/`_nearTriangles`/`_currentJumpPower` 等）は private 化。**実装済み**。
- 掃除：空 `setDirection()` 削除、`getSphereTriangles` 等の Octree クエリは `StaticBody` 内部へ。**実装済み**。
- 入力：`keyCode`→`event.code`、出力 `frontAngle`（角度）→ **`inputVector: Vector2`**。**実装済み**。
  - `inputVector`：x=右(+)/左(-)、y=前(+)/後(-)、大きさ 0〜1（斜めは正規化）、無入力は長さ0。
    利用側でカメラ向きに回して（`applyAxisAngle`）`move()` へ渡す。

---

## 6. レンダーと物理の分離（実装済み）

- `CharacterController` は `position` / `quaternion` を公開するだけ。**メッシュ同期は利用側**。
- コンストラクタは Object3D を要求しない（`(radius, height)` 相当の options）。

```js
// 毎フレーム、world.update(dt) の後に
mesh.position.copy( player.position );
mesh.quaternion.copy( player.quaternion );
```

- 当たり判定（capsule）と見た目（任意のモデル）を分離できる。

---

## 7. ライフサイクル（実装済み）

- `dispose()` を全クラスに統一（`World` / `StaticBody` / `CharacterController` /
  `KeyboardControls` / `ThirdPersonCameraControls`〈基底 CameraControls〉 / `AnimationController`）。
  octree メモリ・イベントリスナ・mixer を解放。

---

## 8. Before / After 早見（as-built）

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

// ── After（現行） ───────────────────────────────────────
const world = new MW.World();
world.add( MW.StaticBody.fromObject( ground ) );

const player = new MW.CharacterController({ radius: 0.5, height: 2, slopeLimit: 50 });
player.teleport( new THREE.Vector3( 0, 10, 0 ) );
world.add( player );

const input = new MW.KeyboardControls();   // → input.inputVector (Vector2)
input.addEventListener( 'jumpkeypress', () => player.jump() );

const clock = new THREE.Clock();
const _moveDir = new THREE.Vector3();
const _yAxis = new THREE.Vector3( 0, 1, 0 );
( function loop() {
	requestAnimationFrame( loop );
	const delta = clock.getDelta();
	// inputVector(カメラ相対) → ワールド方向へ回して速度に
	player.move( _moveDir.set( input.inputVector.x, 0, - input.inputVector.y )
		.applyAxisAngle( _yAxis, camera.frontAngle ).multiplyScalar( 10 ) );
	world.update( delta );                  // 実 delta・内部で固定ステップ
	mesh.position.copy( player.position );
	mesh.quaternion.copy( player.quaternion );
	renderer.render( scene, camera );
} )();
```

---

## 9. 決定事項 / 保留

**決定**
- 後方互換なし。
- `Octree` を内部化し、公開は `StaticBody`（`fromObject` / `addFromObject` / `addFromGeometry`、`matrixWorld` 修正）。
- Body 化（`CharacterController` は名称据置）＋ `World.add(body)` 一本化。
- 入力は `move(vec)`、`velocity` は「最終速度の読み取り」。**両者は分離**（`velocity` を入力にはしない）。
- 入力コントロールの出力は `inputVector: Vector2`（`frontAngle` 互換は残さない）。
- options コンストラクタ・`teleport(Vector3)`。
- `world.update(dt)`＋アキュムレータ（`fixedUpdate()` は決定論用に残置）。
- レンダー分離（`position`/`quaternion` 公開、同期は利用側）。dispose 全クラス統一。
- **物理モデル刷新（重力の場・インパルスジャンプ・gravityScale）はドロップ。現行のジャンプ／落下仕様を維持。**

**保留（将来やるなら）**
- 壁面フリークライム（`ClimbableBody` の `mode:'free'`＝Phase B。§10）。
- `AnimationController.turn()` の脱 `Date.now`/rAF（deltaTime 駆動）。
- 瞬間イベント `landed`/`jumped`（現状は `start*` イベントを維持）。梯子は `startClimbing`/`endClimbing` を既に持つ。
- 段差乗り越え `stepOffset` 等の Unity 的パラメータ。
- 重力方向可変（壁歩き・球状惑星）＝ L2（コントローラを up ベクトル非依存に再設計）。

---

## 10. 梯子・登り（`ClimbableBody`・as-built）

梯子・壁面を「**登り状態（climb mode）**」として追加。重力を一時停止して入力を「面に沿った移動」へ写す
状態機械で、**up ベクトルは Y のまま**（L2＝壁歩き/惑星重力の再設計は不要）。現状は `mode:'ladder'` を実装、
`mode:'free'`（壁面フリークライム）は型だけ用意＝Phase B で未実装。

### 10.1 `ClimbableBody`（判定ゾーン）

```js
const ladder = new MW.ClimbableBody({
	mode: 'ladder',                                  // 'ladder' | 'free'（free は未実装）
	box: new THREE.Box3( min, max ),                 // 登れる領域（ワールド AABB）
	faceDirection: new THREE.Vector3( 0, 0, 1 ),     // 外向き（プレイヤー側）水平法線。既定 +Z
	speed: 3,                                         // 登り速度 m/s。既定 3
});
world.add( ladder );
```

- `Body` 派生だが**衝突コライダーではない**（「ここでは登れる」判定ゾーン）。`_colliders` には入らない。
- `intoDirection = -faceDirection`（面へ向かう向き）。`getAttachPoint()` は外向き面から `radius` だけ出した
  取り付き軸（横は領域中心へロック）を返す。
- `World` は近傍の climbable を broad-phase（`box.intersectsSphere` ＝キャラの sphere）して
  `character.setNearClimbables()` で渡す。内部配列は `_climbableBodies`（private）。

### 10.2 `CharacterController` の登り状態

- 入力: **`character.climb(Vector2)`**（x=横〈free 用〉/y=上、W=上・S=下、**カメラ非依存で一貫**）。地上の
  `move(vec3)` とは別チャネル（`move` は水平専用で y を捨てるため）。状態フラグ `isClimbing`。
- `update()` は登り中、**重力 `FALL_VELOCITY`・ジャンプ弧・接地スナップをすべてバイパス**し `_updateClimb` で
  面に沿って動かす。イベント `startClimbing` / `endClimbing`。
- **取り付き（`_tryStartClimb`）** — 3 系統。いずれも `move()` の水平入力方向で判定:
  1. **下・側面から**（登る）: 面へ向かって（`into`）押し、足元が上端の縁より下（`_overlapsClimbBody`）。
  2. **天面から**（降りる）: 上端付近に立ち（`_isAtopClimbable`）、縁（外向き）へ押す。W=上/S=下 は一貫なので、
     カメラを背にした自然な操作では「縁へ歩く」と「降りる」が同じキーで繋がる。
  3. **空中グラブ**: ジャンプ中・自由落下中でも上記条件で掴める（掴んだ瞬間に落下/ジャンプ停止）。
- **梯子（1D）**: 横は取り付き軸へ寄せてロック、面へ正対。上端で天面へ**マントル**、下端で接地離脱、
  `jump()` で外向きへポップ離脱。
- **遷移スムージング（カメラのカクつき防止・重要）**: 位置追従カメラは x/z を直接コピーするため、
  1 フレームの瞬間移動がカクつく。よって:
  - マントル（上端→天面、`radius*2` 前進）は `MANTLE_DURATION_SEC≈0.2s` かけて連続移動（`_updateMantle`）。
  - グラブ時の軸合わせは `_approachHorizontally()` が `CLIMB_ALIGN_SPEED_MPS=6` で寄せる（瞬間スナップしない）。
  - マントル/飛び降り直後は再取り付きクールダウン `0.25s`（縁で入力保持時のチラつき防止）。

### 10.3 Phase B（壁面フリークライム・未実装）

`mode:'free'`: 領域内の**壁三角形に貼り付き**、既存の壁 `_contactInfo` 法線で正対。**2D 移動**（上下＋横、
`climb().x` を使用）、法線はトラバース中に変化、上端マントル・下端接地・ジャンプ離脱。梯子の状態機械を土台に拡張する。

---

## 11. パフォーマンス（as-built・2026-08-07）

計測環境: 床 198×198（66分割・3m セル）＋ 2m 箱 81 個、近傍三角形 238、キャラが箱の間を歩き続ける
シナリオを 5000 フレーム平均。ヘッドレス（vitest + node）。**`fixedUpdate` 約 0.30 ms → 約 0.046 ms/frame**。

各変更は「ゴールデンテスト 43→46 件が緑」＋「同一シナリオの最終位置トレースがビット一致するか」で検証した。
唯一の意図的な挙動差は 11.2 の superset 化（箱の林を 600 フレーム突っ切った終端で約 3cm ずれる）。

### 11.1 `Octree` の重複排除（`_queryId` マーク）

三角形は複数のサブツリーに登録されるので 1 クエリで何度も見つかる。従来は `result.indexOf()` で弾いており
**近傍数に対して O(n²)**（238 個で約 3 万回の線形探索）で、これが物理ステップ全体の支配項だった。
モジュールスコープの `_queryId` をクエリごとに 1 進め、結果へ入れた三角形に `triangle._queryId` を書く方式へ。
`get*Triangles` の第3〜4引数 `isRoot` は「最上位呼び出しだけ ID を進める」ためにある（再帰は `false`）。
走査順は不変なので**結果配列は要素も順序も完全に同一**（867 クエリで旧実装と照合）。0.308 → 0.166 ms/frame。

### 11.2 静的 broad-phase をフレーム単位に（`World`）

静的ボディは substep 間で動かないので、`fixedUpdate()` の先頭で 1 回だけ引いて 4 substep で使い回す。
半径には 1 フレームで動きうる距離 `(|velocity| + 乗っている床の速度) × dt`（下限 `STATIC_QUERY_PADDING_MIN`）を足す。

**重要な設計点**: 各 substep は「そのステップで必要な sphere がキャッシュの sphere に含まれるか」を確認し、
外に出ていたら引き直す（`_staticQueryCenters` / `_staticQueryRadii`）。包含していれば必要な葉ノードは必ず
キャッシュに入っているので、**padding は速度のためのチューニングであって正しさの条件ではない**
（ジャンプ開始・高速な運搬・テレポートは自動で引き直しになる）。`KinematicBody` は精度を落とさないため
**従来どおり substep ごとに**引き、バッファは「先頭＝静的ぶん（`_staticTriangleCounts`）／後ろ＝動的ぶん」。

近傍集合が厳密集合の superset になるため、壁ずり・段差・ジャンプ・動く床（2 m/s・10 m/s）はビット一致だが、
箱に当たって滑る挙動が積み重なるケースだけ数 cm ずれる。歩行 79.5 → 56.1 µs/frame。

### 11.3 動く床の bounding sphere（`KinematicBody`）

以前は world 三角形の `boundingSphere` を毎フレーム `undefined` にして利用側で作り直していた（＝近傍三角形
ごとに `new Sphere` ＋ `clone()`×2）。ボディ変換は剛体なので**ローカルの中心を行列変換・半径そのまま**でよい。
`computeBoundingSphere()` も既存の `Sphere` へ書き込む形に変更。板（12三角形）10.7 → 7.8 µs/frame、
数百三角形の床 32.4 → 22.8、回転床 34.7 → 24.8。回転床・コンベアを含めトレースはビット一致。

### 11.4 縦レイの xz prefilter（`CharacterController`）

接地判定と `stepOffset` の 2 プローブは真下／真上への線分。`isFarFromVerticalLine()` で
「三角形の bounding sphere 中心と縦線の xz 距離 > 半径」なら即スキップする（三角形上のどの点も中心から
半径以内なので、交点があれば xz 距離は半径以下＝**偽陰性なし**）。近傍が多いほど効く（1m セルの床で -11%）。

### 11.5 アロケーション（GC 圧）

- `World.step` の broad-phase 結果配列はキャラごとに使い回す（`_triangleBuffers` / `_climbableBuffers`）。
- 接触は `_contactInfo` を**プール**として使い、有効件数を `_contactCount` で持つ（読み側はこのカウントで
  ループを回す）。旧実装は接触ごとに `{ point: clone(), normal: clone(), … }` を生成しており、壁に押し付けると
  約 4 KB/frame のゴミになっていた（3.9 → 0.8 KB/frame）。
- `Octree.lineIntersect` / `rayIntersect` はモジュールスコープの三角形バッファを共有し、交点は最近点が
  確定してから 1 回だけ確保する（634 → 179 bytes/frame・カメラのレイ 4 本）。

**V8 に関する知見（測って分かったこと）**:
- 配列を `length = 0` してから `push` し直すと backing store が作り直されるため、プール化しても新規配列と
  ほぼ同じ確保量になる（239 要素で約 380 B）。`arr[ n++ ] = x` で上書きして最後に `length = n` にすればほぼ 0。
- 短命な一時配列（`[ a, b ]` を返して即捨てるなど）はエスケープ解析で消えているため、そこを削っても
  **測定できる差は出ない**（`intersectsCapsuleTriangle` の一時配列撤去は refactor 扱いでコミット）。
  実際に効くのは `_contactInfo` のように**参照が外へ逃げる**オブジェクト。

### 11.6 カメラのレイに `far`（`Octree` / `ThirdPersonCameraControls`）

本家 camera-controls の `_collisionTest()` は `raycaster.far = _spherical.radius + 1` を必ず設定しているが、
meshwalk の Octree 版オーバーライドはこの上限が落ちていた。`rayIntersect( ray, far? )` /
`getRayTriangles( ray, result, far?, isRoot? )` を追加し、原点からの 2 乗距離が `far` を超えるサブツリーを枝刈りする
（三角形は交差する全葉ノードに登録されているので、`far` 以内の交点はその交点を含む葉＝`far` 以内の葉にも
登録されており取りこぼさない）。`StaticBody` / `KinematicBody` は `far` を素通し（剛体変換で距離は不変）。

効果はレベル形状に依存する。**平坦なレベル（現デモ相当）ではカメラのレイ 4 本で 16 µs/frame・枝刈りゼロ＝
効果なし**。高さ 20m のビル群でカメラを 5m まで寄せた場合は 103 → 40 三角形・149.6 → 92.7 µs（-38%）。
逆にカメラが 30m でレイ全体が `far` 以内だと枝刈りできず判定コストぶん約 +8%。物理経路は `far` 無指定
（`Infinity`）で短絡するため影響なし。

### 11.7 残アイデア

- **近い順の octree 走査＋最初のヒットで打ち切り（G2）**: 現在の `rayIntersect` は「集める → 全部厳密判定」の
  2 段。高さのあるレベルでカメラの衝突判定が 150 µs/frame かかる問題の本質的な解はこれ。現デモ規模
  （16 µs/frame）では不要。
- `Octree.get*Triangles` を `push` → `arr[ n++ ]` 方式へ（約 0.4 KB/frame。複数ボディの結果を 1 本の配列へ
  足し込む構造なのでカウントの受け渡しが必要）。
- `_slopeLimitCos` の `Math.cos` キャッシュ、`KinematicBody._updateMatrix()` の invert 重複（dirty フラグ）。
  どちらも µs 未満なので測定できる差にならない見込み。
- ロード時間・常駐メモリ: `_addGeometry` は三角形ごとに `new Vector3`×3 ＋ `extend()`（normalize/sqrt 6 回）
  ＋ `Sphere`。大きい glTF ではロード時間に出る。本気でやるなら三角形を `Float32Array` のフラット配列に
  持つデータ指向への作り替え（全面改造・別プロジェクト規模）。

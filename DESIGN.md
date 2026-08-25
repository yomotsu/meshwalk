# meshwalk 設計改善メモ (DESIGN)

独学ベースで作られた現行 API を、一般的なゲームエンジン（Unity / Godot /
Rapier / cannon-es）および three.js の命名慣習に寄せるための設計方針。

- **後方互換は取らない**（0.x のうちに刷新する）。
- 各ステップごとに vitest のゴールデンテストで挙動を固定しながら進める。
- 本書は当初「計画」だったが、実装が進んだ現在は **as-built（実装済みの現状）＋残アイデア** の記録。

---

## 0. 実装状況（2026-08-25 時点・master に反映済み）

| 区分 | 項目 |
|---|---|
| **実装済み** | `Body`/`StaticBody`/`CharacterController` 化・`World.add(body)` 一本化。`StaticBody.fromObject`/`addFromObject`/`addFromGeometry`・`matrixWorld` バグ修正。`Octree` 内部化。`move(vec)` 入力。`slopeLimit`（度）。レンダー分離（`position`/`quaternion` 公開・利用側で同期）。`world.update(dt)` 固定ステップ・アキュムレータ。ジャンプの脱 `performance.now`（deltaTime 化・決定論）。`dispose()` 全クラス。型付き `EventDispatcher`。入力 `keyCode`→`event.code`。改名 `KeyInputControl`→`KeyboardControls` / `TPSCameraControls`→`ThirdPersonCameraControls` / `AnimationController.motion`→`actions`。options コンストラクタ。`teleport(Vector3)`。`KeyboardControls.inputVector`（Vector2）。**`stepOffset`（段差自動登り・既定 0.3）＋ `groundCheckDepth` 既定 0.3（登り降り対称）**。**動く床 `KinematicBody`**（`deltaMatrix` 運搬・回転運搬・離脱慣性・`surfaceVelocity`／ベルトコンベア。デモ 9）。**梯子 `ClimbableBody`**（登り状態。§10。デモ `10_ladder.html`）。 |
| **実装済み（性能）** | **パフォーマンス最適化 9 コミット**（§11）＋**プレフィルタ最適化 3 コミット**（§13）。`Octree` の重複排除を `_queryId` マーク化、静的 broad-phase をフレーム単位＋有効範囲キャッシュ、動く床の bounding sphere を剛体変換、縦レイの xz prefilter、接触・バッファのプール化、`intersectsCapsuleSphere` のスカラー化、broad-phase 結果のフレーム単位の絞り込み、`Sphere.intersectsBox` の自前化。`fixedUpdate` 0.1377 → 0.0554 ms/frame（密なレベル）。 |
| **実装済み（衝突の質）** | **壁摺りのガタつき修正 3 コミット**（§12）。`intersectsCapsuleTriangle` を 「参照点 → 中心線上の最近点 → 球 vs 三角形」へ置き換え（接触点と貫通量の食い違いを解消）、段差登りの発動条件に 「実際に進めていないこと」を追加（連続斜面での誤発動＝上下振動を解消）、位置の積分を壁ずり射影**前**の速度へ（壁を押し続けて接触の点滅を解消）。任意メッシュ（`terrain.glb`）でのみ出ていた症状。 |
| **実装済み（カメラ）** | **カメラ衝突をスフィアスイープへ**（§14）。近クリップ面 4 隅からの平行レイ 4 本 → 追従点から `collisionRadius`（既定 0.1）の球を 1 回掃く方式（Unreal の SpringArm 相当）。隅の間隔より細い柱をすり抜ける問題が消え、負荷も 0.125 → 0.046 ms/frame。`StaticBody.sphereCast` / `KinematicBody.sphereCast` を公開 API として追加。 |
| **ドロップ** | **物理モデル刷新（重力の「場」＋インパルスジャンプ＋`gravityScale`）**。§3 参照。現行のジャンプ／落下仕様を維持する判断。 |
| **保留（未着手）** | 壁面フリークライム（`ClimbableBody` の `mode:'free'`＝Phase B。§10）。`AnimationController.turn()` の `Date.now`/rAF → deltaTime 化。瞬間イベント `landed`/`jumped`（現状は `startIdling/Walking/Jumping/Sliding/Falling` を維持）。壁歩き／惑星重力（L2）。 |

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
| 速度 | `character.velocity`：エンジンが毎ステップ算出する**最終速度（読み取り用）**。y=ジャンプ/落下、x/z=壁ずり射影後。※入力とは別概念（下記）。位置を進めるのは射影**前**の `_integrationVelocity`（壁を押し付けたままにして滑りは押し出しに任せる。§12.3）。 |
| 落下 | 一定 `FALL_VELOCITY = -20`（**速度**であって加速度ではない）。重力積分はしない。 |
| ジャンプ | 時間ベースのコサイン弧（`jump()` → `_updateJumping(deltaTime)`）。全長は **`jumpDuration`（公開・既定 1 秒＝定数 `JUMP_DURATION_SEC`）** で可変（大きいほど高く長い）。既定時は到達高さ ≈ 6.37・滞空 ≈ 1s。deltaTime 駆動で決定論的（脱 `performance.now`）。 |
| 斜面 | `slopeLimit`（**度**、既定 50）。内部で cos 化（Unity 準拠）。急勾配は `FALL_VELOCITY` で滑走。 |
| 段差 | `stepOffset`（既定 0.3）以下の段は自動で登る。`_checkGround` の `_stepLookAhead` が前縁を先読みし `groundHeight` を段上面へ上げる。発動条件は**壁接触＋「直前ステップで実際に進めていない」**（`STEP_BLOCKED_RATIO = 0.3`。斜面での誤発動を防ぐ。§12.2）＋ラッチ＋天井チェック。降りは `groundCheckDepth`（既定 0.3）が対称に担う。 |

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

---

## 12. 壁摺りのガタつき（as-built・2026-08-25）

任意メッシュ（`examples/5_terrain.html` の `terrain.glb` など）で壁に斜めから当てて進むと、小刻みに
ガタつく。箱だけのシーンでは起きない。原因は**独立した 3 つ**で、どれも「箱の壁では露呈しないが、
傾いたフェイスを持つ任意メッシュでのみ出る」性質を持っていた。

計測はすべてヘッドレス（vitest + node）。`terrain.glb` は `GLTFLoader.parse()` で node から直接読める
（非圧縮・`POSITION`/`NORMAL` のみ）。

> **計測時の落とし穴**: プロトタイプをフックして計測するとき、`orig.call( this )` のように**引数を
> 転送し忘れる**と `deltaTime` が `undefined` になり、`_stepLookAhead` の発動条件が常に false になる。
> 一度これで「修正が効いた」と誤った数値を出した。フックは必ず `orig.apply( this, args )` にする。

### 12.1 カプセル vs 三角形の接触点と貫通量の食い違い（`intersectsCapsuleTriangle`）

旧実装（three.js の `Octree.triangleCapsuleIntersect` 由来）は面接触の判定で

- 接触点 = 中心線が「半径ぶんオフセットした平面」を横切る位置（`delta` で lerp）
- 貫通量 = `Math.abs( Math.min( d1, d2 ) )` ＝ **中心線の遠い端**の値

という食い違った計算をしていた。縦カプセル（線分長 1.5 m）が傾いたフェイスに当たると、この 2 点は
最大で線分長ぶん離れる。結果、

- `containsPoint` が数 cm の移動で切り替わり、接触が**断続的に見逃される**
- 検出できたときは遠い端の深さが報告され、**過大な押し出し**になる

起伏のある壁を斜めに摺るシナリオで、見逃しの次のステップに 0.43 m の押し出し（1 substep で 0.39 m 移動）
を実測した。**箱の垂直な壁では `d1 === d2` になるので `delta = 0.5`＝線分の中点で安定し、深さも正しい**。

ファイル冒頭が引用していた正攻法（wickedengine / Ericson 5.1.10）へ置き換えた。中心線とフェイス平面の
交点を三角形上へ寄せて**参照点**とし、参照点に最も近い中心線上の点へ半径ぶんの球を置いて
`intersectsSphereTriangle` へ委譲する。面・辺・頂点が 1 本の経路で扱われるので、専用だった
`testEdge` / `nearestPointsOnLineSegments` は削除した。裏面カリングの早期棄却（**両端とも裏側なら
接触なし**＝床面と同じ高さの下向き面で真下へ押し出す誤検出の防止）は挙動を保つため元の条件のまま。

| 起伏のある壁を斜めに摺る 360 substep | 修正前 | 修正後 |
|---|---|---|
| 1 substep の最大移動 | 0.392 m | 0.042 m（＝通常の最大速度） |
| 押し出し最大 | 0.428 m | 0.039 m |
| 速度の段差 max / mean | 0.377 / 0.0036 | 0.024 / 0.0005 |

### 12.2 段差登りが連続斜面で誤発動する（`_stepLookAhead`）

`_stepLookAhead` は**カプセル前縁（`radius` 先）の地面の高さ**を `groundHeight` に採用する。段差なら
正しいが、斜面で発動すると「まだ到達していない高さ」へ持ち上がり、次ステップで解除されて落ちる、を
繰り返して上下に振動する。`terrain.glb` 上で **3 フレーム周期・振幅 ±0.3 m**（≒ `stepOffset`）の
リミットサイクルを実測した。

発動条件が「進行方向に対向する壁との接触があること」だけだったのが原因。旧コメントは
「連続斜面では壁接触が起きないので発動しない」を前提にしていたが、**実地形では歩ける斜面
（`groundNormal.y` = 0.83）の中に急なファセット（法線 y = 0.26〜0.32）が混ざる**ため成立しない。

段差登りは「低い障害物に行く手を阻まれた」ときの機能なので、**直前ステップで望んだ方向へ実際に
進めていれば発動させない**ようにした（`_lastMoveDelta` と `STEP_BLOCKED_RATIO`）。

**採用しなかった判定**（どちらも実測で棄却）:
- 「地面の接平面を前方へ延長した高さと比較」— 足元のレイが局所的に平らなファセットを拾うと効かず、
  誤発動が 27 → 7 回にしか減らない。
- 「壁（立ち上がり）の上端が段差上面に届いているか」— 地形の壁三角形は大きいので通過し、**逆に
  誤発動が増えた**（27 → 234 回）。

### 12.3 壁ずりの射影が積分に使われて接触が切れる（`_updateVelocity` / `_updatePosition`）

`_updateVelocity()` は `velocity` から壁方向の成分を取り除き、次のステップの `_updatePosition()` が
その**射影後**の速度で位置を進めていた。射影後の速度はフェイスの接線方向なので、キャラは壁を
押し続けない。平らな壁なら接触が維持されるが、起伏のある面では面が逃げて接触を取りこぼし、

> 接触が切れる → 全速で壁へ突っ込む → 深く当たって射影され減速 → また切れる

を繰り返す。起伏のある壁で **760 substep 中 211 回**の接触の点滅を実測した。

位置を進めるのは射影**前**の速度（`_integrationVelocity`）にして、壁へ押し付けたままにする。滑りは
押し出し（`_solvePosition`）が担う。`v * dt` から法線成分を除去したものは `v_tangent * dt` に等しいので、
**位置の結果は変わらない**。`velocity` は従来どおり射影後のまま＝利用側へ見せる「エンジンが出す最終速度」
の意味を保つ。

| | 水平速度の段差 max / mean | 接触の点滅 |
|---|---|---|
| 起伏のある壁（修正前 → 後） | 0.0302 / 0.00211 → 0.0121 / 0.00039 | 211 → **1** 回 / 760 substep |
| terrain（修正前 → 後） | 0.0051 / 0.00031 → 0.0046 / 0.00021 | 41 → **0** 回 / 240 substep |

### 12.4 `STEP_BLOCKED_RATIO`（= 0.3）の根拠

進行率は、望む方向 `u` と壁法線 `n` のなす角を「正面衝突からのずれ `α`」とすると **`sin²α`**。
つまりしきい値 `r` は「`α = asin(√r)` より正面寄りの進入でのみ段差登りが働く」を意味する。

- 0.5（初回の値）は `α = 45°` 相当で緩すぎ、地形の誤発動が残った（発火 152/185 回）。
- 0.1 / 0.25 は誤発動を 0 にできるが、12.3 で進行が滑らかになった結果 **`α = 30°` の進入が
  ちょうど `sin²30° = 0.25`** で境界に乗り、20 cm の段差を 30° から登るのが 21 → 33 フレームに遅くなる。
- **0.3** で誤発動 0 のまま所要フレーム数が元へ戻る。

### 12.5 回帰の確認方法（再現用）

- **段差マトリクス**: 平床＋高さ h の箱へ進入角 deg で歩き、上面に乗るまでのフレーム数を記録。
  `h ∈ {0.1, 0.2, 0.3, 0.4} × deg ∈ {0, 15, 30, 45, 60}`。**登れる／登れないの判定と所要フレーム数**で比較する。
  最終状態で差が出るのは 10 cm の段差のみ（0°:18→19, 15°:19→20, 30°:21→23, 45°: 登れず → 31）。
- **貫通マトリクス**: 速度 `{10, 30, 60, 120}` × 進入角 `{0, 30, 60}` で箱へ突入し、中心が箱内へ
  入った最大量を見る。全条件で 0。
- **ジッター**: substep 粒度で「水平移動量の隣接差」と「壁接触の有無の反転回数」を数える。
  フレーム粒度だと 4 substep で均されて見えなくなるので注意。

### 12.6 残っている既知の制限

- 段差へ**浅い角度で進入すると登れない**（30 cm の段差は 30° 以上で×）。これは今回の変更前からの
  挙動で、`_stepLookAhead` が単一のプローブ点しか見ないことに由来する。
- `_stepLookAhead` は依然として「`radius` 先の高さ」へスナップするので、本物の段差でも到達前に
  最大 `stepOffset` ぶん先行して持ち上がる。滑らかにするなら持ち上げをレート制限する必要がある。

---

## 13. プレフィルタ最適化（as-built・2026-08-25）

§11 の後、あらためて `fixedUpdate` をプロファイルして分かったこと。**近傍 224 三角形に対して
実際の接触は 1.14 件**しかない。つまりコストのほぼ全部が「候補を集める」「候補を弾く」側にある。

計測環境: 床 200×200（1m セル・80,000 三角形）＋ 3m 箱 144 個。近傍 224 三角形。
**`fixedUpdate` 0.1377 → 0.0554 ms/frame（-60%）**。3 変更とも 3000 フレームの軌跡がビット一致。

| | inclusive（最適化前） | 呼ばれる回数 |
|---|---|---|
| `_collisionDetection` | 41% | 4 回/frame |
| `_queryStaticTriangles` | 36% | 1 回/frame |
| `_checkGround` | 18% | 4 回/frame |

### 13.1 `intersectsCapsuleSphere` のスカラー化

近傍三角形すべてに対して substep ごとに呼ばれるプレフィルタで、密なレベルでは約 900 回/frame。
旧実装は 1 呼び出しごとに `Line3` を経由し、`copy`×2 ＋ `subVectors`×2 ＋ `dot`×2 ＋ `clamp` ＋
`add` ＋ `multiplyScalar` が走っていた。**カプセルの線分はループ中ずっと同じなのに毎回組み立て
直している**。`Vector3` / `Line3` を経由しないスカラー計算へ。0.1377 → 0.1007 ms/frame。

### 13.2 broad-phase 結果をフレーム単位で実交差に絞る（`World._queryStaticTriangles`）

`Octree.getSphereTriangles` は「球に交差する**葉ノード**」の三角形をまるごと返す。実測では
**1 クエリあたり 663 回のノード判定で 265 本を集めるが、球に実際に交差するのは 27 本（12%）**。
そこを substep（既定 4 回）ごとに、接地判定・段差プローブ・カプセル判定の 3 箇所がそれぞれ
頭から舐めていた。フレーム先頭で 1 回だけ実交差で絞れば、そのすべてに効く。

**落としてよい根拠は §11.2 の仕組みがそのまま使える**: `step()` は「そのステップで必要な sphere が
キャッシュの球に収まっているか」を確認し、外れていたら引き直す。収まっているなら、必要な三角形は
必ずキャッシュの球にも交差する。速度に依存しない条件で、高速移動時は引き直しが走る。

あわせて球の半径を `getQueryReach()` へ切り出し、**キャラが 1 ステップ中に触りうる最遠点を
明示的に覆う**ようにした。

| 判定 | 中心（足元 + height/2）からの必要距離 |
|---|---|
| カプセル本体 | `height / 2`（両端のキャップまで含めてちょうどこの距離に収まる） |
| 接地レイの許容帯 | `height / 2 + groundCheckDepth` ← 従来の半径 |
| 段差プローブ | `sqrt( radius² + (height/2)² )` |
| 頭上プローブ | `height / 2 + stepOffset` |

従来の半径では `stepOffset > groundCheckDepth` や `radius` の大きいキャラでプローブを覆いきらない。
**今までは葉ノード単位の余分な取り込みが偶然それを隠していただけ**で、絞り込みを入れるとその余裕が
消える。既定値（radius 0.5 / height 2 / groundCheckDepth 0.3 / stepOffset 0.3）では接地レイの 1.3 が
最大なので従来と同じ値になり、挙動は変わらない。0.1007 → 0.0638 ms/frame。

### 13.3 `Sphere.intersectsBox` の自前化（`Octree`）

`getSphereTriangles` はノードを降りるたびに全サブツリーへ判定を行い、1 クエリあたり 663 回になる。
three の実装は `Box3.clampPoint`（`Vector3` の `copy` ＋ `clamp`×6）を経由するのでスカラーで書き直す。
0.0638 → 0.0554 ms/frame。

**先に単体で試したときは実測差ゼロで一度棄却した**。13.2 で他が軽くなった結果 broad-phase が
`fixedUpdate` の 67% を占めるようになり、効くようになった。**最適化の順序で効果が変わる例**。

### 13.4 残アイデア（`fixedUpdate`）

最適化後の内訳は `_queryStaticTriangles` 63% / `_collisionDetection` 25% / `_checkGround` 7%。
octree の走査が支配的になった。

- **葉のしきい値（`split()` の `len > 8`）の調整**: 8 → 32 でノード判定 663 → 320 回だが、収集本数が
  265 → 538 本に増えて相殺され、正味 **-10%** どまり。**返る三角形の集合と順序が変わる**ので
  「軌跡ビット一致」では検証できない（`_solvePosition` が接触を配列順に累積するため）。
- **二段キャッシュ**: octree クエリを毎フレーム引き直しているのが 63% の正体。「大きめの球で稀に引く →
  毎フレーム狭い球で絞る」の二段にすれば octree 走査そのものを多くのフレームで飛ばせる。理屈上は最大の
  一手だがキャッシュ層が 1 段増える。
- `getSphereTriangles` の `push` → `arr[ n++ ]`（§11.5 の V8 の知見）。265 本/frame。
- `_collisionDetection` の 25% のうち 16% は `intersectsCapsuleTriangle` 本体（27 本 → プレフィルタ通過
  約 13 本 × 4 substep ≒ 50 回/frame）で、これは本来やるべき仕事。**もう脂肪が少ない**。

---

## 14. カメラの衝突判定（as-built・2026-08-25）

### 14.1 きっかけ

§11・§13 で `fixedUpdate` が 0.30 → 0.017 ms/frame まで下がった結果、**カメラの衝突判定のほうが
物理より 5〜9 倍重い**という逆転が起きた。§11.6 の「平坦なレベルでは効果なし」という評価は、
物理が重かった当時の相対評価だった。

| シーン | 物理 `fixedUpdate` | カメラのレイ 4 本 |
|---|---|---|
| 高さ 3m の箱（平坦） | 0.017 ms/frame | 0.093〜0.128 ms/frame |
| 高さ 20m の柱 | 0.015 ms/frame | 0.083〜0.134 ms/frame |

### 14.2 4 本レイという方式そのものを見直す

camera-controls の `_collisionTest()` は近クリップ面の 4 隅から平行なレイを 4 本飛ばす。矩形を掃いた
体積を隅で近似する方法で、過剰に引き寄せない利点がある。**なお `_collisionTest` は `protected` で、
公式サンプル `collision-custom.html` が octree で上書きする例を示している＝これは想定された拡張点**
（当初「private に手を突っ込んでいて脆い」と評価したが誤り。継ぎ目の追加は不要だった）。

主要エンジンは**単一のスフィア／カプセルのスイープ**を使う。

| | 判定方法 | 半径 |
|---|---|---|
| Unreal `USpringArmComponent` | スフィアスイープ 1 本 | `ProbeSize` 固定・既定 12cm |
| Unity Cinemachine `Deoccluder` | レイ 1 本 ＋ 半径ぶんのマージン | `CameraRadius` 固定 |
| camera-controls | 平行レイ 4 本 | なし（近クリップ面の隅が実質の半径） |

4 本レイの弱点は**隅の間隔より細い物体をすり抜ける**こと。near 0.1 / fov 40 / 16:9 では隅の間隔が
12.9cm なので、それより細い柱・手すり・格子でカメラが壁の中に入る。

| 柱の幅 | レイ 4 本 | スフィア（r=0.1） |
|---|---|---|
| 2cm / 5cm / 10cm | **すり抜け** | 4.800 |
| 13cm 以上 | 4.900 | 4.800 |

### 14.3 実装

`StaticBody.sphereCast( origin, direction, maxDistance, radius )` を `rayIntersect` と対になる公開 API
として追加（`KinematicBody` にも同 signature。**`world.colliders` は動く床を含み、カメラは従来から
動く床とも判定している**ため必須）。

- `src/math/sweepSphereTriangle.ts`: 掃かれた球 vs 三角形。面・辺・頂点の 3 領域を解く
  （Fauerby "Improved Collision detection and Response" ／ Ericson 5.5）。
- `Octree.getSweptSphereTriangles()`: broad-phase。ボックスを `radius` ぶん膨らませて中心線のスラブ判定。
  角の近くで superset になるが偽陰性はない。未使用かつ引数の型が `Sphere` になっていた
  `getCapsuleTriangles` を置き換えた。

レイ版に合わせて**背面は無視**する。あわせて**開始時点で既に接触している面も無視**する。カメラの
追従点が一瞬ジオメトリへ潜っただけで距離 0 を返すと、カメラがターゲットへ張り付いてしまうため
（Unreal の `bStartPenetrating` に相当する状況。Unreal 自身はアームを畳むが、ここでは畳まない選択）。

### 14.4 負荷は下がる（直感に反して候補が減る）

| シーン / 距離 | | 候補三角形 | 時間 |
|---|---|---|---|
| 高さ 3m の箱・5m | レイ 4 本 | 2287 本 | 0.125 ms |
| | **スイープ 1 本** | **1161 本** | **0.046 ms** |
| 高さ 20m の柱・30m | レイ 4 本 | 1481 本 | 0.135 ms |
| | **スイープ 1 本** | **545 本** | **0.050 ms** |

**候補三角形の数がスイープのほうが少ない**（1/2〜1/3）のが効いている。4 本のレイはそれぞれ独立に
octree を走査するので、隣り合う 4 本がほぼ同じ葉ノードを重複して辿り、同じ三角形を 4 回集める
（`_queryId` の重複排除はクエリ単位）。掃かれた球は 1 回の走査で同じ体積を覆うので、この 4 重の
無駄が消える。

なお利得の一部は形状ではなく実装差（新しいノード判定がスカラー、レイ側は three の
`Ray.intersectsBox` ＋ `distanceSquaredToBox` 経由）。「スフィアスイープだから速い」ではなく
**「1 回走査への集約＋ノード判定のスカラー化」の合算**。

### 14.5 半径とクリップ面

`collisionRadius` は公開プロパティ・既定 **0.1**（Cinemachine の `CameraRadius` と同値、Unreal の
`ProbeSize` 12cm とも近い）。近クリップ面がこの球からはみ出すと壁が映り込むので、下限は

```
collisionRadius >= camera.near * tan( fov / 2 ) * sqrt( 1 + aspect² )
```

（near 0.1 / fov 40 / 16:9 で 0.074）。Cinemachine のドキュメントが *"Increase it if you are seeing
inside obstacles due to a large FOV"* と言っているのと同じ話で、**自動算出はしない**（エンジンに
合わせる方針、かつ暗黙の魔法を避ける）。

あわせてデモのカメラを `( 40, aspect, 1, 1000 )` → `( 40, aspect, 0.1, 1000 )` へ。`near 1` は
three.js としてもかなり大きい。`far 1000` は Unity Camera の既定と同じなので据え置き。`fov 40`
（水平 66°）も据え置き（Unity / Unreal の既定は垂直 60 / 水平 90 だが汎用の値で、三人称アクションの
実勢は水平 55〜75°）。

**深度精度**（24bit）: near 0.1 / far 1000 で 100m で 6mm、200m で 24mm。デモの規模では z-fighting に
至らない。オープンワールド規模（far 10km）では near を 0.1 → 1 と 10 倍にしても 5km で 1.5m にしか
ならず、**near をいじる方向に解はない**。reversed-Z（three.js の `WebGLRenderer.reversedDepthBuffer`）
や対数深度で対応する話になり、meshwalk の管轄外。

### 14.6 破棄した試み: `Octree.rayIntersect` の近い順走査（G2）

§11.7 の G2（近い順に辿って最初のヒットで打ち切り）を実装しかけたが、20000 本のランダムなレイで
base 8437 ヒットに対し新実装 1952 ヒットと大量の取りこぼしが出た（単純なケースは一致）。原因を
詰める前に、そもそも 4 本レイをやめる方針へ切り替えたため破棄した。

カメラが `rayIntersect` を使わなくなったので、**G2 の優先度は再び下がった**。`rayIntersect` は
公開 API として残っており、利用側が使うなら依然として「集める → 全部厳密判定」の 2 段のままである。

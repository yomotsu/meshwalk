# meshwalk — project context for Claude Code

three.js 用の TPS キャラクターコントローラ・ライブラリ（yomotsu/meshwalk）。
独学ベースの API を一般的なゲームエンジン慣習へ寄せる**段階的リファクタリング**を進行中。
方針・実装状況の詳細は **`DESIGN.md`** が一次情報（本ファイルは作業の引き継ぎメモ）。

## 進め方（重要・厳守）
- **1フェーズ／1タスクずつ。実装 → tsc+lint+vitest+build+デモ目視 → 停止 → ユーザーが承認 → 次へ**。勝手に先へ進めない。
- **コミットはユーザーが「commit」と言った時だけ**。**push は明示指示があるまで絶対にしない**。1コミット＝1つの意味単位（復帰点）。
- **挙動の維持を最優先**。手触りが変わる変更（ジャンプ高さ・落下感など）は必ず明示して目視確認を仰ぐ。
- 過去に「一括の物理書き換え」で挙動を壊した経緯があり、以後は小さく検証しながら進める運用。

## 検証セットアップ
- ゴールデンテスト: `test/collision.test.ts`（`npm test`、vitest・ヘッドレス）。W2 の安定挙動＋各機能を数値で固定。**各変更でここを緑に保つ**。
- ブラウザ: `python3 -m http.server`（**必ず run_in_background で起動。`&` は使わない**）→ `examples/*.html`。
  Playwright 一式は `/private/tmp/verify-with-chrome`、Chrome は `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`。
- ビルド: `npm run build`（rollup + terser、ESM のみ）。デモは `dist/meshwalk.module.js` を参照するので**コード変更後は再ビルド**。

## 落とし穴
- **ファイル名に `key`/`token`/`secret` を含むファイルは Read/Edit/cat/sed がユーザーの deny 設定で拒否される**（例: `src/TPS/KeyboardControls.ts`, `examples/2_keyboard-input.html`）。→ **node の `fs.readFileSync`/`writeFileSync` で読み書き**する。`git mv` は Bash で可。
- デモは CRLF のものが混在（demo7 は LF）。node で書き換える時は**元の改行コードを保持**する。
- `Date.now()`/`Math.random()`/`new Date()` はワークフロー用スクリプト内では使えない（別文脈）。通常コードは可。

## 現状（2026-08-25）
- ブランチ **`master`**。Phase 0–4 ＋ API 整形 ＋ 動く床（`KinematicBody`）＋ **梯子（`ClimbableBody`）** ＋ **パフォーマンス最適化 9 コミット** ＋ **壁摺りのガタつき修正 3 コミット** は master 反映済み。**ローカルで origin より先行（未 push）**。`git log`/`git status -sb` で確認。
- テスト49件・全デモ（`1`–`10` ＋ recast の `20`/`21`）ロードエラーなし・tsc/lint/build 緑。
- **`dist` は最適化シリーズ＋ガタつき修正の分が未コミット**（src のみコミットする運用にした＝差分が大きくなるため）。デモは `dist/meshwalk.module.js` を読むのでローカルではビルド済み。どこかでまとめてコミットするか、`dist` を追跡から外すかは**未決**。コミット時は `git add -A` ではなくパス指定で入れる。
- デモ番号: コア機能は `1`–`10`（`10_ladder.html`）。recast 系は将来の差し込み用に `20`/`21` へ繰り下げ済み（`10`–`19` は空き）。

### 実装済み（要点）
- `Body`/`StaticBody`/`CharacterController`（旧 `CharacterBody` 案は撤回し `CharacterController` 据置）／`World.add(body)` 一本化。
- `StaticBody.fromObject`/`addFromObject`/`addFromGeometry`（`matrixWorld` バグ修正済み）、`Octree` 内部化。
- 入力: `character.move(vec3)`（水平の望む速度をセット・持続）。`velocity` は**エンジンが出す最終速度（読み取り）**で、入力とは別概念（`velocity` を入力にはしない＝内部で y を管理するため）。
- `world.update(dt)`（実 delta・内部アキュムレータで固定ステップ、上限 `MAX_CATCH_UP_FRAMES`）。`fixedUpdate()` は決定論用に残置（テストが使用）。
- レンダー分離: `position`/`quaternion` 公開、メッシュ同期は利用側（`world.update` の後）。
- ジャンプ: deltaTime 駆動のコサイン弧（脱 `performance.now`・決定論）。全長は公開プロパティ／option `jumpDuration`（既定 1s＝定数 `JUMP_DURATION_SEC`）で可変。既定時は到達高さ≈6.37・滞空≈1s。
- `slopeLimit`（度）／`stepOffset`（既定 0.3・段差自動登り）／`groundCheckDepth`（既定 0.3・登り降り対称）。
- 動く床 `KinematicBody`（`deltaMatrix` で運搬・回転運搬、離脱慣性、`surfaceVelocity`＝ベルトコンベア）。デモ 9。
- **梯子 `ClimbableBody`**（`mode:'ladder'|'free'`・ワールド `Box3`・`faceDirection`・`speed`）を `world.add` 登録。判定ゾーン（コライダーではない）。デモ `10_ladder.html`。詳細は `DESIGN.md §10`。
  - `character.climb(Vector2)`（x=横/y=上、W=上/S=下・カメラ非依存）。`isClimbing`。登り中は重力/ジャンプ弧/接地スナップをバイパス。
  - 取り付き: ①下・側面から（面へ向かって `move`）②天面から（上端付近で縁へ `move`→そのまま降りる）③ジャンプ・自由落下中（空中グラブ）。`jump()` で外向きへポップ離脱。
  - 遷移スムージング（カメラのカクつき防止）: マントル（上端→天面）は `MANTLE_DURATION_SEC≈0.2s`、グラブ整列は `CLIMB_ALIGN_SPEED_MPS=6` で寄せ、瞬間移動しない。マントル/飛び降り直後は再取り付きクールダウン `0.25s`。
  - `mode:'free'`（壁面フリークライム）は**型だけ用意・未実装（Phase B）**。イベント `startClimbing`/`endClimbing`。
- options コンストラクタ `new CharacterController({ radius, height, slopeLimit?, stepOffset?, groundCheckDepth? })`、`teleport(Vector3)`。
- `KeyboardControls.inputVector`（Vector2, x=右/y=前, 正規化, 無入力=0）。デモは `applyAxisAngle(Y, camera.frontAngle)` で回して `move()` へ。
- 改名: `KeyInputControl`→`KeyboardControls`、`TPSCameraControls`→`ThirdPersonCameraControls`、`AnimationController.motion`→`actions`。
- `dispose()` 全クラス。型付き `EventDispatcher<TEventType>`（既定 string）。入力 `keyCode`→`event.code`。

### 壁摺りのガタつき修正（2026-08-25・詳細は `DESIGN.md §12`）
任意メッシュ（`examples/5_terrain.html`）でのみ出ていた。**独立した 3 原因**で、箱の壁では露呈しない性質だった。
- `intersectsCapsuleTriangle`: 面接触で「接触点は中心線が平面を横切る位置／貫通量は中心線の**遠い端**」と食い違っていた。傾いたフェイスで接触の見逃し → 次ステップで 0.43m の押し出し。垂直な壁は `d1 === d2` なので露呈しない。→ 「参照点 → 中心線上の最近点 → `intersectsSphereTriangle`」へ置き換え（`testEdge` 等は削除）。
- `_stepLookAhead`: 発動条件が壁接触だけだったため**連続斜面で誤発動**（3フレーム周期・振幅 ±0.3m の上下振動）。実地形では歩ける斜面に急なファセットが混ざるので「連続斜面では壁接触が起きない」という前提が成立しない。→ 「直前ステップで実際に進めていないこと」（`STEP_BLOCKED_RATIO = 0.3`）を追加。
- `_updatePosition`: 壁ずり**射影後**の速度で位置を進めていたため壁を押し続けず、起伏のある面で接触が点滅（760 substep 中 211 回）。→ 射影**前**の `_integrationVelocity` で積分し、滑りは押し出しに任せる。`velocity` は射影後のまま（利用側へ見せる実速度）。
- **計測時の注意**: プロトタイプのフックで `orig.call(this)` と書いて引数を転送し忘れると `deltaTime` が `undefined` になり、段差登りが常時 OFF になって「効いた」ように見える。必ず `orig.apply(this, args)`。
- 回帰の見方: 段差マトリクス（高さ×進入角の所要フレーム数）／貫通マトリクス（速度×進入角）／substep 粒度のジッター（フレーム粒度だと 4 substep で均されて見えない）。`terrain.glb` は `GLTFLoader.parse()` で node から直接読める。

### パフォーマンス最適化（2026-08-07・詳細は `DESIGN.md §11`）
`fixedUpdate` **約0.30 → 約0.046 ms/frame**（床198×198＋箱81個・近傍238三角形で歩行、5000フレーム平均）。
各変更は「ゴールデンテスト緑」＋「同一シナリオの最終位置トレースがビット一致するか」で検証済み。
- `Octree` の重複排除を `indexOf`（O(n²)）→ `triangle._queryId` マークへ。`get*Triangles` の `isRoot` 引数は「最上位呼び出しだけ ID を進める」ため。**支配項だった**（0.308→0.166 ms/frame）。
- **静的 broad-phase はフレーム単位**（`World.fixedUpdate` 先頭で1回）。substep は「必要な sphere がキャッシュに含まれるか」で判定し、外れたら引き直す＝**padding は速度のためのもので正しさの条件ではない**。`KinematicBody` は従来どおり substep ごと。**唯一の意図的な挙動差**（近傍が superset になる／箱の林を600フレーム突っ切ると終端で約3cm ずれる）。
- 動く床の `boundingSphere` は剛体変換でローカルから持ってくる（毎フレーム再計算をやめた・約30%短縮）。
- 縦レイ（接地・段差プローブ）に bounding sphere の xz prefilter（偽陰性なし）。
- ゴミ削減: broad-phase 結果配列の使い回し、接触の**プール化**（`_contactInfo` + `_contactCount`／3.9→0.8 KB/frame）、`Octree.rayIntersect` のバッファ共有。
- カメラのレイに `far`（本家 camera-controls と同じ `_spherical.radius + 1`）。**平坦なレベルでは効果ゼロ**、高さのあるレベルでカメラが近いと -38%、逆に枝刈りできないと +8%。
- **V8 の知見**: ①配列は `length = 0` → `push` だと backing store を作り直すので、`arr[n++]` ＋最後に `length = n` にしないとプール化の意味が薄い。②即捨てる一時配列はエスケープ解析で消えるので削っても差は出ない（効くのは参照が外に逃げるオブジェクト）。
- 測り方の教訓: ベンチはキャラをレベル外へ歩き去らせない（周期的に `teleport` で戻す）、試行回数を稼ぐ、A/B は同一ハーネス・複数回。**カメラのレイは向きで桁が変わる**（下向き斜めは重く、実際の三人称カメラの上後方は軽い）。

### 物理の決定（重要）
- **重力の「場」＋インパルスジャンプ＋`gravityScale` の刷新は検討の上ドロップ**。現行のジャンプ／落下（コサイン弧＋定数 `FALL_VELOCITY=-20`）を維持。
  - 理由: 単一重力では {メートル現実 9.8・現状の大ジャンプ高さ・現状の速い落下} を同時に満たせない（物理制約）。両立には非対称重力が要るが、ユーザーは現行の手触り維持を選択。
- 質量は無関係（速度・加速度を直接扱う運動学モデル）。

### 保留（未着手・「今はやらない」）
- **壁面フリークライム（Phase B）**: `ClimbableBody` の `mode:'free'` を実装（領域内の壁三角形に貼り付き、`_contactInfo` 法線で正対、2D 上下＋横移動、上端マントル・下端接地・ジャンプ離脱）。up は Y のまま＝L2 とは別物。
- `AnimationController.turn()` の脱 `Date.now`/rAF（deltaTime 化）。
- 瞬間イベント `landed`/`jumped`（現状 `start*` イベント維持）。梯子は `startClimbing`/`endClimbing` を既に持つ。
- README の API 節を現行 API に更新（デモ一覧は更新済み・DESIGN.md は as-built）。
- 壁歩き／惑星重力（L2＝コントローラを up ベクトル非依存に再設計）。
- **G2: octree のレイ走査を「近い順＋最初のヒットで打ち切り」に**（現在は「集める→全部厳密判定」の2段）。高さのあるレベルでカメラの衝突判定が 150 µs/frame かかる問題の本質的な解。現デモ規模（16 µs/frame）では不要。`DESIGN.md §11.7`。

## 参考
- 破棄した物理刷新の試作（Approach 1 等）は git tag `backup/w2b-attempt` に保全。
- コミット規約: 末尾に `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`。破壊的変更は `!` 付き。

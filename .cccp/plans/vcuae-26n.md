# Plan: Luxury PWA CSS Redesign

## Metadata
- bead_id: vcuae-26n
- status: approved
- created: 2026-02-17
- updated: 2026-02-17
- author: スターリン

## Context（なぜこの作業が必要か）

demo/web PWA（Purchase Ledger）はブランド中古品販売業者がお客さんに入力してもらう toC アプリ。現状は業務フォーム感が強く無機質なため、LV/Gucci 系のラグジュアリーな見た目にリデザインする。CSS のみの変更で HTML/JS には一切触れない。

## Investigation Results（調査結果サマリ）

- `demo/web/styles.css`:644行。DM Sans + Cormorant Garamond。ネイビー `#06162c` + ゴールド `#b08a55` の配色。
- `demo/web/index.html`:153行。2ステップフォーム（Customer Info → Staff Review）。
- `demo/web/app.js`:261行。フォーム送信ロジック。CSS 変更の影響なし。
- `demo/web/sw.js`: キャッシュバージョン `ledger-v7`。

## Design Decisions（設計判断）

- **案 A（採用）**: CSS 全面書き換え。HTML/JS に触れずリスク最小。
- 却下: 案 B（テーマレイヤー追加）は specificity 管理が煩雑。案 C（HTML+CSS）は変更範囲過大。
- モノグラムパターンは CSS `background-image` + linear-gradient で実現（SVG 不要）。

## Implementation Tasks（実装タスク一覧）

### Task 1: CSS 全面リデザイン
- **ファイル**: `demo/web/styles.css`（既存修正）
- **内容**:
  - カラートークンをクリーム+ゴールド系に更新
  - body::before で幾何学モノグラム透かしパターン追加
  - Hero ヘッダーにゴールドアクセント強化
  - フォームカード・入力欄をゴールドボーダーに
  - ボタンをゴールドグラデーション+シマーエフェクトに
  - ステッパーをゴールド系に
  - 派生情報ボックスをゴールド系に
- **impacted_paths**: `demo/web/styles.css`

### Task 2: Service Worker キャッシュ bump
- **ファイル**: `demo/web/sw.js`（既存修正）
- **内容**: キャッシュバージョンを `ledger-v7` → `ledger-v8` に更新
- **impacted_paths**: `demo/web/sw.js`

## Verification（検証方法）

1. ブラウザで `demo/web/index.html` を開く
2. モノグラム透かしパターンが背景に表示されることを確認
3. 入力欄にゴールドボーダーとフォーカスリングがあることを確認
4. ボタンがゴールドグラデーション+hover シマーであることを確認
5. Hero ヘッダーにゴールドアクセントがあることを確認
6. モバイルビューポートでレスポンシブ動作を確認
7. フォーム送信が正常に動作することを確認

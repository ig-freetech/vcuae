# Apps Script 最小セットアップガイド

このファイルは、非エンジニア向けに「動かすために必要な最小手順」のみを記載しています。

## 1. Code.gs を貼り付ける

1. [script.google.com](https://script.google.com) を開く
2. 「新しいプロジェクト」を作成
3. 既存の `Code.gs` を全削除し、このリポジトリの `demo/apps-script/Code.gs` を貼り付けて保存

## 2. Script Properties を設定する

Apps Script 画面の「プロジェクトの設定」→「スクリプト プロパティ」で次を追加:

- `SELF_GENERATED_TOKEN`（任意の長い文字列）
- `ADMIN_PASSCODE`（管理画面解錠用の任意文字列）

## 3. Web App としてデプロイする

1. 「デプロイ」→「新しいデプロイ」→ 種類「ウェブアプリ」
2. 次の設定でデプロイ:
   - **次のユーザーとして実行**: `自分`（推奨）
   - **アクセスできるユーザー**: `全員`
3. 表示された **Web App URL** を控える

### なぜ「自分」を推奨するか

`ウェブアプリケーションにアクセスしているユーザー` を選ぶと、利用者全員に Google ログインとシート権限が必要になります。店舗の共用タブレット運用では失敗しやすいため、このプロジェクトでは `自分` を推奨します。

## 4. 管理画面 `/admin` で初回認証する

1. `/admin` を開く
2. 初回 Unlock で次の3つを入力
   - `Web App URL`（控えた URL）
   - `Self-Generated Token`（`SELF_GENERATED_TOKEN`）
   - `ADMIN_PASSCODE`
3. Unlock 成功後、`Test Connection` → `Spreadsheet` 設定 → `Apply Spreadsheet`
4. 2回目以降の Unlock は `ADMIN_PASSCODE` のみ入力

### 今回の Web App URL（既に発行済み）

`https://script.google.com/macros/s/AKfycbzjLINqnJ_hWbk8vgL9iXEMpNEWwV1sdItO472Iij2pcL45rJUQT9T3a1QFx9XgSU_B/exec`

## よくあるエラー

- `CONFIG_ERROR: ADMIN_PASSCODE is not configured`
  - Script Properties に `ADMIN_PASSCODE` が未設定
- `AUTH_ERROR: Invalid self-generated token`
  - `/admin` で入力したトークンが `SELF_GENERATED_TOKEN` と不一致
- `AUTH_ERROR: Invalid admin passcode`
  - `/admin` で入力したパスコードが `ADMIN_PASSCODE` と不一致

## 更新時（コード変更後）

1. `Code.gs` を更新して保存
2. 「デプロイ」→「デプロイを管理」
3. 既存デプロイを編集して「新しいバージョン」で再デプロイ
4. URL は通常そのまま（変更なし）

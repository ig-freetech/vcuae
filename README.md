# 買取台帳 自動転記デモ

タブレット入力 → Google Apps Script → スプレッドシート自動追記のサーバーレスデモ。

## アーキテクチャ

```
[Tablet Web App] → POST JSON → [Apps Script Web App] → appendRow → [Google Spreadsheet]
```

- **Web App（PWA）**: タブレットのブラウザで動作する入力フォーム
- **Apps Script**: Google が提供するサーバーレス実行環境。Self-Generated Token 認証、バリデーション、派生フィールド計算を行い、スプレッドシートに 1 行追記する
- **Google Spreadsheet**: データの永続化先

## ディレクトリ構造

```
demo/
├── shared/          # 共通ロジック（バリデーション、派生計算）
│   └── ledger-core.js
├── web/             # ユーザー入力用 PWA（/web）
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   └── icons/
├── admin/           # 管理者設定用 PWA（/admin）
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   ├── sw.js
│   ├── manifest.webmanifest
│   └── icons/
├── apps-script/     # Google Apps Script
│   ├── Code.gs
│   └── README.md
├── scripts/         # デプロイ・セットアップスクリプト
│   ├── deploy-gas.sh
│   └── setup-gas-project.js
├── tests/           # 自動テスト
│   ├── fixtures.js
│   └── apps-script.test.js
└── README.md        # このファイル
```

## 最小セットアップ（非エンジニア向け）

### 1. 先に決める値（Apps Script Script Properties）

| プロパティ | 説明 | デフォルト |
|---|---|---|
| `SELF_GENERATED_TOKEN` | 自前生成の共有トークン | （必須） |
| `ADMIN_PASSCODE` | 管理画面の解錠用パスコード | （必須） |

### 2. Apps Script 側で設定する

1. Apps Script エディタで「プロジェクトの設定」→「スクリプト プロパティ」を開く  
2. `SELF_GENERATED_TOKEN` と `ADMIN_PASSCODE` を追加して保存する  
3. Web App としてデプロイすると URL が発行されるので控える

### 3. Web App デプロイ時の設定（重要）

- **次のユーザーとして実行**: `自分`（推奨）
- **アクセスできるユーザー**: `全員`

`次のユーザーとして実行` を `ウェブアプリケーションにアクセスしているユーザー` にすると、利用者ごとに Google ログインとスプレッドシート権限が必要になり、店舗運用では失敗しやすくなります。

### 4. 管理画面 `/admin` で初回認証する

1. 管理画面を開く  
2. 初回 Unlock で次の3つを入力  
   - `Web App URL`（控えた URL）
   - `Self-Generated Token`（`SELF_GENERATED_TOKEN` の値）
   - `ADMIN_PASSCODE`
3. Unlock 成功後、`Test Connection` → `Spreadsheet` 設定 → `Apply Spreadsheet`
4. 2回目以降は、保存済み URL/Token を使うため Unlock は `ADMIN_PASSCODE` のみ入力

### 5. 今回の Web App URL（貼り付け先）

下記 URL を **/admin の初回 Unlock（または Connection > Web App URL）** にそのまま貼り付けてください。

`https://script.google.com/macros/s/AKfycbzjLINqnJ_hWbk8vgL9iXEMpNEWwV1sdItO472Iij2pcL45rJUQT9T3a1QFx9XgSU_B/exec`

### 6. よくあるエラー

- `CONFIG_ERROR: ADMIN_PASSCODE is not configured`
  - 原因: Script Properties に `ADMIN_PASSCODE` が未設定
  - 対処: Apps Script 側で `ADMIN_PASSCODE` を追加して保存し、`/admin` で再実行

※ `SHEET_ID` と `SHEET_NAME` は管理画面（`/admin`）の Spreadsheet 設定ウィザードで自動保存されます。

## 詳細セットアップ（必要な場合のみ）

Apps Script のデプロイ・設定手順は [demo/apps-script/README.md](./demo/apps-script/README.md) を参照。

## ローカル実行（開発者向け）

1. `cd demo && npm run serve`
2. 管理画面 `http://localhost:3000/admin/` を開く
3. 上記「最小セットアップ」に沿って接続設定
4. ユーザー画面 `http://localhost:3000/web/` を開き、Customer Info → Staff Review → Submit

## テスト実行

```bash
# Apps Script エンドポイントのテスト
node demo/tests/apps-script.test.js
```

## E2E テスト

### 前提条件

- Node.js 18+
- `googleapis` npm パッケージ（`npm install googleapis`）
- Google アカウントで `clasp login` 済み

### 初回セットアップ

```bash
cd demo
npm install
npx clasp login --no-localhost   # URL を開いて認証→コードを入力
npm run deploy:gas               # GAS デプロイ→.env出力
```

### テスト実行

```bash
npm run test:e2e                 # Full E2E（スプレッドシート検証込み）
npm run test:e2e:mock            # Mock モード（Google 認証不要）
npm run test:unit                # Unit テスト（122件）
```

### Mock モード

`MOCK_MODE=true` で実行すると、GAS への送信をモックし、UI検証のみを行います。
Google 認証なしで CI でも実行できます。

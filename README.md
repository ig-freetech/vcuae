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
├── web/             # タブレット向け PWA
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

## ローカル実行

1. `demo/web/index.html` をブラウザで開く（または `cd demo && npm run serve`）
2. Connection Settings で Web App URL と Self-Generated Token を入力 → Test Connection
3. Spreadsheet URL を入力 → Load Sheets → シート選択 → Apply Spreadsheet
4. Column Mapping で全列 ✓ を確認
5. Customer Info 入力 → Staff Review → Submit to Spreadsheet

## テスト実行

```bash
# Apps Script エンドポイントのテスト
node demo/tests/apps-script.test.js
```

## 環境変数（Apps Script Script Properties）

| プロパティ | 説明 | デフォルト |
|---|---|---|
| `SELF_GENERATED_TOKEN` | 自前生成の共有トークン | （必須） |

※ `SHEET_ID` と `SHEET_NAME` はアプリの Spreadsheet 設定ウィザードで自動的に Script Properties に保存されます。

## 詳細セットアップ

Apps Script のデプロイ・設定手順は [demo/apps-script/README.md](./apps-script/README.md) を参照。

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

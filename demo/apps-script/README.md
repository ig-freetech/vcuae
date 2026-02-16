# Apps Script セットアップガイド

買取台帳の自動転記用 Google Apps Script Web App のデプロイ手順。

## 前提条件

- Google アカウント
- Google スプレッドシート（列順: VisitDate, CsCategory, CustomerName, Gender, Birthday, Age, MobileNumber, Email, Address, REF, PaymentMethod, Country, CountryJP, Continent大陸, Subregion小地域, 誕生月, 総買取額, 総合計）

## セットアップ手順

### 1. Apps Script プロジェクト作成

1. [Google Drive](https://drive.google.com) で「新規」→「その他」→「Google Apps Script」を選択
2. プロジェクト名を「買取台帳 自動転記」等に変更
3. デフォルトの `Code.gs` の内容を全て削除し、本リポジトリの `Code.gs` の内容を貼り付け
4. 保存（Ctrl+S / Cmd+S）

### 2. Script Properties 設定

1. 左メニューの歯車アイコン「プロジェクトの設定」を開く
2. 下部の「スクリプト プロパティ」セクションで以下を追加:

| プロパティ名 | 値 | 説明 |
|---|---|---|
| `API_KEY` | 任意の文字列 | API 認証キー。クライアント（Web App）と同じ値を設定する |
| `SHEET_ID` | スプレッドシートの ID | URL の `/d/` と `/edit` の間の文字列 |
| `SHEET_NAME` | シート名 | デフォルト: `Sheet1`（省略可） |

**スプレッドシート ID の確認方法:**

スプレッドシートの URL が `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit` の場合、ID は `1aBcDeFgHiJkLmNoPqRsTuVwXyZ` の部分。

### 3. Web App デプロイ

1. 「デプロイ」→「新しいデプロイ」をクリック
2. 「種類を選択」→ 歯車アイコンから「ウェブアプリ」を選択
3. 以下を設定:
   - **説明**: 任意（例: 「v1 - 初回デプロイ」）
   - **次のユーザーとして実行**: 「自分」
   - **アクセスできるユーザー**: 「全員」
4. 「デプロイ」をクリック
5. 「アクセスを承認」→ Google アカウントで認証
6. 表示される **Web App URL** をコピーして控える

### 4. 動作確認

curl でテスト送信:

```bash
curl -L -X POST \
  'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec' \
  -H 'Content-Type: application/json' \
  -d '{
    "apiKey": "YOUR_API_KEY",
    "data": {
      "visitDate": "2026-01-15",
      "csCategory": "Sales (販売)",
      "customerName": "テスト太郎",
      "gender": "Male",
      "birthday": "1990-05-15",
      "mobileNumber": "+971501234567",
      "email": "test@example.com",
      "address": "Dubai Marina, Tower 5",
      "ref": "REF-TEST",
      "paymentMethod": "Cash",
      "country": "UAE",
      "totalPurchase": 10000,
      "grandTotal": 11000
    }
  }'
```

成功時のレスポンス:

```json
{"status":"success","message":"Row appended successfully"}
```

## トラブルシューティング

| 症状 | 原因 | 対処 |
|------|------|------|
| `AUTH_ERROR: Invalid API key` | API_KEY が一致していない | Script Properties の `API_KEY` とクライアント設定を確認 |
| `VALIDATION_ERROR` | 必須フィールドが不足 | エラーレスポンスの `errors` 配列で不足フィールドを確認 |
| `SERVER_ERROR` | スプレッドシートへの書き込み失敗 | `SHEET_ID` と `SHEET_NAME` を確認。シートの列構成が正しいか確認 |
| 403 / 権限エラー | デプロイ設定が不正 | 「アクセスできるユーザー」を「全員」に設定しているか確認 |
| リダイレクトで結果が取れない | `-L` フラグ未指定 | curl に `-L`（リダイレクトに追従）を付ける |

## 更新デプロイ

コードを変更した場合:

1. Code.gs を更新して保存
2. 「デプロイ」→「デプロイを管理」
3. 鉛筆アイコン（編集）→「バージョン」を「新しいバージョン」に変更
4. 「デプロイ」をクリック

URL は変更されない。

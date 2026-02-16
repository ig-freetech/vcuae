## Why

店舗では紙の買取台帳に記入した内容を、スタッフが Google スプレッドシートへ手作業で転記しており、入力遅延と転記ミスが発生している。タブレットでの直接入力と自動転記を導入し、無料かつサーバーレスで業務フローを短期間に検証できるデモを作る必要がある。

## What Changes

- タブレット向け 2 ステップ Web 入力フォーム（顧客入力 + スタッフ確認）を追加する。
- フォーム送信時に Google Apps Script Web App へ JSON を POST し、スプレッドシートへ 1 行追記する。
- `Age`、`誕生月`、`CountryJP`、`Continent大陸`、`Subregion小地域` を自動計算/補完する共通ロジックを追加する。
- 入力バリデーション、二重送信防止、最小限の API キー照合を追加する。
- セットアップ/デプロイ/検証手順をドキュメント化し、デモ実施までの運用手順を定義する。

## Capabilities

### New Capabilities
- `purchase-ledger-demo`: タブレット入力、派生項目計算、Apps Script 経由のシート追記までを提供するサーバーレス買取台帳デモ機能。

### Modified Capabilities
- (none)

## Impact

- Affected code:
  - `demo/web/*`（PWA 画面、入力フロー、送信処理）
  - `demo/shared/*`（入力正規化、派生計算、行マッピング）
  - `demo/apps-script/*`（`doPost` エンドポイント、検証、append）
- APIs:
  - Google Apps Script Web App の `POST` エンドポイント（JSON I/O）
- Dependencies:
  - Google スプレッドシート
  - Google Apps Script
- Operational impact:
  - 紙台帳からの手転記作業をデモ範囲で代替

## Session Handoff Context

### Original User Prompt (Verbatim)

```text
現在、中古品販売を事業として行っているクライアントが、下記の買取台帳の画像のように紙で必要事項を入力してもらってからGoogleスプレッドシートに手で転記しているのですが、これを自動化できるだけのアプリをデモとしてクライアントに納品しようと思っています。
デモで、最悪無料で提供しようと思っているので、クラウドサーバーは持ちたくないです。
恐らくクライアントのタブレットを使ってお客さんに入力してもらうと思うので、タブレットで動く形が良いです。Webアプリにするのが良いでしょうか？
ブレストしながらアーキテクチャから一緒に考えましょう。

スプレッドシートのカラムはVisitDate, CsCategory, CustomerName, Gender, Birthday, Age, MobileNumber, Email, Address, REF, PaymentMethod, Country, CountryJP, Continent大陸, Subregion小地域, 誕生月, 総買取額, 総合計となっています。

# 買取台帳
- '/Users/ig/Downloads/買取台帳(紙ベース)1.pdf'
- '/Users/ig/Downloads/買取台帳(紙ベース)2.pdf'
- '/Users/ig/Downloads/買取台帳(紙ベース)3.pdf'

# 実際の買取台帳から転記されたGoogleスプレッドシートの例
- /Users/ig/Downloads/顧客管理リストシート(Spreadsheet).jpg

https://docs.google.com/spreadsheets/d/1edJZ0P2zTt3unQaSdACMk5xkw8hgfTwa7uvVisY0J1Y/edit?usp=sharing
```

### Brainstorm Outcomes (Finalized Decisions)

- Primary input mode: タブレット直接入力（紙OCRは今回スコープ外）
- Connectivity: 常時オンライン前提
- Sheet integration: Google Apps Script Web App を中継APIとして利用
- Input responsibility: 顧客 + スタッフ分担（2ステップ）
- Derived fields: `Age`, `誕生月`, `CountryJP`, `Continent大陸`, `Subregion小地域` は自動計算/補完
- KYC scope: 本人確認書類（ID写真）の撮影・保存は今回含めない
- Delivery goal: 無料運用可能なサーバーレスデモ（Webアプリ + Apps Script + Google Sheets）

### Restart Notes for Future Sessions

- OpenSpec change ID: `tablet-ledger-demo-automation`
- Artifact completion: `proposal/design/specs/tasks` は作成済み、`openspec validate` で有効
- Next execution entrypoint: `openspec/changes/tablet-ledger-demo-automation/tasks.md` の未完了タスクを順に `apply` する

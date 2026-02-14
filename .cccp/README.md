# .cccp Layout

アプリケーション側タスクの運用データのうち、`plans` / `logs` を `.claude/` から分離して保持するためのディレクトリ。

- `.cccp/plans/`: アプリ側 plan ファイル
- `.cccp/logs/reviews/`: アプリ側完了レビュー成果物

アプリ側の `beads` / `OpenSpec` はリポジトリルート直下を使用する:
- `.beads/`: アプリ側 beads ストア
- `openspec/`: アプリ側 OpenSpec 仕様/変更

CCCP インフラ（`cccp-agents-*`）は引き続き `.claude/*` を使用する。

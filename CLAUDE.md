# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code 向けのガイドです。

## プロジェクト概要

レシート読み込み家計簿Webアプリ（kakeibo-app）。レシート画像を Claude API で読み取り、商品をカテゴリ別に自動分類して、月別・カテゴリ別に集計・グラフ表示する。

### 技術スタック

- フロントエンド: React + Vite、グラフは Chart.js（react-chartjs-2）
- バックエンド: Node.js + Express（`server/`）
- AI: Claude API（`@anthropic-ai/sdk`）、モデルは `claude-haiku-4-5`
- データ保存: ブラウザのローカルストレージ（サーバー側にDBはない）

### コマンド

```bash
npm install     # 依存パッケージのインストール
npm run dev     # 開発サーバー起動（フロント: http://localhost:5173 / API: 3001）
npm run build   # フロントエンドのビルド（dist/）
npm start       # ビルドしてサーバー起動（http://localhost:3001）
```

### 構成

- `server/index.js` … Express サーバー。`POST /api/receipt` で画像を受け取る
- `server/receipt.js` … Claude API 呼び出し（構造化出力で店名・日付・商品を取得）
- `src/categories.js` … カテゴリ一覧と色。フロントとサーバーの両方で使う
- `src/storage.js` … ローカルストレージの読み書き
- `src/summary.js` … 集計処理
- `src/components/` … 画面部品（アップロード、一覧、グラフ）

### 守るべき方針

- Claude API はバックエンドからだけ呼ぶ。ブラウザ側のコードで API キーを扱わない。
- API キーは `.env` の `ANTHROPIC_API_KEY` で管理する（`.env.example` を参照）。`.env` はコミットしない。
- コメントは日本語で書く。

## 作業範囲

- このフォルダ（kakeibo-app）の中だけで作業する。
- 親フォルダや同じ階層にある他のプロジェクトのファイルは参照しない。

## コミュニケーション

- ユーザーへの返答、コード内コメント、コミットメッセージは日本語で書く。

## Git 運用ルール

### 基本方針

- **コードを変更するたびに、コミットして GitHub にプッシュする。**
  - 1つの作業（機能追加・修正・リファクタリングなど）が終わったら、その都度 `git add` → `git commit` → `git push` まで行う。
  - 変更をローカルに溜めたまま作業を終えない。
- **コミットする前に、必ずユーザーに確認を取る。**
  - 変更したファイル、変更内容の要約、コミットメッセージ案を示し、「コミットしてプッシュしてよいか」を尋ねる。
  - ユーザーの了承を得てから `git commit` と `git push` を行う。了承がなければコミットしない。

### 手順

```bash
git status                  # 変更内容を確認
git add <変更したファイル>    # 関係するファイルだけをステージする
git commit -m "<メッセージ>"
git push
```

- `git add -A` / `git add .` は、意図しないファイル（秘密情報や生成物など）が含まれないことを確認してから使う。
- プッシュが失敗した場合（リモートに新しいコミットがあるなど）は、`git pull --rebase` で取り込んでから再度プッシュする。`--force` での上書きはユーザーの許可なく行わない。

### コミットメッセージ

- 日本語で、何を・なぜ変更したかが分かるように書く。
- 1行目は要約（50文字程度まで）、必要に応じて空行のあとに詳細を書く。
- 例:
  - `支出入力フォームにカテゴリ選択を追加`
  - `月別集計で翌月分が混ざる不具合を修正`

### コミットしないもの

- パスワード・APIキー・`.env` などの秘密情報
- `node_modules/` などの依存パッケージや、ビルド成果物
- これらは `.gitignore` に登録しておく。

### リポジトリ情報

- リモート: https://github.com/takagawa-glitch/kakeibo-app.git（`origin`）
- メインブランチ: `main`
- Box 上のフォルダのため、Git の `safe.directory` にこのフォルダを登録済み。

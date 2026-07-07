# Chinese Trainer

個人用の中国語学習Webアプリです。聞き流し・瞬発練習・SRS復習・長文リーディングを中心に、仕事で使える中国語(化学・貿易・営業)を毎日鍛えることを目的としています。

- サーバー不要・ブラウザ完結(データはIndexedDBに保存)
- 中国語音声はWeb Speech API(`zh-CN`優先、最大2.0倍速)
- ピンイン(声調記号付き)を自動生成
- PWA対応(スマホのホーム画面に追加可能)

## セットアップ

```bash
npm install
```

## 起動方法

```bash
# 開発サーバー
npm run dev

# 本番ビルド
npm run build

# ビルド結果のプレビュー
npm run preview
```

ブラウザで `http://localhost:5173` を開きます。

## GitHub Pagesでの公開(スマホからのアクセスにおすすめ)

- **公開URL**: https://aubeworks.github.io/chinese-trainer/
- HTTPSで配信されるため、スマホの「ホーム画面に追加」(PWA)やオフライン利用も有効になります

### 更新方法(公開サイトへの反映)

```bash
npm run deploy
```

このコマンド1つで、Pages用ビルド(`base=/chinese-trainer/`)を作成し、`gh-pages` ブランチへpushして公開されます(反映まで1〜2分)。

ソースコード自体の保存は通常どおり `git push`(mainブランチ)で行ってください。

### 公開状況の確認方法

- 公開URLをブラウザで開いて確認(反映まで1〜2分かかります)
- リポジトリの **Settings → Pages** に公開URLと状態が表示されます
- リポジトリの **Actionsタブ** の「pages build and deployment」が緑(✓)になれば反映完了

### mainへのpushだけで自動デプロイしたい場合(推奨・1回だけの設定)

GitHub Actionsによる自動デプロイのワークフローは [docs/deploy-workflow.yml](docs/deploy-workflow.yml) に用意済みです。
現在のGit認証トークン(PAT)に `workflow` スコープがないためリポジトリへ配置できていません。以下の手順で有効化できます。

1. https://github.com/settings/tokens で使用中のPATに **workflow** スコープを追加(または新規発行してGit認証を更新)
2. ワークフローを配置してpush:
   ```bash
   mkdir -p .github/workflows
   git mv docs/deploy-workflow.yml .github/workflows/deploy.yml
   git commit -m "Enable GitHub Actions deploy"
   git push
   ```
3. リポジトリの **Settings → Pages → Source** を **「GitHub Actions」** に変更

以後は `git push`(main)だけで自動的に公開されます。

### 仕組み

- Pages用ビルドでは環境変数 `GHPAGES=true` により Vite の `base` が `/chinese-trainer/` になります(ローカルは従来どおり)
- 手動デプロイは [scripts/deploy.mjs](scripts/deploy.mjs) が `dist/` を `gh-pages` ブランチへforce pushします

> **注意**: GitHub Pages(無料プラン)を使うため、このリポジトリは**公開(public)**になっています。

> 音声再生はブラウザのWeb Speech APIを使用します。Windows/Edge/Chrome、iOS Safari、Androidで中国語音声が利用できます。OSに中国語音声がない場合は、OSの設定から音声(zh-CN)を追加してください。

## 主な画面

| 画面 | 内容 |
| --- | --- |
| ホーム | 今日の学習件数・復習件数・ショートカット |
| 教材一覧 | 検索・絞り込み(パック/カテゴリ/種類/難易度/苦手/お気に入り/SRS) |
| 教材編集 | 中国語・日本語・ピンイン(自動生成+手修正)・タグ・メモなど |
| 教材パック | パックの作成・編集・有効/無効・インポート/エクスポート |
| プレイリスト | 教材を自由に組み合わせた固定リスト |
| 学習キュー | 「今日だけ学習する」一時リスト(プレイリスト化可能) |
| 聞き流し | 連続再生。速度0.8〜2.0倍、再生モード(中→日→中 / 中のみ / 3回 / 高速) |
| 瞬発練習 | 日本語→中国語の即答練習。制限時間後に答え+音声+SRS評価 |
| 長文 | 段落・文単位の表示と再生 |
| RSS | 中国語ニュースの取得・読み上げ・教材保存 |
| 貼り付け読み上げ | メール等を貼り付けて読み上げ・ピンイン生成・教材保存 |
| 教材生成プロンプト | ChatGPT/Claude用の教材生成プロンプトを作成・コピー |
| SRS復習 | 今日の復習予定・苦手・今日追加・今日学習済み |
| 学習履歴 | 日別の学習件数と累計 |
| 設定 | テーマ・音声・速度・RSSプロキシ・データ統計・バックアップ/復元/初期化 |

## 教材の追加方法

### 0. 内蔵教材ライブラリ(いちばん手軽)

「教材パック」画面の **内蔵教材ライブラリ** から、約270件の教材(化学・材料/貿易・物流/営業・商談/価格交渉・納期・品質/電話・メール/日常会話/つなぎ表現/長文)をワンクリックで追加できます。「すべて追加」でまとめて追加も可能です。追加済みの教材は重複としてスキップされるので、何度押しても安全です。

### 1. AIで生成してインポート(推奨)

1. アプリの「教材生成プロンプト」画面で条件を選び、プロンプトをコピー
2. ChatGPTやClaudeに貼り付けてJSONを生成させる
3. 「教材パック」画面にJSONファイルをドラッグ&ドロップ(またはファイル選択)

インポート後は **追加件数 / 重複件数 / スキップ件数 / エラー件数** が表示されます。
既存と同じID、または同一パック内に同じ中国語がある教材は「重複」として追加されません(既存データが優先されます)。

### 2. 手入力

「教材一覧」→「+ 新規教材」から入力します。ピンインは自動生成後に手修正できます。

### 3. 貼り付け・RSS

「貼り付け読み上げ」「RSS」画面から、その場のテキストを教材として保存できます。

## JSON形式

教材パック単位の標準形式です(詳細は [docs/json-format.md](docs/json-format.md))。

```json
{
  "version": 1,
  "pack": {
    "name": "営業フレーズ",
    "description": "",
    "icon": "💼",
    "color": "#b45309"
  },
  "items": [
    {
      "type": "sentence",
      "category": "営業",
      "subcategory": "価格交渉",
      "tags": ["値上げ"],
      "difficulty": 3,
      "zh": "由于原材料价格上涨,我们不得不调整报价。",
      "pinyin": "",
      "ja": "原材料価格の高騰により、見積価格を調整せざるを得ません。",
      "memo": ""
    }
  ]
}
```

- `pinyin` が空の場合は自動生成されます
- `id` や日時は省略可能(自動採番)
- 未知の項目は破棄されず保持されます(将来互換)

サンプル: [sample-data/sample-pack.json](sample-data/sample-pack.json)

## CSV形式

ヘッダー行つきCSVをインポートできます。

```csv
category,type,zh,ja,pinyin,memo,difficulty,tags
営業,sentence,这个价格已经是我们的底线了。,この価格はすでに当社の限界です。,,価格交渉で使う,3,価格交渉
```

- `type` は `word` / `sentence` / `article`
- `tags` は `;` 区切り
- サンプル: [sample-data/sample-items.csv](sample-data/sample-items.csv)

## プレイリストと学習キュー

- **プレイリスト**: 長期間使う固定リスト(例: 通勤、苦手だけ、価格交渉)。聞き流し・瞬発で再生できます。
- **学習キュー**: 「今日だけ」の一時リスト。教材一覧・SRS・RSSなどの「➕」ボタンで追加し、学習後に全削除・学習済みのみ削除ができます。キューはワンクリックでプレイリスト化できます。

## SRS(簡易間隔反復)

瞬発練習の回答後に3択で評価します。

| 評価 | 次回復習 |
| --- | --- |
| まだ苦手 | 翌日(苦手フラグON) |
| 普通 | 3〜7日後 |
| 覚えた | 習得済み(14日後に再確認) |

「SRS復習」画面に今日の復習予定だけが表示されます。

## PWA

本番ビルドをHTTPSで配信(またはlocalhostで表示)すると、スマホの「ホーム画面に追加」でアプリのように使えます。保存済み教材の閲覧・再生・学習はオフラインでも動作します(RSS取得はネット接続が必要)。

## バックアップ

設定画面の「全データバックアップ」でJSONを書き出せます。端末やブラウザを変えるときは、このJSONを「バックアップから復元」で読み込んでください。

- 設定画面に **最終バックアップ日時** が表示されます(未実施の場合は「未実施」)
- 設定画面の **データ統計** で教材数・パック数・プレイリスト数・学習キュー件数・お気に入り件数・苦手件数をリアルタイムに確認できます

## 今後の拡張方法

データ層(`src/services`)・型(`src/types`)・UI(`src/pages`)を分離しているため、以下の拡張がしやすい構成です。

- AI API連携(教材自動生成)
- MP3/AI音声への置き換え(`src/services/speech.ts` を差し替え)
- クラウド同期(`src/services/storage.ts` にリモートバックエンド追加)
- Anki Import/Export(`src/services/importExport.ts` に変換追加)

詳細は [docs/roadmap.md](docs/roadmap.md) を参照してください。

## ドキュメント

- [docs/architecture.md](docs/architecture.md) — 設計・フォルダ構成
- [docs/json-format.md](docs/json-format.md) — JSON/CSV仕様
- [docs/roadmap.md](docs/roadmap.md) — 今後の拡張計画
- [SPEC.md](SPEC.md) — 正式仕様書

## ライセンス

個人利用を目的としたプライベートプロジェクトです。

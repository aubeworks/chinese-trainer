# アーキテクチャ

## 全体構成

Chinese Trainerはフロントエンド完結型のSPAです。サーバー・外部APIなしで動作し、データはブラウザのIndexedDBに保存されます。

```
ブラウザ
├── React UI (src/pages, src/components)
├── 状態管理 (src/store/AppContext.tsx)  … 全データをメモリに保持し、変更のたびに永続化
├── サービス層 (src/services)
│   ├── storage.ts       IndexedDB (idb) / localStorageフォールバック
│   ├── speech.ts        Web Speech API ラッパー
│   ├── pinyin.ts        pinyin-pro によるピンイン生成
│   ├── srs.ts           簡易SRSロジック
│   ├── importExport.ts  JSON/CSV インポート・エクスポート・正規化
│   └── rss.ts           RSS取得・解析(テキスト化)
└── IndexedDB (packs / items / playlists / history / kv)
```

## 技術スタック

| 領域 | 採用技術 | 理由 |
| --- | --- | --- |
| ビルド | Vite 8 | 標準的・高速 |
| UI | React 19 + TypeScript | 広い利用実績 |
| ルーティング | react-router-dom 7 (HashRouter) | 静的ホスティングでもリロード404が起きない |
| 保存 | idb (IndexedDB) | 数万件までスケール。失敗時はlocalStorageへ自動切替 |
| ピンイン | pinyin-pro | 声調記号/数字四声の両対応・高精度 |
| CSV | papaparse | CSV解析のデファクト |
| PWA | vite-plugin-pwa | manifest/service worker自動生成 |
| 音声 | Web Speech API | 外部API不要。zh-CN優先で音声選択可能 |

## フォルダ構成

```
src/
├── components/   共通UI(Layout, ItemCard, SpeedSelector, VoiceSelector, EmptyState)
├── pages/        画面(15画面)
├── hooks/        usePlayer(連続再生エンジン), useVoices, useSourceItems
├── services/     データ・音声・変換ロジック(UIから分離)
├── store/        AppContext(全体状態+永続化)
├── types/        型定義と定数
├── utils/        汎用ユーティリティ
├── data/         サンプル教材(初回起動時に投入)
└── styles/       グローバルCSS(ライト/ダークをCSS変数で切替)
```

## データフロー

1. 起動時に `AppContext` が `storage.loadAll()` で全データを読み込む
   - 失敗しても空の初期状態で起動(可用性要件)
   - 初回起動時はサンプル教材を投入
2. UIは `useApp()` フックで状態とアクションを取得
3. アクション(追加・更新・削除)はメモリ状態を更新し、同時にIndexedDBへ書き込む
4. 設定・学習キューは `kv` ストアにキー単位で保存

## 再生エンジン(usePlayer)

聞き流しの中核。`items / mode / rate / voiceURI / shuffle / repeat` を受け取り、
キャンセルトークン方式で「再生 → 完了待ち → 次へ」の非同期ループを回します。

- 再生モード: 中→日→中 / 中国語のみ / 中国語3回 / 高速(2.0倍固定)
- 停止・スキップ時はトークンを進めて `speechSynthesis.cancel()`
- 1教材完了ごとに `onItemPlayed` で学習履歴へ記録

## 再生対象の指定(useSourceItems)

聞き流し・瞬発はURLクエリ `?src=` で対象を切り替えます。

| src | 対象 |
| --- | --- |
| `all`(既定) | 有効なパックの全教材 |
| `queue` | 学習キュー |
| `srs` | 今日のSRS復習予定 |
| `weak` / `favorite` | 苦手 / お気に入り |
| `playlist:<id>` | プレイリスト |
| `pack:<id>` | 教材パック |

## エラー処理方針

- 音声不可 → 画面に表示、アプリは継続
- IndexedDB不可 → localStorageへ自動切替
- インポート失敗 → 理由を表示、既存データは変更しない
- RSS失敗 → エラー表示のみ、他機能へ影響なし

## セキュリティ

RSS・貼り付けテキストはすべてプレーンテキストとして扱い、HTMLを実行しません
(`htmlToText()` でDOMParser経由のテキスト抽出のみ)。

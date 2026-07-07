# JSON / CSV フォーマット仕様

## 基本方針

- 内部標準はJSON。`version` を持ち、バージョンが違っても可能な限り読み込む
- 未知の項目は破棄せず、そのまま保持する(将来互換)
- インポート失敗時は既存データを変更しない

## 教材パックJSON(標準形式)

```json
{
  "version": 1,
  "pack": {
    "id": "chemistry",
    "version": 1,
    "name": "化学・貿易用語",
    "description": "説明文",
    "icon": "🧪",
    "color": "#0e7490",
    "enabled": true,
    "createdAt": "2026-07-07T00:00:00.000Z",
    "updatedAt": "2026-07-07T00:00:00.000Z"
  },
  "items": [ { "...": "教材(下記)" } ]
}
```

`pack` の各項目は省略可能です。省略時はファイル名などから自動補完されます。

## 教材(item)

```json
{
  "id": "word-000001",
  "version": 1,
  "packId": "chemistry",
  "category": "化学",
  "subcategory": "銅箔",
  "tags": ["銅箔", "Kingboard"],
  "type": "word",
  "difficulty": 2,
  "zh": "铜箔",
  "ja": "銅箔",
  "pinyin": "tóng bó",
  "memo": "",
  "favorite": false,
  "weak": false,
  "srsStatus": "new",
  "nextReviewAt": null,
  "reviewCount": 0,
  "source": "ChatGPT",
  "author": "ChatGPT",
  "createdAt": "",
  "updatedAt": ""
}
```

### 必須項目

- `zh`(中国語)のみ必須。他はすべて省略可能

### 自動補完ルール

| 項目 | 省略時の値 |
| --- | --- |
| `id` | 自動採番 |
| `type` | `sentence`(`word`/`sentence`/`article` 以外も同様) |
| `difficulty` | `2`(1〜5に丸め) |
| `pinyin` | `zh` から自動生成(声調記号付き) |
| `category` | `その他` |
| `srsStatus` | `new` |
| `tags` | `[]`(文字列の場合は `;` `|` `、` `,` `/` で分割) |
| `createdAt` / `updatedAt` | インポート時刻 |

### 受け付けるJSONのバリエーション

1. `{ "version": 1, "pack": {...}, "items": [...] }` — 標準形式
2. `[ {...}, {...} ]` — 教材配列のみ(新規パックを自動作成)
3. `{ "items": [...] }` — packなし(新規パックを自動作成)
4. `{ "zh": "...", ... }` — 単一教材

## 全データバックアップJSON

設定画面から出力される形式です。

```json
{
  "version": 1,
  "exportedAt": "2026-07-07T00:00:00.000Z",
  "packs": [],
  "items": [],
  "playlists": [],
  "settings": {},
  "history": [],
  "queue": []
}
```

## CSV形式

ヘッダー行が必要です。列の順序は自由で、余分な列は未知項目として保持されます。

```csv
category,type,zh,ja,pinyin,memo,difficulty,tags
営業,sentence,请多关照。,よろしくお願いします。,,,1,挨拶
化学,word,催化剂,触媒,cuī huà jì,,3,化学;材料
```

| 列 | 内容 |
| --- | --- |
| `category` | 大分類(例: 営業、化学) |
| `type` | `word` / `sentence` / `article` |
| `zh` | 中国語本文(必須) |
| `ja` | 日本語訳 |
| `pinyin` | ピンイン(空欄で自動生成) |
| `memo` | メモ |
| `difficulty` | 1〜5 |
| `tags` | `;` 区切り |

CSVインポート時は、ファイル名を名前にした新規パックが作成されます。

## SRS状態の遷移

| 評価 | srsStatus | nextReviewAt |
| --- | --- | --- |
| まだ苦手 | `review` | 翌日(weak=true) |
| 普通 | `review` | 3〜7日後(復習回数で増加) |
| 覚えた | `mastered` | 14日後(weak=false) |

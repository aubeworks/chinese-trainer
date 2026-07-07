// 教材生成プロンプト画面
// ChatGPT / Claude に貼り付けて教材JSONやCSVを生成させるプロンプトを作る
import { useMemo, useState } from 'react'
import { copyText } from '../utils'
import { DIFFICULTY_LABELS, TYPE_LABELS, type ItemType } from '../types'

const CATEGORY_PRESETS = ['営業', '化学', '貿易', '価格交渉', '納期', '品質', '日常', 'ニュース', 'その他']

export default function PromptPage() {
  const [category, setCategory] = useState('営業')
  const [customCategory, setCustomCategory] = useState('')
  const [difficulty, setDifficulty] = useState(3)
  const [count, setCount] = useState(20)
  const [theme, setTheme] = useState('')
  const [type, setType] = useState<ItemType>('sentence')
  const [format, setFormat] = useState<'json' | 'csv'>('json')
  const [copied, setCopied] = useState(false)

  const effectiveCategory = customCategory.trim() || category

  const prompt = useMemo(() => {
    const typeLabel = TYPE_LABELS[type]
    const diffLabel = DIFFICULTY_LABELS[difficulty]
    const themeText = theme.trim() ? `テーマ: ${theme.trim()}\n` : ''

    const common = `あなたは中国語教材の作成者です。以下の条件で中国語学習教材を${count}件作成してください。

条件:
- カテゴリ: ${effectiveCategory}
${themeText}- 教材種類: ${typeLabel}(${type})
- 難易度: ${difficulty}(${diffLabel})
- 対象: 日本語母語話者(日常会話レベルの中国語力)
- 中国語は簡体字。自然でネイティブが実際に使う表現にすること
- ピンインは声調記号付き(例: Wǒmen xūyào quèrèn.)
- 日本語訳は自然な日本語にすること
${type === 'article' ? '- 長文は3〜5段落。段落は改行(\\n)で区切ること\n' : ''}`

    if (format === 'json') {
      return `${common}
出力形式:
以下のJSON形式のみを出力してください。コードブロックの外に文章を書かないでください。

{
  "version": 1,
  "pack": {
    "id": "${effectiveCategory.toLowerCase().replace(/\s/g, '-')}-pack",
    "name": "${effectiveCategory}${theme.trim() ? `(${theme.trim()})` : ''}",
    "description": "AIが生成した${effectiveCategory}の教材",
    "icon": "📦",
    "color": "#b91c1c"
  },
  "items": [
    {
      "type": "${type}",
      "category": "${effectiveCategory}",
      "subcategory": "サブカテゴリ",
      "tags": ["タグ1", "タグ2"],
      "difficulty": ${difficulty},
      "zh": "中国語本文",
      "pinyin": "声調記号付きピンイン",
      "ja": "日本語訳",
      "memo": "使い方の補足(任意)",
      "source": "AI生成",
      "author": "AI"
    }
  ]
}

このJSONをChinese Trainerアプリの「教材パック」画面でインポートします。`
    }

    return `${common}
出力形式:
以下のヘッダーを持つCSV形式のみを出力してください。コードブロックの外に文章を書かないでください。
値にカンマが含まれる場合はダブルクォートで囲んでください。tagsは ; 区切りです。

category,type,zh,ja,pinyin,memo,difficulty,tags

このCSVをChinese Trainerアプリの「教材パック」画面でインポートします。`
  }, [effectiveCategory, difficulty, count, theme, type, format])

  const copy = async () => {
    if (await copyText(prompt)) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">教材生成プロンプト</h1>
      <p className="page-sub">
        ChatGPTやClaudeに貼り付けて教材を生成し、JSONを教材パック画面からインポートしてください。
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-field">
          <label>カテゴリ</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORY_PRESETS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>カテゴリ(自由入力・優先)</label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            placeholder="例: 半導体材料"
          />
        </div>
        <div className="form-field">
          <label>難易度</label>
          <select value={difficulty} onChange={(e) => setDifficulty(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((d) => (
              <option key={d} value={d}>
                {d} - {DIFFICULTY_LABELS[d]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>件数</label>
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[5, 10, 20, 30, 50].map((n) => (
              <option key={n} value={n}>
                {n}件
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>教材種類</label>
          <select value={type} onChange={(e) => setType(e.target.value as ItemType)}>
            {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>出力形式</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as 'json' | 'csv')}>
            <option value="json">JSON(推奨)</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </div>

      <div className="form-field">
        <label>テーマ(任意)</label>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder="例: 銅箔の値上げ交渉、輸出規制の説明"
        />
      </div>

      <div className="btn-row" style={{ marginBottom: 12 }}>
        <button type="button" className="btn btn-primary" onClick={() => void copy()}>
          {copied ? '✅ コピーしました' : '📋 プロンプトをコピー'}
        </button>
      </div>

      <textarea className="prompt-output" value={prompt} readOnly />
    </div>
  )
}

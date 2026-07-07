// 貼り付け読み上げ画面: 中国語テキストを貼り付けて読み上げ・ピンイン生成・教材保存
import { useState } from 'react'
import SpeedSelector from '../components/SpeedSelector'
import { useApp } from '../store/AppContext'
import { cancelSpeech, speakZh } from '../services/speech'
import { toPinyin } from '../services/pinyin'
import { splitSentences } from '../utils'

export default function PastePage() {
  const { settings, updateSettings, addItem, addToQueue, packs, addPack } = useApp()
  const [text, setText] = useState('')
  const [pinyinText, setPinyinText] = useState('')
  const [message, setMessage] = useState('')

  const generatePinyin = () => {
    setPinyinText(toPinyin(text))
  }

  const playAll = async () => {
    cancelSpeech()
    // 長文は文単位に分割して読み上げる(ブラウザの長文切れ対策)
    for (const s of splitSentences(text)) {
      await speakZh(s, settings.rate, settings.voiceURI)
    }
  }

  /** 貼り付けた文章を教材として保存 */
  const save = (alsoQueue: boolean) => {
    if (!text.trim()) return
    let pack = packs.find((p) => p.id === 'pack-paste')
    if (!pack) {
      pack = addPack({
        id: 'pack-paste',
        name: '貼り付け文章',
        description: '貼り付け読み上げから保存した教材',
        icon: '📝',
        color: '#15803d',
      })
    }
    const item = addItem({
      packId: pack.id,
      type: text.length > 60 ? 'article' : 'sentence',
      category: 'その他',
      zh: text,
      pinyin: pinyinText || toPinyin(text),
      source: '貼り付け',
      author: 'User',
    })
    if (alsoQueue) addToQueue([item.id])
    setMessage(alsoQueue ? '教材として保存し、学習キューへ追加しました' : '教材として保存しました')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="page">
      <h1 className="page-title">貼り付け読み上げ</h1>
      <p className="page-sub">取引先メール・資料・チャットなどの中国語を貼り付けて練習できます。</p>

      <div className="form-field">
        <label>中国語テキスト</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={7}
          placeholder="ここに中国語を貼り付けてください"
        />
      </div>

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-primary" onClick={() => void playAll()} disabled={!text.trim()}>
          🔊 読み上げ
        </button>
        <button type="button" className="btn" onClick={() => cancelSpeech()}>
          ⏹ 停止
        </button>
        <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
      </div>

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <button type="button" className="btn" onClick={generatePinyin} disabled={!text.trim()}>
          🔄 ピンイン生成
        </button>
        <button type="button" className="btn" onClick={() => save(false)} disabled={!text.trim()}>
          💾 教材保存
        </button>
        <button type="button" className="btn" onClick={() => save(true)} disabled={!text.trim()}>
          ➕ 保存してキューへ
        </button>
      </div>

      {message && <div className="info-box">{message}</div>}

      {pinyinText && (
        <div className="card">
          <div className="pinyin-text">{pinyinText}</div>
        </div>
      )}
    </div>
  )
}

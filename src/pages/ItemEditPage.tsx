// 教材編集画面(新規作成・編集・複製・削除)
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { toPinyin } from '../services/pinyin'
import { speakZh } from '../services/speech'
import { DIFFICULTY_LABELS, TYPE_LABELS, type ItemType, type SrsStatus, SRS_LABELS } from '../types'

export default function ItemEditPage() {
  const { id } = useParams()
  const isNew = id === 'new'
  const navigate = useNavigate()
  const { items, packs, addItem, updateItem, removeItem, addToQueue, settings } = useApp()
  const existing = items.find((i) => i.id === id)

  const [zh, setZh] = useState('')
  const [ja, setJa] = useState('')
  const [pinyinText, setPinyinText] = useState('')
  const [packId, setPackId] = useState('')
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [tags, setTags] = useState('')
  const [memo, setMemo] = useState('')
  const [type, setType] = useState<ItemType>('sentence')
  const [difficulty, setDifficulty] = useState(2)
  const [favorite, setFavorite] = useState(false)
  const [weak, setWeak] = useState(false)
  const [srsStatus, setSrsStatus] = useState<SrsStatus>('new')

  // 既存教材の読み込み
  useEffect(() => {
    if (existing) {
      setZh(existing.zh)
      setJa(existing.ja)
      setPinyinText(existing.pinyin)
      setPackId(existing.packId)
      setCategory(existing.category)
      setSubcategory(existing.subcategory)
      setTags(existing.tags.join(', '))
      setMemo(existing.memo)
      setType(existing.type)
      setDifficulty(existing.difficulty)
      setFavorite(existing.favorite)
      setWeak(existing.weak)
      setSrsStatus(existing.srsStatus)
    }
  }, [existing])

  if (!isNew && !existing) {
    return (
      <div className="page">
        <div className="error-box">教材が見つかりませんでした。</div>
      </div>
    )
  }

  const collect = () => ({
    zh,
    ja,
    pinyin: pinyinText,
    packId,
    category: category || 'その他',
    subcategory,
    tags: tags.split(/[,、]/).map((t) => t.trim()).filter(Boolean),
    memo,
    type,
    difficulty,
    favorite,
    weak,
    srsStatus,
  })

  const save = () => {
    if (!zh.trim()) {
      alert('中国語を入力してください')
      return
    }
    const data = collect()
    if (isNew) {
      addItem(data)
    } else if (existing) {
      updateItem(existing.id, data)
    }
    navigate(-1)
  }

  const duplicate = () => {
    const copy = addItem({ ...collect(), favorite: false, weak: false, srsStatus: 'new' })
    navigate(`/items/${copy.id}`, { replace: true })
  }

  const del = () => {
    if (existing && confirm('この教材を削除しますか?')) {
      removeItem(existing.id)
      navigate(-1)
    }
  }

  return (
    <div className="page">
      <h1 className="page-title">{isNew ? '新規教材' : '教材編集'}</h1>

      <div className="form-field">
        <label>中国語 *</label>
        <textarea value={zh} onChange={(e) => setZh(e.target.value)} rows={type === 'article' ? 6 : 2} />
      </div>

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <button type="button" className="btn btn-sm" onClick={() => setPinyinText(toPinyin(zh))} disabled={!zh.trim()}>
          🔄 ピンイン自動生成
        </button>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => void speakZh(zh, settings.rate, settings.voiceURI)}
          disabled={!zh.trim()}
        >
          🔊 再生
        </button>
      </div>

      <div className="form-field">
        <label>ピンイン(自動生成後に手修正できます)</label>
        <textarea value={pinyinText} onChange={(e) => setPinyinText(e.target.value)} rows={2} />
      </div>

      <div className="form-field">
        <label>日本語訳</label>
        <textarea value={ja} onChange={(e) => setJa(e.target.value)} rows={type === 'article' ? 6 : 2} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-field">
          <label>教材パック</label>
          <select value={packId} onChange={(e) => setPackId(e.target.value)}>
            <option value="">未所属</option>
            {packs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>種類</label>
          <select value={type} onChange={(e) => setType(e.target.value as ItemType)}>
            {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="form-field">
          <label>カテゴリ</label>
          <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="例: 営業" />
        </div>
        <div className="form-field">
          <label>サブカテゴリ</label>
          <input type="text" value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="例: 価格交渉" />
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
          <label>SRS状態</label>
          <select value={srsStatus} onChange={(e) => setSrsStatus(e.target.value as SrsStatus)}>
            {(Object.keys(SRS_LABELS) as SrsStatus[]).map((s) => (
              <option key={s} value={s}>
                {SRS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-field">
        <label>タグ(カンマ区切り)</label>
        <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="例: 銅箔, 値上げ" />
      </div>

      <div className="form-field">
        <label>メモ</label>
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={2} />
      </div>

      <div className="btn-row" style={{ marginBottom: 20 }}>
        <button
          type="button"
          className={`btn ${favorite ? 'active' : ''}`}
          onClick={() => setFavorite((v) => !v)}
        >
          ★ お気に入り
        </button>
        <button type="button" className={`btn ${weak ? 'active' : ''}`} onClick={() => setWeak((v) => !v)}>
          ⚠ 苦手
        </button>
        {existing && (
          <button type="button" className="btn" onClick={() => addToQueue([existing.id])}>
            ➕ 学習キューへ
          </button>
        )}
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-primary" onClick={save}>
          💾 保存
        </button>
        {!isNew && (
          <>
            <button type="button" className="btn" onClick={duplicate}>
              📄 複製
            </button>
            <button type="button" className="btn btn-danger" onClick={del}>
              🗑 削除
            </button>
          </>
        )}
        <button type="button" className="btn" onClick={() => navigate(-1)}>
          キャンセル
        </button>
      </div>
    </div>
  )
}

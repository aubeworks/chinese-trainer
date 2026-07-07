// 教材カード / リスト行の共通コンポーネント
import { useNavigate } from 'react-router-dom'
import type { Item } from '../types'
import { DIFFICULTY_LABELS, SRS_LABELS, TYPE_LABELS } from '../types'
import { speakZh } from '../services/speech'
import { useApp } from '../store/AppContext'

interface Props {
  item: Item
  /** true: リスト行表示 / false: カード表示 */
  compact?: boolean
}

export default function ItemCard({ item, compact = false }: Props) {
  const { updateItem, addToQueue, settings } = useApp()
  const navigate = useNavigate()

  const playOnce = () => {
    void speakZh(item.zh, settings.rate, settings.voiceURI)
  }

  const badges = (
    <span>
      <span className="badge">{TYPE_LABELS[item.type]}</span>
      <span className="badge">{DIFFICULTY_LABELS[item.difficulty] ?? item.difficulty}</span>
      <span className="badge">{SRS_LABELS[item.srsStatus]}</span>
      {item.weak && <span className="badge weak">苦手</span>}
      {item.favorite && <span className="badge fav">★お気に入り</span>}
    </span>
  )

  if (compact) {
    return (
      <div className="item-card list-row">
        <button type="button" className="btn btn-sm btn-icon" onClick={playOnce} title="再生">
          🔊
        </button>
        <div
          className="row-main"
          onClick={() => navigate(`/items/${item.id}`)}
          style={{ cursor: 'pointer' }}
        >
          <div className="zh-text">{item.zh.length > 40 ? item.zh.slice(0, 40) + '…' : item.zh}</div>
          <div className="pinyin-text" style={{ fontSize: '0.85rem' }}>
            {item.pinyin.length > 60 ? item.pinyin.slice(0, 60) + '…' : item.pinyin}
          </div>
          <div className="ja-text" style={{ fontSize: '0.82rem' }}>
            {item.ja.length > 50 ? item.ja.slice(0, 50) + '…' : item.ja}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-icon"
          title="学習キューへ追加"
          onClick={() => addToQueue([item.id])}
        >
          ➕
        </button>
      </div>
    )
  }

  return (
    <div className="item-card">
      <div onClick={() => navigate(`/items/${item.id}`)} style={{ cursor: 'pointer' }}>
        <div className="zh-text">{item.zh}</div>
        <div className="pinyin-text">{item.pinyin}</div>
        <div className="ja-text">{item.ja}</div>
        {item.memo && <div className="memo-text">{item.memo}</div>}
      </div>
      <div style={{ marginTop: 8 }}>
        {badges}
        {item.tags.map((t) => (
          <span key={t} className="tag">
            #{t}
          </span>
        ))}
      </div>
      <div className="item-actions">
        <button type="button" className="btn btn-sm" onClick={playOnce}>
          🔊 再生
        </button>
        <button
          type="button"
          className={`btn btn-sm ${item.favorite ? 'active' : ''}`}
          onClick={() => updateItem(item.id, { favorite: !item.favorite })}
        >
          ★ お気に入り
        </button>
        <button
          type="button"
          className={`btn btn-sm ${item.weak ? 'active' : ''}`}
          onClick={() => updateItem(item.id, { weak: !item.weak })}
        >
          ⚠ 苦手
        </button>
        <button type="button" className="btn btn-sm" onClick={() => addToQueue([item.id])}>
          ➕ キュー
        </button>
        <button type="button" className="btn btn-sm" onClick={() => navigate(`/items/${item.id}`)}>
          ✏️ 編集
        </button>
      </div>
    </div>
  )
}

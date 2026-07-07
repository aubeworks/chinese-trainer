// 学習キュー画面: 今日学習する教材の一時リスト
// 並び替え(ドラッグ&ボタン)・削除・シャッフル・プレイリスト保存・学習済み除外
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { shuffled, todayStr } from '../utils'

export default function QueuePage() {
  const { queue, items, setQueue, removeFromQueue, clearQueue, addPlaylist, history } = useApp()
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])
  const queueItems = queue.map((id) => byId.get(id)).filter((i) => !!i)

  const todayStudiedIds = useMemo(() => {
    const entry = history.find((h) => h.date === todayStr())
    return new Set(entry?.itemIds ?? [])
  }, [history])

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir
    if (j < 0 || j >= queue.length) return
    const next = [...queue]
    ;[next[index], next[j]] = [next[j], next[index]]
    setQueue(next)
  }

  /** ドラッグ&ドロップによる並び替え */
  const onDropRow = (target: number) => {
    if (dragIndex === null || dragIndex === target) {
      setDragIndex(null)
      setOverIndex(null)
      return
    }
    const next = [...queue]
    const [moved] = next.splice(dragIndex, 1)
    next.splice(target, 0, moved)
    setQueue(next)
    setDragIndex(null)
    setOverIndex(null)
  }

  const saveAsPlaylist = () => {
    const name = prompt('プレイリスト名を入力してください', `${todayStr()} の学習`)
    if (!name) return
    addPlaylist({ name, items: [...queue] })
    alert('プレイリストに保存しました')
  }

  const removeStudied = () => {
    setQueue(queue.filter((id) => !todayStudiedIds.has(id)))
  }

  return (
    <div className="page">
      <h1 className="page-title">学習キュー</h1>
      <p className="page-sub">今日学習したい教材を一時的に集める場所です。</p>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <Link to="/listen?src=queue" className="btn btn-primary">
          🎧 聞き流し
        </Link>
        <Link to="/flash?src=queue" className="btn">
          ⚡ 瞬発
        </Link>
        <button type="button" className="btn" onClick={() => setQueue(shuffled(queue))} disabled={queue.length < 2}>
          🔀 シャッフル
        </button>
        <button type="button" className="btn" onClick={saveAsPlaylist} disabled={queue.length === 0}>
          💾 プレイリスト化
        </button>
        <button type="button" className="btn" onClick={removeStudied} disabled={queue.length === 0}>
          ✅ 学習済みを除外
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={() => confirm('学習キューを空にしますか?') && clearQueue()}
          disabled={queue.length === 0}
        >
          🗑 全削除
        </button>
      </div>

      {queueItems.length === 0 ? (
        <EmptyState
          icon="📋"
          message="学習キューは空です"
          hint="教材一覧・SRS・RSSなどの「➕」ボタンから追加できます"
        />
      ) : (
        <ul className="list-plain">
          {queueItems.map((item, idx) => (
            <li
              key={item.id}
              className={`queue-row ${overIndex === idx ? 'drag-over' : ''}`}
              draggable
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => {
                e.preventDefault()
                setOverIndex(idx)
              }}
              onDrop={() => onDropRow(idx)}
              onDragEnd={() => {
                setDragIndex(null)
                setOverIndex(null)
              }}
            >
              <span className="drag-handle">⠿</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="zh-text" style={{ fontSize: '1.05rem' }}>
                    {item.zh.length > 30 ? item.zh.slice(0, 30) + '…' : item.zh}
                  </div>
                  <div className="pinyin-text" style={{ fontSize: '0.8rem' }}>
                    {item.pinyin.length > 45 ? item.pinyin.slice(0, 45) + '…' : item.pinyin}
                  </div>
                  <div className="ja-text" style={{ fontSize: '0.8rem' }}>
                    {item.ja.length > 40 ? item.ja.slice(0, 40) + '…' : item.ja}
                  </div>
                </Link>
                {todayStudiedIds.has(item.id) && <span className="badge">今日学習済み</span>}
              </div>
              <button type="button" className="btn btn-sm btn-icon" onClick={() => move(idx, -1)}>
                ↑
              </button>
              <button type="button" className="btn btn-sm btn-icon" onClick={() => move(idx, 1)}>
                ↓
              </button>
              <button type="button" className="btn btn-sm btn-icon" onClick={() => removeFromQueue(item.id)}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

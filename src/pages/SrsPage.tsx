// SRS復習画面: 今日復習予定の教材一覧と関連リスト
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import ItemCard from '../components/ItemCard'
import { useApp } from '../store/AppContext'
import { getDueItems } from '../services/srs'
import { isToday, todayStr } from '../utils'

export default function SrsPage() {
  const { items, history, addToQueue } = useApp()

  const due = useMemo(() => getDueItems(items), [items])
  const weak = useMemo(() => items.filter((i) => i.weak), [items])
  const addedToday = useMemo(() => items.filter((i) => isToday(i.createdAt)), [items])
  const studiedToday = useMemo(() => {
    const entry = history.find((h) => h.date === todayStr())
    if (!entry) return []
    const set = new Set(entry.itemIds)
    return items.filter((i) => set.has(i.id))
  }, [history, items])

  return (
    <div className="page">
      <h1 className="page-title">SRS復習</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{due.length}</div>
          <div className="stat-label">今日の復習予定</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{weak.length}</div>
          <div className="stat-label">苦手教材</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{addedToday.length}</div>
          <div className="stat-label">今日追加</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{studiedToday.length}</div>
          <div className="stat-label">今日学習済み</div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <Link to="/flash?src=srs" className="btn btn-primary">
          ⚡ 復習を始める(瞬発)
        </Link>
        <Link to="/listen?src=srs" className="btn">
          🎧 聞き流しで復習
        </Link>
        <button
          type="button"
          className="btn"
          onClick={() => addToQueue(due.map((i) => i.id))}
          disabled={due.length === 0}
        >
          ➕ 復習分をキューへ
        </button>
      </div>

      <h2 className="section-title">今日復習予定({due.length}件)</h2>
      {due.length === 0 ? (
        <EmptyState icon="🎉" message="今日の復習予定はありません" hint="瞬発練習で「まだ苦手/普通/覚えた」を選ぶと復習予定が作られます" />
      ) : (
        due.map((i) => <ItemCard key={i.id} item={i} compact />)
      )}

      {weak.length > 0 && (
        <>
          <h2 className="section-title">苦手教材({weak.length}件)</h2>
          <div className="btn-row" style={{ marginBottom: 8 }}>
            <Link to="/flash?src=weak" className="btn btn-sm">
              ⚡ 苦手だけ瞬発
            </Link>
            <Link to="/listen?src=weak" className="btn btn-sm">
              🎧 苦手だけ聞き流し
            </Link>
          </div>
          {weak.slice(0, 10).map((i) => (
            <ItemCard key={i.id} item={i} compact />
          ))}
          {weak.length > 10 && (
            <div className="info-box">ほか{weak.length - 10}件。教材一覧で「苦手のみ」で絞り込めます。</div>
          )}
        </>
      )}

      {addedToday.length > 0 && (
        <>
          <h2 className="section-title">今日追加した教材({addedToday.length}件)</h2>
          {addedToday.slice(0, 10).map((i) => (
            <ItemCard key={i.id} item={i} compact />
          ))}
        </>
      )}

      {studiedToday.length > 0 && (
        <>
          <h2 className="section-title">今日学習済み({studiedToday.length}件)</h2>
          {studiedToday.slice(0, 10).map((i) => (
            <ItemCard key={i.id} item={i} compact />
          ))}
        </>
      )}
    </div>
  )
}

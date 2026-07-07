// 教材一覧画面: 検索・絞り込み・カード/リスト切替
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ItemCard from '../components/ItemCard'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { TYPE_LABELS, DIFFICULTY_LABELS, type ItemType } from '../types'

const PAGE_SIZE = 50

export default function ItemsPage() {
  const { items, packs, addToQueue } = useApp()
  const [view, setView] = useState<'card' | 'list'>('list')
  const [search, setSearch] = useState('')
  const [packId, setPackId] = useState('')
  const [category, setCategory] = useState('')
  const [type, setType] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [flag, setFlag] = useState('') // '', 'weak', 'favorite', 'new', 'review', 'mastered'
  const [limit, setLimit] = useState(PAGE_SIZE)

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean))].sort(),
    [items]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((i) => {
      if (packId && i.packId !== packId) return false
      if (category && i.category !== category) return false
      if (type && i.type !== type) return false
      if (difficulty && i.difficulty !== Number(difficulty)) return false
      if (flag === 'weak' && !i.weak) return false
      if (flag === 'favorite' && !i.favorite) return false
      if (['new', 'review', 'mastered'].includes(flag) && i.srsStatus !== flag) return false
      if (q) {
        const hay = `${i.zh} ${i.ja} ${i.pinyin} ${i.memo} ${i.tags.join(' ')} ${i.subcategory}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [items, search, packId, category, type, difficulty, flag])

  const visible = filtered.slice(0, limit)

  return (
    <div className="page">
      <h1 className="page-title">教材一覧</h1>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="検索(中国語・日本語・ピンイン・タグ)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <select value={packId} onChange={(e) => setPackId(e.target.value)}>
          <option value="">全パック</option>
          {packs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">全カテゴリ</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">全種類</option>
          {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="">全難易度</option>
          {[1, 2, 3, 4, 5].map((d) => (
            <option key={d} value={d}>
              {DIFFICULTY_LABELS[d]}
            </option>
          ))}
        </select>
        <select value={flag} onChange={(e) => setFlag(e.target.value)}>
          <option value="">全状態</option>
          <option value="weak">苦手のみ</option>
          <option value="favorite">お気に入りのみ</option>
          <option value="new">SRS: 未学習</option>
          <option value="review">SRS: 復習中</option>
          <option value="mastered">SRS: 習得済み</option>
        </select>
      </div>

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <button
          type="button"
          className={`btn btn-sm ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          ☰ リスト
        </button>
        <button
          type="button"
          className={`btn btn-sm ${view === 'card' ? 'active' : ''}`}
          onClick={() => setView('card')}
        >
          ▦ カード
        </button>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length}件</span>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          className="btn btn-sm"
          disabled={filtered.length === 0}
          onClick={() => addToQueue(filtered.map((i) => i.id))}
        >
          ➕ 絞り込み結果をキューへ
        </button>
        <Link to="/items/new" className="btn btn-sm btn-primary">
          + 新規教材
        </Link>
      </div>

      {visible.length === 0 ? (
        <EmptyState message="該当する教材がありません" hint="検索条件を変更するか、教材をインポートしてください" />
      ) : (
        visible.map((i) => <ItemCard key={i.id} item={i} compact={view === 'list'} />)
      )}

      {filtered.length > limit && (
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button type="button" className="btn" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
            さらに表示({filtered.length - limit}件)
          </button>
        </div>
      )}
    </div>
  )
}

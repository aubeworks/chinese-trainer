// プレイリスト画面: 一覧・作成・編集・削除・複製・並び替え・検索
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import type { Playlist } from '../types'
import { shuffled } from '../utils'

export default function PlaylistsPage() {
  const { playlists, items, addPlaylist, updatePlaylist, removePlaylist, touchRecentPlaylist, addToQueue } = useApp()
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  const filtered = playlists.filter((p) =>
    search.trim() ? p.name.toLowerCase().includes(search.trim().toLowerCase()) : true
  )

  const create = () => {
    if (!newName.trim()) return
    addPlaylist({ name: newName.trim() })
    setNewName('')
  }

  const duplicate = (pl: Playlist) => {
    addPlaylist({
      name: `${pl.name} (コピー)`,
      description: pl.description,
      items: [...pl.items],
      shuffle: pl.shuffle,
      repeat: pl.repeat,
    })
  }

  const move = (pl: Playlist, index: number, dir: -1 | 1) => {
    const next = [...pl.items]
    const j = index + dir
    if (j < 0 || j >= next.length) return
    ;[next[index], next[j]] = [next[j], next[index]]
    updatePlaylist(pl.id, { items: next })
  }

  return (
    <div className="page">
      <h1 className="page-title">プレイリスト</h1>
      <p className="page-sub">教材パックとは別に、自由に教材を組み合わせられます。</p>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="プレイリストを検索"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="新しいプレイリスト名(例: 通勤、苦手だけ)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
          style={{ flex: 1, minWidth: 180 }}
        />
        <button type="button" className="btn btn-primary" onClick={create} disabled={!newName.trim()}>
          + 作成
        </button>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🎵"
          message="プレイリストがありません"
          hint="教材一覧やSRS画面から教材を学習キューに集め、プレイリストとして保存することもできます"
        />
      ) : (
        filtered.map((pl) => {
          const plItems = pl.items.map((id) => byId.get(id)).filter((i) => !!i)
          const open = openId === pl.id
          return (
            <div key={pl.id} className="card" style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={() => setOpenId(open ? null : pl.id)}>
                  <div style={{ fontWeight: 700 }}>
                    {pl.favorite && '★ '}
                    {pl.name} <span className="badge">{plItems.length}件</span>
                  </div>
                  {pl.description && (
                    <div className="ja-text" style={{ fontSize: '0.82rem' }}>
                      {pl.description}
                    </div>
                  )}
                </div>
                <button type="button" className="btn btn-sm" onClick={() => setOpenId(open ? null : pl.id)}>
                  {open ? '▲ 閉じる' : '▼ 詳細'}
                </button>
              </div>

              <div className="item-actions">
                <Link
                  to={`/listen?src=playlist:${pl.id}`}
                  className="btn btn-sm btn-primary"
                  onClick={() => touchRecentPlaylist(pl.id)}
                >
                  🎧 聞き流し
                </Link>
                <Link
                  to={`/flash?src=playlist:${pl.id}`}
                  className="btn btn-sm"
                  onClick={() => touchRecentPlaylist(pl.id)}
                >
                  ⚡ 瞬発
                </Link>
                <button
                  type="button"
                  className={`btn btn-sm ${pl.shuffle ? 'active' : ''}`}
                  onClick={() => updatePlaylist(pl.id, { shuffle: !pl.shuffle })}
                >
                  🔀 シャッフル
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${pl.favorite ? 'active' : ''}`}
                  onClick={() => updatePlaylist(pl.id, { favorite: !pl.favorite })}
                >
                  ★
                </button>
                <button type="button" className="btn btn-sm" onClick={() => duplicate(pl)}>
                  📄 複製
                </button>
                <button type="button" className="btn btn-sm" onClick={() => addToQueue(pl.items)}>
                  ➕ キューへ
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-danger"
                  onClick={() => confirm(`「${pl.name}」を削除しますか?`) && removePlaylist(pl.id)}
                >
                  🗑
                </button>
              </div>

              {open && (
                <div style={{ marginTop: 10 }}>
                  <div className="form-field">
                    <label>説明</label>
                    <input
                      type="text"
                      value={pl.description}
                      onChange={(e) => updatePlaylist(pl.id, { description: e.target.value })}
                    />
                  </div>
                  <div className="btn-row" style={{ marginBottom: 8 }}>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={() => updatePlaylist(pl.id, { items: shuffled(pl.items) })}
                      disabled={pl.items.length < 2}
                    >
                      🔀 今すぐ並びをシャッフル
                    </button>
                  </div>
                  {plItems.length === 0 ? (
                    <div className="info-box">
                      教材がありません。教材一覧・学習キューから追加できます。
                    </div>
                  ) : (
                    <ul className="list-plain">
                      {plItems.map((item, idx) => (
                        <li key={item.id} className="queue-row">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="zh-text" style={{ fontSize: '1rem' }}>
                              {item.zh.length > 30 ? item.zh.slice(0, 30) + '…' : item.zh}
                            </div>
                            <div className="ja-text" style={{ fontSize: '0.78rem' }}>
                              {item.ja.length > 40 ? item.ja.slice(0, 40) + '…' : item.ja}
                            </div>
                          </div>
                          <button type="button" className="btn btn-sm btn-icon" onClick={() => move(pl, idx, -1)}>
                            ↑
                          </button>
                          <button type="button" className="btn btn-sm btn-icon" onClick={() => move(pl, idx, 1)}>
                            ↓
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-icon"
                            onClick={() =>
                              updatePlaylist(pl.id, { items: pl.items.filter((id) => id !== item.id) })
                            }
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}

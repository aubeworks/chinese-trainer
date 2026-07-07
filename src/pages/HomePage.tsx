// ホーム画面: 学習状況のサマリーと主要機能へのショートカット
import { Link } from 'react-router-dom'
import { useApp } from '../store/AppContext'
import { getDueItems } from '../services/srs'
import { todayStr } from '../utils'

export default function HomePage() {
  const { items, packs, playlists, history, queue, settings } = useApp()

  const today = history.find((h) => h.date === todayStr())
  const due = getDueItems(items)
  const weakCount = items.filter((i) => i.weak).length
  const favCount = items.filter((i) => i.favorite).length

  const recentItems = [...items]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)
  const recentPlaylists = settings.recentPlaylistIds
    .map((id) => playlists.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 3)
  const recentPacks = settings.recentPackIds
    .map((id) => packs.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p)
    .slice(0, 3)

  return (
    <div className="page">
      <h1 className="page-title">今日も1歩、中国語。</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{today?.studied ?? 0}</div>
          <div className="stat-label">今日の学習件数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{due.length}</div>
          <div className="stat-label">今日の復習件数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{weakCount}</div>
          <div className="stat-label">苦手</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{favCount}</div>
          <div className="stat-label">お気に入り</div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 20 }}>
        <Link to="/listen" className="btn btn-primary">
          🎧 聞き流しを始める
        </Link>
        <Link to="/flash" className="btn">
          ⚡ 瞬発練習
        </Link>
        <Link to="/srs" className="btn">
          🔁 SRS復習 {due.length > 0 && `(${due.length})`}
        </Link>
        {queue.length > 0 && (
          <Link to="/queue" className="btn">
            📋 学習キュー ({queue.length})
          </Link>
        )}
      </div>

      {recentPlaylists.length > 0 && (
        <>
          <h2 className="section-title">最近のプレイリスト</h2>
          <div className="btn-row">
            {recentPlaylists.map((p) => (
              <Link key={p.id} to={`/listen?src=playlist:${p.id}`} className="btn btn-sm">
                🎵 {p.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {recentPacks.length > 0 && (
        <>
          <h2 className="section-title">最近の教材パック</h2>
          <div className="btn-row">
            {recentPacks.map((p) => (
              <Link key={p.id} to={`/listen?src=pack:${p.id}`} className="btn btn-sm">
                {p.icon} {p.name}
              </Link>
            ))}
          </div>
        </>
      )}

      <h2 className="section-title">最近追加した教材</h2>
      {recentItems.length === 0 ? (
        <div className="info-box">
          まだ教材がありません。<Link to="/packs">教材パック</Link>からインポートするか、
          <Link to="/prompt">教材生成プロンプト</Link>でAIに教材を作らせましょう。
        </div>
      ) : (
        recentItems.map((i) => (
          <Link
            key={i.id}
            to={`/items/${i.id}`}
            className="item-card list-row"
            style={{ textDecoration: 'none', color: 'inherit', display: 'flex' }}
          >
            <div className="row-main">
              <div className="zh-text" style={{ fontSize: '1.05rem' }}>
                {i.zh.length > 30 ? i.zh.slice(0, 30) + '…' : i.zh}
              </div>
              <div className="ja-text" style={{ fontSize: '0.8rem' }}>
                {i.ja.length > 40 ? i.ja.slice(0, 40) + '…' : i.ja}
              </div>
            </div>
          </Link>
        ))
      )}
    </div>
  )
}

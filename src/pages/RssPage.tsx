// RSS画面: 中国語ニュースなどのRSSを取得して読み上げ・教材保存
// RSS内容はテキストとして扱う(HTMLは実行しない)。
// 取得失敗時はエラー表示のみで、他機能へ影響しない。
import { useState } from 'react'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { fetchRss } from '../services/rss'
import { cancelSpeech, speakZh } from '../services/speech'
import { toPinyin } from '../services/pinyin'
import { genId } from '../utils'
import type { RssArticle, RssFeed } from '../types'

export default function RssPage() {
  const { settings, updateSettings, addItem, addToQueue, packs, addPack } = useApp()
  const [selectedFeed, setSelectedFeed] = useState<RssFeed | null>(null)
  const [articles, setArticles] = useState<RssArticle[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [newUrl, setNewUrl] = useState('')
  const [savedMsg, setSavedMsg] = useState('')

  const load = async (feed: RssFeed) => {
    setSelectedFeed(feed)
    setLoading(true)
    setError('')
    setArticles([])
    try {
      const result = await fetchRss(feed.url, settings.rssProxy)
      setArticles(result)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'RSSの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const addFeed = () => {
    if (!newName.trim() || !newUrl.trim()) return
    updateSettings({
      rssFeeds: [...settings.rssFeeds, { id: genId('rss'), name: newName.trim(), url: newUrl.trim() }],
    })
    setNewName('')
    setNewUrl('')
  }

  const removeFeed = (id: string) => {
    updateSettings({ rssFeeds: settings.rssFeeds.filter((f) => f.id !== id) })
  }

  /** RSS記事を教材として保存する */
  const saveArticle = (article: RssArticle, alsoQueue: boolean) => {
    // RSS用パックがなければ作成
    let pack = packs.find((p) => p.id === 'pack-rss')
    if (!pack) {
      pack = addPack({ id: 'pack-rss', name: 'RSS記事', description: 'RSSから保存した記事', icon: '📡', color: '#0e7490' })
    }
    const zh = article.description ? `${article.title}。\n${article.description}` : article.title
    const item = addItem({
      packId: pack.id,
      type: 'article',
      category: 'ニュース',
      zh,
      ja: '',
      pinyin: toPinyin(zh),
      memo: article.link,
      source: 'RSS',
      author: selectedFeed?.name ?? 'RSS',
    })
    if (alsoQueue) addToQueue([item.id])
    setSavedMsg(`保存しました: ${article.title.slice(0, 30)}`)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  return (
    <div className="page">
      <h1 className="page-title">RSS</h1>
      <p className="page-sub">中国語ニュースを取得して読み上げ・教材化できます(インターネット接続が必要)。</p>

      {/* フィード一覧 */}
      <div className="btn-row" style={{ marginBottom: 12 }}>
        {settings.rssFeeds.map((f) => (
          <span key={f.id} style={{ display: 'inline-flex', gap: 2 }}>
            <button
              type="button"
              className={`btn btn-sm ${selectedFeed?.id === f.id ? 'active' : ''}`}
              onClick={() => void load(f)}
            >
              📡 {f.name}
            </button>
            <button type="button" className="btn btn-sm btn-icon" onClick={() => removeFeed(f.id)} title="削除">
              ✕
            </button>
          </span>
        ))}
      </div>

      {/* フィード追加 */}
      <div className="btn-row" style={{ marginBottom: 16 }}>
        <input
          type="text"
          placeholder="フィード名"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1, minWidth: 100 }}
        />
        <input
          type="url"
          placeholder="RSS URL"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          style={{ flex: 2, minWidth: 160 }}
        />
        <button type="button" className="btn btn-sm" onClick={addFeed} disabled={!newName.trim() || !newUrl.trim()}>
          + 追加
        </button>
      </div>

      {savedMsg && <div className="info-box">{savedMsg}</div>}
      {loading && <div className="info-box">読み込み中…</div>}
      {error && (
        <div className="error-box">
          {error}
          <div style={{ fontSize: '0.8rem', marginTop: 4 }}>
            ブラウザのCORS制限が原因の場合があります。設定画面のRSSプロキシを確認してください。
          </div>
        </div>
      )}

      {/* 記事一覧 */}
      {!loading && articles.length === 0 && !error && (
        <EmptyState icon="📡" message="フィードを選択してください" />
      )}
      {articles.map((a, i) => (
        <div key={i} className="item-card">
          <div className="zh-text" style={{ fontSize: '1.1rem' }}>
            {a.title}
          </div>
          {a.description && (
            <div className="ja-text" style={{ fontSize: '0.85rem', marginTop: 4 }}>
              {a.description.slice(0, 120)}
              {a.description.length > 120 && '…'}
            </div>
          )}
          {a.pubDate && (
            <div className="memo-text" style={{ marginTop: 4 }}>
              {a.pubDate}
            </div>
          )}
          <div className="item-actions">
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                cancelSpeech()
                void speakZh(
                  a.description ? `${a.title}。${a.description}` : a.title,
                  settings.rate,
                  settings.voiceURI
                )
              }}
            >
              🔊 読み上げ
            </button>
            <button type="button" className="btn btn-sm" onClick={() => cancelSpeech()}>
              ⏹ 停止
            </button>
            <button type="button" className="btn btn-sm" onClick={() => saveArticle(a, false)}>
              💾 教材保存
            </button>
            <button type="button" className="btn btn-sm" onClick={() => saveArticle(a, true)}>
              ➕ 保存してキューへ
            </button>
            {a.link && (
              <a href={a.link} target="_blank" rel="noreferrer" className="btn btn-sm">
                🔗 元記事
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

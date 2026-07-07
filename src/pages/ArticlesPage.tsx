// 長文画面: 長文教材の一覧と、段落・文単位での表示/再生
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import SpeedSelector from '../components/SpeedSelector'
import { useApp } from '../store/AppContext'
import { cancelSpeech, speakZh } from '../services/speech'
import { splitParagraphs, splitSentences } from '../utils'
import { toPinyin } from '../services/pinyin'

export default function ArticlesPage() {
  const { items, settings, updateSettings, updateItem, addToQueue, recordStudy } = useApp()
  const [params, setParams] = useSearchParams()
  const selectedId = params.get('id')

  const articles = useMemo(() => items.filter((i) => i.type === 'article'), [items])
  const article = articles.find((a) => a.id === selectedId) ?? null

  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const tokenRef = useRef(0)

  // 段落ごとに 中国語/ピンイン/日本語 を対応付ける
  const paragraphs = useMemo(() => {
    if (!article) return []
    const zhParas = splitParagraphs(article.zh)
    const jaParas = splitParagraphs(article.ja)
    return zhParas.map((zh, i) => ({
      zh,
      sentences: splitSentences(zh),
      pinyin: toPinyin(zh),
      ja: jaParas[i] ?? '',
    }))
  }, [article])

  useEffect(() => {
    // 画面離脱時に再生停止
    return () => {
      tokenRef.current++
      cancelSpeech()
    }
  }, [])

  const stop = () => {
    tokenRef.current++
    cancelSpeech()
    setPlayingKey(null)
  }

  /** 一連の文を順番に再生する */
  const playSequence = async (texts: string[], key: string) => {
    const token = ++tokenRef.current
    cancelSpeech()
    setPlayingKey(key)
    for (const t of texts) {
      if (token !== tokenRef.current) return
      await speakZh(t, settings.rate, settings.voiceURI)
    }
    if (token === tokenRef.current) setPlayingKey(null)
    if (article) recordStudy([article.id])
  }

  // ---- 記事リーダー表示 ----
  if (article) {
    return (
      <div className="page">
        <div className="btn-row" style={{ marginBottom: 12 }}>
          <button type="button" className="btn btn-sm" onClick={() => { stop(); setParams({}) }}>
            ← 長文一覧へ
          </button>
        </div>
        <h1 className="page-title">{article.ja.split('\n')[0].slice(0, 30) || '長文'}</h1>

        <div className="btn-row" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              playingKey === 'all' ? stop() : void playSequence(paragraphs.flatMap((p) => p.sentences), 'all')
            }
          >
            {playingKey === 'all' ? '⏸ 停止' : '▶ 全文再生'}
          </button>
          <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
          <button
            type="button"
            className={`btn btn-sm ${article.favorite ? 'active' : ''}`}
            onClick={() => updateItem(article.id, { favorite: !article.favorite })}
          >
            ★ お気に入り
          </button>
          <button type="button" className="btn btn-sm" onClick={() => addToQueue([article.id])}>
            ➕ 学習キュー
          </button>
          <Link to={`/items/${article.id}`} className="btn btn-sm">
            ✏️ 編集
          </Link>
        </div>

        {/* 段落ごと: 中国語 → ピンイン → 日本語 */}
        {paragraphs.map((p, pi) => (
          <div key={pi} className="paragraph-block">
            <div className="btn-row" style={{ marginBottom: 8 }}>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() =>
                  playingKey === `p${pi}` ? stop() : void playSequence(p.sentences, `p${pi}`)
                }
              >
                {playingKey === `p${pi}` ? '⏸ 停止' : '▶ 段落を再生'}
              </button>
            </div>
            {/* 文ごとにクリックで再生 */}
            {p.sentences.map((s, si) => (
              <div
                key={si}
                className={`sentence-line ${playingKey === `p${pi}s${si}` ? 'playing-now' : ''}`}
                onClick={() =>
                  playingKey === `p${pi}s${si}` ? stop() : void playSequence([s], `p${pi}s${si}`)
                }
                title="クリックでこの文を再生"
              >
                <span className="zh-text" style={{ fontSize: '1.2rem' }}>
                  {s}
                </span>
              </div>
            ))}
            <div className="pinyin-text" style={{ marginTop: 8 }}>
              {p.pinyin}
            </div>
            <div className="ja-text" style={{ marginTop: 6 }}>
              {p.ja}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // ---- 長文一覧 ----
  return (
    <div className="page">
      <h1 className="page-title">長文</h1>
      <p className="page-sub">ニュース・メール・資料などの長文で、自然な言い回しに慣れましょう。</p>

      <div className="btn-row" style={{ marginBottom: 14 }}>
        <Link to="/items/new" className="btn btn-sm">
          + 長文を追加(種類で「長文」を選択)
        </Link>
        <Link to="/paste" className="btn btn-sm">
          📝 貼り付けから追加
        </Link>
      </div>

      {articles.length === 0 ? (
        <EmptyState
          icon="📰"
          message="長文教材がありません"
          hint="貼り付け読み上げやRSSから長文を保存できます"
        />
      ) : (
        articles.map((a) => (
          <div
            key={a.id}
            className="item-card"
            style={{ cursor: 'pointer' }}
            onClick={() => setParams({ id: a.id })}
          >
            <div className="zh-text" style={{ fontSize: '1.1rem' }}>
              {a.zh.slice(0, 40)}…
            </div>
            <div className="ja-text" style={{ fontSize: '0.85rem' }}>
              {a.ja.slice(0, 60)}…
            </div>
            <div style={{ marginTop: 6 }}>
              <span className="badge">{a.category}</span>
              {a.favorite && <span className="badge fav">★</span>}
              {a.tags.map((t) => (
                <span key={t} className="tag">
                  #{t}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

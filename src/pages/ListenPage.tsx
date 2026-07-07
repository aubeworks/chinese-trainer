// 聞き流し画面: アプリの中心機能
// 中国語→ピンイン→日本語を中央に表示し、下部の操作バーで再生を制御する。
// キーボードショートカット: Space=再生/停止, ←→=前へ/次へ
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SpeedSelector from '../components/SpeedSelector'
import VoiceSelector from '../components/VoiceSelector'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { usePlayer } from '../hooks/usePlayer'
import { useSourceItems } from '../hooks/useSourceItems'
import { useVoices } from '../hooks/useVoices'
import { PLAY_MODE_LABELS, type PlayMode } from '../types'

export default function ListenPage() {
  const { settings, updateSettings, updateItem, recordStudy } = useApp()
  const { items, label, src } = useSourceItems()
  const { available } = useVoices()
  const [params] = useSearchParams()
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(true)

  const player = usePlayer({
    items,
    mode: settings.playMode,
    rate: settings.rate,
    voiceURI: settings.voiceURI,
    shuffle,
    repeat,
    onItemPlayed: (item) => recordStudy([item.id], src === 'srs'),
  })

  const current = player.current

  // キーボードショートカット(PC)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        player.toggle()
      } else if (e.key === 'ArrowRight') {
        player.next()
      } else if (e.key === 'ArrowLeft') {
        player.prev()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [player])

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">聞き流し</h1>
        <EmptyState
          icon="🎧"
          message={`「${label}」に再生できる教材がありません`}
          hint="教材を追加するか、別の対象を選んでください"
        />
        <div className="btn-row">
          <Link to="/listen" className="btn btn-sm">すべての教材</Link>
          <Link to="/items" className="btn btn-sm">教材一覧へ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page player-page">
      <h1 className="page-title">聞き流し</h1>
      <p className="page-sub">
        {label}({player.index + 1} / {player.ordered.length})
        {params.get('src')?.startsWith('srs') && ' - SRS復習として記録されます'}
      </p>

      {!available && <div className="error-box">中国語音声が利用できません。表示のみで学習できます。</div>}

      {/* 教材表示(中国語 → ピンイン → 日本語) */}
      <div className="player-display">
        {current && (
          <>
            <div className="zh-text">{current.zh}</div>
            <div className="pinyin-text">{current.pinyin}</div>
            <div className="ja-text">{current.ja}</div>
            <div>
              <button
                type="button"
                className={`btn btn-sm ${current.favorite ? 'active' : ''}`}
                onClick={() => updateItem(current.id, { favorite: !current.favorite })}
              >
                ★
              </button>{' '}
              <button
                type="button"
                className={`btn btn-sm ${current.weak ? 'active' : ''}`}
                onClick={() => updateItem(current.id, { weak: !current.weak })}
              >
                ⚠ 苦手
              </button>
            </div>
          </>
        )}
      </div>

      {/* 操作バー */}
      <div className="player-bar">
        <div className="player-controls">
          <button type="button" className="btn-skip" onClick={player.prev} aria-label="前へ">
            ⏮
          </button>
          <button
            type="button"
            className="btn-play"
            onClick={player.toggle}
            aria-label={player.playing ? '停止' : '再生'}
          >
            {player.playing ? '⏸' : '▶'}
          </button>
          <button type="button" className="btn-skip" onClick={player.next} aria-label="次へ">
            ⏭
          </button>
        </div>

        <div className="player-options">
          <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
        </div>

        <div className="player-options" style={{ marginTop: 8 }}>
          <select
            value={settings.playMode}
            onChange={(e) => updateSettings({ playMode: e.target.value as PlayMode })}
            style={{ width: 'auto' }}
            aria-label="再生モード"
          >
            {(Object.keys(PLAY_MODE_LABELS) as PlayMode[]).map((m) => (
              <option key={m} value={m}>
                {PLAY_MODE_LABELS[m]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={`btn btn-sm ${shuffle ? 'active' : ''}`}
            onClick={() => {
              setShuffle((v) => !v)
              if (!shuffle) player.reshuffle()
            }}
          >
            🔀
          </button>
          <button
            type="button"
            className={`btn btn-sm ${repeat ? 'active' : ''}`}
            onClick={() => setRepeat((v) => !v)}
          >
            🔁
          </button>
          <VoiceSelector value={settings.voiceURI} onChange={(voiceURI) => updateSettings({ voiceURI })} />
        </div>
      </div>
    </div>
  )
}

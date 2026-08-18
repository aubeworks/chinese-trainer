// 聞き流し画面: アプリの中心機能
// 中国語→ピンイン→日本語を中央に表示し、下部の操作バーで再生を制御する。
// 画面を開いたまま、再生対象(教材パック・プレイリスト等)を切り替えられる。
// 再生モード「シャドーイング」では、再生→復唱ポーズ→再確認再生を自動で繰り返す。
// キーボードショートカット: Space=再生/停止, ←→=前へ/次へ
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import SpeedSelector from '../components/SpeedSelector'
import VoiceSelector from '../components/VoiceSelector'
import SourceSelector from '../components/SourceSelector'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { usePlayer } from '../hooks/usePlayer'
import { useSourceItems } from '../hooks/useSourceItems'
import { useVoices } from '../hooks/useVoices'
import { PLAY_MODE_LABELS, type PlayMode } from '../types'

export default function ListenPage() {
  const { settings, updateSettings, updateItem, recordStudy, touchRecentPack, touchRecentPlaylist } = useApp()
  const { items, label, src } = useSourceItems()
  const { available } = useVoices()
  const [params, setParams] = useSearchParams()
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState(true)
  // 復唱ポーズの残り秒数(カウントダウン表示用)
  const [pauseLeft, setPauseLeft] = useState(0)

  const player = usePlayer({
    items,
    mode: settings.playMode,
    rate: settings.rate,
    voiceURI: settings.voiceURI,
    shuffle,
    repeat,
    shadowPauseScale: settings.shadowPauseScale,
    shadowRepeat: settings.shadowRepeat,
    onItemPlayed: (item) => recordStudy([item.id], src === 'srs'),
  })

  const current = player.current
  const isShadow = settings.playMode === 'shadow'

  // シャドーイング: ポーズ残り時間のカウントダウン
  useEffect(() => {
    if (player.shadowPhase !== 'pause' || player.pauseUntil === null) {
      setPauseLeft(0)
      return
    }
    const tick = () => {
      setPauseLeft(Math.max(0, Math.ceil(((player.pauseUntil ?? 0) - Date.now()) / 1000)))
    }
    tick()
    const timer = window.setInterval(tick, 250)
    return () => window.clearInterval(timer)
  }, [player.shadowPhase, player.pauseUntil])

  // 再生対象が変わったら先頭に戻す
  const prevSrcRef = useRef(src)
  useEffect(() => {
    if (prevSrcRef.current !== src) {
      prevSrcRef.current = src
      player.jumpTo(0)
    }
    // playerは毎レンダー新しい参照になるため依存から除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  /** 再生対象を切り替える(再生中は一旦停止) */
  const changeSource = (value: string) => {
    player.pause()
    if (value === 'all') {
      setParams({})
    } else {
      setParams({ src: value })
    }
    // ホーム画面の「最近使った」に反映
    if (value.startsWith('pack:')) touchRecentPack(value.slice(5))
    if (value.startsWith('playlist:')) touchRecentPlaylist(value.slice(9))
  }

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
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <SourceSelector value={src} onChange={changeSource} />
        </div>
        <EmptyState
          icon="🎧"
          message={`「${label}」に再生できる教材がありません`}
          hint="教材を追加するか、上のセレクターで別の対象を選んでください"
        />
        <div className="btn-row">
          <Link to="/items" className="btn btn-sm">教材一覧へ</Link>
        </div>
      </div>
    )
  }

  // シャドーイングで文字を隠すか(再確認再生では表示する)
  const hideText = isShadow && settings.shadowHideText && player.playing && player.shadowPhase !== 'confirm'

  return (
    <div className="page player-page">
      <h1 className="page-title">聞き流し</h1>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <SourceSelector value={src} onChange={changeSource} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {player.index + 1} / {player.ordered.length}
          {params.get('src') === 'srs' && ' - SRS復習として記録されます'}
        </span>
      </div>

      {!available && <div className="error-box">中国語音声が利用できません。表示のみで学習できます。</div>}

      {/* 教材表示(中国語 → ピンイン → 日本語) */}
      <div className="player-display">
        {current && (
          <>
            {/* シャドーイングの進行表示 */}
            {isShadow && player.playing && (
              <div className={`shadow-status ${player.shadowPhase}`}>
                {player.shadowPhase === 'speak' && '🎧 よく聞いてください'}
                {player.shadowPhase === 'pause' && `👄 復唱してください(あと ${pauseLeft} 秒)`}
                {player.shadowPhase === 'confirm' && '✅ 答え合わせ'}
              </div>
            )}

            {hideText ? (
              <div className="zh-text" style={{ color: 'var(--text-muted)' }}>
                🙈 文字は非表示です
              </div>
            ) : (
              <>
                <div className="zh-text">{current.zh}</div>
                <div className="pinyin-text">{current.pinyin}</div>
                <div className="ja-text">{current.ja}</div>
              </>
            )}
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

        {/* シャドーイング専用オプション */}
        {isShadow && (
          <div className="player-options" style={{ marginTop: 8 }}>
            <select
              value={settings.shadowPauseScale}
              onChange={(e) => updateSettings({ shadowPauseScale: Number(e.target.value) })}
              style={{ width: 'auto' }}
              aria-label="復唱ポーズの長さ"
            >
              <option value={0.8}>ポーズ短め</option>
              <option value={1.2}>ポーズ標準</option>
              <option value={1.6}>ポーズ長め</option>
            </select>
            <button
              type="button"
              className={`btn btn-sm ${settings.shadowRepeat ? 'active' : ''}`}
              onClick={() => updateSettings({ shadowRepeat: !settings.shadowRepeat })}
              title="復唱後にもう一度再生して答え合わせ"
            >
              ✅ 再確認再生
            </button>
            <button
              type="button"
              className={`btn btn-sm ${settings.shadowHideText ? 'active' : ''}`}
              onClick={() => updateSettings({ shadowHideText: !settings.shadowHideText })}
              title="再生・復唱中は文字を隠す(耳だけで復唱する上級モード)"
            >
              🙈 文字を隠す
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

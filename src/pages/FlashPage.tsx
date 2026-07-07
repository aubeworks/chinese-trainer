// 瞬発練習画面: 日本語を見て即座に中国語を言う練習
// 制限時間経過(または回答ボタン)で中国語・ピンイン・音声を表示する。
// キーボードショートカット: Space=回答表示/次へ
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import SpeedSelector from '../components/SpeedSelector'
import { useApp } from '../store/AppContext'
import { useSourceItems } from '../hooks/useSourceItems'
import { cancelSpeech, speakZh } from '../services/speech'
import { shuffled } from '../utils'
import type { SrsGrade } from '../types'

export default function FlashPage() {
  const { settings, updateSettings, updateItem, gradeItem, recordStudy } = useApp()
  const { items, label, src } = useSourceItems()

  const [order, setOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [remaining, setRemaining] = useState(settings.flashSeconds)
  const [autoReveal, setAutoReveal] = useState(true)
  const timerRef = useRef<number | null>(null)

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  // 出題順を初期化(シャッフル)
  useEffect(() => {
    setOrder(shuffled(items.map((i) => i.id)))
    setIndex(0)
    setRevealed(false)
  }, [items])

  const current = byId.get(order[index] ?? '')

  const stopTimer = () => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  const reveal = useCallback(() => {
    stopTimer()
    setRevealed(true)
  }, [])

  // 問題が変わったらタイマー開始
  useEffect(() => {
    stopTimer()
    setRemaining(settings.flashSeconds)
    if (!current || revealed || !autoReveal) return
    timerRef.current = window.setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          reveal()
          return 0
        }
        return r - 1
      })
    }, 1000)
    return stopTimer
    // revealed を依存に含めると回答表示時にタイマーが再走するため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, autoReveal, settings.flashSeconds])

  // 回答表示時に音声を再生し、学習として記録
  useEffect(() => {
    if (revealed && current) {
      void speakZh(current.zh, settings.rate, settings.voiceURI)
      recordStudy([current.id], src === 'srs')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])

  const next = useCallback(() => {
    cancelSpeech()
    setRevealed(false)
    setIndex((i) => (i + 1 < order.length ? i + 1 : 0))
    if (index + 1 >= order.length) {
      // 一周したら再シャッフル
      setOrder((o) => shuffled(o))
    }
  }, [order.length, index])

  const grade = (g: SrsGrade) => {
    if (!current) return
    gradeItem(current.id, g)
    next()
  }

  // キーボードショートカット
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.code === 'Space') {
        e.preventDefault()
        if (revealed) {
          next()
        } else {
          reveal()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [revealed, reveal, next])

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">瞬発練習</h1>
        <EmptyState icon="⚡" message={`「${label}」に教材がありません`} />
        <div className="btn-row">
          <Link to="/flash" className="btn btn-sm">すべての教材</Link>
          <Link to="/items" className="btn btn-sm">教材一覧へ</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">瞬発練習</h1>
      <p className="page-sub">
        {label}({index + 1} / {order.length})- 日本語を見て、すぐ中国語を言いましょう
      </p>

      {current && (
        <div className="card flash-card">
          <div className="flash-ja">{current.ja || '(日本語訳なし)'}</div>

          {!revealed ? (
            <>
              {autoReveal && <div className="flash-timer">あと {remaining} 秒で答えを表示</div>}
              <button type="button" className="btn btn-primary" onClick={reveal}>
                💡 答えを見る
              </button>
            </>
          ) : (
            <>
              <div className="zh-text" style={{ fontSize: '1.8rem', marginBottom: 6 }}>
                {current.zh}
              </div>
              <div className="pinyin-text" style={{ marginBottom: 4 }}>
                {current.pinyin}
              </div>
              <div className="ja-text" style={{ marginBottom: 16 }}>
                {current.ja}
              </div>
              <div className="btn-row" style={{ justifyContent: 'center', marginBottom: 12 }}>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => void speakZh(current.zh, settings.rate, settings.voiceURI)}
                >
                  🔊 もう一度
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${current.favorite ? 'active' : ''}`}
                  onClick={() => updateItem(current.id, { favorite: !current.favorite })}
                >
                  ★
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${current.weak ? 'active' : ''}`}
                  onClick={() => updateItem(current.id, { weak: !current.weak })}
                >
                  ⚠ 苦手
                </button>
              </div>
              {/* SRS評価 */}
              <div className="btn-row" style={{ justifyContent: 'center' }}>
                <button type="button" className="btn btn-danger" onClick={() => grade('again')}>
                  まだ苦手
                </button>
                <button type="button" className="btn" onClick={() => grade('good')}>
                  普通
                </button>
                <button type="button" className="btn btn-primary" onClick={() => grade('easy')}>
                  覚えた
                </button>
              </div>
              <div style={{ marginTop: 14 }}>
                <button type="button" className="btn" onClick={next}>
                  ⏭ 次へ(評価しない)
                </button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 16, justifyContent: 'center' }}>
        <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
        <button
          type="button"
          className={`btn btn-sm ${autoReveal ? 'active' : ''}`}
          onClick={() => setAutoReveal((v) => !v)}
        >
          ⏱ 自動表示 {autoReveal ? 'ON' : 'OFF'}
        </button>
        <select
          value={settings.flashSeconds}
          onChange={(e) => updateSettings({ flashSeconds: Number(e.target.value) })}
          style={{ width: 'auto' }}
          aria-label="制限時間"
        >
          {[3, 5, 8, 10, 15].map((s) => (
            <option key={s} value={s}>
              {s}秒
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

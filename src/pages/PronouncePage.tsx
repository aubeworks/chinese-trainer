// 発音練習画面: お手本を聞いて発音し、音声認識で判定する
// 判定はピンイン音節ベース(音が合っていて声調違いは部分点)。
// 音声認識はChrome/Edge(PC・Android)+HTTPS+ネット接続が必要。
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SourceSelector from '../components/SourceSelector'
import SpeedSelector from '../components/SpeedSelector'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { useSourceItems } from '../hooks/useSourceItems'
import { cancelSpeech, recognitionAvailable, recognizeSpeech, speakZh } from '../services/speech'
import { evaluatePronunciation, type PronounceEval } from '../services/pronounce'
import { splitSentences, shuffled } from '../utils'
import type { SrsGrade } from '../types'

interface AttemptResult extends PronounceEval {
  recognized: string
}

/** スコアに応じた色と一言コメント */
function scoreInfo(score: number): { color: string; comment: string } {
  if (score >= 85) return { color: '#15803d', comment: '素晴らしい!ほぼ完璧です' }
  if (score >= 65) return { color: '#b45309', comment: 'いい調子!赤い字を重点練習しましょう' }
  if (score >= 40) return { color: '#b45309', comment: 'もう少し!お手本をもう一度聞いてみましょう' }
  return { color: '#b91c1c', comment: 'ゆっくりはっきり発音してみましょう' }
}

export default function PronouncePage() {
  const { settings, updateSettings, updateItem, gradeItem, recordStudy, touchRecentPack, touchRecentPlaylist } =
    useApp()
  const { items, label, src } = useSourceItems()
  const [, setParams] = useSearchParams()

  const [order, setOrder] = useState<string[]>([])
  const [index, setIndex] = useState(0)
  const [listening, setListening] = useState(false)
  const [result, setResult] = useState<AttemptResult | null>(null)
  const [error, setError] = useState('')
  const available = useMemo(() => recognitionAvailable(), [])

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items])

  // 出題順を初期化(シャッフル)
  useEffect(() => {
    setOrder(shuffled(items.map((i) => i.id)))
    setIndex(0)
    setResult(null)
    setError('')
  }, [items])

  // 画面離脱時に読み上げ停止
  useEffect(() => () => cancelSpeech(), [])

  const current = byId.get(order[index] ?? '')
  // 長文は最初の一文だけを練習対象にする(音声認識は長い発話に不向きなため)
  const target = current ? (current.type === 'article' ? splitSentences(current.zh)[0] ?? current.zh : current.zh) : ''
  const isPartial = current ? current.type === 'article' && target !== current.zh : false

  const listeningRef = useRef(false)

  const changeSource = (value: string) => {
    cancelSpeech()
    if (value === 'all') {
      setParams({})
    } else {
      setParams({ src: value })
    }
    if (value.startsWith('pack:')) touchRecentPack(value.slice(5))
    if (value.startsWith('playlist:')) touchRecentPlaylist(value.slice(9))
  }

  const playSample = () => {
    cancelSpeech()
    void speakZh(target, settings.rate, settings.voiceURI)
  }

  /** マイクで発話を認識して採点する */
  const startMic = async () => {
    if (!current || listeningRef.current) return
    listeningRef.current = true
    cancelSpeech() // お手本再生中なら止める(自分の声とかぶらないように)
    setError('')
    setResult(null)
    setListening(true)
    const r = await recognizeSpeech('zh-CN')
    setListening(false)
    listeningRef.current = false
    if (!r.ok) {
      setError(r.error)
      return
    }
    const ev = evaluatePronunciation(target, r.text)
    setResult({ ...ev, recognized: r.text })
    recordStudy([current.id], src === 'srs')
  }

  const next = () => {
    cancelSpeech()
    setResult(null)
    setError('')
    if (index + 1 >= order.length) {
      setOrder((o) => shuffled(o))
      setIndex(0)
    } else {
      setIndex(index + 1)
    }
  }

  const prev = () => {
    cancelSpeech()
    setResult(null)
    setError('')
    setIndex((i) => (i - 1 + order.length) % Math.max(1, order.length))
  }

  const grade = (g: SrsGrade) => {
    if (!current) return
    gradeItem(current.id, g)
    next()
  }

  if (items.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">発音練習</h1>
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <SourceSelector value={src} onChange={changeSource} />
        </div>
        <EmptyState icon="🎤" message={`「${label}」に教材がありません`} hint="上のセレクターで別の対象を選んでください" />
      </div>
    )
  }

  return (
    <div className="page">
      <h1 className="page-title">発音練習</h1>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <SourceSelector value={src} onChange={changeSource} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          {index + 1} / {order.length}
        </span>
      </div>

      {!available && (
        <div className="error-box">
          この端末のブラウザは音声認識に対応していません(Chrome / Edge をお使いください)。
          お手本の再生と復唱練習はこのままご利用いただけます。
        </div>
      )}

      {current && (
        <div className="card flash-card">
          {/* お手本 */}
          <div className="zh-text" style={{ fontSize: '1.7rem', marginBottom: 6 }}>
            {target}
          </div>
          <div className="pinyin-text" style={{ marginBottom: 4 }}>
            {current.type === 'article' ? '' : current.pinyin}
          </div>
          <div className="ja-text" style={{ marginBottom: 6 }}>
            {current.ja.split('\n')[0]}
          </div>
          {isPartial && <div className="memo-text" style={{ marginBottom: 6 }}>※ 長文のため最初の一文を練習します</div>}

          <div className="btn-row" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <button type="button" className="btn" onClick={playSample}>
              🔊 お手本を聞く
            </button>
            {available && (
              <button
                type="button"
                className={`btn btn-primary ${listening ? 'mic-listening' : ''}`}
                onClick={() => void startMic()}
                disabled={listening}
              >
                {listening ? '🎙 認識中… 話してください' : '🎤 発音する'}
              </button>
            )}
          </div>

          {error && <div className="error-box">{error}</div>}

          {/* 判定結果 */}
          {result && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: scoreInfo(result.score).color }}>
                {result.score}点
              </div>
              <div className="ja-text" style={{ marginBottom: 10 }}>
                {scoreInfo(result.score).comment}
              </div>
              {/* 文字ごとの判定(緑=OK / 橙=声調違い / 赤=不一致) */}
              <div style={{ marginBottom: 8 }}>
                {result.charResults.map((c, i) => (
                  <span key={i} className={`pron-char ${c.status}`}>
                    {c.char}
                  </span>
                ))}
              </div>
              <div className="ja-text" style={{ fontSize: '0.85rem' }}>
                認識された音声: <span className="zh-text" style={{ fontSize: '1rem' }}>{result.recognized}</span>
              </div>
              <div className="memo-text" style={{ marginTop: 4 }}>
                緑=OK / 橙=声調ちがい / 赤=音がちがう(認識精度の都合で厳密ではありません)
              </div>
            </div>
          )}

          {/* 操作 */}
          <div className="btn-row" style={{ justifyContent: 'center', marginBottom: 10 }}>
            <button type="button" className="btn btn-sm" onClick={prev}>
              ⏮ 前へ
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
            <button type="button" className="btn btn-sm" onClick={next}>
              ⏭ 次へ
            </button>
          </div>

          {/* SRS評価(判定後に表示) */}
          {result && (
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
          )}
        </div>
      )}

      <div className="btn-row" style={{ marginTop: 14, justifyContent: 'center' }}>
        <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
      </div>

      <div className="info-box" style={{ marginTop: 14 }}>
        💡 使い方: お手本を聞く → 🎤を押して発音 → 判定を見る。
        音声認識はネット接続が必要です(オフライン時は利用できません)。
        判定は発音チェックの目安です。厳密な採点よりも「声に出す回数」を重視しましょう。
      </div>
    </div>
  )
}

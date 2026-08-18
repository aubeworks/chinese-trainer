// 四声クイズ画面: 単語を聞いて、指定された1文字の声調を当てる
// 出題対象は漢字1〜4文字の教材(主に単語)。多音字対策として
// 単語全体の文脈でピンインを引き、該当文字の声調を正解とする。
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import SourceSelector from '../components/SourceSelector'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { useSourceItems } from '../hooks/useSourceItems'
import { cancelSpeech, speakZh } from '../services/speech'
import { pinyin } from 'pinyin-pro'
import { shuffled } from '../utils'
import type { Item } from '../types'

const TONE_LABELS: { tone: number; label: string; example: string }[] = [
  { tone: 1, label: '1声', example: 'ā ‾' },
  { tone: 2, label: '2声', example: 'á ↗' },
  { tone: 3, label: '3声', example: 'ǎ ˅' },
  { tone: 4, label: '4声', example: 'à ↘' },
  { tone: 0, label: '軽声', example: 'a ・' },
]

interface Question {
  item: Item
  /** 漢字のみの配列 */
  chars: string[]
  /** 出題対象の文字位置 */
  charIndex: number
  /** 正解の声調(0=軽声) */
  answerTone: number
  /** 声調記号付きの完全なピンイン */
  fullPinyin: string
}

/** 教材から出題を作る(作れない教材は null) */
function buildQuestion(item: Item): Question | null {
  const chars = [...item.zh].filter((c) => /[一-鿿]/.test(c))
  if (chars.length === 0 || chars.length > 4) return null
  const nums = pinyin(chars.join(''), { toneType: 'num', type: 'array' })
  const marks = pinyin(chars.join(''), { toneType: 'symbol', type: 'array' })
  if (nums.length !== chars.length) return null
  const charIndex = Math.floor(Math.random() * chars.length)
  const m = /([0-9])$/.exec(nums[charIndex] ?? '')
  const answerTone = Number(m?.[1] ?? 0)
  return { item, chars, charIndex, answerTone, fullPinyin: marks.join(' ') }
}

export default function TonesPage() {
  const { settings, updateItem, recordStudy, touchRecentPack, touchRecentPlaylist } = useApp()
  const { items, label, src } = useSourceItems()
  const [, setParams] = useSearchParams()

  // 出題候補: 漢字1〜4文字の教材(主に単語)
  const candidates = useMemo(() => {
    return items.filter((i) => {
      const n = [...i.zh].filter((c) => /[一-鿿]/.test(c)).length
      return n >= 1 && n <= 4
    })
  }, [items])

  const [order, setOrder] = useState<Item[]>([])
  const [pos, setPos] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [selected, setSelected] = useState<number | null>(null)
  const [score, setScore] = useState({ correct: 0, total: 0 })

  // 候補が変わったら出題順を作り直す
  useEffect(() => {
    setOrder(shuffled(candidates))
    setPos(0)
    setSelected(null)
    setScore({ correct: 0, total: 0 })
  }, [candidates])

  // 現在位置から出題を作る(作れない教材はスキップ)
  useEffect(() => {
    let p = pos
    while (p < order.length) {
      const q = buildQuestion(order[p])
      if (q) {
        setQuestion(q)
        if (p !== pos) setPos(p)
        return
      }
      p++
    }
    setQuestion(null)
  }, [order, pos])

  useEffect(() => () => cancelSpeech(), [])

  const play = useCallback(() => {
    if (!question) return
    cancelSpeech()
    void speakZh(question.item.zh, 1.0, settings.voiceURI)
  }, [question, settings.voiceURI])

  // 出題が変わったら自動再生(初回はブラウザ制限で鳴らない場合があるので🔊ボタンも用意)
  useEffect(() => {
    if (question && selected === null) {
      const t = setTimeout(play, 300)
      return () => clearTimeout(t)
    }
  }, [question, selected, play])

  const answer = (tone: number) => {
    if (!question || selected !== null) return
    setSelected(tone)
    setScore((s) => ({ correct: s.correct + (tone === question.answerTone ? 1 : 0), total: s.total + 1 }))
    recordStudy([question.item.id])
    // 答え合わせとしてもう一度再生
    play()
  }

  const next = () => {
    setSelected(null)
    if (pos + 1 >= order.length) {
      setOrder(shuffled(candidates))
      setPos(0)
    } else {
      setPos(pos + 1)
    }
  }

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

  if (candidates.length === 0) {
    return (
      <div className="page">
        <h1 className="page-title">四声クイズ</h1>
        <div className="btn-row" style={{ marginBottom: 8 }}>
          <SourceSelector value={src} onChange={changeSource} />
        </div>
        <EmptyState
          icon="🎵"
          message={`「${label}」に出題できる単語(漢字1〜4文字)がありません`}
          hint="単語系のパック(化学用語・貿易用語など)を選んでください"
        />
      </div>
    )
  }

  const answered = selected !== null
  const correct = answered && question !== null && selected === question.answerTone

  return (
    <div className="page">
      <h1 className="page-title">四声クイズ</h1>
      <div className="btn-row" style={{ marginBottom: 8 }}>
        <SourceSelector value={src} onChange={changeSource} />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          正解 {score.correct} / {score.total}
        </span>
      </div>

      {question && (
        <div className="card flash-card">
          {/* 出題: 対象の文字をハイライト */}
          <div style={{ marginBottom: 8 }}>
            {question.chars.map((c, i) => (
              <span
                key={i}
                className="zh-text"
                style={{
                  fontSize: '2.2rem',
                  padding: '0 4px',
                  borderBottom: i === question.charIndex ? '4px solid var(--accent)' : '4px solid transparent',
                }}
              >
                {c}
              </span>
            ))}
          </div>
          <div className="ja-text" style={{ marginBottom: 10 }}>
            {question.item.ja.split('\n')[0]}
          </div>
          <div className="flash-timer" style={{ marginBottom: 10 }}>
            下線の字「{question.chars[question.charIndex]}」の声調は?
          </div>
          <div className="btn-row" style={{ justifyContent: 'center', marginBottom: 14 }}>
            <button type="button" className="btn btn-sm" onClick={play}>
              🔊 もう一度聞く
            </button>
          </div>

          {/* 回答ボタン */}
          <div className="btn-row" style={{ justifyContent: 'center', marginBottom: 14 }}>
            {TONE_LABELS.map(({ tone, label: tl, example }) => {
              let cls = 'btn'
              if (answered) {
                if (tone === question.answerTone) cls += ' tone-correct'
                else if (tone === selected) cls += ' tone-wrong'
              }
              return (
                <button key={tone} type="button" className={cls} onClick={() => answer(tone)} disabled={answered}>
                  {tl}
                  <span style={{ fontSize: '0.75rem', opacity: 0.75 }}>{example}</span>
                </button>
              )
            })}
          </div>

          {/* 結果表示 */}
          {answered && question && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: correct ? '#15803d' : '#b91c1c' }}>
                {correct ? '⭕ 正解!' : '❌ 不正解…'}
              </div>
              <div className="pinyin-text" style={{ fontSize: '1.2rem', marginTop: 4 }}>
                {question.fullPinyin}
              </div>
              <div className="btn-row" style={{ justifyContent: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  className={`btn btn-sm ${question.item.weak ? 'active' : ''}`}
                  onClick={() => updateItem(question.item.id, { weak: !question.item.weak })}
                >
                  ⚠ 苦手
                </button>
                <button type="button" className="btn btn-primary" onClick={next}>
                  ⏭ 次の問題
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="info-box" style={{ marginTop: 14 }}>
        💡 音声を聞いて、下線の字の声調(トーン)を選んでください。単語の文脈でのピンインが正解になります
        (多音字は文脈読みで判定)。
      </div>
    </div>
  )
}

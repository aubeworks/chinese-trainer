// 連続再生プレイヤーのフック
// 聞き流し・瞬発練習・長文再生の中核となる再生エンジン。
// 再生モード(中→日→中 / 中国語のみ / 3回 / 高速)に応じて1教材ずつ読み上げ、
// 自動で次の教材へ進む。
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Item, PlayMode } from '../types'
import { cancelSpeech, speakJa, speakZh } from '../services/speech'
import { shuffled } from '../utils'

export interface PlayerOptions {
  items: Item[]
  mode: PlayMode
  rate: number
  voiceURI: string | null
  shuffle: boolean
  repeat: boolean
  /** シャドーイング: 復唱ポーズの長さ倍率 */
  shadowPauseScale?: number
  /** シャドーイング: ポーズ後にもう一度再生する */
  shadowRepeat?: boolean
  /** 1教材の再生が完了するたびに呼ばれる(学習履歴の記録用) */
  onItemPlayed?: (item: Item) => void
}

/** シャドーイングの進行状態 */
export type ShadowPhase = 'none' | 'speak' | 'pause' | 'confirm'

export interface Player {
  /** 再生順に並んだ教材 */
  ordered: Item[]
  index: number
  current: Item | null
  playing: boolean
  /** シャドーイングの進行状態(shadowモード以外では 'none') */
  shadowPhase: ShadowPhase
  /** 復唱ポーズの終了予定時刻(カウントダウン表示用) */
  pauseUntil: number | null
  play: () => void
  pause: () => void
  toggle: () => void
  next: () => void
  prev: () => void
  jumpTo: (index: number) => void
  /** シャッフル順を作り直す */
  reshuffle: () => void
}

/** 教材間の待ち時間(ミリ秒) */
const GAP_MS = 700

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

export function usePlayer(options: PlayerOptions): Player {
  const { items, mode, rate, voiceURI, shuffle, repeat, shadowPauseScale, shadowRepeat, onItemPlayed } = options
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [shuffleSeed, setShuffleSeed] = useState(0)
  const [shadowPhase, setShadowPhase] = useState<ShadowPhase>('none')
  const [pauseUntil, setPauseUntil] = useState<number | null>(null)

  // 再生キャンセル用トークン。値が変わったら進行中のループは停止する。
  const tokenRef = useRef(0)

  // 再生順(シャッフル対応)
  const ordered = useMemo(() => {
    void shuffleSeed
    return shuffle ? shuffled(items) : items
  }, [items, shuffle, shuffleSeed])

  const orderedRef = useRef(ordered)
  orderedRef.current = ordered

  // 最新の設定をループから参照するためのref
  const optsRef = useRef({ mode, rate, voiceURI, repeat, shadowPauseScale, shadowRepeat, onItemPlayed })
  optsRef.current = { mode, rate, voiceURI, repeat, shadowPauseScale, shadowRepeat, onItemPlayed }

  // 教材リストが変わったらインデックスを丸める
  useEffect(() => {
    setIndex((i) => Math.min(i, Math.max(0, ordered.length - 1)))
  }, [ordered])

  // アンマウント時に再生停止
  useEffect(() => {
    return () => {
      tokenRef.current++
      cancelSpeech()
    }
  }, [])

  /** 1教材をモードに応じて読み上げる */
  const playOne = useCallback(async (item: Item, token: number) => {
    const o = optsRef.current
    const alive = () => token === tokenRef.current
    switch (o.mode) {
      case 'zh-ja-zh':
        await speakZh(item.zh, o.rate, o.voiceURI)
        if (!alive()) return
        await sleep(300)
        if (!alive()) return
        await speakJa(item.ja)
        if (!alive()) return
        await sleep(300)
        if (!alive()) return
        await speakZh(item.zh, o.rate, o.voiceURI)
        break
      case 'zh':
        await speakZh(item.zh, o.rate, o.voiceURI)
        break
      case 'zh3':
        for (let n = 0; n < 3; n++) {
          await speakZh(item.zh, o.rate, o.voiceURI)
          if (!alive()) return
          await sleep(400)
          if (!alive()) return
        }
        break
      case 'fast':
        // 高速中国語: 速度設定に関わらず2.0倍で再生
        await speakZh(item.zh, 2.0, o.voiceURI)
        break
      case 'shadow': {
        // シャドーイング: 再生 → 復唱ポーズ → (設定により)もう一度再生
        setShadowPhase('speak')
        const t0 = Date.now()
        await speakZh(item.zh, o.rate, o.voiceURI)
        const measured = Date.now() - t0
        if (!alive()) return
        // 音声が出ない環境でも破綻しないよう、文字数からの推定時間と大きい方を使う
        const estimated = (item.zh.length * 320) / (o.rate || 1)
        const scale = o.shadowPauseScale ?? 1.2
        const pauseMs = Math.max(measured, estimated) * scale + 500
        const until = Date.now() + pauseMs
        setShadowPhase('pause')
        setPauseUntil(until)
        await sleep(pauseMs)
        setPauseUntil(null)
        if (!alive()) return
        if (o.shadowRepeat ?? true) {
          setShadowPhase('confirm')
          await speakZh(item.zh, o.rate, o.voiceURI)
          if (!alive()) return
          // 答え合わせ後、次に進む前に一呼吸
          await sleep(600)
        }
        setShadowPhase('none')
        break
      }
    }
  }, [])

  /** 指定位置から連続再生を開始する */
  const runFrom = useCallback(
    (startIndex: number) => {
      const token = ++tokenRef.current
      cancelSpeech()
      setPlaying(true)
      setShadowPhase('none')
      setPauseUntil(null)
      void (async () => {
        let i = startIndex
        while (true) {
          const list = orderedRef.current
          if (list.length === 0) break
          if (i >= list.length) {
            if (optsRef.current.repeat) {
              i = 0
            } else {
              break
            }
          }
          if (token !== tokenRef.current) return
          setIndex(i)
          const item = list[i]
          await playOne(item, token)
          if (token !== tokenRef.current) return
          optsRef.current.onItemPlayed?.(item)
          await sleep(GAP_MS)
          if (token !== tokenRef.current) return
          i++
        }
        if (token === tokenRef.current) setPlaying(false)
      })()
    },
    [playOne]
  )

  const play = useCallback(() => {
    runFrom(index)
  }, [runFrom, index])

  const pause = useCallback(() => {
    tokenRef.current++
    cancelSpeech()
    setPlaying(false)
    setShadowPhase('none')
    setPauseUntil(null)
  }, [])

  const toggle = useCallback(() => {
    if (playing) {
      pause()
    } else {
      play()
    }
  }, [playing, play, pause])

  const jumpTo = useCallback(
    (i: number) => {
      const len = orderedRef.current.length
      if (len === 0) return
      const clamped = ((i % len) + len) % len
      if (playing) {
        runFrom(clamped)
      } else {
        tokenRef.current++
        cancelSpeech()
        setIndex(clamped)
      }
    },
    [playing, runFrom]
  )

  const next = useCallback(() => jumpTo(index + 1), [jumpTo, index])
  const prev = useCallback(() => jumpTo(index - 1), [jumpTo, index])

  const reshuffle = useCallback(() => {
    setShuffleSeed((s) => s + 1)
    setIndex(0)
  }, [])

  return {
    ordered,
    index,
    current: ordered[index] ?? null,
    playing,
    shadowPhase,
    pauseUntil,
    play,
    pause,
    toggle,
    next,
    prev,
    jumpTo,
    reshuffle,
  }
}

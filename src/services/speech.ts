// 音声再生サービス(Web Speech API)
// 中国語(zh-CN優先)の音声再生を管理する。
// 音声が利用できない場合もアプリは停止させない。

/** 中国語として使える音声か判定する(優先度を返す。0は対象外) */
function zhPriority(voice: SpeechSynthesisVoice): number {
  const lang = voice.lang.toLowerCase().replace('_', '-')
  if (lang === 'zh-cn') return 3
  if (lang.startsWith('zh-hans')) return 2
  if (lang.startsWith('zh')) return 1
  return 0
}

/** 利用可能な中国語音声一覧を取得する(優先度順) */
export function getChineseVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return []
  return window.speechSynthesis
    .getVoices()
    .filter((v) => zhPriority(v) > 0)
    .sort((a, b) => zhPriority(b) - zhPriority(a))
}

/** 音声一覧の読み込みを待つ(ブラウザによっては非同期でロードされる) */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([])
      return
    }
    const voices = getChineseVoices()
    if (voices.length > 0) {
      resolve(voices)
      return
    }
    let done = false
    const finish = () => {
      if (done) return
      done = true
      resolve(getChineseVoices())
    }
    window.speechSynthesis.addEventListener('voiceschanged', finish, { once: true })
    // voiceschangedが発火しないブラウザ対策のタイムアウト
    setTimeout(finish, 2000)
  })
}

export function speechAvailable(): boolean {
  return 'speechSynthesis' in window
}

export interface SpeakOptions {
  lang?: string
  rate?: number
  voiceURI?: string | null
}

/**
 * テキストを読み上げる。読み上げ完了で resolve する。
 * キャンセル(cancelSpeech)された場合も resolve する(rejectしない)。
 */
export function speak(text: string, options: SpeakOptions = {}): Promise<void> {
  return new Promise((resolve) => {
    if (!speechAvailable() || !text.trim()) {
      resolve()
      return
    }
    const u = new SpeechSynthesisUtterance(text)
    u.lang = options.lang ?? 'zh-CN'
    u.rate = options.rate ?? 1.0
    if (options.voiceURI) {
      const voice = window.speechSynthesis.getVoices().find((v) => v.voiceURI === options.voiceURI)
      if (voice) u.voice = voice
    } else if (u.lang.startsWith('zh')) {
      const voices = getChineseVoices()
      if (voices.length > 0) u.voice = voices[0]
    }
    u.onend = () => resolve()
    u.onerror = () => resolve()
    window.speechSynthesis.speak(u)
  })
}

/** 中国語を読み上げる */
export function speakZh(text: string, rate: number, voiceURI: string | null): Promise<void> {
  return speak(text, { lang: 'zh-CN', rate, voiceURI })
}

/** 日本語を読み上げる(訳の読み上げ用) */
export function speakJa(text: string, rate = 1.0): Promise<void> {
  return speak(text, { lang: 'ja-JP', rate: Math.min(rate, 1.2), voiceURI: null })
}

/** 再生を停止する */
export function cancelSpeech(): void {
  if (speechAvailable()) {
    window.speechSynthesis.cancel()
  }
}

// ---- 音声認識(発音判定用) ----
// Web Speech API の SpeechRecognition を使う。
// Chrome/Edge(PC・Android)で動作。認識はクラウド処理のためネット接続が必要。

/** SpeechRecognition の最小限の型定義(lib.domに完全な型がないため) */
interface RecognitionAlternativeLike {
  transcript: string
}
interface RecognitionEventLike {
  results: ArrayLike<ArrayLike<RecognitionAlternativeLike>>
}
interface RecognitionErrorLike {
  error: string
}
interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  onresult: ((e: RecognitionEventLike) => void) | null
  onerror: ((e: RecognitionErrorLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}
type RecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): RecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition as RecognitionCtor | undefined) ??
    (w.webkitSpeechRecognition as RecognitionCtor | undefined) ??
    null
}

/** この環境で音声認識が使えるか */
export function recognitionAvailable(): boolean {
  return typeof window !== 'undefined' && getRecognitionCtor() !== null
}

export type RecognitionResult = { ok: true; text: string } | { ok: false; error: string }

const RECOGNITION_ERRORS: Record<string, string> = {
  'not-allowed': 'マイクの使用が許可されていません。ブラウザの設定でマイクを許可してください。',
  'service-not-allowed': 'この環境では音声認識サービスを利用できません。',
  'no-speech': '音声が検出されませんでした。マイクに向かってもう一度話してください。',
  'audio-capture': 'マイクが見つかりません。マイクの接続を確認してください。',
  network: 'ネットワークエラーです。音声認識はオフラインでは利用できません。',
  aborted: '認識が中断されました。',
}

/**
 * 1回分の発話を音声認識する。結果またはエラーで必ずresolveする(rejectしない)。
 * HTTPS(またはlocalhost)でのみ動作し、初回はマイク許可が必要。
 */
export function recognizeSpeech(lang = 'zh-CN'): Promise<RecognitionResult> {
  return new Promise((resolve) => {
    const Ctor = getRecognitionCtor()
    if (!Ctor) {
      resolve({ ok: false, error: 'この端末のブラウザは音声認識に対応していません。' })
      return
    }
    let settled = false
    const done = (r: RecognitionResult) => {
      if (!settled) {
        settled = true
        resolve(r)
      }
    }
    try {
      const rec = new Ctor()
      rec.lang = lang
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.continuous = false
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript ?? ''
        done(text.trim() ? { ok: true, text: text.trim() } : { ok: false, error: '音声を認識できませんでした。' })
      }
      rec.onerror = (e) => {
        done({ ok: false, error: RECOGNITION_ERRORS[e.error] ?? `音声認識エラー: ${e.error}` })
      }
      // 結果もエラーも来ずに終了した場合(無音など)
      rec.onend = () => done({ ok: false, error: '音声が認識できませんでした。もう一度お試しください。' })
      rec.start()
      // 20秒で強制終了(タイムアウト保険)
      setTimeout(() => {
        if (!settled) {
          try {
            rec.stop()
          } catch {
            /* noop */
          }
        }
      }, 20000)
    } catch {
      done({ ok: false, error: '音声認識を開始できませんでした。' })
    }
  })
}

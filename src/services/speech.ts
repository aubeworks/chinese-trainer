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

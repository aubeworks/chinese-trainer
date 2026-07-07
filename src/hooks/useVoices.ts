// 利用可能な中国語音声を取得するフック
import { useEffect, useState } from 'react'
import { getChineseVoices, speechAvailable, waitForVoices } from '../services/speech'

export function useVoices(): { voices: SpeechSynthesisVoice[]; available: boolean } {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => getChineseVoices())

  useEffect(() => {
    let mounted = true
    void waitForVoices().then((v) => {
      if (mounted) setVoices(v)
    })
    return () => {
      mounted = false
    }
  }, [])

  return { voices, available: speechAvailable() && voices.length > 0 }
}

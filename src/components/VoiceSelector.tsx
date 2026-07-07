// 中国語音声セレクター
import { useVoices } from '../hooks/useVoices'

interface Props {
  value: string | null
  onChange: (voiceURI: string | null) => void
}

export default function VoiceSelector({ value, onChange }: Props) {
  const { voices, available } = useVoices()

  if (!available) {
    return <span className="badge weak">中国語音声が利用できません</span>
  }

  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      aria-label="中国語音声の選択"
    >
      <option value="">自動選択</option>
      {voices.map((v) => (
        <option key={v.voiceURI} value={v.voiceURI}>
          {v.name} ({v.lang})
        </option>
      ))}
    </select>
  )
}

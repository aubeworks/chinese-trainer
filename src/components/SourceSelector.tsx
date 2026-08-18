// 再生・練習対象を選ぶ共通セレクター(聞き流し・発音練習で使用)
// 値は useSourceItems の ?src= と同じ形式:
//   all / queue / srs / weak / favorite / pack:<id> / playlist:<id>
import { useApp } from '../store/AppContext'

interface Props {
  value: string
  onChange: (value: string) => void
}

export default function SourceSelector({ value, onChange }: Props) {
  const { packs, playlists, queue } = useApp()

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label="対象の選択"
      style={{ width: 'auto', maxWidth: '100%' }}
    >
      <option value="all">📚 すべての教材</option>
      <option value="queue">📋 学習キュー ({queue.length})</option>
      <option value="srs">🔁 今日のSRS復習</option>
      <option value="weak">⚠ 苦手</option>
      <option value="favorite">★ お気に入り</option>
      {packs.length > 0 && (
        <optgroup label="教材パック">
          {packs.map((p) => (
            <option key={p.id} value={`pack:${p.id}`}>
              {p.icon} {p.name}
            </option>
          ))}
        </optgroup>
      )}
      {playlists.length > 0 && (
        <optgroup label="プレイリスト">
          {playlists.map((pl) => (
            <option key={pl.id} value={`playlist:${pl.id}`}>
              🎵 {pl.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  )
}

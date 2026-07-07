// 再生速度セレクター(0.8 / 1.0 / 1.2 / 1.5 / 2.0)
import { SPEED_OPTIONS } from '../types'

interface Props {
  value: number
  onChange: (rate: number) => void
}

export default function SpeedSelector({ value, onChange }: Props) {
  return (
    <div className="speed-group" role="group" aria-label="再生速度">
      {SPEED_OPTIONS.map((s) => (
        <button
          key={s}
          type="button"
          className={`btn ${value === s ? 'active' : ''}`}
          onClick={() => onChange(s)}
        >
          {s.toFixed(1)}x
        </button>
      ))}
    </div>
  )
}

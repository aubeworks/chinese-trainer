// 空状態の表示
interface Props {
  icon?: string
  message: string
  hint?: string
}

export default function EmptyState({ icon = '📭', message, hint }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div>{message}</div>
      {hint && <div style={{ fontSize: '0.82rem', marginTop: 6 }}>{hint}</div>}
    </div>
  )
}

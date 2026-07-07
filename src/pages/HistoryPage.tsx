// 学習履歴画面: 件数の表示のみ(分析グラフは不要)
import { useMemo } from 'react'
import { useApp } from '../store/AppContext'
import { todayStr } from '../utils'

export default function HistoryPage() {
  const { history, items } = useApp()

  const today = history.find((h) => h.date === todayStr())
  const totalStudied = useMemo(() => history.reduce((sum, h) => sum + h.studied, 0), [history])
  const srsCount = items.filter((i) => i.srsStatus !== 'new').length
  const weakCount = items.filter((i) => i.weak).length

  const recent = [...history].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)

  return (
    <div className="page">
      <h1 className="page-title">学習履歴</h1>

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-value">{today?.studied ?? 0}</div>
          <div className="stat-label">今日の学習件数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{totalStudied}</div>
          <div className="stat-label">累計学習件数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{items.length}</div>
          <div className="stat-label">累計教材数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{srsCount}</div>
          <div className="stat-label">SRS対象件数</div>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-value">{weakCount}</div>
          <div className="stat-label">苦手件数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">学習した日数</div>
        </div>
      </div>

      <h2 className="section-title">日別の記録</h2>
      {recent.length === 0 ? (
        <div className="info-box">まだ学習記録がありません。聞き流しや瞬発練習を始めましょう。</div>
      ) : (
        recent.map((h) => (
          <div key={h.date} className="queue-row">
            <div style={{ flex: 1 }}>{h.date}</div>
            <span className="badge">学習 {h.studied}件</span>
            <span className="badge">復習 {h.reviewed}件</span>
          </div>
        ))
      )}
    </div>
  )
}

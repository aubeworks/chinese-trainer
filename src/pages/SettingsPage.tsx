// 設定画面: テーマ・音声・速度・RSSプロキシ・データ管理(バックアップ/復元/初期化)
import { useRef, useState } from 'react'
import SpeedSelector from '../components/SpeedSelector'
import VoiceSelector from '../components/VoiceSelector'
import { useApp } from '../store/AppContext'
import { exportAll, parseFullExport } from '../services/importExport'
import { downloadFile, todayStr } from '../utils'
import { speakZh } from '../services/speech'
import type { ThemeMode } from '../types'

export default function SettingsPage() {
  const app = useApp()
  const { settings, updateSettings } = app
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  const backup = () => {
    const json = exportAll({
      packs: app.packs,
      items: app.items,
      playlists: app.playlists,
      settings: app.settings,
      history: app.history,
      queue: app.queue,
    })
    downloadFile(`chinese-trainer-backup-${todayStr()}.json`, json)
  }

  const restore = async (file: File) => {
    setError('')
    setMessage('')
    try {
      const text = await file.text()
      const data = parseFullExport(text)
      if (!confirm('バックアップから復元します。現在のデータは上書きされます。よろしいですか?')) return
      app.restoreFull(data)
      setMessage('復元しました')
    } catch (e) {
      setError(e instanceof Error ? e.message : '復元に失敗しました')
    }
  }

  const reset = async () => {
    if (!confirm('すべてのデータを削除します。よろしいですか?')) return
    const reseed = confirm('サンプル教材を再投入しますか?\nOK: 投入する / キャンセル: 完全に空にする')
    await app.resetAll(reseed)
    setMessage('初期化しました')
  }

  return (
    <div className="page">
      <h1 className="page-title">設定</h1>

      <h2 className="section-title">テーマ</h2>
      <div className="btn-row">
        {(['auto', 'light', 'dark'] as ThemeMode[]).map((t) => (
          <button
            key={t}
            type="button"
            className={`btn ${settings.theme === t ? 'active' : ''}`}
            onClick={() => updateSettings({ theme: t })}
          >
            {t === 'auto' ? '🌗 自動' : t === 'light' ? '☀️ ライト' : '🌙 ダーク'}
          </button>
        ))}
      </div>

      <h2 className="section-title">音声</h2>
      <div className="form-field">
        <label>中国語音声</label>
        <VoiceSelector value={settings.voiceURI} onChange={(voiceURI) => updateSettings({ voiceURI })} />
      </div>
      <div className="form-field">
        <label>再生速度(最後に使った速度が保存されます)</label>
        <SpeedSelector value={settings.rate} onChange={(rate) => updateSettings({ rate })} />
      </div>
      <div className="btn-row">
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => void speakZh('你好,这是语音测试。', settings.rate, settings.voiceURI)}
        >
          🔊 音声テスト
        </button>
      </div>

      <h2 className="section-title">RSS</h2>
      <div className="form-field">
        <label>CORSプロキシ(RSS取得に使用。空欄で直接取得)</label>
        <input
          type="url"
          value={settings.rssProxy}
          onChange={(e) => updateSettings({ rssProxy: e.target.value })}
          placeholder="https://api.allorigins.win/raw?url="
        />
      </div>

      <h2 className="section-title">データ管理</h2>
      {message && <div className="info-box">{message}</div>}
      {error && <div className="error-box">{error}</div>}
      <div className="btn-row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn btn-primary" onClick={backup}>
          💾 全データバックアップ(JSON)
        </button>
        <button type="button" className="btn" onClick={() => fileInput.current?.click()}>
          📥 バックアップから復元
        </button>
        <input
          ref={fileInput}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void restore(f)
            e.target.value = ''
          }}
        />
      </div>
      <div className="info-box">
        教材パック単位のインポート/エクスポートは「教材パック」画面から行えます。
      </div>
      <div className="btn-row">
        <button type="button" className="btn btn-danger" onClick={() => void reset()}>
          🗑 全データ初期化
        </button>
      </div>

      <h2 className="section-title">アプリ情報</h2>
      <div className="info-box">
        Chinese Trainer v1.0.0 - 個人用中国語学習アプリ
        <br />
        データはこの端末のブラウザ内(IndexedDB)にのみ保存されます。
        <br />
        定期的にバックアップを取ることをおすすめします。
      </div>
    </div>
  )
}

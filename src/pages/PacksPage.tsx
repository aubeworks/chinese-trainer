// 教材パック画面: 一覧・作成・編集・削除・インポート(D&D対応)・エクスポート
import { useRef, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import { useApp } from '../store/AppContext'
import { exportPack, importFile } from '../services/importExport'
import { LIBRARY_INDEX, getLibraryPack } from '../data/library'
import { downloadFile } from '../utils'
import type { Pack } from '../types'

const ICON_CHOICES = ['📦', '💼', '🧪', '📰', '💬', '✈️', '🎬', '📖', '🏭', '🚢']
const COLOR_CHOICES = ['#b91c1c', '#0e7490', '#b45309', '#15803d', '#6d28d9', '#be185d']

export default function PacksPage() {
  const { packs, items, addPack, updatePack, removePack, importPackData } = useApp()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Pack | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [icon, setIcon] = useState('📦')
  const [color, setColor] = useState('#b91c1c')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  const countByPack = (packId: string) => items.filter((i) => i.packId === packId).length

  const startEdit = (pack: Pack | null) => {
    setFormOpen(true)
    setEditing(pack)
    setName(pack?.name ?? '')
    setDescription(pack?.description ?? '')
    setIcon(pack?.icon ?? '📦')
    setColor(pack?.color ?? '#b91c1c')
  }

  const saveEdit = () => {
    if (!name.trim()) {
      alert('名称を入力してください')
      return
    }
    if (editing) {
      updatePack(editing.id, { name, description, icon, color })
    } else {
      addPack({ name, description, icon, color })
    }
    setFormOpen(false)
    setEditing(null)
    setName('')
  }

  const del = (pack: Pack) => {
    const count = countByPack(pack.id)
    if (count > 0) {
      const deleteItems = confirm(
        `「${pack.name}」には${count}件の教材があります。\nOK: 教材も削除 / キャンセル: 教材を残してパックのみ削除`
      )
      if (!confirm(`本当に「${pack.name}」を削除しますか?`)) return
      removePack(pack.id, deleteItems)
    } else {
      if (!confirm(`「${pack.name}」を削除しますか?`)) return
      removePack(pack.id, false)
    }
  }

  const doExport = (pack: Pack) => {
    downloadFile(`${pack.name}.json`, exportPack(pack, items))
  }

  /** ファイル(JSON/CSV)をインポートし、追加/重複/スキップ/エラー件数を表示する */
  const handleFiles = async (files: FileList | File[]) => {
    setError('')
    setMessage('')
    const results: string[] = []
    const errors: string[] = []
    for (const file of Array.from(files)) {
      try {
        const text = await file.text()
        const { pack, items: newItems, skipped } = importFile(file.name, text)
        const { added, duplicates } = importPackData(pack, newItems)
        results.push(
          `【${pack.name}】 ${added}件追加 / ${duplicates}件重複 / ${skipped}件スキップ / 0件エラー`
        )
      } catch (e) {
        // インポート失敗時も既存データは保持される
        errors.push(`${file.name}: ${e instanceof Error ? e.message : '読み込みに失敗しました'}(1件エラー)`)
      }
    }
    if (results.length > 0) setMessage(`インポート結果\n${results.join('\n')}`)
    if (errors.length > 0) setError(errors.join('\n'))
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length > 0) void handleFiles(e.dataTransfer.files)
  }

  /** 内蔵ライブラリのパックを追加する */
  const addLibraryPack = (id: string) => {
    const data = getLibraryPack(id)
    if (!data) return
    const { added, duplicates } = importPackData(data.pack, data.items)
    setMessage(`【${data.pack.name}】 ${added}件追加 / ${duplicates}件重複 / 0件スキップ / 0件エラー`)
    setError('')
  }

  /** 内蔵ライブラリをすべて追加する */
  const addAllLibraryPacks = () => {
    const lines: string[] = []
    for (const entry of LIBRARY_INDEX) {
      const data = getLibraryPack(entry.id)
      if (!data) continue
      const { added, duplicates } = importPackData(data.pack, data.items)
      lines.push(`【${data.pack.name}】 ${added}件追加 / ${duplicates}件重複`)
    }
    setMessage(`ライブラリ追加結果\n${lines.join('\n')}`)
    setError('')
  }

  return (
    <div className="page">
      <h1 className="page-title">教材パック</h1>

      {/* インポート */}
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <div>📥 JSON / CSV ファイルをここにドラッグ&ドロップ</div>
        <div style={{ marginTop: 8 }}>
          <button type="button" className="btn btn-sm" onClick={() => fileInput.current?.click()}>
            ファイルを選択
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.csv"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>
      </div>

      {message && <div className="info-box" style={{ whiteSpace: 'pre-line' }}>{message}</div>}
      {error && <div className="error-box" style={{ whiteSpace: 'pre-line' }}>{error}</div>}

      <div className="btn-row" style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-primary" onClick={() => startEdit(null)}>
          + 新規パック作成
        </button>
      </div>

      {/* 作成・編集フォーム */}
      {formOpen && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="form-field">
            <label>名称</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="例: 営業フレーズ" />
          </div>
          <div className="form-field">
            <label>説明</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-field">
            <label>アイコン</label>
            <div className="btn-row">
              {ICON_CHOICES.map((i) => (
                <button
                  key={i}
                  type="button"
                  className={`btn btn-sm ${icon === i ? 'active' : ''}`}
                  onClick={() => setIcon(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>色</label>
            <div className="btn-row">
              {COLOR_CHOICES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    background: c,
                    width: 36,
                    border: color === c ? '3px solid var(--text)' : 'none',
                  }}
                  onClick={() => setColor(c)}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="btn-row">
            <button type="button" className="btn btn-primary" onClick={saveEdit}>
              💾 {editing ? '更新' : '作成'}
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFormOpen(false)
                setEditing(null)
                setName('')
              }}
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 内蔵教材ライブラリ */}
      <h2 className="section-title">📚 内蔵教材ライブラリ</h2>
      <p className="page-sub" style={{ margin: '0 0 10px' }}>
        ワンクリックで追加できる教材集です(合計
        {LIBRARY_INDEX.reduce((sum, e) => sum + e.count, 0)}件)。追加済みでも重複はスキップされます。
      </p>
      <div className="btn-row" style={{ marginBottom: 10 }}>
        <button type="button" className="btn btn-sm btn-primary" onClick={addAllLibraryPacks}>
          ⬇ すべて追加
        </button>
      </div>
      {LIBRARY_INDEX.map((entry) => {
        const added = packs.some((p) => p.id === entry.id)
        return (
          <div
            key={entry.id}
            className="card"
            style={{ marginBottom: 8, borderLeft: `5px solid ${entry.color}`, padding: '10px 14px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>{entry.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  {entry.name} <span className="badge">{entry.count}件</span>
                  {added && <span className="badge fav">追加済み</span>}
                </div>
                <div className="ja-text" style={{ fontSize: '0.8rem' }}>
                  {entry.description}
                </div>
              </div>
              <button type="button" className="btn btn-sm" onClick={() => addLibraryPack(entry.id)}>
                {added ? '↻ 再追加' : '⬇ 追加'}
              </button>
            </div>
          </div>
        )
      })}

      <h2 className="section-title">📦 マイ教材パック</h2>
      {/* パック一覧 */}
      {packs.length === 0 ? (
        <EmptyState message="教材パックがありません" hint="新規作成またはインポートしてください" />
      ) : (
        packs.map((pack) => (
          <div key={pack.id} className="card" style={{ marginBottom: 10, borderLeft: `5px solid ${pack.color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.5rem' }}>{pack.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700 }}>
                  {pack.name}{' '}
                  <span className="badge">{countByPack(pack.id)}件</span>
                  {!pack.enabled && <span className="badge weak">無効</span>}
                </div>
                <div className="ja-text" style={{ fontSize: '0.82rem' }}>
                  {pack.description}
                </div>
              </div>
            </div>
            <div className="item-actions">
              <Link to={`/listen?src=pack:${pack.id}`} className="btn btn-sm">
                🎧 聞き流し
              </Link>
              <button type="button" className="btn btn-sm" onClick={() => startEdit(pack)}>
                ✏️ 編集
              </button>
              <button
                type="button"
                className={`btn btn-sm ${pack.enabled ? '' : 'active'}`}
                onClick={() => updatePack(pack.id, { enabled: !pack.enabled })}
              >
                {pack.enabled ? '⏸ 無効にする' : '▶ 有効にする'}
              </button>
              <button type="button" className="btn btn-sm" onClick={() => doExport(pack)}>
                📤 エクスポート
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => del(pack)}>
                🗑 削除
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}

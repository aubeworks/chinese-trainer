// 端末間同期の実行フック
// runSync() 1回で「ダウンロード → マージ → アップロード」の双方向同期を行う。
import { useCallback, useRef, useState } from 'react'
import { useApp } from '../store/AppContext'
import { downloadSync, findSyncGist, mergeSyncData, uploadSync, type MergeStats } from '../services/sync'
import { nowIso } from '../utils'

export interface SyncOutcome {
  ok: boolean
  message: string
}

export function useSync(): {
  syncing: boolean
  lastOutcome: SyncOutcome | null
  runSync: () => Promise<SyncOutcome>
} {
  const app = useApp()
  const [syncing, setSyncing] = useState(false)
  const [lastOutcome, setLastOutcome] = useState<SyncOutcome | null>(null)
  const busyRef = useRef(false)

  const runSync = useCallback(async (): Promise<SyncOutcome> => {
    const token = app.settings.syncToken.trim()
    if (!token) {
      const out = { ok: false, message: 'GitHubトークンが設定されていません(設定画面で登録してください)' }
      setLastOutcome(out)
      return out
    }
    if (busyRef.current) {
      return { ok: false, message: '同期を実行中です' }
    }
    busyRef.current = true
    setSyncing(true)
    try {
      // 1. 同期先Gistを特定(未保存なら既存を探す)
      let gistId = app.settings.syncGistId
      if (!gistId) {
        gistId = await findSyncGist(token)
      }

      // 2. ダウンロードしてマージ
      let local = {
        packs: app.packs,
        items: app.items,
        playlists: app.playlists,
        history: app.history,
      }
      let stats: MergeStats | null = null
      if (gistId) {
        const cloud = await downloadSync(token, gistId)
        if (cloud) {
          const r = mergeSyncData(local, cloud)
          local = r.merged
          stats = r.stats
          // マージ結果をローカルへ反映(設定・学習キューは触らない)
          app.restoreFull(local)
        }
      }

      // 3. マージ結果をアップロード
      const newGistId = await uploadSync(token, gistId, local)
      app.updateSettings({ syncGistId: newGistId, lastSyncedAt: nowIso() })

      const received = stats ? stats.addedItems + stats.updatedItems : 0
      const message = stats
        ? received > 0
          ? `同期完了: 教材${stats.addedItems}件追加・${stats.updatedItems}件更新を受信し、全体をアップロードしました`
          : '同期完了: 受信する変更はありません(アップロード済み)'
        : '同期完了: クラウドに初回アップロードしました'
      const out = { ok: true, message }
      setLastOutcome(out)
      return out
    } catch (e) {
      const out = { ok: false, message: e instanceof Error ? e.message : '同期に失敗しました' }
      setLastOutcome(out)
      return out
    } finally {
      busyRef.current = false
      setSyncing(false)
    }
  }, [app])

  return { syncing, lastOutcome, runSync }
}

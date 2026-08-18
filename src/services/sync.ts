// 端末間同期サービス(GitHub Gist方式)
// 非公開Gistをクラウド置き場として、教材・パック・プレイリスト・学習履歴を同期する。
//
// 同期の流れ(双方向):
//   1. クラウドからダウンロード
//   2. ローカルとマージ(idごとに updatedAt が新しい方を採用)
//   3. マージ結果をアップロード
//
// 設計上の注意:
// - トークン(gist権限のみ)は端末内にのみ保存し、同期データには含めない
// - 設定と学習キューは端末ごとの状態とみなし、同期対象外
// - 削除は同期されない(片方で削除しても、もう片方に残っていれば復活する)
import type { HistoryEntry, Item, Pack, Playlist } from '../types'
import { DATA_VERSION } from '../types'
import { nowIso } from '../utils'

const GIST_DESCRIPTION = 'chinese-trainer-sync-data'
const GIST_FILENAME = 'chinese-trainer-data.json'
const API = 'https://api.github.com'

/** クラウドに保存する同期データ */
export interface SyncPayload {
  version: number
  syncedAt: string
  packs: Pack[]
  items: Item[]
  playlists: Playlist[]
  history: HistoryEntry[]
}

/** マージ対象のローカルデータ */
export interface SyncLocalData {
  packs: Pack[]
  items: Item[]
  playlists: Playlist[]
  history: HistoryEntry[]
}

/** マージ結果の統計(クラウドから受信した件数) */
export interface MergeStats {
  addedItems: number
  updatedItems: number
  addedPacks: number
  addedPlaylists: number
}

async function ghFetch(token: string, path: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  })
  if (res.status === 401) {
    throw new Error('GitHubトークンが無効です。トークンを確認してください(gist権限が必要です)。')
  }
  if (res.status === 403) {
    throw new Error('GitHub APIの利用が制限されています。しばらく待ってから再試行してください。')
  }
  return res
}

/** トークンが有効か確認する */
export async function verifySyncToken(token: string): Promise<boolean> {
  const res = await ghFetch(token, '/gists?per_page=1')
  return res.ok
}

/** 既存の同期用Gistを探す(別端末で作成済みの場合に自動発見する) */
export async function findSyncGist(token: string): Promise<string | null> {
  const res = await ghFetch(token, '/gists?per_page=100')
  if (!res.ok) throw new Error(`Gist一覧の取得に失敗しました (HTTP ${res.status})`)
  const list = (await res.json()) as { id: string; description: string | null }[]
  return list.find((g) => g.description === GIST_DESCRIPTION)?.id ?? null
}

/** クラウドから同期データをダウンロードする(Gistが無い/空なら null) */
export async function downloadSync(token: string, gistId: string): Promise<SyncPayload | null> {
  const res = await ghFetch(token, `/gists/${gistId}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`ダウンロードに失敗しました (HTTP ${res.status})`)
  const gist = (await res.json()) as {
    files: Record<string, { content: string; truncated: boolean; raw_url: string } | undefined>
  }
  const file = gist.files[GIST_FILENAME]
  if (!file) return null
  let text = file.content
  // 1MBを超えるファイルはAPIレスポンスで切り詰められるため、raw URLから全文を取得する
  if (file.truncated) {
    const raw = await fetch(file.raw_url)
    if (!raw.ok) throw new Error('同期データの取得に失敗しました(raw fetch)')
    text = await raw.text()
  }
  try {
    const data = JSON.parse(text) as SyncPayload
    if (!Array.isArray(data.items)) return null
    return data
  } catch {
    throw new Error('クラウド上の同期データを解析できませんでした。')
  }
}

/** マージ結果をクラウドへアップロードする。GistのIDを返す(初回は新規作成) */
export async function uploadSync(token: string, gistId: string | null, data: SyncLocalData): Promise<string> {
  const payload: SyncPayload = {
    version: DATA_VERSION,
    syncedAt: nowIso(),
    ...data,
  }
  const body = JSON.stringify({
    description: GIST_DESCRIPTION,
    public: false,
    files: { [GIST_FILENAME]: { content: JSON.stringify(payload) } },
  })
  const res = await ghFetch(token, gistId ? `/gists/${gistId}` : '/gists', {
    method: gistId ? 'PATCH' : 'POST',
    body,
  })
  if (res.status === 404 && gistId) {
    // 保存していたGistが削除されていた場合は新規作成し直す
    return uploadSync(token, null, data)
  }
  if (!res.ok) throw new Error(`アップロードに失敗しました (HTTP ${res.status})`)
  const g = (await res.json()) as { id: string }
  return g.id
}

/** id + updatedAt でマージ(クラウド側が新しければ置き換え、無ければ追加) */
function mergeById<T extends { [key: string]: unknown; id: string }>(
  local: T[],
  cloud: T[]
): { result: T[]; added: number; updated: number } {
  const map = new Map(local.map((e) => [e.id, e]))
  let added = 0
  let updated = 0
  for (const c of cloud) {
    const l = map.get(c.id)
    if (!l) {
      map.set(c.id, c)
      added++
    } else {
      const lu = String(l.updatedAt ?? '')
      const cu = String(c.updatedAt ?? '')
      if (cu > lu) {
        map.set(c.id, c)
        updated++
      }
    }
  }
  return { result: [...map.values()], added, updated }
}

/** 学習履歴を日付単位でマージ(件数は大きい方、学習済みIDは和集合) */
function mergeHistory(local: HistoryEntry[], cloud: HistoryEntry[]): HistoryEntry[] {
  const map = new Map(local.map((h) => [h.date, h]))
  for (const c of cloud) {
    const l = map.get(c.date)
    if (!l) {
      map.set(c.date, c)
    } else {
      map.set(c.date, {
        date: c.date,
        studied: Math.max(l.studied, c.studied),
        reviewed: Math.max(l.reviewed, c.reviewed),
        itemIds: [...new Set([...(l.itemIds ?? []), ...(c.itemIds ?? [])])],
      })
    }
  }
  return [...map.values()]
}

/** ローカルとクラウドをマージする */
export function mergeSyncData(
  local: SyncLocalData,
  cloud: SyncPayload
): { merged: SyncLocalData; stats: MergeStats } {
  const packs = mergeById(local.packs, cloud.packs ?? [])
  const items = mergeById(local.items, cloud.items ?? [])
  const playlists = mergeById(local.playlists, cloud.playlists ?? [])
  const history = mergeHistory(local.history, cloud.history ?? [])
  return {
    merged: { packs: packs.result, items: items.result, playlists: playlists.result, history },
    stats: {
      addedItems: items.added,
      updatedItems: items.updated,
      addedPacks: packs.added,
      addedPlaylists: playlists.added,
    },
  }
}

// データ永続化サービス
// 第一候補: IndexedDB(idbライブラリ使用)
// IndexedDBが使えない環境では localStorage へ自動フォールバックする
import { openDB, type IDBPDatabase } from 'idb'
import type { Pack, Item, Playlist, HistoryEntry, Settings } from '../types'

const DB_NAME = 'chinese-trainer'
const DB_VERSION = 1
const STORES = ['packs', 'items', 'playlists', 'history', 'kv'] as const
type StoreName = (typeof STORES)[number]

/** ストレージ共通インターフェース(IndexedDB / localStorage 両実装) */
interface StorageBackend {
  getAll<T>(store: StoreName): Promise<T[]>
  put<T extends { [key: string]: unknown }>(store: StoreName, value: T, key?: string): Promise<void>
  putAll<T extends { [key: string]: unknown }>(store: StoreName, values: T[]): Promise<void>
  delete(store: StoreName, key: string): Promise<void>
  get<T>(store: StoreName, key: string): Promise<T | undefined>
  clear(store: StoreName): Promise<void>
}

/** IndexedDB実装 */
class IdbBackend implements StorageBackend {
  private db: IDBPDatabase

  constructor(db: IDBPDatabase) {
    this.db = db
  }

  static async create(): Promise<IdbBackend> {
    const db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // keyPathなし(putで明示キー指定)にすると kv も同じ扱いにできる
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name)
          }
        }
      },
    })
    return new IdbBackend(db)
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    return (await this.db.getAll(store)) as T[]
  }

  async put<T extends { [key: string]: unknown }>(store: StoreName, value: T, key?: string): Promise<void> {
    await this.db.put(store, value, key ?? (value.id as string) ?? (value.date as string))
  }

  async putAll<T extends { [key: string]: unknown }>(store: StoreName, values: T[]): Promise<void> {
    const tx = this.db.transaction(store, 'readwrite')
    for (const v of values) {
      void tx.store.put(v, (v.id as string) ?? (v.date as string))
    }
    await tx.done
  }

  async delete(store: StoreName, key: string): Promise<void> {
    await this.db.delete(store, key)
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return (await this.db.get(store, key)) as T | undefined
  }

  async clear(store: StoreName): Promise<void> {
    await this.db.clear(store)
  }
}

/** localStorageフォールバック実装(ストア全体を1キーに保存) */
class LocalStorageBackend implements StorageBackend {
  private read(store: StoreName): Record<string, unknown> {
    try {
      return JSON.parse(localStorage.getItem(`ct-${store}`) ?? '{}')
    } catch {
      return {}
    }
  }

  private write(store: StoreName, data: Record<string, unknown>): void {
    localStorage.setItem(`ct-${store}`, JSON.stringify(data))
  }

  async getAll<T>(store: StoreName): Promise<T[]> {
    return Object.values(this.read(store)) as T[]
  }

  async put<T extends { [key: string]: unknown }>(store: StoreName, value: T, key?: string): Promise<void> {
    const data = this.read(store)
    data[key ?? (value.id as string) ?? (value.date as string)] = value
    this.write(store, data)
  }

  async putAll<T extends { [key: string]: unknown }>(store: StoreName, values: T[]): Promise<void> {
    const data = this.read(store)
    for (const v of values) data[(v.id as string) ?? (v.date as string)] = v
    this.write(store, data)
  }

  async delete(store: StoreName, key: string): Promise<void> {
    const data = this.read(store)
    delete data[key]
    this.write(store, data)
  }

  async get<T>(store: StoreName, key: string): Promise<T | undefined> {
    return this.read(store)[key] as T | undefined
  }

  async clear(store: StoreName): Promise<void> {
    localStorage.removeItem(`ct-${store}`)
  }
}

let backend: StorageBackend | null = null

/** バックエンドを初期化(IndexedDB失敗時はlocalStorageへ切替) */
async function getBackend(): Promise<StorageBackend> {
  if (backend) return backend
  try {
    backend = await IdbBackend.create()
  } catch (e) {
    console.warn('IndexedDBが利用できないため localStorage を使用します', e)
    backend = new LocalStorageBackend()
  }
  return backend
}

// ---- 公開API ----

export interface LoadedData {
  packs: Pack[]
  items: Item[]
  playlists: Playlist[]
  history: HistoryEntry[]
  settings: Settings | undefined
  queue: string[]
}

/** 全データを読み込む(失敗しても空の初期状態で返す) */
export async function loadAll(): Promise<LoadedData> {
  try {
    const b = await getBackend()
    const [packs, items, playlists, history, settings, queue] = await Promise.all([
      b.getAll<Pack>('packs'),
      b.getAll<Item>('items'),
      b.getAll<Playlist>('playlists'),
      b.getAll<HistoryEntry>('history'),
      b.get<Settings>('kv', 'settings'),
      b.get<string[]>('kv', 'queue'),
    ])
    return { packs, items, playlists, history, settings, queue: queue ?? [] }
  } catch (e) {
    console.error('データ読み込みに失敗しました。空の状態で起動します。', e)
    return { packs: [], items: [], playlists: [], history: [], settings: undefined, queue: [] }
  }
}

export async function savePack(pack: Pack): Promise<void> {
  const b = await getBackend()
  await b.put('packs', pack)
}

export async function savePacks(packs: Pack[]): Promise<void> {
  const b = await getBackend()
  await b.putAll('packs', packs)
}

export async function deletePack(id: string): Promise<void> {
  const b = await getBackend()
  await b.delete('packs', id)
}

export async function saveItem(item: Item): Promise<void> {
  const b = await getBackend()
  await b.put('items', item)
}

export async function saveItems(items: Item[]): Promise<void> {
  const b = await getBackend()
  await b.putAll('items', items)
}

export async function deleteItem(id: string): Promise<void> {
  const b = await getBackend()
  await b.delete('items', id)
}

export async function savePlaylist(pl: Playlist): Promise<void> {
  const b = await getBackend()
  await b.put('playlists', pl)
}

export async function deletePlaylist(id: string): Promise<void> {
  const b = await getBackend()
  await b.delete('playlists', id)
}

export async function saveHistory(entry: HistoryEntry): Promise<void> {
  const b = await getBackend()
  await b.put('history', entry as unknown as { [key: string]: unknown }, entry.date)
}

export async function saveSettings(settings: Settings): Promise<void> {
  const b = await getBackend()
  await b.put('kv', settings as unknown as { [key: string]: unknown }, 'settings')
}

export async function saveQueue(queue: string[]): Promise<void> {
  const b = await getBackend()
  await b.put('kv', queue as unknown as { [key: string]: unknown }, 'queue')
}

/** 全データを削除(初期化) */
export async function clearAllData(): Promise<void> {
  const b = await getBackend()
  for (const s of STORES) await b.clear(s)
}

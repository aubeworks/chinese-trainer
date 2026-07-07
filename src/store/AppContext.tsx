// アプリ全体の状態管理
// 起動時にIndexedDBから全データを読み込み、変更のたびに永続化する。
// 読み込み失敗時も空の初期状態で起動できるようにする(可用性要件)。
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  FullExport,
  HistoryEntry,
  Item,
  Pack,
  Playlist,
  Settings,
  SrsGrade,
} from '../types'
import * as storage from '../services/storage'
import { applySrsGrade } from '../services/srs'
import { getSampleData } from '../data/sampleData'
import { genId, nowIso, todayStr } from '../utils'

/** デフォルト設定 */
export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  voiceURI: null,
  rate: 1.0,
  playMode: 'zh-ja-zh',
  // RSSはブラウザのCORS制限があるため、既定でパブリックプロキシを利用(設定で変更・削除可)
  rssProxy: 'https://api.allorigins.win/raw?url=',
  rssFeeds: [
    { id: 'rss-bbc', name: 'BBC中文(簡体)', url: 'https://feeds.bbci.co.uk/zhongwen/simp/rss.xml' },
  ],
  flashSeconds: 5,
  recentPlaylistIds: [],
  recentPackIds: [],
}

interface AppState {
  loading: boolean
  packs: Pack[]
  items: Item[]
  playlists: Playlist[]
  history: HistoryEntry[]
  settings: Settings
  queue: string[]
}

interface AppActions {
  // 教材パック
  addPack: (data: Partial<Pack>) => Pack
  updatePack: (id: string, data: Partial<Pack>) => void
  removePack: (id: string, deleteItems: boolean) => void
  importPackData: (pack: Pack, items: Item[]) => void
  // 教材
  addItem: (data: Partial<Item>) => Item
  updateItem: (id: string, data: Partial<Item>) => void
  removeItem: (id: string) => void
  gradeItem: (id: string, grade: SrsGrade) => void
  // プレイリスト
  addPlaylist: (data: Partial<Playlist>) => Playlist
  updatePlaylist: (id: string, data: Partial<Playlist>) => void
  removePlaylist: (id: string) => void
  // 学習キュー
  addToQueue: (itemIds: string[]) => void
  removeFromQueue: (itemId: string) => void
  setQueue: (itemIds: string[]) => void
  clearQueue: () => void
  // 履歴
  recordStudy: (itemIds: string[], reviewed?: boolean) => void
  // 設定
  updateSettings: (data: Partial<Settings>) => void
  touchRecentPack: (packId: string) => void
  touchRecentPlaylist: (playlistId: string) => void
  // データ管理
  restoreFull: (data: Partial<FullExport>) => void
  resetAll: (reseed: boolean) => Promise<void>
}

type AppContextValue = AppState & AppActions

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [packs, setPacks] = useState<Pack[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [queue, setQueueState] = useState<string[]>([])
  const loaded = useRef(false)

  // 起動時に全データを読み込む。初回起動時はサンプルデータを投入する。
  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    void (async () => {
      const data = await storage.loadAll()
      if (data.packs.length === 0 && data.items.length === 0) {
        // 初回起動: サンプルデータを投入
        const sample = getSampleData()
        setPacks(sample.packs)
        setItems(sample.items)
        void storage.savePacks(sample.packs)
        void storage.saveItems(sample.items)
      } else {
        setPacks(data.packs)
        setItems(data.items)
      }
      setPlaylists(data.playlists)
      setHistory(data.history)
      setSettings({ ...DEFAULT_SETTINGS, ...(data.settings ?? {}) })
      setQueueState(data.queue)
      setLoading(false)
    })()
  }, [])

  // ---- 教材パック ----

  const addPack = useCallback((data: Partial<Pack>): Pack => {
    const pack: Pack = {
      id: genId('pack'),
      version: 1,
      name: '新しいパック',
      description: '',
      icon: '📦',
      color: '#b91c1c',
      enabled: true,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data,
    }
    setPacks((prev) => [...prev, pack])
    void storage.savePack(pack)
    return pack
  }, [])

  const updatePack = useCallback((id: string, data: Partial<Pack>) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...data, updatedAt: nowIso() }
        void storage.savePack(next)
        return next
      })
    )
  }, [])

  const removePack = useCallback((id: string, deleteItems: boolean) => {
    setPacks((prev) => prev.filter((p) => p.id !== id))
    void storage.deletePack(id)
    if (deleteItems) {
      setItems((prev) => {
        const removed = prev.filter((i) => i.packId === id)
        for (const i of removed) void storage.deleteItem(i.id)
        return prev.filter((i) => i.packId !== id)
      })
    }
  }, [])

  /** インポートした教材パックを取り込む(既存IDと衝突する場合はマージ) */
  const importPackData = useCallback((pack: Pack, newItems: Item[]) => {
    setPacks((prev) => {
      const exists = prev.some((p) => p.id === pack.id)
      const next = exists ? prev.map((p) => (p.id === pack.id ? { ...p, ...pack, updatedAt: nowIso() } : p)) : [...prev, pack]
      void storage.savePack(pack)
      return next
    })
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]))
      for (const item of newItems) map.set(item.id, item)
      void storage.saveItems(newItems)
      return [...map.values()]
    })
  }, [])

  // ---- 教材 ----

  const addItem = useCallback((data: Partial<Item>): Item => {
    const item: Item = {
      id: genId('item'),
      version: 1,
      packId: '',
      category: 'その他',
      subcategory: '',
      tags: [],
      type: 'sentence',
      difficulty: 2,
      zh: '',
      ja: '',
      pinyin: '',
      memo: '',
      favorite: false,
      weak: false,
      srsStatus: 'new',
      nextReviewAt: null,
      reviewCount: 0,
      source: '手入力',
      author: 'User',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data,
    }
    setItems((prev) => [...prev, item])
    void storage.saveItem(item)
    return item
  }, [])

  const updateItem = useCallback((id: string, data: Partial<Item>) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = { ...i, ...data, updatedAt: nowIso() }
        void storage.saveItem(next)
        return next
      })
    )
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id))
    setQueueState((prev) => {
      const next = prev.filter((qid) => qid !== id)
      void storage.saveQueue(next)
      return next
    })
    void storage.deleteItem(id)
  }, [])

  /** SRS評価を適用する */
  const gradeItem = useCallback((id: string, grade: SrsGrade) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i
        const next = applySrsGrade(i, grade)
        void storage.saveItem(next)
        return next
      })
    )
  }, [])

  // ---- プレイリスト ----

  const addPlaylist = useCallback((data: Partial<Playlist>): Playlist => {
    const pl: Playlist = {
      id: genId('pl'),
      name: '新しいプレイリスト',
      description: '',
      items: [],
      shuffle: false,
      repeat: false,
      favorite: false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data,
    }
    setPlaylists((prev) => [...prev, pl])
    void storage.savePlaylist(pl)
    return pl
  }, [])

  const updatePlaylist = useCallback((id: string, data: Partial<Playlist>) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p
        const next = { ...p, ...data, updatedAt: nowIso() }
        void storage.savePlaylist(next)
        return next
      })
    )
  }, [])

  const removePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id))
    void storage.deletePlaylist(id)
  }, [])

  // ---- 学習キュー ----

  const setQueue = useCallback((itemIds: string[]) => {
    setQueueState(itemIds)
    void storage.saveQueue(itemIds)
  }, [])

  const addToQueue = useCallback((itemIds: string[]) => {
    setQueueState((prev) => {
      const next = [...prev]
      for (const id of itemIds) {
        if (!next.includes(id)) next.push(id)
      }
      void storage.saveQueue(next)
      return next
    })
  }, [])

  const removeFromQueue = useCallback((itemId: string) => {
    setQueueState((prev) => {
      const next = prev.filter((id) => id !== itemId)
      void storage.saveQueue(next)
      return next
    })
  }, [])

  const clearQueue = useCallback(() => {
    setQueueState([])
    void storage.saveQueue([])
  }, [])

  // ---- 学習履歴 ----

  /** 学習を記録する(1日1レコードに集計) */
  const recordStudy = useCallback((itemIds: string[], reviewed = false) => {
    if (itemIds.length === 0) return
    const date = todayStr()
    setHistory((prev) => {
      const existing = prev.find((h) => h.date === date)
      const entry: HistoryEntry = existing
        ? {
            ...existing,
            studied: existing.studied + itemIds.length,
            reviewed: existing.reviewed + (reviewed ? itemIds.length : 0),
            itemIds: [...new Set([...existing.itemIds, ...itemIds])],
          }
        : {
            date,
            studied: itemIds.length,
            reviewed: reviewed ? itemIds.length : 0,
            itemIds: [...new Set(itemIds)],
          }
      void storage.saveHistory(entry)
      return existing ? prev.map((h) => (h.date === date ? entry : h)) : [...prev, entry]
    })
  }, [])

  // ---- 設定 ----

  const updateSettings = useCallback((data: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...data }
      void storage.saveSettings(next)
      return next
    })
  }, [])

  const touchRecentPack = useCallback((packId: string) => {
    setSettings((prev) => {
      const ids = [packId, ...prev.recentPackIds.filter((id) => id !== packId)].slice(0, 5)
      const next = { ...prev, recentPackIds: ids }
      void storage.saveSettings(next)
      return next
    })
  }, [])

  const touchRecentPlaylist = useCallback((playlistId: string) => {
    setSettings((prev) => {
      const ids = [playlistId, ...prev.recentPlaylistIds.filter((id) => id !== playlistId)].slice(0, 5)
      const next = { ...prev, recentPlaylistIds: ids }
      void storage.saveSettings(next)
      return next
    })
  }, [])

  // ---- データ管理 ----

  /** 全データバックアップから復元する */
  const restoreFull = useCallback((data: Partial<FullExport>) => {
    if (data.packs) {
      setPacks(data.packs)
      void storage.savePacks(data.packs)
    }
    if (data.items) {
      setItems(data.items)
      void storage.saveItems(data.items)
    }
    if (data.playlists) {
      setPlaylists(data.playlists)
      for (const p of data.playlists) void storage.savePlaylist(p)
    }
    if (data.history) {
      setHistory(data.history)
      for (const h of data.history) void storage.saveHistory(h)
    }
    if (data.settings) {
      const merged = { ...DEFAULT_SETTINGS, ...data.settings }
      setSettings(merged)
      void storage.saveSettings(merged)
    }
    if (data.queue) {
      setQueueState(data.queue)
      void storage.saveQueue(data.queue)
    }
  }, [])

  /** 全データを初期化する */
  const resetAll = useCallback(async (reseed: boolean) => {
    await storage.clearAllData()
    if (reseed) {
      const sample = getSampleData()
      setPacks(sample.packs)
      setItems(sample.items)
      void storage.savePacks(sample.packs)
      void storage.saveItems(sample.items)
    } else {
      setPacks([])
      setItems([])
    }
    setPlaylists([])
    setHistory([])
    setQueueState([])
    setSettings(DEFAULT_SETTINGS)
    void storage.saveSettings(DEFAULT_SETTINGS)
  }, [])

  const value = useMemo<AppContextValue>(
    () => ({
      loading,
      packs,
      items,
      playlists,
      history,
      settings,
      queue,
      addPack,
      updatePack,
      removePack,
      importPackData,
      addItem,
      updateItem,
      removeItem,
      gradeItem,
      addPlaylist,
      updatePlaylist,
      removePlaylist,
      addToQueue,
      removeFromQueue,
      setQueue,
      clearQueue,
      recordStudy,
      updateSettings,
      touchRecentPack,
      touchRecentPlaylist,
      restoreFull,
      resetAll,
    }),
    [
      loading, packs, items, playlists, history, settings, queue,
      addPack, updatePack, removePack, importPackData,
      addItem, updateItem, removeItem, gradeItem,
      addPlaylist, updatePlaylist, removePlaylist,
      addToQueue, removeFromQueue, setQueue, clearQueue,
      recordStudy, updateSettings, touchRecentPack, touchRecentPlaylist,
      restoreFull, resetAll,
    ]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

/** アプリ状態へアクセスするフック */
export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

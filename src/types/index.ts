// アプリ全体で使う主要データ型の定義
// 将来の拡張に備え、未知のプロパティも保持できるように index signature を持たせる

/** 教材種類: 単語 / 短文 / 長文 */
export type ItemType = 'word' | 'sentence' | 'article'

/** SRS状態 */
export type SrsStatus = 'new' | 'review' | 'mastered'

/** SRS評価: まだ苦手 / 普通 / 覚えた */
export type SrsGrade = 'again' | 'good' | 'easy'

/** 再生モード */
export type PlayMode = 'zh-ja-zh' | 'zh' | 'zh3' | 'fast'

/** テーマ */
export type ThemeMode = 'light' | 'dark' | 'auto'

/** 教材パック */
export interface Pack {
  id: string
  version: number
  name: string
  description: string
  icon: string
  color: string
  enabled: boolean
  createdAt: string
  updatedAt: string
  /** 未知の項目を破棄せず保持する */
  [key: string]: unknown
}

/** 教材(最小単位) */
export interface Item {
  id: string
  version: number
  packId: string
  category: string
  subcategory: string
  tags: string[]
  type: ItemType
  difficulty: number
  zh: string
  ja: string
  pinyin: string
  memo: string
  favorite: boolean
  weak: boolean
  srsStatus: SrsStatus
  nextReviewAt: string | null
  reviewCount: number
  source: string
  author: string
  createdAt: string
  updatedAt: string
  /** 未知の項目を破棄せず保持する */
  [key: string]: unknown
}

/** プレイリスト(教材IDの参照のみ保持) */
export interface Playlist {
  id: string
  name: string
  description: string
  /** 教材ID配列 */
  items: string[]
  shuffle: boolean
  repeat: boolean
  favorite: boolean
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

/** RSSフィード設定 */
export interface RssFeed {
  id: string
  name: string
  url: string
}

/** RSS記事(取得結果、保存はしない) */
export interface RssArticle {
  title: string
  description: string
  link: string
  pubDate: string
}

/** 学習履歴(1日1レコード) */
export interface HistoryEntry {
  /** YYYY-MM-DD */
  date: string
  /** 学習件数(再生・回答した数) */
  studied: number
  /** SRS復習件数 */
  reviewed: number
  /** 今日学習した教材ID(重複なし) */
  itemIds: string[]
}

/** アプリ設定 */
export interface Settings {
  theme: ThemeMode
  /** 選択中の音声のvoiceURI(nullなら自動選択) */
  voiceURI: string | null
  /** 再生速度 */
  rate: number
  /** 再生モード */
  playMode: PlayMode
  /** RSS取得に使うCORSプロキシ(空なら直接fetch) */
  rssProxy: string
  /** RSSフィード一覧 */
  rssFeeds: RssFeed[]
  /** 瞬発練習の制限時間(秒) */
  flashSeconds: number
  /** 最近使ったプレイリストID */
  recentPlaylistIds: string[]
  /** 最近使った教材パックID */
  recentPackIds: string[]
  /** 最終バックアップ日時(ISO文字列。未実施はnull) */
  lastBackupAt: string | null
}

/** JSONエクスポート形式(教材パック単位) */
export interface PackExport {
  version: number
  pack: Pack
  items: Item[]
}

/** JSONエクスポート形式(全データ) */
export interface FullExport {
  version: number
  exportedAt: string
  packs: Pack[]
  items: Item[]
  playlists: Playlist[]
  settings: Settings
  history: HistoryEntry[]
  queue: string[]
}

/** 対応する再生速度 */
export const SPEED_OPTIONS = [0.8, 1.0, 1.2, 1.5, 2.0] as const

/** 難易度ラベル */
export const DIFFICULTY_LABELS: Record<number, string> = {
  1: '初級',
  2: '初中級',
  3: '中級',
  4: '中上級',
  5: '上級',
}

/** 教材種類ラベル */
export const TYPE_LABELS: Record<ItemType, string> = {
  word: '単語',
  sentence: '短文',
  article: '長文',
}

/** SRS状態ラベル */
export const SRS_LABELS: Record<SrsStatus, string> = {
  new: '未学習',
  review: '復習中',
  mastered: '習得済み',
}

/** 再生モードラベル */
export const PLAY_MODE_LABELS: Record<PlayMode, string> = {
  'zh-ja-zh': '中→日→中',
  zh: '中国語のみ',
  zh3: '中国語3回',
  fast: '高速中国語',
}

/** データバージョン(JSON互換性管理用) */
export const DATA_VERSION = 1

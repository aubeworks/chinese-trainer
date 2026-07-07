// インポート / エクスポートサービス
// JSON(標準形式)とCSVに対応する。
// バージョン違いのデータも可能な限り読み込み、未知の項目は破棄せず保持する。
import Papa from 'papaparse'
import type { FullExport, Item, ItemType, Pack, PackExport, SrsStatus } from '../types'
import { DATA_VERSION } from '../types'
import { genId, nowIso } from '../utils'
import { ensurePinyin } from './pinyin'

/** インポート結果 */
export interface ImportResult {
  pack: Pack
  items: Item[]
}

const VALID_TYPES: ItemType[] = ['word', 'sentence', 'article']
const VALID_SRS: SrsStatus[] = ['new', 'review', 'mastered']

/** 値を文字列に正規化 */
function str(v: unknown, fallback = ''): string {
  if (typeof v === 'string') return v
  if (typeof v === 'number') return String(v)
  return fallback
}

/** タグを配列に正規化(文字列なら区切り文字で分割) */
function toTags(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((t) => str(t)).filter(Boolean)
  if (typeof v === 'string' && v.trim()) {
    return v.split(/[;|、,,/]/).map((t) => t.trim()).filter(Boolean)
  }
  return []
}

/**
 * 生データを教材(Item)へ正規化する。
 * 未知の項目は破棄せずそのまま保持する(将来互換性のため)。
 */
export function normalizeItem(raw: Record<string, unknown>, packId: string): Item | null {
  const zh = str(raw.zh).trim()
  if (!zh) return null // 中国語がない行は教材として無効

  const type = VALID_TYPES.includes(raw.type as ItemType) ? (raw.type as ItemType) : 'sentence'
  const srsStatus = VALID_SRS.includes(raw.srsStatus as SrsStatus) ? (raw.srsStatus as SrsStatus) : 'new'
  const difficulty = Math.min(5, Math.max(1, Number(raw.difficulty) || 2))

  return {
    ...raw, // 未知項目を保持
    id: str(raw.id) || genId('item'),
    version: Number(raw.version) || 1,
    packId,
    category: str(raw.category, 'その他'),
    subcategory: str(raw.subcategory),
    tags: toTags(raw.tags),
    type,
    difficulty,
    zh,
    ja: str(raw.ja),
    pinyin: ensurePinyin(zh, str(raw.pinyin)),
    memo: str(raw.memo),
    favorite: Boolean(raw.favorite),
    weak: Boolean(raw.weak),
    srsStatus,
    nextReviewAt: typeof raw.nextReviewAt === 'string' ? raw.nextReviewAt : null,
    reviewCount: Number(raw.reviewCount) || 0,
    source: str(raw.source, 'インポート'),
    author: str(raw.author, 'User'),
    createdAt: str(raw.createdAt) || nowIso(),
    updatedAt: str(raw.updatedAt) || nowIso(),
  }
}

/** 生データを教材パック(Pack)へ正規化する */
export function normalizePack(raw: Record<string, unknown>, fallbackName: string): Pack {
  return {
    ...raw,
    id: str(raw.id) || genId('pack'),
    version: Number(raw.version) || 1,
    name: str(raw.name) || fallbackName,
    description: str(raw.description),
    icon: str(raw.icon, '📦'),
    color: str(raw.color, '#b91c1c'),
    enabled: raw.enabled === undefined ? true : Boolean(raw.enabled),
    createdAt: str(raw.createdAt) || nowIso(),
    updatedAt: str(raw.updatedAt) || nowIso(),
  }
}

/**
 * JSONテキストをインポートする。
 * 対応形式:
 * 1. { version, pack, items } … 標準の教材パック形式
 * 2. [ {...}, {...} ]          … 教材の配列(新規パックを作成)
 * 3. { items: [...] }          … packなし(新規パックを作成)
 * バージョンが違っても可能な限り読み込む。
 */
export function importJson(text: string, fallbackName: string): ImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSONの解析に失敗しました。ファイル形式を確認してください。')
  }

  let rawPack: Record<string, unknown> = {}
  let rawItems: unknown[] = []

  if (Array.isArray(data)) {
    rawItems = data
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (obj.pack && typeof obj.pack === 'object') rawPack = obj.pack as Record<string, unknown>
    if (Array.isArray(obj.items)) rawItems = obj.items
    // 単一教材オブジェクトの可能性
    if (rawItems.length === 0 && typeof obj.zh === 'string') rawItems = [obj]
  }

  if (rawItems.length === 0) {
    throw new Error('教材データが見つかりませんでした。items配列を確認してください。')
  }

  const pack = normalizePack(rawPack, fallbackName)
  const items = rawItems
    .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
    .map((r) => normalizeItem(r, pack.id))
    .filter((i): i is Item => i !== null)

  if (items.length === 0) {
    throw new Error('有効な教材がありませんでした。各教材に zh(中国語)が必要です。')
  }

  return { pack, items }
}

/**
 * CSVテキストをインポートする。
 * 列: category, type, zh, ja, pinyin, memo, difficulty, tags
 */
export function importCsv(text: string, fallbackName: string): ImportResult {
  const result = Papa.parse<Record<string, unknown>>(text.replace(/^﻿/, ''), {
    header: true,
    skipEmptyLines: true,
  })
  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(`CSVの解析に失敗しました: ${result.errors[0].message}`)
  }

  const pack = normalizePack({}, fallbackName)
  const items = result.data
    .map((row) => normalizeItem(row, pack.id))
    .filter((i): i is Item => i !== null)

  if (items.length === 0) {
    throw new Error('有効な教材がありませんでした。zh列(中国語)が必要です。')
  }

  return { pack, items }
}

/** ファイル名と内容からJSON/CSVを自動判別してインポートする */
export function importFile(filename: string, text: string): ImportResult {
  const base = filename.replace(/\.(json|csv)$/i, '')
  if (/\.csv$/i.test(filename)) return importCsv(text, base)
  if (/\.json$/i.test(filename)) return importJson(text, base)
  // 拡張子不明の場合は内容で判別
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return importJson(text, base)
  return importCsv(text, base)
}

/** 教材パック単位のエクスポートJSONを作る */
export function exportPack(pack: Pack, items: Item[]): string {
  const data: PackExport = {
    version: DATA_VERSION,
    pack,
    items: items.filter((i) => i.packId === pack.id),
  }
  return JSON.stringify(data, null, 2)
}

/** 全データバックアップJSONを作る */
export function exportAll(data: Omit<FullExport, 'version' | 'exportedAt'>): string {
  const full: FullExport = {
    version: DATA_VERSION,
    exportedAt: nowIso(),
    ...data,
  }
  return JSON.stringify(full, null, 2)
}

/** 全データバックアップJSONを読み込む */
export function parseFullExport(text: string): Partial<FullExport> {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('JSONの解析に失敗しました。')
  }
  if (!data || typeof data !== 'object' || !Array.isArray((data as FullExport).packs)) {
    throw new Error('全データバックアップ形式ではありません。')
  }
  return data as Partial<FullExport>
}

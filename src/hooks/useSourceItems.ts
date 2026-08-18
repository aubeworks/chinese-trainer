// 再生対象の教材リストをURLクエリ(?src=...)から解決するフック
// 聞き流し・瞬発練習・発音練習・四声クイズで共通利用する。
// 例: /listen?src=queue, /listen?src=playlist:xxx, /listen?src=pack:xxx,
//     /listen?src=srs, /listen?src=weak, /listen?src=favorite, /listen?src=smart, /listen?src=all
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Item } from '../types'
import { useApp } from '../store/AppContext'
import { getDueItems } from '../services/srs'
import { shuffled } from '../utils'

/** おまかせミックスの出題数 */
const SMART_MIX_SIZE = 30

/**
 * おまかせミックスを作る。
 * 優先度: 今日のSRS復習 → 苦手 → 未学習 → その他、の順に重み付けして
 * 合計30件を選び、最後に全体をシャッフルする。
 */
function buildSmartMix(enabled: Item[]): Item[] {
  const due = getDueItems(enabled)
  const dueIds = new Set(due.map((i) => i.id))
  const weak = enabled.filter((i) => i.weak && !dueIds.has(i.id))
  const weakIds = new Set(weak.map((i) => i.id))
  const fresh = enabled.filter((i) => i.srsStatus === 'new' && !dueIds.has(i.id) && !weakIds.has(i.id))
  const freshIds = new Set(fresh.map((i) => i.id))
  const rest = enabled.filter((i) => !dueIds.has(i.id) && !weakIds.has(i.id) && !freshIds.has(i.id))

  const picked: Item[] = [
    ...shuffled(due).slice(0, 12),
    ...shuffled(weak).slice(0, 8),
    ...shuffled(fresh).slice(0, 6),
  ]
  // 残り枠を未学習→その他の順で埋める
  const pickedIds = new Set(picked.map((i) => i.id))
  const filler = [...shuffled(fresh), ...shuffled(rest)].filter((i) => !pickedIds.has(i.id))
  picked.push(...filler.slice(0, Math.max(0, SMART_MIX_SIZE - picked.length)))
  return shuffled(picked)
}

export interface SourceResult {
  /** 対象の教材 */
  items: Item[]
  /** 表示用ラベル */
  label: string
  /** 現在のsrc値 */
  src: string
}

export function useSourceItems(): SourceResult {
  const { items, packs, playlists, queue } = useApp()
  const [params] = useSearchParams()
  const src = params.get('src') ?? 'all'

  return useMemo(() => {
    const enabledPackIds = new Set(packs.filter((p) => p.enabled).map((p) => p.id))
    // 無効な教材パックの教材は再生対象外(パック未所属は対象に含める)
    const enabled = items.filter((i) => !i.packId || enabledPackIds.has(i.packId))
    const byId = new Map(items.map((i) => [i.id, i]))

    if (src === 'queue') {
      const list = queue.map((id) => byId.get(id)).filter((i): i is Item => !!i)
      return { items: list, label: '学習キュー', src }
    }
    if (src === 'smart') {
      return { items: buildSmartMix(enabled), label: 'おまかせミックス', src }
    }
    if (src === 'srs') {
      return { items: getDueItems(enabled), label: '今日のSRS復習', src }
    }
    if (src === 'weak') {
      return { items: enabled.filter((i) => i.weak), label: '苦手', src }
    }
    if (src === 'favorite') {
      return { items: enabled.filter((i) => i.favorite), label: 'お気に入り', src }
    }
    if (src.startsWith('playlist:')) {
      const pl = playlists.find((p) => p.id === src.slice(9))
      if (pl) {
        const list = pl.items.map((id) => byId.get(id)).filter((i): i is Item => !!i)
        return { items: list, label: `プレイリスト: ${pl.name}`, src }
      }
    }
    if (src.startsWith('pack:')) {
      const pack = packs.find((p) => p.id === src.slice(5))
      if (pack) {
        return { items: items.filter((i) => i.packId === pack.id), label: `パック: ${pack.name}`, src }
      }
    }
    return { items: enabled, label: 'すべての教材', src: 'all' }
  }, [src, items, packs, playlists, queue])
}

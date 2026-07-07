// 再生対象の教材リストをURLクエリ(?src=...)から解決するフック
// 聞き流し・瞬発練習で共通利用する。
// 例: /listen?src=queue, /listen?src=playlist:xxx, /listen?src=pack:xxx,
//     /listen?src=srs, /listen?src=weak, /listen?src=favorite, /listen?src=all
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Item } from '../types'
import { useApp } from '../store/AppContext'
import { getDueItems } from '../services/srs'

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

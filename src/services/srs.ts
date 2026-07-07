// 簡易SRS(間隔反復)ロジック
// Ankiほど複雑にせず、3段階評価でシンプルに管理する
import type { Item, SrsGrade } from '../types'
import { daysLater, isDueToday, nowIso } from '../utils'

/**
 * SRS評価を適用した教材を返す。
 * まだ苦手(again) → review / 翌日
 * 普通(good)     → review / 数日後(復習回数に応じて 3〜7日)
 * 覚えた(easy)   → mastered / 14日後に念のため再確認
 */
export function applySrsGrade(item: Item, grade: SrsGrade): Item {
  const reviewCount = item.reviewCount + 1
  let srsStatus = item.srsStatus
  let nextReviewAt: string | null = item.nextReviewAt
  let weak = item.weak

  if (grade === 'again') {
    srsStatus = 'review'
    nextReviewAt = daysLater(1)
    weak = true
  } else if (grade === 'good') {
    srsStatus = 'review'
    nextReviewAt = daysLater(Math.min(3 + reviewCount, 7))
  } else {
    srsStatus = 'mastered'
    nextReviewAt = daysLater(14)
    weak = false
  }

  return { ...item, srsStatus, nextReviewAt, reviewCount, weak, updatedAt: nowIso() }
}

/** 今日復習予定の教材を抽出する */
export function getDueItems(items: Item[]): Item[] {
  return items.filter((i) => i.srsStatus !== 'new' && isDueToday(i.nextReviewAt))
}

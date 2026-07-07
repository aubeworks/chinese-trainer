// 汎用ユーティリティ

/** ユニークIDを生成する(タイムスタンプ+乱数) */
export function genId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}-${Date.now().toString(36)}${rand}`
}

/** 現在時刻のISO文字列 */
export function nowIso(): string {
  return new Date().toISOString()
}

/** 今日の日付 YYYY-MM-DD(ローカルタイム) */
export function todayStr(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** n日後の日付のISO文字列(その日の0時) */
export function daysLater(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** 配列をシャッフルした新しい配列を返す(Fisher-Yates) */
export function shuffled<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** ISO日時が今日以前(=期限到来)かどうか */
export function isDueToday(iso: string | null): boolean {
  if (!iso) return false
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  return new Date(iso) <= end
}

/** ISO日時を「YYYY-MM-DD HH:mm」形式に整形する */
export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${todayStr(d)} ${h}:${m}`
}

/** ISO日時が今日かどうか */
export function isToday(iso: string): boolean {
  if (!iso) return false
  return todayStr(new Date(iso)) === todayStr()
}

/** テキストをクリップボードへコピー */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** ファイルをダウンロードさせる */
export function downloadFile(filename: string, content: string, mime = 'application/json'): void {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** HTML文字列をプレーンテキスト化(タグ実行防止・セキュリティ対策) */
export function htmlToText(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/** 中国語テキストを文単位に分割する */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[。!?!?;;…])/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/** テキストを段落単位に分割する */
export function splitParagraphs(text: string): string[] {
  return text
    .split(/\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

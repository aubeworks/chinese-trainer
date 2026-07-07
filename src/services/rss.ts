// RSS取得・解析サービス
// 取得内容はテキストとして扱い、HTMLをそのまま実行しない(セキュリティ対策)。
// ブラウザのCORS制限があるため、設定でCORSプロキシを指定できる。
import type { RssArticle } from '../types'
import { htmlToText } from '../utils'

/** RSSフィードを取得して記事一覧を返す。失敗時はErrorをthrowする。 */
export async function fetchRss(url: string, proxy: string): Promise<RssArticle[]> {
  const targets: string[] = []
  if (proxy.trim()) {
    targets.push(proxy.trim() + encodeURIComponent(url))
  }
  targets.push(url) // プロキシ失敗時は直接取得も試す

  let lastError: Error | null = null
  for (const target of targets) {
    try {
      const res = await fetch(target)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const text = await res.text()
      return parseRssXml(text)
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw new Error(`RSSの取得に失敗しました: ${lastError?.message ?? '不明なエラー'}`)
}

/** RSS(RSS2.0 / Atom)のXMLを解析する */
export function parseRssXml(xml: string): RssArticle[] {
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) {
    throw new Error('RSSの解析に失敗しました(XML形式エラー)')
  }

  const articles: RssArticle[] = []

  // RSS 2.0
  doc.querySelectorAll('item').forEach((item) => {
    articles.push({
      title: htmlToText(item.querySelector('title')?.textContent ?? ''),
      description: htmlToText(item.querySelector('description')?.textContent ?? ''),
      link: item.querySelector('link')?.textContent?.trim() ?? '',
      pubDate: item.querySelector('pubDate')?.textContent?.trim() ?? '',
    })
  })

  // Atom
  if (articles.length === 0) {
    doc.querySelectorAll('entry').forEach((entry) => {
      articles.push({
        title: htmlToText(entry.querySelector('title')?.textContent ?? ''),
        description: htmlToText(
          entry.querySelector('summary')?.textContent ?? entry.querySelector('content')?.textContent ?? ''
        ),
        link: entry.querySelector('link')?.getAttribute('href') ?? '',
        pubDate: entry.querySelector('updated')?.textContent?.trim() ?? '',
      })
    })
  }

  if (articles.length === 0) {
    throw new Error('記事が見つかりませんでした')
  }
  return articles
}

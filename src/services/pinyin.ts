// ピンイン生成サービス(pinyin-proを使用)
// 第一優先: 声調記号付き / 第二優先: 数字四声
import { pinyin } from 'pinyin-pro'

/** 中国語テキストから声調記号付きピンインを生成する */
export function toPinyin(zh: string): string {
  try {
    return pinyin(zh, { toneType: 'symbol', nonZh: 'consecutive' })
  } catch {
    // 生成失敗時は数字四声を試す
    return toPinyinNumeric(zh)
  }
}

/** 数字四声付きピンインを生成する */
export function toPinyinNumeric(zh: string): string {
  try {
    return pinyin(zh, { toneType: 'num', nonZh: 'consecutive' })
  } catch {
    return ''
  }
}

/** ピンインが未設定なら自動生成して返す(既存値優先) */
export function ensurePinyin(zh: string, existing?: string): string {
  if (existing && existing.trim().length > 0) return existing
  return toPinyin(zh)
}

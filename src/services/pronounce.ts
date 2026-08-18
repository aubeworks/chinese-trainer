// 発音判定サービス
// 音声認識の結果テキストとお手本を「ピンイン音節」で比較して採点する。
// 漢字そのままの比較だと同音異字で不当に減点されるため、
// 音(声母+韻母)と声調を分けて評価する。
// - 音も声調も一致 → 正解
// - 音は一致・声調違い → 部分点(四声ミスの検出)
// - 音が不一致 → 不正解
import { pinyin } from 'pinyin-pro'

/** 1音節: base=声調を除いたピンイン, tone=声調(0=軽声) */
interface Syllable {
  base: string
  tone: number
}

export type CharStatus = 'ok' | 'tone' | 'wrong'

export interface PronounceEval {
  /** 0〜100 のスコア */
  score: number
  /** お手本の漢字1文字ごとの判定 */
  charResults: { char: string; status: CharStatus }[]
}

/** 中国語文字列から漢字配列と音節配列を得る(記号・非漢字は除外) */
function toSyllables(text: string): { chars: string[]; sylls: Syllable[] } {
  const chars = [...text].filter((c) => /[一-鿿]/.test(c))
  if (chars.length === 0) return { chars: [], sylls: [] }
  const arr = pinyin(chars.join(''), { toneType: 'num', type: 'array' })
  const sylls: Syllable[] = arr.map((s) => {
    const m = /^([a-zü]+)([0-9])?$/i.exec(s)
    return { base: (m?.[1] ?? s).toLowerCase(), tone: Number(m?.[2] ?? 0) }
  })
  return { chars, sylls }
}

/** 音節同士の一致度: 2=完全一致, 1=音のみ一致(声調違い), 0=不一致 */
function matchScore(a: Syllable, b: Syllable): number {
  if (a.base !== b.base) return 0
  return a.tone === b.tone ? 2 : 1
}

/**
 * お手本(target)と認識結果(recognized)を比較して採点する。
 * 音節列を編集距離ベースでアライメントし、
 * お手本側の各文字に ok / tone(声調違い) / wrong を割り当てる。
 */
export function evaluatePronunciation(target: string, recognized: string): PronounceEval {
  const t = toSyllables(target)
  const r = toSyllables(recognized)
  const n = t.sylls.length
  const m = r.sylls.length

  if (n === 0) {
    return { score: 0, charResults: [] }
  }
  if (m === 0) {
    return { score: 0, charResults: t.chars.map((char) => ({ char, status: 'wrong' as CharStatus })) }
  }

  // DPで最大一致スコアを求める(ギャップペナルティ0の局所ではなく大域アライメント)
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      const diag = dp[i - 1][j - 1] + matchScore(t.sylls[i - 1], r.sylls[j - 1])
      dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1], diag)
    }
  }

  // バックトラックしてお手本側の各音節の判定を得る
  const statuses: CharStatus[] = new Array<CharStatus>(n).fill('wrong')
  let i = n
  let j = m
  while (i > 0 && j > 0) {
    const s = matchScore(t.sylls[i - 1], r.sylls[j - 1])
    if (dp[i][j] === dp[i - 1][j - 1] + s && s > 0) {
      statuses[i - 1] = s === 2 ? 'ok' : 'tone'
      i--
      j--
    } else if (dp[i][j] === dp[i - 1][j]) {
      i--
    } else if (dp[i][j] === dp[i][j - 1]) {
      j--
    } else {
      i--
      j--
    }
  }

  // スコア: 完全一致=1点, 声調違い=0.5点。余分な発話(認識側が長い)も軽く減点
  const points = statuses.reduce((sum, st) => sum + (st === 'ok' ? 1 : st === 'tone' ? 0.5 : 0), 0)
  const lengthPenalty = Math.max(n, m)
  const score = Math.round((points / lengthPenalty) * 100)

  return {
    score: Math.max(0, Math.min(100, score)),
    charResults: t.chars.map((char, idx) => ({ char, status: statuses[idx] ?? 'wrong' })),
  }
}

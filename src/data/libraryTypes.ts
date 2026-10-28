// 内蔵教材ライブラリのエントリ型(library.ts と extra/*.ts で共有)
//   [種類('w'=word/'s'=sentence/'a'=article), カテゴリ, サブカテゴリ, 中国語, 日本語, 難易度, タグ?]
export type Entry = [
  t: 'w' | 's' | 'a',
  category: string,
  subcategory: string,
  zh: string,
  ja: string,
  difficulty: number,
  tags?: string[],
]

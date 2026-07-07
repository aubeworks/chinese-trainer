// 初回起動時に投入するサンプル教材データ
// ピンインは起動時に pinyin-pro で自動生成される(normalizeItem経由)
import type { Item, Pack } from '../types'
import { normalizeItem, normalizePack } from '../services/importExport'

interface RawSeed {
  pack: Record<string, unknown>
  items: Record<string, unknown>[]
}

const seeds: RawSeed[] = [
  {
    pack: {
      id: 'pack-chemistry',
      name: '化学・貿易用語',
      description: '化学品・貿易実務の頻出単語',
      icon: '🧪',
      color: '#0e7490',
    },
    items: [
      { type: 'word', category: '化学', subcategory: '材料', zh: '铜箔', ja: '銅箔', tags: ['銅箔'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '化学', subcategory: '溶剤', zh: '异丙醇', ja: 'イソプロピルアルコール(IPA)', tags: ['IPA', '溶剤'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '化学', subcategory: '品質', zh: '纯度', ja: '純度', difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '化学', subcategory: '品質', zh: '杂质', ja: '不純物', difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '化学', subcategory: '安全', zh: '安全数据表', ja: 'SDS(安全データシート)', tags: ['SDS'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '輸出入', zh: '出口管制', ja: '輸出規制', tags: ['輸出規制'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '輸出入', zh: '报关', ja: '通関手続き', difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '物流', zh: '交货期', ja: '納期', tags: ['納期'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '物流', zh: '集装箱', ja: 'コンテナ', difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '価格', zh: '报价单', ja: '見積書', tags: ['見積'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '価格', zh: '涨价', ja: '値上げ', tags: ['値上げ'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '品質', subcategory: 'クレーム', zh: '质量问题', ja: '品質問題', difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '品質', subcategory: 'クレーム', zh: '索赔', ja: 'クレーム(賠償請求)', difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '化学', subcategory: '半導体', zh: '半导体', ja: '半導体', tags: ['半導体'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'word', category: '貿易', subcategory: '契約', zh: '合同', ja: '契約書', difficulty: 1, source: 'サンプル', author: 'Claude' },
    ],
  },
  {
    pack: {
      id: 'pack-sales',
      name: '営業・商談フレーズ',
      description: '価格交渉・納期調整・品質対応の実務短文',
      icon: '💼',
      color: '#b45309',
    },
    items: [
      { type: 'sentence', category: '営業', subcategory: '価格交渉', zh: '由于原材料价格上涨,我们不得不调整报价。', ja: '原材料価格の高騰により、見積価格を調整せざるを得ません。', tags: ['値上げ'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '価格交渉', zh: '如果订货量增加,价格方面可以再商量。', ja: '発注量が増えるなら、価格は再度相談できます。', tags: ['価格交渉'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '納期', zh: '交货期最快也要四个星期左右。', ja: '納期は最短でも4週間ほどかかります。', tags: ['納期'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '納期', zh: '能不能把交货期提前一个星期?', ja: '納期を1週間早めていただけませんか?', tags: ['納期'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '品質', zh: '这批货的质量和上次的样品不一样。', ja: '今回のロットの品質が前回のサンプルと違います。', tags: ['品質'], difficulty: 3, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '品質', zh: '我们会尽快调查原因,然后给您答复。', ja: '早急に原因を調査して、ご回答いたします。', tags: ['品質'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '見積', zh: '请把详细的规格发给我,我们马上做报价。', ja: '詳細な仕様を送ってください。すぐに見積もりを作成します。', tags: ['見積'], difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '挨拶', zh: '好久不见,最近生意怎么样?', ja: 'お久しぶりです。最近、商売の調子はいかがですか?', difficulty: 1, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '確認', zh: '我确认一下,您需要的是五百公斤,对吧?', ja: '確認ですが、ご希望は500kgですね?', difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '営業', subcategory: '支払い', zh: '付款条件是货到后三十天内付款。', ja: '支払条件は着荷後30日以内のお支払いです。', difficulty: 3, source: 'サンプル', author: 'Claude' },
    ],
  },
  {
    pack: {
      id: 'pack-daily',
      name: '日常会話',
      description: '日常でよく使う基本表現',
      icon: '💬',
      color: '#15803d',
    },
    items: [
      { type: 'sentence', category: '日常', subcategory: '挨拶', zh: '麻烦你了,谢谢。', ja: 'お手数をおかけしました。ありがとうございます。', difficulty: 1, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '日常', subcategory: '依頼', zh: '你能再说一遍吗?我没听清楚。', ja: 'もう一度言ってもらえますか?よく聞き取れませんでした。', difficulty: 1, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '日常', subcategory: '食事', zh: '今天晚上一起吃个饭怎么样?', ja: '今晩、一緒に食事でもどうですか?', difficulty: 1, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '日常', subcategory: '予定', zh: '我明天上午有个会议,下午有空。', ja: '明日は午前中に会議があって、午後なら空いています。', difficulty: 2, source: 'サンプル', author: 'Claude' },
      { type: 'sentence', category: '日常', subcategory: '移動', zh: '从机场到酒店大概要多长时间?', ja: '空港からホテルまでどのくらいかかりますか?', difficulty: 2, source: 'サンプル', author: 'Claude' },
    ],
  },
  {
    pack: {
      id: 'pack-articles',
      name: '長文リーディング',
      description: 'ビジネスニュース風の長文教材',
      icon: '📰',
      color: '#6d28d9',
    },
    items: [
      {
        type: 'article',
        category: 'ニュース',
        subcategory: '市場動向',
        zh: '最近,全球铜箔市场的需求持续增长。随着电动汽车和储能产业的快速发展,电池用铜箔的订单大幅增加。业内人士表示,主要厂商的生产线已经接近满负荷运转。\n另一方面,原材料铜价的波动给企业带来了成本压力。一些厂商已经开始与客户协商调整价格。专家预测,今后一段时间内,铜箔的供应仍然会比较紧张。',
        ja: '最近、世界の銅箔市場の需要は増え続けている。電気自動車と蓄電産業の急速な発展に伴い、電池用銅箔の受注が大幅に増加した。業界関係者によると、主要メーカーの生産ラインはすでにフル稼働に近い状態だという。\n一方で、原材料である銅価格の変動は企業にコスト圧力をもたらしている。一部のメーカーはすでに顧客と価格調整の協議を始めた。専門家は、今後しばらく銅箔の供給はタイトな状態が続くと予測している。',
        tags: ['銅箔', '市場'],
        difficulty: 4,
        source: 'サンプル',
        author: 'Claude',
      },
      {
        type: 'article',
        category: 'ニュース',
        subcategory: '貿易',
        zh: '据报道,部分化学品的出口管制将进一步加强。相关企业需要提前申请许可证,并提供详细的用途说明。\n对此,不少贸易公司表示担忧。他们认为,审批时间变长可能会影响交货期。有专家建议,企业应该尽早与客户沟通,合理安排订单和库存,减少规制带来的影响。',
        ja: '報道によると、一部の化学品の輸出規制がさらに強化されるという。関係企業は事前に許可証を申請し、詳細な用途説明を提出する必要がある。\nこれに対し、多くの商社が懸念を示している。審査期間が長くなれば納期に影響する可能性があるからだ。専門家は、企業はできるだけ早く顧客と連絡を取り、注文と在庫を適切に調整して、規制の影響を減らすべきだと提案している。',
        tags: ['輸出規制', '化学品'],
        difficulty: 4,
        source: 'サンプル',
        author: 'Claude',
      },
      {
        type: 'article',
        category: '日常',
        subcategory: 'エッセイ',
        zh: '学习外语最重要的是坚持。每天听十分钟,比一个星期听一次两个小时更有效果。\n很多人一开始很有热情,但是过了一个月就放弃了。其实,语言能力是慢慢积累起来的。只要每天接触一点点,一年以后你会发现自己进步了很多。',
        ja: '外国語学習で最も大切なのは継続することだ。毎日10分聞くほうが、週に1回2時間聞くより効果がある。\n多くの人は最初はやる気があるが、1か月もすると諦めてしまう。実際、語学力は少しずつ積み上がっていくものだ。毎日少しでも触れてさえいれば、1年後には自分が大きく進歩したことに気づくだろう。',
        tags: ['学習'],
        difficulty: 3,
        source: 'サンプル',
        author: 'Claude',
      },
    ],
  },
]

/** サンプルデータを正規化して返す */
export function getSampleData(): { packs: Pack[]; items: Item[] } {
  const packs: Pack[] = []
  const items: Item[] = []
  for (const seed of seeds) {
    const pack = normalizePack(seed.pack, 'サンプル')
    packs.push(pack)
    let n = 0
    for (const raw of seed.items) {
      const item = normalizeItem({ ...raw, id: `${pack.id}-${String(++n).padStart(3, '0')}` }, pack.id)
      if (item) items.push(item)
    }
  }
  return { packs, items }
}

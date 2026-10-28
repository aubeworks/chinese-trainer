// ライブラリの追加教材(パックごとに末尾へ追記される)
// IDは「パックID-キー-連番」で採番されるため、各パートは互いに独立している。
// 今後追加するときは既存パートを並べ替えず、新しいキー(x2 など)のファイルを足すこと。
import type { Entry } from '../libraryTypes'
import { entries as libColloquial } from './lib-colloquial'
import { entries as libNews } from './lib-news'
import { entries as libChem } from './lib-chem'
import { entries as libTrade } from './lib-trade'
import { entries as libSales } from './lib-sales'
import { entries as libNego } from './lib-nego'
import { entries as libBiz } from './lib-biz'
import { entries as libDaily } from './lib-daily'
import { entries as libConnectors } from './lib-connectors'
import { entries as libArticlesA } from './lib-articles-a'
import { entries as libArticlesB } from './lib-articles-b'
import { entries as libSynthesis } from './lib-synthesis'
import { entries as libOrganic } from './lib-organic'
import { entries as libCnHistory } from './lib-cn-history'
import { entries as libCnFigures } from './lib-cn-figures'
import { entries as libCnGeo } from './lib-cn-geo'
import { entries as libCnSociety } from './lib-cn-society'
import { entries as libTwHistory } from './lib-tw-history'
import { entries as libTwSociety } from './lib-tw-society'
import { entries as libTwGeo } from './lib-tw-geo'
import { entries as libPhone } from './lib-phone'
import { entries as libWebmeeting } from './lib-webmeeting'
import { entries as libAudit } from './lib-audit'
import { entries as libHotel } from './lib-hotel'
import { entries as libDining } from './lib-dining'
import { entries as libBanquet } from './lib-banquet'
import { entries as libAirport } from './lib-airport'
import { entries as libReport } from './lib-report'
import { entries as libWorldGeo } from './lib-world-geo'
import { entries as packArticlesA } from './pack-articles-a'
import { entries as packArticlesB } from './pack-articles-b'
import { entries as packChemistry } from './pack-chemistry'
import { entries as packDaily } from './pack-daily'
import { entries as packSales } from './pack-sales'

export interface ExtraPart {
  key: string
  entries: Entry[]
}

export const EXTRA_PARTS: Record<string, ExtraPart[]> = {
  'lib-colloquial': [{ key: 'x1', entries: libColloquial }],
  'lib-news': [{ key: 'x1', entries: libNews }],
  'lib-chem': [{ key: 'x1', entries: libChem }],
  'lib-trade': [{ key: 'x1', entries: libTrade }],
  'lib-sales': [{ key: 'x1', entries: libSales }],
  'lib-nego': [{ key: 'x1', entries: libNego }],
  'lib-biz': [{ key: 'x1', entries: libBiz }],
  'lib-daily': [{ key: 'x1', entries: libDaily }],
  'lib-connectors': [{ key: 'x1', entries: libConnectors }],
  'lib-articles': [{ key: 'x1a', entries: libArticlesA }, { key: 'x1b', entries: libArticlesB }],
  'lib-synthesis': [{ key: 'x1', entries: libSynthesis }],
  'lib-organic': [{ key: 'x1', entries: libOrganic }],
  'lib-cn-history': [{ key: 'x1', entries: libCnHistory }],
  'lib-cn-figures': [{ key: 'x1', entries: libCnFigures }],
  'lib-cn-geo': [{ key: 'x1', entries: libCnGeo }],
  'lib-cn-society': [{ key: 'x1', entries: libCnSociety }],
  'lib-tw-history': [{ key: 'x1', entries: libTwHistory }],
  'lib-tw-society': [{ key: 'x1', entries: libTwSociety }],
  'lib-tw-geo': [{ key: 'x1', entries: libTwGeo }],
  'lib-phone': [{ key: 'x1', entries: libPhone }],
  'lib-webmeeting': [{ key: 'x1', entries: libWebmeeting }],
  'lib-audit': [{ key: 'x1', entries: libAudit }],
  'lib-hotel': [{ key: 'x1', entries: libHotel }],
  'lib-dining': [{ key: 'x1', entries: libDining }],
  'lib-banquet': [{ key: 'x1', entries: libBanquet }],
  'lib-airport': [{ key: 'x1', entries: libAirport }],
  'lib-report': [{ key: 'x1', entries: libReport }],
  'lib-world-geo': [{ key: 'x1', entries: libWorldGeo }],
  'pack-articles': [{ key: 'x1a', entries: packArticlesA }, { key: 'x1b', entries: packArticlesB }],
  'pack-chemistry': [{ key: 'x1', entries: packChemistry }],
  'pack-daily': [{ key: 'x1', entries: packDaily }],
  'pack-sales': [{ key: 'x1', entries: packSales }],
}

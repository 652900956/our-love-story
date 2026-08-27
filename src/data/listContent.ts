/**
 * Love List 页内容（数据与视图分离）。
 * 实际数据全部来自 src/data/siteContent.ts 的 loveList（磊哥只改那一个文件）。
 * 本文件仅做「再导出」+ 保留页面文案（标题 / 副标题 / 导语）。
 */

import { loveList, type LoveListItem } from './siteContent'

export type ListItem = LoveListItem

export const list = {
  title: 'Love List',
  subtitle: '属于我们的约定与清单',
  intro: '一张写给未来的清单，每划掉一项，就多一段共同走过的路。',
  items: loveList,
}

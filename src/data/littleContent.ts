/**
 * 点点滴滴页内容（数据与视图分离）。
 * 实际数据全部来自 src/data/siteContent.ts 的 moments（磊哥只改那一个文件）。
 * 本文件仅做「再导出」+ 保留页面文案（标题 / 副标题 / 导语）。
 */

import { moments, type LittleItem } from './siteContent'

export type { LittleItem }

export const little = {
  title: '点点滴滴',
  subtitle: '那些值得被收藏的碎碎念与温柔瞬间',
  intro: '不是什么了不起的大事，只是一些想被记住的小瞬间。',
  items: moments,
}

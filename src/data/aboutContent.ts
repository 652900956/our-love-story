/**
 * 关于我们页内容（数据与视图分离）。
 * 实际数据全部来自 src/data/siteContent.ts 的 about（磊哥只改那一个文件）。
 * 本文件仅做「再导出」，保持组件 / hook 的导入路径不变。
 */

import { about, type AboutMilestone } from './siteContent'

export type { AboutMilestone }
export { about }

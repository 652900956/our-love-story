/**
 * Love Photo 相册数据（数据与视图分离）。
 * 实际数据全部来自 src/data/siteContent.ts 的 photos（磊哥只改那一个文件）。
 * 本文件仅做「再导出」，保持组件 / API 的导入路径不变。
 */

import { photos, type PhotoItem } from './siteContent'

export type { PhotoItem }
export { photos }

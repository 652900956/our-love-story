/**
 * ============================================================================
 *  formatTime.ts —— 中文日期时间格式化
 * ----------------------------------------------------------------------------
 *  把 Date 格式化为「2026年8月12日晚上11点40分」这种口语化中文表达，
 *  用于开场屏第三行动态时间。
 * ============================================================================
 */

/** 中文时段（0-23） */
function getPeriod(hour: number): string {
  if (hour < 6) return '凌晨'
  if (hour < 9) return '早上'
  if (hour < 12) return '上午'
  if (hour < 14) return '中午'
  if (hour < 18) return '下午'
  return '晚上'
}

/** 格式化为「YYYY年M月D日[时段]H点m分」 */
export function formatChineseDateTime(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  const h = date.getHours()
  const min = date.getMinutes()
  const period = getPeriod(h)
  const hour12 = h > 12 ? h - 12 : h === 0 ? 12 : h
  const minStr = min < 10 ? `0${min}` : String(min)
  return `${y}年${m}月${d}日${period}${hour12}点${minStr}分`
}

/** 秒级刷新Hook依赖用 */
export function getMinuteTimestamp(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 60_000)
}

/**
 * 日期工具：全部以本地时间处理，统一 YYYY-MM-dd 字符串作为对外格式。
 */

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`
}

export function todayStr(): string {
  const d = new Date()
  return toDateStr(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

export function parseDateStr(s: string): { y: number; m: number; d: number } {
  const [y, m, d] = s.split('-').map(Number)
  return { y, m, d }
}

/** 某月的年/月（考虑跨年） */
export function shiftMonth(year: number, month: number, delta: number): { y: number; m: number } {
  const idx = year * 12 + (month - 1) + delta
  return { y: Math.floor(idx / 12), m: (idx % 12) + 1 }
}

/** 生成本月日历矩阵（6 周 × 7 天），含前后补位，dateStr 唯一标识 */
export function monthMatrix(
  year: number,
  month: number,
): { dateStr: string; day: number; inMonth: boolean }[][] {
  const first = new Date(year, month - 1, 1)
  const startWeekday = first.getDay() // 0=周日
  const daysInMonth = new Date(year, month, 0).getDate()

  const cells: { dateStr: string; day: number; inMonth: boolean }[] = []

  // 前置补位（上月）
  const prevDays = new Date(year, month - 1, 0).getDate()
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevDays - i
    const py = month === 1 ? year - 1 : year
    const pm = month === 1 ? 12 : month - 1
    cells.push({ dateStr: toDateStr(py, pm, d), day: d, inMonth: false })
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: toDateStr(year, month, d), day: d, inMonth: true })
  }

  // 后置补位（下月），补足到 6 周
  const ny = month === 12 ? year + 1 : year
  const nm = month === 12 ? 1 : month + 1
  let nextDay = 1
  while (cells.length < 42) {
    cells.push({ dateStr: toDateStr(ny, nm, nextDay), day: nextDay, inMonth: false })
    nextDay++
  }

  const weeks: { dateStr: string; day: number; inMonth: boolean }[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

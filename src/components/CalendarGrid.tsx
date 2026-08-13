import { useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import theme from '../config/theme.config'
import { monthMatrix, parseDateStr, shiftMonth, todayStr } from '../utils/date'
import solarLunar from 'solarlunar'
import type { TodoCategory } from '../api/loveyData'

export type MarkerShape = 'dot' | 'heart' | 'square'

export interface MarkerStyle {
  shape: MarkerShape
  /** 男主人 / 女主人 / 共同 颜色 */
  colors: Record<TodoCategory, string>
}

const DEFAULT_MARKERS: MarkerStyle = {
  shape: 'dot',
  colors: {
    mine: '#4cc9ff',
    hers: '#ff6b9d',
    shared: '#a855f7',
  },
}

/**
 * 情侣日历（阳历 + 农历）。
 * - 点击日期 → onSelect(dateStr)
 * - 有备注的日期显示小圆点
 * - 有 todo 的日期显示归属标记
 * - 点击非本月日期会自动把视图切到该日期所在月份
 */
export default function CalendarGrid({
  selectedDate,
  remarkDates,
  todoDates,
  markerStyle = DEFAULT_MARKERS,
  onSelect,
}: {
  selectedDate: string
  remarkDates: Set<string>
  todoDates?: Record<string, TodoCategory[]>
  markerStyle?: MarkerStyle
  onSelect: (date: string) => void
}) {
  const init = parseDateStr(selectedDate)
  const [view, setView] = useState({ y: init.y, m: init.m })
  const today = todayStr()

  const weeks = monthMatrix(view.y, view.m)

  const lunarLabel = (y: number, m: number, d: number): string => {
    const l = solarLunar.solar2lunar(y, m, d)
    if (l.term) return l.term
    if (l.dayCn === '初一') return `${l.monthCn}月`
    return l.dayCn
  }

  const handleSelect = (dateStr: string, inMonth: boolean) => {
    if (!inMonth) {
      const p = parseDateStr(dateStr)
      setView({ y: p.y, m: p.m })
    }
    onSelect(dateStr)
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div
      style={{
        maxWidth: 760,
        margin: '0 auto',
        background: theme.colors.bgCard,
        borderRadius: theme.radius.card,
        padding: '1.4rem',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* 月份切换 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.2rem',
        }}
      >
        <button
          type="button"
          aria-label="上个月"
          onClick={() => setView((v) => shiftMonth(v.y, v.m, -1))}
          style={navBtnStyle}
        >
          <ChevronLeft size={20} />
        </button>
        <div
          style={{
            fontFamily: theme.fonts.serif,
            fontSize: '1.3rem',
            fontWeight: 700,
            color: theme.colors.textDark,
          }}
        >
          {view.y} 年 {view.m} 月
        </div>
        <button
          type="button"
          aria-label="下个月"
          onClick={() => setView((v) => shiftMonth(v.y, v.m, 1))}
          style={navBtnStyle}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* 星期表头 */}
      <div style={gridStyle}>
        {weekdays.map((w, i) => (
          <div
            key={w}
            style={{
              textAlign: 'center',
              fontFamily: theme.fonts.serif,
              fontSize: '0.85rem',
              fontWeight: 700,
              color: i === 0 ? theme.colors.primary : theme.colors.textMuted,
              paddingBottom: '0.6rem',
            }}
          >
            {w}
          </div>
        ))}
      </div>

      {/* 日期网格 */}
      <div style={gridStyle}>
        {weeks.flat().map((cell) => {
          const { y, m, d } = parseDateStr(cell.dateStr)
          const isToday = cell.dateStr === today
          const isSelected = cell.dateStr === selectedDate
          const hasRemark = remarkDates.has(cell.dateStr)
          const cats = todoDates?.[cell.dateStr] ?? []
          const uniqueCats = Array.from(new Set(cats))
          return (
            <button
              key={cell.dateStr}
              type="button"
              onClick={() => handleSelect(cell.dateStr, cell.inMonth)}
              style={{
                position: 'relative',
                aspectRatio: '1 / 0.92',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '0.8rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'all 0.2s',
                background: isSelected ? theme.colors.primary : 'transparent',
                color: isSelected
                  ? '#fff'
                  : cell.inMonth
                    ? theme.colors.textDark
                    : theme.colors.textMuted,
                opacity: cell.inMonth ? 1 : 0.45,
                boxShadow: isToday && !isSelected ? `inset 0 0 0 1.5px ${theme.colors.primary}` : 'none',
              }}
            >
              <span style={{ fontFamily: theme.fonts.serif, fontSize: '1.05rem', fontWeight: 600, lineHeight: 1 }}>
                {cell.day}
              </span>
              <span style={{ fontSize: '0.68rem', lineHeight: 1, opacity: isSelected ? 0.92 : 0.8 }}>
                {lunarLabel(y, m, d)}
              </span>
              {(uniqueCats.length > 0 || hasRemark) && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '3px',
                    flexWrap: 'wrap',
                    padding: '0 4px',
                  }}
                >
                  {uniqueCats.map((cat) => (
                    <MarkerDot key={cat} category={cat} shape={markerStyle.shape} color={markerStyle.colors[cat]} />
                  ))}
                  {hasRemark && !uniqueCats.length && (
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: isSelected ? '#fff' : theme.colors.primary,
                      }}
                    />
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MarkerDot({
  category,
  shape,
  color,
}: {
  category: TodoCategory
  shape: MarkerShape
  color: string
}) {
  const label = category === 'mine' ? '男' : category === 'hers' ? '女' : '共'
  const base: CSSProperties = {
    width: 7,
    height: 7,
    background: color,
    flexShrink: 0,
  }
  if (shape === 'heart') {
    return (
      <span title={label} style={{ width: 8, height: 8, position: 'relative' }}>
        <svg viewBox="0 0 24 24" fill={color} style={{ width: '100%', height: '100%' }}>
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </span>
    )
  }
  if (shape === 'square') {
    return <span title={label} style={{ ...base, borderRadius: 2 }} />
  }
  return <span title={label} style={{ ...base, borderRadius: '50%' }} />
}

const gridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gap: '4px',
}

const navBtnStyle: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  background: theme.colors.bgCardHover,
  color: theme.colors.textMain,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
}

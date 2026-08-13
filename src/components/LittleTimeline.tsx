import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import { motion } from 'framer-motion'
import { GripHorizontal } from 'lucide-react'
import theme from '../config/theme.config'
import type { LittleItem } from '../data/littleContent'

interface LittleTimelineProps {
  items: LittleItem[]
}

const TRACK_H = 520
const CENTER_Y = 260
const AMP = 78
const GAP = 360
const PAD_X = 90
const CARD_W = 280
const CARD_H = 150
const CONNECTOR = 24

export default function LittleTimeline({ items }: LittleTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, scroll: 0 })

  // 时间线从左到右按时间顺序：最旧在左、最新在右（新增会向右延伸）
  const chronological = useMemo(() => [...items].reverse(), [items])

  const totalW = useMemo(
    () => PAD_X * 2 + Math.max(0, chronological.length - 1) * GAP,
    [chronological.length],
  )

  // 采样绘制一条平滑的正弦波浪线
  const pathD = useMemo(() => {
    if (chronological.length === 0) return ''
    const samples = Math.max(2, Math.floor(totalW / 3))
    let d = ''
    for (let s = 0; s <= samples; s++) {
      const x = (s / samples) * totalW
      const y = CENTER_Y + AMP * Math.sin((Math.PI * (x - PAD_X)) / GAP - Math.PI / 2)
      d += `${s === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    return d
  }, [chronological.length, totalW])

  // 每次新增条目时自动滚动到最右侧（最新）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollLeft = el.scrollWidth - el.clientWidth
  }, [chronological.length])

  // 垂直滚轮转换为水平滚动（用原生非被动监听，避免 React 合成事件的 passive 警告
  // 并可靠地阻止页面纵向滚动）
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheelNative = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
      e.preventDefault()
      el.scrollLeft += e.deltaY
    }
    el.addEventListener('wheel', onWheelNative, { passive: false })
    return () => el.removeEventListener('wheel', onWheelNative)
  }, [])

  const startDrag = (e: ReactMouseEvent) => {
    setIsDragging(true)
    dragStart.current = { x: e.clientX, scroll: containerRef.current?.scrollLeft || 0 }
  }

  // 拖拽过程用 window 级监听，保证即使光标短暂移出时间线区域也能持续滚动
  useEffect(() => {
    if (!isDragging) return
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.x
      if (containerRef.current) containerRef.current.scrollLeft = dragStart.current.scroll - dx
    }
    const onUp = () => setIsDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isDragging])

  if (chronological.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.serif,
        }}
      >
        时间线还是空空的，先记录一段小确幸吧～
      </div>
    )
  }

  return (
    <div>
      {/* 操作提示 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          marginBottom: '0.6rem',
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.serif,
          fontSize: '0.85rem',
        }}
      >
        <GripHorizontal size={16} />
        <span>拖动或左右滑动，查看我们的时间线</span>
      </div>

      <div
        ref={containerRef}
        data-testid="little-timeline-scroll"
        onMouseDown={startDrag}
        style={{
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          padding: '0.5rem 0 1.5rem',
          userSelect: 'none',
          scrollbarWidth: 'thin',
        }}
      >
        <div style={{ position: 'relative', width: totalW, height: TRACK_H }}>
          {/* 波浪曲线 */}
          <svg
            width={totalW}
            height={TRACK_H}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
          >
            <path
              d={pathD}
              fill="none"
              stroke={theme.colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.5}
            />
          </svg>

          {chronological.map((it, i) => {
            const x = PAD_X + i * GAP
            const nodeY = CENTER_Y + AMP * Math.sin(Math.PI * i - Math.PI / 2)
            const isTop = i % 2 === 0 // 偶数在上，奇数在下，交替分布
            const cardTop = isTop ? nodeY - CONNECTOR - CARD_H : nodeY + CONNECTOR
            const cardLeft = x - CARD_W / 2

            return (
              <div key={it.id}>
                {/* 节点圆点 */}
                <div
                  style={{
                    position: 'absolute',
                    left: x - 7,
                    top: nodeY - 7,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: theme.colors.bgCard,
                    border: `3px solid ${theme.colors.primary}`,
                    boxShadow: `0 0 0 4px ${theme.colors.primarySoft}`,
                  }}
                />
                {/* 日期标签 */}
                <div
                  style={{
                    position: 'absolute',
                    left: x - 70,
                    top: isTop ? nodeY + 16 : nodeY - 32,
                    width: 140,
                    textAlign: 'center',
                    fontFamily: theme.fonts.serif,
                    fontSize: '0.8rem',
                    color: theme.colors.textMuted,
                  }}
                >
                  {it.date}
                </div>
                {/* 卡片到节点的连线 */}
                <div
                  style={{
                    position: 'absolute',
                    left: x - 1,
                    top: isTop ? nodeY - CONNECTOR : nodeY,
                    width: 2,
                    height: CONNECTOR,
                    background: theme.colors.primary,
                    opacity: 0.35,
                  }}
                />
                {/* 卡片 */}
                <motion.div
                  initial={{ opacity: 0, y: isTop ? -24 : 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: i * 0.05 }}
                  style={{
                    position: 'absolute',
                    left: cardLeft,
                    top: cardTop,
                    width: CARD_W,
                    height: CARD_H,
                    background: theme.colors.bgCard,
                    borderRadius: theme.radius.card,
                    border: '1px solid rgba(208, 206, 206, 0.4)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                  }}
                >
                  <div
                    style={{
                      fontFamily: theme.fonts.serif,
                      fontWeight: 700,
                      color: theme.colors.textDark,
                      fontSize: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {it.title}
                  </div>
                  <div
                    style={{
                      fontFamily: theme.fonts.serif,
                      color: theme.colors.textMain,
                      fontSize: '0.86rem',
                      lineHeight: 1.55,
                      flex: 1,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {it.content}
                  </div>
                  {it.mood && (
                    <span
                      style={{
                        alignSelf: 'flex-start',
                        fontSize: '0.78rem',
                        padding: '0.15rem 0.65rem',
                        borderRadius: 999,
                        background: theme.colors.primarySoft,
                        color: theme.colors.primary,
                      }}
                    >
                      {it.mood}
                    </span>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

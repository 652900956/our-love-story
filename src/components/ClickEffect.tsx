/**
 * ============================================================================
 *  components/ClickEffect.tsx —— 全局鼠标点击特效（星星迸发）
 * ----------------------------------------------------------------------------
 *  在页面任意位置点击时，从点击点向外迸发若干小星星。
 *  固定定位、pointer-events: none，不阻挡任何交互。
 *  开关 / 类型由 settings 驱动。
 * ============================================================================
 */

import { useEffect, useRef, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettings } from '../hooks/useSettings'

interface Spark {
  id: number
  x: number
  y: number
  angle: number
  distance: number
  size: number
  color: string
}

const COUNT = 12

/** 读取当前主题下的主色（canvas 不支持 CSS 变量，需读取计算值） */
function cssVar(name: string, fallback: string) {
  if (typeof window === 'undefined') return fallback
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

function starPath(size: number) {
  // 5 角星路径，居中
  const rOuter = size / 2
  const rInner = size / 4
  let d = ''
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOuter : rInner
    const a = (Math.PI / 5) * i - Math.PI / 2
    const x = size / 2 + r * Math.cos(a)
    const y = size / 2 + r * Math.sin(a)
    d += `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)} `
  }
  d += 'Z'
  return d
}

export default function ClickEffect() {
  const { settings } = useSettings()
  const sparksRef = useRef<Spark[]>([])
  const [, forceRender] = useState(0)

  const trigger = useCallback((e: MouseEvent) => {
    const idBase = Date.now() + Math.random()
    const palette = [cssVar('--primary', '#f16b4f'), '#ff2742', '#ffd700', '#87ceeb', '#ff9e8a']
    const next: Spark[] = Array.from({ length: COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / COUNT + Math.random() * 0.5
      const distance = 40 + Math.random() * 40
      return {
        id: idBase + i,
        x: e.clientX,
        y: e.clientY,
        angle,
        distance,
        size: 8 + Math.random() * 8,
        color: palette[Math.floor(Math.random() * palette.length)],
      }
    })
    sparksRef.current = [...sparksRef.current, ...next]
    forceRender((n) => n + 1)
    setTimeout(() => {
      sparksRef.current = sparksRef.current.filter((s) => !next.includes(s))
      forceRender((n) => n + 1)
    }, 650)
  }, [])

  useEffect(() => {
    if (!settings.clickEffectEnabled) return
    window.addEventListener('click', trigger, true)
    return () => window.removeEventListener('click', trigger, true)
  }, [settings.clickEffectEnabled, trigger])

  if (!settings.clickEffectEnabled) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      aria-hidden
    >
      <AnimatePresence>
        {sparksRef.current.map((s) => {
          const tx = Math.cos(s.angle) * s.distance
          const ty = Math.sin(s.angle) * s.distance
          return (
            <motion.svg
              key={s.id}
              width={s.size}
              height={s.size}
              style={{
                position: 'absolute',
                left: s.x - s.size / 2,
                top: s.y - s.size / 2,
              }}
              initial={{ opacity: 1, scale: 0, x: 0, y: 0, rotate: 0 }}
              animate={{ opacity: 0, scale: 1, x: tx, y: ty, rotate: 180 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
            >
              <path d={starPath(s.size)} fill={s.color} />
            </motion.svg>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

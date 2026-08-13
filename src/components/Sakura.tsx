import { useMemo } from 'react'
import theme from '../config/theme.config'

/**
 * 樱花飘落粒子（还原原站被注释掉的 yinghua.js 预留效果）。
 * 通过 enableParticles 开关控制。纯 CSS 动画，性能友好。
 */
const COLORS = ['#ffd1dc', '#ffb7c5', '#ffc0cb', '#f8c8dc']

export default function Sakura() {
  if (!theme.flags.enableParticles) return null

  const petals = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 8,
        duration: 8 + Math.random() * 6,
        size: 8 + Math.random() * 10,
        color: COLORS[i % COLORS.length],
      })),
    []
  )

  return (
    <div
      aria-hidden
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, overflow: 'hidden' }}
    >
      {petals.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-10vh',
            left: `${p.left}vw`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: '80% 0 80% 0',
            opacity: 0.8,
            animation: `sakura-fall ${p.duration}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  )
}

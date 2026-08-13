/**
 * ============================================================================
 *  components/MouseTrail.tsx —— 全局鼠标轨迹特效
 * ----------------------------------------------------------------------------
 *  用固定 canvas 覆盖全屏，性能友好；根据设置里的 trailType 渲染：
 *   - star：五角星
 *   - dot：彩色圆点
 *   - heart：小红心
 *   - comet：拖尾彗星
 *  尾巴长度受 maxParticles 与生命周期共同限制，保持较短。
 * ============================================================================
 */

import { useEffect, useRef } from 'react'
import { useSettings } from '../hooks/useSettings'

type TrailType = 'star' | 'dot' | 'heart' | 'comet'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  type: TrailType
  angle: number
}

const MAX_PARTICLES = 24
const SPAWN_INTERVAL = 35 // ms，控制密度

/** 读取当前主题下的主色（canvas 不支持 CSS 变量，需读取计算值） */
function primaryColor() {
  if (typeof window === 'undefined') return '#f16b4f'
  const v = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()
  return v || '#f16b4f'
}

/** 轨迹粒子调色板：主色跟随主题，其余为装饰色 */
function trailPalette(): string[] {
  return [primaryColor(), '#ff2742', '#ffd700', '#87ceeb', '#ff9e8a', '#c084fc']
}

function resizeCanvas(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1
  const w = window.innerWidth
  const h = window.innerHeight
  canvas.width = w * dpr
  canvas.height = h * dpr
  canvas.style.width = `${w}px`
  canvas.style.height = `${h}px`
  const ctx = canvas.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  return ctx
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? size : size / 2.2
    const a = (Math.PI / 5) * i - Math.PI / 2
    const px = r * Math.cos(a)
    const py = r * Math.sin(a)
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.save()
  ctx.translate(x, y)
  ctx.beginPath()
  ctx.moveTo(0, size * 0.25)
  ctx.bezierCurveTo(-size * 0.5, -size * 0.35, -size, 0, 0, size)
  ctx.bezierCurveTo(size, 0, size * 0.5, -size * 0.35, 0, size * 0.25)
  ctx.fillStyle = color
  ctx.fill()
  ctx.restore()
}

function drawComet(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, angle: number) {
  const tailLen = size * 5
  const grad = ctx.createLinearGradient(
    x,
    y,
    x - Math.cos(angle) * tailLen,
    y - Math.sin(angle) * tailLen,
  )
  grad.addColorStop(0, color)
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  ctx.ellipse(0, 0, tailLen, size, 0, 0, Math.PI * 2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.beginPath()
  ctx.arc(0, 0, size, 0, Math.PI * 2)
  ctx.fillStyle = '#fff'
  ctx.fill()
  ctx.restore()
}

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.beginPath()
  ctx.arc(x, y, size, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
}

export default function MouseTrail() {
  const { settings } = useSettings()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const lastSpawnRef = useRef(0)
  const mouseRef = useRef({ x: -999, y: -999 })
  const rafRef = useRef<number>()

  useEffect(() => {
    if (!settings.trailEnabled) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = resizeCanvas(canvas)
    if (!ctx) return

    const onResize = () => resizeCanvas(canvas)
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
      const now = Date.now()
      if (now - lastSpawnRef.current < SPAWN_INTERVAL) return
      lastSpawnRef.current = now
      const type = settings.trailType
      const palette = trailPalette()
      const color = palette[Math.floor(Math.random() * palette.length)]
      particlesRef.current.push({
        x: e.clientX,
        y: e.clientY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        life: 1,
        maxLife: 0.55 + Math.random() * 0.25,
        size: type === 'comet' ? 2.4 + Math.random() * 1.2 : 3 + Math.random() * 2,
        color,
        type,
        angle: Math.random() * Math.PI * 2,
      })
      if (particlesRef.current.length > MAX_PARTICLES) {
        particlesRef.current = particlesRef.current.slice(-MAX_PARTICLES)
      }
    }

    let running = true
    const loop = () => {
      if (!running) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const arr = particlesRef.current
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i]
        p.life -= 0.016 / p.maxLife
        p.x += p.vx
        p.y += p.vy
        if (p.life <= 0) {
          arr.splice(i, 1)
          continue
        }
        const alpha = Math.max(0, p.life)
        const size = p.size * p.life
        ctx.globalAlpha = alpha
        if (p.type === 'star') drawStar(ctx, p.x, p.y, size, p.color)
        else if (p.type === 'heart') drawHeart(ctx, p.x, p.y, size, p.color)
        else if (p.type === 'comet') drawComet(ctx, p.x, p.y, size, p.color, p.angle)
        else drawDot(ctx, p.x, p.y, size, p.color)
      }
      ctx.globalAlpha = 1
      rafRef.current = requestAnimationFrame(loop)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('mousemove', onMove, { passive: true })
    rafRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('mousemove', onMove)
    }
  }, [settings.trailEnabled, settings.trailType])

  if (!settings.trailEnabled) return null

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 9998,
      }}
    />
  )
}

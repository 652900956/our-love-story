/**
 * ============================================================================
 *  components/WelcomeOverlay.tsx —— 全屏开场欢迎屏
 * ----------------------------------------------------------------------------
 *  视觉：温馨粉紫系背景图 + 毛玻璃遮罩 + Canvas 樱花雨/爱心粒子。
 *  文字：
 *    第一行：欢迎来到（小）
 *    第二行：聪聪和磊磊的小世界（大）
 *    第三行：动态中文日期时间 + "，很高兴与你相遇"
 *    第四行（底部删除线）：点击／触摸／按任意键开启吧✨（呼吸缩放）
 *  交互：点击/触摸/按任意键后，整屏向上抽纸式退场，并回调 onEnter。
 * ============================================================================
 */

import { useEffect, useRef, useState, useCallback, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import theme from '../config/theme.config'
import { formatChineseDateTime } from '../utils/formatTime'

interface Particle {
  x: number
  y: number
  size: number
  speedY: number
  speedX: number
  rotation: number
  rotationSpeed: number
  opacity: number
  color: string
  type: 'sakura' | 'heart'
  sway: number
}

interface WelcomeOverlayProps {
  onEnter: () => void
}

export default function WelcomeOverlay({ onEnter }: WelcomeOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>(0)
  const [exiting, setExiting] = useState(false)
  const [currentTime, setCurrentTime] = useState(formatChineseDateTime())

  // 每秒刷新一次中文时间
  useEffect(() => {
    setCurrentTime(formatChineseDateTime())
    const timer = setInterval(() => setCurrentTime(formatChineseDateTime()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 初始化粒子
  const initParticles = useCallback((width: number, height: number) => {
    const count = 55
    const palette = ['#ffb7c5', '#ffcae5', '#ffd1dc', '#ff9eb5', '#f8a5c2', '#ff6b81']
    const hearts = ['#ff4d6d', '#ff758f', '#ff8fa3', '#ff5c8d']
    particlesRef.current = Array.from({ length: count }).map(() => {
      const isHeart = Math.random() < 0.28
      return {
        x: Math.random() * width,
        y: Math.random() * height - height,
        size: isHeart ? 4 + Math.random() * 9 : 6 + Math.random() * 10,
        speedY: 0.6 + Math.random() * 1.4,
        speedX: (Math.random() - 0.5) * 0.7,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.04,
        opacity: 0.35 + Math.random() * 0.45,
        color: isHeart ? hearts[Math.floor(Math.random() * hearts.length)] : palette[Math.floor(Math.random() * palette.length)],
        type: isHeart ? 'heart' : 'sakura',
        sway: Math.random() * Math.PI * 2,
      }
    })
  }, [])

  // 绘制樱花瓣
  const drawPetal = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.ellipse(0, 0, p.size * 0.6, p.size, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }, [])

  // 绘制爱心
  const drawHeart = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity
    ctx.fillStyle = p.color
    const s = p.size * 0.5
    ctx.beginPath()
    ctx.moveTo(0, s * 0.3)
    ctx.bezierCurveTo(-s * 0.5, -s * 0.3, -s, 0, 0, s)
    ctx.bezierCurveTo(s, 0, s * 0.5, -s * 0.3, 0, s * 0.3)
    ctx.fill()
    ctx.restore()
  }, [])

  // Canvas 动画循环
  useEffect(() => {
    if (!theme.flags.enableWelcomeOverlay) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      initParticles(window.innerWidth, window.innerHeight)
    }

    resize()
    window.addEventListener('resize', resize)

    const animate = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.clearRect(0, 0, w, h)

      particlesRef.current.forEach((p) => {
        p.y += p.speedY
        p.x += Math.sin(p.sway) * 0.5 + p.speedX
        p.sway += 0.015
        p.rotation += p.rotationSpeed

        if (p.y > h + 20) {
          p.y = -20
          p.x = Math.random() * w
          p.opacity = 0.35 + Math.random() * 0.45
        }
        if (p.x < -20) p.x = w + 20
        if (p.x > w + 20) p.x = -20

        if (p.type === 'heart') drawHeart(ctx, p)
        else drawPetal(ctx, p)
      })

      rafRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [initParticles, drawPetal, drawHeart])

  // 触发入场
  const handleEnter = useCallback(() => {
    if (exiting) return
    setExiting(true)
    setTimeout(onEnter, theme.animation.welcomeExitDuration * 1000 + 100)
  }, [exiting, onEnter])

  useEffect(() => {
    const onKey = () => handleEnter()
    window.addEventListener('keydown', onKey)
    window.addEventListener('touchstart', onKey, { passive: true })
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('touchstart', onKey)
    }
  }, [handleEnter])

  if (!theme.flags.enableWelcomeOverlay) return null

  const overlayStyle: CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 10000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const bgStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    backgroundImage: `url('/images/welcome-bg.jpg')`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(8px) brightness(0.82)',
    transform: 'scale(1.08)',
  }

  const fallbackGradient: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, #ffe6f0 0%, #f3e5f5 35%, #e1bee7 70%, #f8bbd0 100%)',
    zIndex: -1,
  }

  const glassStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    background: theme.colors.welcomeGlass,
    backdropFilter: 'blur(14px) saturate(140%)',
    WebkitBackdropFilter: 'blur(14px) saturate(140%)',
  }

  const lineBase: CSSProperties = {
    position: 'relative',
    zIndex: 2,
    textAlign: 'center',
    color: theme.colors.welcomeText,
    fontFamily: theme.fonts.serif,
  }

  return (
    <motion.div
      style={overlayStyle}
      onClick={handleEnter}
      initial={{ y: 0 }}
      animate={exiting ? { y: '-100%' } : { y: 0 }}
      transition={{
        duration: theme.animation.welcomeExitDuration,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      <div style={bgStyle} />
      <div style={fallbackGradient} />
      <div style={glassStyle} />

      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          padding: '2rem',
          maxWidth: '90vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.2rem',
        }}
      >
        <motion.p
          style={{
            ...lineBase,
            fontSize: 'clamp(0.95rem, 2.6vw, 1.25rem)',
            letterSpacing: '0.35em',
            color: theme.colors.welcomeMuted,
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
        >
          欢迎来到
        </motion.p>

        <motion.h1
          style={{
            ...lineBase,
            fontSize: 'clamp(2rem, 7vw, 3.6rem)',
            fontWeight: 700,
            letterSpacing: '0.12em',
            textShadow: '0 4px 24px rgba(0,0,0,0.15)',
            margin: 0,
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: 'easeOut' }}
        >
          聪聪和磊磊的小世界
        </motion.h1>

        <motion.p
          style={{
            ...lineBase,
            fontSize: 'clamp(0.95rem, 2.4vw, 1.15rem)',
            color: theme.colors.welcomeAccent,
            letterSpacing: '0.05em',
            marginTop: '0.8rem',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 1.2, ease: 'easeOut' }}
        >
          {currentTime}，很高兴与你相遇
        </motion.p>
      </div>

      <motion.p
        style={{
          position: 'absolute',
          bottom: '6vh',
          left: 0,
          right: 0,
          textAlign: 'center',
          fontFamily: theme.fonts.serif,
          fontSize: 'clamp(0.8rem, 2vw, 0.95rem)',
          color: theme.colors.welcomeMuted,
          letterSpacing: '0.15em',
          textDecoration: 'line-through',
          textDecorationColor: 'rgba(255,255,255,0.45)',
          zIndex: 2,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, scale: [1, 1.06, 1] }}
        transition={{
          opacity: { delay: 1.8, duration: 1 },
          scale: { delay: 1.8, duration: 2.2, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        点击／触摸／按任意键开启吧✨
      </motion.p>
    </motion.div>
  )
}

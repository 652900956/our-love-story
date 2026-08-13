import { motion } from 'framer-motion'
import { useMemo, type CSSProperties } from 'react'
import theme from '../config/theme.config'
import { hero } from '../data/homeContent'
import { useSettings } from '../hooks/useSettings'
import Waves from './Waves'

/**
 * 经典对称饱满心形路径（viewBox 0 0 32 29.6）。
 */
const HEART_PATH =
  'M23.6,0c-2.6,0-4.9,1.3-6.3,3.3C15.9,1.3,13.6,0,11,0C5.5,0,1.3,4.2,1.3,9.7c0,6.6,5.4,11.8,14.7,19.4c9.3-7.6,14.7-12.8,14.7-19.4C30.7,4.2,26.5,0,23.6,0z'

/**
 * Hero 首屏：全宽封面背景 + 中部磨砂卡片（双头像 + 呼吸缩放的红心 + 飘扬点点）。
 * 头像与称呼从 settings 读取（首页与关于我们同步）。
 */
export default function Hero() {
  const { settings } = useSettings()

  return (
    <section
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: `url(${hero.background}) no-repeat center`,
        backgroundSize: 'cover',
        paddingTop: '8rem',
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
        <motion.div
          className="middle"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            background: theme.colors.heroCardBg,
            padding: '4rem 5rem 3rem',
            borderRadius: theme.radius.hero,
            userSelect: 'none',
          }}
        >
          <Avatar src={settings.maleAvatar} name={settings.maleName} />
          <BeatingHeart />
          <Avatar src={settings.femaleAvatar} name={settings.femaleName} />
        </motion.div>
      </div>
      <Waves />
    </section>
  )
}

/**
 * 会呼吸缩放的红心 + 周围飘扬的小点点。
 */
function BeatingHeart() {
  return (
    <motion.div
      animate={{ scale: [theme.heart.scaleFrom, theme.heart.scaleTo, theme.heart.scaleFrom] }}
      transition={{ duration: theme.animation.heartDuration, ease: 'easeInOut', repeat: Infinity }}
      style={{ width: '7rem', height: '7rem', flexShrink: 0, position: 'relative' }}
    >
      <HeartSvg />
      {theme.flags.enableHeartSparkles && <HeartSparkles />}
    </motion.div>
  )
}

/** 精致红色渐变心 + 发光晕 */
function HeartSvg() {
  return (
    <svg viewBox="0 0 32 29.6" width="100%" height="100%" aria-hidden style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="heartGrad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={theme.colors.heart} />
          <stop offset="100%" stopColor={theme.colors.heartDeep} />
        </linearGradient>
        <filter id="heartGlowF" x="-60%" y="-60%" width="220%" height="220%">
          <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={theme.colors.heartGlow} />
        </filter>
      </defs>
      <path filter="url(#heartGlowF)" fill="url(#heartGrad)" d={HEART_PATH} />
    </svg>
  )
}

const heartSvgStyles: CSSProperties = { width: '100%', height: '100%' }

function HeartMini({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 32 29.6" style={heartSvgStyles} fill={color} aria-hidden>
      <path d={HEART_PATH} />
    </svg>
  )
}

/**
 * 心周围飘扬的点点：红圆点 + 少量小红心，从心中心向四周（偏上）飘散、闪烁、淡出。
 */
function HeartSparkles() {
  const h = theme.heart
  const items = useMemo(
    () =>
      Array.from({ length: h.sparkleCount }, (_, i) => {
        const isHeart = i % 4 === 0
        const baseX = (Math.random() - 0.5) * h.spread * 0.5
        const drift = (Math.random() - 0.5) * h.spread
        const duration = h.sparkleMinDuration + Math.random() * (h.sparkleMaxDuration - h.sparkleMinDuration)
        const delay = Math.random() * h.sparkleMaxDuration
        const size = isHeart ? 9 + Math.random() * 7 : 4 + Math.random() * 5
        return { i, isHeart, baseX, drift, duration, delay, size }
      }),
    [h],
  )

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}>
      {items.map((it) => (
        <motion.span
          key={it.i}
          style={{
            position: 'absolute',
            left: `calc(50% + ${it.baseX}px)`,
            top: '50%',
            width: it.size,
            height: it.size,
            ...(it.isHeart
              ? {}
              : {
                  borderRadius: '50%',
                  background: h.sparkleColor,
                  boxShadow: `0 0 6px ${h.sparkleColor}`,
                }),
          }}
          initial={{ opacity: 0, y: 0, x: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], y: h.riseHeight, x: it.drift, scale: [0.4, 1, 0.6] }}
          transition={{ duration: it.duration, delay: it.delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          {it.isHeart && <HeartMini color={h.sparkleHeartColor} />}
        </motion.span>
      ))}
    </div>
  )
}

function Avatar({ src, name }: { src: string; name: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <img
        src={src}
        alt={name}
        draggable={false}
        style={{ width: '10rem', height: '10rem', borderRadius: '10rem', border: '0.2rem solid #fff', objectFit: 'cover' }}
      />
      <span
        style={{
          display: 'block',
          textAlign: 'center',
          fontSize: '1.5rem',
          marginTop: '1rem',
          color: '#fff',
          fontFamily: theme.fonts.serif,
          fontWeight: 700,
        }}
      >
        {name}
      </span>
    </div>
  )
}

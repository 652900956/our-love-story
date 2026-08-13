import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, Users, Images, ListChecks, CalendarDays, Wallet, type LucideIcon } from 'lucide-react'
import theme from '../config/theme.config'
import { cards, type HomeCard } from '../data/homeContent'

const iconMap: Record<HomeCard['icon'], LucideIcon> = {
  Heart,
  MessageCircle,
  Users,
  Images,
  ListChecks,
  CalendarDays,
  Wallet,
}

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: theme.animation.photoStagger, delayChildren: 0.2 },
  },
}

const item = {
  hidden: { opacity: 0, y: 60 },
  show: { opacity: 1, y: 0, transition: { duration: theme.animation.fadeDuration, ease: 'easeOut' } },
  hover: { backgroundColor: theme.colors.bgCardHover, boxShadow: '0 5px 20px #dad7d7cc' },
}

/**
 * 首页卡片网格：3 张小卡（1/3 宽）+ 2 张大卡（1/2 宽）。
 * 入场 fadeInUp 错落；hover 整卡变色 + 图标旋转 -45deg（还原原站）。
 * 点击跳转对应路由（目前仅 / 实现，其余为占位页）。
 */
export default function CardGrid() {
  const navigate = useNavigate()

  return (
    <motion.div
      className="home-grid"
      variants={container}
      initial="hidden"
      animate="show"
      style={{ paddingTop: '3rem', paddingBottom: '3rem' }}
    >
      {cards.map((c) => {
        const Icon = iconMap[c.icon]
        return (
          <motion.div
            key={c.id}
            className={`home-card${c.wide ? ' wide' : ''}`}
            variants={item}
            whileHover="hover"
            onClick={() => navigate(c.to)}
            style={{
              padding: c.wide ? '2rem 1.5rem' : '2rem',
              borderRadius: c.wide ? theme.radius.cardB : theme.radius.card,
              background: theme.colors.bgCard,
              boxShadow: '0 8px 12px #e4e4e473',
              border: '1px solid rgba(208, 206, 206, 0.4)',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              fontFamily: theme.fonts.serif,
              fontWeight: 700,
            }}
          >
            <motion.div
              variants={{ hover: { rotate: -45 } }}
              transition={{ duration: theme.animation.hoverDuration }}
              style={{
                width: c.wide ? '6rem' : '5rem',
                height: c.wide ? '6rem' : '5rem',
                marginRight: c.wide ? '3rem' : '2rem',
                flexShrink: 0,
                color: theme.colors.primary,
              }}
            >
              <Icon style={{ width: '100%', height: '100%' }} strokeWidth={1.5} />
            </motion.div>
            <div style={{ flexGrow: 1 }}>
              <span style={{ fontSize: c.wide ? '2rem' : '1.8rem', lineHeight: '3rem', letterSpacing: '0.2rem' }}>
                {c.title}
              </span>
              <p
                style={{
                  fontSize: c.wide ? '1.2rem' : '1.1rem',
                  letterSpacing: '0.3rem',
                  color: theme.colors.textMuted,
                  marginTop: '.25rem',
                  fontWeight: 500,
                }}
              >
                {c.desc}
              </p>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

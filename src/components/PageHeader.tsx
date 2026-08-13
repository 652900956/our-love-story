import { motion } from 'framer-motion'
import theme from '../config/theme.config'

/**
 * 通用页面标题区：大标题 + 副标题 + 强调分隔线。
 * 所有内页统一用它；标题/副标题由数据驱动，组件不含业务文案。
 */
export default function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '6rem 1rem 1.5rem', fontFamily: theme.fonts.serif }}>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
        style={{ fontSize: '2.6rem', fontWeight: 700, color: theme.colors.textDark, margin: 0 }}
      >
        {title}
      </motion.h1>
      {subtitle && (
        <p style={{ marginTop: '0.8rem', color: theme.colors.textMuted, fontSize: '1.1rem' }}>{subtitle}</p>
      )}
      <div
        style={{
          width: '3rem',
          height: '3px',
          background: theme.colors.primary,
          margin: '1.2rem auto 0',
          borderRadius: '2px',
        }}
      />
    </div>
  )
}

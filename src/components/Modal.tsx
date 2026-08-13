import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import theme from '../config/theme.config'

/**
 * 通用居中弹窗（待办编辑 / 记账编辑复用）。
 * 仅负责「遮罩 + 卡片 + 标题 + 关闭」，内容由 children 注入。
 */
export default function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            background: 'rgba(0,0,0,0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '440px',
              background: theme.colors.bgCard,
              borderRadius: theme.radius.card,
              boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
              padding: '1.6rem 1.6rem 1.4rem',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                width: 32,
                height: 32,
                border: 'none',
                borderRadius: 8,
                background: 'transparent',
                color: theme.colors.textMuted,
                cursor: 'pointer',
                fontSize: '1.2rem',
              }}
            >
              <X size={18} />
            </button>
            <h3
              style={{
                margin: '0 0 1.1rem',
                fontFamily: theme.fonts.serif,
                fontSize: '1.3rem',
                fontWeight: 700,
                color: theme.colors.textDark,
              }}
            >
              {title}
            </h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

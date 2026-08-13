/**
 * ============================================================================
 *  PasscodeGate —— 共享家庭口令门禁
 * ----------------------------------------------------------------------------
 *  多人访问模式下，全站被一道「专属口令」保护：
 *   - 未配置 VITE_APP_PASSCODE（口令为空）：直接放行，不做任何拦截（本地开发默认）。
 *   - 已配置：必须输入正确口令才能进入；口令存于 sessionStorage，同一标签页内免重复输入。
 *
 *  这是「共享家庭口令」身份模型的入口，所有访客使用同一口令，无需注册账号。
 * ============================================================================
 */
import { useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import theme from '../config/theme.config'
import { APP_PASSCODE } from '../config/supabase'

interface Props {
  children: ReactNode
}

const SESSION_KEY = 'lovey_unlocked'

export default function PasscodeGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState<boolean>(() => {
    if (!APP_PASSCODE) return true
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1'
    } catch {
      return false
    }
  })
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [shake, setShake] = useState(false)

  if (unlocked) return <>{children}</>

  const tryUnlock = () => {
    if (value.trim() === APP_PASSCODE) {
      try {
        sessionStorage.setItem(SESSION_KEY, '1')
      } catch {
        /* ignore */
      }
      setUnlocked(true)
    } else {
      setError(true)
      setShake(true)
      window.setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: `linear-gradient(135deg, ${theme.colors.primaryHover} 0%, ${theme.colors.primary} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={
          shake
            ? { opacity: 1, x: [0, -10, 10, -8, 8, 0] }
            : { opacity: 1, x: 0 }
        }
        transition={{ duration: 0.5 }}
        style={{
          background: theme.colors.bgCard,
          borderRadius: theme.radius.cardB,
          padding: '2.6rem 2rem',
          maxWidth: 380,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 24px 70px rgba(0,0,0,0.28)',
        }}
      >
        <div style={{ fontSize: '2.6rem' }}>💞</div>
        <h2
          style={{
            fontFamily: theme.fonts.decorative,
            color: theme.colors.primary,
            margin: '0.4rem 0 0.3rem',
            fontSize: '1.8rem',
          }}
        >
          我们的小天地
        </h2>
        <p
          style={{
            color: theme.colors.textMuted,
            fontFamily: theme.fonts.serif,
            fontSize: '0.9rem',
            marginBottom: '1.6rem',
            lineHeight: 1.7,
          }}
        >
          请输入专属口令，开启只属于我们的空间
        </p>
        <input
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            if (error) setError(false)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryUnlock()
          }}
          placeholder="专属口令"
          type="password"
          autoFocus
          style={{
            width: '100%',
            boxSizing: 'border-box',
            padding: '0.85rem 1rem',
            borderRadius: '0.8rem',
            border: error ? '2px solid #ff4d6d' : '1px solid rgba(0,0,0,0.12)',
            fontFamily: theme.fonts.serif,
            fontSize: '1rem',
            outline: 'none',
            textAlign: 'center',
            transition: 'border-color 0.2s',
          }}
        />
        <motion.button
          type="button"
          onClick={tryUnlock}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            marginTop: '1.3rem',
            width: '100%',
            padding: '0.85rem',
            borderRadius: '0.8rem',
            border: 'none',
            background: theme.colors.primary,
            color: '#fff',
            fontFamily: theme.fonts.serif,
            fontSize: '1rem',
            cursor: 'pointer',
          }}
        >
          进入
        </motion.button>
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                color: '#ff4d6d',
                fontFamily: theme.fonts.serif,
                fontSize: '0.82rem',
                marginTop: '0.9rem',
                marginBottom: 0,
              }}
            >
              口令不对哦，再试试 ~
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

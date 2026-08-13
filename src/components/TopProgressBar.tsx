import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import theme from '../config/theme.config'

/**
 * 路由切换顶部进度条（还原原站 pjax + NProgress）。
 * 每次 location 变化时：进度条出现并增长，完成后淡出。
 * 通过 enablePjaxBar 开关控制。
 */
export default function TopProgressBar() {
  const location = useLocation()
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (!theme.flags.enablePjaxBar) return
    setActive(true)
    const t = window.setTimeout(() => setActive(false), 700)
    return () => window.clearTimeout(t)
  }, [location.pathname])

  if (!theme.flags.enablePjaxBar) return null

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={location.pathname}
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: 1, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '3px',
            background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.primaryHover})`,
            transformOrigin: '0% 50%',
            zIndex: 100000,
          }}
        />
      )}
    </AnimatePresence>
  )
}

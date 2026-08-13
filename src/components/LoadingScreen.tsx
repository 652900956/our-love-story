import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import theme from '../config/theme.config'

/**
 * 首屏加载动画（还原原站 loadinglike.css）。
 * 全屏遮罩 + 居中黑透面板 + 5 个珊瑚粉圆点旋转（load-spin 2.28s）。
 * 通过 enableLoadingScreen 开关控制；默认加载约 1.8s 后淡出。
 */
export default function LoadingScreen() {
  const [visible, setVisible] = useState(theme.flags.enableLoadingScreen)

  useEffect(() => {
    if (!theme.flags.enableLoadingScreen) return
    const t = window.setTimeout(() => setVisible(false), 1800)
    return () => window.clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: theme.colors.loadingMask,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '260px',
              transform: 'translate(-50%, -50%)',
              borderRadius: theme.radius.loading,
              padding: '16px',
              textAlign: 'center',
            }}
          >
            <div style={{ position: 'relative', width: '60px', height: '60px', margin: '0 auto' }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: '10%',
                    top: '10%',
                    width: '80%',
                    height: '80%',
                    animation: `load-spin ${theme.animation.loadingDuration}s linear infinite`,
                    animationDelay: `${0.2 * (i + 1)}s`,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: theme.colors.loadingDot,
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      marginTop: '-10px',
                      marginLeft: '-10px',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

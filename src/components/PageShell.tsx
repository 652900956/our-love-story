import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import theme from '../config/theme.config'
import GridBackground from './GridBackground'

/**
 * 页面外壳：用于路由切换的进入/离开动画（还原原站 pjax 无刷新切换观感）。
 * 子页面统一用它包裹内容。
 * 非首页自动铺白色网格 / 自定义背景；首页自身只把网格放在 Hero 下方。
 */
export default function PageShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <motion.main
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
      style={{ position: 'relative', minHeight: '100vh', zIndex: 1 }}
    >
      {/*
        背景层必须位于内容「之下」：
        GridBackground 是 z-index:0 的定位层，其内层 background 不透明。
        若内容仍是普通（非定位）流，CSS 层叠规则会让 z-index:0 的定位层
        绘制在非定位内容之上 —— 于是内页被这张不透明背景盖成空白、
        且点击被背景层拦截（弹窗像"自动消失"、按钮点了没反应）。
        这里的修复：用 zIndex:1 的定位容器把内容抬到背景之上
        （与首页 Hero 下方区域的处理保持一致）。首页自身已在内部
        再包了一层 zIndex:1，加这层无副作用。
      */}
      {!isHome && <GridBackground />}
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.main>
  )
}

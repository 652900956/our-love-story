/**
 * ============================================================================
 *  components/Sidebar.tsx —— 右下固定侧边栏
 * ----------------------------------------------------------------------------
 *  保留：返回顶部 / 小站首页。
 *  移除：原 GitHub 开源地址按钮（由 MusicPlayer 组件替代）。
 *  与 MusicPlayer 同一列对齐（right: 24px）。
 * ============================================================================
 */

import { ArrowUp, Home } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import theme from '../config/theme.config'

export default function Sidebar() {
  const navigate = useNavigate()
  const scrollToTop = (duration = 500) => {
    window.scrollTo({ top: 0, behavior: duration > 0 ? 'smooth' : 'auto' })
  }

  const items = [
    { key: 'top', title: '返回顶部', icon: <ArrowUp size={22} />, onClick: () => scrollToTop(500) },
    { key: 'home', title: '小站首页', icon: <Home size={22} />, onClick: () => navigate('/') },
  ]

  return (
    <div style={{ position: 'fixed', bottom: '138px', right: '24px', zIndex: 9998 }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {items.map((it) => (
          <li
            key={it.key}
            title={it.title}
            onClick={it.onClick}
            style={{
              width: '46px',
              height: '46px',
              background: theme.colors.primary,
              color: '#fff',
              borderRadius: theme.radius.sidebar,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: `all ${theme.animation.tooltipDuration}s`,
              boxShadow: '0 6px 18px rgba(241, 107, 79, 0.35)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.primaryHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = theme.colors.primary)}
          >
            {it.icon}
          </li>
        ))}
      </ul>
    </div>
  )
}

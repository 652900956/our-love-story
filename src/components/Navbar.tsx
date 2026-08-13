import { useEffect, useState, type CSSProperties } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, Sun, Moon } from 'lucide-react'
import theme from '../config/theme.config'
import { header } from '../data/homeContent'
import { useSettings } from '../hooks/useSettings'
import SettingsPanel from './SettingsPanel'

/**
 * 顶部导航栏：fixed 全宽、毛玻璃。
 * 左 logo / 中 导航菜单（数据驱动、路由跳转、active 高亮）/ 右 slogan + 设置按钮。
 * 滚动超过阈值时文字由 textMain 变 textDark（还原原站滚动变色）。
 */
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { pathname } = useLocation()
  const { settings, update } = useSettings()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > theme.animation.scrollColorThreshold)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const baseColor = scrolled ? theme.colors.textDark : theme.colors.textMain

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '4.5rem',
          display: 'flex',
          alignItems: 'center',
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          background: theme.colors.headerBg,
          boxShadow: '0 2px 15px 0 rgb(115 111 111 / 10%)',
        }}
      >
        <div
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 6rem',
            gap: '2rem',
          }}
        >
          {/* logo */}
          <h1 style={{ fontSize: '1.5rem', fontFamily: theme.fonts.serif, fontWeight: 700, flexShrink: 0 }}>
            <Link to="/" style={{ color: baseColor, transition: `all ${theme.animation.tooltipDuration}s` }}>
              {header.logo} <b style={logoBadge}>{header.version}</b>
            </Link>
          </h1>

          {/* 导航菜单（数据驱动，路由跳转，active 高亮） */}
          <nav className="nav-menu">
            {header.nav.map((it) => {
              const active = it.to === '/' ? pathname === '/' : pathname.startsWith(it.to)
              return (
                <Link
                  key={it.to}
                  to={it.to}
                  style={{
                    position: 'relative',
                    fontFamily: theme.fonts.serif,
                    fontSize: '1.05rem',
                    textDecoration: 'none',
                    color: active ? theme.colors.primary : baseColor,
                    transition: `all ${theme.animation.tooltipDuration}s`,
                    paddingBottom: '0.3rem',
                  }}
                >
                  {it.label}
                  <span
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      height: '2px',
                      width: active ? '100%' : '0%',
                      background: theme.colors.primary,
                      transition: `all ${theme.animation.tooltipDuration}s`,
                    }}
                  />
                </Link>
              )
            })}
          </nav>

          {/* slogan + 主题切换 + 设置按钮 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              className="nav-slogan"
              data-tip={settings.slogan}
              data-tip-position="bottom"
              style={{
                fontFamily: theme.fonts.serif,
                fontWeight: 400,
                fontSize: '1.1rem',
                textAlign: 'right',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                color: baseColor,
                transition: `all ${theme.animation.tooltipDuration}s`,
                maxWidth: '20rem',
              }}
            >
              {settings.slogan}
            </div>

            {/* 主题切换：浅色 <-> 暗色 */}
            <button
              type="button"
              className="nav-btn"
              title={settings.theme === 'dark' ? '切换到浅色' : '切换到暗色'}
              onClick={() => update({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
            >
              {settings.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              type="button"
              className="nav-btn"
              title="设置"
              onClick={() => setSettingsOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  )
}

const logoBadge: CSSProperties = {
  background: '#2098ff',
  color: '#fff',
  padding: '.2rem .8rem',
  fontSize: '1.16rem',
  borderRadius: '.6rem',
}

import theme from '../config/theme.config'
import { footer } from '../data/homeContent'

/** 页脚：白底 + 顶部白色渐隐过渡 + 版权文案。ICP 为空时自动隐藏。 */
export default function Footer() {
  const showIcp = Boolean(footer.icp)

  return (
    <footer
      style={{
        marginTop: '4rem',
        background: theme.colors.bgCard,
        position: 'relative',
      }}
    >
      <div
        style={{
          content: '',
          width: '100%',
          height: '50%',
          position: 'absolute',
          top: '-50%',
          left: 0,
          background: 'linear-gradient(to bottom, transparent, var(--bg-page))',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      />
      <div style={{ padding: '2rem', textAlign: 'center', fontFamily: theme.fonts.serif, fontWeight: 400 }}>
        {showIcp && (
          <p style={{ lineHeight: '2.5rem', color: theme.colors.textFooter, fontWeight: 700 }}>
            <img
              src="https://img.shields.io/badge/ICP-备案-blue?style=flat"
              alt=""
              style={{ width: '1rem', marginRight: '.3rem', verticalAlign: 'middle' }}
            />
            <a href={footer.icpLink || '#'} target="_blank" rel="noreferrer" style={{ color: theme.colors.textFooter }}>
              {footer.icp}
            </a>
          </p>
        )}
        <p style={{ lineHeight: '2.5rem', color: theme.colors.textFooter, fontWeight: 700 }}>{footer.copyright}</p>
      </div>
    </footer>
  )
}

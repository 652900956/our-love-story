import { Link } from 'react-router-dom'
import PageShell from '../components/PageShell'
import theme from '../config/theme.config'

/**
 * 占位页（阶段四将替换为真实内容：点点滴滴 / 留言板 / 关于我们 / Love Photo / Love List）。
 * 仅用于阶段二预览路由切换与导航可达性。
 */
export default function Placeholder({ title }: { title: string }) {
  return (
    <PageShell>
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          fontFamily: theme.fonts.serif,
          color: theme.colors.textMain,
        }}
      >
        <h2 style={{ fontSize: '2rem', fontWeight: 700 }}>{title}</h2>
        <p style={{ color: theme.colors.textMuted }}>页面建设中（阶段四实现）</p>
        <Link
          to="/"
          style={{ color: theme.colors.linkHover, borderBottom: `1px solid ${theme.colors.linkHover}` }}
        >
          返回首页
        </Link>
      </div>
    </PageShell>
  )
}

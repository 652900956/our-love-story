/**
 * ============================================================================
 *  components/GridBackground.tsx —— 白色网格 / 自定义图片背景层
 * ----------------------------------------------------------------------------
 *  默认显示截图中的白色细线网格；若用户在设置里上传了自定义背景图片，
 *  则替换为图片并按设置值应用高斯模糊（CSS filter）。
 *  内页全屏使用，首页仅用于 Hero 下方的内容区。
 * ============================================================================
 */

import type { CSSProperties } from 'react'
import { useSettings } from '../hooks/useSettings'
import theme from '../config/theme.config'

interface GridBackgroundProps {
  /** 容器 position（默认 absolute，可传 fixed） */
  position?: 'absolute' | 'fixed'
  /** 额外样式 */
  style?: CSSProperties
}

export default function GridBackground({ position = 'absolute', style }: GridBackgroundProps) {
  const { settings } = useSettings()
  const hasImage = Boolean(settings.bgImage)

  const lineColor = theme.colors.bgWhiteGrid
  const gridBg = `${
    hasImage
      ? ''
      : `linear-gradient(to right, ${lineColor} 1px, transparent 1px), linear-gradient(to bottom, ${lineColor} 1px, transparent 1px)`
  }`

  return (
    <div
      aria-hidden
      style={{
        position,
        inset: 0,
        zIndex: 0,
        overflow: 'hidden',
        // 背景层是纯装饰，必须禁止拦截指针事件：
        // 否则它会盖在内容之上（见 PageShell 的 zIndex 说明）并吞掉点击，
        // 导致「弹窗点开却像自动消失 / 按钮点了没反应」。
        pointerEvents: 'none',
        ...style,
      }}
    >
      {hasImage ? (
        <div
          style={{
            position: 'absolute',
            inset: '-5%',
            backgroundImage: `url(${settings.bgImage})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            filter: `blur(${settings.bgBlur}px)`,
            WebkitFilter: `blur(${settings.bgBlur}px)`,
            transform: 'scale(1.05)',
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: gridBg,
            backgroundSize: '1.5rem 1.5rem',
            backgroundColor: 'var(--bg-page)',
          }}
        />
      )}
    </div>
  )
}

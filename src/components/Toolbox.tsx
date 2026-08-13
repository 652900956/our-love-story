/* ============================================================================
 * Toolbox.tsx —— 首页嵌入式 Kirameku 悬浮工具箱（React 挂载层）
 * ----------------------------------------------------------------------------
 * 职责：仅负责把隔离的工具箱逻辑挂到首页，不渲染任何业务 UI 本身。
 *   - 悬浮按钮 🧰 与弹窗均由 initToolbox 内部的 JS 动态生成（不写死静态标签）。
 *   - 样式由同目录 styles.css 提供，全部以 kirameku-toolbox- 前缀隔离。
 *   - 组件卸载时调用 destroy 清理 DOM / 事件 / 定时器，避免泄漏。
 *
 * 主题：珊瑚色 + 明暗主题由 index.css 的 CSS 变量驱动，本组件无需感知。
 * ========================================================================== */
import { useEffect } from 'react'
import { initToolbox } from './toolbox/initToolbox'
import './toolbox/styles.css'

export default function Toolbox() {
  useEffect(() => {
    // 工具箱起始：动态创建隔离根容器（不写死在 HTML 静态标签中）
    const root = document.createElement('div')
    root.id = 'kirameku-toolbox-root'
    document.body.appendChild(root)

    const destroy = initToolbox(root)

    return () => {
      destroy()
      root.remove()
    }
    // 工具箱结束
  }, [])

  // 本组件不渲染任何可见节点，仅作为副作用挂载点
  return null
}

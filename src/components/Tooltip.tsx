import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import theme from '../config/theme.config'

/**
 * 全局自定义 Tooltip（还原原站 .custom-tooltip）。
 * 监听文档内任意带 [data-tip] 的元素，hover 时浮出气泡，支持 top/bottom/left/right。
 * 通过 enableTooltip 开关控制；组件只渲染一层气泡，跟随当前 hover 目标定位。
 */
interface TipState {
  text: string
  pos: string
  el: HTMLElement | null
}

export default function Tooltip() {
  const [tip, setTip] = useState<TipState>({ text: '', pos: 'top', el: null })
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!theme.flags.enableTooltip) return

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest('[data-tip]') as HTMLElement | null
      if (el) {
        setTip({ text: el.dataset.tip || '', pos: el.dataset.tipPosition || 'top', el })
      }
    }
    const onOut = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest('[data-tip]')
      if (el) setTip((t) => ({ ...t, el: null }))
    }
    const hide = () => setTip((t) => ({ ...t, el: null }))

    document.addEventListener('mouseover', onOver)
    document.addEventListener('mouseout', onOut)
    window.addEventListener('scroll', hide, { passive: true })
    window.addEventListener('touchstart', hide)

    return () => {
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mouseout', onOut)
      window.removeEventListener('scroll', hide)
      window.removeEventListener('touchstart', hide)
    }
  }, [])

  useLayoutEffect(() => {
    if (!tip.el || !ref.current) return
    const r = tip.el.getBoundingClientRect()
    const tw = ref.current.offsetWidth
    const th = ref.current.offsetHeight
    let top = 0
    let left = 0
    switch (tip.pos) {
      case 'top':
        top = r.top - th - 10
        left = r.left + (r.width - tw) / 2
        break
      case 'bottom':
        top = r.bottom + 10
        left = r.left + (r.width - tw) / 2
        break
      case 'left':
        top = r.top + (r.height - th) / 2
        left = r.left - tw - 10
        break
      case 'right':
        top = r.top + (r.height - th) / 2
        left = r.right + 10
        break
    }
    setCoords({ top: Math.max(10, top), left: Math.max(10, left) })
  }, [tip])

  if (!theme.flags.enableTooltip || !tip.el || !tip.text) return null

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        zIndex: 100000,
        maxWidth: '250px',
        padding: '8px 12px',
        background: theme.colors.tooltipBg,
        color: '#fff',
        borderRadius: '4px',
        fontSize: '14px',
        lineHeight: 1.4,
        whiteSpace: 'pre-line',
        boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
        pointerEvents: 'none',
        transition: `opacity ${theme.animation.tooltipDuration}s ease, transform ${theme.animation.tooltipDuration}s ease`,
      }}
    >
      {tip.text}
    </div>
  )
}

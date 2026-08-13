import { type CSSProperties } from 'react'
import theme from '../config/theme.config'
import { togetherSince } from '../data/homeContent'
import { useLoveTimer } from '../hooks/useLoveTimer'

interface LoveTimerProps {
  since?: string
}

/**
 * 在一起计时：彩虹渐变文字（jianbian 流动） + 天/时/分/秒。
 * since 默认使用 homeContent.togetherSince，可被 settings 覆盖。
 */
export default function LoveTimer({ since = togetherSince }: LoveTimerProps) {
  const { days, hours, minutes, seconds } = useLoveTimer(since)
  const grad = theme.colors.timerGradient.join(', ')

  return (
    <div style={{ textAlign: 'center', fontSize: '1.8rem', letterSpacing: '0.2rem', padding: '4rem 0' }}>
      <span
        style={{
          fontSize: '1.8rem',
          lineHeight: '5rem',
          display: 'block',
          fontFamily: theme.fonts.serif,
          fontWeight: 700,
          backgroundImage: `linear-gradient(270deg, ${grad})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          animation: `jianbian ${theme.animation.jianbianDuration}s linear infinite`,
        }}
      >
        这是我们一起走过的
      </span>
      <b style={numStyle}>{days}天</b>
      <b style={numStyle}>{hours}时</b>
      <b style={numStyle}>{minutes}分</b>
      <b style={numStyle}>{seconds < 10 ? `0${seconds}秒` : `${seconds}秒`}</b>
    </div>
  )
}

const numStyle: CSSProperties = {
  fontSize: '2.7rem',
  fontFamily: "'Noto Serif SC', serif",
  fontWeight: 700,
  margin: '0 0.2rem',
}

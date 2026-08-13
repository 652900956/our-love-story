import theme from '../config/theme.config'

/**
 * Hero 底部波浪（还原原站 SVG 视差）。
 * 4 层 <use> 各有不同时长/延迟，形成错落流动；白色透明度由 theme.waves 控制。
 */
export default function Waves() {
  if (!theme.flags.enableWaves) return null

  const { waveDurations: d, waveDelays: dl } = theme.animation

  const layers = [0, 1, 2, 3].map((i) => ({
    y: [0, 3, 5, 7][i],
    fill: theme.colors.waves[i],
    duration: d[i],
    delay: dl[i],
  }))

  return (
    <svg
      className="waves"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      viewBox="0 24 150 28"
      preserveAspectRatio="none"
      shapeRendering="auto"
      style={{ position: 'relative', width: '100%', height: '5rem', marginTop: '5rem', marginBottom: '-7px', display: 'block' }}
    >
      <defs>
        <path
          id="gentle-wave"
          d="M-160 44c30 0 58-18 88-18s 58 18 88 18 58-18 88-18 58 18 88 18 v44h-352z"
        />
      </defs>
      <g className="parallax">
        {layers.map((l, i) => (
          <use
            key={i}
            xlinkHref="#gentle-wave"
            x={48}
            y={l.y}
            fill={l.fill}
            style={{
              animation: `move-forever ${l.duration}s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite`,
              animationDelay: `${l.delay}s`,
            }}
          />
        ))}
      </g>
    </svg>
  )
}

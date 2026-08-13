/**
 * ============================================================================
 *  theme.config.ts —— 全站主题与全局配置（核心要求四）
 * ----------------------------------------------------------------------------
 *  所有颜色、字体、圆角、动画参数、功能开关都定义在这里。
 *  组件严禁写死这些值，必须从本文件 import `theme` 后使用。
 *  修改本文件即可整体换肤 / 调参，无需改动任何组件。
 *
 *  明暗主题策略：
 *   - 语义色（主色 / 文字 / 卡片 / 页头玻璃等）统一指向 CSS 变量（var(--xxx)），
 *     真实色值由 index.css 的 :root（浅色）与 [data-theme="dark"]（暗色）提供，
 *     切换 data-theme 即可整站换肤，且无需组件 re-render。
 *   - 装饰性色（波浪 / 彩虹时间渐变 / 爱心 / 开场屏）保持具体色值，
 *     在明暗两种模式下观感都合适，不随主题变化。
 * ============================================================================
 */

export interface ThemeColors {
  /** 主色（原站侧边栏珊瑚色） */
  primary: string
  /** 主色 hover */
  primaryHover: string
  /** 主色浅色调（低透明度底纹 / 标签背景，对应 CSS 变量 --primary-soft） */
  primarySoft: string
  /** 正文主色（导航/文案，原站 rgb(97 97 97)） */
  textMain: string
  /** 滚动后变深的文字色（原站 #333） */
  textDark: string
  /** 次要/说明文字（原站 #959595） */
  textMuted: string
  /** 页脚文字（原站 #564141） */
  textFooter: string
  /** 卡片默认背景 */
  bgCard: string
  /** 卡片 hover 背景 */
  bgCardHover: string
  /** 页面淡网格背景的线色（原站 rgba(37,82,110,0.1)） */
  bgGrid: string
  /** 白色网格背景（首页下方 / 内页全局）的线色 */
  bgWhiteGrid: string
  /** 顶部导航栏毛玻璃背景（原站 #ffffffb0） */
  headerBg: string
  /** Hero 中部磨砂卡片背景（原站 #cfcfcfa1） */
  heroCardBg: string
  /** 链接默认色 */
  link: string
  /** 链接 hover 色 */
  linkHover: string
  /** 加载遮罩背景 */
  loadingMask: string
  /** 加载圆点色（原站 #FBC9B9 珊瑚粉） */
  loadingDot: string
  /** 波浪 4 层白色透明度（由远及近） */
  waves: [string, string, string, string]
  /** 时间区彩虹渐变文字的色标 */
  timerGradient: string[]
  /** Tooltip 背景 */
  tooltipBg: string
  /** 爱心主色（非常红，还原原站 like.svg 的红心） */
  heart: string
  /** 爱心深红（渐变立体用） */
  heartDeep: string
  /** 爱心光晕色（呼吸红光） */
  heartGlow: string
  /** 开场屏主文字色 */
  welcomeText: string
  /** 开场屏次要文字色 */
  welcomeMuted: string
  /** 开场屏强调色（时间/装饰） */
  welcomeAccent: string
  /** 开场屏玻璃遮罩色 */
  welcomeGlass: string
}

export interface ThemeFonts {
  /** 中文衬线（正文/标题） */
  serif: string
  /** 装饰英文（logo 等手写体） */
  decorative: string
  /** 装饰英文（圆体） */
  accent: string
}

export interface ThemeRadius {
  card: string
  cardB: string
  hero: string
  sidebar: string
  loading: string
}

export interface ThemeAnimation {
  /** 入场动画时长（秒，对应 animate.css 1s） */
  fadeDuration: number
  /** 开场屏抽纸式退场时长（秒） */
  welcomeExitDuration: number
  /** 相册逐张揭示时长（秒） */
  photoDuration: number
  /** 相册逐张间隔（秒，原站 index*300ms） */
  photoStagger: number
  /** 卡片 hover 过渡时长（秒） */
  hoverDuration: number
  /** 波浪各层时长（秒） */
  waveDurations: [number, number, number, number]
  /** 波浪各层延迟（秒，负值） */
  waveDelays: [number, number, number, number]
  /** 加载旋转时长（秒，原站 2.28s） */
  loadingDuration: number
  /** 时间彩虹流动时长（秒） */
  jianbianDuration: number
  /** Tooltip 过渡时长（秒） */
  tooltipDuration: number
  /** 滚动变色阈值（px） */
  scrollColorThreshold: number
  /** 爱心图标呼吸缩放时长（秒，原站 img 2s） */
  heartDuration: number
}

export interface ThemeFlags {
  /** 樱花飘落粒子 */
  enableParticles: boolean
  /** 首屏加载动画 */
  enableLoadingScreen: boolean
  /** 底部波浪 */
  enableWaves: boolean
  /** 路由切换顶部进度条（还原 NProgress/pjax） */
  enablePjaxBar: boolean
  /** 自定义 Tooltip */
  enableTooltip: boolean
  /** 爱心周围飘扬的小点点 */
  enableHeartSparkles: boolean
  /** 全屏开场欢迎屏 */
  enableWelcomeOverlay: boolean
}

/** 站点明暗主题模式（与 useSettings 中的 theme 字段一致） */
export type ThemeMode = 'light' | 'dark'

/** 爱心与飘扬装饰的配置（还原原站红心呼吸 + 周边点点） */
export interface ThemeHeart {
  /** 呼吸缩放最小倍率 */
  scaleFrom: number
  /** 呼吸缩放最大倍率 */
  scaleTo: number
  /** 飘扬小点数量 */
  sparkleCount: number
  /** 小圆点颜色 */
  sparkleColor: string
  /** 小爱心颜色 */
  sparkleHeartColor: string
  /** 上升高度（像素，负值向上飘） */
  riseHeight: number
  /** 飘扬最短时长（秒） */
  sparkleMinDuration: number
  /** 飘扬最长时长（秒） */
  sparkleMaxDuration: number
  /** 水平飘散范围（像素） */
  spread: number
}

export interface ThemeConfig {
  colors: ThemeColors
  fonts: ThemeFonts
  radius: ThemeRadius
  animation: ThemeAnimation
  flags: ThemeFlags
  heart: ThemeHeart
  /** 相册每批展示数量（"加载更多"每次增量） */
  photoPageSize: number
}

/**
 * 语义色指向 CSS 变量；真实色值见 index.css 的 :root / [data-theme="dark"]。
 * 装饰性色（waves / timerGradient / heart* / welcome*）保持具体色值，明暗通用。
 */
export const theme: ThemeConfig = {
  colors: {
    primary: 'var(--primary)',
    primaryHover: 'var(--primary-hover)',
    primarySoft: 'var(--primary-soft)',
    textMain: 'var(--text-main)',
    textDark: 'var(--text-dark)',
    textMuted: 'var(--text-muted)',
    textFooter: 'var(--text-footer)',
    bgCard: 'var(--bg-card)',
    bgCardHover: 'var(--bg-card-hover)',
    bgGrid: 'var(--bg-grid)',
    bgWhiteGrid: 'var(--bg-white-grid)',
    headerBg: 'var(--header-bg)',
    heroCardBg: 'var(--hero-card-bg)',
    link: 'var(--link)',
    linkHover: 'var(--link-hover)',
    loadingMask: 'var(--loading-mask)',
    loadingDot: 'var(--loading-dot)',
    waves: ['rgba(255,255,255,0.7)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)', '#ffffff'],
    timerGradient: ['#ff4500', '#ffa500', '#ffd700', '#90ee90', '#00ffff', '#1e90ff', '#9370db', '#ff69b4', '#ff4500'],
    tooltipBg: 'var(--tooltip-bg)',
    heart: '#ff2742',
    heartDeep: '#c20f33',
    heartGlow: 'rgba(255, 39, 66, 0.6)',
    welcomeText: '#ffffff',
    welcomeMuted: 'rgba(255, 255, 255, 0.72)',
    welcomeAccent: '#ffd1dc',
    welcomeGlass: 'rgba(255, 230, 240, 0.12)',
  },
  fonts: {
    serif: "'Noto Serif SC', serif",
    decorative: "'Pacifico', cursive",
    accent: "'Concert One', cursive",
  },
  radius: {
    card: '1.5rem',
    cardB: '2rem',
    hero: '4rem',
    sidebar: '1rem',
    loading: '12px',
  },
  animation: {
    fadeDuration: 1,
    welcomeExitDuration: 1.1,
    photoDuration: 0.8,
    photoStagger: 0.3,
    hoverDuration: 0.5,
    waveDurations: [7, 10, 13, 20],
    waveDelays: [-2, -3, -4, -5],
    loadingDuration: 2.28,
    jianbianDuration: 60,
    tooltipDuration: 0.3,
    scrollColorThreshold: 500,
    heartDuration: 2,
  },
  flags: {
    enableParticles: true,
    enableLoadingScreen: true,
    enableWaves: true,
    enablePjaxBar: true,
    enableTooltip: true,
    enableHeartSparkles: true,
    enableWelcomeOverlay: true,
  },
  heart: {
    scaleFrom: 0.82,
    scaleTo: 1.32,
    sparkleCount: 16,
    sparkleColor: 'rgba(255, 70, 95, 0.9)',
    sparkleHeartColor: '#ff4d6d',
    riseHeight: -130,
    sparkleMinDuration: 2.4,
    sparkleMaxDuration: 4.2,
    spread: 72,
  },
  photoPageSize: 6,
}

export default theme

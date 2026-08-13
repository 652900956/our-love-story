import { useEffect, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import theme from './config/theme.config'
import { SettingsProvider, useSettings } from './hooks/useSettings'
import Navbar from './components/Navbar'
import Sidebar from './components/Sidebar'
import Footer from './components/Footer'
import LoadingScreen from './components/LoadingScreen'
import Tooltip from './components/Tooltip'
import Sakura from './components/Sakura'
import TopProgressBar from './components/TopProgressBar'
import WelcomeOverlay from './components/WelcomeOverlay'
import MusicPlayer from './components/MusicPlayer'
import ClickEffect from './components/ClickEffect'
import MouseTrail from './components/MouseTrail'
import PasscodeGate from './components/PasscodeGate'
import Home from './pages/Home'
import About from './pages/About'
import Little from './pages/Little'
import List from './pages/List'
import LovePhoto from './pages/LovePhoto'
import Message from './pages/Message'
import CalendarTodo from './pages/CalendarTodo'
import Ledger from './pages/Ledger'
import Placeholder from './pages/Placeholder'

function AnimatedRoutes() {
  const location = useLocation()
  // 直接渲染 Routes：页面切换改为「卸载旧页 + 新页挂载即淡入」，
  // 由 PageShell 的 motion.main 负责进入动画。
  // 不再用 AnimatePresence mode="wait" 包裹 <Routes> —— 该模式在退出动画
  // 完成回调偶发未触发时会死锁，导致新页面一直等待挂载而整页空白，
  // 必须再次点击导航才会强制重挂（正是「屏保进入后空白、点别的才显示」的根因模式）。
  return (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/little" element={<Little />} />
      <Route path="/leaving" element={<Message />} />
      <Route path="/about" element={<About />} />
      <Route path="/love-img" element={<LovePhoto />} />
      <Route path="/list" element={<List />} />
      <Route path="/calendar" element={<CalendarTodo />} />
      <Route path="/ledger" element={<Ledger />} />
      <Route path="*" element={<Placeholder title="页面走丢了" />} />
    </Routes>
  )
}

/**
 * 根据 settings.theme 给 <html> 设置 data-theme，
 * index.css 据此切换 :root / [data-theme="dark"] 的 CSS 变量（整站换肤）。
 */
function ThemeManager() {
  const { settings } = useSettings()
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'light')
  }, [settings.theme])
  return null
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(theme.flags.enableWelcomeOverlay)

  return (
    <PasscodeGate>
      <SettingsProvider>
        <ThemeManager />
        {showWelcome && <WelcomeOverlay onEnter={() => setShowWelcome(false)} />}
        <TopProgressBar />
        <LoadingScreen />
        <Sakura />
        <Tooltip />
        <Navbar />
        <AnimatedRoutes />
        <Footer />
        <Sidebar />
        <MusicPlayer />
        <ClickEffect />
        <MouseTrail />
      </SettingsProvider>
    </PasscodeGate>
  )
}

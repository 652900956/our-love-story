import PageShell from '../components/PageShell'
import Hero from '../components/Hero'
import LoveTimer from '../components/LoveTimer'
import CardGrid from '../components/CardGrid'
import GridBackground from '../components/GridBackground'
import { useSettings } from '../hooks/useSettings'

/** 首页：Hero 首屏 + 实时计时 + 卡片入口。Hero 保留自己的背景，下方区域铺白色网格 / 自定义背景。 */
export default function Home() {
  const { settings } = useSettings()

  return (
    <PageShell>
      <Hero />
      <section style={{ position: 'relative', zIndex: 1 }}>
        <GridBackground />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <LoveTimer since={settings.togetherSince} />
          <CardGrid />
        </div>
      </section>
    </PageShell>
  )
}

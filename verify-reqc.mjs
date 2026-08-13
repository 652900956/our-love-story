import { chromium } from 'playwright'

const BASE = 'http://localhost:4173'
const errors = []
const day = String(new Date().getDate())
const today = (() => {
  const d = new Date()
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
})()

const log = (...a) => console.log(...a)

// 移除仍残留的全屏 aria-hidden 覆盖层（开场欢迎屏退出动画残留），避免拦截点击
const clearOv = () =>
  page.evaluate(() => {
    document.querySelectorAll('[aria-hidden="true"]').forEach((el) => {
      const s = getComputedStyle(el)
      if (s.position === 'fixed') el.remove()
    })
  })

const browser = await chromium.launch()
const page = await browser.newPage()
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

async function clearStorage() {
  await page.goto(BASE + '/')
  await page.evaluate(() => localStorage.clear())
}

// 完整导航 + 关闭开场欢迎屏（z-index 10000，拦截点击，需先按 Enter 关闭）
async function go(path) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(2000)
}

// ── 1. 日历 & 待办 ──
log('▶ /calendar')
await clearStorage()
await go('/calendar')
await page.waitForSelector('text=日历 & 待办', { timeout: 10000 })

const cells = await page.locator('.cal-sections').count()
const dayBtns = await page.locator('div[style*="aspect-ratio"], div[style*="aspectRatio"]').count()
const sections = await page.getByText('我的待办').count()
const sections2 = await page.getByText('女友待办').count()
const sections3 = await page.getByText('共同待办').count()
log('  sections 我的/女友/共同:', sections, sections2, sections3)

// 选中今天日期格
const todayCell = page.locator('button', { has: page.locator('span', { hasText: new RegExp('^' + day + '$') }) }).first()
await todayCell.evaluate((el) => el.click())
await page.waitForTimeout(300)
const remarkHeader = await page.getByText(today).count()
log('  选中今日后备注头含日期:', remarkHeader > 0, '(', today, ')')

// 写备注
await page.getByPlaceholder('给这一天写点什么吧～').fill('今天是特别的一天 💕')
await clearOv()
await page.getByRole('button', { name: '保存备注' }).evaluate((el) => el.click())
await page.waitForTimeout(300)
const remarkLS = await page.evaluate(() => localStorage.getItem('lovey_calendar_remarks_v1'))
log('  日历备注已持久化:', !!remarkLS, remarkLS)

// 新增待办
await page.locator('.cal-sections button', { hasText: '添加' }).first().evaluate((el) => el.click())
await page.waitForSelector('text=新增待办')
await page.getByPlaceholder('想做点什么？').fill('一起看电影')
await clearOv()
await page.locator('div[style*="position: fixed"]').getByRole('button', { name: '添加' }).evaluate((el) => el.click())
await page.waitForTimeout(400)
const todoLS = await page.evaluate(() => localStorage.getItem('lovey_todos_v1'))
const todoShown = await page.getByText('一起看电影').count()
log('  待办已新增并展示:', todoShown > 0, '| 持久化:', !!todoLS)

// ── 2. 记账本 ──
log('▶ /ledger')
await go('/ledger')
await page.waitForSelector('text=情侣记账本', { timeout: 10000 })
const chartSvg = await page.locator('.ledger-chart svg').count()
log('  趋势图 svg 渲染:', chartSvg > 0)
const sumCards = await page.getByText('我的存款').count()
log('  概览卡片「我的存款」:', sumCards > 0)

// 设置预算
await page.locator('input[type="number"]').fill('3000')
await page.getByRole('button', { name: '保存预算' }).evaluate((el) => el.click())
await page.waitForTimeout(200)

// 记一笔（支出）
await clearOv()
await page.getByRole('button', { name: '记一笔' }).evaluate((el) => el.click())
await page.waitForSelector('text=记一笔')
await page.locator('div[style*="position: fixed"] input[type="number"]').fill('520')
await page.locator('div[style*="position: fixed"] input[list="cat-suggest"]').fill('餐饮')
await clearOv()
await page.locator('div[style*="position: fixed"]').getByRole('button', { name: '保存' }).evaluate((el) => el.click())
await page.waitForTimeout(400)
const ledgerLS = await page.evaluate(() => localStorage.getItem('lovey_ledger_v1'))
const ledShown = await page.getByText('餐饮').count()
log('  记账已新增并展示:', ledShown > 0, '| 持久化:', !!ledgerLS)
const budgetLS = await page.evaluate(() => localStorage.getItem('lovey_budget_v1'))
log('  预算已持久化:', budgetLS)

// 超预算提示：再记一笔大额
await clearOv()
await page.getByRole('button', { name: '记一笔' }).evaluate((el) => el.click())
await page.waitForSelector('text=记一笔')
await page.locator('div[style*="position: fixed"] input[type="number"]').fill('3000')
await page.locator('div[style*="position: fixed"] input[list="cat-suggest"]').fill('购物')
await clearOv()
await page.locator('div[style*="position: fixed"]').getByRole('button', { name: '保存' }).evaluate((el) => el.click())
await page.waitForTimeout(400)
const overWarn = await page.getByText(/本月已超预算/).count()
log('  超预算文字提醒:', overWarn > 0)

// ── 过滤无关报错（已知的 welcome-bg.jpg / favicon 404） ──
const realErrors = errors.filter((e) => !/welcome-bg\.jpg|favicon\.ico|404/.test(e))
log('\n=== 控制台错误（已忽略静态 404）===')
realErrors.forEach((e) => log('  ✗', e))
log('总数(忽略后):', realErrors.length)

await browser.close()
log('\nDONE')
process.exit(realErrors.length ? 1 : 0)

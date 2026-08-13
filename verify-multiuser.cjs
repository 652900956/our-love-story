const { chromium } = require('playwright')
const BASE = 'http://localhost:4188'

;(async () => {
  const errors = []
  const browser = await chromium.launch()
  const ctx = await browser.newContext()
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text()) })
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message))

  const results = {}

  async function step(name, fn) {
    try { await fn(); if (results[name] === undefined) results[name] = 'ok' }
    catch (e) { results[name] = 'FAIL: ' + (e.message || e).split('\n')[0]; console.log('STEP_FAIL ' + name + ': ' + (e.message || e).split('\n')[0]) }
  }

  // 关闭首屏 LoadingScreen（zIndex 99999，约 1.8s + 0.6s 淡出 ≈ 2.4s）
  // 与 WelcomeOverlay（每次整页刷新都会重新出现，点击任意处关闭）。
  async function dismissOverlays() {
    await page.waitForTimeout(2700) // 等 LoadingScreen 退场
    // 若欢迎屏存在则点击关闭
    const welcome = page.locator('text=开启吧')
    if (await welcome.count()) {
      await page.mouse.click(400, 300).catch(() => {})
      await page.waitForTimeout(700)
    }
    // 兜底：等待任何全屏高 zIndex 遮罩消失
    try {
      await page.waitForFunction(() => {
        return ![...document.querySelectorAll('*')].some((el) => {
          const s = getComputedStyle(el)
          return s.position === 'fixed' && (s.zIndex === '99999' || Number(s.zIndex) >= 99999) && s.inset === '0px'
        })
      }, { timeout: 4000 })
    } catch (_) {}
  }

  async function go(path) {
    await page.goto(BASE + path, { waitUntil: 'load' })
    await dismissOverlays()
  }

  // 正式点击前先等待目标可见，避免遮罩穿透；不使用 force（让 Playwright 自动等待可交互）
  const click = (loc) => loc.click({ timeout: 15000 })
  const fill = (loc, val) => loc.fill(val, { timeout: 15000 })

  await step('home+gate', async () => {
    await go('/')
    await page.waitForTimeout(500)
    results.gateVisible = await page.locator('text=我们的小天地').count() // 口令为空应为 0
  })

  await step('message', async () => {
    const ts = Date.now()
    await go('/leaving')
    await fill(page.locator('textarea').first(), '自动化测试留言' + ts)
    await click(page.locator('button:has-text("写下留言")'))
    await page.waitForTimeout(700)
    results.messageCount = await page.locator('text=自动化测试留言' + ts).count()
  })

  await step('ledger', async () => {
    await go('/ledger')
    await click(page.locator('button:has-text("记一笔")'))
    await page.waitForSelector('input[placeholder="0.00"]', { state: 'visible', timeout: 8000 })
    await fill(page.locator('input[placeholder="0.00"]'), '123')
    await click(page.locator('button:has-text("保存")').last())
    await page.waitForTimeout(700)
    results.ledgerCount = await page.locator('text=123').count()
  })

  await step('todo', async () => {
    await go('/calendar')
    await click(page.locator('button:has-text("添加")').first())
    await page.waitForSelector('textarea[placeholder="想做点什么？"]', { state: 'visible', timeout: 8000 })
    const ts = Date.now()
    await fill(page.locator('textarea[placeholder="想做点什么？"]'), '自动化测试待办' + ts)
    await click(page.locator('button:has-text("添加")').last())
    await page.waitForTimeout(700)
    results.todoCount = await page.locator('text=自动化测试待办' + ts).count()
  })

  await step('little', async () => {
    await go('/little')
    await click(page.locator('button:has-text("记录一段小确幸")'))
    await page.waitForSelector('input[placeholder="日期，如 2025-08-17"]', { state: 'visible', timeout: 8000 })
    const ts = Date.now()
    await fill(page.locator('input[placeholder="日期，如 2025-08-17"]'), '2025-08-13')
    await fill(page.locator('input[placeholder="标题"]'), '测试点滴标题' + ts)
    await fill(page.locator('textarea[placeholder="写下今天的碎碎念..."]'), '测试点滴内容')
    await click(page.locator('button:has-text("保存")'))
    await page.waitForTimeout(700)
    results.littleCount = await page.locator('text=测试点滴标题' + ts).count()
  })

  await step('list', async () => {
    await go('/list')
    await click(page.locator('button:has-text("添加一个约定")'))
    await page.waitForSelector('input[placeholder="约定标题"]', { state: 'visible', timeout: 8000 })
    const ts = Date.now()
    await fill(page.locator('input[placeholder="约定标题"]'), '测试约定' + ts)
    await click(page.locator('button:has-text("保存")').last())
    await page.waitForTimeout(700)
    results.listCount = await page.locator('text=测试约定' + ts).count()
  })

  await step('photo', async () => {
    await go('/love-img')
    await page.waitForTimeout(500)
    results.photoFigures = await page.locator('figure').count()
    results.photoAddBtn = await page.locator('button:has-text("添加一张照片")').count() // 本地模式应为 0
  })

  console.log('RESULTS:' + JSON.stringify(results, null, 2))
  console.log('CONSOLE_ERRORS:' + errors.length)
  errors.slice(0, 25).forEach((e) => console.log('  ' + e))
  await browser.close()
})().catch((e) => { console.error('FATAL', e && e.stack ? e.stack : e) })

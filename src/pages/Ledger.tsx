import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Wallet, TrendingUp, AlertTriangle, BarChart3, ChevronDown, X } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from 'recharts'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import theme from '../config/theme.config'
import {
  fetchLedger,
  addLedgerRecord,
  updateLedgerRecord,
  deleteLedgerRecord,
  fetchBudget,
  saveBudget,
  subscribeLedger,
  subscribeBudget,
  type LedgerRecord,
  type LedgerOwnership,
  type LedgerType,
} from '../api/loveyData'
import { todayStr } from '../utils/date'

const OWNERSHIP_META: Record<LedgerOwnership, { label: string; emoji: string }> = {
  mine: { label: '男主人', emoji: '👦' },
  hers: { label: '女主人', emoji: '👧' },
  shared: { label: '共同', emoji: '💑' },
}
const TYPE_META: Record<LedgerType, { label: string }> = {
  deposit: { label: '存款' },
  expense: { label: '支出' },
}
const CATEGORY_SUGGESTIONS = ['餐饮', '交通', '购物', '娱乐', '居住', '医疗', '旅行', '礼物', '其他']

type ChartView =
  | 'spendingTrend'
  | 'jointBalance'
  | 'maleDeposit'
  | 'femaleDeposit'
  | 'monthlyDeposit'
  | 'currentMonthExpense'
  | 'currentMonthBalance'

const CHART_VIEW_META: Record<ChartView, { label: string; icon: string }> = {
  spendingTrend: { label: '月度花销趋势', icon: '📈' },
  jointBalance: { label: '共同余额趋势', icon: '💑' },
  maleDeposit: { label: '男主人存款趋势', icon: '👦' },
  femaleDeposit: { label: '女主人存款趋势', icon: '👧' },
  monthlyDeposit: { label: '每月存款趋势', icon: '💰' },
  currentMonthExpense: { label: '本月支出', icon: '📤' },
  currentMonthBalance: { label: '本月结余', icon: '⚖️' },
}

const fmt = (n: number) =>
  '¥' + n.toLocaleString('zh-CN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  item?: LedgerRecord
}

export default function Ledger() {
  const [records, setRecords] = useState<LedgerRecord[]>([])
  const [budget, setBudget] = useState<number>(0)

  const [viewMonth, setViewMonth] = useState<string>(todayStr().slice(0, 7))
  const [filterType, setFilterType] = useState<LedgerType | 'all'>('all')
  const [filterOwnership, setFilterOwnership] = useState<LedgerOwnership | 'all'>('all')
  const [budgetDraft, setBudgetDraft] = useState<string>('')

  const [modal, setModal] = useState<ModalState>({ open: false, mode: 'add' })
  const [formType, setFormType] = useState<LedgerType>('expense')
  const [formOwnership, setFormOwnership] = useState<LedgerOwnership>('shared')
  const [formDate, setFormDate] = useState<string>(todayStr())
  const [formAmount, setFormAmount] = useState<string>('')
  const [formCategory, setFormCategory] = useState<string>('')
  const [formRemark, setFormRemark] = useState<string>('')
  const [formImage, setFormImage] = useState<string>('')

  const [chartView, setChartView] = useState<ChartView>('spendingTrend')
  const [historyMonths, setHistoryMonths] = useState<number>(12)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const refreshLedger = () => fetchLedger().then(setRecords)
  const refreshBudget = () => fetchBudget().then((b) => { setBudget(b); setBudgetDraft(String(b)) })

  useEffect(() => {
    refreshLedger()
    refreshBudget()
    const unsubL = subscribeLedger(refreshLedger)
    const unsubB = subscribeBudget(refreshBudget)
    return () => {
      unsubL()
      unsubB()
    }
  }, [])

  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    window.addEventListener('mousedown', clickOutside)
    return () => window.removeEventListener('mousedown', clickOutside)
  }, [])

  // —— 月度花销趋势（男 / 女支出分开） ——
  const spendingTrendData = useMemo(() => {
    const map: Record<string, { month: string; mine: number; hers: number; shared: number }> = {}
    for (const r of records) {
      if (r.type !== 'expense') continue
      const m = r.date.slice(0, 7)
      if (!map[m]) map[m] = { month: m, mine: 0, hers: 0, shared: 0 }
      map[m][r.ownership] += r.amount
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [records])

  // —— 共同余额趋势（按日累计） ——
  const jointBalanceData = useMemo(() => {
    const daily: Record<string, number> = {}
    for (const r of records) {
      if (r.ownership !== 'shared') continue
      daily[r.date] = (daily[r.date] || 0) + (r.type === 'deposit' ? r.amount : -r.amount)
    }
    const dates = Object.keys(daily).sort()
    let acc = 0
    return dates.map((date) => {
      acc += daily[date]
      return { date, amount: acc }
    })
  }, [records])

  // —— 男/女主人存款趋势（按日累计） ——
  const depositTrendData = useMemo(() => {
    const dailyMine: Record<string, number> = {}
    const dailyHers: Record<string, number> = {}
    for (const r of records) {
      if (r.type !== 'deposit') continue
      if (r.ownership === 'mine') dailyMine[r.date] = (dailyMine[r.date] || 0) + r.amount
      else if (r.ownership === 'hers') dailyHers[r.date] = (dailyHers[r.date] || 0) + r.amount
    }
    const dates = Array.from(new Set([...Object.keys(dailyMine), ...Object.keys(dailyHers)])).sort()
    let accM = 0
    let accH = 0
    return dates.map((date) => {
      accM += dailyMine[date] || 0
      accH += dailyHers[date] || 0
      return { date, mine: accM, hers: accH }
    })
  }, [records])

  // —— 每月存款 / 支出 / 结余趋势 ——
  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; deposit: number; expense: number; balance: number }> = {}
    for (const r of records) {
      const m = r.date.slice(0, 7)
      if (!map[m]) map[m] = { month: m, deposit: 0, expense: 0, balance: 0 }
      map[m][r.type] += r.amount
    }
    for (const m of Object.keys(map)) map[m].balance = map[m].deposit - map[m].expense
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [records])

  // —— 历史数据范围（取最近 N 个月） ——
  const limitedMonthlyData = useMemo(() => {
    if (historyMonths <= 0) return monthlyData
    return monthlyData.slice(-historyMonths)
  }, [monthlyData, historyMonths])
  const limitedSpendingData = useMemo(() => {
    if (historyMonths <= 0) return spendingTrendData
    return spendingTrendData.slice(-historyMonths)
  }, [spendingTrendData, historyMonths])

  // —— 总览（各自存款 / 共同余额，基于全部记录） ——
  const overview = useMemo(() => {
    let mineDep = 0, hersDep = 0, sharedDep = 0, sharedExp = 0
    for (const r of records) {
      if (r.type !== 'deposit') continue
      if (r.ownership === 'mine') mineDep += r.amount
      else if (r.ownership === 'hers') hersDep += r.amount
      else sharedDep += r.amount
    }
    for (const r of records) {
      if (r.type === 'expense' && r.ownership === 'shared') sharedExp += r.amount
    }
    return { mineDep, hersDep, sharedBalance: sharedDep - sharedExp }
  }, [records])

  // —— 选中月份统计 ——
  const monthStats = useMemo(() => {
    let vmDep = 0, vmExp = 0
    const byCat: Record<string, number> = {}
    for (const r of records) {
      if (r.date.slice(0, 7) !== viewMonth) continue
      if (r.type === 'deposit') vmDep += r.amount
      else {
        vmExp += r.amount
        byCat[r.category || '其他'] = (byCat[r.category || '其他'] || 0) + r.amount
      }
    }
    const overBudget = budget > 0 && vmExp > budget
    return { vmDep, vmExp, balance: vmDep - vmExp, byCat, overBudget, diff: vmExp - budget }
  }, [records, viewMonth, budget])

  // —— 表格（月份 + 类型/归属筛选） ——
  const tableRows = useMemo(
    () =>
      records
        .filter((r) => r.date.slice(0, 7) === viewMonth)
        .filter((r) => filterType === 'all' || r.type === filterType)
        .filter((r) => filterOwnership === 'all' || r.ownership === filterOwnership)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [records, viewMonth, filterType, filterOwnership],
  )

  // —— 预算 ——
  const saveBudgetNow = async () => {
    const n = Number(budgetDraft)
    const val = Number.isFinite(n) && n >= 0 ? n : 0
    await saveBudget(val)
    refreshBudget()
  }

  // —— 增 / 改 ——
  const openAdd = () => {
    setFormType('expense')
    setFormOwnership('shared')
    setFormDate(todayStr())
    setFormAmount('')
    setFormCategory('')
    setFormRemark('')
    setFormImage('')
    setModal({ open: true, mode: 'add' })
  }
  const openEdit = (item: LedgerRecord) => {
    setFormType(item.type)
    setFormOwnership(item.ownership)
    setFormDate(item.date)
    setFormAmount(String(item.amount))
    setFormCategory(item.category)
    setFormRemark(item.remark)
    setFormImage(item.image || '')
    setModal({ open: true, mode: 'edit', item })
  }
  const submitForm = async () => {
    const amount = Number(formAmount)
    if (!Number.isFinite(amount) || amount <= 0) return
    const payload = {
      type: formType,
      ownership: formOwnership,
      date: formDate,
      amount,
      category: formCategory.trim() || '其他',
      remark: formRemark.trim(),
      image: formImage || undefined,
    }
    if (modal.mode === 'add') await addLedgerRecord(payload)
    else if (modal.item) await updateLedgerRecord(modal.item.id, payload)
    setModal({ open: false, mode: 'add' })
    refreshLedger()
  }
  const removeRecord = (id: string) => deleteLedgerRecord(id).then(refreshLedger)

  return (
    <PageShell>
      <PageHeader title="情侣记账本" subtitle="每一笔存款与花费，都是我们一起经营的生活" />
      <p className="page-intro" style={{ color: theme.colors.textMuted }}>
        存款与花费用不同颜色区分，可按月份查看历史账单、设置月度预算，并实时汇总各自的存款与共同余额。
      </p>

      {/* 概览卡片 */}
      <div className="ledger-cards">
        <SummaryCard emoji="👦" title="男主人存款" value={fmt(overview.mineDep)} />
        <SummaryCard emoji="👧" title="女主人存款" value={fmt(overview.hersDep)} />
        <SummaryCard emoji="💑" title="共同余额" value={fmt(overview.sharedBalance)} accent />
        <SummaryCard emoji="📥" title="本月存款" value={fmt(monthStats.vmDep)} />
        <SummaryCard emoji="📤" title="本月支出" value={fmt(monthStats.vmExp)} />
        <SummaryCard
          emoji="💰"
          title="本月结余"
          value={fmt(monthStats.balance)}
          danger={monthStats.balance < 0}
        />
      </div>

      {/* 预算设置 */}
      <div className="ledger-budget">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700 }}>
          <Wallet size={18} style={{ color: theme.colors.primary }} />
          月度预算（{viewMonth}）
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="number"
            min={0}
            value={budgetDraft}
            onChange={(e) => setBudgetDraft(e.target.value)}
            placeholder="如 3000"
            className="love-input"
            style={{ ...inputStyle, width: 140 }}
          />
          <button type="button" className="love-add-btn" onClick={saveBudgetNow} style={btnPrimary}>
            保存预算
          </button>
          {monthStats.overBudget && (
            <span style={warnBadge}>
              <AlertTriangle size={15} /> 本月已超预算 {fmt(monthStats.diff)}！
            </span>
          )}
        </div>
      </div>

      {/* 月度趋势图 / 图表切换 */}
      <div className="ledger-chart">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700 }}>
            <TrendingUp size={18} style={{ color: theme.colors.primary }} />
            {CHART_VIEW_META[chartView].icon} {CHART_VIEW_META[chartView].label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((s) => !s)}
                style={{ ...btnPrimary, padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
              >
                <BarChart3 size={15} /> 切换图表 <ChevronDown size={14} />
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      zIndex: 20,
                      minWidth: 180,
                      background: theme.colors.bgCard,
                      borderRadius: theme.radius.card,
                      boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
                      overflow: 'hidden',
                    }}
                  >
                    {(Object.keys(CHART_VIEW_META) as ChartView[]).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => {
                          setChartView(v)
                          setMenuOpen(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '0.65rem 0.9rem',
                          border: 'none',
                          background: chartView === v ? `${theme.colors.primary}14` : 'transparent',
                          color: chartView === v ? theme.colors.primary : theme.colors.textDark,
                          cursor: 'pointer',
                          fontFamily: theme.fonts.serif,
                          fontSize: '0.88rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {CHART_VIEW_META[v].icon} {CHART_VIEW_META[v].label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <select
              value={historyMonths}
              onChange={(e) => setHistoryMonths(Number(e.target.value))}
              className="love-input"
              style={{ ...inputStyle, minWidth: 110, fontSize: '0.85rem', padding: '0.45rem 0.7rem' }}
              title="查看最近几个月"
            >
              <option value={3}>近 3 月</option>
              <option value={6}>近 6 月</option>
              <option value={12}>近 1 年</option>
              <option value={0}>全部</option>
            </select>
          </div>
        </div>
        <ChartRenderer
          view={chartView}
          spendingData={limitedSpendingData}
          jointBalanceData={jointBalanceData}
          depositTrendData={depositTrendData}
          monthlyData={limitedMonthlyData}
          viewMonth={viewMonth}
          monthStats={monthStats}
        />
      </div>

      {/* 本月分类支出 */}
      <div className="ledger-cats">
        <div style={{ fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700, marginBottom: '0.6rem' }}>
          {viewMonth} 分类支出
        </div>
        {Object.keys(monthStats.byCat).length === 0 ? (
          <div style={{ color: theme.colors.textMuted, fontSize: '0.9rem' }}>本月暂无支出 🎉</div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {Object.entries(monthStats.byCat)
              .sort((a, b) => b[1] - a[1])
              .map(([cat, amt]) => (
                <span key={cat} style={catChip}>
                  {cat} · {fmt(amt)}
                </span>
              ))}
          </div>
        )}
      </div>

      {/* 筛选 + 表格 */}
      <div className="ledger-table-wrap">
        <div style={tableToolbar}>
          <label style={filterLabel}>
            月份
            <input
              type="month"
              value={viewMonth}
              onChange={(e) => setViewMonth(e.target.value)}
              className="love-input"
              style={{ ...inputStyle, marginLeft: '0.5rem' }}
            />
          </label>
          <label style={filterLabel}>
            类型
            <select value={filterType} onChange={(e) => setFilterType(e.target.value as LedgerType | 'all')} className="love-input" style={{ ...inputStyle, marginLeft: '0.5rem', minWidth: 110 }}>
              <option value="all">全部</option>
              <option value="deposit">存款</option>
              <option value="expense">支出</option>
            </select>
          </label>
          <label style={filterLabel}>
            归属
            <select value={filterOwnership} onChange={(e) => setFilterOwnership(e.target.value as LedgerOwnership | 'all')} className="love-input" style={{ ...inputStyle, marginLeft: '0.5rem', minWidth: 110 }}>
              <option value="all">全部</option>
              {(['mine', 'hers', 'shared'] as LedgerOwnership[]).map((o) => (
                <option key={o} value={o}>{OWNERSHIP_META[o].emoji} {OWNERSHIP_META[o].label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={openAdd} style={btnPrimary} className="love-add-btn">
            <Plus size={15} /> 记一笔
          </button>
        </div>

        <table className="ledger-table">
          <thead>
            <tr>
              <th>日期</th>
              <th>类型</th>
              <th>归属</th>
              <th style={{ textAlign: 'right' }}>金额</th>
              <th>分类</th>
              <th>备注</th>
              <th style={{ textAlign: 'right' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence initial={false}>
              {tableRows.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <td style={{ whiteSpace: 'nowrap' }}>{r.date}</td>
                  <td>
                    <span style={{ ...typeBadge, background: r.type === 'deposit' ? 'rgba(16,187,255,0.15)' : 'rgba(241,107,79,0.15)', color: r.type === 'deposit' ? '#10bbff' : theme.colors.primary }}>
                      {TYPE_META[r.type].label}
                    </span>
                  </td>
                  <td>{OWNERSHIP_META[r.ownership].emoji} {OWNERSHIP_META[r.ownership].label}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: r.type === 'deposit' ? '#10bbff' : theme.colors.primary, whiteSpace: 'nowrap' }}>
                    {r.type === 'deposit' ? '+' : '-'}{fmt(r.amount)}
                  </td>
                  <td>{r.category}</td>
                  <td style={{ maxWidth: 180, color: theme.colors.textMuted }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {r.remark || '—'}
                      {r.image && (
                        <img
                          src={r.image}
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: 4, objectFit: 'cover', cursor: 'pointer', border: `1px solid ${theme.colors.primary}55` }}
                          onClick={() => window.open(r.image, '_blank')}
                          title="查看图片"
                        />
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button type="button" onClick={() => openEdit(r)} aria-label="编辑" style={iconBtn}><Pencil size={15} /></button>
                    <button type="button" onClick={() => removeRecord(r.id)} aria-label="删除" style={iconBtn}><Trash2 size={15} /></button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {tableRows.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: theme.colors.textMuted, padding: '1.4rem' }}>
                本月还没有记录，点「记一笔」开始吧 💕
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 新增 / 编辑弹窗 */}
      <Modal open={modal.open} title={modal.mode === 'add' ? '记一笔' : '编辑记录'} onClose={() => setModal({ open: false, mode: 'add' })}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={formLabel}>类型</label>
            <select value={formType} onChange={(e) => setFormType(e.target.value as LedgerType)} className="love-input" style={selectStyle}>
              <option value="deposit">存款</option>
              <option value="expense">支出</option>
            </select>
          </div>
          <div>
            <label style={formLabel}>归属</label>
            <select value={formOwnership} onChange={(e) => setFormOwnership(e.target.value as LedgerOwnership)} className="love-input" style={selectStyle}>
              {(['mine', 'hers', 'shared'] as LedgerOwnership[]).map((o) => (
                <option key={o} value={o}>{OWNERSHIP_META[o].emoji} {OWNERSHIP_META[o].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={formLabel}>发生日期</label>
            <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="love-input" style={selectStyle} />
          </div>
          <div>
            <label style={formLabel}>金额（元）</label>
            <input type="number" min={0} step="0.01" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} placeholder="0.00" className="love-input" style={selectStyle} />
          </div>
          <div>
            <label style={formLabel}>{formType === 'expense' ? '消费分类' : '来源/分类'}</label>
            <input list="cat-suggest" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} placeholder="如 餐饮" className="love-input" style={selectStyle} />
            <datalist id="cat-suggest">
              {CATEGORY_SUGGESTIONS.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div>
            <label style={formLabel}>备注</label>
            <textarea value={formRemark} onChange={(e) => setFormRemark(e.target.value)} rows={2} placeholder="补充说明（可选）" className="love-input" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div>
            <label style={formLabel}>图片</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => setFormImage(String(reader.result))
                reader.readAsDataURL(file)
              }}
              className="love-input"
              style={{ ...inputStyle, padding: '0.4rem 0.7rem' }}
            />
            {formImage && (
              <div style={{ position: 'relative', marginTop: '0.6rem', display: 'inline-block' }}>
                <img src={formImage} alt="预览" style={{ maxHeight: 120, borderRadius: 12, border: `1px solid ${theme.colors.primary}44` }} />
                <button
                  type="button"
                  onClick={() => setFormImage('')}
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: 'none',
                    background: '#ff4d6d',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button type="button" className="love-cancel" onClick={() => setModal({ open: false, mode: 'add' })} style={btnText}>取消</button>
            <button type="button" className="love-add-btn" onClick={submitForm} style={btnPrimary}>{modal.mode === 'add' ? '保存' : '保存'}</button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}

function ChartRenderer({
  view,
  spendingData,
  jointBalanceData,
  depositTrendData,
  monthlyData,
  viewMonth,
  monthStats,
}: {
  view: ChartView
  spendingData: { month: string; mine: number; hers: number; shared: number }[]
  jointBalanceData: { date: string; amount: number }[]
  depositTrendData: { date: string; mine: number; hers: number }[]
  monthlyData: { month: string; deposit: number; expense: number; balance: number }[]
  viewMonth: string
  monthStats: { vmDep: number; vmExp: number; balance: number; byCat: Record<string, number> }
}) {
  const tooltipStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--primary-soft)',
    borderRadius: '0.8rem',
    color: 'var(--text-dark)',
  }
  const axisColor = 'rgba(140,140,140,0.95)'

  if (view === 'spendingTrend') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={spendingData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number, n: string) => [fmt(v), n === 'mine' ? '男主人' : n === 'hers' ? '女主人' : '共同']} />
          <Legend formatter={(v) => (v === 'mine' ? '男主人' : v === 'hers' ? '女主人' : '共同')} />
          <ReferenceLine x={viewMonth} stroke={theme.colors.primary} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="mine" name="mine" stroke="#4cc9ff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="hers" name="hers" stroke="#ff6b9d" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          <Line type="monotone" dataKey="shared" name="shared" stroke="#a855f7" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (view === 'jointBalance') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={jointBalanceData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '共同余额']} />
          <Line type="monotone" dataKey="amount" name="共同余额" stroke={theme.colors.primary} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (view === 'maleDeposit') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={depositTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '男主人存款']} />
          <Line type="monotone" dataKey="mine" name="男主人存款" stroke="#4cc9ff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (view === 'femaleDeposit') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={depositTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: axisColor, fontSize: 11 }} angle={-20} textAnchor="end" height={50} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '女主人存款']} />
          <Line type="monotone" dataKey="hers" name="女主人存款" stroke="#ff6b9d" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (view === 'monthlyDeposit') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '存款']} />
          <ReferenceLine x={viewMonth} stroke={theme.colors.primary} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="deposit" name="存款" stroke="#10bbff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (view === 'currentMonthExpense') {
    const data = Object.entries(monthStats.byCat)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
    if (data.length === 0) {
      return <div style={{ color: theme.colors.textMuted, padding: '3rem 0', textAlign: 'center', fontFamily: theme.fonts.serif }}>本月暂无支出 🎉</div>
    }
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
          <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
          <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '支出']} />
          <Bar dataKey="value" name="支出" fill={theme.colors.primary} radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={`cell-${i}`} fill={i === 0 ? theme.colors.primary : `${theme.colors.primary}aa`} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  // currentMonthBalance
  const data = [{ name: '本月结余', value: monthStats.balance }]
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
        <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} />
        <YAxis tick={{ fill: axisColor, fontSize: 12 }} width={56} tickFormatter={(v) => `¥${v}`} />
        <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [fmt(v), '结余']} />
        <Bar dataKey="value" name="结余" fill={monthStats.balance >= 0 ? '#10bbff' : '#ff4d6d'} radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

function SummaryCard({
  emoji,
  title,
  value,
  accent,
  danger,
}: {
  emoji: string
  title: string
  value: string
  accent?: boolean
  danger?: boolean
}) {
  return (
    <div style={{ ...summaryCard, borderColor: accent ? theme.colors.primary : 'transparent' }}>
      <div style={{ fontSize: '1.3rem' }}>{emoji}</div>
      <div style={{ fontFamily: theme.fonts.serif, color: theme.colors.textMuted, fontSize: '0.85rem', marginTop: '0.3rem' }}>{title}</div>
      <div
        style={{
          fontFamily: theme.fonts.serif,
          fontSize: '1.35rem',
          fontWeight: 700,
          marginTop: '0.3rem',
          color: danger ? '#ff4d6d' : theme.colors.textDark,
        }}
      >
        {value}
      </div>
    </div>
  )
}

const inputStyle: CSSProperties = {
  fontFamily: theme.fonts.serif,
  fontSize: '0.95rem',
  padding: '0.55rem 0.8rem',
  borderRadius: '0.8rem',
  outline: 'none',
  color: theme.colors.textDark,
  background: theme.colors.bgCard,
}
const selectStyle: CSSProperties = { ...inputStyle, minWidth: 160 }
const filterLabel: CSSProperties = { fontFamily: theme.fonts.serif, color: theme.colors.textMuted, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }
const btnPrimary: CSSProperties = { background: theme.colors.primary, color: '#fff', border: 'none', borderRadius: theme.radius.sidebar, padding: '0.6rem 1.6rem', cursor: 'pointer', fontFamily: theme.fonts.serif, fontSize: '0.95rem', boxShadow: '0 6px 16px rgba(241,107,79,0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }
const btnText: CSSProperties = { background: 'transparent', color: theme.colors.textMuted, border: 'none', cursor: 'pointer', fontFamily: theme.fonts.serif, fontSize: '0.95rem', padding: '0.6rem 1rem' }
const summaryCard: CSSProperties = { background: theme.colors.bgCard, borderRadius: theme.radius.card, padding: '1.1rem 1.2rem', boxShadow: '0 8px 24px rgba(0,0,0,0.06)', border: '2px solid transparent' }
const warnBadge: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(255,77,109,0.14)', color: '#ff4d6d', borderRadius: 999, padding: '0.35rem 0.8rem', fontSize: '0.85rem', fontFamily: theme.fonts.serif, fontWeight: 700 }
const catChip: CSSProperties = { background: 'var(--primary-soft)', color: theme.colors.textMain, borderRadius: 999, padding: '0.3rem 0.8rem', fontSize: '0.82rem', fontFamily: theme.fonts.serif }
const typeBadge: CSSProperties = { borderRadius: 999, padding: '0.2rem 0.7rem', fontSize: '0.8rem', fontFamily: theme.fonts.serif, fontWeight: 600 }
const iconBtn: CSSProperties = { width: 30, height: 30, border: 'none', borderRadius: '50%', background: 'transparent', color: theme.colors.textMuted, cursor: 'pointer', transition: 'all 0.3s' }
const tableToolbar: CSSProperties = { display: 'flex', gap: '1.2rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }
const formLabel: CSSProperties = { display: 'block', marginBottom: '0.4rem', color: theme.colors.textMuted, fontSize: '0.85rem', fontFamily: theme.fonts.serif }

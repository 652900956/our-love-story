import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Wallet, TrendingUp, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
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

  // —— 月度趋势（图表用，统计全部历史） ——
  const chartData = useMemo(() => {
    const map: Record<string, { month: string; expense: number; deposit: number }> = {}
    for (const r of records) {
      const m = r.date.slice(0, 7)
      if (!map[m]) map[m] = { month: m, expense: 0, deposit: 0 }
      map[m][r.type] += r.amount
    }
    return Object.values(map).sort((a, b) => a.month.localeCompare(b.month))
  }, [records])

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
    setModal({ open: true, mode: 'add' })
  }
  const openEdit = (item: LedgerRecord) => {
    setFormType(item.type)
    setFormOwnership(item.ownership)
    setFormDate(item.date)
    setFormAmount(String(item.amount))
    setFormCategory(item.category)
    setFormRemark(item.remark)
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

      {/* 月度趋势图 */}
      <div className="ledger-chart">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700 }}>
          <TrendingUp size={18} style={{ color: theme.colors.primary }} />
          月度花销趋势
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="rgba(150,150,150,0.18)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: 'rgba(140,140,140,0.95)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'rgba(140,140,140,0.95)', fontSize: 12 }} width={48} />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-card)',
                border: '1px solid var(--primary-soft)',
                borderRadius: '0.8rem',
                color: 'var(--text-dark)',
              }}
              formatter={(v: number, n: string) => [fmt(v), n === 'expense' ? '支出' : '存款']}
            />
            <Legend formatter={(v) => (v === 'expense' ? '支出' : '存款')} />
            <ReferenceLine x={viewMonth} stroke={theme.colors.primary} strokeDasharray="4 4" />
            <Line type="monotone" dataKey="expense" name="expense" stroke="#ff7a5c" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            <Line type="monotone" dataKey="deposit" name="deposit" stroke="#10bbff" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
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
                  <td style={{ maxWidth: 180, color: theme.colors.textMuted }}>{r.remark || '—'}</td>
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
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
            <button type="button" className="love-cancel" onClick={() => setModal({ open: false, mode: 'add' })} style={btnText}>取消</button>
            <button type="button" className="love-add-btn" onClick={submitForm} style={btnPrimary}>{modal.mode === 'add' ? '保存' : '保存'}</button>
          </div>
        </div>
      </Modal>
    </PageShell>
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

import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Check, CalendarDays, Settings2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import CalendarGrid, { type MarkerStyle, type MarkerShape } from '../components/CalendarGrid'
import Modal from '../components/Modal'
import theme from '../config/theme.config'
import {
  fetchTodos,
  fetchRemarks,
  addTodo,
  updateTodo,
  deleteTodo,
  upsertRemark,
  deleteRemark,
  subscribeTodos,
  subscribeRemarks,
  type TodoItem,
  type TodoCategory,
  type TodoPriority,
  type CalendarRemark,
} from '../api/loveyData'
import { todayStr } from '../utils/date'

const CATEGORY_META: Record<TodoCategory, { label: string; emoji: string }> = {
  mine: { label: '男主人待办', emoji: '👦' },
  hers: { label: '女主人待办', emoji: '👧' },
  shared: { label: '共同待办', emoji: '💑' },
}
const CATEGORIES: TodoCategory[] = ['mine', 'hers', 'shared']

const MARKER_SHAPES: { value: MarkerShape; label: string; icon: string }[] = [
  { value: 'dot', label: '圆点', icon: '●' },
  { value: 'heart', label: '爱心', icon: '♥' },
  { value: 'square', label: '方块', icon: '■' },
]

const LS_MARKER = 'lovey_calendar_marker_style'

function loadMarkerStyle(): MarkerStyle {
  try {
    const raw = localStorage.getItem(LS_MARKER)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return {
    shape: 'dot',
    colors: { mine: '#4cc9ff', hers: '#ff6b9d', shared: '#a855f7' },
  }
}

const PRIORITY_META: Record<TodoPriority, { label: string }> = {
  urgent: { label: '紧急' },
  normal: { label: '普通' },
}

/** 弹窗状态 */
interface ModalState {
  open: boolean
  mode: 'add' | 'edit'
  category: TodoCategory
  item?: TodoItem
}

export default function CalendarTodo() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [remarks, setRemarks] = useState<CalendarRemark[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(todayStr())

  const [remarkDraft, setRemarkDraft] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<TodoCategory | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<TodoPriority | 'all'>('all')
  const [markerStyle, setMarkerStyle] = useState<MarkerStyle>(loadMarkerStyle)
  const [showMarkerPanel, setShowMarkerPanel] = useState(false)

  const [modal, setModal] = useState<ModalState>({
    open: false,
    mode: 'add',
    category: 'mine',
  })

  // 表单草稿
  const [formCategory, setFormCategory] = useState<TodoCategory>('mine')
  const [formDate, setFormDate] = useState<string>(selectedDate)
  const [formContent, setFormContent] = useState<string>('')
  const [formPriority, setFormPriority] = useState<TodoPriority>('normal')

  const refreshTodos = () => fetchTodos().then(setTodos)
  const refreshRemarks = () => fetchRemarks().then(setRemarks)

  useEffect(() => {
    refreshTodos()
    refreshRemarks()
    const unsubT = subscribeTodos(refreshTodos)
    const unsubR = subscribeRemarks(refreshRemarks)
    return () => {
      unsubT()
      unsubR()
    }
  }, [])

  // 选中日期变化时，同步备注草稿
  useEffect(() => {
    const found = remarks.find((r) => r.date === selectedDate)
    setRemarkDraft(found ? found.remark : '')
  }, [selectedDate, remarks])

  const remarkDateSet = useMemo(() => new Set(remarks.map((r) => r.date)), [remarks])

  const todoDates = useMemo(() => {
    const map: Record<string, TodoCategory[]> = {}
    for (const t of todos) {
      if (!map[t.date]) map[t.date] = []
      map[t.date].push(t.category)
    }
    return map
  }, [todos])

  useEffect(() => {
    try {
      localStorage.setItem(LS_MARKER, JSON.stringify(markerStyle))
    } catch {
      /* ignore */
    }
  }, [markerStyle])

  const saveRemark = async () => {
    const text = remarkDraft.trim()
    if (text) {
      await upsertRemark(selectedDate, text)
    } else {
      // 清空则删除
      const exists = remarks.some((r) => r.date === selectedDate)
      if (exists) await deleteRemark(selectedDate)
    }
    refreshRemarks()
  }

  const clearRemark = async () => {
    setRemarkDraft('')
    const exists = remarks.some((r) => r.date === selectedDate)
    if (exists) {
      await deleteRemark(selectedDate)
      refreshRemarks()
    }
  }

  const openAdd = (category: TodoCategory) => {
    setFormCategory(category)
    setFormDate(selectedDate)
    setFormContent('')
    setFormPriority('normal')
    setModal({ open: true, mode: 'add', category })
  }

  const openEdit = (item: TodoItem) => {
    setFormCategory(item.category)
    setFormDate(item.date)
    setFormContent(item.content)
    setFormPriority(item.priority)
    setModal({ open: true, mode: 'edit', category: item.category, item })
  }

  const submitForm = async () => {
    const content = formContent.trim()
    if (!content) return
    if (modal.mode === 'add') {
      await addTodo({
        category: formCategory,
        date: formDate,
        content,
        priority: formPriority,
        done: false,
      })
    } else if (modal.item) {
      await updateTodo(modal.item.id, {
        category: formCategory,
        date: formDate,
        content,
        priority: formPriority,
      })
    }
    setModal({ open: false, mode: 'add', category: 'mine' })
    refreshTodos()
  }

  const toggleDone = (item: TodoItem) => updateTodo(item.id, { done: !item.done }).then(refreshTodos)
  const removeTodo = (id: string) => deleteTodo(id).then(refreshTodos)

  // 当前筛选下的待办
  const filtered = useMemo(
    () =>
      todos.filter(
        (t) =>
          (filterCategory === 'all' || t.category === filterCategory) &&
          (filterPriority === 'all' || t.priority === filterPriority),
      ),
    [todos, filterCategory, filterPriority],
  )

  const visibleCategories =
    filterCategory === 'all' ? CATEGORIES : ([filterCategory] as TodoCategory[])

  return (
    <PageShell>
      <PageHeader title="日历 & 待办" subtitle="阳历与农历同行，记录我们的每一天与每件事" />
      <p className="page-intro" style={{ color: theme.colors.textMuted }}>
        点击日历中的任意日期，即可添加当天的备注；下方按「男主人 / 女主人 / 我们」分板块管理待办，支持优先级与筛选。
      </p>

      {/* 日历 */}
      <div style={{ padding: '0 1rem' }}>
        <CalendarGrid
          selectedDate={selectedDate}
          remarkDates={remarkDateSet}
          todoDates={todoDates}
          markerStyle={markerStyle}
          onSelect={setSelectedDate}
        />
      </div>

      {/* 日期标记样式自定义 */}
      <div style={{ maxWidth: 760, margin: '0.8rem auto 0', padding: '0 1rem' }}>
        <button
          type="button"
          onClick={() => setShowMarkerPanel((s) => !s)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: theme.fonts.serif,
            fontSize: '0.85rem',
            color: theme.colors.textMuted,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Settings2 size={15} /> 自定义日期标记
        </button>
        <AnimatePresence>
          {showMarkerPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                marginTop: '0.6rem',
                padding: '0.9rem 1rem',
                background: theme.colors.bgCard,
                borderRadius: theme.radius.card,
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              <div style={{ marginBottom: '0.7rem', fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700 }}>
                标记图案
              </div>
              <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
                {MARKER_SHAPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setMarkerStyle((prev) => ({ ...prev, shape: s.value }))}
                    style={{
                      flex: 1,
                      padding: '0.4rem',
                      borderRadius: '0.7rem',
                      border: `1.5px solid ${markerStyle.shape === s.value ? theme.colors.primary : 'rgba(208,206,206,0.4)'}`,
                      background: markerStyle.shape === s.value ? `${theme.colors.primary}14` : theme.colors.bgCardHover,
                      color: theme.colors.textDark,
                      cursor: 'pointer',
                      fontFamily: theme.fonts.serif,
                    }}
                  >
                    <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                    <div style={{ fontSize: '0.75rem', marginTop: 2 }}>{s.label}</div>
                  </button>
                ))}
              </div>
              <div style={{ marginBottom: '0.7rem', fontFamily: theme.fonts.serif, color: theme.colors.textDark, fontWeight: 700 }}>
                归属颜色
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                {CATEGORIES.map((cat) => (
                  <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontFamily: theme.fonts.serif, color: theme.colors.textMain, fontSize: '0.9rem' }}>
                    <input
                      type="color"
                      value={markerStyle.colors[cat]}
                      onChange={(e) =>
                        setMarkerStyle((prev) => ({
                          ...prev,
                          colors: { ...prev.colors, [cat]: e.target.value },
                        }))
                      }
                      style={{ width: 32, height: 32, border: 'none', borderRadius: 8, cursor: 'pointer', background: 'transparent' }}
                    />
                    {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                  </label>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 选中日期备注 */}
      <div style={remarkWrap}>
        <div style={remarkHead}>
          <CalendarDays size={18} style={{ color: theme.colors.primary }} />
          <span style={{ fontFamily: theme.fonts.serif, fontWeight: 700, color: theme.colors.textDark }}>
            {selectedDate} 的备注
          </span>
        </div>
        <textarea
          className="love-input"
          value={remarkDraft}
          onChange={(e) => setRemarkDraft(e.target.value)}
          placeholder="给这一天写点什么吧～"
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.7rem' }}>
          <button type="button" className="lovey-add-btn" onClick={saveRemark} style={btnPrimary}>
            保存备注
          </button>
          <button type="button" className="love-cancel" onClick={clearRemark} style={btnText}>
            清空
          </button>
        </div>
      </div>

      {/* 筛选栏 */}
      <div style={filterBar}>
        <div style={filterGroup}>
          <label style={filterLabel}>分类</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as TodoCategory | 'all')}
            className="love-input"
            style={selectStyle}
          >
            <option value="all">全部</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
        </div>
        <div style={filterGroup}>
          <label style={filterLabel}>优先级</label>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TodoPriority | 'all')}
            className="love-input"
            style={selectStyle}
          >
            <option value="all">全部</option>
            <option value="urgent">紧急</option>
            <option value="normal">普通</option>
          </select>
        </div>
      </div>

      {/* 三大待办板块 */}
      <div className="cal-sections" style={{ maxWidth: 980, margin: '0 auto 5rem', padding: '0 1rem' }}>
        {visibleCategories.map((cat) => {
          const items = filtered.filter((t) => t.category === cat)
          const doneCount = items.filter((t) => t.done).length
          return (
            <div key={cat} style={sectionCard}>
              <div style={sectionHead}>
                <span style={{ fontFamily: theme.fonts.serif, fontWeight: 700, fontSize: '1.15rem', color: theme.colors.textDark }}>
                  {CATEGORY_META[cat].emoji} {CATEGORY_META[cat].label}
                </span>
                <span style={{ fontSize: '0.8rem', color: theme.colors.textMuted }}>
                  {doneCount}/{items.length}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem', minHeight: 40 }}>
                <AnimatePresence>
                  {items.map((t) => (
                    <motion.div
                      key={t.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                      style={{
                        ...todoItem,
                        opacity: t.done ? 0.6 : 1,
                        borderColor: t.done ? 'transparent' : 'rgba(208,206,206,0.4)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => toggleDone(t)}
                        aria-label="完成切换"
                        style={{
                          ...checkBtn,
                          background: t.done ? theme.colors.primary : 'transparent',
                          borderColor: theme.colors.primary,
                          color: '#fff',
                        }}
                      >
                        {t.done ? <Check size={14} /> : ''}
                      </button>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: theme.colors.textDark,
                            textDecoration: t.done ? 'line-through' : 'none',
                            fontSize: '0.98rem',
                            fontWeight: 600,
                          }}
                        >
                          {t.content}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedDate(t.date)}
                            style={dateChip}
                            title="在日历中定位"
                          >
                            📅 {t.date}
                          </button>
                          <span
                            style={{
                              ...prioBadge,
                              background: t.priority === 'urgent' ? theme.colors.primary : 'rgba(150,150,150,0.18)',
                              color: t.priority === 'urgent' ? '#fff' : theme.colors.textMuted,
                            }}
                          >
                            {PRIORITY_META[t.priority].label}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button type="button" onClick={() => openEdit(t)} aria-label="编辑" style={iconBtn}>
                          <Pencil size={15} />
                        </button>
                        <button type="button" onClick={() => removeTodo(t.id)} aria-label="删除" style={iconBtn}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {items.length === 0 && <div style={emptyHint}>暂无待办 🎉</div>}
              </div>

              <button type="button" onClick={() => openAdd(cat)} style={addSmallBtn}>
                <Plus size={15} /> 添加
              </button>
            </div>
          )
        })}
      </div>

      {/* 新增 / 编辑弹窗 */}
      <Modal
        open={modal.open}
        title={modal.mode === 'add' ? '新增待办' : '编辑待办'}
        onClose={() => setModal({ open: false, mode: 'add', category: 'mine' })}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={formLabel}>归属</label>
            <select
              value={formCategory}
              onChange={(e) => setFormCategory(e.target.value as TodoCategory)}
              className="love-input"
              style={selectStyle}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_META[c].emoji} {CATEGORY_META[c].label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={formLabel}>关联日期</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="love-input"
              style={selectStyle}
            />
          </div>
          <div>
            <label style={formLabel}>优先级</label>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as TodoPriority)}
              className="love-input"
              style={selectStyle}
            >
              <option value="urgent">紧急</option>
              <option value="normal">普通</option>
            </select>
          </div>
          <div>
            <label style={formLabel}>待办内容</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="想做点什么？"
              rows={3}
              className="love-input"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '0.4rem' }}>
            <button
              type="button"
              className="love-cancel"
              onClick={() => setModal({ open: false, mode: 'add', category: 'mine' })}
              style={btnText}
            >
              取消
            </button>
            <button type="button" className="lovey-add-btn" onClick={submitForm} style={btnPrimary}>
              {modal.mode === 'add' ? '添加' : '保存'}
            </button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}

// ── 内联样式片段（颜色全部取自 theme，保证明暗一致） ──

const inputStyle: CSSProperties = {
  fontFamily: theme.fonts.serif,
  fontSize: '0.95rem',
  padding: '0.6rem 0.9rem',
  borderRadius: '0.8rem',
  outline: 'none',
  color: theme.colors.textDark,
  background: theme.colors.bgCard,
}

const remarkWrap: CSSProperties = {
  maxWidth: 760,
  margin: '1.6rem auto 0',
  padding: '0 1rem',
}
const remarkHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.7rem' }

const filterBar: CSSProperties = {
  maxWidth: 980,
  margin: '2.2rem auto 1.2rem',
  padding: '0 1rem',
  display: 'flex',
  gap: '1.4rem',
  flexWrap: 'wrap',
}
const filterGroup: CSSProperties = { display: 'flex', alignItems: 'center', gap: '0.6rem' }
const filterLabel: CSSProperties = { fontFamily: theme.fonts.serif, color: theme.colors.textMuted, fontSize: '0.9rem' }
const selectStyle: CSSProperties = { ...inputStyle, minWidth: 150 }

const sectionCard: CSSProperties = {
  background: theme.colors.bgCard,
  borderRadius: theme.radius.card,
  padding: '1.2rem',
  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column',
}
const sectionHead: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '1rem',
}

const todoItem: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '0.7rem',
  padding: '0.8rem 0.9rem',
  background: theme.colors.bgCardHover,
  borderRadius: '0.9rem',
  border: '1px solid transparent',
}
const checkBtn: CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: '50%',
  border: '2px solid',
  flexShrink: 0,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s',
  marginTop: 2,
}
const dateChip: CSSProperties = {
  border: 'none',
  background: 'var(--primary-soft)',
  color: theme.colors.textMain,
  borderRadius: 999,
  padding: '0.15rem 0.6rem',
  fontSize: '0.75rem',
  cursor: 'pointer',
  fontFamily: theme.fonts.serif,
}
const prioBadge: CSSProperties = {
  borderRadius: 999,
  padding: '0.15rem 0.6rem',
  fontSize: '0.75rem',
  fontFamily: theme.fonts.serif,
}
const iconBtn: CSSProperties = {
  width: 30,
  height: 30,
  border: 'none',
  borderRadius: '50%',
  background: 'transparent',
  color: theme.colors.textMuted,
  cursor: 'pointer',
  transition: 'all 0.3s',
}
const emptyHint: CSSProperties = {
  textAlign: 'center',
  color: theme.colors.textMuted,
  fontSize: '0.85rem',
  padding: '0.6rem 0',
}
const addSmallBtn: CSSProperties = {
  marginTop: '1rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.3rem',
  border: `1px dashed ${theme.colors.primary}66`,
  background: 'transparent',
  color: theme.colors.primary,
  borderRadius: '0.8rem',
  padding: '0.55rem',
  cursor: 'pointer',
  fontFamily: theme.fonts.serif,
  fontSize: '0.9rem',
  transition: 'all 0.3s',
}
const formLabel: CSSProperties = { display: 'block', marginBottom: '0.4rem', color: theme.colors.textMuted, fontSize: '0.85rem', fontFamily: theme.fonts.serif }
const btnPrimary: CSSProperties = { background: theme.colors.primary, color: '#fff', border: 'none', borderRadius: theme.radius.sidebar, padding: '0.6rem 1.6rem', cursor: 'pointer', fontFamily: theme.fonts.serif, fontSize: '0.95rem', boxShadow: '0 6px 16px rgba(241,107,79,0.3)' }
const btnText: CSSProperties = { background: 'transparent', color: theme.colors.textMuted, border: 'none', cursor: 'pointer', fontFamily: theme.fonts.serif, fontSize: '0.95rem', padding: '0.6rem 1rem' }

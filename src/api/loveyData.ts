/**
 * ============================================================================
 *  loveyData —— 情侣站统一数据适配器（Decoupled Data Adapter）
 * ----------------------------------------------------------------------------
 *  设计目标（核心要求）：上层业务（日历 / 待办 / 记账页面）只调用本模块导出的
 *  异步 CRUD 函数，绝不直连 localStorage / 后端。
 *
 *  已配置 Supabase（.env 填 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY）时，
 *  activeStore 自动切换为 remoteStore 走云库（多人共享 + 实时同步）；
 *  未配置时回退 localStorage（本地即可运行调试）。页面业务代码零改动。
 *
 *  ⚠️ 严禁页面业务逻辑里直接写 localStorage / fetch，统一走本适配器。
 * ============================================================================
 */

import { supabase, isSupabaseConfigured } from '../config/supabase'
import { subscribeTable } from './realtime'

// ───────────────────────────────────────────────────────────────────────────
// 1) 数据类型
// ───────────────────────────────────────────────────────────────────────────

/** 待办归属 */
export type TodoCategory = 'mine' | 'hers' | 'shared'
/** 待办优先级 */
export type TodoPriority = 'urgent' | 'normal'

export interface TodoItem {
  id: string
  /** 归属：我的 / 女友 / 共同 */
  category: TodoCategory
  /** 关联日期 YYYY-MM-DD */
  date: string
  /** 待办内容 */
  content: string
  /** 优先级 */
  priority: TodoPriority
  /** 是否完成 */
  done: boolean
  /** 创建时间 ISO */
  createdAt: string
}

export type NewTodo = Omit<TodoItem, 'id' | 'createdAt'>
export type TodoPatch = Partial<Omit<TodoItem, 'id' | 'createdAt'>>

export interface TodoFilter {
  category?: TodoCategory
  priority?: TodoPriority
}

/** 日历备注：以日期为唯一键 */
export interface CalendarRemark {
  /** YYYY-MM-DD（唯一键） */
  date: string
  remark: string
}

/** 记账归属 */
export type LedgerOwnership = 'mine' | 'hers' | 'shared'
/** 记账类型：存款 / 支出 */
export type LedgerType = 'deposit' | 'expense'

export interface LedgerRecord {
  id: string
  /** 发生日期 YYYY-MM-DD */
  date: string
  /** 存款 / 支出 */
  type: LedgerType
  /** 归属 */
  ownership: LedgerOwnership
  /** 金额（正数，单位元） */
  amount: number
  /** 消费分类（支出时）或存款来源等自由文本 */
  category: string
  /** 备注 */
  remark: string
  /** 图片（base64 Data URL 或 图床 URL） */
  image?: string
  /** 创建时间 ISO */
  createdAt: string
}

export type NewLedgerRecord = Omit<LedgerRecord, 'id' | 'createdAt'>
export type LedgerPatch = Partial<Omit<LedgerRecord, 'id' | 'createdAt'>>

// ───────────────────────────────────────────────────────────────────────────
// 2) 存储层接口（与具体实现无关）
// ───────────────────────────────────────────────────────────────────────────

interface LoveyStore {
  // —— 待办 ——
  getTodos(): Promise<TodoItem[]>
  addTodo(input: NewTodo): Promise<TodoItem>
  updateTodo(id: string, patch: TodoPatch): Promise<TodoItem>
  deleteTodo(id: string): Promise<void>
  // —— 日历备注 ——
  getRemarks(): Promise<CalendarRemark[]>
  upsertRemark(date: string, remark: string): Promise<CalendarRemark>
  deleteRemark(date: string): Promise<void>
  // —— 记账 ——
  getLedger(): Promise<LedgerRecord[]>
  addLedgerRecord(input: NewLedgerRecord): Promise<LedgerRecord>
  updateLedgerRecord(id: string, patch: LedgerPatch): Promise<LedgerRecord>
  deleteLedgerRecord(id: string): Promise<void>
  // —— 月度预算（单值配置） ——
  getBudget(): Promise<number>
  setBudget(amount: number): Promise<void>
}

// ───────────────────────────────────────────────────────────────────────────
// 3) localStorage 实现（当前阶段）
// ───────────────────────────────────────────────────────────────────────────

const LS_KEYS = {
  todos: 'lovey_todos_v1',
  remarks: 'lovey_calendar_remarks_v1',
  ledger: 'lovey_ledger_v1',
  budget: 'lovey_budget_v1',
}

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T[]) : []
  } catch {
    return []
  }
}

function writeList<T>(key: string, list: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    /* 隐私模式 / 配额满：静默失败 */
  }
}

function genId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

const localStore: LoveyStore = {
  async getTodos() {
    return readList<TodoItem>(LS_KEYS.todos)
  },
  async addTodo(input) {
    const item: TodoItem = { ...input, id: genId('todo'), createdAt: new Date().toISOString() }
    const list = readList<TodoItem>(LS_KEYS.todos)
    list.push(item)
    writeList(LS_KEYS.todos, list)
    return item
  },
  async updateTodo(id, patch) {
    const list = readList<TodoItem>(LS_KEYS.todos)
    const idx = list.findIndex((t) => t.id === id)
    if (idx === -1) throw new Error(`待办不存在: ${id}`)
    list[idx] = { ...list[idx], ...patch }
    writeList(LS_KEYS.todos, list)
    return list[idx]
  },
  async deleteTodo(id) {
    const list = readList<TodoItem>(LS_KEYS.todos).filter((t) => t.id !== id)
    writeList(LS_KEYS.todos, list)
  },

  async getRemarks() {
    return readList<CalendarRemark>(LS_KEYS.remarks)
  },
  async upsertRemark(date, remark) {
    const list = readList<CalendarRemark>(LS_KEYS.remarks)
    const idx = list.findIndex((r) => r.date === date)
    if (idx === -1) {
      const item = { date, remark }
      list.push(item)
      writeList(LS_KEYS.remarks, list)
      return item
    }
    list[idx] = { date, remark }
    writeList(LS_KEYS.remarks, list)
    return list[idx]
  },
  async deleteRemark(date) {
    const list = readList<CalendarRemark>(LS_KEYS.remarks).filter((r) => r.date !== date)
    writeList(LS_KEYS.remarks, list)
  },

  async getLedger() {
    return readList<LedgerRecord>(LS_KEYS.ledger)
  },
  async addLedgerRecord(input) {
    const item: LedgerRecord = { ...input, id: genId('led'), createdAt: new Date().toISOString() }
    const list = readList<LedgerRecord>(LS_KEYS.ledger)
    list.push(item)
    writeList(LS_KEYS.ledger, list)
    return item
  },
  async updateLedgerRecord(id, patch) {
    const list = readList<LedgerRecord>(LS_KEYS.ledger)
    const idx = list.findIndex((r) => r.id === id)
    if (idx === -1) throw new Error(`记账记录不存在: ${id}`)
    list[idx] = { ...list[idx], ...patch }
    writeList(LS_KEYS.ledger, list)
    return list[idx]
  },
  async deleteLedgerRecord(id) {
    const list = readList<LedgerRecord>(LS_KEYS.ledger).filter((r) => r.id !== id)
    writeList(LS_KEYS.ledger, list)
  },
  async getBudget() {
    try {
      const raw = localStorage.getItem(LS_KEYS.budget)
      return raw ? Number(raw) || 0 : 0
    } catch {
      return 0
    }
  },
  async setBudget(amount) {
    try {
      localStorage.setItem(LS_KEYS.budget, String(amount))
    } catch {
      /* 忽略 */
    }
  },
}

// ───────────────────────────────────────────────────────────────────────────
// 4) 后端实现（Supabase 真实 CRUD）
// ----------------------------------------------------------------------------
//  只要 .env 配置了 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY（isSupabaseConfigured
//  为 true），activeStore 即切换为 remoteStore，走 Supabase 云库；
//  任意一步失败会自动回退 localStore，保证功能不中断。
//  页面业务代码无需任何改动即可获得「多人共享 + 实时同步」。
// ───────────────────────────────────────────────────────────────────────────

const remoteStore: LoveyStore = {
  // —— 待办 ——
  async getTodos() {
    if (!supabase) return localStore.getTodos()
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[loveyData] getTodos 失败，回退本地：', error.message)
      return localStore.getTodos()
    }
    return (data ?? []).map(
      (r): TodoItem => ({
        id: String(r.id),
        category: r.category,
        date: r.date,
        content: r.content,
        priority: r.priority,
        done: r.done,
        createdAt: String(r.created_at),
      }),
    )
  },
  async addTodo(input) {
    if (!supabase) return localStore.addTodo(input)
    const { data, error } = await supabase
      .from('todos')
      .insert({
        category: input.category,
        date: input.date,
        content: input.content,
        priority: input.priority,
        done: input.done,
      })
      .select()
      .single()
    if (error) {
      console.warn('[loveyData] addTodo 失败，回退本地：', error.message)
      return localStore.addTodo(input)
    }
    return {
      id: String(data.id),
      category: data.category,
      date: data.date,
      content: data.content,
      priority: data.priority,
      done: data.done,
      createdAt: String(data.created_at),
    }
  },
  async updateTodo(id, patch) {
    if (!supabase) return localStore.updateTodo(id, patch)
    const { data, error } = await supabase
      .from('todos')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.warn('[loveyData] updateTodo 失败，回退本地：', error.message)
      return localStore.updateTodo(id, patch)
    }
    return {
      id: String(data.id),
      category: data.category,
      date: data.date,
      content: data.content,
      priority: data.priority,
      done: data.done,
      createdAt: String(data.created_at),
    }
  },
  async deleteTodo(id) {
    if (!supabase) return localStore.deleteTodo(id)
    const { error } = await supabase.from('todos').delete().eq('id', id)
    if (error) {
      console.warn('[loveyData] deleteTodo 失败，回退本地：', error.message)
      return localStore.deleteTodo(id)
    }
  },

  // —— 日历备注 ——
  async getRemarks() {
    if (!supabase) return localStore.getRemarks()
    const { data, error } = await supabase.from('calendar_remarks').select('*')
    if (error) {
      console.warn('[loveyData] getRemarks 失败，回退本地：', error.message)
      return localStore.getRemarks()
    }
    return (data ?? []).map((r): CalendarRemark => ({ date: r.date, remark: r.remark }))
  },
  async upsertRemark(date, remark) {
    if (!supabase) return localStore.upsertRemark(date, remark)
    const { data, error } = await supabase
      .from('calendar_remarks')
      .upsert({ date, remark })
      .select()
      .single()
    if (error) {
      console.warn('[loveyData] upsertRemark 失败，回退本地：', error.message)
      return localStore.upsertRemark(date, remark)
    }
    return { date: data.date, remark: data.remark }
  },
  async deleteRemark(date) {
    if (!supabase) return localStore.deleteRemark(date)
    const { error } = await supabase.from('calendar_remarks').delete().eq('date', date)
    if (error) {
      console.warn('[loveyData] deleteRemark 失败，回退本地：', error.message)
      return localStore.deleteRemark(date)
    }
  },

  // —— 记账 ——
  async getLedger() {
    if (!supabase) return localStore.getLedger()
    const { data, error } = await supabase
      .from('ledger')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) {
      console.warn('[loveyData] getLedger 失败，回退本地：', error.message)
      return localStore.getLedger()
    }
    return (data ?? []).map(
      (r): LedgerRecord => ({
        id: String(r.id),
        date: r.date,
        type: r.type,
        ownership: r.ownership,
        amount: Number(r.amount),
        category: r.category,
        remark: r.remark,
        image: r.image ?? undefined,
        createdAt: String(r.created_at),
      }),
    )
  },
  async addLedgerRecord(input) {
    if (!supabase) return localStore.addLedgerRecord(input)
    const { data, error } = await supabase
      .from('ledger')
      .insert({
        date: input.date,
        type: input.type,
        ownership: input.ownership,
        amount: input.amount,
        category: input.category,
        remark: input.remark,
        image: input.image ?? null,
      })
      .select()
      .single()
    if (error) {
      console.warn('[loveyData] addLedgerRecord 失败，回退本地：', error.message)
      return localStore.addLedgerRecord(input)
    }
    return {
      id: String(data.id),
      date: data.date,
      type: data.type,
      ownership: data.ownership,
      amount: Number(data.amount),
      category: data.category,
      remark: data.remark,
      image: data.image ?? undefined,
      createdAt: String(data.created_at),
    }
  },
  async updateLedgerRecord(id, patch) {
    if (!supabase) return localStore.updateLedgerRecord(id, patch)
    const { data, error } = await supabase
      .from('ledger')
      .update(patch)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      console.warn('[loveyData] updateLedgerRecord 失败，回退本地：', error.message)
      return localStore.updateLedgerRecord(id, patch)
    }
    return {
      id: String(data.id),
      date: data.date,
      type: data.type,
      ownership: data.ownership,
      amount: Number(data.amount),
      category: data.category,
      remark: data.remark,
      image: data.image ?? undefined,
      createdAt: String(data.created_at),
    }
  },
  async deleteLedgerRecord(id) {
    if (!supabase) return localStore.deleteLedgerRecord(id)
    const { error } = await supabase.from('ledger').delete().eq('id', id)
    if (error) {
      console.warn('[loveyData] deleteLedgerRecord 失败，回退本地：', error.message)
      return localStore.deleteLedgerRecord(id)
    }
  },

  // —— 月度预算（单行配置，id 固定 1） ——
  async getBudget() {
    if (!supabase) return localStore.getBudget()
    const { data, error } = await supabase.from('budget').select('amount').eq('id', 1).single()
    if (error) {
      console.warn('[loveyData] getBudget 失败，回退本地：', error.message)
      return localStore.getBudget()
    }
    return Number(data?.amount) || 0
  },
  async setBudget(amount) {
    if (!supabase) return localStore.setBudget(amount)
    const { error } = await supabase.from('budget').upsert({ id: 1, amount })
    if (error) {
      console.warn('[loveyData] setBudget 失败，回退本地：', error.message)
      return localStore.setBudget(amount)
    }
  },
}

/** 当前激活的存储层：配置 Supabase 走远端，否则本地兜底 */
const activeStore: LoveyStore = isSupabaseConfigured ? remoteStore : localStore

// ───────────────────────────────────────────────────────────────────────────
// 实时订阅（多设备同步）：订阅对应表的变更，触发页面重新拉取
// ───────────────────────────────────────────────────────────────────────────
export const subscribeTodos = (cb: () => void): (() => void) => subscribeTable('todos', cb)
export const subscribeRemarks = (cb: () => void): (() => void) => subscribeTable('calendar_remarks', cb)
export const subscribeLedger = (cb: () => void): (() => void) => subscribeTable('ledger', cb)
export const subscribeBudget = (cb: () => void): (() => void) => subscribeTable('budget', cb)

// ───────────────────────────────────────────────────────────────────────────
// 5) 对外公开 API（页面只调用这些）
// ───────────────────────────────────────────────────────────────────────────

// —— 待办 ——
export const fetchTodos = (filter?: TodoFilter): Promise<TodoItem[]> =>
  activeStore.getTodos().then((list) =>
    list.filter(
      (t) =>
        (!filter?.category || t.category === filter.category) &&
        (!filter?.priority || t.priority === filter.priority),
    ),
  )
export const addTodo = (input: NewTodo): Promise<TodoItem> => activeStore.addTodo(input)
export const updateTodo = (id: string, patch: TodoPatch): Promise<TodoItem> =>
  activeStore.updateTodo(id, patch)
export const deleteTodo = (id: string): Promise<void> => activeStore.deleteTodo(id)

// —— 日历备注 ——
export const fetchRemarks = (): Promise<CalendarRemark[]> => activeStore.getRemarks()
export const upsertRemark = (date: string, remark: string): Promise<CalendarRemark> =>
  activeStore.upsertRemark(date, remark)
export const deleteRemark = (date: string): Promise<void> => activeStore.deleteRemark(date)

// —— 记账 ——
export const fetchLedger = (): Promise<LedgerRecord[]> => activeStore.getLedger()
export const addLedgerRecord = (input: NewLedgerRecord): Promise<LedgerRecord> =>
  activeStore.addLedgerRecord(input)
export const updateLedgerRecord = (id: string, patch: LedgerPatch): Promise<LedgerRecord> =>
  activeStore.updateLedgerRecord(id, patch)
export const deleteLedgerRecord = (id: string): Promise<void> =>
  activeStore.deleteLedgerRecord(id)

// —— 月度预算 ——
export const fetchBudget = (): Promise<number> => activeStore.getBudget()
export const saveBudget = (amount: number): Promise<void> => activeStore.setBudget(amount)

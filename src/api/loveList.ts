/**
 * ============================================================================
 *  loveList API —— Love List（恋爱清单 / 约定）读写
 * ----------------------------------------------------------------------------
 *  - 已配置 Supabase：读写 list_items 表，多人共享、实时同步。
 *  - 未配置 / 读取失败：回退浏览器 localStorage（key: lovey-list-items），
 *    首次以 src/data/listContent.ts 的 items 作为初始值。
 *  页面只调用本模块，无需关心数据来源。
 * ============================================================================
 */
import { supabase, isSupabaseConfigured } from '../config/supabase'
import { subscribeTable } from './realtime'
import { list, type ListItem } from '../data/listContent'

const LS_KEY = 'lovey-list-items'

export type NewListItem = Omit<ListItem, 'id' | 'done'>

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `t-${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function readLocal(): ListItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as ListItem[]
  } catch {
    /* 解析失败回落默认 */
  }
  return list.items
}

function writeLocal(items: ListItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items))
  } catch {
    /* 忽略写入失败（隐私模式等） */
  }
}

/** 读取全部清单项 */
export async function fetchList(): Promise<ListItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('list_items')
      .select('id, title, description, done')
      .order('created_at', { ascending: true })
    if (!error && data) {
      return data.map(
        (r): ListItem => ({
          id: String(r.id),
          title: String(r.title ?? ''),
          desc: String(r.description ?? ''),
          done: Boolean(r.done),
        }),
      )
    }
    console.warn('[loveList] Supabase 读取失败，回退本地：', error?.message)
  }
  return readLocal()
}

/** 新增一条约定，返回写入后的完整记录 */
export async function addList(input: NewListItem): Promise<ListItem> {
  const item: ListItem = { id: genId(), title: input.title, desc: input.desc, done: false }
  if (supabase) {
    const { data, error } = await supabase
      .from('list_items')
      .insert({ id: item.id, title: item.title, description: item.desc, done: false })
      .select('id, title, description, done')
      .single()
    if (!error && data) {
      return {
        id: String(data.id),
        title: String(data.title ?? item.title),
        desc: String(data.description ?? ''),
        done: Boolean(data.done),
      }
    }
    console.warn('[loveList] Supabase 写入失败，回退本地：', error?.message)
  }
  const items = readLocal()
  items.push(item)
  writeLocal(items)
  return item
}

/** 切换某条约定的完成状态 */
export async function toggleList(id: string, done: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('list_items').update({ done }).eq('id', id)
    if (!error) return
    console.warn('[loveList] Supabase 更新失败，回退本地：', error?.message)
  }
  writeLocal(readLocal().map((it) => (it.id === id ? { ...it, done } : it)))
}

/** 删除一条约定 */
export async function deleteList(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('list_items').delete().eq('id', id)
    if (!error) return
    console.warn('[loveList] Supabase 删除失败，回退本地：', error?.message)
  }
  writeLocal(readLocal().filter((it) => it.id !== id))
}

/** 订阅清单表变更，触发页面重新拉取 */
export const subscribeList = (cb: () => void): (() => void) => subscribeTable('list_items', cb)

/** 当前是否走云端（供页面显示模式提示） */
export const loveListIsCloud = isSupabaseConfigured

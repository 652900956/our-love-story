/**
 * ============================================================================
 *  little API —— 点点滴滴（碎碎念 / 日记）读写
 * ----------------------------------------------------------------------------
 *  - 已配置 Supabase：读写 little_items 表，多人共享、实时同步。
 *  - 未配置 / 读取失败：回退浏览器 localStorage（key: lovey_little_items），
 *    首次以 src/data/littleContent.ts 的 items 作为初始值。
 *  页面只调用本模块，无需关心数据来源。
 * ============================================================================
 */
import { supabase, isSupabaseConfigured } from '../config/supabase'
import { subscribeTable } from './realtime'
import { little, type LittleItem } from '../data/littleContent'

const LS_KEY = 'lovey_little_items'

export type NewLittle = Omit<LittleItem, 'id'>

function genId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `l-${Date.now()}_${Math.random().toString(36).slice(2)}`
}

function readLocal(): LittleItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return JSON.parse(raw) as LittleItem[]
  } catch {
    /* 解析失败回落默认 */
  }
  return little.items
}

function writeLocal(list: LittleItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* 忽略写入失败（隐私模式等） */
  }
}

/** 读取全部点滴（最新的在前） */
export async function fetchLittle(): Promise<LittleItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('little_items')
      .select('id, date, title, content, mood')
      .order('created_at', { ascending: false })
    if (!error && data) {
      return data.map(
        (r): LittleItem => ({
          id: String(r.id),
          date: String(r.date ?? ''),
          title: String(r.title ?? ''),
          content: String(r.content ?? ''),
          mood: r.mood ? String(r.mood) : undefined,
        }),
      )
    }
    console.warn('[little] Supabase 读取失败，回退本地：', error?.message)
  }
  return readLocal()
}

/** 新增一条点滴，返回写入后的完整记录 */
export async function addLittle(input: NewLittle): Promise<LittleItem> {
  const item: LittleItem = { id: genId(), ...input }
  if (supabase) {
    const { data, error } = await supabase
      .from('little_items')
      .insert({
        id: item.id,
        date: item.date,
        title: item.title,
        content: item.content,
        mood: item.mood ?? '',
      })
      .select('id, date, title, content, mood')
      .single()
    if (!error && data) {
      return {
        id: String(data.id),
        date: String(data.date ?? item.date),
        title: String(data.title ?? item.title),
        content: String(data.content ?? item.content),
        mood: data.mood ? String(data.mood) : undefined,
      }
    }
    console.warn('[little] Supabase 写入失败，回退本地：', error?.message)
  }
  const list = readLocal()
  list.unshift(item)
  writeLocal(list)
  return item
}

/** 删除一条点滴 */
export async function deleteLittle(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('little_items').delete().eq('id', id)
    if (!error) return
    console.warn('[little] Supabase 删除失败，回退本地：', error?.message)
  }
  writeLocal(readLocal().filter((it) => it.id !== id))
}

/** 订阅点滴表变更，触发页面重新拉取 */
export const subscribeLittle = (cb: () => void): (() => void) => subscribeTable('little_items', cb)

/** 当前是否走云端（供页面显示模式提示） */
export const littleIsCloud = isSupabaseConfigured

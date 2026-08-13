/**
 * ============================================================================
 *  messages API —— 留言板读写（Supabase 优先，localStorage 兜底）
 * ----------------------------------------------------------------------------
 *  - 已配置 Supabase：留言写入 messages 表，所有访客可见、永久保存。
 *  - 未配置：写入浏览器 localStorage（仅本机可见，清缓存即丢失）。
 *  - 任一方式失败都会自动回退另一种，保证功能不中断。
 * ============================================================================
 */
import { supabase } from '../config/supabase'
import { subscribeTable } from './realtime'

export interface MessageItem {
  id: string
  name: string
  content: string
  /** ISO 时间字符串 */
  created_at: string
}

const LS_KEY = 'lovey_messages'

function readLocal(): MessageItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as MessageItem[]) : []
  } catch {
    return []
  }
}

function writeLocal(list: MessageItem[]): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {
    /* 忽略写入失败（如隐私模式） */
  }
}

/** 读取全部留言（最新在前） */
export async function fetchMessages(): Promise<MessageItem[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, name, content, created_at')
      .order('created_at', { ascending: false })
    if (!error && data) {
      return data.map(
        (r): MessageItem => ({
          id: String(r.id),
          name: String(r.name ?? '匿名'),
          content: String(r.content ?? ''),
          created_at: String(r.created_at ?? new Date().toISOString()),
        }),
      )
    }
    console.warn('[messages] Supabase 读取失败，回退 localStorage：', error?.message)
  }
  return readLocal()
}

/** 新增一条留言，返回写入后的完整记录 */
export async function addMessage(name: string, content: string): Promise<MessageItem> {
  const item: MessageItem = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `m_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    name: name.trim() || '匿名',
    content: content.trim(),
    created_at: new Date().toISOString(),
  }

  if (supabase) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ name: item.name, content: item.content })
      .select('id, name, content, created_at')
      .single()
    if (!error && data) {
      return {
        id: String(data.id),
        name: String(data.name ?? item.name),
        content: String(data.content ?? item.content),
        created_at: String(data.created_at ?? item.created_at),
      }
    }
    console.warn('[messages] Supabase 写入失败，回退 localStorage：', error?.message)
  }

  const list = readLocal()
  list.unshift(item)
  writeLocal(list)
  return item
}

/** 删除一条留言（本人/管理员可删） */
export async function deleteMessage(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('messages').delete().eq('id', id)
    if (!error) return
    console.warn('[messages] Supabase 删除失败：', error?.message)
  }
  const list = readLocal().filter((m) => m.id !== id)
  writeLocal(list)
}

/** 订阅留言表变更，触发页面重新拉取（多设备实时同步） */
export const subscribeMessages = (cb: () => void): (() => void) => subscribeTable('messages', cb)

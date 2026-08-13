/**
 * ============================================================================
 *  supabase.ts —— Supabase 云后端客户端（可选接入）
 * ----------------------------------------------------------------------------
 *  本项目「默认纯前端」即可运行：未配置 Supabase 时，所有数据走本地兜底
 *  （照片用 src/data/photoList.ts，留言用浏览器 localStorage）。
 *
 *  一旦在 .env 填入 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，
 *  照片与留言将自动改为读写 Supabase 云数据库（多人共享、永久保存）。
 *
 *  见仓库 supabase/schema.sql 建表，见 README「接入 Supabase 后端」章节。
 * ============================================================================
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** 是否已配置 Supabase（有值才连库，否则走本地兜底） */
export const isSupabaseConfigured = Boolean(url && anonKey)

/**
 * 共享家庭口令（可选）。
 * 在 .env 配置 VITE_APP_PASSCODE 后，全站需先输入口令才能进入（多人共用同一口令）。
 * 留空 = 不启用口令门禁（本地开发 / 公网但不想加锁时）。
 */
export const APP_PASSCODE = ((import.meta.env.VITE_APP_PASSCODE as string | undefined) ?? '').trim()

/** Supabase 客户端；未配置时为 null */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null

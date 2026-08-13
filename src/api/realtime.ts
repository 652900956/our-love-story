/**
 * ============================================================================
 *  realtime.ts —— Supabase Realtime 通用订阅助手
 * ----------------------------------------------------------------------------
 *  供各数据层（留言 / 照片 / 待办 / 记账 / 点点滴滴 / Love List）复用：
 *  只要订阅某张表，任意设备对该表的增删改都会触发 onChange 回调，
 *  页面据此重新拉取数据，实现「多设备秒级同步」。
 *
 *  未配置 Supabase 时直接返回空函数（本地模式不订阅）。
 * ============================================================================
 */
import { supabase } from '../config/supabase'

/**
 * 订阅一张表的全部变更（INSERT/UPDATE/DELETE）。
 * @param table   表名（public 下）
 * @param onChange 变更回调（页面用它触发重新拉取）
 * @returns 取消订阅函数；未配置时返回 no-op
 */
export function subscribeTable(table: string, onChange: () => void): () => void {
  if (!supabase) return () => {}

  const client = supabase
  const channelName = `rt-${table}-${Math.random().toString(36).slice(2, 9)}`
  const channel = client
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      () => {
        try {
          onChange()
        } catch (e) {
          console.warn(`[realtime:${table}] onChange 回调出错：`, e)
        }
      },
    )
    .subscribe((status) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.warn(`[realtime:${table}] 订阅状态异常：${status}`)
      }
    })

  return () => {
    client.removeChannel(channel)
  }
}

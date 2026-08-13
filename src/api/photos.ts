/**
 * ============================================================================
 *  photos API —— 照片数据读写（Supabase 优先，本地 data 兜底）
 * ----------------------------------------------------------------------------
 *  - 已配置 Supabase：从 photos 表分页读取（created_at 倒序，最新在前），
 *    配合 LovePhoto 的「加载更多」做分页。
 *  - 未配置 / 读取失败：回退 src/data/photoList.ts 静态数组。
 *  页面组件只调用 fetchPhotos()，无需关心数据来自哪里。
 * ============================================================================
 */
import { supabase } from '../config/supabase'
import { subscribeTable } from './realtime'
import { photos as staticPhotos, type PhotoItem } from '../data/photoList'

export interface PhotoRow {
  id: string
  src: string
  caption: string
  date: string
  note: string
}

/** 分页读取照片：从 offset 起取 limit 张 */
export async function fetchPhotos(
  limit: number,
  offset: number,
): Promise<{ items: PhotoItem[]; hasMore: boolean }> {
  if (supabase) {
    const { data, error, count } = await supabase
      .from('photos')
      .select('id, src, caption, date, note', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (!error && data) {
      const items = data.map(
        (r): PhotoItem => ({
          id: String(r.id),
          src: String(r.src ?? ''),
          caption: String(r.caption ?? ''),
          date: String(r.date ?? ''),
          note: String(r.note ?? ''),
        }),
      )
      const hasMore = count != null ? offset + items.length < count : items.length === limit
      return { items, hasMore }
    }
    // 出错也回退，保证页面不崩
    console.warn('[photos] Supabase 读取失败，回退静态数据：', error?.message)
  }
  const items = staticPhotos.slice(offset, offset + limit)
  const hasMore = offset + limit < staticPhotos.length
  return { items, hasMore }
}

/** 照片总数（用于判断是否还有「加载更多」） */
export async function fetchPhotoCount(): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('photos')
      .select('*', { count: 'exact', head: true })
    if (!error && count != null) return count
  }
  return staticPhotos.length
}

export interface AddPhotoInput {
  src: string
  caption: string
  date: string
  note: string
}

/** 新增一张照片（仅 Supabase 模式可写；本地模式回退到静态数组不可写） */
export async function addPhoto(input: AddPhotoInput): Promise<PhotoRow | null> {
  if (!supabase) {
    console.warn('[photos] 未配置 Supabase，无法新增照片（请用 .env 接入云端）')
    return null
  }
  const { data, error } = await supabase
    .from('photos')
    .insert({
      src: input.src,
      caption: input.caption,
      date: input.date,
      note: input.note,
    })
    .select('id, src, caption, date, note')
    .single()
  if (error) {
    console.warn('[photos] addPhoto 失败：', error.message)
    return null
  }
  return {
    id: String(data.id),
    src: String(data.src ?? ''),
    caption: String(data.caption ?? ''),
    date: String(data.date ?? ''),
    note: String(data.note ?? ''),
  }
}

/** 删除一张照片（按 id） */
export async function deletePhoto(id: string): Promise<void> {
  if (!supabase) {
    console.warn('[photos] 未配置 Supabase，无法删除照片')
    return
  }
  const { error } = await supabase.from('photos').delete().eq('id', id)
  if (error) console.warn('[photos] deletePhoto 失败：', error.message)
}

/** 订阅照片表变更，触发页面重新拉取（多设备实时同步） */
export const subscribePhotos = (cb: () => void): (() => void) => subscribeTable('photos', cb)

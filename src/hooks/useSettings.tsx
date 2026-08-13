/**
 * ============================================================================
 *  hooks/useSettings.ts —— 全站可持久化设置（Context + localStorage）
 * ----------------------------------------------------------------------------
 *  把首页头像、名字、slogan、相爱时间、里程碑、点滴、音乐列表等
 *  存在 localStorage 中，多组件共享、刷新不丢失。
 *  提供 SettingsProvider 包裹 App，useSettings/useSetting 读取/更新。
 * ============================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { header, hero, togetherSince } from '../data/homeContent'
import { about } from '../data/aboutContent'
import { little } from '../data/littleContent'
import { musicList } from '../data/musicList'
import type { AboutMilestone } from '../data/aboutContent'
import type { LittleItem } from '../data/littleContent'
import type { Track } from '../data/musicList'
import type { ThemeMode } from '../config/theme.config'

const STORAGE_KEY = 'lovey-settings-v1'

export interface LoveySettings {
  /** 男方/女方头像（首页 Hero & 关于我们同步） */
  maleAvatar: string
  femaleAvatar: string
  /** 称呼 */
  maleName: string
  femaleName: string
  /** 首页大标题下方的 slogan */
  slogan: string
  /** 正式相爱时间，用于首页计时器 */
  togetherSince: string
  /** 关于我们页里程碑 */
  milestones: AboutMilestone[]
  /** 点点滴滴日记 */
  littleItems: LittleItem[]
  /** 本地音乐列表（file input 导入或 public/music/ 配置） */
  tracks: Track[]
  /** 是否启用鼠标点击特效 */
  clickEffectEnabled: boolean
  /** 点击特效类型（目前仅星星迸发） */
  clickEffectType: 'star'
  /** 是否启用鼠标轨迹 */
  trailEnabled: boolean
  /** 鼠标轨迹类型 */
  trailType: 'star' | 'dot' | 'heart' | 'comet'
  /** 自定义背景图片（Data URL，空字符串表示使用默认白色网格） */
  bgImage: string
  /** 自定义背景图片模糊度（px） */
  bgBlur: number
  /** 全站明暗主题：'light' 浅色（系统默认）/ 'dark' 暗色 */
  theme: ThemeMode
}

export const defaultSettings: LoveySettings = {
  maleAvatar: hero.male.avatar,
  femaleAvatar: hero.female.avatar,
  maleName: hero.male.name,
  femaleName: hero.female.name,
  slogan: header.slogan,
  togetherSince,
  milestones: about.milestones,
  littleItems: little.items,
  tracks: musicList,
  clickEffectEnabled: true,
  clickEffectType: 'star',
  trailEnabled: true,
  trailType: 'star',
  bgImage: '',
  bgBlur: 0,
  theme: 'light',
}

function load(): LoveySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<LoveySettings>
    // 防御性合并：只采纳「已定义」的字段，避免旧结构 / 脏数据把
    // tracks / milestones / littleItems 等覆盖成 undefined 或非数组，
    // 进而导致 useAudioPlayer、时间轴、点滴列表在渲染期抛错（整页白屏）。
    const merged: LoveySettings = { ...defaultSettings }
    const parsedRec = parsed as unknown as Record<string, unknown>
    const mergedRec = merged as unknown as Record<string, unknown>
    ;(Object.keys(defaultSettings) as (keyof LoveySettings)[]).forEach((key) => {
      const v = parsedRec[key as string]
      if (v !== undefined && v !== null) {
        mergedRec[key as string] = v
      }
    })
    if (!Array.isArray(merged.tracks)) merged.tracks = defaultSettings.tracks
    if (!Array.isArray(merged.milestones)) merged.milestones = defaultSettings.milestones
    if (!Array.isArray(merged.littleItems)) merged.littleItems = defaultSettings.littleItems
    return merged
  } catch {
    return defaultSettings
  }
}

function write(s: LoveySettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // 隐私模式或存储满时静默失败
  }
}

interface SettingsContextValue {
  settings: LoveySettings
  update: (patch: Partial<LoveySettings>) => void
  reset: () => void
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<LoveySettings>(load)

  const update = useCallback((patch: Partial<LoveySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      write(next)
      return next
    })
  }, [])

  const reset = useCallback(() => {
    write(defaultSettings)
    setSettings(defaultSettings)
  }, [])

  // 多标签页同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSettings(load())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo(() => ({ settings, update, reset }), [settings, update, reset])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings 必须在 SettingsProvider 内使用')
  return ctx
}

/** 只读取/更新某一个字段的便捷 hook */
export function useSetting<K extends keyof LoveySettings>(key: K): [LoveySettings[K], (value: LoveySettings[K]) => void] {
  const { settings, update } = useSettings()
  const setValue = useCallback(
    (value: LoveySettings[K]) => update({ [key]: value } as Partial<LoveySettings>),
    [key, update],
  )
  return [settings[key], setValue]
}

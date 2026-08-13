/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Supabase 项目 URL（接入后端后必填，见 README） */
  readonly VITE_SUPABASE_URL?: string
  /** Supabase 匿名公钥 anon key（接入后端后必填） */
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// solarlunar 未自带类型声明，这里补一个最小可用声明（仅用到的字段）。
declare module 'solarlunar' {
  interface SolarLunarDate {
    lYear: number
    lMonth: number
    lDay: number
    monthCn: string
    dayCn: string
    term?: string
    festival?: string
    lFestival?: string
    ncWeek: string
  }
  interface SolarLunar {
    solar2lunar(year: number, month: number, day: number): SolarLunarDate
    lunar2solar(year: number, month: number, day: number, isLeap?: boolean): SolarLunarDate
  }
  const solarLunar: SolarLunar
  export default solarLunar
}

import { useEffect, useState } from 'react'

export interface LoveDuration {
  days: number
  hours: number
  minutes: number
  seconds: number
}

/** 计算从 since 到现在的时长（原站每秒刷新一次） */
export function useLoveTimer(since: string): LoveDuration {
  const [duration, setDuration] = useState<LoveDuration>(() => calc(since))

  useEffect(() => {
    const timer = window.setInterval(() => setDuration(calc(since)), 1000)
    return () => window.clearInterval(timer)
  }, [since])

  return duration
}

function calc(since: string): LoveDuration {
  const birth = new Date(since).getTime()
  const now = Date.now()
  const diff = Math.max(0, now - birth)

  const msPerDay = 24 * 60 * 60 * 1000
  const e_days = diff / msPerDay
  const days = Math.floor(e_days)
  const e_hrs = (e_days - days) * 24
  const hours = Math.floor(e_hrs)
  const e_mins = (e_hrs - hours) * 60
  const minutes = Math.floor(e_mins)
  const seconds = Math.floor((e_mins - minutes) * 60)

  return { days, hours, minutes, seconds }
}

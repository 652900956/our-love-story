/**
 * ============================================================================
 *  hooks/useAudioPlayer.ts —— HTML5 Audio 播放器封装（支持多种播放模式）
 * ----------------------------------------------------------------------------
 *  接收外部 track 列表，提供：
 *    - 播放 / 暂停 / 上一首 / 下一首（均真实可用）
 *    - 播放模式：order 顺序 / loop 列表循环 / single 单曲循环 / shuffle 随机
 *    - 音量调节、进度跳转（seek）
 *  依赖用户首次交互（点击）后 play()，以规避浏览器自动播放限制。
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../data/musicList'

/** 播放模式：顺序 / 列表循环 / 单曲循环 / 随机 */
export type PlayMode = 'order' | 'loop' | 'single' | 'shuffle'

const MODE_ORDER: PlayMode[] = ['order', 'loop', 'single', 'shuffle']

const EMPTY_TRACK: Track = {
  id: 'empty',
  title: '暂无音乐',
  artist: '请把歌曲放进 src/assets/music/',
  cover: '',
  src: '',
}

interface AudioState {
  isPlaying: boolean
  currentTrack: Track
  currentIndex: number
  volume: number
  mode: PlayMode
  currentTime: number
  duration: number
  progress: number
  showPanel: boolean
}

export interface AudioControls extends AudioState {
  togglePlay: () => void
  play: () => void
  pause: () => void
  next: () => void
  prev: () => void
  setVolume: (v: number) => void
  cycleMode: () => void
  setMode: (m: PlayMode) => void
  setCurrentIndex: (i: number) => void
  seek: (ratio: number) => void
  togglePanel: () => void
  setShowPanel: (v: boolean) => void
}

/** 在 [0, n) 内随机一个不等于 cur 的索引 */
function randomOther(cur: number, n: number): number {
  if (n <= 1) return 0
  let r = cur
  while (r === cur) r = Math.floor(Math.random() * n)
  return r
}

export function useAudioPlayer(tracks: Track[]): AudioControls {
  const safeTracks = Array.isArray(tracks) ? tracks : []
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // 用 ref 保存最新值，避免事件回调里拿到过期闭包
  const indexRef = useRef(0)
  const modeRef = useRef<PlayMode>('order')
  const tracksRef = useRef<Track[]>(safeTracks)
  const historyRef = useRef<number[]>([]) // 随机模式的上一首历史

  const [currentIndex, setCurrentIndexState] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.6)
  const [mode, setMode] = useState<PlayMode>('order')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    indexRef.current = currentIndex
  }, [currentIndex])
  useEffect(() => {
    modeRef.current = mode
  }, [mode])
  useEffect(() => {
    tracksRef.current = safeTracks
  }, [safeTracks])

  const currentTrack = safeTracks[currentIndex] ?? EMPTY_TRACK

  /** 跳转到指定索引（自动取模、记录历史、切换音源） */
  const goTo = useCallback((i: number) => {
    const n = tracksRef.current.length
    if (n === 0) return
    const idx = ((i % n) + n) % n
    historyRef.current.push(indexRef.current)
    if (historyRef.current.length > 64) historyRef.current.shift()
    setCurrentIndexState(idx)
  }, [])

  // 初始化 Audio 元素 + 事件监听（仅挂载一次）
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'metadata'
    audio.volume = volume
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => {
      const n = tracksRef.current.length
      if (n === 0) return
      const m = modeRef.current
      const cur = indexRef.current
      if (m === 'single') {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
        return
      }
      if (m === 'loop') {
        goTo(cur + 1)
        return
      }
      if (m === 'shuffle') {
        goTo(randomOther(cur, n))
        return
      }
      // order：未到末尾则续播，到末尾停止
      if (cur < n - 1) {
        goTo(cur + 1)
      } else {
        setIsPlaying(false)
        audio.pause()
      }
    }
    const onError = () => {
      const t = tracksRef.current[indexRef.current]
      if (t?.src) console.warn('[Audio] 当前音源加载失败:', t.src)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('error', onError)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('error', onError)
      audioRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 切换音源
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!currentTrack.src) {
      audio.src = ''
      setIsPlaying(false)
      return
    }
    audio.src = currentTrack.src
    audio.currentTime = 0
    setCurrentTime(0)
    setDuration(0)
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentTrack.src, isPlaying])

  // 音量同步
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = useCallback(() => {
    const audio = audioRef.current
    const t = tracksRef.current[indexRef.current]
    if (!audio || !t?.src) return
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const next = useCallback(() => {
    const n = tracksRef.current.length
    if (n === 0) return
    const cur = indexRef.current
    if (modeRef.current === 'shuffle') goTo(randomOther(cur, n))
    else goTo(cur + 1)
  }, [goTo])

  const prev = useCallback(() => {
    const n = tracksRef.current.length
    if (n === 0) return
    const cur = indexRef.current
    // 随机模式：回退到历史中的上一首
    if (modeRef.current === 'shuffle' && historyRef.current.length > 0) {
      const p = historyRef.current.pop() as number
      setCurrentIndexState(p)
      return
    }
    goTo(cur - 1)
  }, [goTo])

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }, [])

  const cycleMode = useCallback(() => {
    setMode((m) => MODE_ORDER[(MODE_ORDER.indexOf(m) + 1) % MODE_ORDER.length])
  }, [])

  const setCurrentIndex = useCallback(
    (i: number) => {
      goTo(i)
    },
    [goTo],
  )

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const t = Math.max(0, Math.min(duration, ratio * duration))
    audio.currentTime = t
    setCurrentTime(t)
  }, [duration])

  const togglePanel = useCallback(() => setShowPanel((v) => !v), [])
  const setShowPanelSafe = useCallback((v: boolean) => setShowPanel(v), [])

  const progress = duration ? currentTime / duration : 0

  return {
    isPlaying,
    currentTrack,
    currentIndex,
    volume,
    mode,
    currentTime,
    duration,
    progress,
    showPanel,
    togglePlay,
    play,
    pause,
    next,
    prev,
    setVolume,
    cycleMode,
    setMode,
    setCurrentIndex,
    seek,
    togglePanel,
    setShowPanel: setShowPanelSafe,
  }
}

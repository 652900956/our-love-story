/**
 * ============================================================================
 *  hooks/useAudioPlayer.ts —— HTML5 Audio 播放器封装
 * ----------------------------------------------------------------------------
 *  接收外部 track 列表，提供播放/暂停、上一首/下一首、循环、音量、进度、
 *  播放列表控制。依赖用户交互后首次 play()，以规避浏览器自动播放限制。
 * ============================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Track } from '../data/musicList'

interface AudioState {
  isPlaying: boolean
  currentTrack: Track
  currentIndex: number
  volume: number
  isLooping: boolean
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
  toggleLoop: () => void
  setCurrentIndex: (i: number) => void
  seek: (ratio: number) => void
  togglePanel: () => void
  setShowPanel: (v: boolean) => void
}

export function useAudioPlayer(tracks: Track[]): AudioControls {
  // 防御：调用方可能传入 undefined / 非数组（如旧 localStorage 数据），
  // 统一兜底为空数组，避免 tracks[currentIndex] 在渲染期抛错。
  const safeTracks = Array.isArray(tracks) ? tracks : []
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolumeState] = useState(0.6)
  const [isLooping, setIsLooping] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showPanel, setShowPanel] = useState(false)

  // 列表为空时给一个占位 track，避免后续逻辑报错
  const currentTrack = safeTracks[currentIndex] ?? {
    id: 'empty',
    title: '暂无音乐',
    artist: '请导入本地音乐',
    cover: '',
    src: '',
  }

  // 初始化 Audio 元素
  useEffect(() => {
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'metadata'
    audio.volume = volume
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onEnded = () => {
      if (isLooping) {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
      } else if (safeTracks.length > 1) {
        const nextIndex = (currentIndex + 1) % safeTracks.length
        setCurrentIndex(nextIndex)
      } else {
        setIsPlaying(false)
      }
    }
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onError = () => {
      // 空列表时 src 为空字符串，不视为真正的加载失败，避免控制台误报
      if (currentTrack.src) {
        console.warn('[Audio] 当前音源加载失败:', currentTrack.src)
      }
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
  }, [currentIndex, isLooping, tracks.length, currentTrack.src])

  // 切换音源
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (!currentTrack.src) {
      audio.src = ''
      return
    }
    audio.src = currentTrack.src
    audio.currentTime = 0
    setCurrentTime(0)
    setDuration(0)
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false))
    }
  }, [currentTrack.src])

  // 音量同步
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = useCallback(() => {
    if (!audioRef.current || !currentTrack.src) return
    audioRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false))
  }, [currentTrack.src])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const togglePlay = useCallback(() => {
    if (isPlaying) pause()
    else play()
  }, [isPlaying, pause, play])

  const next = useCallback(() => {
    if (safeTracks.length <= 1) return
    setCurrentIndex((i) => (i + 1) % safeTracks.length)
  }, [safeTracks.length])

  const prev = useCallback(() => {
    if (safeTracks.length <= 1) return
    setCurrentIndex((i) => (i - 1 + safeTracks.length) % safeTracks.length)
  }, [safeTracks.length])

  const setVolume = useCallback((v: number) => {
    setVolumeState(Math.max(0, Math.min(1, v)))
  }, [])

  const toggleLoop = useCallback(() => setIsLooping((l) => !l), [])

  const seek = useCallback((ratio: number) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const t = Math.max(0, Math.min(duration, ratio * duration))
    audio.currentTime = t
    setCurrentTime(t)
  }, [duration])

  const setCurrentIndexWrapped = useCallback((i: number) => {
    if (safeTracks.length === 0) return
    setCurrentIndex(((i % safeTracks.length) + safeTracks.length) % safeTracks.length)
  }, [safeTracks.length])

  const togglePanel = useCallback(() => setShowPanel((v) => !v), [])

  const progress = duration ? currentTime / duration : 0

  return {
    isPlaying,
    currentTrack,
    currentIndex,
    volume,
    isLooping,
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
    toggleLoop,
    setCurrentIndex: setCurrentIndexWrapped,
    seek,
    togglePanel,
    setShowPanel,
  }
}

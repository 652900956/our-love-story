/**
 * ============================================================================
 *  components/MusicPlayer.tsx —— 右下角音乐播放器
 * ----------------------------------------------------------------------------
 *  - 歌单 = 自动扫描的 src/assets/music/（持久化） + 本会话导入的本地文件
 *  - 播放 / 暂停 / 上一首 / 下一首（全部可用）
 *  - 播放模式：顺序 / 列表循环 / 单曲循环 / 随机（循环切换按钮）
 *  - 音量调节、可拖拽进度条（拖动时变粗并显示滑块，松手恢复细线）
 *  - 播放列表点击即播、可移除本会话导入的歌曲
 * ============================================================================
 */

import { useMemo, useRef, useState, useCallback, type CSSProperties, type ChangeEvent, type PointerEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
  ListMusic,
  Plus,
  Disc,
  Shuffle,
  Repeat,
  Repeat1,
  ListOrdered,
} from 'lucide-react'
import theme from '../config/theme.config'
import { useAudioPlayer, type PlayMode } from '../hooks/useAudioPlayer'
import { MUSIC_LIBRARY, type Track } from '../data/musicList'

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' + s : s}`
}

const MODE_META: Record<PlayMode, { label: string; Icon: typeof Repeat }> = {
  order: { label: '顺序播放', Icon: ListOrdered },
  loop: { label: '列表循环', Icon: Repeat },
  single: { label: '单曲循环', Icon: Repeat1 },
  shuffle: { label: '随机播放', Icon: Shuffle },
}

const defaultCover =
  'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=320&q=80'

export default function MusicPlayer() {
  const [userTracks, setUserTracks] = useState<Track[]>([])
  const tracks = useMemo<Track[]>(() => [...MUSIC_LIBRARY, ...userTracks], [userTracks])
  const player = useAudioPlayer(tracks)

  const progressRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  // —— 进度条拖拽 ——
  const seekFromClientX = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !player.duration) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      player.seek(ratio)
    },
    [player],
  )

  const onBarPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!player.duration) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    seekFromClientX(e.clientX)
  }
  const onBarPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging) seekFromClientX(e.clientX)
  }
  const onBarPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  // —— 导入本地文件（本会话有效）——
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      const newTracks: Track[] = Array.from(files).map((file) => {
        const title = file.name.replace(/\.[^/.]+$/, '')
        return {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          artist: '本地音乐',
          cover: defaultCover,
          src: URL.createObjectURL(file),
        }
      })
      setUserTracks((prev) => [...prev, ...newTracks])
      e.target.value = ''
    },
    [],
  )

  const removeTrack = useCallback(
    (idx: number) => {
      if (idx < MUSIC_LIBRARY.length) return // 内置歌单不可移除
      const userIdx = idx - MUSIC_LIBRARY.length
      const nextUser = userTracks.filter((_, i) => i !== userIdx)
      setUserTracks(nextUser)
      const total = MUSIC_LIBRARY.length + nextUser.length
      if (idx < player.currentIndex) player.setCurrentIndex(player.currentIndex - 1)
      else if (idx === player.currentIndex)
        player.setCurrentIndex(Math.max(0, Math.min(player.currentIndex, total - 1)))
    },
    [player, userTracks],
  )

  const playIndex = useCallback(
    (idx: number) => {
      player.setCurrentIndex(idx)
      // 等待音源切换（src effect）后再播放，确保播放的是目标曲
      window.setTimeout(() => player.play(), 0)
    },
    [player],
  )

  const hasTracks = tracks.length > 0
  const ModeIcon = MODE_META[player.mode].Icon
  const currentCover = player.currentTrack.cover || defaultCover

  const btnBase: CSSProperties = {
    width: 46,
    height: 46,
    borderRadius: theme.radius.sidebar,
    background: theme.colors.primary,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 6px 18px rgba(241, 107, 79, 0.35)',
    transition: `all ${theme.animation.tooltipDuration}s`,
    border: 'none',
  }

  const panelBase: CSSProperties = {
    position: 'absolute',
    bottom: 64,
    right: 0,
    width: 320,
    background: 'var(--bg-card)',
    borderRadius: theme.radius.card,
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.12)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    padding: '1.2rem',
    color: theme.colors.textDark,
    overflow: 'hidden',
  }

  return (
    <div style={{ position: 'fixed', bottom: 40, right: 24, zIndex: 9999 }}>
      <input
        ref={fileRef}
        type="file"
        accept="audio/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <AnimatePresence>
        {player.showPanel && (
          <motion.div
            style={panelBase}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <button
              onClick={() => player.setShowPanel(false)}
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.textMuted,
              }}
            >
              <X size={18} />
            </button>

            {/* 封面与标题 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  animation: player.isPlaying ? 'spin-cover 8s linear infinite' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${theme.colors.primary}18`,
                }}
              >
                {currentCover ? (
                  <img
                    src={currentCover}
                    alt={player.currentTrack.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Disc size={32} color={theme.colors.primary} />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p
                  style={{
                    fontFamily: theme.fonts.serif,
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.currentTrack.title}
                </p>
                <p
                  style={{
                    fontFamily: theme.fonts.serif,
                    fontSize: '0.8rem',
                    color: theme.colors.textMuted,
                    margin: '0.2rem 0 0',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {player.currentTrack.artist || '未知歌手'}
                </p>
              </div>
            </div>

            {/* 进度条（可拖拽） */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div
                ref={progressRef}
                onPointerDown={onBarPointerDown}
                onPointerMove={onBarPointerMove}
                onPointerUp={onBarPointerUp}
                onPointerCancel={onBarPointerUp}
                style={{
                  position: 'relative',
                  height: dragging ? 10 : 4,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  overflow: 'visible',
                  transition: 'height 0.12s ease',
                  touchAction: 'none',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${player.progress * 100}%`,
                    background: theme.colors.primary,
                    borderRadius: 999,
                    transition: dragging ? 'none' : 'width 0.1s linear',
                  }}
                />
                {/* 拖拽时显示的滑块 */}
                {dragging && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: `${player.progress * 100}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      background: '#fff',
                      border: `3px solid ${theme.colors.primary}`,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.7rem',
                  color: theme.colors.textMuted,
                  marginTop: '0.3rem',
                  fontFamily: theme.fonts.accent,
                }}
              >
                <span>{formatTime(player.currentTime)}</span>
                <span>{formatTime(player.duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.9rem',
              }}
            >
              {/* 播放模式切换 */}
              <button
                onClick={player.cycleMode}
                title={MODE_META[player.mode].label}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.primary,
                  padding: 6,
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ModeIcon size={18} />
                <span style={{ fontSize: '0.7rem', fontFamily: theme.fonts.serif }}>
                  {MODE_META[player.mode].label}
                </span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <button
                  onClick={player.prev}
                  disabled={!hasTracks}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: hasTracks ? 'pointer' : 'not-allowed',
                    color: hasTracks ? theme.colors.textDark : theme.colors.textMuted,
                    padding: 6,
                  }}
                >
                  <SkipBack size={22} />
                </button>
                <button
                  onClick={player.togglePlay}
                  disabled={!hasTracks}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: hasTracks ? theme.colors.primary : theme.colors.textMuted,
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: hasTracks ? 'pointer' : 'not-allowed',
                    boxShadow: '0 4px 14px rgba(241, 107, 79, 0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {player.isPlaying ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                </button>
                <button
                  onClick={player.next}
                  disabled={!hasTracks}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: hasTracks ? 'pointer' : 'not-allowed',
                    color: hasTracks ? theme.colors.textDark : theme.colors.textMuted,
                    padding: 6,
                  }}
                >
                  <SkipForward size={22} />
                </button>
              </div>

              <button
                onClick={() => player.setVolume(player.volume === 0 ? 0.6 : 0)}
                title={player.volume === 0 ? '取消静音' : '静音'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.textMuted,
                  padding: 6,
                }}
              >
                {player.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
            </div>

            {/* 音量 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.9rem' }}>
              <Volume2 size={14} color={theme.colors.textMuted} />
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={player.volume}
                onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                style={{ flex: 1, accentColor: theme.colors.primary, cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.7rem', color: theme.colors.textMuted, width: 30, textAlign: 'right' }}>
                {Math.round(player.volume * 100)}%
              </span>
            </div>

            {/* 导入按钮 */}
            <button
              onClick={() => fileRef.current?.click()}
              style={{
                width: '100%',
                padding: '0.55rem',
                borderRadius: 10,
                border: `1.5px dashed ${theme.colors.primary}`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontFamily: theme.fonts.serif,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                marginBottom: '0.8rem',
                transition: 'all 0.2s',
              }}
            >
              <Plus size={16} /> 导入本地音乐（本会话）
            </button>

            {/* 播放列表 */}
            <div
              style={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                paddingTop: '0.8rem',
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              <p
                style={{
                  fontFamily: theme.fonts.serif,
                  fontSize: '0.8rem',
                  color: theme.colors.textMuted,
                  margin: '0 0 0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <ListMusic size={14} /> 播放列表 ({tracks.length})
              </p>
              {tracks.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: theme.colors.textMuted, textAlign: 'center', margin: '0.5rem 0' }}>
                  暂无音乐
                </p>
              )}
              {tracks.map((track, idx) => (
                <div
                  key={track.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: idx === player.currentIndex ? `${theme.colors.primary}14` : 'transparent',
                    borderRadius: 8,
                    padding: '0.4rem 0.4rem 0.4rem 0.6rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <button
                    onClick={() => playIndex(idx)}
                    style={{
                      flex: 1,
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: idx === player.currentIndex ? theme.colors.primary : theme.colors.textMuted,
                        fontFamily: theme.fonts.accent,
                        width: 18,
                      }}
                    >
                      {idx === player.currentIndex && player.isPlaying ? '♪' : idx + 1}
                    </span>
                    <span
                      style={{
                        fontFamily: theme.fonts.serif,
                        fontSize: '0.85rem',
                        color: idx === player.currentIndex ? theme.colors.textDark : theme.colors.textMain,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {track.title}
                      {track.artist ? ` · ${track.artist}` : ''}
                    </span>
                  </button>
                  {idx >= MUSIC_LIBRARY.length && (
                    <button
                      onClick={() => removeTrack(idx)}
                      title="移除"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: theme.colors.textMuted,
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        padding: '2px 6px',
                        borderRadius: 4,
                      }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={player.togglePanel}
        style={btnBase}
        title="音乐"
        onMouseEnter={(e) => (e.currentTarget.style.background = theme.colors.primaryHover)}
        onMouseLeave={(e) => (e.currentTarget.style.background = theme.colors.primary)}
      >
        <Music size={22} />
      </button>
    </div>
  )
}

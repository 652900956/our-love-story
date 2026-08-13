/**
 * ============================================================================
 *  components/MusicPlayer.tsx —— 右下角音乐播放器
 * ----------------------------------------------------------------------------
 *  替换原 Sidebar 的 GitHub 按钮。
 *  支持：
 *    1. 导入本地音乐文件（file input，浏览器临时播放）
 *    2. 播放 / 暂停 / 上一首 / 下一首 / 单曲循环 / 音量 / 进度条 / 播放列表
 *  注意：浏览器安全策略限制，file input 导入的音频刷新后需重新导入；
 *        若要持久保存，请把 mp3 放进 public/music/ 并在 musicList.ts 配置。
 * ============================================================================
 */

import { useRef, useCallback, type CSSProperties, type ChangeEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  X,
  ListMusic,
  Plus,
  Disc,
} from 'lucide-react'
import theme from '../config/theme.config'
import { useAudioPlayer } from '../hooks/useAudioPlayer'
import { useSetting } from '../hooks/useSettings'

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s < 10 ? '0' + s : s}`
}

const defaultCover = 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&w=320&q=80'

export default function MusicPlayer() {
  const [tracks, setTracks] = useSetting('tracks')
  const player = useAudioPlayer(tracks)
  const progressRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !player.duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    player.seek(ratio)
  }

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (!files || files.length === 0) return
      const newTracks = Array.from(files).map((file) => {
        const title = file.name.replace(/\.[^/.]+$/, '')
        return {
          id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          title,
          artist: '本地音乐',
          cover: defaultCover,
          src: URL.createObjectURL(file),
        }
      })
      setTracks([...tracks, ...newTracks])
      // 如果当前没有播放，自动播放最后一首导入的
      if (!player.isPlaying && newTracks.length > 0) {
        setTimeout(() => {
          player.setCurrentIndex(tracks.length + newTracks.length - 1)
          player.play()
        }, 0)
      }
      e.target.value = ''
    },
    [tracks, setTracks, player],
  )

  const removeTrack = useCallback(
    (idx: number) => {
      const next = tracks.filter((_, i) => i !== idx)
      setTracks(next)
      if (idx < player.currentIndex) {
        player.setCurrentIndex(player.currentIndex - 1)
      } else if (idx === player.currentIndex) {
        player.setCurrentIndex(Math.min(idx, Math.max(0, next.length - 1)))
      }
    },
    [tracks, setTracks, player],
  )

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

  const hasTracks = tracks.length > 0
  const currentCover = player.currentTrack.cover || defaultCover

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
                  {player.currentTrack.artist}
                </p>
              </div>
            </div>

            {/* 进度条 */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                style={{
                  height: 5,
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.08)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${player.progress * 100}%`,
                    background: theme.colors.primary,
                    borderRadius: 999,
                    transition: 'width 0.1s linear',
                  }}
                />
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
              <button
                onClick={player.toggleLoop}
                title={player.isLooping ? '单曲循环中' : '顺序播放'}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: player.isLooping ? theme.colors.primary : theme.colors.textMuted,
                  padding: 6,
                  borderRadius: '50%',
                  transition: 'all 0.2s',
                }}
              >
                <Repeat size={18} />
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
              <Plus size={16} /> 导入本地音乐
            </button>

            {/* 播放列表 */}
            <div
              style={{
                borderTop: '1px solid rgba(0,0,0,0.06)',
                paddingTop: '0.8rem',
                maxHeight: 160,
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
                  暂无音乐，点击上方导入
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
                    onClick={() => player.setCurrentIndex(idx)}
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
                    </span>
                  </button>
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

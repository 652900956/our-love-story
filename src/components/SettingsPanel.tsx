/**
 * ============================================================================
 *  components/SettingsPanel.tsx —— 全站设置面板
 * ----------------------------------------------------------------------------
 *  从 Navbar 的 ≡ 按钮打开，右侧滑入抽屉。
 *  支持：修改双方头像（同步首页 Hero & 关于我们）、称呼、首页 slogan、
 *        相爱时间；所有设置持久化到 localStorage。
 * ============================================================================
 */

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  RotateCcw,
  Upload,
  User,
  Heart,
  MessageSquareText,
  Clock,
  Sparkles,
  MousePointer2,
  Image as ImageIcon,
  SlidersHorizontal,
  Trash2,
} from 'lucide-react'
import theme from '../config/theme.config'
import { useSettings, defaultSettings, type LoveySettings } from '../hooks/useSettings'

interface SettingsPanelProps {
  open: boolean
  onClose: () => void
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}


interface ToggleProps {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

/** 小巧的开关按钮 */
function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.8rem',
        cursor: 'pointer',
        fontFamily: theme.fonts.serif,
        fontSize: '0.95rem',
        color: theme.colors.textDark,
      }}
    >
      <span>{label}</span>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 44,
          height: 24,
          borderRadius: 12,
          background: checked ? theme.colors.primary : 'rgba(0,0,0,0.15)',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: checked ? 22 : 2,
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }}
        />
      </span>
    </label>
  )
}

export default function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { settings, update, reset } = useSettings()
  const [local, setLocal] = useState(settings)
  const maleInputRef = useRef<HTMLInputElement>(null)
  const femaleInputRef = useRef<HTMLInputElement>(null)
  const bgImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setLocal(settings)
  }, [open, settings])

  const handleAvatarUpload = async (file: File, field: 'maleAvatar' | 'femaleAvatar') => {
    if (!file.type.startsWith('image/')) return
    try {
      const dataUrl = await readFileAsDataURL(file)
      setLocal((prev) => ({ ...prev, [field]: dataUrl }))
    } catch {
      // ignore
    }
  }

  const handleBgImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    try {
      const dataUrl = await readFileAsDataURL(file)
      setLocal((prev) => ({ ...prev, bgImage: dataUrl }))
    } catch {
      // ignore
    }
  }

  const handleSave = () => {
    update({
      maleAvatar: local.maleAvatar,
      femaleAvatar: local.femaleAvatar,
      maleName: local.maleName,
      femaleName: local.femaleName,
      slogan: local.slogan,
      togetherSince: local.togetherSince,
      clickEffectEnabled: local.clickEffectEnabled,
      clickEffectType: local.clickEffectType,
      trailEnabled: local.trailEnabled,
      trailType: local.trailType,
      bgImage: local.bgImage,
      bgBlur: local.bgBlur,
    })
    onClose()
  }

  const handleReset = () => {
    if (confirm('确定要恢复默认设置吗？头像、称呼、时间等都会重置。')) {
      reset()
      setLocal(defaultSettings)
    }
  }

  const fieldStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  }

  const labelStyle: CSSProperties = {
    fontFamily: theme.fonts.serif,
    fontSize: '0.85rem',
    color: theme.colors.textMuted,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const inputStyle: CSSProperties = {
    padding: '0.65rem 0.9rem',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.1)',
    fontFamily: theme.fonts.serif,
    fontSize: '0.95rem',
    outline: 'none',
  }

  const selectStyle: CSSProperties = {
    ...inputStyle,
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundImage:
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23616161' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0.7rem center',
    paddingRight: '2.4rem',
  }

  const sectionTitleStyle: CSSProperties = {
    margin: 0,
    fontFamily: theme.fonts.serif,
    fontSize: '1rem',
    color: theme.colors.textDark,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 遮罩 */}
          <motion.div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.35)',
              zIndex: 10001,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* 抽屉 */}
          <motion.div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'min(420px, 90vw)',
              height: '100vh',
              background: theme.colors.bgCard,
              boxShadow: '-8px 0 40px rgba(0,0,0,0.12)',
              zIndex: 10002,
              display: 'flex',
              flexDirection: 'column',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* 头部 */}
            <div
              style={{
                padding: '1.2rem 1.4rem',
                borderBottom: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: theme.fonts.serif,
                  fontSize: '1.25rem',
                  color: theme.colors.textDark,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <User size={20} color={theme.colors.primary} /> 小站设置
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: theme.colors.textMuted,
                }}
              >
                <X size={22} />
              </button>
            </div>

            {/* 内容 */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.4rem',
              }}
            >
              {/* 头像 */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3
                  style={{
                    margin: 0,
                    fontFamily: theme.fonts.serif,
                    fontSize: '1rem',
                    color: theme.colors.textDark,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <Heart size={16} color={theme.colors.primary} /> 双方头像
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: theme.colors.textMuted }}>
                  修改后会同步更新首页和「关于我们」页面。
                </p>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  {(['maleAvatar', 'femaleAvatar'] as const).map((field) => {
                    const isMale = field === 'maleAvatar'
                    const label = isMale ? 'Ta' : '我'
                    const inputRef = isMale ? maleInputRef : femaleInputRef
                    return (
                      <div key={field} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: `3px solid ${theme.colors.primary}`,
                            background: `${theme.colors.primary}12`,
                            position: 'relative',
                          }}
                        >
                          <img
                            src={local[field]}
                            alt={label}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <button
                            onClick={() => inputRef.current?.click()}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(0,0,0,0.25)',
                              border: 'none',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              opacity: 0,
                              transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                          >
                            <Upload size={22} />
                          </button>
                        </div>
                        <input
                          ref={inputRef}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleAvatarUpload(file, field)
                            e.target.value = ''
                          }}
                        />
                        <input
                          type="text"
                          placeholder="或粘贴图片链接"
                          value={local[field]}
                          onChange={(e) => setLocal((prev) => ({ ...prev, [field]: e.target.value }))}
                          style={{
                            ...inputStyle,
                            fontSize: '0.8rem',
                            padding: '0.45rem 0.6rem',
                          }}
                        />
                        <input
                          type="text"
                          placeholder={isMale ? 'Ta 的称呼' : '我的称呼'}
                          value={isMale ? local.maleName : local.femaleName}
                          onChange={(e) =>
                            setLocal((prev) => ({
                              ...prev,
                              [isMale ? 'maleName' : 'femaleName']: e.target.value,
                            }))
                          }
                          style={{
                            ...inputStyle,
                            fontSize: '0.8rem',
                            padding: '0.45rem 0.6rem',
                            textAlign: 'center',
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* Slogan */}
              <section style={fieldStyle}>
                <label style={labelStyle}>
                  <MessageSquareText size={14} /> 首页 Slogan
                </label>
                <input
                  type="text"
                  value={local.slogan}
                  onChange={(e) => setLocal((prev) => ({ ...prev, slogan: e.target.value }))}
                  style={inputStyle}
                />
              </section>

              {/* 相爱时间 */}
              <section style={fieldStyle}>
                <label style={labelStyle}>
                  <Clock size={14} /> 正式相爱时间
                </label>
                <input
                  type="datetime-local"
                  value={local.togetherSince.slice(0, 16)}
                  onChange={(e) => setLocal((prev) => ({ ...prev, togetherSince: e.target.value + ':00' }))}
                  style={inputStyle}
                />
                <p style={{ margin: 0, fontSize: '0.75rem', color: theme.colors.textMuted }}>
                  修改后首页「我们一起走过的」时间会立即重新计算。
                </p>
              </section>

              {/* 鼠标特效 */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={sectionTitleStyle}>
                  <Sparkles size={16} color={theme.colors.primary} /> 鼠标特效
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: theme.colors.textMuted }}>
                  点击特效与轨迹仅在当前设备生效。
                </p>

                <Toggle
                  label="点击特效（星星迸发）"
                  checked={local.clickEffectEnabled}
                  onChange={(v) => setLocal((prev) => ({ ...prev, clickEffectEnabled: v }))}
                />

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    <MousePointer2 size={14} /> 点击特效类型
                  </label>
                  <select
                    value={local.clickEffectType}
                    onChange={(e) =>
                      setLocal((prev) => ({ ...prev, clickEffectType: e.target.value as 'star' }))
                    }
                    style={selectStyle}
                  >
                    <option value="star">星星迸发</option>
                  </select>
                </div>

                <Toggle
                  label="鼠标轨迹"
                  checked={local.trailEnabled}
                  onChange={(v) => setLocal((prev) => ({ ...prev, trailEnabled: v }))}
                />

                <div style={fieldStyle}>
                  <label style={labelStyle}>
                    <SlidersHorizontal size={14} /> 轨迹样式
                  </label>
                  <select
                    value={local.trailType}
                    onChange={(e) =>
                      setLocal((prev) => ({
                        ...prev,
                        trailType: e.target.value as LoveySettings['trailType'],
                      }))
                    }
                    style={selectStyle}
                  >
                    <option value="star">小星星</option>
                    <option value="dot">彩色圆点</option>
                    <option value="heart">小红心</option>
                    <option value="comet">流星拖尾</option>
                  </select>
                </div>
              </section>

              {/* 页面背景 */}
              <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h3 style={sectionTitleStyle}>
                  <ImageIcon size={16} color={theme.colors.primary} /> 页面背景
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: theme.colors.textMuted }}>
                  默认白色网格；上传图片后首页只作用于 Hero 下方，其他页作用于全局。
                </p>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button
                    onClick={() => bgImageInputRef.current?.click()}
                    style={{
                      flex: 1,
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      border: 'none',
                      background: theme.colors.primary,
                      color: '#fff',
                      fontFamily: theme.fonts.serif,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Upload size={14} /> 上传背景图
                  </button>
                  {local.bgImage && (
                    <button
                      onClick={() => setLocal((prev) => ({ ...prev, bgImage: '', bgBlur: 0 }))}
                      style={{
                        padding: '0.6rem 1rem',
                        borderRadius: 10,
                        border: 'none',
                        background: 'rgba(0,0,0,0.06)',
                        color: theme.colors.textMuted,
                        fontFamily: theme.fonts.serif,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <input
                    ref={bgImageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleBgImageUpload(file)
                      e.target.value = ''
                    }}
                  />
                </div>

                {local.bgImage && (
                  <>
                    <div
                      style={{
                        width: '100%',
                        height: 120,
                        borderRadius: 10,
                        overflow: 'hidden',
                        backgroundImage: `url(${local.bgImage})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                    <div style={fieldStyle}>
                      <label style={labelStyle}>
                        <SlidersHorizontal size={14} /> 背景模糊度：{local.bgBlur}px
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={local.bgBlur}
                        onChange={(e) =>
                          setLocal((prev) => ({ ...prev, bgBlur: Number(e.target.value) }))
                        }
                        style={{ width: '100%', accentColor: theme.colors.primary }}
                      />
                    </div>
                  </>
                )}
              </section>
            </div>

            {/* 底部按钮 */}
            <div
              style={{
                padding: '1rem 1.4rem',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '0.8rem',
              }}
            >
              <button
                onClick={handleReset}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: theme.colors.textMuted,
                  fontFamily: theme.fonts.serif,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <RotateCcw size={14} /> 恢复默认
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: '0.6rem 1.6rem',
                  borderRadius: 10,
                  border: 'none',
                  background: theme.colors.primary,
                  color: '#fff',
                  fontFamily: theme.fonts.serif,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(241, 107, 79, 0.35)',
                  transition: 'background 0.2s',
                }}
              >
                保存
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

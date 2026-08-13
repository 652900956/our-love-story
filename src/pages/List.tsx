import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import theme from '../config/theme.config'
import { list, type ListItem } from '../data/listContent'
import {
  fetchList,
  addList,
  toggleList,
  updateListProgress,
  deleteList,
  subscribeList,
  loveListIsCloud,
} from '../api/loveList'

/**
 * Love List：恋爱清单 / 约定。
 * 支持：勾选完成（划线变灰）、网页新增、网页删除；数据走 loveList API
 * （已接 Supabase 则云端共享 + 实时同步，否则回退本地浏览器）。
 */
export default function List() {
  const [items, setItems] = useState<ListItem[]>([])
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  const load = useCallback(() => {
    fetchList().then(setItems)
  }, [])
  useEffect(() => {
    load()
    return subscribeList(load)
  }, [load])

  const toggle = async (id: string) => {
    const cur = items.find((it) => it.id === id)
    if (!cur) return
    const nextDone = !cur.done
    const nextProgress = nextDone ? 100 : 0
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: nextDone, progress: nextProgress } : it)))
    await toggleList(id, nextDone)
  }

  const setProgress = async (id: string, progress: number) => {
    const p = Math.max(0, Math.min(100, Math.round(progress)))
    const done = p >= 100
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, progress: p, done } : it)))
    await updateListProgress(id, p)
  }
  const remove = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    await deleteList(id)
  }
  const add = async () => {
    const t = title.trim()
    if (!t) return
    await addList({ title: t, desc: desc.trim() })
    setTitle('')
    setDesc('')
    setAdding(false)
    load()
  }

  const doneCount = items.filter((it) => it.done).length
  const total = items.length
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  return (
    <PageShell>
      <PageHeader title={list.title} subtitle={list.subtitle} />

      <p className="page-intro" style={{ color: theme.colors.textMuted }}>
        {list.intro}
      </p>

      {!loveListIsCloud && (
        <p
          style={{
            maxWidth: '760px',
            margin: '0 auto 1.2rem',
            padding: '0 1rem',
            textAlign: 'center',
            fontFamily: theme.fonts.serif,
            color: theme.colors.textMuted,
            fontSize: '0.82rem',
          }}
        >
          当前为本地预览模式：清单仅保存在你本机浏览器。配置 Supabase 后可多人共享、实时同步。
        </p>
      )}

      {/* 完成进度 */}
      <div
        className="love-progress"
        style={{ background: `${theme.colors.primary}1f`, borderRadius: '999px' }}
      >
        <div
          className="love-progress-bar"
          style={{ width: `${pct}%`, background: theme.colors.primary, borderRadius: '999px' }}
        />
      </div>
      <p className="love-progress-text" style={{ color: theme.colors.textMuted }}>
        已完成 {doneCount} / {total}
      </p>

      {/* 清单 */}
      <div className="love-list">
        <AnimatePresence>
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className={`love-item${it.done ? ' done' : ''}`}
              style={{
                background: theme.colors.bgCard,
                borderRadius: theme.radius.card,
                border: `1px solid ${it.done ? 'transparent' : 'rgba(208, 206, 206, 0.4)'}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                opacity: it.done ? 0.72 : 1,
              }}
            >
              <button
                type="button"
                className="love-check"
                onClick={() => toggle(it.id)}
                aria-label="切换完成"
                style={{
                  background: it.done ? theme.colors.primary : 'transparent',
                  border: `2px solid ${theme.colors.primary}`,
                  color: '#fff',
                }}
              >
                {it.done ? '✓' : ''}
              </button>
              <div className="love-text">
                <h3
                  className="love-title"
                  style={{
                    color: theme.colors.textDark,
                    textDecoration: it.done ? 'line-through' : 'none',
                  }}
                >
                  {it.title}
                </h3>
                {it.desc && (
                  <p className="love-desc" style={{ color: theme.colors.textMuted }}>
                    {it.desc}
                  </p>
                )}
                <ProgressSlider value={it.done ? 100 : it.progress} onChange={(v) => setProgress(it.id, v)} />
              </div>
              <button
                type="button"
                className="love-del"
                onClick={() => remove(it.id)}
                aria-label="删除"
                style={{ color: theme.colors.textMuted }}
              >
                ×
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 新增约定 */}
      <div className="love-add">
        {!adding ? (
          <button
            type="button"
            className="love-add-btn"
            onClick={() => setAdding(true)}
            style={{ background: theme.colors.primary, color: theme.colors.bgCard }}
          >
            + 添加一个约定
          </button>
        ) : (
          <div className="love-add-form">
            <input
              className="love-input"
              placeholder="约定标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ border: `1px solid ${theme.colors.primary}55` }}
            />
            <input
              className="love-input"
              placeholder="补充说明（可选）"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{ border: `1px solid ${theme.colors.primary}55` }}
            />
            <div className="love-add-actions">
              <button
                type="button"
                className="love-add-btn"
                onClick={add}
                style={{ background: theme.colors.primary, color: theme.colors.bgCard }}
              >
                保存
              </button>
              <button
                type="button"
                className="love-cancel"
                onClick={() => {
                  setAdding(false)
                  setTitle('')
                  setDesc('')
                }}
                style={{ color: theme.colors.textMuted }}
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  )
}

/** 完成度滑条：默认细线，点击后变粗可拖拽 */
function ProgressSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [active, setActive] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

  const calcPct = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return value
    const x = Math.max(rect.left, Math.min(rect.right, clientX))
    return Math.round(((x - rect.left) / rect.width) * 100)
  }

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setActive(true)
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    onChange(calcPct(clientX))
  }

  useEffect(() => {
    if (!active) return
    const move = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? (e as TouchEvent).touches[0].clientX : (e as MouseEvent).clientX
      onChange(calcPct(clientX))
    }
    const up = () => setActive(false)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', up)
    return () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', up)
    }
  }, [active, onChange, value])

  const pct = Math.max(0, Math.min(100, value))

  return (
    <div style={{ marginTop: '0.55rem', userSelect: 'none' }}>
      <div
        ref={trackRef}
        onMouseDown={handleStart}
        onTouchStart={handleStart}
        style={{
          position: 'relative',
          height: active ? 10 : 3,
          borderRadius: 999,
          background: `${theme.colors.primary}1a`,
          cursor: 'pointer',
          transition: 'height 0.2s ease',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: theme.colors.primary,
            transition: active ? 'none' : 'width 0.25s ease',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `${pct}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: active ? 16 : 8,
            height: active ? 16 : 8,
            borderRadius: '50%',
            background: '#fff',
            border: `2px solid ${theme.colors.primary}`,
            boxShadow: active ? `0 0 0 4px ${theme.colors.primary}33` : 'none',
            transition: active ? 'none' : 'all 0.2s ease',
            pointerEvents: 'none',
          }}
        />
      </div>
      <div
        style={{
          fontSize: '0.72rem',
          color: theme.colors.textMuted,
          fontFamily: theme.fonts.serif,
          marginTop: '0.35rem',
        }}
      >
        完成度 {pct}%
      </div>
    </div>
  )
}

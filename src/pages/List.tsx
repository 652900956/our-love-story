import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import theme from '../config/theme.config'
import { list, type ListItem } from '../data/listContent'
import {
  fetchList,
  addList,
  toggleList,
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
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, done: nextDone } : it)))
    await toggleList(id, nextDone)
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

import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import LittleTimeline from '../components/LittleTimeline'
import theme from '../config/theme.config'
import { little } from '../data/littleContent'
import {
  fetchLittle,
  addLittle,
  deleteLittle,
  subscribeLittle,
  littleIsCloud,
} from '../api/little'
import type { LittleItem } from '../data/littleContent'

/** 可爱的自动 mood 图标池（用户添加自定义内容时随机分配，保持原有可爱风格） */
const cuteMoods = [
  '🌷 温柔',
  '🍑 甜甜',
  '🌙 晚安',
  '🐾 日常',
  '🍰 糖分',
  '🌈 好运',
  '🧸 抱抱',
  '☁️ 慵懒',
  '🍃 微风',
  '💫 心动',
]

function randomMood() {
  return cuteMoods[Math.floor(Math.random() * cuteMoods.length)]
}

/**
 * 点点滴滴：碎碎念 / 日记列表。
 * 支持网页上直接添加/删除，数据持久化到 localStorage；
 * 自定义内容自动分配可爱 mood 图标。
 */
export default function Little() {
  const [items, setItems] = useState<LittleItem[]>([])
  const [showForm, setShowForm] = useState(false)
  // 视图切换：默认保留原有的「列表」样式，新增「时间线」可选视图
  const [view, setView] = useState<'list' | 'timeline'>('list')
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [mood, setMood] = useState('')

  // 拉取 + 实时订阅（多设备同步）
  const load = useCallback(() => {
    fetchLittle().then(setItems)
  }, [])
  useEffect(() => {
    load()
    return subscribeLittle(load)
  }, [load])

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault()
    if (!date.trim() || !title.trim() || !content.trim()) return
    await addLittle({
      date: date.trim(),
      title: title.trim(),
      content: content.trim(),
      mood: mood.trim() || randomMood(),
    })
    load()
    setDate('')
    setTitle('')
    setContent('')
    setMood('')
    setShowForm(false)
  }

  const removeItem = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    await deleteLittle(id)
  }

  return (
    <PageShell>
      <PageHeader title={little.title} subtitle={little.subtitle} />

      <p className="page-intro" style={{ color: theme.colors.textMuted }}>
        {little.intro}
      </p>

      {!littleIsCloud && (
        <p
          style={{
            maxWidth: 720,
            margin: '0 auto 1.2rem',
            padding: '0 1rem',
            textAlign: 'center',
            fontFamily: theme.fonts.serif,
            color: theme.colors.textMuted,
            fontSize: '0.82rem',
          }}
        >
          当前为本地预览模式：点滴仅保存在你本机浏览器。配置 Supabase 后可多人共享、实时同步。
        </p>
      )}

      {/* 视图切换：保留原有「列表」，新增「时间线」可选视图（不影响默认样式） */}
      <div style={{ maxWidth: 720, margin: '0 auto 1.6rem', display: 'flex', justifyContent: 'center' }}>
        <div
          role="tablist"
          aria-label="点点滴滴视图切换"
          style={{
            display: 'inline-flex',
            padding: 4,
            borderRadius: 999,
            background: theme.colors.primarySoft,
            gap: 4,
          }}
        >
          {(
            [
              { key: 'list', label: '列表' },
              { key: 'timeline', label: '时间线' },
            ] as const
          ).map((seg) => (
            <button
              key={seg.key}
              role="tab"
              aria-selected={view === seg.key}
              onClick={() => setView(seg.key)}
              style={{
                padding: '0.5rem 1.4rem',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontFamily: theme.fonts.serif,
                fontSize: '0.92rem',
                transition: 'all 0.2s',
                background: view === seg.key ? theme.colors.primary : 'transparent',
                color: view === seg.key ? '#fff' : theme.colors.primary,
              }}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      {/* 添加按钮 */}
      <div style={{ maxWidth: 720, margin: '0 auto 2rem' }}>
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            style={{
              width: '100%',
              padding: '0.9rem',
              borderRadius: theme.radius.card,
              border: `1.5px dashed ${theme.colors.primary}`,
              background: `${theme.colors.primary}10`,
              color: theme.colors.primary,
              fontFamily: theme.fonts.serif,
              fontSize: '1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            <Plus size={20} /> 记录一段小确幸
          </button>
        ) : (
          <motion.form
            onSubmit={handleAdd}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: theme.colors.bgCard,
              borderRadius: theme.radius.card,
              border: '1px solid rgba(208, 206, 206, 0.4)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="日期，如 2025-08-17"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                style={{
                  flex: 1,
                  minWidth: 140,
                  padding: '0.7rem 1rem',
                  borderRadius: 10,
                  border: `1px solid rgba(0,0,0,0.1)`,
                  fontFamily: theme.fonts.serif,
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
              <input
                type="text"
                placeholder="标题"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                style={{
                  flex: 2,
                  minWidth: 180,
                  padding: '0.7rem 1rem',
                  borderRadius: 10,
                  border: `1px solid rgba(0,0,0,0.1)`,
                  fontFamily: theme.fonts.serif,
                  fontSize: '0.95rem',
                  outline: 'none',
                }}
              />
            </div>
            <textarea
              placeholder="写下今天的碎碎念..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              required
              style={{
                padding: '0.7rem 1rem',
                borderRadius: 10,
                border: `1px solid rgba(0,0,0,0.1)`,
                fontFamily: theme.fonts.serif,
                fontSize: '0.95rem',
                resize: 'vertical',
                outline: 'none',
              }}
            />
            <input
              type="text"
              placeholder="心情标签（可选，如 🌷 温柔），留空会自动分配可爱图标"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
              style={{
                padding: '0.7rem 1rem',
                borderRadius: 10,
                border: `1px solid rgba(0,0,0,0.1)`,
                fontFamily: theme.fonts.serif,
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
            <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: 10,
                  border: 'none',
                  background: 'transparent',
                  color: theme.colors.textMuted,
                  cursor: 'pointer',
                  fontFamily: theme.fonts.serif,
                }}
              >
                取消
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.55rem 1.4rem',
                  borderRadius: 10,
                  border: 'none',
                  background: theme.colors.primary,
                  color: '#fff',
                  cursor: 'pointer',
                  fontFamily: theme.fonts.serif,
                  transition: 'background 0.2s',
                }}
              >
                保存
              </button>
            </div>
          </motion.form>
        )}
      </div>

      {/* 列表视图（默认，原有样式完全保留） */}
      {view === 'list' && (
        <div className="little-list">
          <AnimatePresence>
            {items.map((it) => (
              <motion.article
                key={it.id}
                className="little-item"
                style={{
                  background: theme.colors.bgCard,
                  borderRadius: theme.radius.card,
                  border: '1px solid rgba(208, 206, 206, 0.4)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  position: 'relative',
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -30 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
                whileHover={{ y: -4, boxShadow: '0 14px 30px rgba(0,0,0,0.1)' }}
              >
                <button
                  onClick={() => removeItem(it.id)}
                  title="删除"
                  style={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    background: 'transparent',
                    border: 'none',
                    color: theme.colors.textMuted,
                    cursor: 'pointer',
                    opacity: 0.5,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
                >
                  <Trash2 size={14} />
                </button>
                <div className="little-date" style={{ color: theme.colors.primary }}>
                  {it.date}
                </div>
                <div className="little-body">
                  <h3 className="little-title" style={{ color: theme.colors.textDark, paddingRight: 20 }}>
                    {it.title}
                  </h3>
                  <p className="little-content" style={{ color: theme.colors.textMain }}>
                    {it.content}
                  </p>
                  {it.mood && (
                    <span
                      className="little-mood"
                      style={{ background: `${theme.colors.primary}1a`, color: theme.colors.primary }}
                    >
                      {it.mood}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* 时间线视图（新增：横向波浪时间线，随添加向右无限延伸，可拖拽/滚轮左右浏览） */}
      {view === 'timeline' && <LittleTimeline items={items} />}
    </PageShell>
  )
}

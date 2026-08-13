import { useState, useEffect, type CSSProperties, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import theme from '../config/theme.config'
import { isSupabaseConfigured } from '../config/supabase'
import { leaving } from '../data/leavingContent'
import {
  fetchMessages,
  addMessage,
  deleteMessage,
  subscribeMessages,
  type MessageItem,
} from '../api/messages'

/** ISO 时间 → YYYY-MM-DD HH:mm */
function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function Message() {
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // 加载留言
  useEffect(() => {
    let alive = true
    fetchMessages().then((list) => {
      if (alive) {
        setMessages(list)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  // 实时订阅：他人新增 / 删除留言时自动刷新
  useEffect(() => {
    const unsub = subscribeMessages(() => {
      fetchMessages().then((list) => setMessages(list))
    })
    return unsub
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    setSubmitting(true)
    const saved = await addMessage(name, text)
    setMessages((prev) => [saved, ...prev])
    setContent('')
    setSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    await deleteMessage(id)
    setMessages((prev) => prev.filter((m) => m.id !== id))
  }

  return (
    <PageShell>
      <PageHeader title={leaving.title} subtitle={leaving.subtitle} />

      {/* 本地 / 云端模式提示 */}
      <p
        style={{
          maxWidth: '760px',
          margin: '0 auto',
          padding: '0 1rem',
          textAlign: 'center',
          fontFamily: theme.fonts.serif,
          color: theme.colors.textMuted,
          fontSize: '0.82rem',
        }}
      >
        {isSupabaseConfigured
          ? '留言已接入云端，所有人可见、永久保存。'
          : '当前为本地预览模式：留言仅保存在你本机浏览器，清缓存会丢失。配置 Supabase 后可多人共享。'}
      </p>

      {/* 留言表单 */}
      <form
        onSubmit={handleSubmit}
        style={{
          maxWidth: '760px',
          margin: '1.6rem auto 0',
          padding: '0 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.8rem',
        }}
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="你的名字（可不填）"
          style={inputStyle}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下想说的话…"
          rows={3}
          style={{ ...inputStyle, resize: 'vertical', fontFamily: theme.fonts.serif }}
        />
        <div style={{ textAlign: 'right' }}>
          <motion.button
            type="submit"
            disabled={submitting || !content.trim()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              ...buttonStyle,
              opacity: submitting || !content.trim() ? 0.6 : 1,
              cursor: submitting || !content.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '发送中…' : '写下留言'}
          </motion.button>
        </div>
      </form>

      {/* 留言列表 */}
      <div
        style={{
          maxWidth: '760px',
          margin: '2.4rem auto 5rem',
          padding: '0 1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {loading && (
          <p style={{ textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.fonts.serif }}>
            加载中…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p style={{ textAlign: 'center', color: theme.colors.textMuted, fontFamily: theme.fonts.serif }}>
            还没有留言，来抢沙发吧 ~
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              style={{
                position: 'relative',
                background: theme.colors.bgCard,
                borderRadius: theme.radius.card,
                padding: '1rem 1.2rem',
                boxShadow: '0 6px 18px rgba(0,0,0,0.06)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: '0.4rem',
                }}
              >
                <span style={{ fontFamily: theme.fonts.decorative, color: theme.colors.primary, fontSize: '1.1rem' }}>
                  {m.name}
                </span>
                <span style={{ fontSize: '0.75rem', color: theme.colors.textMuted, fontFamily: theme.fonts.serif }}>
                  {formatTime(m.created_at)}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  color: theme.colors.textMain,
                  lineHeight: 1.75,
                  fontFamily: theme.fonts.serif,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {m.content}
              </p>
              <button
                type="button"
                onClick={() => handleDelete(m.id)}
                aria-label="删除留言"
                title="删除这条留言"
                style={{
                  position: 'absolute',
                  top: '0.6rem',
                  right: '0.6rem',
                  border: 'none',
                  background: 'transparent',
                  color: theme.colors.textMuted,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  opacity: 0.5,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.5')}
              >
                删除
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </PageShell>
  )
}

const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '0.7rem 1rem',
  borderRadius: '1rem',
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'var(--bg-card)',
  fontSize: '0.95rem',
  color: 'var(--text-dark)',
  fontFamily: "'Noto Serif SC', serif",
  outline: 'none',
}

const buttonStyle: React.CSSProperties = {
  fontFamily: "'Noto Serif SC', serif",
  fontSize: '0.95rem',
  color: '#fff',
  background: '#f16b4f',
  border: 'none',
  borderRadius: '1rem',
  padding: '0.7rem 2.2rem',
  boxShadow: '0 6px 16px rgba(241,107,79,0.35)',
}

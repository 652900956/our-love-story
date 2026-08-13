import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import theme from '../config/theme.config'
import { isSupabaseConfigured } from '../config/supabase'
import { fetchPhotos, addPhoto, deletePhoto, subscribePhotos } from '../api/photos'
import type { PhotoItem } from '../data/photoList'

/**
 * Love Photo：相册网格 + 灯箱预览 + 加载更多（还原原站交互）。
 * 数据通过 src/api/photos 读取：已接 Supabase 则读云库（可后台增删），
 * 否则回退 src/data/photoList.ts。组件只管展示，不关心数据来源。
 */
export default function LovePhoto() {
  const pageSize = theme.photoPageSize
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<PhotoItem | null>(null)
  // 新增照片表单（仅云端模式可用）
  const [addOpen, setAddOpen] = useState(false)
  const [newSrc, setNewSrc] = useState('')
  const [newCaption, setNewCaption] = useState('')
  const [newDate, setNewDate] = useState('')
  const [newNote, setNewNote] = useState('')
  const [adding, setAdding] = useState(false)

  // 重新拉取第一页（首屏 + 实时变更都走这里）
  const reload = useCallback(async () => {
    setLoading(true)
    const { items, hasMore: more } = await fetchPhotos(pageSize, 0)
    setPhotos(items)
    setHasMore(more)
    setLoading(false)
  }, [pageSize])

  // 加载更多（保留分页）
  const loadMore = useCallback(async () => {
    setLoading(true)
    const { items, hasMore: more } = await fetchPhotos(pageSize, photos.length)
    setPhotos((prev) => [...prev, ...items])
    setHasMore(more)
    setLoading(false)
  }, [pageSize, photos.length])

  // 首屏加载 + 实时订阅（多设备同步）
  useEffect(() => {
    reload()
    return subscribePhotos(reload)
  }, [reload])

  const handleAddPhoto = async (e: FormEvent) => {
    e.preventDefault()
    const src = newSrc.trim()
    if (!src) return
    setAdding(true)
    await addPhoto({
      src,
      caption: newCaption.trim(),
      date: newDate.trim() || new Date().toLocaleString(),
      note: newNote.trim(),
    })
    setAdding(false)
    setNewSrc('')
    setNewCaption('')
    setNewDate('')
    setNewNote('')
    setAddOpen(false)
    reload()
  }

  // 灯箱打开时禁止背景滚动，Esc 关闭
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
    }
    if (active) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKey)
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  return (
    <PageShell>
      <PageHeader title="Love Photo" subtitle="恋爱相册 · 记录最美瞬间" />

      {!isSupabaseConfigured && (
        <p
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '0 1rem',
            textAlign: 'center',
            fontFamily: theme.fonts.serif,
            color: theme.colors.textMuted,
            fontSize: '0.82rem',
          }}
        >
          当前为本地预览模式：照片来自 data/photoList.ts。接入 Supabase 后可在后台随意增删、放任意多张。
        </p>
      )}

      {isSupabaseConfigured && (
        <div style={{ maxWidth: '1100px', margin: '0 auto 1.4rem', padding: '0 1rem' }}>
          {!addOpen ? (
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              style={{
                width: '100%',
                padding: '0.8rem',
                borderRadius: theme.radius.card,
                border: `1.5px dashed ${theme.colors.primary}`,
                background: `${theme.colors.primary}10`,
                color: theme.colors.primary,
                fontFamily: theme.fonts.serif,
                fontSize: '0.95rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Plus size={18} /> 添加一张照片
            </button>
          ) : (
            <form
              onSubmit={handleAddPhoto}
              style={{
                background: theme.colors.bgCard,
                borderRadius: theme.radius.card,
                border: '1px solid rgba(208,206,206,0.4)',
                boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.7rem',
              }}
            >
              <input
                value={newSrc}
                onChange={(e) => setNewSrc(e.target.value)}
                placeholder="图片 URL（必填，支持任意图床链接）"
                required
                style={addInputStyle}
              />
              <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap' }}>
                <input
                  value={newCaption}
                  onChange={(e) => setNewCaption(e.target.value)}
                  placeholder="标题"
                  style={{ ...addInputStyle, flex: 2, minWidth: 160 }}
                />
                <input
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="日期，如 2025-08-17"
                  style={{ ...addInputStyle, flex: 1, minWidth: 140 }}
                />
              </div>
              <input
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="备注（可选）"
                style={addInputStyle}
              />
              <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setAddOpen(false)} style={addCancelStyle}>
                  取消
                </button>
                <button
                  type="submit"
                  disabled={adding || !newSrc.trim()}
                  style={{ ...addSubmitStyle, opacity: adding || !newSrc.trim() ? 0.6 : 1, cursor: adding || !newSrc.trim() ? 'not-allowed' : 'pointer' }}
                >
                  {adding ? '保存中…' : '保存'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div
        className="photo-grid"
        style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 1rem 3rem' }}
      >
        {photos.map((p) => (
          <motion.figure
            key={p.id}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: theme.animation.photoDuration,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            onClick={() => setActive(p)}
            style={{
              margin: 0,
              borderRadius: theme.radius.cardB,
              overflow: 'hidden',
              background: theme.colors.bgCard,
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              cursor: 'pointer',
              transition: `box-shadow ${theme.animation.hoverDuration}s, transform ${theme.animation.hoverDuration}s`,
            }}
            whileHover={{ y: -5 }}
          >
            <div style={{ overflow: 'hidden' }}>
              <img
                src={p.src}
                alt={p.caption}
                loading="lazy"
                style={{
                  width: '100%',
                  display: 'block',
                  aspectRatio: '4 / 3',
                  objectFit: 'cover',
                  transition: `transform ${theme.animation.hoverDuration}s`,
                }}
              />
            </div>
            <figcaption
              style={{
                padding: '0.8rem 1rem',
                fontFamily: theme.fonts.serif,
                color: theme.colors.textMain,
                fontSize: '0.95rem',
              }}
            >
              {p.caption}
            </figcaption>
          </motion.figure>
        ))}
      </div>

      {/* 加载更多 / 加载中 */}
      <div style={{ textAlign: 'center', paddingBottom: '5rem', minHeight: '3rem' }}>
        {loading && (
          <span style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.serif }}>
            加载中…
          </span>
        )}
        {!loading && hasMore && (
          <motion.button
            type="button"
            onClick={loadMore}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            style={{
              fontFamily: theme.fonts.serif,
              fontSize: '0.95rem',
              color: theme.colors.bgCard,
              background: theme.colors.primary,
              border: 'none',
              borderRadius: theme.radius.sidebar,
              padding: '0.7rem 2.4rem',
              cursor: 'pointer',
              boxShadow: '0 6px 16px rgba(241,107,79,0.35)',
            }}
          >
            加载更多
          </motion.button>
        )}
        {!loading && !hasMore && photos.length > 0 && (
          <span style={{ color: theme.colors.textMuted, fontFamily: theme.fonts.serif, fontSize: '0.85rem' }}>
            已经到底啦 ~
          </span>
        )}
      </div>

      {/* 灯箱：大图 + 上传时间 + 备注 */}
      <AnimatePresence>
        {active && (
          <motion.div
            key="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={() => setActive(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 200,
              background: theme.colors.loadingMask,
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1rem',
            }}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                background: theme.colors.bgCard,
                borderRadius: theme.radius.cardB,
                maxWidth: '720px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
              }}
            >
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label="关闭"
                style={{
                  position: 'absolute',
                  top: '0.8rem',
                  right: '0.8rem',
                  width: '2.2rem',
                  height: '2.2rem',
                  borderRadius: '50%',
                  border: 'none',
                  background: 'rgba(0,0,0,0.45)',
                  color: '#fff',
                  fontSize: '1.2rem',
                  lineHeight: 1,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              >
                ×
              </button>

              {isSupabaseConfigured && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('确定删除这张照片吗？')) {
                      await deletePhoto(active.id)
                      setActive(null)
                      reload()
                    }
                  }}
                  aria-label="删除照片"
                  title="删除这张照片"
                  style={{
                    position: 'absolute',
                    top: '0.8rem',
                    right: '3.4rem',
                    width: '2.2rem',
                    height: '2.2rem',
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(214,40,40,0.9)',
                    color: '#fff',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    zIndex: 2,
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}

              <img
                src={active.src}
                alt={active.caption}
                style={{
                  width: '100%',
                  display: 'block',
                  objectFit: 'contain',
                  maxHeight: '68vh',
                  background: '#f3f3f3',
                }}
              />

              <div style={{ padding: '1.2rem 1.6rem 1.8rem' }}>
                <div
                  style={{
                    fontFamily: theme.fonts.decorative,
                    color: theme.colors.primary,
                    fontSize: '1.4rem',
                  }}
                >
                  {active.caption}
                </div>
                <div
                  style={{
                    marginTop: '0.35rem',
                    color: theme.colors.textMuted,
                    fontSize: '0.82rem',
                    fontFamily: theme.fonts.serif,
                  }}
                >
                  上传于 {active.date}
                </div>
                {active.note && (
                  <p
                    style={{
                      marginTop: '0.9rem',
                      marginBottom: 0,
                      color: theme.colors.textMain,
                      fontSize: '0.95rem',
                      lineHeight: 1.75,
                      fontFamily: theme.fonts.serif,
                    }}
                  >
                    {active.note}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  )
}

// ── 添加照片表单样式（颜色取自 theme） ──
const addInputStyle = {
  width: '100%',
  boxSizing: 'border-box' as const,
  padding: '0.7rem 1rem',
  borderRadius: 10,
  border: '1px solid rgba(0,0,0,0.1)',
  fontFamily: "'Noto Serif SC', serif",
  fontSize: '0.95rem',
  outline: 'none',
}
const addCancelStyle = {
  padding: '0.55rem 1.2rem',
  borderRadius: 10,
  border: 'none',
  background: 'transparent',
  color: '#8a8a8a',
  cursor: 'pointer',
  fontFamily: "'Noto Serif SC', serif",
}
const addSubmitStyle = {
  padding: '0.55rem 1.4rem',
  borderRadius: 10,
  border: 'none',
  background: '#f16b4f',
  color: '#fff',
  cursor: 'pointer',
  fontFamily: "'Noto Serif SC', serif",
}

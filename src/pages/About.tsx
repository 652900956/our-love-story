import { useState, type CSSProperties, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2 } from 'lucide-react'
import PageShell from '../components/PageShell'
import PageHeader from '../components/PageHeader'
import theme from '../config/theme.config'
import { about } from '../data/aboutContent'
import { useSetting, useSettings } from '../hooks/useSettings'
import type { AboutMilestone } from '../data/aboutContent'

/**
 * 关于我们：两人卡片 + 故事段落 + 大事记时间轴。
 * 里程碑支持网页上直接添加/删除，数据持久化到 localStorage。
 */
export default function About() {
  const { settings } = useSettings()
  const [milestones, setMilestones] = useSetting('milestones')
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')

  // 头像、称呼、标签与简介从 settings 读取，与设置面板同步
  const couple = [
    {
      ...about.couple.he,
      name: settings.maleName,
      avatar: settings.maleAvatar,
      tag: settings.maleTag,
      intro: settings.maleIntro,
    },
    {
      ...about.couple.she,
      name: settings.femaleName,
      avatar: settings.femaleAvatar,
      tag: settings.femaleTag,
      intro: settings.femaleIntro,
    },
  ]

  const cardStyle: CSSProperties = {
    background: theme.colors.bgCard,
    borderRadius: theme.radius.card,
    border: '1px solid rgba(208, 206, 206, 0.4)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
    padding: '2rem 1.6rem',
  }

  const handleAdd = (e: FormEvent) => {
    e.preventDefault()
    if (!date.trim() || !title.trim()) return
    const newItem: AboutMilestone = {
      id: `m-${Date.now()}`,
      date: date.trim(),
      title: title.trim(),
      desc: desc.trim(),
    }
    setMilestones([...milestones, newItem])
    setDate('')
    setTitle('')
    setDesc('')
    setShowForm(false)
  }

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id))
  }

  return (
    <PageShell>
      <PageHeader title={about.title} subtitle={about.subtitle} />

      {/* 两人卡片 */}
      <section className="about-couple">
        {couple.map((p) => (
          <motion.div
            key={p.name}
            className="about-person"
            style={cardStyle}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
            whileHover={{ y: -6, boxShadow: '0 14px 30px rgba(0,0,0,0.1)' }}
          >
            <img
              className="about-avatar"
              src={p.avatar}
              alt={p.name}
              style={{ border: `3px solid ${theme.colors.primary}` }}
            />
            <h3 className="about-name" style={{ color: theme.colors.textDark }}>
              {p.name}
            </h3>
            <span className="about-tag" style={{ color: theme.colors.primary }}>
              {p.tag}
            </span>
            <p className="about-intro" style={{ color: theme.colors.textMuted }}>
              {p.intro}
            </p>
          </motion.div>
        ))}
      </section>

      {/* 故事段落 */}
      <p className="about-story" style={{ color: theme.colors.textMain }}>
        {about.story}
      </p>

      {/* 大事记时间轴 */}
      <div className="timeline-title" style={{ color: theme.colors.textDark }}>
        我们的里程碑
      </div>

      <section className="timeline">
        <AnimatePresence>
          {milestones.map((m) => (
            <motion.div
              key={m.id}
              className="timeline-item"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -30 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: theme.animation.fadeDuration, ease: 'easeOut' }}
            >
              <span className="timeline-date" style={{ color: theme.colors.primary }}>
                {m.date}
              </span>
              <span className="timeline-center">
                <span
                  className="timeline-dot"
                  style={{ background: theme.colors.primary, boxShadow: `0 0 0 4px ${theme.colors.bgCard}` }}
                />
              </span>
              <div
                className="timeline-card"
                style={{
                  background: theme.colors.bgCard,
                  borderRadius: theme.radius.card,
                  border: '1px solid rgba(208, 206, 206, 0.4)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                  padding: '1rem 1.3rem',
                  position: 'relative',
                }}
              >
                <button
                  onClick={() => removeMilestone(m.id)}
                  title="删除"
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    background: 'transparent',
                    border: 'none',
                    color: theme.colors.textMuted,
                    cursor: 'pointer',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
                >
                  <Trash2 size={14} />
                </button>
                <h4 className="timeline-card-title" style={{ color: theme.colors.textDark, paddingRight: 24 }}>
                  {m.title}
                </h4>
                <p className="timeline-card-desc" style={{ color: theme.colors.textMuted }}>
                  {m.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </section>

      {/* 添加里程碑 */}
      <div style={{ maxWidth: 720, margin: '2rem auto 0' }}>
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
            <Plus size={20} /> 添加一个里程碑
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
                placeholder="日期，如 2025.08.17"
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
              placeholder="写下这件大事的回忆..."
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={3}
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
    </PageShell>
  )
}

/**
 * ============================================================================
 *  data/homeContent.ts —— 首页展示内容（数据与视图分离）
 * ----------------------------------------------------------------------------
 *  组件不写业务文案，只通过 import 本文件渲染。
 *  要改首页文字/图片/卡片，只动这里即可。
 * ============================================================================
 */

/** 在一起起始时间，用于 LoveTimer 实时计数 */
export const togetherSince = '2024-08-17T02:31:21'

export interface HeroPerson {
  name: string
  /** 头像图片 URL（占位图，可替换为你们的照片） */
  avatar: string
}

export const hero = {
  /** 背景封面图（本地静态资源，放到 public/images/cover/cover.jpg） */
  background: '/images/cover/cover.jpg',
  male: {
    name: '磊磊',
    /** 本地静态头像，放到 public/images/avatars/male.jpg */
    avatar: '/images/avatars/male.jpg',
  } satisfies HeroPerson,
  female: {
    name: '聪聪',
    /** 本地静态头像，放到 public/images/avatars/female.jpg */
    avatar: '/images/avatars/female.jpg',
  } satisfies HeroPerson,
}

/** 导航菜单项（数据驱动 Navbar） */
export interface NavLink {
  /** 显示文字 */
  label: string
  /** 路由路径 */
  to: string
}

/** 顶部导航文案 */
export const header = {
  logo: 'LoveLover',
  version: 'v5.2.1',
  slogan: '爱晨雾漫过青瓦，爱暮色染透篱笆，更爱与君并肩立，看遍这人间烟火里的朝暮与年华。',
  /** 导航菜单（点击跳转对应路由，Navbar 渲染） */
  nav: [
    { label: '首页', to: '/' },
    { label: '关于我们', to: '/about' },
    { label: '点点滴滴', to: '/little' },
    { label: '留言板', to: '/leaving' },
    { label: 'Love Photo', to: '/love-img' },
    { label: 'Love List', to: '/list' },
    { label: '日历待办', to: '/calendar' },
    { label: '记账本', to: '/ledger' },
  ] satisfies NavLink[],
}

export interface HomeCard {
  id: string
  /** 路由路径 */
  to: string
  /** 卡片标题 */
  title: string
  /** 卡片副文案 */
  desc: string
  /** lucide-react 图标名（组件内映射） */
  icon: 'Heart' | 'MessageCircle' | 'Users' | 'Images' | 'ListChecks' | 'CalendarDays' | 'Wallet'
  /** 是否大卡片（占 1/2 宽，card-b） */
  wide?: boolean
}

export const cards: HomeCard[] = [
  { id: 'little', to: '/little', title: '点点滴滴', desc: '有人愿意听你碎碎念念也很浪漫', icon: 'Heart' },
  { id: 'leaving', to: '/leaving', title: '留言板', desc: '在这里写下我们的留言祝福', icon: 'MessageCircle' },
  { id: 'about', to: '/about', title: '关于我们', desc: '我们之间认识的经历回忆', icon: 'Users' },
  { id: 'loveImg', to: '/love-img', title: 'Love Photo', desc: '恋爱相册 记录最美瞬间', icon: 'Images', wide: true },
  { id: 'list', to: '/list', title: 'Love List', desc: '恋爱列表 你我之间的约定', icon: 'ListChecks', wide: true },
  { id: 'calendar', to: '/calendar', title: '日历待办', desc: '重要日子与待办 一起记住', icon: 'CalendarDays', wide: true },
  { id: 'ledger', to: '/ledger', title: '记账本', desc: '共同记账 规划我们的小未来', icon: 'Wallet', wide: true },
]

/** 页脚 */
export const footer = {
  icp: '',
  icpLink: '',
  copyright: 'Copyright © 2024 - 2026 LoveLover All Rights Reserved.',
}

/** 右下固定侧边栏 */
export const sidebar = {
  /** 开源地址（原站 Gitee） */
  openSourceUrl: 'https://gitee.com/kiCode111/like-girl-v5.2.0',
}

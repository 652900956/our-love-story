/**
 * ============================================================================
 *  data/siteContent.ts —— 全站唯一「展示内容」数据源（你本地维护，git push 即上线）
 * ----------------------------------------------------------------------------
 *  ⚠️ 这是整站内容的唯一入口。访客只能看、不能写（静态站无后端）。
 *     你以后加内容，只改这一个文件 + 把图片丢进 public/images/ 即可。
 *
 *  加内容的标准流程：
 *    1. 把图片放进 public/images/ 下对应目录（avatars / cover / photos / about），
 *       文件名随便起，建议 英文+日期，例如 2024-beach.jpg
 *    2. 在本文件对应数组里加一条（复制示例改文字/路径）
 *    3. git push → Cloudflare 自动重新部署，线上立刻更新
 *
 *  图片路径写法：以 /images/ 开头，对应 public/images/ 目录
 *    例：public/images/photos/2024-beach.jpg  →  写成 '/images/photos/2024-beach.jpg'
 *
 *  各区块对应关系：
 *    loveList  → Love List 约定清单       （/list）
 *    photos    → 照片墙 Love Photo        （/love-img）
 *    messages  → 留言板 Message            （/leaving）
 *    timeline  → 关于我们·里程碑时间轴      （/about 内）
 *    moments   → 点点滴滴                  （/little）
 *    about     → 关于我们（两人卡 / 故事）  （/about）
 * ============================================================================
 */

/* ============================== 类型定义 ============================== */

/** Love List：恋爱约定清单 */
export interface LoveListItem {
  id: string
  title: string
  desc: string
  /** 是否已完成（true 时清单项划线变灰） */
  done: boolean
  /** 完成百分比 0-100，done=true 时展示为 100% */
  progress: number
}

/** 照片墙：恋爱相册 */
export interface PhotoItem {
  id: string
  /** 图片地址：本地用 /images/photos/xxx.jpg，或临时用网络图床 URL */
  src: string
  /** 标题（卡片 / 灯箱显示） */
  caption: string
  /** 上传时间（灯箱显示在图片下方，可写成 2025-05-20 18:32） */
  date: string
  /** 备注（灯箱显示在图片下方，可留空字符串 ''） */
  note: string
}

/** 留言板：展示用的留言 / 祝福（date 为展示用日期，如 2024-08-17） */
export interface MessageItem {
  id: string
  name: string
  content: string
  date?: string
}

/** 关于我们·里程碑（时间轴节点，也是「时间线 / 日记」数据源） */
export interface AboutMilestone {
  id: string
  date: string
  title: string
  desc: string
}

/** 点点滴滴：一条小日记 / 碎碎念 */
export interface LittleItem {
  id: string
  /** 展示日期，如 2025-05-20 */
  date: string
  title: string
  content: string
  /** 心情标签，如 「🌇 治愈」；留空时系统自动分配可爱图标 */
  mood?: string
}

/** 关于我们·单个人物卡 */
export interface AboutCouplePerson {
  name: string
  /** 头像图片地址，建议用本地 /images/avatars/male.jpg */
  avatar: string
  /** 角色标签，如「他 · 把伞往你那边倾斜的人」 */
  tag: string
  intro: string
}

/** 关于我们页整体内容 */
export interface AboutContent {
  title: string
  subtitle: string
  /** 两人简介段落（居中衬线展示，可用 \n\n 分段） */
  story: string
  couple: {
    he: AboutCouplePerson
    she: AboutCouplePerson
  }
  /** 大事记时间轴（按时间正序） */
  milestones: AboutMilestone[]
}

/* ============================== Love List 约定清单 ============================== */
export const loveList: LoveListItem[] = [
  { id: 't1', title: '一起看一次海上日出', desc: '订好闹钟，四点起床也不准反悔。', done: true, progress: 100 },
  { id: 't2', title: '养一只属于我们的猫', desc: '名字都想好了，等房子再大一点就接它回家。', done: true, progress: 100 },
  { id: 't3', title: '去一次海边城市旅居', desc: '住满一整周，哪也不赶，只吹海风。', done: false, progress: 0 },
  { id: 't4', title: '合拍一组复古胶片照', desc: '找家老照相馆，穿得正式一点，裱起来挂墙上。', done: false, progress: 0 },
  { id: 't5', title: '学会做你最爱的那道菜', desc: '番茄牛腩，炖到软烂，火候要练。', done: false, progress: 0 },
  { id: 't6', title: '存一笔「说走就走」基金', desc: '每个月攒一点，专门用来临时起意的旅行。', done: false, progress: 0 },
  { id: 't7', title: '一起跨年看烟花', desc: '在零点钟声敲响的那一刻，说一声新年快乐。', done: false, progress: 0 },
]

/* ============================== 照片墙 Love Photo ============================== */
/* 占位图用的是 Unsplash 网络图，方便你先看效果；替换成自己的照片时，
   把 src 改成 '/images/photos/你的文件名.jpg' 并把图片放进 public/images/photos/ 即可。 */
export const photos: PhotoItem[] = [
  { id: 'p1', src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80', caption: '一起看过的风景', date: '2025-05-20 18:32', note: '那天山顶的风很大，但你靠过来的温度刚好。' },
  { id: 'p2', src: 'https://images.unsplash.com/photo-1522098635833-216c03d81fbd?auto=format&fit=crop&w=1200&q=80', caption: '温柔的瞬间', date: '2025-04-11 21:05', note: '你低头笑的时候，世界都安静了。' },
  { id: 'p3', src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', caption: '海边的约定', date: '2025-03-02 16:48', note: '说好了，每年都要来看一次海。' },
  { id: 'p4', src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80', caption: '城市的灯火', date: '2025-02-14 22:17', note: '情人节的烟火，记得抬头看。' },
  { id: 'p5', src: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80', caption: '旅途中的我们', date: '2025-01-09 10:03', note: '迷路也没关系，反正和你在一起。' },
  { id: 'p6', src: 'https://images.unsplash.com/photo-1474557157379-8e0aa8d5397c?auto=format&fit=crop&w=1200&q=80', caption: '平凡的日子', date: '2024-12-25 20:40', note: '圣诞夜的便利店，热气腾腾的关东煮。' },
  { id: 'p7', src: 'https://images.unsplash.com/photo-1494774157365-9e5cebd44f49?auto=format&fit=crop&w=1200&q=80', caption: '初雪的拥抱', date: '2024-11-30 15:12', note: '第一场雪，你说要堆两个小人。' },
  { id: 'p8', src: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1200&q=80', caption: '牵手的午后', date: '2024-10-18 14:25', note: '公园长椅上，阳光刚好落在你发梢。' },
]

/* ============================== 留言板 Message ============================== */
/* 留空数组 [] 则显示「还没有留言」。复制示例加一条即可。 */
export const messages: MessageItem[] = [
  { id: 'm1', name: '磊磊', content: '遇见你是我最大的幸运，往后的每一天都想和你一起度过。', date: '2024-08-17' },
  { id: 'm2', name: '聪聪', content: '谢谢你出现在我的生命里，把平凡的日子都过成了诗。', date: '2024-08-18' },
]

/* ============================== 关于我们·里程碑时间轴 ============================== */
export const timeline: AboutMilestone[] = [
  { id: 'm1', date: '2023.03.14', title: '初见', desc: '在朋友的聚会上认识，谁也没想到后来会是一家人。' },
  { id: 'm2', date: '2023.06.01', title: '在一起', desc: '一个普通的周四，你说了「好」，世界忽然就亮了。' },
  { id: 'm3', date: '2024.02.14', title: '第一个纪念日', desc: '下厨做了三道菜，糊了两道，但那一晚笑得最久。' },
  { id: 'm4', date: '2024.10.01', title: '第一次旅行', desc: '在海边等了一场日落，风很大，手牵得很紧。' },
  { id: 'm5', date: '2025.05.20', title: '我们的小站上线', desc: '把回忆搬进了这个网站，往后每一天都接着写。' },
]

/* ============================== 点点滴滴 ============================== */
export const moments: LittleItem[] = [
  {
    id: 'l1',
    date: '2025-05-20',
    title: '今天的晚霞很甜',
    content: '下班路上抬头，整片天都是橘子味的。你突然说「拍给你看」，于是我的相册里多了一张不许删的晚霞。',
    mood: '🌇 治愈',
  },
  {
    id: 'l2',
    date: '2025-05-12',
    title: '你又偷偷给我点了奶茶',
    content: '备注写着「少冰，去芊，记得喝完」。明明自己说在减肥，转头就把半杯推给我。这种双标，希望一辈子都别改。',
    mood: '🥤 甜',
  },
  {
    id: 'l3',
    date: '2025-04-28',
    title: '雨天共撑一把伞',
    content: '雨下得突然，伞不大，你整个人都淋在边上。我说往中间靠靠，你笑「我皮厚」。后来回家你打了个喷嚏，我假装没听见。',
    mood: '🌧️ 心软',
  },
  {
    id: 'l4',
    date: '2025-04-03',
    title: '一起拼好的乐高',
    content: '熬了两个晚上，手指被零件硌出印子。摆上书架那刻，觉得比买来的任何摆件都好看——因为是「我们」拼的。',
    mood: '🧩 成就感',
  },
  {
    id: 'l5',
    date: '2025-03-15',
    title: '你说了一句让我记很久的话',
    content: '「以后不管去哪，只要回头你在，我就敢往前走。」当场没接话，其实在心里点了无数次头。',
    mood: '💌 心动',
  },
  {
    id: 'l6',
    date: '2025-02-20',
    title: '猫又赖在枕头上不肯走',
    content: '三只猫里它最黏你。每次你一躺下它就占位，我只能委屈地缩在边边。行吧，谁让你俩都可爱。',
    mood: '🐱 日常',
  },
]

/* ============================== 关于我们 ============================== */
export const about: AboutContent = {
  title: '关于我们',
  subtitle: '我们的故事，从这里开始书写',
  story:
    '我们相识于微时，在平凡的日子缝隙里慢慢靠近。\n\n' +
    '没有什么轰轰烈烈的开场，只是一句又一句的晚安、一顿又一顿的饭、一场又一场说走就走的散步，' +
    '把「我」走成了「我们」。这个小小的站点，是我们留给彼此的时光胶囊——把走过的路、说过的话、心动的瞬间，都收进来。',
  couple: {
    he: {
      name: '磊磊',
      avatar: '/images/avatars/male.jpg',
      tag: '他 · 把伞总往你那边倾斜的人',
      intro: '喜欢深夜的 city walk，嘴上嫌弃猫却偷偷喂了一整年。负责把日子过成诗，也负责修坏掉的所有东西。',
    },
    she: {
      name: '聪聪',
      avatar: '/images/avatars/female.jpg',
      tag: '她 · 笑起来像夏天的风',
      intro: '会为一片晚霞停下半个小时，记性很差却记得每一个重要的日子。负责制造惊喜，也负责把家变成最舒服的地方。',
    },
  },
  milestones: timeline,
}

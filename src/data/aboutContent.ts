/**
 * 关于我们页内容（数据与视图分离）。
 * 想改文案/头像/纪念日，只动这里，组件零业务文案。
 */

/** 单个人物卡 */
export interface AboutPerson {
  name: string
  avatar: string
  /** 角色标签，如「他 · 把伞往你那边倾斜的人」 */
  tag: string
  intro: string
}

/** 时间轴节点 */
export interface AboutMilestone {
  id: string
  date: string
  title: string
  desc: string
}

export const about = {
  title: '关于我们',
  subtitle: '我们的故事，从这里开始书写',

  /** 两人简介段落（居中衬线展示） */
  story:
    '我们相识于微时，在平凡的日子缝隙里慢慢靠近。\n\n' +
    '没有什么轰轰烈烈的开场，只是一句又一句的晚安、一顿又一顿的饭、一场又一场说走就走的散步，' +
    '把「我」走成了「我们」。这个小小的站点，是我们留给彼此的时光胶囊——把走过的路、说过的话、心动的瞬间，都收进来。',

  /** 两位主角 */
  couple: {
    he: {
      name: 'Ki',
      avatar:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      tag: '他 · 把伞总往你那边倾斜的人',
      intro: '喜欢深夜的city walk，嘴上嫌弃猫却偷偷喂了一整年。负责把日子过成诗，也负责修坏掉的所有东西。',
    },
    she: {
      name: 'Li',
      avatar:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
      tag: '她 · 笑起来像夏天的风',
      intro: '会为一片晚霞停下半个小时，记性很差却记得每一个重要的日子。负责制造惊喜，也负责把家变成最舒服的地方。',
    },
  },

  /** 大事记时间轴（按时间正序） */
  milestones: [
    { id: 'm1', date: '2023.03.14', title: '初见', desc: '在朋友的聚会上认识，谁也没想到后来会是一家人。' },
    { id: 'm2', date: '2023.06.01', title: '在一起', desc: '一个普通的周四，你说了「好」，世界忽然就亮了。' },
    { id: 'm3', date: '2024.02.14', title: '第一个纪念日', desc: '下厨做了三道菜，糊了两道，但那一晚笑得最久。' },
    { id: 'm4', date: '2024.10.01', title: '第一次旅行', desc: '在海边等了一场日落，风很大，手牵得很紧。' },
    { id: 'm5', date: '2025.05.20', title: '我们的小站上线', desc: '把回忆搬进了这个网站，往后每一天都接着写。' },
  ] as AboutMilestone[],
}

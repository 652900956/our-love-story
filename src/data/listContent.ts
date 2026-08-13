/**
 * Love List 页内容（数据与视图分离）。
 * 每条是一个约定 / 想一起做的事。done=true 表示已完成。
 *
 * 注意：页面支持在网页上「新增 / 删除 / 勾选」，这些操作会写入浏览器
 * localStorage（key 见 List.tsx），刷新不丢；清缓存后回落到这里的初始数据。
 * 想改初始清单，只动这里的 items 即可。
 */

export interface ListItem {
  id: string
  title: string
  desc: string
  done: boolean
  /** 完成百分比 0-100，done=true 时展示为 100% */
  progress: number
}

export const list = {
  title: 'Love List',
  subtitle: '属于我们的约定与清单',
  intro: '一张写给未来的清单，每划掉一项，就多一段共同走过的路。',
  items: [
    { id: 't1', title: '一起看一次海上日出', desc: '订好闹钟，四点起床也不准反悔。', done: true, progress: 100 },
    { id: 't2', title: '养一只属于我们的猫', desc: '名字都想好了，等房子再大一点就接它回家。', done: true, progress: 100 },
    { id: 't3', title: '去一次海边城市旅居', desc: '住满一整周，哪也不赶，只吹海风。', done: false, progress: 0 },
    { id: 't4', title: '合拍一组复古胶片照', desc: '找家老照相馆，穿得正式一点，裱起来挂墙上。', done: false, progress: 0 },
    { id: 't5', title: '学会做你最爱的那道菜', desc: '番茄牛腩，炖到软烂，火候要练。', done: false, progress: 0 },
    { id: 't6', title: '存一笔「说走就走」基金', desc: '每个月攒一点，专门用来临时起意的旅行。', done: false, progress: 0 },
  ] as ListItem[],
}

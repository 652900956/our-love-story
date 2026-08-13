/**
 * Love Photo 相册数据（数据与视图分离）。
 * src 当前为占位图（Unsplash），替换为你们的真实照片 URL 即可。
 *
 * 字段说明：
 *  - src    图片 URL
 *  - caption 图片标题（卡片/灯箱显示）
 *  - date   上传时间（灯箱显示在图片下方）
 *  - note   上传时留下的备注（灯箱显示在图片下方，可留空字符串）
 *
 * 数组顺序：第 1 张为最新，越往后越早。"加载更多"会按此顺序逐批放出更早的照片。
 * 替换为真实数据时，请保持「新 → 旧」的顺序。
 */
export interface PhotoItem {
  id: string
  src: string
  caption: string
  date: string
  note: string
}

export const photos: PhotoItem[] = [
  { id: 'p1', src: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=80', caption: '一起看过的风景', date: '2025-05-20 18:32', note: '那天山顶的风很大，但你靠过来的温度刚好。' },
  { id: 'p2', src: 'https://images.unsplash.com/photo-1522098635833-216c03d81fbd?auto=format&fit=crop&w=1200&q=80', caption: '温柔的瞬间', date: '2025-04-11 21:05', note: '你低头笑的时候，世界都安静了。' },
  { id: 'p3', src: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1200&q=80', caption: '海边的约定', date: '2025-03-02 16:48', note: '说好了，每年都要来看一次海。' },
  { id: 'p4', src: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=1200&q=80', caption: '城市的灯火', date: '2025-02-14 22:17', note: '情人节的烟火，记得抬头看。' },
  { id: 'p5', src: 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?auto=format&fit=crop&w=1200&q=80', caption: '旅途中的我们', date: '2025-01-09 10:03', note: '迷路也没关系，反正和你在一起。' },
  { id: 'p6', src: 'https://images.unsplash.com/photo-1474557157379-8e0aa8d5397c?auto=format&fit=crop&w=1200&q=80', caption: '平凡的日子', date: '2024-12-25 20:40', note: '圣诞夜的便利店，热气腾腾的关东煮。' },
  { id: 'p7', src: 'https://images.unsplash.com/photo-1494774157365-9e5cebd44f49?auto=format&fit=crop&w=1200&q=80', caption: '初雪的拥抱', date: '2024-11-30 15:12', note: '第一场雪，你说要堆两个小人。' },
  { id: 'p8', src: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?auto=format&fit=crop&w=1200&q=80', caption: '牵手的午后', date: '2024-10-18 14:25', note: '公园长椅上，阳光刚好落在你发梢。' },
  { id: 'p9', src: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=1200&q=80', caption: '晚风里的笑', date: '2024-09-06 19:50', note: '江边散步，你笑得比灯还亮。' },
  { id: 'p10', src: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?auto=format&fit=crop&w=1200&q=80', caption: '雨后的晴天', date: '2024-08-02 13:33', note: '躲过雨的屋檐，转眼就放晴。' },
  { id: 'p11', src: 'https://images.unsplash.com/photo-1486078695441-503aed781ac4?auto=format&fit=crop&w=1200&q=80', caption: '第一次旅行', date: '2024-07-15 09:18', note: '行李箱里塞满了期待和你的零食。' },
  { id: 'p12', src: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?auto=format&fit=crop&w=1200&q=80', caption: '日落的约定', date: '2024-06-21 18:55', note: '认识的第 30 天，我们看了第一次日落。' },
]

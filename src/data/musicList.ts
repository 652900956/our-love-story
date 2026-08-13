/**
 * ============================================================================
 *  data/musicList.ts —— 背景音乐播放列表（自动扫描式）
 * ----------------------------------------------------------------------------
 *  把 mp3 / ogg / wav / m4a / flac 等音频文件放进 src/assets/music/ 即可，
 *  本模块通过 Vite 的 import.meta.glob 在构建期自动扫描并生成歌单，
 *  无需手动登记。新增歌曲后重新构建（npm run build / dev）即生效。
 *
 *  文件名解析规则：
 *    - 形如「歌手 - 歌名.mp3」（短横两侧有空格）→ 拆成 歌手 / 歌名
 *    - 其它形式（如「晴天-周杰伦.mp3」）→ 整段作为标题，歌手留空
 *  想改显示名，直接在文件夹里把文件改名即可。
 * ============================================================================
 */

export interface Track {
  id: string
  title: string
  artist: string
  /** 封面占位图（为空时播放器显示唱片图标） */
  cover: string
  /** 音频地址（构建后解析为带 hash 的资源 URL） */
  src: string
}

// 构建期扫描 src/assets/music/ 下的音频文件，返回 { 相对路径: 资源URL }
const musicModules = import.meta.glob('../assets/music/*', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

/** 去掉扩展名后的纯文件名 */
function basename(path: string): string {
  const name = path.split('/').pop() ?? path
  return name.replace(/\.[^/.]+$/, '')
}

/** 文件名 → 标题 / 歌手 */
function parseName(filename: string): { title: string; artist: string } {
  // 优先按「歌手 - 歌名」（短横两侧有空格）拆分
  const spaced = filename.split(/\s+-\s+/)
  if (spaced.length >= 2) {
    return { artist: spaced[0].trim(), title: spaced.slice(1).join(' - ').trim() }
  }
  // 退化为整段作为标题
  return { title: filename, artist: '' }
}

/** 自动生成的持久化歌单（随项目构建，多端一致） */
export const MUSIC_LIBRARY: Track[] = Object.entries(musicModules)
  .map(([path, src]) => {
    const raw = basename(path)
    const { title, artist } = parseName(raw)
    return {
      id: `lib-${raw}`,
      title,
      artist,
      cover: '',
      src,
    }
  })
  .sort((a, b) => a.title.localeCompare(b.title, 'zh-Hans-CN'))

/** 兼容旧引用：默认歌单即自动扫描结果 */
export const musicList: Track[] = MUSIC_LIBRARY

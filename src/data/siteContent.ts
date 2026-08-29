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
  { id: 't2', title: '合拍一组复古胶片照', desc: '找家老照相馆，穿得正式一点，裱起来挂墙上。', done: true, progress: 100 },
  { id: 't3', title: '学会做你最爱的那道菜', desc: '番茄牛腩，炖到软烂，火候要练。', done: true, progress: 100 },
  { id: 't4', title: '存一笔「说走就走」基金', desc: '每个月攒一点，专门用来临时起意的旅行。', done: true, progress: 100 },
  { id: 't5', title: '带对方回家见爸妈', desc: '郑重地把你介绍给家里人，让所有人都知道你的存在。', done: true, progress: 100 },
  { id: 't6', title: '一起跨年看烟花', desc: '在零点钟声敲响的那一刻，说一声新年快乐。', done: true, progress: 100 },
  { id: 't7', title: '两个人一起下厨做一顿饭', desc: '一个洗菜一个炒菜，哪怕味道一般，也要好好吃完。', done: true, progress: 100 },
  { id: 't8', title: '陪对方去看喜欢歌手的演唱会', desc: '现场听喜欢的歌，一起跟着大合唱，留下热烈的回忆。', done: false, progress: 0 },
  { id: 't9', title: '体验一次双人手工DIY', desc: '一起做陶艺/拼豆/奶油胶，留下一件两个人共同完成的小物件。', done: false, progress: 1 },
  { id: 't10', title: '一起逛一次夜市吃遍小吃', desc: '手牵手边走边吃，尝尝路边各种烟火气满满的美食。', done: true, progress: 100 },
  { id: 't11', title: '一起通宵看一次电影', desc: '窝在沙发里，准备好夜宵，一口气看完好几部喜欢的片子。', done: true, progress: 100 },
  { id: 't12', title: '布置一个专属的“照片角”', desc: '每次旅行的车票、电影票根、合照都贴上去，看着墙壁慢慢变满。', done: true, progress: 100 },
  { id: 't13', title: '给对方化一次全妆', desc: '无论化成什么鬼样子都不许生气，还要顶着这个妆容合照留念。', done: true, progress: 100 },
  { id: 't14', title: '一起完成一次夜爬', desc: '凌晨出发，在山顶等一场属于我们的日出。', done: true, progress: 100 },
  { id: 't15', title: '给对方做一次早餐', desc: '慵懒的周末早晨，煎蛋和豆浆的香气。', done: true, progress: 100 },
  { id: 't16', title: '一起去一次游乐园', desc: '坐一次摩天轮到最高点，玩到闭园再牵着手回家。', done: false, progress: 11 },
  { id: 't17', title: '一起写一本恋爱日记', desc: '轮流记录每天的碎碎念，等老了以后翻着看。', done: false, progress: 38 },
  { id: 't18', title: '一起搬进我们的小家', desc: '一起挑家具、刷墙、布置每一个角落，把日子过成想要的样子。', done: false, progress: 19 },
  { id: 't19', title: '一起去看一次海', desc: '光脚踩浪、捡贝壳，看夕阳一点点沉进海里。', done: true, progress: 100 },
  { id: 't20', title: '学会一支双人舞', desc: '哪怕一开始很笨拙，也要在客厅里练到转圈不踩脚。', done: false, progress: 0 },
  { id: 't21', title: '每年去一座新城市旅行', desc: '不管远近，只要是我们没一起去过的地方，就算只有周末两天也出发。', done: false, progress: 13 },
]

/* ============================== 照片墙 Love Photo ============================== */
/* 照片墙：把图片放进 public/images/photos/，在下面按文件名添加/修改条目。
   标题、日期、备注可随时在下方替换，不需要改页面代码。 */
export const photos: PhotoItem[] = [
  { id: 'p1', src: '/images/photos/IMG_20260326_213906.jpg', caption: '海边的约定', date: '待填写', note: '' },
  { id: 'p2', src: '/images/photos/IMG_20260327_010315.jpg', caption: '旅途中的我们', date: '待填写', note: '' },
  { id: 'p3', src: '/images/photos/IMG_20260327_010725.jpg', caption: '照片 03', date: '待填写', note: '' },
  { id: 'p4', src: '/images/photos/IMG_20260327_011942.jpg', caption: '照片 04', date: '待填写', note: '' },
  { id: 'p5', src: '/images/photos/IMG20260116180702.jpg', caption: '照片 05', date: '待填写', note: '' },
  { id: 'p6', src: '/images/photos/mmexport1774507457799.jpg', caption: '照片 06', date: '待填写', note: '' },
  { id: 'p7', src: '/images/photos/IMG_20260829_021456.png', caption: '照片 07', date: '待填写', note: '' },
  { id: 'p8', src: '/images/photos/IMG_20260829_021616.png', caption: '照片 08', date: '待填写', note: '' },
  { id: 'p9', src: '/images/photos/IMG_20260829_023556.png', caption: '照片 09', date: '待填写', note: '' },
  { id: 'p10', src: '/images/photos/IMG_20260829_023652.png', caption: '照片 10', date: '待填写', note: '' },
  { id: 'p11', src: '/images/photos/IMG_20260829_023743.png', caption: '照片 11', date: '待填写', note: '' },
  { id: 'p12', src: '/images/photos/IMG_20260829_023844.png', caption: '照片 12', date: '待填写', note: '' },
  { id: 'p13', src: '/images/photos/IMG_20260829_024228.png', caption: '照片 13', date: '待填写', note: '' },
  { id: 'p14', src: '/images/photos/IMG_20260829_024317.png', caption: '照片 14', date: '待填写', note: '' },
]

/* ============================== 留言板 Message ============================== */
/* 留空数组 [] 则显示「还没有留言」。复制示例加一条即可。 */
export const messages: MessageItem[] = [
  { id: 'msg1', name: '阿泽', content: '点进来是被花瓣动画吸引的，逛了一圈。做网页挺费时间吧，我之前学写网页，写两小时就烦了。' },
  { id: 'msg2', name: '游客', content: '刷到的，没啥特别想说的，留一条占个位置，哈哈。' },
  { id: 'msg3', name: '小余', content: '现实里好多感情最后都磨没了，看到这种记录的还挺难得，也不用刻意非要多么轰轰烈烈，安稳就好。' },
  { id: 'msg4', name: '匿名', content: '页面配色挺舒服，就是导航栏字有点小，电脑看还好，手机不知道会不会挤。过来留条言。' },
  { id: 'msg5', name: '一只咸鱼', content: '我对象连朋友圈都懒得发，对比一下，有点感慨。每个人表达爱的方式确实不一样。' },
  { id: 'msg6', name: '路过的人', content: '随便逛 GitHub 看到的项目过来瞅一眼，功能做的还挺齐全，记账本、日历啥的都有，有心了。' },
  { id: 'msg7', name: '柒', content: '没什么祝福，单纯过来灌水留言，帮你填充下空白版面。' },
  { id: 'msg8', name: '匿名', content: '路过打卡。' },
  { id: 'msg9', name: 'W', content: '页面挺好看。' },
]

/* ============================== 关于我们·里程碑时间轴 ============================== */
export const timeline: AboutMilestone[] = [
  { id: 'm1', date: '2024.07.08', title: '驾校初见', desc: '夏日练场偶然相逢，缘分悄悄埋下序章。' },
  { id: 'm2', date: '2024.07.19', title: '缘起线上', desc: '一面之缘之后，对话拉开故事的帷幕。' },
  { id: 'm3', date: '2024.08.17', title: '专属纪念日', desc: '一席闲谈，定下只属于我们的时光刻度。' },
  { id: 'm4', date: '2024.09.21', title: '晚风赴约', desc: '跨越距离相见，爱意本就是双向奔赴。' },
  { id: 'm5', date: '2025.04.05', title: '山水同游', desc: '穿行青山流水，定格属于我们的模样。' },
  { id: 'm6', date: '2025.08.18', title: '一周年岁', desc: '四季流转，一岁圆满，盼岁岁皆相伴。' },
  { id: 'm7', date: '2025.08.25', title: '烟火共处', desc: '方寸小屋，盛放人间细碎温柔。' },
  { id: 'm8', date: '2026.06.09', title: '得偿所愿', desc: '熬过朝暮苦读，终得属于你的星光。' },
  { id: 'm9', date: '2026.08.18', title: '小站落成', desc: '将回忆妥帖收藏，留作往后回望。' },
  { id: 'm10', date: '2026.08.25', title: '故事未完', desc: '过往皆为序章，我们的来日还很长。' },
]

/* ============================== 点点滴滴 ============================== */
export const moments: LittleItem[] = [
  { id: 'mo1', date: '2024-07-08', title: '驾校初次见面，一起练车', content: '驾校练车，我们现实里第一次相见。此时还没有微信，命运先让我们线下相遇。', mood: '🚗初遇' },
  { id: 'mo2', date: '2024-07-19', title: '初次加微信', content: '系统：你已添加了聪聪聪聪，现在可以开始聊天了。线下见过之后，线上的故事正式开启。', mood: '🌸初识' },
  { id: 'mo3', date: '2024-07-21', title: '第一张汉服照片', content: '就先看这一张吧。这是两年记录里第一张照片，也是这个站点第一件珍藏。', mood: '📸记录' },
  { id: 'mo4', date: '2024-08-17', title: '确立纪念日', content: '“媳妇儿让我先把碗刷了”，“以后每年的今天都会是个纪念日”。属于我们时间轴的零点就此诞生。', mood: '💫纪念' },
  { id: 'mo5', date: '2024-08-20', title: '第一次直白表白', content: '我爱你❤️，简单四个字，是最坦诚的心意。', mood: '💌告白' },
  { id: 'mo6', date: '2024-08-25', title: '第一次见面', content: '到家了（刚送完她）。线下相见，打破屏幕的距离。', mood: '✨奔赴' },
  { id: 'mo7', date: '2024-08-28', title: '托付余生，开启异地', content: '往后余生，请吴总多多照顾。甜蜜的同时，异地的考验正式开始。', mood: '🌙期许' },
  { id: 'mo8', date: '2024-09-21', title: '异地后第一次见面', content: '“你别过来，我一会儿骑电车去找你”，双向奔赴从来不是单方面的赶路。', mood: '🚞奔赴' },
  { id: 'mo9', date: '2024-10-11', title: '第一次聊婚礼', content: '准备八抬大轿明媒正娶嘞，玩笑话里藏着认真的憧憬。', mood: '💍憧憬' },
  { id: 'mo10', date: '2024-11-24', title: '第一个生日，跨城相伴', content: '我对你的爱，是个死结。跨越距离，陪她度过这个生日。', mood: '🎂生辰' },
  { id: 'mo11', date: '2024-12-02', title: '说起娶你回家', content: '过两年娶你回家。一句承诺，悄悄放在心里。', mood: '🤍诺言' },
  { id: 'mo12', date: '2024-12-14', title: '云陪考四级', content: '其实我这会儿在你旁边儿呢。人没法到场，但心意一直陪在身旁。', mood: '🤝陪伴' },
  { id: 'mo13', date: '2024-12-27', title: 'AI写歌', content: '好好听，是你用心著作。属于理工男独有的浪漫，从一首歌开始。', mood: '🎶浪漫' },
  { id: 'mo14', date: '2025-01-18', title: '她21岁生日宴', content: '嘴角真的比ak都难压，藏不住的开心。', mood: '🥳欢喜' },
  { id: 'mo15', date: '2025-01-29', title: '年年有我', content: '别人祝你新年快乐，我祝你年年有我。不需要华丽辞藻，只想要岁岁相伴。', mood: '🧨新年' },
  { id: 'mo16', date: '2025-02-10', title: '咱爸锯树娶媳妇', content: '咱爸说锯树卖钱，当娶媳妇用。来自家人朴实又沉甸甸的接纳。', mood: '🏠家人' },
  { id: 'mo17', date: '2025-02-14', title: '第一个情人节', content: '愿以后的每一年都是你。第一个属于我们的情人节。', mood: '🌹情人节' },
  { id: 'mo18', date: '2025-03-06', title: '狂奔6楼', content: '我是从6楼跑下来的。慌乱与紧张，是真切的担心与牵挂。', mood: '💔牵挂' },
  { id: 'mo19', date: '2025-04-05', title: '宝泉，第一次旅行', content: '“我看见你了”，“有你的都是最好看的”。一起出门旅行，拍下我们第一张合影。', mood: '⛰旅行' },
  { id: 'mo20', date: '2025-05-20', title: '第一个双向520', content: '互相转账520，双向的爱意，才最有意义。', mood: '💛520' },
  { id: 'mo21', date: '2025-05-26', title: '第一次复合', content: '行，那我们就好好的爱对方。争吵过后，依旧选择珍惜彼此。', mood: '🌱和解' },
  { id: 'mo22', date: '2025-06-30', title: '异地倒计时开启', content: '考上了九月份跟你一起去武陟。她向我奔赴，异地快要迎来终点。', mood: '⏳期待' },
  { id: 'mo23', date: '2025-08-04', title: '共同体宣言', content: '你现在不是你自己了，是咱们两个啦。爱不再是单人，而是两个人共同体。', mood: '💞我们' },
  { id: 'mo24', date: '2025-08-07', title: '肩并肩背靠背', content: '最后不还是我们两个肩并肩，背靠背……一辈子。面对风雨，我们站在一起。', mood: '🛡相守' },
  { id: 'mo25', date: '2025-08-18', title: '一周年小作文', content: '一周年只是开始，以后的每一年，我都在。第一年圆满落幕，故事继续书写。', mood: '📜周年' },
  { id: 'mo26', date: '2025-08-25', title: '同居第一天', content: '这会做。出租屋里的第一顿饭，开启烟火气的共同生活。', mood: '🍲烟火' },
  { id: 'mo27', date: '2025-10-24', title: '深夜红包雨', content: '臭🐷，生日快乐。请你不要把我弄丢。二十一个红包，满是在意。', mood: '🧧生辰' },
  { id: 'mo28', date: '2025-11-09', title: '约法三章，再次复合', content: '经历分开之后重新选择对方，懂得更加珍惜这份感情。', mood: '🤍复盘' },
  { id: 'mo29', date: '2025-12-13', title: '陪你过第二个生日', content: '今天是我陪你过的第二个生日。一年又一年，我依然在身边。', mood: '🎂生辰' },
  { id: 'mo30', date: '2025-12-31', title: '跨年旅行', content: '怪不容易的，攒了四天的假。要你拉着我 走 出发。跨过旧岁，奔赴新一年。', mood: '🎆跨年' },
  { id: 'mo31', date: '2026-01-17', title: '这是咱俩的家', content: '给你做一辈子饭我都愿意。小小的出租屋，属于我们两个人的小家。', mood: '🏡小家' },
  { id: 'mo32', date: '2026-02-05', title: '久别重逢', content: '你真的回来了。久别相见的那一刻，满心欢喜。', mood: '🥰重逢' },
  { id: 'mo33', date: '2026-02-08', title: '两个最爱的女人的饺子', content: '今年吃上我最爱的两个女人的饺子了。两个家庭慢慢交融。', mood: '🥟团圆' },
  { id: 'mo34', date: '2026-02-14', title: '第二个情人节', content: '你的情人节礼物和生日礼物我都弄好了。用心准备，仪式感不曾缺席。', mood: '🌹情人节' },
  { id: 'mo35', date: '2026-02-21', title: '见姐姐们', content: '咱姐她们已经去了。一步步走进彼此的家庭。', mood: '👨‍👩‍👧家人' },
  { id: 'mo36', date: '2026-03-05', title: '她照顾术后的妈妈', content: '他妈妈刚做完手术……我也在那帮忙。早已把我的家人当成自己家人对待。', mood: '🤍温情' },
  { id: 'mo37', date: '2026-03-21', title: '代码情书', content: '我用代码给你写的情书。代码敲出来的浪漫，专属于我们。', mood: '💻浪漫' },
  { id: 'mo38', date: '2026-03-28', title: '见家长定档', content: '“你确定今年要跟我回家了呀”，“只要是和你一起，天涯海角，我都愿意奔赴”。共同期待见家长。', mood: '🚩约定' },
  { id: 'mo39', date: '2026-06-09', title: '和教体局领证了', content: '和教体局领证了。恭喜拿下教资，属于她的闪闪发光里程碑。', mood: '📜成长' },
  { id: 'mo40', date: '2026-06-25', title: '锁屏13:14', content: '锁屏定格13点14分，一个巧合的瞬间，一生一世的寓意。', mood: '⏰小确幸' },
  { id: 'mo41', date: '2026-07-20', title: '妻爱你', content: '720红包，妻爱你。藏在数字里的爱意。', mood: '💌心意' },
  { id: 'mo42', date: '2026-08-13', title: '桌面宠物七夕礼物', content: '这是我在给你准备七夕礼物，真的好好玩。动手制作，准备专属小惊喜。', mood: '🎁礼物' },
  { id: 'mo43', date: '2026-08-18', title: '爱情网站上线', content: '我做的网站，厉害吧。把我们全部故事打包，搭建这个专属站点。', mood: '🌐站点' },
  { id: 'mo44', date: '2026-08-25', title: 'AI分身', content: '做了一个你的分身。技术浪漫继续，故事未完待续。', mood: '✨未完待续' },
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

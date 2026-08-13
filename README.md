# Lovey · 情侣纪念站（Like_Girl 风格高保真克隆）

基于 **React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion** 复刻的爱心纪念网站。
架构遵循「数据与视图分离 + 全局主题配置」，便于长期自定义维护，并支持可选接入 Supabase 云后端。

---

## 一、快速开始

```bash
# 1. 安装依赖（需 Node 18+）
npm install

# 2. 启动开发服务器
npm run dev
# 打开 http://localhost:5173
```

构建与预览生产版本：

```bash
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 本地预览 dist/
```

---

## 二、目录结构

```
src/
├── config/
│   ├── theme.config.ts     # ★ 全站主题/颜色/圆角/动画/功能开关（改这里即可换肤）
│   └── supabase.ts         # Supabase 客户端（可选接入，未配置则走本地兜底）
├── data/                   # ★ 所有展示内容（文案/照片/列表），与组件分离
│   ├── homeContent.ts      # 首页：导航、Hero、卡片
│   ├── photoList.ts        # 相册照片（src/caption/date/note）
│   ├── aboutContent.ts     # 关于我们
│   ├── littleContent.ts    # 点点滴滴
│   ├── listContent.ts      # Love List
│   └── leavingContent.ts   # 留言板页文案
├── api/
│   ├── photos.ts           # 照片读取（Supabase 优先，本地兜底）
│   └── messages.ts         # 留言读写（Supabase 优先，localStorage 兜底）
├── components/             # 可复用组件（Navbar/Hero/Waves/LoveTimer/...）
├── pages/                  # 页面（Home/LovePhoto/Message/About/Little/List）
├── hooks/                  # 自定义 Hook（如 useLoveTimer）
└── App.tsx                 # 路由 + 全局布局 + 切换动画
```

---

## 三、如何自定义（不改组件代码）

### 1. 改全站主题 → `src/config/theme.config.ts`
所有颜色、字体、圆角、动画时长、功能开关都集中在此并导出 `ThemeConfig` 类型。
组件零硬编码，改这里即可整体换肤：

- `colors.primary` 主色（默认珊瑚色 `#f16b4f`）
- `colors.heart` / `heartDeep` / `heartGlow` 红心配色
- `radius` 各类圆角
- `animation` 各动画时长
- `flags` 功能开关：`enableParticles`(樱花) / `enableLoadingScreen` / `enableWaves` / `enablePjaxBar` / `enableTooltip` / `enableHeartSparkles`
- `heart` 红心呼吸缩放与飘扬点点参数
- `photoPageSize` 相册每批加载数量

### 2. 改内容 → `src/data/`
直接编辑对应数据文件即可，组件会自动渲染，无需动页面代码。

### 3. 加很多照片
两种方式，任选其一：
- **本地模式**：往 `src/data/photoList.ts` 数组追加条目（想放多少放多少，分页自动处理）。
- **云端模式**（推荐多人/大量）：接入 Supabase 后，直接在数据库 `photos` 表增删，前端自动读取。

---

## 四、接入 Supabase 后端（可选，实现真实留言 + 照片云存储）

默认项目**纯前端即可运行**：照片用 `data/photoList.ts`，留言存浏览器 `localStorage`。
若要让「访客真能互相留言、照片可后台管理、数据永久共享」，按以下步骤接入 Supabase（免费额度足够）：

### 步骤 1：注册并建项目
1. 打开 https://supabase.com ，用 GitHub 注册（免费）。
2. 新建一个项目，记下 **Project URL** 与 **anon public key**（Project Settings → API）。

### 步骤 2：建数据表
1. Supabase 后台 → **SQL Editor** → New query。
2. 打开本仓库 `supabase/schema.sql`，全选粘贴，点击 **Run**。
   这会创建 `photos` 与 `messages` 两张表，并开启匿名读写策略。

### 步骤 3：填入密钥
1. 复制仓库里的 `.env.example` 为 `.env`：
   ```bash
   cp .env.example .env
   ```
2. 在 `.env` 填入：
   ```
   VITE_SUPABASE_URL=你的Project URL
   VITE_SUPABASE_ANON_KEY=你的anon key
   ```
3. 重启 `npm run dev`。

> 此后网站自动切换为「云后端模式」：留言写入 `messages` 表（所有人可见、永久保存），
> 照片从 `photos` 表分页读取。未填密钥时仍走本地兜底，不影响预览。

---

## 五、部署
`npm run build` 产出 `dist/`，可部署到任意静态托管（Vercel / Netlify / GitHub Pages / 腾讯云 COS 等）。
若已接入 Supabase，部署时记得在托管平台的环境变量中配置 `VITE_SUPABASE_URL` 与 `VITE_SUPABASE_ANON_KEY`。

---

## 六、技术说明
- 路由：React Router v6 + Framer Motion `AnimatePresence` 实现无刷新切换动画。
- 动效：爱心呼吸缩放、底部波浪视差、卡片错落入场、彩虹计时文字、樱花粒子等，参数均来自 `theme.config`。
- 数据：组件只读 `data/` 与 `api/`，UI 不含业务文案，便于复用与维护。

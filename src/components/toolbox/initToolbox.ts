/* ============================================================================
 * Kirameku 悬浮工具箱 · 逻辑模块（迁移版）
 * ----------------------------------------------------------------------------
 * 本文件由独立单文件 kirameku-toolbox.html 迁移而来，除以下两点适配外，
 * 完整保留原有 35 个工具、弹窗交互逻辑与内部帮助文档：
 *   1) 由 IIFE 改为可挂载 / 可卸载的函数 initToolbox(root)，返回 destroy 清理函数；
 *   2) 定时器与全局监听（document 点击关闭、贪吃蛇键盘监听）登记在模块局部，
 *      卸载时统一清除，避免内存 / 事件泄漏。
 *
 * 其余约定（命名空间、API_PROXY_MODE 开关、apiAdapter 接口适配器、网络接口
 * 注释、纯本地工具）均与原文件一致，便于后期维护。
 * ========================================================================== */

/** 工具箱起始 ===== */

// 通用 DOM 构造工具返回 any，便于兼容 canvas / input / select 等多种元素属性访问
type ElAttrs = Record<string, any>

/**
 * 初始化工具箱。
 * @param root 隔离根容器（由 React 组件动态创建并追加到 body）
 * @returns destroy 清理函数：移除悬浮按钮 / 弹窗、解绑全局事件、清除所有定时器
 */
export function initToolbox(root: HTMLElement): () => void {
  "use strict";

  /* ============================================================
   * 0. 模式开关：API_PROXY_MODE
   *    false = 开发测试模式：直接调用第三方公开 API（本地会有 CORS
   *            跨域报错，仅用于查看逻辑，部分接口如 GitHub / open-meteo
   *            / picsum / hitokoto 本身支持跨域可正常使用）。
   *    true  = 上线部署模式：所有第三方请求转发到自有后端代理
   *            /api/proxy/xxx，由后端解决浏览器跨域问题。
   * ============================================================ */
  const API_PROXY_MODE = false; // ← 上线时改为 true

  // 模块局部定时器登记（世界时间 / 时钟等 setInterval），卸载时统一清除
  const timers: number[] = [];

  /* ============================================================
   * 1. apiAdapter —— 网络接口适配器（集中存放所有接口地址）
   *    业务层不直接写死 URL，统一通过 apiRequest / buildApiUrl 调用。
   *    direct：第三方公开接口（开发模式用）
   *    proxy ：自有后端代理占位地址（上线模式用）
   *    {q} / {lat} / {lon} 等为 URL 占位符，运行时替换。
   * ============================================================ */
  interface ApiEntry {
    desc: string;
    direct: string;
    proxy: string;
  }
  const apiAdapter: Record<string, ApiEntry> = {
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    smartSearch: {
      desc: "智能搜索（DuckDuckGo 即时答案）",
      direct: "https://api.duckduckgo.com/?q={q}&format=json&no_html=1&skip_disambig=1",
      proxy: "/api/proxy/smart-search",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    allHot: {
      desc: "全网热榜聚合",
      direct: "https://api.vvhan.com/api/hotlist/all",
      proxy: "/api/proxy/all-hot",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    biliHot: {
      desc: "B站热榜",
      direct: "https://api.bilibili.com/x/web-interface/ranking/v2",
      proxy: "/api/proxy/bili-hot",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    weatherGeo: {
      desc: "天气-城市地理编码(open-meteo)",
      direct: "https://geocoding-api.open-meteo.com/v1/search?name={q}&count=1&language=zh&format=json",
      proxy: "/api/proxy/weather-geo",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    weatherNow: {
      desc: "天气-实况与预报(open-meteo)",
      direct:
        "https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1",
      proxy: "/api/proxy/weather-now",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    goldPrice: {
      desc: "今日金价",
      direct: "https://api.pearktrue.cn/api/gold/",
      proxy: "/api/proxy/gold-price",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    boxOffice: {
      desc: "实时票房",
      direct: "https://api.pearktrue.cn/api/boxoffice/",
      proxy: "/api/proxy/box-office",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    githubUser: {
      desc: "GitHub 用户信息",
      direct: "https://api.github.com/users/{q}",
      proxy: "/api/proxy/github-user",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    githubRepo: {
      desc: "GitHub 仓库信息",
      direct: "https://api.github.com/repos/{q}",
      proxy: "/api/proxy/github-repo",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    programmerHistory: {
      desc: "程序员历史（历史上的今天·技术向）",
      direct: "https://api.pearktrue.cn/api/todayhistory/",
      proxy: "/api/proxy/programmer-history",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    todayHistory: {
      desc: "历史今天",
      direct: "https://api.oick.cn/lishi/api.php",
      proxy: "/api/proxy/today-history",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    horoscope: {
      desc: "星座运势",
      direct: "https://api.pearktrue.cn/api/astro/?astro={q}",
      proxy: "/api/proxy/horoscope",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    guanyin: {
      desc: "观音灵签",
      direct: "https://api.pearktrue.cn/api/guanyin/",
      proxy: "/api/proxy/guanyin",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    hitokoto: {
      desc: "一言",
      direct: "https://v1.hitokoto.cn/",
      proxy: "/api/proxy/hitokoto",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    djtw: {
      desc: "毒鸡汤",
      direct: "https://api.pearktrue.cn/api/djtw/",
      proxy: "/api/proxy/djtw",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    randomImg: {
      desc: "随机图片(picsum)",
      direct: "https://picsum.photos/seed/{q}/600/400",
      proxy: "/api/proxy/random-img",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    genshinImg: {
      desc: "原神图片",
      direct: "https://api.pearktrue.cn/api/genshin/",
      proxy: "/api/proxy/genshin-img",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    k4Img: {
      desc: "4K图片",
      direct: "https://api.pearktrue.cn/api/4kpic/",
      proxy: "/api/proxy/4k-img",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    express: {
      desc: "快递查询",
      direct: "https://api.pearktrue.cn/api/kuaidi/?number={q}",
      proxy: "/api/proxy/express",
    },
    /*【后期部署服务器后，后端需要实现这个代理接口】*/
    phoneLoc: {
      desc: "手机归属地",
      direct: "https://api.pearktrue.cn/api/phone/?phone={q}",
      proxy: "/api/proxy/phone-loc",
    },
  };

  /* ------------------------------------------------------------
   * 1.1 由接口名构造最终请求 URL（不直接在业务里拼 URL）
   * ---------------------------------------------------------- */
  function buildApiUrl(name: string, params?: Record<string, any>): string {
    params = params || {};
    const cfg = apiAdapter[name];
    if (!cfg) throw new Error("未配置的接口：" + name);
    let url = API_PROXY_MODE ? cfg.proxy : cfg.direct;
    for (const k in params) {
      url = url.replace("{" + k + "}", encodeURIComponent(params[k]));
    }
    if (API_PROXY_MODE) {
      // 上线模式：占位符已替换为空，统一用 query 把参数透传给后端代理
      const qs = new URLSearchParams(params).toString();
      if (qs) url += (url.indexOf("?") >= 0 ? "&" : "?") + qs;
    }
    return url;
  }

  /* ------------------------------------------------------------
   * 1.2 统一的网络请求封装（业务层只调用它）
   * ---------------------------------------------------------- */
  async function apiRequest(name: string, params?: Record<string, any>, opts?: RequestInit): Promise<any> {
    const url = buildApiUrl(name, params);
    const res = await fetch(url, Object.assign({ method: "GET" }, opts || {}));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const ct = res.headers.get("content-type") || "";
    return ct.indexOf("application/json") >= 0 ? res.json() : res.text();
  }

  /* ============================================================
   * 2. 通用 DOM 构造工具（全部 JS 动态生成，不硬写大段 HTML）
   * ============================================================ */
  function el(tag: string, attrs?: ElAttrs | null, ...children: any[]): any {
    const e = document.createElement(tag);
    attrs = attrs || {};
    for (const k in attrs) {
      const v = attrs[k];
      if (k === "class") e.className = v;
      else if (k === "html") e.innerHTML = v;
      else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
      else if (k.indexOf("on") === 0 && typeof v === "function")
        e.addEventListener(k.slice(2).toLowerCase(), v);
      // 跳过 null / undefined / false 属性值，避免误设布尔属性（如 checked="null"）
      else if (v === null || v === undefined || v === false) { /* noop */ }
      else e.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null || c === false) continue;
      e.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    }
    return e;
  }

  // 状态辅助
  function loadingEl(text?: string): any {
    return el("div", { class: "kirameku-toolbox-loading" }, text || "加载中…");
  }
  function errorEl(msg?: string): any {
    return el("div", { class: "kirameku-toolbox-error" }, msg || "接口请求失败，请检查网络或后端代理服务");
  }
  function emptyEl(msg?: string): any {
    return el("div", { class: "kirameku-toolbox-empty" }, msg || "暂无数据");
  }

  /* ============================================================
   * 3. 本地工具函数（纯计算，不依赖网络，不受 API_PROXY_MODE 影响）
   * ============================================================ */

  // 3.1 随机工具
  function randInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 3.2 BMI 计算
  function calcBMI(h: number, w: number): { bmi: string; cat: string } {
    const bmi = w / Math.pow(h / 100, 2);
    let cat: string;
    if (bmi < 18.5) cat = "偏瘦";
    else if (bmi < 24) cat = "正常";
    else if (bmi < 28) cat = "偏胖";
    else cat = "肥胖";
    return { bmi: bmi.toFixed(1), cat };
  }

  // 3.3 单位换算（以各分类基准单位系数为 1）
  const UNIT_TABLE: Record<string, Record<string, number> | null> = {
    长度: { 米: 1, 千米: 1000, 厘米: 0.01, 毫米: 0.001, 英里: 1609.34, 英尺: 0.3048, 英寸: 0.0254 },
    重量: { 千克: 1, 克: 0.001, 毫克: 1e-6, 吨: 1000, 磅: 0.4536, 盎司: 0.02835 },
    温度: null, // 特殊处理
    面积: { 平方米: 1, 平方千米: 1e6, 公顷: 1e4, 亩: 666.67, 平方英尺: 0.0929, 英亩: 4046.86 },
    数据: { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 },
    时间: { 秒: 1, 分: 60, 时: 3600, 天: 86400, 周: 604800 },
    速度: { "米/秒": 1, "千米/时": 0.2778, "英里/时": 0.447, "节": 0.5144 },
  };
  function convertUnit(cat: string, from: string, to: string, val: number): number {
    if (cat === "温度") {
      let c: number;
      if (from === "℃") c = val;
      else if (from === "℉") c = (val - 32) / 1.8;
      else c = val - 273.15; // K
      if (to === "℃") return c;
      if (to === "℉") return c * 1.8 + 32;
      return c + 273.15;
    }
    const t = UNIT_TABLE[cat];
    if (!t) return 0;
    const base = val * t[from];
    return base / t[to];
  }

  // 3.4 进制转换
  function baseConvert(numStr: string, from: number, to: number): string {
    const dec = parseInt(numStr, from);
    if (isNaN(dec)) throw new Error("输入无效");
    return dec.toString(to).toUpperCase();
  }

  // 3.5 密码生成
  function genPassword(len: number, opt: Record<string, boolean>): string {
    const sets = {
      lower: "abcdefghijklmnopqrstuvwxyz",
      upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
      number: "0123456789",
      symbol: "!@#$%^&*()-_=+[]{};:,.<>?",
    };
    let pool = "";
    const ensure: string[] = [];
    (["lower", "upper", "number", "symbol"] as const).forEach((k) => {
      if (opt[k]) {
        pool += sets[k];
        ensure.push(sets[k][randInt(0, sets[k].length - 1)]);
      }
    });
    if (!pool) return "";
    let out = ensure.join("");
    while (out.length < len) out += pool[randInt(0, pool.length - 1)];
    // 打乱
    out = out.split("").sort(() => Math.random() - 0.5).join("");
    return out;
  }

  // 3.6 世界时间（基于浏览器时区数据库，离线可用）
  const TZ_LIST = [
    { name: "北京时间", tz: "Asia/Shanghai" },
    { name: "东京", tz: "Asia/Tokyo" },
    { name: "伦敦", tz: "Europe/London" },
    { name: "纽约", tz: "America/New_York" },
    { name: "洛杉矶", tz: "America/Los_Angeles" },
    { name: "莫斯科", tz: "Europe/Moscow" },
    { name: "巴黎", tz: "Europe/Paris" },
    { name: "悉尼", tz: "Australia/Sydney" },
  ];
  function fmtTZ(tz: string): string {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        timeZone: tz, hour12: false,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        weekday: "short",
      }).format(new Date());
    } catch (e) { return "—"; }
  }

  // 3.7 天气代码转文字
  function wxCodeText(code: number): string {
    const m: Record<number, string> = {
      0: "晴", 1: "大致晴朗", 2: "局部多云", 3: "阴",
      45: "雾", 48: "雾凇", 51: "小毛毛雨", 53: "毛毛雨", 55: "大毛毛雨",
      61: "小雨", 63: "中雨", 65: "大雨", 71: "小雪", 73: "中雪", 75: "大雪",
      80: "阵雨", 81: "强阵雨", 82: "暴阵雨", 85: "阵雪", 86: "强阵雪",
      95: "雷雨", 96: "雷雨伴冰雹", 99: "强雷雨伴冰雹",
    };
    return m[code] || "未知";
  }

  /* ============================================================
   * 4. 工具元数据配置表 + 渲染逻辑
   *    type: 'network'（依赖 apiAdapter）| 'local'（纯本地）
   *    netKeys: 依赖的接口名（用于说明文档自动罗列）
   * ============================================================ */

  // ---- 本地：智能搜索（dev 模式走 DuckDuckGo，prod 走代理）----
  function renderSmartSearch(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "输入关键词，回车搜索…" });
    const box = el("div", { class: "kirameku-toolbox-list" });
    const wrap = el("div", null,
      el("div", { class: "kirameku-toolbox-row" }, input),
      box
    );
    async function doSearch() {
      const q = input.value.trim();
      if (!q) return;
      box.innerHTML = "";
      box.appendChild(loadingEl());
      try {
        const data = await apiRequest("smartSearch", { q });
        box.innerHTML = "";
        if (data && (data.AbstractText || data.Heading)) {
          box.appendChild(el("div", { class: "kirameku-toolbox-card" },
            el("div", { style: { fontWeight: "600", marginBottom: "4px" } }, data.Heading || ""),
            el("div", null, data.AbstractText || "")
          ));
        }
        if (data && Array.isArray(data.RelatedTopics) && data.RelatedTopics.length) {
          const ul = el("ul", { class: "kirameku-toolbox-list" });
          data.RelatedTopics.slice(0, 12).forEach((t: any) => {
            if (t.Text) ul.appendChild(el("li", null, t.Text));
          });
          box.appendChild(ul);
        }
        if (!box.children.length) box.appendChild(emptyEl("未找到相关结果"));
      } catch (e) {
        box.innerHTML = "";
        box.appendChild(errorEl());
      }
    }
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") doSearch(); });
    body.appendChild(wrap);
  }

  // ---- 网络：全网热榜 ----
  function renderAllHot(body: any) {
    body.appendChild(loadingEl());
    apiRequest("allHot").then((data: any) => {
      body.innerHTML = "";
      const list = el("ul", { class: "kirameku-toolbox-list" });
      let items: any[] = [];
      if (data && Array.isArray(data.data)) items = data.data;
      else if (Array.isArray(data)) items = data;
      if (!items.length) { body.appendChild(emptyEl("暂无热榜数据")); return; }
      items.slice(0, 30).forEach((it: any) => {
        const title = it.title || it.name || it.hot || "";
        const heat = it.hot || it.heat || "";
        list.appendChild(el("li", null, title, heat ? el("span", { class: "kirameku-toolbox-heat" }, "🔥" + heat) : null));
      });
      body.appendChild(list);
    }).catch(() => { body.innerHTML = ""; body.appendChild(errorEl()); });
  }

  // ---- 网络：B站热榜 ----
  function renderBiliHot(body: any) {
    body.appendChild(loadingEl());
    apiRequest("biliHot").then((data: any) => {
      body.innerHTML = "";
      const arr = (data && data.data && data.data.list) || [];
      if (!arr.length) { body.appendChild(emptyEl("暂无数据")); return; }
      const list = el("ul", { class: "kirameku-toolbox-list" });
      arr.slice(0, 30).forEach((it: any, i: number) => {
        list.appendChild(el("li", null,
          (i + 1) + ". " + (it.title || ""),
          it.score ? el("span", { class: "kirameku-toolbox-heat" }, "🔥" + it.score) : null
        ));
      });
      body.appendChild(list);
    }).catch(() => { body.innerHTML = ""; body.appendChild(errorEl()); });
  }

  // ---- 网络：天气 ----
  function renderWeather(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "输入城市，如：北京 / 上海" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    async function query() {
      const city = input.value.trim();
      if (!city) return;
      box.innerHTML = "";
      box.appendChild(loadingEl());
      try {
        const geo = await apiRequest("weatherGeo", { q: city });
        const loc = geo && geo.results && geo.results[0];
        if (!loc) throw new Error("城市未找到");
        const wx = await apiRequest("weatherNow", { lat: loc.latitude, lon: loc.longitude });
        box.innerHTML = "";
        const cur = wx.current;
        const day = wx.daily;
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          el("div", { style: { fontWeight: "600", marginBottom: "6px" } }, "📍 " + loc.name + (loc.country ? "（" + loc.country + "）" : "")),
          el("div", null, "当前：" + wxCodeText(cur.weather_code) + " " + cur.temperature_2m + "℃"),
          el("div", { class: "kirameku-toolbox-muted" }, "湿度 " + cur.relative_humidity_2m + "% · 风速 " + cur.wind_speed_10m + " km/h"),
          el("div", { class: "kirameku-toolbox-muted" }, "今日 " + day.temperature_2m_min[0] + "℃ ~ " + day.temperature_2m_max[0] + "℃")
        ));
      } catch (e) {
        box.innerHTML = "";
        box.appendChild(errorEl());
      }
    }
    btn.addEventListener("click", query);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") query(); });
  }

  // ---- 网络：今日金价 ----
  function renderGold(body: any) {
    body.appendChild(loadingEl());
    apiRequest("goldPrice").then((data: any) => {
      body.innerHTML = "";
      const list = el("ul", { class: "kirameku-toolbox-list" });
      const rows = (data && (data.data || data.list || data)) || [];
      const arr = Array.isArray(rows) ? rows : Object.entries(rows).map(([k, v]) => ({ name: k, price: v }));
      if (!arr.length) { body.appendChild(emptyEl("暂无金价数据")); return; }
      arr.slice(0, 20).forEach((it: any) => {
        list.appendChild(el("li", null, (it.name || "") + "：" + (it.price ?? it.value ?? "")));
      });
      body.appendChild(list);
    }).catch(() => { body.innerHTML = ""; body.appendChild(errorEl()); });
  }

  // ---- 网络：实时票房 ----
  function renderBoxOffice(body: any) {
    body.appendChild(loadingEl());
    apiRequest("boxOffice").then((data: any) => {
      body.innerHTML = "";
      const arr = (data && (data.data || data.list || data)) || [];
      const list = el("ul", { class: "kirameku-toolbox-list" });
      if (!Array.isArray(arr) || !arr.length) { body.appendChild(emptyEl("暂无票房数据")); return; }
      arr.slice(0, 20).forEach((it: any, i: number) => {
        list.appendChild(el("li", null,
          (i + 1) + ". " + (it.name || it.title || ""),
          (it.boxOffice || it.box_office || it.price) ? el("span", { class: "kirameku-toolbox-heat" }, "💰" + (it.boxOffice || it.box_office || it.price)) : null
        ));
      });
      body.appendChild(list);
    }).catch(() => { body.innerHTML = ""; body.appendChild(errorEl()); });
  }

  // ---- 网络：GitHub 用户 ----
  function renderGithubUser(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "GitHub 用户名，如：torvalds" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    async function query() {
      const u = input.value.trim();
      if (!u) return;
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("githubUser", { q: u });
        box.innerHTML = "";
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          d.avatar_url ? el("img", { class: "kirameku-toolbox-avatar", src: d.avatar_url, alt: "" }) : null,
          el("div", { style: { fontWeight: "600" } }, d.name || d.login),
          el("div", { class: "kirameku-toolbox-muted" }, "@" + d.login),
          el("div", null, d.bio || ""),
          el("div", { class: "kirameku-toolbox-muted" }, "👥 " + d.followers + " 关注者 · 📦 " + d.public_repos + " 仓库"),
          el("div", { class: "kirameku-toolbox-clear" })
        ));
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", query);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") query(); });
  }

  // ---- 网络：GitHub 仓库 ----
  function renderGithubRepo(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "owner/repo，如：facebook/react" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    async function query() {
      const r = input.value.trim();
      if (!r) return;
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("githubRepo", { q: r });
        box.innerHTML = "";
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          el("div", { style: { fontWeight: "600" } }, d.full_name),
          el("div", { class: "kirameku-toolbox-muted" }, d.language || ""),
          el("div", null, d.description || ""),
          el("div", { class: "kirameku-toolbox-muted" }, "⭐ " + d.stargazers_count + " · 🍴 " + d.forks_count + " · ⚠️ " + d.open_issues_count)
        ));
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", query);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") query(); });
  }

  // ---- 网络：程序员历史 / 历史今天 ----
  function makeHistoryRender(apiName: string, emptyText: string) {
    return function (body: any) {
      body.appendChild(loadingEl());
      apiRequest(apiName).then((data: any) => {
        body.innerHTML = "";
        let arr: any[] = [];
        if (Array.isArray(data)) arr = data;
        else if (data && Array.isArray(data.data)) arr = data.data;
        else if (data && Array.isArray(data.list)) arr = data.list;
        else if (data && data.result) arr = Array.isArray(data.result) ? data.result : [data.result];
        if (!arr.length) { body.appendChild(emptyEl(emptyText)); return; }
        const list = el("ul", { class: "kirameku-toolbox-list" });
        arr.slice(0, 30).forEach((it: any) => {
          const t = it.title || it.event || it.des || it.text || JSON.stringify(it);
          const y = it.year || it.date || "";
          list.appendChild(el("li", null, y ? el("b", null, y + "　") : null, t));
        });
        body.appendChild(list);
      }).catch(() => { body.innerHTML = ""; body.appendChild(errorEl()); });
    };
  }

  // ---- 网络：星座运势 ----
  function renderHoroscope(body: any) {
    const sel = el("select", { class: "kirameku-toolbox-select" },
      ...["白羊座","金牛座","双子座","巨蟹座","狮子座","处女座","天秤座","天蝎座","射手座","摩羯座","水瓶座","双鱼座"]
        .map((s) => el("option", { value: s }, s))
    );
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, sel, btn));
    body.appendChild(box);
    async function query() {
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("horoscope", { q: sel.value });
        box.innerHTML = "";
        const o = (d && (d.data || d)) || {};
        const card = el("div", { class: "kirameku-toolbox-card" }, el("div", { style: { fontWeight: "600", marginBottom: "6px" } }, "🔮 " + sel.value + " 今日运势"));
        ["综合","爱情","事业","财富","健康"].forEach((k) => {
          if (o[k] != null) card.appendChild(el("div", null, k + "：" + o[k]));
        });
        if (!card.children.length) card.appendChild(el("div", null, JSON.stringify(o)));
        box.appendChild(card);
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", query);
  }

  // ---- 网络：观音灵签 ----
  function renderGuanyin(body: any) {
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "求一签");
    const box = el("div", null);
    body.appendChild(btn);
    body.appendChild(box);
    btn.addEventListener("click", async () => {
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("guanyin");
        box.innerHTML = "";
        const o = (d && (d.data || d)) || {};
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          el("div", { style: { fontWeight: "600" } }, "第 " + (o.num || o.id || "") + " 签 · " + (o.name || "")),
          el("div", null, "签文：" + (o.qian || o.text || "")),
          el("div", { class: "kirameku-toolbox-muted" }, "解曰：" + (o.jie || o.desc || ""))
        ));
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    });
  }

  // ---- 网络：一言 ----
  function renderHitokoto(body: any) {
    const box = el("div", { class: "kirameku-toolbox-card" });
    const btn = el("button", { class: "kirameku-toolbox-btn kirameku-toolbox-ghost", style: { marginTop: "10px" } }, "换一句");
    async function load() {
      box.innerHTML = "加载中…";
      try {
        const d = await apiRequest("hitokoto");
        box.innerHTML = "";
        box.appendChild(el("div", { style: { fontSize: "15px", lineHeight: "1.7" } }, "“" + d.hitokoto + "”"));
        if (d.from) box.appendChild(el("div", { class: "kirameku-toolbox-muted", style: { marginTop: "6px" } }, "—— " + d.from)); // 仅展示出处文字，不跳转
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", load);
    body.appendChild(box);
    body.appendChild(btn);
    load();
  }

  // ---- 网络：毒鸡汤 ----
  function renderDjtw(body: any) {
    const box = el("div", { class: "kirameku-toolbox-card" });
    const btn = el("button", { class: "kirameku-toolbox-btn kirameku-toolbox-ghost", style: { marginTop: "10px" } }, "再来一碗");
    async function load() {
      box.innerHTML = "加载中…";
      try {
        const d = await apiRequest("djtw");
        const text = (d && (d.data || d.text || d.content || d)) || "";
        box.innerHTML = "";
        box.appendChild(el("div", { style: { fontSize: "14px", lineHeight: "1.7" } }, typeof text === "string" ? text : JSON.stringify(text)));
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", load);
    body.appendChild(box);
    body.appendChild(btn);
    load();
  }

  // ---- 网络：图片类（随机 / 原神 / 4K）----
  function makeImageRender(apiName: string, seedBase: string) {
    return function (body: any) {
      const btn = el("button", { class: "kirameku-toolbox-btn" }, "换一张");
      const imgWrap = el("div", null);
      function load() {
        imgWrap.innerHTML = "";
        const seed = seedBase + randInt(1, 99999);
        const url = buildApiUrl(apiName, { q: seed });
        const img = el("img", { class: "kirameku-toolbox-img", src: url, alt: "图片加载失败" });
        img.addEventListener("error", () => {
          imgWrap.innerHTML = "";
          imgWrap.appendChild(errorEl("图片加载失败，开发模式下该接口可能跨域或需后端代理"));
        });
        imgWrap.appendChild(img);
      }
      btn.addEventListener("click", load);
      body.appendChild(btn);
      body.appendChild(imgWrap);
      load();
    };
  }

  // ---- 网络：快递查询 ----
  function renderExpress(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "输入快递单号" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    async function query() {
      const n = input.value.trim();
      if (!n) return;
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("express", { q: n });
        box.innerHTML = "";
        const o = (d && (d.data || d)) || {};
        const steps = o.list || o.data || o.steps || [];
        if (o.com || o.company) box.appendChild(el("div", { class: "kirameku-toolbox-muted" }, "承运：" + (o.com || o.company)));
        if (Array.isArray(steps) && steps.length) {
          const list = el("ul", { class: "kirameku-toolbox-list" });
          steps.slice(0, 20).forEach((s: any) => {
            const t = s.time || s.ftime || "";
            const c = s.status || s.context || s.desc || "";
            list.appendChild(el("li", null, el("span", { class: "kirameku-toolbox-muted" }, t + "　"), c));
          });
          box.appendChild(list);
        } else {
          box.appendChild(emptyEl("暂无物流轨迹"));
        }
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", query);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") query(); });
  }

  // ---- 网络：手机归属地 ----
  function renderPhoneLoc(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "输入手机号前 7 位或完整号码" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "查询");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    async function query() {
      const p = input.value.trim();
      if (!p) return;
      box.innerHTML = ""; box.appendChild(loadingEl());
      try {
        const d = await apiRequest("phoneLoc", { q: p });
        box.innerHTML = "";
        const o = (d && (d.data || d)) || {};
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          el("div", null, "省份：" + (o.province || o.pro || "—")),
          el("div", null, "城市：" + (o.city || "—")),
          el("div", null, "运营商：" + (o.company || o.carrier || o.sp || "—")),
          el("div", null, "区号：" + (o.areacode || o.zip || "—"))
        ));
      } catch (e) { box.innerHTML = ""; box.appendChild(errorEl()); }
    }
    btn.addEventListener("click", query);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") query(); });
  }

  // ===================== 纯本地工具 =====================

  // 小游戏：贪吃蛇（注册清理函数，切换工具 / 关闭弹窗 / 卸载时移除全局键盘监听并停止计时）
  function renderSnake(body: any) {
    const canvas = el("canvas", { class: "kirameku-toolbox-snake-canvas", width: 300, height: 300 });
    const tip = el("div", { class: "kirameku-toolbox-snake-tip" }, "方向键 / WASD 控制，点击画布开始");
    const restart = el("button", { class: "kirameku-toolbox-btn kirameku-toolbox-ghost", style: { marginTop: "6px" } }, "重新开始");
    body.appendChild(canvas);
    body.appendChild(tip);
    body.appendChild(restart);
    const ctx = canvas.getContext("2d");
    const SIZE = 15, CELLS = 20;
    let snake: any, dir: any, food: any, timer: any, running = false, score = 0;
    function reset() {
      snake = [{ x: 10, y: 10 }];
      dir = { x: 1, y: 0 };
      food = { x: randInt(0, 19), y: randInt(0, 19) };
      score = 0; tip.textContent = "方向键 / WASD 控制，点击画布开始";
      draw();
    }
    function draw() {
      ctx.fillStyle = "#1e1e2e"; ctx.fillRect(0, 0, 300, 300);
      ctx.fillStyle = "#ff6b6b"; ctx.fillRect(food.x * SIZE, food.y * SIZE, SIZE, SIZE);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#f16b4f";
      snake.forEach((s: any) => ctx.fillRect(s.x * SIZE, s.y * SIZE, SIZE, SIZE));
      tip.textContent = "得分：" + score;
    }
    function step() {
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
      if (head.x < 0 || head.y < 0 || head.x >= CELLS || head.y >= CELLS || snake.some((s: any) => s.x === head.x && s.y === head.y)) {
        clearInterval(timer); running = false; tip.textContent = "游戏结束，得分：" + score; return;
      }
      snake.unshift(head);
      if (head.x === food.x && head.y === food.y) {
        score++; food = { x: randInt(0, 19), y: randInt(0, 19) };
      } else snake.pop();
      draw();
    }
    function start() {
      if (running) return;
      running = true; timer = setInterval(step, 120);
    }
    function onKey(e: any) {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "w") dir = { x: 0, y: -1 };
      else if (k === "arrowdown" || k === "s") dir = { x: 0, y: 1 };
      else if (k === "arrowleft" || k === "a") dir = { x: -1, y: 0 };
      else if (k === "arrowright" || k === "d") dir = { x: 1, y: 0 };
      start();
    }
    canvas.addEventListener("click", start);
    document.addEventListener("keydown", onKey);
    restart.addEventListener("click", () => { if (timer) clearInterval(timer); reset(); });
    reset();
    // 登记当前工具的清理函数（由 openTool / closePopup / destroy 调用）
    activeToolCleanup = () => {
      if (timer) clearInterval(timer);
      document.removeEventListener("keydown", onKey);
    };
  }

  // BMI
  function renderBMI(body: any) {
    const h = el("input", { class: "kirameku-toolbox-input", type: "number", placeholder: "身高 cm" });
    const w = el("input", { class: "kirameku-toolbox-input", type: "number", placeholder: "体重 kg" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "计算");
    const box = el("div", null);
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, h, w));
    body.appendChild(btn);
    body.appendChild(box);
    btn.addEventListener("click", () => {
      const hh = parseFloat(h.value), ww = parseFloat(w.value);
      if (!hh || !ww) { box.innerHTML = ""; box.appendChild(errorEl("请输入有效的身高体重")); return; }
      const r = calcBMI(hh, ww);
      box.innerHTML = "";
      box.appendChild(el("div", { class: "kirameku-toolbox-card" },
        el("div", { style: { fontSize: "22px", fontWeight: "700" } }, "BMI " + r.bmi),
        el("div", null, "分类：" + r.cat)
      ));
    });
  }

  // 驾考题库（本地示例题库，离线可用）
  const DRIVE_Q = [
    { q: "机动车在道路上发生故障，难以移动时，应当开启危险报警闪光灯并在车后多远设置警告标志？", a: ["50米", "100米", "150米以外", "200米"], c: 2 },
    { q: "驾驶机动车在高速公路上行驶，最低车速不得低于每小时多少公里？", a: ["50", "60", "70", "80"], c: 1 },
    { q: "同车道行驶的机动车，后车应当与前车保持足以采取紧急制动措施的安全距离。此说法：", a: ["正确", "错误"], c: 0 },
    { q: "饮酒后驾驶机动车的，处暂扣多长时间驾驶证，并处多少元罚款？", a: ["1个月，200元", "6个月，1000-2000元", "3个月，500元", "1年，2000元"], c: 1 },
    { q: "黄灯持续闪烁时表示：", a: ["禁止通行", "提示行人快速通过", "路口警示，注意瞭望慢行", "绿灯即将亮起"], c: 2 },
    { q: "机动车驾驶人初次申领驾驶证后的实习期是：", a: ["6个月", "12个月", "18个月", "24个月"], c: 1 },
    { q: "在交叉路口遇到停车信号时，车辆应停在：", a: ["路口内", "停止线以外", "人行横道上", "随意"], c: 1 },
    { q: "小型客车在高速公路最高车速不得超过每小时多少公里？", a: ["100", "110", "120", "130"], c: 2 },
    { q: "夜间会车应当在距相对方向来车多少米以外改用近光灯？", a: ["50", "100", "150", "200"], c: 2 },
    { q: "驾驶拼装的机动车上道路行驶的，公安机关交通管理部门应当：", a: ["拘留驾驶人", "予以收缴，强制报废", "罚款后放行", "扣3分"], c: 1 },
  ];
  function renderDrive(body: any) {
    let idx = 0, correct = 0;
    const box = el("div", null);
    function show() {
      box.innerHTML = "";
      if (idx >= DRIVE_Q.length) {
        box.appendChild(el("div", { class: "kirameku-toolbox-card" },
          el("div", { style: { fontWeight: "600" } }, "练习完成！"),
          el("div", null, "答对 " + correct + " / " + DRIVE_Q.length)
        ));
        box.appendChild(el("button", { class: "kirameku-toolbox-btn kirameku-toolbox-ghost", style: { marginTop: "8px" }, onclick: () => { idx = 0; correct = 0; show(); } }, "重新练习"));
        return;
      }
      const item = DRIVE_Q[idx];
      box.appendChild(el("div", { style: { fontWeight: "600", marginBottom: "8px" } }, "第 " + (idx + 1) + " 题：" + item.q));
      item.a.forEach((opt: string, i: number) => {
        box.appendChild(el("button", {
          class: "kirameku-toolbox-btn kirameku-toolbox-ghost",
          style: { display: "block", width: "100%", marginBottom: "6px", textAlign: "left" },
          onclick: () => {
            if (i === item.c) correct++;
            idx++;
            show();
          },
        }, (i + 1) + ". " + opt));
      });
    }
    body.appendChild(box);
    show();
  }

  // 抽签
  const LOTS = ["上上签：诸事顺遂，心想事成。", "上签：谋望可成，渐入佳境。", "中签：平稳中求进，守正得安。", "下签：宜守不宜攻，静待时机。", "上上签：贵人相助，鸿运当头。", "中上签：小有波折，终见光明。", "下下签：谨慎行事，避其锋芒。", "上签：春风得意，万事可期。"];
  function renderDraw(body: any) {
    const box = el("div", { class: "kirameku-toolbox-card", style: { textAlign: "center", minHeight: "60px" } }, "点击下方按钮求签");
    const btn = el("button", { class: "kirameku-toolbox-btn", style: { marginTop: "10px" } }, "求签");
    btn.addEventListener("click", () => {
      box.innerHTML = "🎴 " + LOTS[randInt(0, LOTS.length - 1)];
    });
    body.appendChild(box);
    body.appendChild(btn);
  }

  // 骰子
  function renderDice(body: any) {
    const face = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];
    const disp = el("div", { style: { fontSize: "64px", textAlign: "center", margin: "10px 0" } }, "🎲");
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "掷骰子");
    btn.addEventListener("click", () => {
      const n = randInt(1, 6);
      disp.textContent = face[n - 1] + "  " + n + " 点";
    });
    body.appendChild(disp);
    body.appendChild(btn);
  }

  // 硬币
  function renderCoin(body: any) {
    const disp = el("div", { style: { fontSize: "28px", textAlign: "center", margin: "10px 0" } }, "🪙");
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "抛硬币");
    btn.addEventListener("click", () => {
      disp.textContent = randInt(0, 1) ? "正面 ✅" : "反面 ❌";
    });
    body.appendChild(disp);
    body.appendChild(btn);
  }

  // 猜拳
  function renderRPS(body: any) {
    const opts = [["✊", "石头"], ["✋", "剪刀"], ["✌️", "布"]];
    const disp = el("div", { style: { textAlign: "center", margin: "10px 0", fontSize: "15px" } }, "选一个出拳：");
    const row = el("div", { class: "kirameku-toolbox-row" });
    opts.forEach((o, i) => {
      row.appendChild(el("button", { class: "kirameku-toolbox-btn kirameku-toolbox-ghost", onclick: () => play(i) }, o[0] + " " + o[1]));
    });
    body.appendChild(disp);
    body.appendChild(row);
    function play(me: number) {
      const cpu = randInt(0, 2);
      let res: string;
      if (me === cpu) res = "平局";
      else if ((me === 0 && cpu === 1) || (me === 1 && cpu === 2) || (me === 2 && cpu === 0)) res = "你赢了 🎉";
      else res = "你输了 😢";
      disp.innerHTML = "你：" + opts[me][0] + " ｜ 电脑：" + opts[cpu][0] + "<br><b>" + res + "</b>";
    }
  }

  // 二维码生成（依赖 CDN 库 qrcode-generator，无 API 请求）
  function renderQRCode(body: any) {
    const input = el("input", { class: "kirameku-toolbox-input", placeholder: "输入要生成二维码的内容 / 链接" });
    const btn = el("button", { class: "kirameku-toolbox-btn" }, "生成");
    const box = el("div", { class: "kirameku-toolbox-qr" });
    body.appendChild(el("div", { class: "kirameku-toolbox-row" }, input, btn));
    body.appendChild(box);
    function gen() {
      const text = input.value.trim();
      if (!text) return;
      box.innerHTML = "生成中…";
      if (typeof (window as any).qrcode === "undefined") {
        // 动态加载 CDN 库（仅需网络加载一次，无 API 代理需求）
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js";
        s.onload = () => make();
        s.onerror = () => { box.innerHTML = ""; box.appendChild(errorEl("二维码库加载失败，请联网后重试")); };
        document.head.appendChild(s);
        return;
      }
      make();
    }
    function make() {
      try {
        const qr = (window as any).qrcode(0, "M");
        qr.addData(input.value.trim());
        qr.make();
        box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 2 });
      } catch (e: any) { box.innerHTML = ""; box.appendChild(errorEl("生成失败：" + e.message)); }
    }
    btn.addEventListener("click", gen);
    input.addEventListener("keydown", (e: any) => { if (e.key === "Enter") gen(); });
  }

  // 密码生成器
  function renderPassGen(body: any) {
    const len = el("input", { class: "kirameku-toolbox-input", type: "number", value: "16" });
    const mk = (id: string, label: string, checked: boolean) => el("label", { style: { display: "inline-flex", alignItems: "center", gap: "4px", marginRight: "10px", fontSize: "12px" } },
      el("input", { type: "checkbox", id: id, checked: checked ? "checked" : null }), label);
    const optLower = mk("ol", "小写", true);
    const optUpper = mk("ou", "大写", true);
    const optNum = mk("on", "数字", true);
    const optSym = mk("os", "符号", false);
    const out = el("input", { class: "kirameku-toolbox-input", readonly: "readonly", style: { marginTop: "8px" } });
    const btn = el("button", { class: "kirameku-toolbox-btn", style: { marginTop: "8px" } }, "生成密码");
    btn.addEventListener("click", () => {
      const p = genPassword(parseInt(len.value) || 16, {
        lower: optLower.querySelector("input").checked,
        upper: optUpper.querySelector("input").checked,
        number: optNum.querySelector("input").checked,
        symbol: optSym.querySelector("input").checked,
      });
      out.value = p || "请至少选择一种字符类型";
    });
    body.appendChild(el("div", null, el("span", { class: "kirameku-toolbox-label" }, "长度"), len));
    body.appendChild(el("div", { style: { margin: "8px 0" } }, optLower, optUpper, optNum, optSym));
    body.appendChild(btn);
    body.appendChild(out);
  }

  // 记事本（localStorage）
  function renderNotepad(body: any) {
    const KEY = "kirameku_toolbox_notepad";
    const ta = el("textarea", { class: "kirameku-toolbox-input", style: { height: "180px", resize: "vertical", marginTop: "6px" }, placeholder: "随手记点什么…" });
    ta.value = localStorage.getItem(KEY) || "";
    const save = el("button", { class: "kirameku-toolbox-btn", style: { marginTop: "8px" } }, "保存");
    save.addEventListener("click", () => { localStorage.setItem(KEY, ta.value); save.textContent = "已保存 ✓"; setTimeout(() => (save.textContent = "保存"), 1200); });
    body.appendChild(ta);
    body.appendChild(save);
  }

  // 单位换算
  function renderUnit(body: any) {
    const cats = Object.keys(UNIT_TABLE);
    const catSel = el("select", { class: "kirameku-toolbox-select" }, ...cats.map((c) => el("option", { value: c }, c)));
    const unitFrom = el("select", { class: "kirameku-toolbox-select" });
    const unitTo = el("select", { class: "kirameku-toolbox-select" });
    const val = el("input", { class: "kirameku-toolbox-input", type: "number", value: "1" });
    const out = el("div", { class: "kirameku-toolbox-card", style: { marginTop: "8px" } }, "结果：—");
    function fillUnits() {
      const units = catSel.value === "温度" ? ["℃", "℉", "K"] : Object.keys(UNIT_TABLE[catSel.value] as Record<string, number>);
      unitFrom.innerHTML = ""; unitTo.innerHTML = "";
      units.forEach((u) => { unitFrom.appendChild(el("option", { value: u }, u)); unitTo.appendChild(el("option", { value: u }, u)); });
      if (units[1]) unitTo.selectedIndex = 1;
      calc();
    }
    function calc() {
      const v = parseFloat(val.value);
      if (isNaN(v)) { out.textContent = "结果：—"; return; }
      try {
        const r = convertUnit(catSel.value, unitFrom.value, unitTo.value, v);
        out.textContent = "结果：" + r + " " + unitTo.value;
      } catch (e) { out.textContent = "转换失败"; }
    }
    catSel.addEventListener("change", fillUnits);
    [unitFrom, unitTo, val].forEach((x) => x.addEventListener("input", calc));
    body.appendChild(el("div", { class: "kirameku-toolbox-label" }, "类别"));
    body.appendChild(catSel);
    body.appendChild(el("div", { class: "kirameku-toolbox-row", style: { marginTop: "8px" } }, unitFrom, unitTo));
    body.appendChild(el("div", { class: "kirameku-toolbox-label" }, "数值"));
    body.appendChild(val);
    body.appendChild(out);
    fillUnits();
  }

  // 进制转换
  function renderBase(body: any) {
    const val = el("input", { class: "kirameku-toolbox-input", placeholder: "输入的数为…" });
    const from = el("select", { class: "kirameku-toolbox-select" }, ...[2, 8, 10, 16].map((b) => el("option", { value: b }, b + "进制")));
    const to = el("select", { class: "kirameku-toolbox-select" }, ...[2, 8, 10, 16].map((b) => el("option", { value: b }, b + "进制")));
    from.value = "10"; to.value = "2";
    const out = el("div", { class: "kirameku-toolbox-card", style: { marginTop: "8px", wordBreak: "break-all" } }, "结果：—");
    function calc() {
      try { out.textContent = "结果：" + baseConvert(val.value.trim(), parseInt(from.value), parseInt(to.value)); }
      catch (e) { out.textContent = "结果：输入无效"; }
    }
    [val, from, to].forEach((x) => x.addEventListener("input", calc));
    body.appendChild(el("div", { class: "kirameku-toolbox-label" }, "原始数值"));
    body.appendChild(val);
    body.appendChild(el("div", { class: "kirameku-toolbox-row", style: { marginTop: "8px" } }, from, to));
    body.appendChild(out);
    calc();
  }

  // 计算器
  function renderCalc(body: any) {
    const disp = el("div", { class: "kirameku-toolbox-calc-display" }, "0");
    let expr = "";
    const keys = ["7","8","9","/","4","5","6","*","1","2","3","-","0",".","=","+","C","⌫"];
    const grid = el("div", { class: "kirameku-toolbox-calc-grid" });
    function update() { disp.textContent = expr || "0"; }
    keys.forEach((k) => {
      grid.appendChild(el("button", { onclick: () => {
        if (k === "C") expr = "";
        else if (k === "⌫") expr = expr.slice(0, -1);
        else if (k === "=") {
          try {
            if (!/^[0-9+\-*/.() ]+$/.test(expr)) throw new Error("非法");
            expr = String(Function('"use strict";return (' + expr + ")")());
          } catch (e) { expr = "错误"; }
        } else expr += k;
        update();
      } }, k));
    });
    body.appendChild(disp);
    body.appendChild(grid);
  }

  // 日历
  function renderCalendar(body: any) {
    const head = el("div", { style: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" } });
    const prev = el("button", { class: "kirameku-toolbox-iconbtn", style: { background: "rgba(241,107,79,0.16)", color: "var(--primary)" } }, "‹");
    const title = el("span", { style: { fontWeight: "600" } });
    const next = el("button", { class: "kirameku-toolbox-iconbtn", style: { background: "rgba(241,107,79,0.16)", color: "var(--primary)" } }, "›");
    head.appendChild(prev); head.appendChild(title); head.appendChild(next);
    const grid = el("div", { class: "kirameku-toolbox-cal-grid" });
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    function render() {
      title.textContent = y + " 年 " + (m + 1) + " 月";
      grid.innerHTML = "";
      ["日","一","二","三","四","五","六"].forEach((d) => grid.appendChild(el("div", { class: "kirameku-toolbox-cal-cell kirameku-toolbox-cal-head" }, d)));
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const todayStr = now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate();
      for (let i = 0; i < first; i++) grid.appendChild(el("div", { class: "kirameku-toolbox-cal-cell kirameku-toolbox-cal-other" }, ""));
      for (let d = 1; d <= days; d++) {
        const cls = "kirameku-toolbox-cal-cell" + (todayStr === y + "-" + (m + 1) + "-" + d ? " kirameku-toolbox-cal-today" : "");
        grid.appendChild(el("div", { class: cls }, String(d)));
      }
    }
    prev.addEventListener("click", () => { m--; if (m < 0) { m = 11; y--; } render(); });
    next.addEventListener("click", () => { m++; if (m > 11) { m = 0; y++; } render(); });
    body.appendChild(head);
    body.appendChild(grid);
    render();
  }

  // 世界时间
  function renderWorldTime(body: any) {
    const list = el("div", null);
    body.appendChild(list);
    function tick() {
      list.innerHTML = "";
      TZ_LIST.forEach((t) => {
        list.appendChild(el("div", { class: "kirameku-toolbox-tz-row" }, el("span", null, t.name), el("span", null, fmtTZ(t.tz))));
      });
    }
    tick();
    const timer = setInterval(tick, 1000);
    timers.push(timer); // 登记定时器，卸载时统一清除
  }

  // 时钟
  function renderClock(body: any) {
    const big = el("div", { class: "kirameku-toolbox-clock-big" }, "--:--:--");
    const date = el("div", { class: "kirameku-toolbox-muted", style: { textAlign: "center", marginTop: "6px" } }, "");
    body.appendChild(big);
    body.appendChild(date);
    function tick() {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      big.textContent = p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());
      date.textContent = d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + ["日","一","二","三","四","五","六"][d.getDay()];
    }
    tick();
    const timer = setInterval(tick, 1000);
    timers.push(timer); // 登记定时器，卸载时统一清除
  }

  // ---- 工具元数据配置表（共 35 个工具，完整保留）----
  const TOOLS = [
    { id: "smartSearch", name: "智能搜索", icon: "🔍", type: "network", net: ["smartSearch"], render: renderSmartSearch },
    { id: "allHot", name: "全网热榜", icon: "🔥", type: "network", net: ["allHot"], render: renderAllHot },
    { id: "biliHot", name: "B站热榜", icon: "📺", type: "network", net: ["biliHot"], render: renderBiliHot },
    { id: "game", name: "小游戏", icon: "🎮", type: "local", net: [], render: renderSnake },
    { id: "weather", name: "天气", icon: "🌤️", type: "network", net: ["weatherGeo", "weatherNow"], render: renderWeather },
    { id: "gold", name: "今日金价", icon: "🪙", type: "network", net: ["goldPrice"], render: renderGold },
    { id: "boxOffice", name: "实时票房", icon: "🎬", type: "network", net: ["boxOffice"], render: renderBoxOffice },
    { id: "ghUser", name: "GitHub用户", icon: "🐙", type: "network", net: ["githubUser"], render: renderGithubUser },
    { id: "ghRepo", name: "GitHub仓库", icon: "📦", type: "network", net: ["githubRepo"], render: renderGithubRepo },
    { id: "progHistory", name: "程序员历史", icon: "💻", type: "network", net: ["programmerHistory"], render: makeHistoryRender("programmerHistory", "暂无程序员历史") },
    { id: "todayHistory", name: "历史今天", icon: "📜", type: "network", net: ["todayHistory"], render: makeHistoryRender("todayHistory", "暂无历史事件") },
    { id: "horoscope", name: "星座运势", icon: "✨", type: "network", net: ["horoscope"], render: renderHoroscope },
    { id: "guanyin", name: "观音灵签", icon: "🙏", type: "network", net: ["guanyin"], render: renderGuanyin },
    { id: "bmi", name: "BMI", icon: "⚖️", type: "local", net: [], render: renderBMI },
    { id: "drive", name: "驾考题库", icon: "🚗", type: "local", net: [], render: renderDrive },
    { id: "randomImg", name: "随机图片", icon: "🖼️", type: "network", net: ["randomImg"], render: makeImageRender("randomImg", "kira") },
    { id: "genshin", name: "原神图片", icon: "⚔️", type: "network", net: ["genshinImg"], render: makeImageRender("genshinImg", "genshin") },
    { id: "k4", name: "4K图片", icon: "🌄", type: "network", net: ["k4Img"], render: makeImageRender("k4Img", "wall4k") },
    { id: "draw", name: "抽签", icon: "🎴", type: "local", net: [], render: renderDraw },
    { id: "hitokoto", name: "一言", icon: "💬", type: "network", net: ["hitokoto"], render: renderHitokoto },
    { id: "djtw", name: "毒鸡汤", icon: "🥤", type: "network", net: ["djtw"], render: renderDjtw },
    { id: "dice", name: "骰子", icon: "🎲", type: "local", net: [], render: renderDice },
    { id: "coin", name: "硬币", icon: "🪙", type: "local", net: [], render: renderCoin },
    { id: "rps", name: "猜拳", icon: "✊", type: "local", net: [], render: renderRPS },
    { id: "qr", name: "二维码生成", icon: "🔳", type: "local", net: [], render: renderQRCode },
    { id: "pass", name: "密码生成器", icon: "🔐", type: "local", net: [], render: renderPassGen },
    { id: "notepad", name: "记事本", icon: "📝", type: "local", net: [], render: renderNotepad },
    { id: "unit", name: "单位换算", icon: "📐", type: "local", net: [], render: renderUnit },
    { id: "base", name: "进制转换", icon: "🔢", type: "local", net: [], render: renderBase },
    { id: "calc", name: "计算器", icon: "🧮", type: "local", net: [], render: renderCalc },
    { id: "calendar", name: "日历", icon: "📅", type: "local", net: [], render: renderCalendar },
    { id: "express", name: "快递查询", icon: "🚚", type: "network", net: ["express"], render: renderExpress },
    { id: "phone", name: "手机归属地", icon: "📱", type: "network", net: ["phoneLoc"], render: renderPhoneLoc },
    { id: "worldTime", name: "世界时间", icon: "🌐", type: "local", net: [], render: renderWorldTime },
    { id: "clock", name: "时钟", icon: "⏰", type: "local", net: [], render: renderClock },
  ];

  /* ============================================================
   * 5. 悬浮按钮 DOM + 弹窗容器 + 事件监听
   * ============================================================ */
  let isOpen = false;
  // 当前工具的清理函数（切换工具 / 关闭弹窗时调用，避免全局监听与定时器泄漏）
  let activeToolCleanup: (() => void) | null = null;

  const fab = el("button", { class: "kirameku-toolbox-fab", title: "工具箱", "aria-label": "打开工具箱" }, "🧰");
  const popup = el("div", { class: "kirameku-toolbox-popup" });
  const header = el("div", { class: "kirameku-toolbox-header" },
    el("span", { class: "kirameku-toolbox-title" }, "🧰 工具箱"),
    el("div", { class: "kirameku-toolbox-header-actions" },
      el("button", { class: "kirameku-toolbox-iconbtn", title: "使用说明", onclick: showDocs }, "ℹ"),
      el("button", { class: "kirameku-toolbox-iconbtn", title: "关闭", onclick: closePopup }, "×")
    )
  );
  const view = el("div", { class: "kirameku-toolbox-view" });
  popup.appendChild(header);
  popup.appendChild(view);
  root.appendChild(fab);
  root.appendChild(popup);

  /* —— 悬浮按钮可拖动（默认左下角，位置持久化到 localStorage） —— */
  let suppressClick = false; // 拖动结束后抑制误触的 click（避免开/关弹窗）
  const POS_KEY = "kirameku-toolbox-fab-pos";
  try {
    const saved = JSON.parse(localStorage.getItem(POS_KEY) || "null");
    if (saved && typeof saved.left === "number" && typeof saved.top === "number") {
      fab.style.left = saved.left + "px";
      fab.style.top = saved.top + "px";
      fab.style.right = "auto";
      fab.style.bottom = "auto";
    }
  } catch (e) { /* 忽略损坏的存储 */ }

  let dragStartX = 0, dragStartY = 0, fabStartLeft = 0, fabStartTop = 0, dragging = false, moved = false;
  const DRAG_THRESHOLD = 4;
  const onFabPointerDown = (e: any) => {
    suppressClick = false; // 防止上一次拖动的残留标记误吞下一次点击
    if (e.button !== 0) return; // 仅响应左键
    const rect = fab.getBoundingClientRect();
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    fabStartLeft = rect.left;
    fabStartTop = rect.top;
    dragging = true;
    moved = false;
    try { fab.setPointerCapture(e.pointerId); } catch (_) {}
    e.stopPropagation();
  };
  const onFabPointerMove = (e: any) => {
    if (!dragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (!moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return; // 小于阈值视为点击
    moved = true;
    const w = fab.offsetWidth, h = fab.offsetHeight;
    let left = Math.max(4, Math.min(window.innerWidth - w - 4, fabStartLeft + dx));
    let top = Math.max(4, Math.min(window.innerHeight - h - 4, fabStartTop + dy));
    fab.style.left = left + "px";
    fab.style.top = top + "px";
    fab.style.right = "auto";
    fab.style.bottom = "auto";
  };
  const onFabPointerUp = (e: any) => {
    if (!dragging) return;
    dragging = false;
    try { fab.releasePointerCapture(e.pointerId); } catch (_) {}
    if (moved) {
      // 拖动结束：保存位置，并抑制随后的 click（避免误触开/关弹窗）
      try {
        localStorage.setItem(POS_KEY, JSON.stringify({ left: parseFloat(fab.style.left), top: parseFloat(fab.style.top) }));
      } catch (_) {}
      suppressClick = true;
    }
  };
  fab.addEventListener("pointerdown", onFabPointerDown);
  fab.addEventListener("pointermove", onFabPointerMove);
  fab.addEventListener("pointerup", onFabPointerUp);
  fab.addEventListener("pointercancel", onFabPointerUp);

  function renderHome() {
    view.innerHTML = "";
    const grid = el("div", { class: "kirameku-toolbox-grid" });
    TOOLS.forEach((t) => {
      grid.appendChild(el("button", { class: "kirameku-toolbox-item", onclick: () => openTool(t) },
        el("div", { class: "kirameku-toolbox-item-icon" }, t.icon),
        el("div", { class: "kirameku-toolbox-item-name" }, t.name)
      ));
    });
    view.appendChild(grid);
  }

  function openTool(t: any) {
    // 切换到新工具前，先清理上一个工具（如贪吃蛇的键盘监听 / 计时器）
    if (activeToolCleanup) { try { activeToolCleanup(); } catch (e) {} activeToolCleanup = null; }
    view.innerHTML = "";
    const panel = el("div", { class: "kirameku-toolbox-panel" });
    panel.appendChild(el("div", { class: "kirameku-toolbox-panel-head" },
      el("button", { class: "kirameku-toolbox-back", onclick: renderHome }, "← 返回"),
      el("span", { class: "kirameku-toolbox-panel-title" }, t.icon + " " + t.name)
    ));
    const pbody = el("div", { class: "kirameku-toolbox-panel-body" });
    panel.appendChild(pbody);
    view.appendChild(panel);
    try { t.render(pbody); }
    catch (err: any) { pbody.innerHTML = ""; pbody.appendChild(errorEl("工具初始化失败：" + err.message)); }
  }

  function openPopup() {
    isOpen = true;
    // 弹窗跟随悬浮按钮位置：显示在按钮正上方，按钮被拖动后弹窗随之移动
    const r = fab.getBoundingClientRect();
    const pw = popup.offsetWidth || 360;
    const ph = popup.offsetHeight || 480;
    let left = Math.max(8, Math.min(window.innerWidth - pw - 8, r.left));
    let top = r.top - ph - 16;
    if (top < 8) top = 8;
    popup.style.left = left + "px";
    popup.style.top = top + "px";
    popup.style.right = "auto";
    popup.style.bottom = "auto";
    popup.classList.add("kirameku-toolbox-show");
    fab.classList.add("kirameku-toolbox-open");
    if (view.children.length === 0) renderHome();
  }
  function closePopup() {
    isOpen = false;
    popup.classList.remove("kirameku-toolbox-show");
    fab.classList.remove("kirameku-toolbox-open");
    view.innerHTML = "";
    // 关闭弹窗时也清理当前工具的全局监听 / 定时器
    if (activeToolCleanup) { try { activeToolCleanup(); } catch (e) {} activeToolCleanup = null; }
  }
  function togglePopup() { isOpen ? closePopup() : openPopup(); }

  // 悬浮按钮点击：切换弹窗（拖动结束后 suppressClick 为 true，本次 click 不触发切换）
  fab.addEventListener("click", (e: any) => {
    e.stopPropagation();
    if (suppressClick) { suppressClick = false; return; }
    togglePopup();
  });
  // 弹窗内部点击不关闭
  popup.addEventListener("click", (e: any) => e.stopPropagation());
  // 点击弹窗外部区域关闭弹窗
  const onDocClick = (e: any) => {
    if (isOpen && e.target !== fab && !fab.contains(e.target) && !popup.contains(e.target)) closePopup();
  };
  document.addEventListener("click", onDocClick);

  /* ============================================================
   * 6. 使用说明文档（嵌入弹窗内，覆盖四项要求）
   * ============================================================ */
  function buildDocsHTML() {
    // ② 纯本地工具清单
    const localTools = TOOLS.filter((t) => t.net.length === 0).map((t) => "<li>" + t.icon + " " + t.name + "</li>").join("");
    // ② 依赖 API（需后端代理）的接口清单，从 apiAdapter 自动生成
    let netRows = "";
    Object.keys(apiAdapter).forEach((k) => {
      const c = apiAdapter[k];
      netRows += "<tr><td><code>" + k + "</code></td><td>" + c.desc + "</td><td><code>" + c.direct + "</code></td><td><code>" + c.proxy + "</code></td></tr>";
    });

    return (
      '<div class="kirameku-toolbox-docs">' +
      "<h3>① 如何把工具箱嵌入已有网页</h3>" +
      "<p>两种方式任选其一：</p>" +
      "<p><b>方式 A（推荐，最简单）：</b>把本文件另存为 <code>kirameku-toolbox.html</code>，在宿主页面任意位置插入：</p>" +
      '<pre>&lt;script src="kirameku-toolbox.html"&gt;&lt;/script&gt;</pre>' +
      "<p>注意：若以 <code>.html</code> 作为脚本引入不被浏览器执行，请改用方式 B——将本文件内的 <code>&lt;style&gt;</code> 与 <code>&lt;script&gt;</code> 内容分别拷入宿主页的 <code>&lt;head&gt;</code> 与 <code>&lt;body&gt;</code> 末尾，并保留 <code>&lt;div id=\"kirameku-toolbox-root\"&gt;&lt;/div&gt;</code>。</p>" +
      "<p>所有 class 均以 <code>kirameku-toolbox-</code> 前缀，<code>z-index:9999</code>，不会与宿主页 CSS 冲突。</p>" +

      "<h3>② 纯本地运行 vs 依赖 API（需后端代理）</h3>" +
      "<p><b>纯本地工具（不依赖网络，本地双击即可用）：</b></p>" +
      '<ul class="kirameku-toolbox-list" style="list-style:disc;padding-left:18px">' + localTools + "</ul>" +
      "<p class=\"kirameku-toolbox-muted\">注：二维码生成依赖 CDN 库 qrcode-generator（仅需联网加载一次，无后端代理需求）；驾考题库为内置示例题库。</p>" +
      "<p><b>依赖网络 API 的工具（上线必须部署后端代理）：</b></p>" +
      '<table><thead><tr><th>接口名</th><th>用途</th><th>第三方直连地址(direct)</th><th>后端代理占位(proxy)</th></tr></thead><tbody>' +
      netRows +
      "</tbody></table>" +

      "<h3>③ API_PROXY_MODE 开关如何切换开发 / 上线模式</h3>" +
      "<p>文件顶部常量：</p>" +
      '<pre>const API_PROXY_MODE = false; // 开发测试模式（默认）\n// const API_PROXY_MODE = true;  // 上线部署模式</pre>' +
      "<p><b>false（开发测试）：</b>所有请求直接调用 <code>apiAdapter</code> 中的 <code>direct</code> 第三方地址，用于查看逻辑与调试；本地浏览器会因 CORS 出现跨域报错属正常现象。</p>" +
      "<p><b>true（上线部署）：</b>所有请求转发到 <code>proxy</code> 占位地址（如 <code>/api/proxy/github-user</code>），由你自己的后端代理转发第三方接口，彻底解决跨域。</p>" +

      "<h3>④ 本地打开会跨域的提示</h3>" +
      "<p>⚠️ 直接双击本 HTML 打开时，<b>网络类工具</b>（热榜 / 天气 / 金价 / GitHub / 灵签 等）会因浏览器同源策略出现 CORS 跨域报错，仅用于查看交互逻辑。其中 GitHub、open-meteo、picsum、一言 等接口本身支持跨域，可正常返回。</p>" +
      "<p>✅ <b>必须</b>将本组件部署到你的服务器（或与后端同域），并：</p>" +
      "<p>1) 实现 <code>apiAdapter</code> 中标注 <code>/*【后期部署服务器后，后端需要实现这个代理接口】*/</code> 的全部代理接口；</p>" +
      "<p>2) 将 <code>API_PROXY_MODE</code> 置为 <code>true</code>；</p>" +
      "<p>3) 确保前端请求路径 <code>/api/proxy/xxx</code> 被正确代理到对应第三方接口。</p>" +
      "<p>此后所有网络类工具即可线上正常使用，纯本地工具则始终不受此限制。</p>" +
      "</div>"
    );
  }

  function showDocs() {
    view.innerHTML = "";
    const panel = el("div", { class: "kirameku-toolbox-panel" });
    panel.appendChild(el("div", { class: "kirameku-toolbox-panel-head" },
      el("button", { class: "kirameku-toolbox-back", onclick: renderHome }, "← 返回"),
      el("span", { class: "kirameku-toolbox-panel-title" }, "ℹ 使用说明")
    ));
    const pbody = el("div", { class: "kirameku-toolbox-panel-body" });
    pbody.innerHTML = buildDocsHTML();
    panel.appendChild(pbody);
    view.appendChild(panel);
  }

  // 初始渲染主页（不自动打开）
  renderHome();

  /* ============================================================
   * 7. 卸载清理：移除悬浮按钮 / 弹窗、解绑全局事件、清除所有定时器
   * ============================================================ */
  function destroy() {
    document.removeEventListener("click", onDocClick);
    timers.forEach((t) => clearInterval(t));
    timers.length = 0;
    if (activeToolCleanup) { try { activeToolCleanup(); } catch (e) {} activeToolCleanup = null; }
    fab.remove();
    popup.remove();
  }

  return destroy;
}

/** 工具箱结束 ===== */

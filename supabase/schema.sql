-- ============================================================================
--  Love Photo / 留言板 / 记账本 / 待办 / 日历 / 点点滴滴 / Love List 全量建表
-- ----------------------------------------------------------------------------
--  用法：登录 Supabase 后台 → 左侧 SQL Editor → 新建查询 → 粘贴本文件 → Run。
--  执行后网站即拥有 8 张表，配合 .env 的密钥即可多人共享 + 实时同步。
--
--  安全说明：本项目采用「共享家庭口令」模式（见 App 的 PasscodeGate），
--  前端只持有 anon key，因此下方对所有表开放 anon 的读写删权限。
--  若日后需要更严格的控制（按用户隔离），可在后台 Policies 收紧。
-- ============================================================================

-- 1) 照片表：存储相册（id 自增、created_at 用于「最新在前」排序）
create table if not exists public.photos (
  id          bigint generated always as identity primary key,
  src         text        not null,                       -- 图片 URL
  caption     text        default '',                    -- 图片标题
  date        text        default '',                    -- 上传时间（展示用字符串）
  note        text        default '',                    -- 上传时备注
  created_at  timestamptz default now()                  -- 创建时间
);

-- 2) 留言表：存储留言板（name/content/created_at）
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  name        text        default '匿名',                -- 留言人
  content     text        not null,                      -- 留言内容
  created_at  timestamptz default now()                  -- 创建时间
);

-- 3) 待办表：日历待办（归属 mine/hers/shared）
create table if not exists public.todos (
  id          bigint generated always as identity primary key,
  category    text        not null default 'mine',       -- mine / hers / shared
  date        text        not null default '',           -- 关联日期 YYYY-MM-DD
  content     text        not null default '',           -- 待办内容
  priority    text        not null default 'normal',     -- urgent / normal
  done        boolean     not null default false,        -- 是否完成
  created_at  timestamptz default now()
);

-- 4) 日历备注表：以日期为唯一键
create table if not exists public.calendar_remarks (
  date        text primary key,                           -- YYYY-MM-DD（唯一键）
  remark      text        default '',
  created_at  timestamptz default now()
);

-- 5) 记账表：情侣记账本
create table if not exists public.ledger (
  id          bigint generated always as identity primary key,
  date        text        not null default '',           -- 发生日期 YYYY-MM-DD
  type        text        not null default 'expense',    -- deposit / expense
  ownership   text        not null default 'shared',     -- mine / hers / shared
  amount      numeric     not null default 0,            -- 金额（正数，单位元）
  category    text        default '其他',                -- 消费分类 / 存款来源
  remark      text        default '',                    -- 备注
  created_at  timestamptz default now()
);

-- 6) 预算表：单行配置（id 固定为 1）
create table if not exists public.budget (
  id          int primary key default 1,
  amount      numeric     not null default 0,            -- 月度预算（元）
  updated_at  timestamptz default now()
);
insert into public.budget (id, amount) values (1, 0) on conflict (id) do nothing;

-- 7) 点点滴滴表：碎碎念 / 日记
create table if not exists public.little_items (
  id          text primary key,                          -- 前端生成 UUID / l-时间戳
  date        text        not null default '',
  title       text        not null default '',
  content     text        not null default '',
  mood        text        default '',                    -- 心情标签
  created_at  timestamptz default now()
);

-- 8) Love List 表：恋爱清单 / 约定
create table if not exists public.list_items (
  id          text primary key,                          -- 前端生成 t-时间戳
  title       text        not null default '',
  description text        default '',                    -- 补充说明
  done        boolean     not null default false,
  created_at  timestamptz default now()
);

-- ============================================================================
--  开启匿名（anon）只读/写入/删除权限（开发演示用，生产可按需收紧）
-- ============================================================================
alter table public.photos            enable row level security;
alter table public.messages          enable row level security;
alter table public.todos             enable row level security;
alter table public.calendar_remarks  enable row level security;
alter table public.ledger            enable row level security;
alter table public.budget            enable row level security;
alter table public.little_items      enable row level security;
alter table public.list_items        enable row level security;

-- 统一清理旧策略后重建（幂等）
drop policy if exists "photos_all"    on public.photos;
drop policy if exists "messages_all"  on public.messages;
drop policy if exists "todos_all"     on public.todos;
drop policy if exists "remarks_all"   on public.calendar_remarks;
drop policy if exists "ledger_all"    on public.ledger;
drop policy if exists "budget_all"    on public.budget;
drop policy if exists "little_all"    on public.little_items;
drop policy if exists "list_all"      on public.list_items;

create policy "photos_all"    on public.photos            for all using (true) with check (true);
create policy "messages_all"  on public.messages          for all using (true) with check (true);
create policy "todos_all"     on public.todos             for all using (true) with check (true);
create policy "remarks_all"   on public.calendar_remarks  for all using (true) with check (true);
create policy "ledger_all"    on public.ledger            for all using (true) with check (true);
create policy "budget_all"    on public.budget            for all using (true) with check (true);
create policy "little_all"    on public.little_items      for all using (true) with check (true);
create policy "list_all"      on public.list_items        for all using (true) with check (true);

-- ============================================================================
--  开启 Realtime（实时同步，多设备秒级可见）
--  用 DO 块做幂等判断，重复执行不会报错。
-- ============================================================================
do $$
declare
  t text;
begin
  foreach t in array array[
    'photos', 'messages', 'todos', 'calendar_remarks',
    'ledger', 'budget', 'little_items', 'list_items'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

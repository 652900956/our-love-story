-- ============================================================================
--  2026-08-13 功能增强迁移脚本
--  为已部署的 Supabase 项目补充以下字段：
--    1) list_items.progress   —— Love List 完成度百分比
--    2) ledger.image          —— 记账本图片
-- ----------------------------------------------------------------------------
--  用法：Supabase 后台 → SQL Editor → New query → 粘贴 → Run
-- ============================================================================

-- Love List 完成度
alter table public.list_items
  add column if not exists progress numeric not null default 0;

-- 记账本图片
alter table public.ledger
  add column if not exists image text default '';

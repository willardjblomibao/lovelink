-- =========================================================
-- LoveLink — Migration 4: human-readable location labels
-- =========================================================

alter table public.locations add column if not exists label text;

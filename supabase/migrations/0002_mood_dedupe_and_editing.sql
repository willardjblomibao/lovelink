-- =========================================================
-- LoveLink — Migration 2: mood dedupe, editing support
-- =========================================================

-- One mood entry per user per day (upsert target). Prevents duplicate rows
-- when the mood button is tapped multiple times quickly.
alter table public.moods add column if not exists mood_date date not null default current_date;

do $$ begin
  alter table public.moods
    add constraint moods_couple_user_date_unique unique (couple_id, user_id, mood_date);
exception when duplicate_object then null; end $$;

-- Allow a user to update their own mood row (needed for upsert-on-conflict).
do $$ begin
  create policy "moods_update_self" on public.moods
    for update using (couple_id = public.current_couple_id() and user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- Allow deleting your own memories/tasks already covered; add delete for
-- study_tasks by creator only isn't needed since couple-scoped delete already exists.

-- Backfill mood_date for any existing rows (safe no-op if table is empty).
update public.moods set mood_date = created_at::date where mood_date is null;

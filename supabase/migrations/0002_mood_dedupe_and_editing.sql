-- =========================================================
-- LoveLink — Migration 2 (fixed): mood dedupe, editing support
-- =========================================================

-- One mood entry per user per day (upsert target).
alter table public.moods add column if not exists mood_date date not null default current_date;

update public.moods set mood_date = created_at::date where mood_date is null;

-- Remove pre-existing duplicate rows for the same couple/user/day, keeping
-- only the most recent one, so the unique constraint below can be created.
delete from public.moods a
using public.moods b
where a.couple_id = b.couple_id
  and a.user_id = b.user_id
  and a.mood_date = b.mood_date
  and a.created_at < b.created_at;

do $$ begin
  alter table public.moods
    add constraint moods_couple_user_date_unique unique (couple_id, user_id, mood_date);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "moods_update_self" on public.moods
    for update using (couple_id = public.current_couple_id() and user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- =========================================================
-- LoveLink — Migration 3: partner location sharing
-- =========================================================

create table if not exists public.locations (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  accuracy_meters double precision,
  updated_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

alter table public.locations enable row level security;

-- Only the two linked partners can ever see either location.
do $$ begin
  create policy "locations_select_couple" on public.locations
    for select using (couple_id = public.current_couple_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "locations_insert_self" on public.locations
    for insert with check (couple_id = public.current_couple_id() and user_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "locations_update_self" on public.locations
    for update using (couple_id = public.current_couple_id() and user_id = auth.uid());
exception when duplicate_object then null; end $$;

alter publication supabase_realtime add table public.locations;

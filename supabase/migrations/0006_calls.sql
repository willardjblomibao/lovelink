-- =========================================================
-- LoveLink — Migration 6: audio/video calls
-- =========================================================

create table if not exists public.calls (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  caller_id uuid not null references public.users(id) on delete cascade,
  callee_id uuid not null references public.users(id) on delete cascade,
  call_type text not null check (call_type in ('audio', 'video')),
  status text not null default 'ringing' check (status in ('ringing', 'active', 'ended', 'declined', 'missed', 'failed')),
  offer_sdp text,
  answer_sdp text,
  created_at timestamptz not null default now(),
  answered_at timestamptz,
  ended_at timestamptz
);

alter table public.calls enable row level security;

do $$ begin
  create policy "calls_select_couple" on public.calls
    for select using (couple_id = public.current_couple_id());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "calls_insert_caller" on public.calls
    for insert with check (couple_id = public.current_couple_id() and caller_id = auth.uid());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "calls_update_couple" on public.calls
    for update using (couple_id = public.current_couple_id());
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.calls;
exception when duplicate_object then null; end $$;

create index if not exists calls_couple_created_idx on public.calls (couple_id, created_at desc);

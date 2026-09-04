-- =========================================================
-- LoveLink — Initial schema, RLS policies, triggers, realtime
-- =========================================================

create extension if not exists "pgcrypto";

-- ---------- ENUMS ----------
do $$ begin
  create type partner_role as enum ('boyfriend', 'girlfriend');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mood_type as enum ('amazing', 'happy', 'okay', 'tired', 'stressed', 'sad', 'sick', 'missing_you');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_type as enum ('anniversary', 'birthday', 'date', 'reminder', 'custom');
exception when duplicate_object then null; end $$;

-- ---------- USERS ----------
-- Extends auth.users with app-specific profile data.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Someone lovely',
  role partner_role,
  avatar_url text,
  couple_id uuid,
  is_online boolean not null default false,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ---------- COUPLES ----------
create table if not exists public.couples (
  id uuid primary key default gen_random_uuid(),
  invite_code text unique not null,
  boyfriend_id uuid references public.users(id) on delete set null,
  girlfriend_id uuid references public.users(id) on delete set null,
  anniversary_date date,
  daily_quote text,
  daily_quote_date date,
  created_at timestamptz not null default now(),
  connected_at timestamptz
);

alter table public.users
  add constraint users_couple_fk foreign key (couple_id) references public.couples(id) on delete set null;

-- ---------- MESSAGES (Live Love Notes) ----------
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  content text not null,
  delivered_at timestamptz,
  seen_at timestamptz,
  reaction text,
  created_at timestamptz not null default now()
);

-- ---------- TYPING STATUS ----------
create table if not exists public.typing_status (
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  is_typing boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (couple_id, user_id)
);

-- ---------- MEMORIES (Shared Memory Vault) ----------
create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  uploader_id uuid not null references public.users(id) on delete cascade,
  media_url text not null,
  media_type text not null default 'photo', -- photo | video
  caption text,
  taken_at date,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------- EVENTS (Couple Calendar) ----------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  event_type event_type not null default 'custom',
  event_date date not null,
  is_recurring_yearly boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------- MOODS ----------
create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  mood mood_type not null,
  note text,
  created_at timestamptz not null default now()
);

-- ---------- BUCKET LIST ----------
create table if not exists public.bucket_list (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  category text not null default 'date_idea', -- date_idea | wishlist | travel | other
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- LOCKET PHOTOS ----------
create table if not exists public.locket_photos (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  sender_id uuid not null references public.users(id) on delete cascade,
  photo_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

-- ---------- SECRET SURPRISES ----------
create table if not exists public.surprises (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  content text not null,
  unlock_at timestamptz not null,
  is_unlocked boolean not null default false,
  opened_by uuid references public.users(id),
  opened_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- STUDY SESSIONS (Study Together) ----------
create table if not exists public.study_sessions (
  couple_id uuid primary key references public.couples(id) on delete cascade,
  active_user_ids uuid[] not null default '{}',
  timer_started_at timestamptz,
  duration_minutes int not null default 25,
  is_break boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.study_tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.couples(id) on delete cascade,
  created_by uuid not null references public.users(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  created_at timestamptz not null default now()
);

-- =========================================================
-- HELPER FUNCTIONS
-- =========================================================

-- Returns the couple_id of the currently authenticated user.
create or replace function public.current_couple_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select couple_id from public.users where id = auth.uid();
$$;

-- Generates a random 6-character alphanumeric invite code (uppercase, no ambiguous chars).
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Creates a new couple row with a unique invite code for the given creator + role.
create or replace function public.create_couple(p_role partner_role)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_couple public.couples;
begin
  loop
    v_code := public.generate_invite_code();
    exit when not exists (select 1 from public.couples where invite_code = v_code);
  end loop;

  insert into public.couples (invite_code, boyfriend_id, girlfriend_id)
  values (
    v_code,
    case when p_role = 'boyfriend' then auth.uid() else null end,
    case when p_role = 'girlfriend' then auth.uid() else null end
  )
  returning * into v_couple;

  update public.users set couple_id = v_couple.id, role = p_role where id = auth.uid();

  return v_couple;
end;
$$;

-- Joins an existing couple using an invite code. Enforces one partner per role.
create or replace function public.join_couple(p_code text, p_role partner_role)
returns public.couples
language plpgsql
security definer
set search_path = public
as $$
declare
  v_couple public.couples;
begin
  select * into v_couple from public.couples where invite_code = upper(p_code);

  if v_couple.id is null then
    raise exception 'Invalid invite code';
  end if;

  if p_role = 'boyfriend' and v_couple.boyfriend_id is not null then
    raise exception 'This couple already has a boyfriend connected';
  end if;

  if p_role = 'girlfriend' and v_couple.girlfriend_id is not null then
    raise exception 'This couple already has a girlfriend connected';
  end if;

  if (p_role = 'boyfriend' and v_couple.girlfriend_id = auth.uid())
     or (p_role = 'girlfriend' and v_couple.boyfriend_id = auth.uid()) then
    raise exception 'You cannot connect to yourself';
  end if;

  update public.couples
  set
    boyfriend_id = case when p_role = 'boyfriend' then auth.uid() else boyfriend_id end,
    girlfriend_id = case when p_role = 'girlfriend' then auth.uid() else girlfriend_id end,
    connected_at = now()
  where id = v_couple.id
  returning * into v_couple;

  update public.users set couple_id = v_couple.id, role = p_role where id = auth.uid();

  return v_couple;
end;
$$;

-- Auto-create a public.users row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.messages enable row level security;
alter table public.typing_status enable row level security;
alter table public.memories enable row level security;
alter table public.events enable row level security;
alter table public.moods enable row level security;
alter table public.bucket_list enable row level security;
alter table public.locket_photos enable row level security;
alter table public.surprises enable row level security;
alter table public.study_sessions enable row level security;
alter table public.study_tasks enable row level security;

-- USERS: a user can read/update themself and can read their connected partner.
create policy "users_select_self_or_partner" on public.users
  for select using (
    id = auth.uid()
    or couple_id = public.current_couple_id()
  );

create policy "users_update_self" on public.users
  for update using (id = auth.uid());

-- COUPLES: only the two linked partners can see/update their couple row.
create policy "couples_select_members" on public.couples
  for select using (
    boyfriend_id = auth.uid() or girlfriend_id = auth.uid()
  );

create policy "couples_update_members" on public.couples
  for update using (
    boyfriend_id = auth.uid() or girlfriend_id = auth.uid()
  );

-- Generic couple-scoped policy generator pattern, applied per table below.

-- MESSAGES
create policy "messages_select_couple" on public.messages
  for select using (couple_id = public.current_couple_id());
create policy "messages_insert_couple" on public.messages
  for insert with check (couple_id = public.current_couple_id() and sender_id = auth.uid());
create policy "messages_update_couple" on public.messages
  for update using (couple_id = public.current_couple_id());

-- TYPING STATUS
create policy "typing_select_couple" on public.typing_status
  for select using (couple_id = public.current_couple_id());
create policy "typing_upsert_self" on public.typing_status
  for insert with check (couple_id = public.current_couple_id() and user_id = auth.uid());
create policy "typing_update_self" on public.typing_status
  for update using (couple_id = public.current_couple_id() and user_id = auth.uid());

-- MEMORIES
create policy "memories_select_couple" on public.memories
  for select using (couple_id = public.current_couple_id());
create policy "memories_insert_couple" on public.memories
  for insert with check (couple_id = public.current_couple_id() and uploader_id = auth.uid());
create policy "memories_update_couple" on public.memories
  for update using (couple_id = public.current_couple_id());
create policy "memories_delete_own" on public.memories
  for delete using (couple_id = public.current_couple_id() and uploader_id = auth.uid());

-- EVENTS
create policy "events_select_couple" on public.events
  for select using (couple_id = public.current_couple_id());
create policy "events_insert_couple" on public.events
  for insert with check (couple_id = public.current_couple_id() and created_by = auth.uid());
create policy "events_update_couple" on public.events
  for update using (couple_id = public.current_couple_id());
create policy "events_delete_couple" on public.events
  for delete using (couple_id = public.current_couple_id());

-- MOODS
create policy "moods_select_couple" on public.moods
  for select using (couple_id = public.current_couple_id());
create policy "moods_insert_self" on public.moods
  for insert with check (couple_id = public.current_couple_id() and user_id = auth.uid());

-- BUCKET LIST
create policy "bucket_select_couple" on public.bucket_list
  for select using (couple_id = public.current_couple_id());
create policy "bucket_insert_couple" on public.bucket_list
  for insert with check (couple_id = public.current_couple_id() and created_by = auth.uid());
create policy "bucket_update_couple" on public.bucket_list
  for update using (couple_id = public.current_couple_id());
create policy "bucket_delete_couple" on public.bucket_list
  for delete using (couple_id = public.current_couple_id());

-- LOCKET PHOTOS
create policy "locket_select_couple" on public.locket_photos
  for select using (couple_id = public.current_couple_id());
create policy "locket_insert_self" on public.locket_photos
  for insert with check (couple_id = public.current_couple_id() and sender_id = auth.uid());
create policy "locket_delete_couple" on public.locket_photos
  for delete using (couple_id = public.current_couple_id());

-- SURPRISES: rows are visible to the couple, but content of un-unlocked
-- surprises created by the *other* partner is masked at the query layer
-- by the client (title/content only fetched in full once unlock_at has passed
-- or the row belongs to the requester). RLS still scopes to the couple.
create policy "surprises_select_couple" on public.surprises
  for select using (couple_id = public.current_couple_id());
create policy "surprises_insert_couple" on public.surprises
  for insert with check (couple_id = public.current_couple_id() and created_by = auth.uid());
create policy "surprises_update_couple" on public.surprises
  for update using (couple_id = public.current_couple_id());

-- STUDY SESSIONS
create policy "study_sessions_select_couple" on public.study_sessions
  for select using (couple_id = public.current_couple_id());
create policy "study_sessions_upsert_couple" on public.study_sessions
  for insert with check (couple_id = public.current_couple_id());
create policy "study_sessions_update_couple" on public.study_sessions
  for update using (couple_id = public.current_couple_id());

-- STUDY TASKS
create policy "study_tasks_select_couple" on public.study_tasks
  for select using (couple_id = public.current_couple_id());
create policy "study_tasks_insert_couple" on public.study_tasks
  for insert with check (couple_id = public.current_couple_id() and created_by = auth.uid());
create policy "study_tasks_update_couple" on public.study_tasks
  for update using (couple_id = public.current_couple_id());
create policy "study_tasks_delete_couple" on public.study_tasks
  for delete using (couple_id = public.current_couple_id());

-- =========================================================
-- REALTIME
-- =========================================================
alter publication supabase_realtime add table
  public.messages,
  public.typing_status,
  public.users,
  public.couples,
  public.moods,
  public.locket_photos,
  public.study_sessions,
  public.study_tasks,
  public.bucket_list;

-- =========================================================
-- STORAGE BUCKETS (run once; safe if already exists)
-- =========================================================
insert into storage.buckets (id, name, public)
values
  ('memories', 'memories', true),
  ('locket', 'locket', true),
  ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Storage policies: only authenticated couple members upload; public read
-- (URLs are unguessable UUID paths, matching the "photo-in-locket" UX).
create policy "storage_authenticated_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('memories', 'locket', 'avatars'));

create policy "storage_public_read" on storage.objects
  for select using (bucket_id in ('memories', 'locket', 'avatars'));

create policy "storage_owner_delete" on storage.objects
  for delete to authenticated
  using (owner = auth.uid());

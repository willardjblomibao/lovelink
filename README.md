# LoveLink 💗

A premium, private couple app. Two accounts — Boyfriend and Girlfriend — connect with a
6‑character invite code, then get a real-time synced space: love notes, a shared memory
vault, a couple calendar, mood check-ins, a locket photo widget, a bucket list, secret
surprises, and a shared Pomodoro for studying together.

Built with **React + Vite + TypeScript + Tailwind CSS + Framer Motion + Supabase**, installable
as a PWA on both partners' phones.

---

## 1. Prerequisites

- Node.js 18+
- A free [Supabase](https://supabase.com) project
- (Optional) A Google Cloud OAuth client, if you want Google Sign-In

## 2. Set up Supabase

1. Create a new Supabase project.
2. Open **SQL Editor** and run, in order:
   `0001_init.sql` → `0002_mood_dedupe_and_editing.sql` → `0003_locations.sql` →
   `0004_location_labels.sql`. The first creates the full schema; the second adds a per-day
   unique constraint on moods (cleaning up any pre-existing duplicates first); the third adds
   partner location sharing; the fourth adds a human-readable place name column. Migration 1
   creates:
   - Tables: `users`, `couples`, `messages`, `typing_status`, `memories`, `events`, `moods`,
     `bucket_list`, `locket_photos`, `surprises`, `study_sessions`, `study_tasks`
   - RPC functions `create_couple` / `join_couple` for invite-code linking
   - A trigger that auto-creates a `public.users` row on signup
   - Row Level Security policies so **only the two linked partners** can ever read/write
     their shared data
   - Storage buckets: `memories`, `locket`, `avatars`
   - Realtime publication for live sync tables
3. Under **Authentication → Providers**, enable **Email** (on by default) and, if desired,
   **Google** (paste your OAuth client ID/secret; set the redirect URL Supabase gives you in
   your Google Cloud console).
4. Under **Authentication → URL Configuration**, add your dev URL (e.g. `http://localhost:5173`)
   and your production domain to the allow list.

## 3. Configure the app

```bash
cp .env.example .env
# then fill in:
# VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are on your Supabase project's **Settings → API** page.

## 4. Install & run

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. Sign up on two different browsers/devices (or in an
incognito window) to simulate both partners, choose Boyfriend on one and Girlfriend on
the other, generate an invite code on one, and enter it on the other to link the couple.

## 5. Build for production / installable PWA

```bash
npm run build
npm run preview   # sanity-check the production build locally
```

Deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.) over
HTTPS — required for the PWA install prompt and service worker. On iOS, "Add to Home Screen"
from Safari's share sheet installs it; on Android/Chrome, the browser will offer an install
banner automatically.

Replace the placeholder icons in `public/icons/` with your real app icon (192×192, 512×512,
and a 180×180 Apple touch icon) before shipping.

## Project structure

```
src/
  components/
    ui/         Button, Input, GlassCard, Avatar, BottomNav, TopBar, Spinner
    effects/    FloatingHearts, HeartBurst, Confetti, RippleSurface
    home/       TogetherCounter, DailyQuote, PresenceBadge
  context/      AuthContext, CoupleContext, ThemeContext
  hooks/        useMessages, useMood, useCountdown, useStudySession
  pages/        Home, LoveNotes, Memories, CalendarPage, StudyTogether,
                MoodPage, Locket, BucketList, SecretSurprise, More, Settings
  pages/auth/   Welcome, Login, SignUp, ChooseRole, LinkPartner
  routes/       ProtectedRoute (auth → role → link gating)
  lib/          supabase client, formatting/date utilities
  types/        Shared TypeScript types mirroring the DB schema
supabase/
  migrations/0001_init.sql   Full schema, RLS, RPCs, storage, realtime
```

## How the invite code works

- `create_couple(role)` (SQL RPC) generates a unique 6-character code (uppercase letters +
  digits, ambiguous characters like `0/O` and `1/I` excluded), inserts a `couples` row with
  the creator in the chosen role slot, and stamps the creator's `users.couple_id`.
- `join_couple(code, role)` looks up the couple by code, validates the requested role slot is
  open (and that you're not linking to yourself), fills the slot, sets `connected_at`, and
  stamps the joiner's `users.couple_id`.
- From that moment, every table (`messages`, `memories`, `events`, `moods`, …) is scoped by
  `couple_id`, and RLS policies check `couple_id = current_couple_id()` — so no other account
  can ever read or write into a couple's data, even via the API directly.

## Real-time sync

Supabase Realtime (Postgres CDC) powers: instant love notes, typing indicators, read
receipts, presence (`is_online` heartbeat + visibility events), live photo/locket sync, mood
updates, and the shared Pomodoro timer/checklist — all via `supabase.channel(...).on('postgres_changes', ...)`
subscriptions scoped per couple, so both phones update within milliseconds of each other.

## What's new in this update

- **Editable anniversary** — pencil icon on the Calendar reopens the date picker anytime.
- **Editable & deletable calendar events**, plus a **"Add to phone calendar"** button per
  event and for the anniversary — downloads a real `.ics` file that Apple Calendar, Google
  Calendar, and Outlook all import natively (recurring yearly for birthdays/anniversary).
- **"Notes" renamed to "Chats"**, with real notifications: an in-app toast + unread badge on
  the bottom nav whenever your partner sends a message while you're elsewhere in the app, and
  a native browser notification if you've granted permission (toggle in Settings) and the tab
  is backgrounded.
- **Mood is now a shared status**, shown on the Home dashboard as a Facebook-style "feeling —"
  line for both partners with a heart between them, plus a 🔥 streak badge for consecutive
  days you've both checked in.
- **Daily quote** already rotates automatically every day for both partners (it's derived from
  the calendar date, so no action needed — confirmed working as intended).
- **Memories**: tap any photo/video to open it full-screen; the uploader gets a delete button.
- **Study Together tasks** are now editable (pencil) and deletable (trash), in addition to
  checking them off.
- **Secret Surprises** can be edited (title, message, unlock time) by their creator up until
  the moment they're unlocked.
- **Mood duplicate-save bug fixed**: mood check-ins now `upsert` against a `(couple, user, day)`
  unique constraint instead of inserting a new row every tap, plus a client-side guard blocks
  overlapping requests — so rapid taps update one row, not several.
- **New feature — "Thinking of You"**: a one-tap button on Home instantly sends a preset love
  note to your partner (with the heart-burst animation), no typing required.
- **New feature — check-in streak**: Home shows a flame badge counting consecutive days both
  of you have logged a mood.
- **New feature — Find Partner**: a location page where either partner can tap "Share my
  current location" (uses the browser's Geolocation API, permission-gated) to post their
  coordinates; the other partner sees it on an embedded map with a **readable place name**
  (e.g. "SM City Cabanatuan" instead of raw coordinates, via free reverse-geocoding — no API
  key needed), an "updated Xm/h/d ago" timestamp, an "Open in Maps" link, and the live
  distance between you. Nothing is tracked automatically or in the background — it only
  updates when someone taps share.

## Notes & next steps

- **Google Sign-In** requires provider setup in the Supabase dashboard (see step 2.3) — the
  client-side call (`signInWithOAuth`) is already wired up in `AuthContext`.
- **Push notifications** (e.g. "your partner sent a love note") aren't included here since they
  require a server-side push service (web push + VAPID keys, or FCM) — the schema and realtime
  layer are ready to trigger them from a Supabase Edge Function if you want to add this next.
- **Encryption**: communication is protected in transit via TLS and at rest via Supabase's
  storage encryption, with RLS enforcing that only the two linked partners can query the data.
  True end-to-end (client-side) encryption of message content is a natural follow-up if needed.

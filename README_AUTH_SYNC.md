Auth and Cloud Sync (Supabase)

Free and simple: use Supabase Auth (email/password) and a single table to store the app state per user.

1) Create a free Supabase project at https://supabase.com
2) In Project Settings > API, copy the Project URL and anon public key.
3) Create a .env file used by Vite (not committed):

VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_public_anon_key

4) In the Supabase SQL editor, run:

create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_json jsonb not null,
  updated_at timestamp with time zone default now()
);

-- RLS: one row per user, user can only access their own row
alter table public.user_app_state enable row level security;
create policy "User can read own state" on public.user_app_state
  for select using (auth.uid() = user_id);
create policy "User can upsert own state" on public.user_app_state
  for insert with check (auth.uid() = user_id);
create policy "User can update own state" on public.user_app_state
  for update using (auth.uid() = user_id);

That’s it. Build and run as usual. If env vars are missing, the UI hides login/sync and the app uses localStorage only.

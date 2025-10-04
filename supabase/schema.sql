-- Supabase Auth + Cloud Sync (ConcursoGenius)
-- Sistema completo de autenticação e sincronização

-- Habilitar extensões necessárias
create extension if not exists "uuid-ossp";

-- Tabela de perfis de usuário (complementa auth.users)
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  target_role text,
  daily_study_hours integer default 3,
  study_days text[] default array['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'],
  study_notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela de estado da aplicação por usuário
create table if not exists public.user_app_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state_json jsonb not null,
  last_saved timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela para sessões de estudo (analytics)
create table if not exists public.study_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  subject_name text not null,
  topic_name text not null,
  duration_minutes integer not null,
  session_type text not null check (session_type in ('reading', 'questions', 'flashcards', 'ai_coach')),
  performance_score integer check (performance_score >= 0 and performance_score <= 100),
  notes text,
  created_at timestamp with time zone default now()
);

-- Habilita RLS em todas as tabelas
alter table public.user_profiles enable row level security;
alter table public.user_app_state enable row level security;
alter table public.study_sessions enable row level security;

-- Políticas para user_profiles
do $$
begin
  -- Políticas para user_profiles
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile" on public.user_profiles
      for select using (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can insert own profile'
  ) then
    create policy "Users can insert own profile" on public.user_profiles
      for insert with check (auth.uid() = id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_profiles' and policyname = 'Users can update own profile'
  ) then
    create policy "Users can update own profile" on public.user_profiles
      for update using (auth.uid() = id);
  end if;

  -- Políticas para user_app_state
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_app_state' and policyname = 'User can read own state'
  ) then
    create policy "User can read own state" on public.user_app_state
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_app_state' and policyname = 'User can insert own state'
  ) then
    create policy "User can insert own state" on public.user_app_state
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_app_state' and policyname = 'User can update own state'
  ) then
    create policy "User can update own state" on public.user_app_state
      for update using (auth.uid() = user_id);
  end if;

  -- Políticas para study_sessions
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'study_sessions' and policyname = 'Users can read own sessions'
  ) then
    create policy "Users can read own sessions" on public.study_sessions
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'study_sessions' and policyname = 'Users can insert own sessions'
  ) then
    create policy "Users can insert own sessions" on public.study_sessions
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'study_sessions' and policyname = 'Users can update own sessions'
  ) then
    create policy "Users can update own sessions" on public.study_sessions
      for update using (auth.uid() = user_id);
  end if;
end
$$;

-- Função para atualizar timestamp automaticamente
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers para atualizar updated_at
drop trigger if exists update_user_profiles_updated_at on public.user_profiles;
create trigger update_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function update_updated_at_column();

drop trigger if exists update_user_app_state_updated_at on public.user_app_state;
create trigger update_user_app_state_updated_at
  before update on public.user_app_state
  for each row execute function update_updated_at_column();

-- Função para criar perfil automaticamente após registro
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger para criar perfil automaticamente
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Índices para performance
create index if not exists idx_user_profiles_updated_at on public.user_profiles(updated_at desc);
create index if not exists idx_user_app_state_updated_at on public.user_app_state(updated_at desc);
create index if not exists idx_study_sessions_user_created on public.study_sessions(user_id, created_at desc);
create index if not exists idx_study_sessions_subject_topic on public.study_sessions(subject_name, topic_name);

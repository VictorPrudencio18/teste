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

-- Tabela de editais processados pelo usuário
create table if not exists public.user_editals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  edital_text text not null,
  edital_filename text,
  analysis_result jsonb,
  selected_role text,
  processed_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela de progresso de tópicos
create table if not exists public.topic_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  edital_id uuid references public.user_editals(id) on delete cascade,
  subject_name text not null,
  topic_name text not null,
  topic_id text not null,
  content_generated jsonb default '{}',
  interactions jsonb default '{}',
  study_time_minutes integer default 0,
  last_studied timestamp with time zone,
  mastery_level text default 'not_started' check (mastery_level in ('not_started', 'learning', 'practicing', 'mastered')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Tabela de questões respondidas
create table if not exists public.user_question_attempts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  topic_progress_id uuid references public.topic_progress(id) on delete cascade,
  question_data jsonb not null,
  selected_answer_index integer not null,
  is_correct boolean not null,
  time_spent_seconds integer not null,
  hints_used integer default 0,
  created_at timestamp with time zone default now()
);

-- Tabela de mensagens do AI Coach
create table if not exists public.ai_coach_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  topic_progress_id uuid references public.topic_progress(id) on delete cascade,
  messages jsonb not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Habilita RLS em todas as tabelas
alter table public.user_profiles enable row level security;
alter table public.user_app_state enable row level security;
alter table public.study_sessions enable row level security;
alter table public.user_editals enable row level security;
alter table public.topic_progress enable row level security;
alter table public.user_question_attempts enable row level security;
alter table public.ai_coach_conversations enable row level security;

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

  -- Políticas para user_editals
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_editals' and policyname = 'Users can read own editals'
  ) then
    create policy "Users can read own editals" on public.user_editals
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_editals' and policyname = 'Users can insert own editals'
  ) then
    create policy "Users can insert own editals" on public.user_editals
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_editals' and policyname = 'Users can update own editals'
  ) then
    create policy "Users can update own editals" on public.user_editals
      for update using (auth.uid() = user_id);
  end if;

  -- Políticas para topic_progress
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'topic_progress' and policyname = 'Users can read own progress'
  ) then
    create policy "Users can read own progress" on public.topic_progress
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'topic_progress' and policyname = 'Users can insert own progress'
  ) then
    create policy "Users can insert own progress" on public.topic_progress
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'topic_progress' and policyname = 'Users can update own progress'
  ) then
    create policy "Users can update own progress" on public.topic_progress
      for update using (auth.uid() = user_id);
  end if;

  -- Políticas para user_question_attempts
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_question_attempts' and policyname = 'Users can read own attempts'
  ) then
    create policy "Users can read own attempts" on public.user_question_attempts
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_question_attempts' and policyname = 'Users can insert own attempts'
  ) then
    create policy "Users can insert own attempts" on public.user_question_attempts
      for insert with check (auth.uid() = user_id);
  end if;

  -- Políticas para ai_coach_conversations
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_coach_conversations' and policyname = 'Users can read own conversations'
  ) then
    create policy "Users can read own conversations" on public.ai_coach_conversations
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_coach_conversations' and policyname = 'Users can insert own conversations'
  ) then
    create policy "Users can insert own conversations" on public.ai_coach_conversations
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'ai_coach_conversations' and policyname = 'Users can update own conversations'
  ) then
    create policy "Users can update own conversations" on public.ai_coach_conversations
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

drop trigger if exists update_user_editals_updated_at on public.user_editals;
create trigger update_user_editals_updated_at
  before update on public.user_editals
  for each row execute function update_updated_at_column();

drop trigger if exists update_topic_progress_updated_at on public.topic_progress;
create trigger update_topic_progress_updated_at
  before update on public.topic_progress
  for each row execute function update_updated_at_column();

drop trigger if exists update_ai_coach_conversations_updated_at on public.ai_coach_conversations;
create trigger update_ai_coach_conversations_updated_at
  before update on public.ai_coach_conversations
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
create index if not exists idx_user_app_state_user_id on public.user_app_state(user_id);
create index if not exists idx_study_sessions_user_created on public.study_sessions(user_id, created_at desc);
create index if not exists idx_study_sessions_subject_topic on public.study_sessions(subject_name, topic_name);
create index if not exists idx_user_editals_user_id on public.user_editals(user_id, processed_at desc);
create index if not exists idx_topic_progress_user_edital on public.topic_progress(user_id, edital_id);
create index if not exists idx_topic_progress_topic_id on public.topic_progress(topic_id);
create index if not exists idx_question_attempts_user_topic on public.user_question_attempts(user_id, topic_progress_id);
create index if not exists idx_ai_coach_conversations_user_topic on public.ai_coach_conversations(user_id, topic_progress_id);

-- Função para backup automático do estado
create or replace function public.backup_user_state()
returns trigger as $$
begin
  -- Criar backup apenas se houve mudança significativa no state_json
  if old.state_json is distinct from new.state_json then
    insert into public.user_state_backups (user_id, state_json, backup_timestamp)
    values (new.user_id, old.state_json, old.updated_at);
    
    -- Manter apenas os últimos 5 backups por usuário
    delete from public.user_state_backups 
    where user_id = new.user_id 
    and backup_timestamp not in (
      select backup_timestamp 
      from public.user_state_backups 
      where user_id = new.user_id 
      order by backup_timestamp desc 
      limit 5
    );
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Tabela de backups automáticos do estado do usuário
create table if not exists public.user_state_backups (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  state_json jsonb not null,
  backup_timestamp timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- RLS para backups
alter table public.user_state_backups enable row level security;

-- Políticas para user_state_backups
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname = 'public' and tablename = 'user_state_backups' and policyname = 'Users can read own backups'
  ) then
    create policy "Users can read own backups" on public.user_state_backups
      for select using (auth.uid() = user_id);
  end if;
end
$$;

-- Trigger para backup automático
drop trigger if exists backup_user_state_trigger on public.user_app_state;
create trigger backup_user_state_trigger
  before update on public.user_app_state
  for each row execute function public.backup_user_state();

-- Índice para backups
create index if not exists idx_user_state_backups_user_timestamp on public.user_state_backups(user_id, backup_timestamp desc);

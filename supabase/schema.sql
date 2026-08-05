-- ============================================================================
-- FitCut — schema
-- Run this once in the Supabase SQL editor.
--
-- Design rules:
--  1. Every table carries user_id and is protected by RLS. A user can only ever
--     see their own rows. Multi-user works from day one.
--  2. Nothing is derived-and-stored that can be computed (weekly averages,
--     macro totals). Only facts are stored.
--  3. daily_metrics is the extension point: water, sleep, steps, supplements
--     and anything else land there without a migration.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  avatar_url    text,
  height_cm     numeric(5,1),
  weight_unit   text not null default 'kg' check (weight_unit in ('kg','lb')),
  onboarded_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- phases — a cut/bulk block. Start date + duration are editable in Settings.
-- ---------------------------------------------------------------------------
create table if not exists public.phases (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null default 'Recomp',
  goal               text not null default 'recomp' check (goal in ('cut','recomp','bulk','maintain')),
  start_date         date not null,
  duration_weeks     int  not null default 16 check (duration_weeks between 1 and 104),
  starting_weight_kg numeric(5,2),
  maintenance_kcal   int  not null default 2650,
  base_kcal          int  not null default 2400,
  protein_target_g   int  not null default 130,
  carbs_target_g     int  not null default 168,
  fat_target_g       int  not null default 100,
  -- decision rule, kept as data so it can be tuned without a code change
  plateau_threshold_kg numeric(4,2) not null default 0.15,
  min_hold_days        int          not null default 14,
  grace_weeks          int          not null default 2,
  step_kcal            int          not null default 100,
  cardio_ceiling_kcal  int          not null default 300,
  kcal_floor           int          not null default 2100,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists phases_user_idx on public.phases(user_id, is_active);

-- ---------------------------------------------------------------------------
-- plan_steps — the ladder. One row per rung actually taken, with the reason.
-- Effective from a date onwards; the target for any day is the latest row
-- whose effective_date <= that day.
-- ---------------------------------------------------------------------------
create table if not exists public.plan_steps (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  phase_id       uuid not null references public.phases(id) on delete cascade,
  step_index     int  not null default 0,
  effective_date date not null,
  kcal_target    int  not null,
  cardio_kcal    int  not null default 0,
  kind           text not null default 'baseline' check (kind in ('baseline','diet','cardio','manual')),
  reason         text,
  accepted_at    timestamptz,
  created_at     timestamptz not null default now(),
  unique (phase_id, effective_date)
);
create index if not exists plan_steps_lookup_idx on public.plan_steps(phase_id, effective_date desc);

-- ---------------------------------------------------------------------------
-- meals + items — the fixed daily plan. Templates, not per-day copies.
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  phase_id   uuid not null references public.phases(id) on delete cascade,
  name       text not null,
  time_label text,
  sort_order int not null default 0,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists meals_phase_idx on public.meals(phase_id, sort_order);

create table if not exists public.meal_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  meal_id    uuid not null references public.meals(id) on delete cascade,
  name       text not null,
  portion    text,
  kcal       numeric(7,1) not null default 0,
  protein_g  numeric(6,1) not null default 0,
  carbs_g    numeric(6,1) not null default 0,
  fat_g      numeric(6,1) not null default 0,
  sort_order int not null default 0,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists meal_items_meal_idx on public.meal_items(meal_id, sort_order);

-- one row per (day, item) once the item has been ticked
create table if not exists public.meal_item_checks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  meal_item_id uuid not null references public.meal_items(id) on delete cascade,
  log_date     date not null,
  checked      boolean not null default true,
  updated_at   timestamptz not null default now(),
  unique (meal_item_id, log_date)
);
create index if not exists checks_day_idx on public.meal_item_checks(user_id, log_date);

-- ---------------------------------------------------------------------------
-- custom_foods — one-off additions, scoped to a single day
-- ---------------------------------------------------------------------------
create table if not exists public.custom_foods (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
  name         text not null,
  portion      text,
  kcal         numeric(7,1) not null default 0,
  protein_g    numeric(6,1) not null default 0,
  carbs_g      numeric(6,1) not null default 0,
  fat_g        numeric(6,1) not null default 0,
  ai_estimated boolean not null default false,
  ai_note      text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists custom_foods_day_idx on public.custom_foods(user_id, log_date);

-- ---------------------------------------------------------------------------
-- weight_entries — one morning weight per day
-- ---------------------------------------------------------------------------
create table if not exists public.weight_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  weight_kg  numeric(5,2) not null check (weight_kg > 20 and weight_kg < 400),
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, log_date)
);
create index if not exists weight_user_date_idx on public.weight_entries(user_id, log_date);

-- ---------------------------------------------------------------------------
-- exercises — the library. unit is per-exercise and never converted.
-- ---------------------------------------------------------------------------
create table if not exists public.exercises (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null,
  split        text not null check (split in ('push','pull','legs','other')),
  muscle_group text,
  unit         text not null default 'kg' check (unit in ('kg','lb')),
  equipment    text,
  is_permanent boolean not null default true,  -- false = temporary/trial exercise
  archived     boolean not null default false,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists exercises_user_split_idx on public.exercises(user_id, split, sort_order);

-- ---------------------------------------------------------------------------
-- workouts / workout_exercises / exercise_sets
-- ---------------------------------------------------------------------------
create table if not exists public.workouts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
  split        text not null check (split in ('push','pull','legs','other')),
  notes        text,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, log_date, split)
);
create index if not exists workouts_user_date_idx on public.workouts(user_id, log_date desc);

create table if not exists public.workout_exercises (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  workout_id  uuid not null references public.workouts(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  sort_order  int not null default 0,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (workout_id, exercise_id)
);
create index if not exists we_workout_idx on public.workout_exercises(workout_id, sort_order);

create table if not exists public.exercise_sets (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  workout_exercise_id uuid not null references public.workout_exercises(id) on delete cascade,
  set_number          int not null,
  weight              numeric(6,2),
  unit                text not null default 'kg' check (unit in ('kg','lb')),
  reps                int,
  rpe                 numeric(3,1) check (rpe is null or (rpe >= 1 and rpe <= 10)),
  is_warmup           boolean not null default false,
  completed           boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (workout_exercise_id, set_number)
);
create index if not exists sets_we_idx on public.exercise_sets(workout_exercise_id, set_number);

-- ---------------------------------------------------------------------------
-- progress_photos (Phase 2) — file lives in the `progress-photos` bucket
-- ---------------------------------------------------------------------------
create table if not exists public.progress_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  log_date     date not null,
  storage_path text not null,
  pose         text default 'front' check (pose in ('front','side','back','other')),
  weight_kg    numeric(5,2),
  created_at   timestamptz not null default now()
);
create index if not exists photos_user_date_idx on public.progress_photos(user_id, log_date desc);

-- ---------------------------------------------------------------------------
-- ai_insights (Phase 3) — coach output, kept so it can be dismissed/audited
-- ---------------------------------------------------------------------------
create table if not exists public.ai_insights (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  kind         text not null,
  severity     text not null default 'info' check (severity in ('info','good','warn','action')),
  title        text not null,
  body         text,
  evidence     jsonb not null default '{}'::jsonb,
  for_date     date not null default current_date,
  dismissed_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists insights_user_idx on public.ai_insights(user_id, for_date desc);

-- ---------------------------------------------------------------------------
-- daily_metrics — the generic slot for every future module.
-- water_ml, sleep_hours, steps, mood, resting_hr, waist_cm ... no migration needed.
-- ---------------------------------------------------------------------------
create table if not exists public.daily_metrics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  log_date   date not null,
  metric_key text not null,
  value_num  numeric(12,3),
  value_text text,
  value_json jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, log_date, metric_key)
);
create index if not exists metrics_lookup_idx on public.daily_metrics(user_id, metric_key, log_date desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','phases','custom_foods','weight_entries','exercises',
    'workouts','exercise_sets','daily_metrics','meal_item_checks'
  ] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I;', t);
    execute format(
      'create trigger touch_%1$s before update on public.%1$I
       for each row execute function public.touch_updated_at();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row level security — identical policy shape on every table.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'phases','plan_steps','meals','meal_items','meal_item_checks','custom_foods',
    'weight_entries','exercises','workouts','workout_exercises','exercise_sets',
    'progress_photos','ai_insights','daily_metrics'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists "own rows" on public.%I;', t);
    execute format(
      'create policy "own rows" on public.%I
         for all to authenticated
         using (user_id = auth.uid())
         with check (user_id = auth.uid());', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------------------------------------------------------------------------
-- Storage bucket for progress photos (private; served via signed URLs).
-- Path convention: {user_id}/{yyyy-mm-dd}-{pose}-{uuid}.jpg
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('progress-photos', 'progress-photos', false)
on conflict (id) do nothing;

drop policy if exists "own photos" on storage.objects;
create policy "own photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'progress-photos' and (storage.foldername(name))[1] = auth.uid()::text);

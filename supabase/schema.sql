-- Liga da Academia - Supabase schema
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  weight_kg numeric(5,2),
  height_cm integer,
  created_at timestamptz not null default now()
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 80),
  invite_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.league_members (
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (league_id, user_id)
);

do $$
begin
  create type public.workout_status as enum ('present', 'absent');
exception
  when duplicate_object then null;
end;
$$;

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  workout_date date not null,
  status public.workout_status not null,
  minutes integer not null default 0 check (minutes between 0 and 1440),
  points integer not null default 0,
  water_ml integer not null default 0 check (water_ml between 0 and 10000),
  water_goal_ml integer check (water_goal_ml between 0 and 10000),
  water_points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (league_id, user_id, workout_date)
);

create index if not exists idx_workouts_league_date on public.workouts (league_id, workout_date desc);
create index if not exists idx_workouts_user on public.workouts (user_id);
create index if not exists idx_league_members_user on public.league_members (user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Atleta'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set display_name = excluded.display_name,
        avatar_url = excluded.avatar_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.random_invite_code()
returns text
language plpgsql
as $$
declare
  code text;
begin
  loop
    code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    exit when not exists (select 1 from public.leagues where invite_code = code);
  end loop;

  return code;
end;
$$;

create or replace function public.calculate_workout_points()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'absent' then
    new.minutes := 0;
    new.points := -1;
  elsif new.minutes < 30 then
    raise exception 'Treino com presenca precisa ter pelo menos 30 minutos.';
  elsif new.minutes >= 120 then
    new.points := 5;
  elsif new.minutes >= 60 then
    new.points := 4;
  else
    new.points := 3;
  end if;

  if new.water_goal_ml is null or new.water_goal_ml <= 0 then
    new.water_points := 0;
  elsif new.water_ml >= new.water_goal_ml then
    new.water_points := 1;
  else
    new.water_points := -1;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists set_workout_points on public.workouts;
create trigger set_workout_points
before insert or update on public.workouts
for each row execute function public.calculate_workout_points();

create or replace function public.is_league_member(p_league_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.league_members lm
    where lm.league_id = p_league_id
      and lm.user_id = p_user_id
  );
$$;

create or replace function public.create_league(p_name text)
returns setof public.leagues
language plpgsql
security definer
set search_path = public
as $$
declare
  new_league public.leagues;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  insert into public.profiles (id, display_name)
  values (auth.uid(), 'Atleta')
  on conflict (id) do nothing;

  insert into public.leagues (name, invite_code, owner_id)
  values (trim(p_name), public.random_invite_code(), auth.uid())
  returning * into new_league;

  insert into public.league_members (league_id, user_id)
  values (new_league.id, auth.uid());

  return query select * from public.leagues where id = new_league.id;
end;
$$;

create or replace function public.join_league_by_code(p_invite_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_league_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  select id into target_league_id
  from public.leagues
  where invite_code = upper(trim(p_invite_code));

  if target_league_id is null then
    raise exception 'Codigo de liga nao encontrado.';
  end if;

  insert into public.league_members (league_id, user_id)
  values (target_league_id, auth.uid())
  on conflict do nothing;
end;
$$;

create or replace function public.leave_league(p_league_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuario nao autenticado.';
  end if;

  delete from public.league_members
  where league_id = p_league_id
    and user_id = auth.uid();
end;
$$;

create or replace function public.get_league_standings(p_league_id uuid)
returns table (
  user_id uuid,
  display_name text,
  avatar_url text,
  presences bigint,
  absences bigint,
  total_minutes bigint,
  streak_bonus bigint,
  hydration_points bigint,
  points bigint
)
language sql
security definer
set search_path = public
stable
as $$
  with member_check as (
    select public.is_league_member(p_league_id, auth.uid()) as allowed
  ),
  member_rows as (
    select lm.user_id, p.display_name, p.avatar_url
    from public.league_members lm
    join public.profiles p on p.id = lm.user_id
    cross join member_check mc
    where lm.league_id = p_league_id
      and mc.allowed
  ),
  workout_totals as (
    select
      w.user_id,
      count(*) filter (where w.status = 'present') as presences,
      count(*) filter (where w.status = 'absent') as absences,
      coalesce(sum(w.minutes), 0) as total_minutes,
      coalesce(sum(w.points), 0) as base_points,
      coalesce(sum(w.water_points), 0) as hydration_points
    from public.workouts w
    where w.league_id = p_league_id
    group by w.user_id
  ),
  present_days as (
    select
      w.user_id,
      w.workout_date,
      w.workout_date - (row_number() over (partition by w.user_id order by w.workout_date))::int as streak_group
    from public.workouts w
    where w.league_id = p_league_id
      and w.status = 'present'
  ),
  streaks as (
    select user_id, count(*) as streak_length
    from present_days
    group by user_id, streak_group
  ),
  best_streak as (
    select
      user_id,
      (floor(coalesce(max(streak_length), 0)::numeric / 5) * 5)::bigint as streak_bonus
    from streaks
    group by user_id
  )
  select
    mr.user_id,
    mr.display_name,
    mr.avatar_url,
    coalesce(wt.presences, 0) as presences,
    coalesce(wt.absences, 0) as absences,
    coalesce(wt.total_minutes, 0) as total_minutes,
    coalesce(bs.streak_bonus, 0) as streak_bonus,
    coalesce(wt.hydration_points, 0) as hydration_points,
    coalesce(wt.base_points, 0) + coalesce(wt.hydration_points, 0) + coalesce(bs.streak_bonus, 0) as points
  from member_rows mr
  left join workout_totals wt on wt.user_id = mr.user_id
  left join best_streak bs on bs.user_id = mr.user_id
  order by points desc, presences desc, total_minutes desc, display_name asc;
$$;

alter table public.profiles enable row level security;
alter table public.leagues enable row level security;
alter table public.league_members enable row level security;
alter table public.workouts enable row level security;

drop policy if exists "Profiles are visible to members" on public.profiles;
create policy "Profiles are visible to members"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
on public.profiles for all
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Members can read leagues" on public.leagues;
create policy "Members can read leagues"
on public.leagues for select
to authenticated
using (public.is_league_member(id, auth.uid()));

drop policy if exists "Members can read memberships" on public.league_members;
create policy "Members can read memberships"
on public.league_members for select
to authenticated
using (public.is_league_member(league_id, auth.uid()));

drop policy if exists "Members can read workouts" on public.workouts;
create policy "Members can read workouts"
on public.workouts for select
to authenticated
using (public.is_league_member(league_id, auth.uid()));

drop policy if exists "Users insert own workouts" on public.workouts;
create policy "Users insert own workouts"
on public.workouts for insert
to authenticated
with check (user_id = auth.uid() and public.is_league_member(league_id, auth.uid()));

drop policy if exists "Users update own workouts" on public.workouts;
create policy "Users update own workouts"
on public.workouts for update
to authenticated
using (user_id = auth.uid() and public.is_league_member(league_id, auth.uid()))
with check (user_id = auth.uid() and public.is_league_member(league_id, auth.uid()));

drop policy if exists "Users delete own workouts" on public.workouts;
create policy "Users delete own workouts"
on public.workouts for delete
to authenticated
using (user_id = auth.uid() and public.is_league_member(league_id, auth.uid()));

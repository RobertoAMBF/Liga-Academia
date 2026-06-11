-- Liga da Academia - atualizacao para exclusao, novas regras de treino e agua
-- Execute este arquivo no SQL Editor do Supabase em um projeto que ja tem o schema antigo.

alter table public.profiles
  add column if not exists weight_kg numeric(5,2),
  add column if not exists height_cm integer;

alter table public.workouts
  add column if not exists water_ml integer not null default 0 check (water_ml between 0 and 10000),
  add column if not exists water_goal_ml integer check (water_goal_ml between 0 and 10000),
  add column if not exists water_points integer not null default 0,
  add column if not exists muscle_group text check (muscle_group in ('Superiores', 'Inferiores', 'Full Body')),
  add column if not exists muscles text[] not null default '{}';

create or replace function public.calculate_workout_points()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'absent' then
    new.minutes := 0;
    new.points := -1;
    new.muscle_group := null;
    new.muscles := '{}';
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

update public.workouts
set points = case
    when status = 'absent' then -1
    when minutes >= 120 then 5
    when minutes >= 60 then 4
    when minutes >= 30 then 3
    else 0
  end,
  water_points = case
    when water_goal_ml is null or water_goal_ml <= 0 then 0
    when water_ml >= water_goal_ml then 1
    else -1
  end;

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

drop function if exists public.get_league_standings(uuid);

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

drop policy if exists "Users delete own workouts" on public.workouts;
create policy "Users delete own workouts"
on public.workouts for delete
to authenticated
using (user_id = auth.uid() and public.is_league_member(league_id, auth.uid()));

notify pgrst, 'reload schema';

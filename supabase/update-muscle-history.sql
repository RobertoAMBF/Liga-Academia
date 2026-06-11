-- Liga da Academia - grupo muscular, historico exportavel e janela recente
-- Execute no SQL Editor do Supabase em projetos ja publicados.

alter table public.workouts
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

notify pgrst, 'reload schema';

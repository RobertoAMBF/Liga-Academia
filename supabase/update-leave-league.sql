-- Liga da Academia - permite que o usuario saia de uma liga
-- Execute no SQL Editor do Supabase em projetos que ja estao publicados.

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

notify pgrst, 'reload schema';

create table if not exists public.organizador_datos (
  user_id uuid primary key references auth.users (id) on delete cascade,
  datos jsonb not null,
  revision bigint not null default 1,
  actualizado_en timestamptz not null default now()
);

alter table public.organizador_datos enable row level security;
grant select, insert, update on table public.organizador_datos to authenticated;

drop policy if exists "Cada usuario lee sus datos" on public.organizador_datos;
create policy "Cada usuario lee sus datos"
  on public.organizador_datos for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario crea sus datos" on public.organizador_datos;
create policy "Cada usuario crea sus datos"
  on public.organizador_datos for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario actualiza sus datos" on public.organizador_datos;
create policy "Cada usuario actualiza sus datos"
  on public.organizador_datos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.guardar_datos_organizador(
  p_datos jsonb,
  p_revision_base bigint
)
returns table (revision bigint, actualizado_en timestamptz)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión.' using errcode = '42501';
  end if;

  return query
    insert into public.organizador_datos as guardado
      (user_id, datos, revision, actualizado_en)
    values (auth.uid(), p_datos, 1, now())
    on conflict (user_id) do update
      set datos = excluded.datos,
          revision = guardado.revision + 1,
          actualizado_en = now()
      where guardado.revision = p_revision_base
    returning guardado.revision, guardado.actualizado_en;
end;
$$;

revoke all on function public.guardar_datos_organizador(jsonb, bigint) from public;
grant execute on function public.guardar_datos_organizador(jsonb, bigint) to authenticated;

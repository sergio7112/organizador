-- Notificaciones push del Organizador.
-- Cada dispositivo suscrito guarda su endpoint y sus claves; el envío lo hace
-- la función `notificaciones` con la clave de servicio, nunca el navegador.

-- Restos de la primera versión, por si ya se había aplicado.
drop function if exists public.registrar_suscripcion_push(text, text, text, text);
drop table if exists public.organizador_notificaciones_enviadas;
drop table if exists public.organizador_suscripciones_push;

create table if not exists public.push_suscripciones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  zona text not null default 'UTC',
  creada_en timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

create index if not exists push_suscripciones_usuario_idx
  on public.push_suscripciones (user_id);

-- El registro de envíos evita repetir un aviso ya mandado el mismo día.
create table if not exists public.push_enviadas (
  suscripcion_id uuid not null references public.push_suscripciones (id) on delete cascade,
  clave text not null,
  enviada_en timestamptz not null default now(),
  primary key (suscripcion_id, clave)
);

alter table public.push_suscripciones enable row level security;
alter table public.push_enviadas enable row level security;

-- El navegador solo puede leer y borrar sus propios dispositivos, y siempre a
-- través de las funciones de abajo.
revoke all on table public.push_suscripciones from anon, authenticated;
grant select, delete on table public.push_suscripciones to authenticated;
-- La función de notificaciones usa la clave de servicio para leer y limpiar.
grant select, insert, update, delete on table public.push_suscripciones to service_role;

revoke all on table public.push_enviadas from anon, authenticated;
grant select, insert, delete on table public.push_enviadas to service_role;

drop policy if exists "Cada usuario ve sus dispositivos" on public.push_suscripciones;
create policy "Cada usuario ve sus dispositivos"
  on public.push_suscripciones for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Cada usuario quita sus dispositivos" on public.push_suscripciones;
create policy "Cada usuario quita sus dispositivos"
  on public.push_suscripciones for delete to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.push_guardar_suscripcion(
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_zona text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión.' using errcode = '42501';
  end if;

  if coalesce(p_endpoint, '') = '' or coalesce(p_p256dh, '') = '' or coalesce(p_auth, '') = '' then
    raise exception 'La suscripción está incompleta.';
  end if;

  insert into public.push_suscripciones
    (user_id, endpoint, p256dh, auth, zona, actualizada_en)
  values (
    auth.uid(),
    p_endpoint,
    p_p256dh,
    p_auth,
    coalesce(nullif(p_zona, ''), 'UTC'),
    now()
  )
  on conflict (endpoint) do update
    set user_id = auth.uid(),
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        zona = excluded.zona,
        actualizada_en = now();
end;
$$;

create or replace function public.push_eliminar_suscripcion(p_endpoint text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión.' using errcode = '42501';
  end if;

  delete from public.push_suscripciones
  where endpoint = p_endpoint and user_id = auth.uid();
end;
$$;

create or replace function public.push_actualizar_zona(p_endpoint text, p_zona text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Se requiere una sesión.' using errcode = '42501';
  end if;

  update public.push_suscripciones
  set zona = coalesce(nullif(p_zona, ''), 'UTC'),
      actualizada_en = now()
  where endpoint = p_endpoint and user_id = auth.uid();
end;
$$;

revoke all on function public.push_guardar_suscripcion(text, text, text, text) from public;
revoke all on function public.push_eliminar_suscripcion(text) from public;
revoke all on function public.push_actualizar_zona(text, text) from public;

grant execute on function public.push_guardar_suscripcion(text, text, text, text) to authenticated;
grant execute on function public.push_eliminar_suscripcion(text) to authenticated;
grant execute on function public.push_actualizar_zona(text, text) to authenticated;

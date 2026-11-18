-- Programa el envío de notificaciones cada minuto.
-- Ejecútalo en el SQL Editor DESPUÉS de aplicar la migración y de desplegar la
-- función, sustituyendo <PROJECT-REF> y <NOTIFICACIONES_CRON_SECRET>.
-- El secreto debe coincidir con el que pongas en Supabase como
-- NOTIFICACIONES_CRON_SECRET (Edge Functions > Secrets).

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Para volver a ejecutarlo, borra los secretos anteriores:
--   select vault.delete_secret('organizador_notificaciones_url');
--   select vault.delete_secret('organizador_notificaciones_cron');

select vault.create_secret(
  'https://<PROJECT-REF>.supabase.co/functions/v1/notificaciones',
  'organizador_notificaciones_url'
);

select vault.create_secret(
  '<NOTIFICACIONES_CRON_SECRET>',
  'organizador_notificaciones_cron'
);

select cron.unschedule('organizador_notificaciones')
where exists (
  select 1 from cron.job where jobname = 'organizador_notificaciones'
);

select cron.schedule(
  'organizador_notificaciones',
  '* * * * *',
  $$
    select net.http_post(
      url := (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'organizador_notificaciones_url'
      ),
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-organizador-cron', (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'organizador_notificaciones_cron'
        )
      ),
      body := '{}'::jsonb
    );
  $$
);

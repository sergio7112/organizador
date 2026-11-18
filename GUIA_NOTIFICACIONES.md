# Activar las notificaciones (guía rápida)

Solo hay que hacerlo una vez. Tiempo aproximado: 15 minutos.

## Antes de empezar

- Tu proyecto de Supabase abierto en el navegador.
- El repositorio abierto en el ordenador (esta carpeta).
- El móvil Android con Chrome.

> Guarda las dos claves del paso 1: la **pública** va en la app y la **privada**
> solo en Supabase. No las mezcles.

## Paso 1 · Crear las claves

En la carpeta del proyecto:

```bash
npx web-push generate-vapid-keys
```

Si te pregunta si instalar el paquete, responde `y`. Copia los dos valores que aparecen:

- `Public Key` → la usarás en el paso 2 y en el paso 3.
- `Private Key` → solo en el paso 3.

## Paso 2 · Dar la clave pública a la app

GitHub → tu repositorio → **Settings** → **Secrets and variables** → **Actions**
→ pestaña **Variables** → **New repository variable**:

| Nombre | Valor |
| --- | --- |
| `VITE_VAPID_PUBLIC_KEY` | la `Public Key` del paso 1 |

## Paso 3 · Configurar Supabase

En la carpeta del proyecto, sustituye `<ref>` por el identificador de tu
proyecto (está en la URL de Supabase: `https://supabase.com/dashboard/project/<ref>`)
y `<private-key>` por la clave privada del paso 1.

```bash
npx supabase login
npx supabase link --project-ref <ref>
npx supabase secrets set VAPID_PUBLIC_KEY=<public-key> VAPID_PRIVATE_KEY=<private-key> "VAPID_SUBJECT=mailto:tu-correo@example.com" NOTIFICACIONES_CRON_SECRET=<secreto-largo>
npx supabase functions deploy notificaciones
```

Si `link` te pide la contraseña de la base de datos, puedes dejarla en blanco.

El `<secreto-largo>` puedes generarlo así:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Apunta ese secreto: se usa otra vez en el paso 5.

## Paso 4 · Crear las tablas

Supabase → **SQL Editor** → **New query**. Abre el archivo
`supabase/migrations/20261116000000_notificaciones_push.sql`, pega todo su
contenido y pulsa **Run**. Debe terminar con «Success».

## Paso 5 · Activar el envío automático

Abre `supabase/activar_notificaciones.sql` en tu editor y cambia solo dos cosas:

- `<PROJECT-REF>` → el `<ref>` del paso 3.
- `<NOTIFICACIONES_CRON_SECRET>` → el secreto largo del paso 3.

Pega el archivo entero en el **SQL Editor** de Supabase y pulsa **Run**.

Esto hace que Supabase revise cada minuto si toca enviar algún aviso.

## Paso 6 · Publicar y probar

1. Sube los cambios a GitHub (o publica desde GitHub Actions).
2. Espera a que termine la publicación.
3. En el móvil, abre la app publicada → **Ajustes**.
4. En «Notificaciones en el móvil» pulsa **Activar en este dispositivo** y acepta
   el permiso de Chrome.
5. Pulsa **Enviar prueba**: debe llegarte una notificación en unos segundos.

## Usarlas

En la misma tarjeta de Ajustes:

- **Resumen diario**: tareas pendientes, atrasadas y hábitos por marcar, a la
  hora que elijas.
- **Aviso para mañana**: tareas y exámenes del día siguiente, a la hora que
  elijas.

Los dos interruptores son independientes. Las horas son las del móvil.

## Si algo no funciona

- **No llega la prueba**: revisa Supabase → **Edge Functions** → `notificaciones`
  → **Logs**. Lo más habitual es que falte una clave en los secretos.
- **El botón está desactivado y dice que falta la clave pública**: añade
  `VITE_VAPID_PUBLIC_KEY` en GitHub (paso 2) y vuelve a publicar; la clave se
  mete en la app al compilar.
- **Chrome no pide permiso o está bloqueado**: candado de la barra de
  direcciones → Notificaciones → Permitir, y recarga.
- **El cron no envía nada**: en el SQL Editor ejecuta
  `select jobname, schedule from cron.job;` y comprueba que aparece
  `organizador_notificaciones`.
- **Quieres dejar de recibirlas en un móvil**: Ajustes → **Desactivar en este
  dispositivo**.

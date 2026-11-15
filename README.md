# Organizador · Estudios

Aplicación personal en español para organizar asignaturas, temario, exámenes, tareas, calendario, proyectos y repasos. Se publica como PWA en GitHub Pages y sincroniza los datos entre dispositivos con Supabase.

## Configuración inicial

1. Crea un proyecto en Supabase.
2. En el SQL Editor de Supabase ejecuta [`supabase/migrations/20261115000000_datos_usuario.sql`](supabase/migrations/20261115000000_datos_usuario.sql).
3. En Authentication → URL Configuration, añade `https://sergio7112.github.io/organizador/` como URL del sitio y como URL de redirección.
4. En GitHub, abre Settings → Secrets and variables → Actions → Variables y crea:
   - `VITE_SUPABASE_URL`: Project URL de Supabase.
   - `VITE_SUPABASE_ANON_KEY`: clave pública (anon/publishable) del proyecto.
5. En Settings → Pages, configura la publicación desde GitHub Actions.
6. En Supabase → Authentication → Providers → Email, deja activado el acceso por correo y contraseña. Puedes desactivar la confirmación por correo para empezar a usar la app inmediatamente; si la mantienes, confirma el correo al crear la cuenta.
7. Sube los cambios a `main`. GitHub Actions compilará y publicará la aplicación en `https://sergio7112.github.io/organizador/`.

La clave pública de Supabase queda incluida en la web publicada. Es normal: las políticas RLS de la migración limitan las lecturas y escrituras al usuario autenticado. No añadas nunca una clave `service_role` a GitHub ni a la app.

## Usar la app

Abre el sitio en el móvil y el ordenador, crea una cuenta y entra con el mismo correo y contraseña. Desde Ajustes puedes ver el estado, forzar una sincronización, cerrar sesión y exportar o importar copias JSON. Los cambios se guardan en el navegador y se sincronizan con Supabase; la PWA también permite seguir trabajando sin conexión y enviar los cambios cuando vuelva la red.

### Traer datos de la versión anterior

En la versión anterior, abre Ajustes → Copia de seguridad → Exportar JSON. En esta versión, inicia sesión y usa Importar JSON. La importación reemplaza los datos de ese usuario y se sincroniza automáticamente.

## Desarrollo local

Requiere Node.js 22 o superior.

```bash
npm install
```

Copia `.env.example` a `.env.local` y añade la URL y clave pública de Supabase. Luego ejecuta:

```bash
npm run dev
```

La sincronización guarda una fila por usuario en `organizador_datos`. La función SQL usa una revisión condicional para detectar escrituras simultáneas; la app conserva su fusión a tres bandas para reunir cambios hechos en ambos dispositivos.

## Tecnologías

- Vite, React, TypeScript, Tailwind CSS y Zustand.
- Supabase Auth, Postgres y Row Level Security.
- HashRouter para que las rutas funcionen en GitHub Pages sin configuración de servidor.
- Vitest para pruebas de dominio y sincronización.

# Guía de aplicaciones (Windows y Android)

El mismo código genera ahora tres cosas:

- **La web** (la de siempre, en GitHub Pages): `npm run build`.
- **La app de Windows**: Electron, con ventana propia e instalador.
- **La app de Android**: Capacitor, que genera un APK instalable.

Las apps no abren el navegador ni necesitan el script `abrir-organizador.ps1`. Se conectan a Supabase con la misma cuenta, así que los datos se sincronizan con la web y con el móvil.

## Antes de compilar una app

Las apps empaquetan la configuración de Supabase **en el momento de compilar**. Necesitas un archivo `.env.local` en la raíz del proyecto (no se sube a GitHub):

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
VITE_VAPID_PUBLIC_KEY=tu-clave-publica-vapid
```

La clave VAPID es opcional; solo hace falta para notificaciones push. Si el archivo no existe, la app compila pero muestra el aviso «Supabase todavía no está configurado» y no permite iniciar sesión. La URL y la clave pública se pueden copiar de `.env.example` o de las Variables del repositorio en GitHub.

Después de cambiar esas variables, vuelve a compilar la app.

## App de Windows

Requisito: Node.js 22 o superior (no hace falta Rust ni Visual Studio).

Probarla sin instalar:

```bash
npm install
npm run app:start
```

Eso compila en modo app y abre una ventana de Electron. Para generar los instaladores:

```bash
npm run app:build:win
```

Aparecen en la carpeta `release/`:

- `Organizador-0.3.0-x64.exe` — instalador (permite elegir carpeta, crea accesos en escritorio y menú de inicio).
- `Organizador-Portable.exe` — ejecutable portable, sin instalación.

Para comprobar solo el empaquetado sin generar instaladores: `npm run app:build:dir`.

## App de Android (APK)

### Opción A: compilar en GitHub Actions (sin instalar nada en el PC)

Los servidores de GitHub ya traen Java y el SDK de Android instalados:

1. Sube el proyecto a GitHub con las carpetas `.github`, `android`, `electron` y los archivos `capacitor.config.ts` y `electron-builder.yml`.
2. En Settings → Secrets and variables → Actions → **Variables**, confirma que están `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (las mismas que usa la web).
3. En la pestaña Actions, ejecuta el workflow **Compilar APK de Android** (botón *Run workflow*). También se lanza al subir una etiqueta `v*`.
4. Al terminar, descarga el artefacto `organizador-apk`, descomprímelo y copia `app-debug.apk` al móvil.
5. En el móvil, abre el APK y acepta «Instalar aplicaciones desconocidas» (o activa el permiso para el explorador de archivos).

### Opción B: compilar en el PC con Android Studio

1. Instala Android Studio (incluye JDK y el SDK de Android).
2. Compila la web en modo app y sincroniza los archivos:

   ```bash
   npm run app:sync:android
   ```

   Repite este comando siempre que cambies código, antes de compilar el APK. No uses `npx cap sync android` directamente sin antes compilar en modo app: la compilación web normal usa rutas de GitHub Pages y no funciona dentro del APK.

3. Abre el proyecto: `npx cap open android` (o `npm run app:open:android`, que hace los dos pasos).
4. En Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**. El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

El APK de depuración sirve para instalarlo uno mismo. Para publicarlo en Google Play haría falta un APK de release firmado con tu propia clave.

## Notas y limitaciones

- **Notificaciones push:** el sistema actual (`GUIA_NOTIFICACIONES.md`) usa un service worker y Web Push, pensado para la PWA. En la app de Android conviene sustituirlo por notificaciones nativas (por ejemplo, `@capacitor/local-notifications`); la app se abre y sincroniza igual, pero esos avisos en segundo plano pueden no llegar.
- **Confirmación de cuenta por correo:** los enlaces de confirmación se abren en el navegador. Después vuelves a la app y entras con tu correo y contraseña.
- **Datos sin conexión:** la app guarda los cambios en el almacenamiento de su propia WebView y los sube a Supabase cuando vuelve la red, igual que la PWA.
- **Los workflows no se han ejecutado todavía** desde esta carpeta: la compilación de Windows y la de Android se comprueban al subir el código a GitHub (o con Android Studio en local).

# Organizador · Estudios

Aplicación personal para organizar el curso de 2.º de Bachillerato: asignaturas y temario, exámenes, tareas, calendario, proyectos con notas en Markdown, repaso espaciado y cuaderno de errores.

Está pensada para usarse en el ordenador y en el móvil, con una interfaz **100 % en español**, cómoda con una sola mano y con almacenamiento local y una copia online privada opcional mediante una cuenta personal. La aplicación puede instalarse y usarse **sin conexión**; guardar o recuperar la copia online requiere Internet.

## Funcionalidades

- **Hoy**: resumen del día con el siguiente examen, repasos pendientes, sugerencia de estudio y tareas de hoy o atrasadas.
- **Asignaturas**: alta, edición y borrado de asignaturas y temas; estados del tema (sin empezar, estudiando, repasado, dominado), nota, progreso y errores abiertos.
- **Exámenes**: próximos y pasados, cuenta atrás, progreso del temario y aviso del examen más cercano.
- **Tareas**: prioridad, fecha límite, vínculo con asignatura o proyecto y agrupación por estado.
- **Calendario**: vista mensual y semanal con exámenes y entregas, navegación por fechas y filtro por asignatura.
- **Proyectos**: progreso de checklist, tareas vinculadas y notas con Markdown (con guardado automático y vista previa GFM).
- **Repaso**: repasos a 1, 3 y 7 días al pasar un tema a «Estudiando», con repasos atrasados, de hoy y próximos.
- **Errores**: registro de qué falló y por qué, filtros, marcar como resuelto, reabrir y borrar.
- **Ajustes**: tema claro/oscuro/sistema, cuenta personal, almacenamiento online privado y copia de seguridad en JSON (exportar e importar).
- **PWA**: instalable, con service worker y caché para funcionar offline tras la primera visita.

## Interfaz

- Identidad rojo y blanco inspirada en Pinterest: tarjetas redondeadas, sombras suaves y acentos cálidos.
- En escritorio hay una barra lateral con todas las secciones; en móvil, una barra inferior con cinco accesos pensada para usarse con una mano.
- Los formularios se abren en diálogos y las acciones destructivas piden confirmación.
- Se adapta a cualquier ancho de pantalla, respeta la preferencia de movimiento reducido y ofrece tema claro, oscuro o sistema.

## Tecnologías

- [Vite](https://vite.dev/) + [React 19](https://react.dev/) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/)
- [Zustand](https://zustand.docs.pmnd.rs/) con `persist` sobre `localStorage`
- [React Router](https://reactrouter.com/)
- [date-fns](https://date-fns.org/) con locale `es`
- [react-markdown](https://github.com/remarkjs/react-markdown) + `remark-gfm`
- [lucide-react](https://lucide.dev/) para la iconografía
- [Vitest](https://vitest.dev/) para las pruebas de dominio

## Puesta en marcha

Requiere Node.js 24 o superior para el servidor de Netlify.

```bash
npm install
npm run dev
```

La interfaz queda disponible en `http://localhost:5173`. Para ejecutar también la API, usa `netlify dev --port 8889`. Netlify Identity requiere el sitio desplegado para probar registro, confirmación y recuperación de contraseña.

> En Windows, si PowerShell bloquea `npm.ps1`, usa `npm.cmd run dev`.

### Scripts

| Comando               | Descripción                                        |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Servidor de desarrollo con recarga en caliente     |
| `npm run build`       | Comprueba TypeScript y genera la versión de producción en `dist/` |
| `npm run preview`     | Sirve la versión de producción localmente          |
| `npm run typecheck`   | Comprobación de tipos sin generar archivos         |
| `npm run test`        | Ejecuta las pruebas una vez                        |
| `npm run test:watch`  | Ejecuta las pruebas en modo vigilancia             |

### Acceso directo en Windows

En el escritorio hay un acceso directo llamado **Organizador de estudios**. Al abrirlo:

- comprueba si hay cambios en `src/` o `public/` y, si los hay, regenera `dist/`;
- arranca en segundo plano la versión de producción en `http://127.0.0.1:4173`;
- abre la aplicación en el navegador.

El acceso directo ejecuta el script `abrir-organizador.ps1`. Para detener el servidor local:

```powershell
powershell -ExecutionPolicy Bypass -File .\abrir-organizador.ps1 -Detener
```

El servidor sirve la versión compilada, así que los cambios de código se aplican al volver a abrir el acceso directo.

## Usar en el móvil

La aplicación se publica en Netlify y se abre en el móvil sin tener el ordenador encendido. Al servirse por HTTPS se instala como PWA y funciona sin conexión tras la primera visita.

### Almacenamiento online personal

1. Abre **Ajustes → Almacenamiento online → Crear cuenta** y utiliza tu correo y una contraseña de al menos ocho caracteres.
2. Confirma el correo mediante el enlace recibido e inicia sesión.
3. En el dispositivo que contiene tus datos, pulsa **Guardar online** y confirma. Esto crea o sustituye tu copia privada en Netlify Database.
4. En otro dispositivo, inicia sesión con la misma cuenta y pulsa **Recuperar online**. Antes de sustituir los datos locales se descarga una copia de seguridad en JSON.
5. Tras hacer cambios, vuelve a pulsar **Guardar online**. La sincronización es manual; editar sin conexión guarda únicamente en ese navegador.

**Consultar estado** actualiza la fecha y revisión de la copia sin modificar los datos locales. Si otro dispositivo guarda después de consultar, el servidor rechaza la escritura para evitar sobrescribir cambios inadvertidamente. Consulta la copia y decide qué versión conservar; puedes exportar los datos locales antes de recuperar la versión online. No se combinan automáticamente las versiones.

Al cerrar sesión se conserva la copia local para seguir trabajando sin conexión. En un dispositivo compartido, exporta y elimina los datos del sitio al terminar. La copia online siempre requiere autenticación y está asociada exclusivamente al identificador de la cuenta verificada.

### Publicar en Netlify

Conecta el repositorio para desplegar tanto la interfaz como el servidor y las migraciones. La publicación de solo `dist/` mediante arrastrar y soltar sirve la interfaz, pero no incluye el almacenamiento online. Netlify aplica las migraciones de `netlify/database/migrations/` durante el despliegue; no hay que ejecutarlas manualmente.

Abre `https://organizador-es.netlify.app` en el móvil y usa «Añadir a pantalla de inicio» en Chrome o Safari.

### Sin publicar: misma red Wi-Fi

También puedes usarla sin cuenta, con el ordenador encendido y ambos dispositivos en la misma red:

1. Abre el acceso directo **Organizador en el móvil** (o ejecuta `powershell -ExecutionPolicy Bypass -File .\abrir-organizador.ps1 -Movil`).
2. Aparecerá una dirección como `http://192.168.0.16:4173/hoy`, ya copiada al portapapeles. Si Windows pregunta por el firewall, permite el acceso en redes privadas.
3. Escríbela en el navegador del móvil.

> Por abrirse con `http://`, en este modo el navegador no permite instalar la PWA completa ni usar el service worker: no hay modo sin conexión y el ordenador debe estar encendido.

## Estructura del proyecto

```text
src/
  components/      Componentes de interfaz (layout, formularios, tarjetas…)
  domain/          Lógica pura sin React: fechas, exámenes, repasos, datos iniciales…
    __tests__/     Pruebas de dominio y de importación/exportación
  hooks/           Hooks compartidos (tema visual)
  lib/             Utilidades de formato y sincronización JSON
  pages/           Una página por sección de la aplicación
  store/           Estado global con Zustand y persistencia
public/
  manifest.webmanifest, sw.js, iconos…
```

La lógica de dominio no depende de React ni del almacenamiento, de modo que se puede probar y reutilizar con facilidad.

## Datos y persistencia

- Los datos se guardan en `localStorage` bajo la clave `organizador:v1`.
- El store está versionado y normaliza los datos guardados al cargar, completando listas y ajustes que falten.
- Las fechas de exámenes, tareas y repasos se almacenan como `AAAA-MM-DD`, sin hora, para evitar problemas de zona horaria.
- El porcentaje de dominio de una asignatura cuenta únicamente los temas en estado «Dominado».
- El almacenamiento online usa Netlify Identity para la cuenta y Netlify Database (Postgres con Drizzle) para los datos privados. La API valida el contenido con las mismas reglas que la importación JSON, limita las copias a 5 MB y comprueba la revisión de cada escritura.

### Copia de seguridad y sincronización

Además de la copia online manual, siguen disponibles los **archivos JSON**:

1. En **Ajustes → Copia de seguridad**, pulsa **Exportar JSON**. Se descarga un archivo `organizador-AAAA-MM-DD.json` con todo el contenido.
2. En el otro dispositivo, abre la aplicación y usa **Importar JSON**.
3. La importación valida el archivo (versión, tipos, identificadores y referencias entre entidades) y pide confirmación antes de sustituir los datos actuales.

El archivo incluye una cabecera con el formato, la versión y la fecha de exportación. La API online reutiliza la validación de `src/lib/sync.ts`; el cliente online está en `src/lib/online.ts`.

## PWA y uso sin conexión

- `public/manifest.webmanifest` define el nombre, los colores, los iconos y los accesos directos.
- `public/sw.js` guarda el shell de la aplicación y los recursos estáticos:
  - las navegaciones van primero a la red y, si fallan, se sirve `index.html` desde caché;
  - los recursos de `/assets/` se cachean al usarlos por primera vez.
- El service worker se registra **solo en producción** (`npm run build`), no en desarrollo.
- Tras la primera visita con conexión, la app funciona offline. Si cambias la app, sube `CACHE_VERSION` en `public/sw.js` para invalidar la caché anterior.

Para probarlo:

```bash
npm run build
npm run preview
```

Abre la aplicación, espera a que se registre el service worker y recarga. Después puedes cortar la conexión (o detener el servidor) y seguir navegando.

## Despliegue

La interfaz se publica desde `dist/`. El almacenamiento online requiere el servidor de `netlify/server/index.mjs` y la base de datos de Netlify. El esquema está en `db/schema.ts` y las migraciones se generan con `npx drizzle-kit generate --name nombre_descriptivo`.

Como se usa `BrowserRouter`, las rutas de la interfaz se redirigen a `index.html` para que funcionen los enlaces directos como `/asignaturas` o `/repaso`. Las rutas `/api/*` quedan reservadas al servidor. Se incluyen `public/_headers` (sin caché para `sw.js` e `index.html`) y `netlify.toml`; si se conecta el proyecto a un repositorio, Netlify compila y publica automáticamente.

## Decisiones de diseño

- **Repaso espaciado**: al pasar un tema a «Estudiando» se programan repasos a 1, 3 y 7 días. Completar los de 1 y 3 días deja el tema en «Repasado»; completar el de 7 días lo marca como «Dominado» y cierra los repasos pendientes que queden.
- **Tema visual**: claro, oscuro o sistema, guardado en los ajustes y aplicado antes del primer pintado. La identidad principal es rojo y blanco, inspirada en Pinterest: fondos blancos, tarjetas redondeadas y rojo `#e60023` para acciones y navegación. Los colores de asignatura y proyecto quedan como pequeños acentos de identificación (puntos y eventos del calendario) dentro de una paleta cálida de rojos, granates, rosas, corales, terracotas, naranjas y ámbar; las barras de progreso usan siempre el rojo principal.
- **Sin datos de ejemplo**: la aplicación arranca completamente vacía. Las versiones anteriores incluían un conjunto de ejemplo; al actualizar se elimina y solo se conservan las preferencias de tema y vista del calendario. Ya no existe la opción de restaurar esos datos.
- **Fuera de alcance**: Pomodoro, estadísticas de tiempo, colaboración entre cuentas y notificaciones push.

## Pruebas

```bash
npm run test
```

Las pruebas cubren el cálculo de progreso de exámenes, los eventos del calendario, las tareas del día, los intervalos de repaso y la validación de las copias de seguridad (incluyendo referencias inexistentes, versiones futuras e identificadores repetidos). También cubren la autenticación de la API, el aislamiento por cuenta, la protección de origen y los conflictos entre dispositivos.

## Estructura de datos

Las entidades principales son `Asignatura`, `Tema`, `Examen`, `Tarea`, `Proyecto`, `ItemChecklist`, `Repaso` y `ErrorTema`. Todas ellas se guardan dentro de un objeto `Datos` versionado, junto con los `Ajustes` de la aplicación. Los identificadores se generan en el cliente y las relaciones se validan al importar una copia.

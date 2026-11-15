# Organizador · Estudios

Aplicación personal para organizar el curso de 2.º de Bachillerato: asignaturas y temario, exámenes, tareas, calendario, proyectos con notas en Markdown, repaso espaciado y cuaderno de errores.

Está pensada para usarse en el ordenador y en el móvil, con una interfaz **100 % en español**, cómoda con una sola mano y sin cuentas ni servidores. Todo el contenido se guarda en el navegador y la aplicación puede instalarse y usarse **sin conexión**.

## Funcionalidades

- **Hoy**: resumen del día con el siguiente examen, repasos pendientes, sugerencia de estudio y tareas de hoy o atrasadas.
- **Asignaturas**: alta, edición y borrado de asignaturas y temas; estados del tema (sin empezar, estudiando, repasado, dominado), nota, progreso y errores abiertos.
- **Exámenes**: próximos y pasados, cuenta atrás, progreso del temario y aviso del examen más cercano.
- **Tareas**: prioridad, fecha límite, vínculo con asignatura o proyecto y agrupación por estado.
- **Calendario**: vista mensual y semanal con exámenes y entregas, navegación por fechas y filtro por asignatura.
- **Proyectos**: progreso de checklist, tareas vinculadas y notas con Markdown (con guardado automático y vista previa GFM).
- **Repaso**: repasos a 1, 3 y 7 días al pasar un tema a «Estudiando», con repasos atrasados, de hoy y próximos.
- **Errores**: registro de qué falló y por qué, filtros, marcar como resuelto, reabrir y borrar.
- **Ajustes**: tema claro/oscuro/sistema y copia de seguridad en JSON (exportar e importar).
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

Requiere Node.js 22 o superior (probado con Node.js 26 y npm 11).

```bash
npm install
npm run dev
```

La aplicación queda disponible en `http://localhost:5173`.

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

La aplicación es una web estática, así que puede publicarse una vez en Internet y usarse desde el móvil sin tener el ordenador encendido. Al servirse por HTTPS se instala como PWA y funciona sin conexión tras la primera visita.

### Publicar en Netlify (recomendado)

1. Ejecuta `npm run build` para generar la carpeta `dist/`.
2. Entra en <https://app.netlify.com/drop> y arrastra la carpeta `dist` o el archivo `Organizador-web.zip` que hay en el escritorio.
3. Crea una cuenta gratuita para conservar el sitio y cambia el nombre en **Site configuration → Site details → Change site name** (por ejemplo, `organizador-sergi`). La dirección quedará como `https://organizador-sergi.netlify.app`.
4. Abre esa dirección en el móvil y añádela a la pantalla de inicio:
   - **Android (Chrome)**: menú ⋮ → «Añadir a pantalla de inicio».
   - **iPhone (Safari)**: botón Compartir → «Añadir a pantalla de inicio».
5. Los datos se guardan en el navegador de cada dispositivo. Para pasarlos de uno a otro, usa **Ajustes → Exportar JSON** en un dispositivo e **Importar JSON** en el otro.

Para actualizar la app, vuelve a ejecutar `npm run build` y arrastra de nuevo `dist` a Netlify. Los archivos `public/_redirects` y `netlify.toml` hacen que rutas como `/repaso` funcionen al abrirlas directamente.

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
- No hay cuentas ni envío de datos a ningún servidor.

### Copia de seguridad y sincronización

La sincronización elegida es **manual mediante archivos JSON**:

1. En **Ajustes → Copia de seguridad**, pulsa **Exportar JSON**. Se descarga un archivo `organizador-AAAA-MM-DD.json` con todo el contenido.
2. En el otro dispositivo, abre la aplicación y usa **Importar JSON**.
3. La importación valida el archivo (versión, tipos, identificadores y referencias entre entidades) y pide confirmación antes de sustituir los datos actuales.

El archivo incluye una cabecera con el formato, la versión y la fecha de exportación. La interfaz de sincronización está aislada en `SyncAdapter` (`src/lib/sync.ts`), de forma que en el futuro podría añadirse otro adaptador (por ejemplo, un servidor) sin cambiar las páginas.

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

El resultado del build está en `dist/`. Puede publicarse en cualquier alojamiento estático (Netlify, Vercel, GitHub Pages, un servidor propio…).

Como se usa `BrowserRouter`, el servidor debe redirigir las rutas desconocidas a `index.html` para que funcionen los enlaces directos como `/asignaturas` o `/repaso`. Para Netlify se incluyen `public/_redirects`, `public/_headers` (sin caché para `sw.js` e `index.html`) y `netlify.toml`; si se conecta el proyecto a un repositorio, Netlify compila y publica automáticamente.

## Decisiones de diseño

- **Repaso espaciado**: al pasar un tema a «Estudiando» se programan repasos a 1, 3 y 7 días. Completar los de 1 y 3 días deja el tema en «Repasado»; completar el de 7 días lo marca como «Dominado» y cierra los repasos pendientes que queden.
- **Tema visual**: claro, oscuro o sistema, guardado en los ajustes y aplicado antes del primer pintado. La identidad principal es rojo y blanco, inspirada en Pinterest: fondos blancos, tarjetas redondeadas y rojo `#e60023` para acciones y navegación. Los colores de asignatura y proyecto quedan como pequeños acentos de identificación (puntos y eventos del calendario) dentro de una paleta cálida de rojos, granates, rosas, corales, terracotas, naranjas y ámbar; las barras de progreso usan siempre el rojo principal.
- **Sin datos de ejemplo**: la aplicación arranca completamente vacía. Las versiones anteriores incluían un conjunto de ejemplo; al actualizar se elimina y solo se conservan las preferencias de tema y vista del calendario. Ya no existe la opción de restaurar esos datos.
- **Fuera de alcance**: Pomodoro, estadísticas de tiempo, cuentas de usuario y notificaciones push.

## Pruebas

```bash
npm run test
```

Las pruebas cubren el cálculo de progreso de exámenes, los eventos del calendario, las tareas del día, los intervalos de repaso y la validación de las copias de seguridad (incluyendo referencias inexistentes, versiones futuras e identificadores repetidos).

## Estructura de datos

Las entidades principales son `Asignatura`, `Tema`, `Examen`, `Tarea`, `Proyecto`, `ItemChecklist`, `Repaso` y `ErrorTema`. Todas ellas se guardan dentro de un objeto `Datos` versionado, junto con los `Ajustes` de la aplicación. Los identificadores se generan en el cliente y las relaciones se validan al importar una copia.

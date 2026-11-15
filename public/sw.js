/* Service worker del Organizador.
 * Estrategia:
 *  - Navegación: red primero y, si falla, index.html guardado (offline).
 *  - Recursos estáticos: caché primero y se guardan al usarlos por primera vez.
 * Sube CACHE_VERSION al publicar cambios importantes de la app.
 */
const CACHE_VERSION = 'organizador-v6'
const CACHE = `${CACHE_VERSION}-estatico`
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await cache.addAll(APP_SHELL)

      // Lista generada en el build con todos los recursos (incluidos los
      // fragmentos que se cargan de forma diferida).
      try {
        const respuesta = await fetch('/precache-manifest.json', {
          cache: 'no-store',
        })
        if (respuesta.ok) {
          const recursos = await respuesta.json()
          if (Array.isArray(recursos)) await cache.addAll(recursos)
        }
      } catch {
        // Sin la lista, la app sigue funcionando con la caché por demanda.
      }

      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) =>
        Promise.all(
          claves
            .filter((clave) => clave.startsWith('organizador-') && clave !== CACHE)
            .map((clave) => caches.delete(clave)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) return

  const esNavegacion =
    request.mode === 'navigate' ||
    (request.headers.get('accept') || '').includes('text/html')

  if (esNavegacion) {
    event.respondWith(
      fetch(request)
        .then((respuesta) => {
          // Si la red responde con un error (por ejemplo, un proxy sin
          // conexión), se usa la copia guardada en lugar de mostrar el error.
          if (!respuesta.ok) {
            throw new Error(`HTTP ${respuesta.status}`)
          }
          const copia = respuesta.clone()
          caches
            .open(CACHE)
            .then((cache) => cache.put('/index.html', copia))
            .catch(() => {})
          return respuesta
        })
        .catch(async () => {
          const cache = await caches.open(CACHE)
          return (
            (await cache.match('/index.html', { ignoreVary: true })) ||
            (await cache.match('/', { ignoreVary: true })) ||
            new Response(
              '<!doctype html><html lang="es"><meta charset="utf-8"><title>Sin conexión</title><body style="font-family:system-ui;padding:2rem"><h1>Sin conexión</h1><p>Abre la aplicación una vez con conexión para poder usarla offline.</p></body></html>',
              { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
            )
          )
        }),
    )
    return
  }

  event.respondWith(
    // `ignoreVary` evita fallos con respuestas que incluyen `Vary: Origin`:
    // los módulos con `crossorigin` envían cabecera Origin y los recursos
    // precargados no, aunque la URL sea la misma.
    caches.match(request, { ignoreVary: true }).then((cacheado) => {
      if (cacheado) return cacheado

      return fetch(request).then((respuesta) => {
        if (
          respuesta.ok &&
          (url.pathname.startsWith('/assets/') ||
            /\.(?:css|js|mjs|json|svg|png|ico|woff2?)$/i.test(url.pathname))
        ) {
          const copia = respuesta.clone()
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copia))
            .catch(() => {})
        }
        return respuesta
      })
    }),
  )
})

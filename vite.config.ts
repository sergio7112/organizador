import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Genera una lista de los recursos con hash del build para que el service
 * worker pueda precargarlos y la aplicación funcione offline por completo,
 * incluidas las páginas que se cargan de forma diferida.
 */
function precacheManifest(base: string): Plugin {
  return {
    name: 'organizador-precache-manifest',
    apply: 'build',
    generateBundle(_opciones, bundle) {
      const rutas = Object.keys(bundle)
        .filter((archivo) => archivo.startsWith('assets/'))
        .map((archivo) => `${base}${archivo}`)
        .sort()

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(rutas, null, 2),
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const base = mode === 'production' ? '/organizador/' : '/'
  return {
    base,
    plugins: [react(), tailwindcss(), precacheManifest(base)],
    server: {
      port: 5173,
      host: true,
    },
  }
})

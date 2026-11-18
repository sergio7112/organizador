import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Configuración de la app de Android. La web sigue funcionando igual: este
 * archivo solo se usa al ejecutar `npx cap sync android` sobre un build hecho
 * con `npm run build:app` (rutas relativas y sin service worker).
 */
const config: CapacitorConfig = {
  appId: 'com.sergio7112.organizador',
  appName: 'Organizador',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
}

export default config

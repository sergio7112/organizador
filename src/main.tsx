import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// El service worker solo se registra en la web publicada: en desarrollo
// interferiría con la recarga en caliente y en las apps empaquetadas (Electron
// y Capacitor) los recursos ya van dentro del paquete y no necesita caché.
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.MODE !== 'app') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error: unknown) => {
      console.warn('No se pudo registrar el service worker.', error)
    })
  })
}

import { useEffect } from 'react'
import { useAppStore } from '../store/useAppStore'

/** Aplica el tema claro/oscuro/sistema al documento. */
export function useAplicarTema() {
  const tema = useAppStore((estado) => estado.datos.ajustes.tema)

  useEffect(() => {
    const preferencia = window.matchMedia('(prefers-color-scheme: dark)')

    const aplicar = () => {
      const oscuro =
        tema === 'oscuro' || (tema === 'sistema' && preferencia.matches)
      document.documentElement.classList.toggle('dark', oscuro)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', oscuro ? '#0f1419' : '#1f4e79')
    }

    aplicar()
    preferencia.addEventListener('change', aplicar)
    return () => preferencia.removeEventListener('change', aplicar)
  }, [tema])
}

import { useCallback, useEffect, useState } from 'react'

interface EventoInstalacion extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

/** La app se está mostrando como aplicación instalada, sin barra del navegador. */
export function estaInstalada(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * Gestiona el aviso de instalación del navegador (`beforeinstallprompt`) para
 * poder ofrecer un botón propio dentro de Ajustes.
 */
export function useInstalacionApp() {
  const [evento, setEvento] = useState<EventoInstalacion | null>(null)
  const [instalada, setInstalada] = useState(estaInstalada)
  const [resultado, setResultado] = useState<'instalada' | 'cancelada' | null>(null)

  useEffect(() => {
    const alPoderInstalar = (nuevo: Event) => {
      nuevo.preventDefault()
      setEvento(nuevo as EventoInstalacion)
    }

    const alInstalar = () => {
      setInstalada(true)
      setEvento(null)
      setResultado('instalada')
    }

    const pantalla = window.matchMedia('(display-mode: standalone)')
    const alCambiarPantalla = () => setInstalada(estaInstalada())

    window.addEventListener('beforeinstallprompt', alPoderInstalar)
    window.addEventListener('appinstalled', alInstalar)
    pantalla.addEventListener('change', alCambiarPantalla)

    return () => {
      window.removeEventListener('beforeinstallprompt', alPoderInstalar)
      window.removeEventListener('appinstalled', alInstalar)
      pantalla.removeEventListener('change', alCambiarPantalla)
    }
  }, [])

  const instalar = useCallback(async () => {
    if (!evento) return

    await evento.prompt()
    const eleccion = await evento.userChoice
    setEvento(null)
    setResultado(eleccion.outcome === 'accepted' ? 'instalada' : 'cancelada')
  }, [evento])

  return {
    puedeInstalar: Boolean(evento) && !instalada,
    instalada,
    resultado,
    instalar,
  }
}

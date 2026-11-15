import { create } from 'zustand'
import { getUser, handleAuthCallback, onAuthChange } from '@netlify/identity'
import type { User } from '@netlify/identity'

export const useCuentaStore = create<{
  usuario: User | null
  cargando: boolean
  recuperar: boolean
  invitacion?: string
  mensaje: string
}>(() => ({ usuario: null, cargando: true, recuperar: false, mensaje: '' }))

let inicializacion: Promise<void> | undefined
export function iniciarCuenta() {
  return inicializacion ??= (async () => {
    onAuthChange((_evento, usuario) => useCuentaStore.setState({ usuario }))
    try {
      const callback = await handleAuthCallback()
      useCuentaStore.setState({
        usuario: await getUser(),
        recuperar: callback?.type === 'recovery',
        invitacion: callback?.type === 'invite' ? callback.token : undefined,
      })
      if (callback) window.history.replaceState(null, '', '/ajustes')
    } catch {
      useCuentaStore.setState({ mensaje: 'No se pudo verificar el enlace de acceso. Solicita otro enlace e inténtalo de nuevo.' })
      window.history.replaceState(null, '', '/ajustes')
    } finally {
      useCuentaStore.setState({ cargando: false })
    }
  })()
}

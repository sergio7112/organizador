import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase, supabaseConfigurado } from '../lib/supabase'

interface EstadoAuth {
  listo: boolean
  usuarioId: string | null
  correo: string | null
  error: string | null
  inicializar: () => () => void
  entrar: (correo: string, contrasena: string) => Promise<void>
  crearCuenta: (correo: string, contrasena: string) => Promise<boolean>
  salir: () => Promise<void>
}

function aplicarSesion(session: Session | null) {
  useAuthStore.setState({
    listo: true,
    usuarioId: session?.user.id ?? null,
    correo: session?.user.email ?? null,
    error: null,
  })
}

export const useAuthStore = create<EstadoAuth>(() => ({
  listo: false,
  usuarioId: null,
  correo: null,
  error: null,
  inicializar: () => {
    if (!supabase) {
      useAuthStore.setState({ listo: true })
      return () => undefined
    }

    let activo = true
    const { data } = supabase.auth.onAuthStateChange((_evento, session) => {
      if (activo) aplicarSesion(session)
    })
    void supabase.auth.getSession().then(({ data: respuesta, error }) => {
      if (!activo) return
      if (error) useAuthStore.setState({ listo: true, error: error.message })
      else aplicarSesion(respuesta.session)
    })
    return () => {
      activo = false
      data.subscription.unsubscribe()
    }
  },
  entrar: async (correo, contrasena) => {
    if (!supabase) throw new Error('Falta configurar Supabase.')
    const { error } = await supabase.auth.signInWithPassword({
      email: correo.trim(),
      password: contrasena,
    })
    if (error) throw error
  },
  crearCuenta: async (correo, contrasena) => {
    if (!supabase) throw new Error('Falta configurar Supabase.')
    const { data, error } = await supabase.auth.signUp({
      email: correo.trim(),
      password: contrasena,
    })
    if (error) throw error
    return Boolean(data.session)
  },
  salir: async () => {
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}))

export { supabaseConfigurado }

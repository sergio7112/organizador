import { lazy, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { EstructuraApp } from './components/layout/EstructuraApp'
import { useAplicarTema } from './hooks/useAplicarTema'
import { useAppStore } from './store/useAppStore'
import { iniciarSincronizacion, prepararDatosUsuario } from './store/useSyncStore'
import { useAuthStore, supabaseConfigurado } from './store/useAuthStore'
import { PaginaHoy } from './pages/PaginaHoy'
import { PaginaAsignaturas } from './pages/PaginaAsignaturas'
import { PaginaAsignaturaDetalle } from './pages/PaginaAsignaturaDetalle'
import { PaginaExamenes } from './pages/PaginaExamenes'
import { PaginaTareas } from './pages/PaginaTareas'
import { PaginaCalendario } from './pages/PaginaCalendario'
import { PaginaProyectos } from './pages/PaginaProyectos'
import { PaginaHabitos } from './pages/PaginaHabitos'
import { PaginaTiempoEstudio } from './pages/PaginaTiempoEstudio'
import { PaginaAjustes } from './pages/PaginaAjustes'
import { PaginaNoEncontrada } from './pages/PaginaNoEncontrada'

// El editor Markdown es pesado y solo se usa en el detalle de un proyecto.
const PaginaProyectoDetalle = lazy(() =>
  import('./pages/PaginaProyectoDetalle').then((modulo) => ({
    default: modulo.PaginaProyectoDetalle,
  })),
)

export default function App() {
  useAplicarTema()
  const { listo, usuarioId, correo, error: errorAuth, inicializar, entrar, crearCuenta } = useAuthStore()
  const [modoRegistro, setModoRegistro] = useState(false)
  const [correoForm, setCorreoForm] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [mensajeAcceso, setMensajeAcceso] = useState<string | null>(null)
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  // Guarda el estado inicial vacío aunque el usuario no haya cambiado nada.
  useEffect(() => {
    useAppStore.setState({ datos: useAppStore.getState().datos })
  }, [])

  useEffect(() => inicializar(), [inicializar])

  useEffect(() => {
    if (!listo || !usuarioId) return
    prepararDatosUsuario(usuarioId)
    return iniciarSincronizacion(usuarioId)
  }, [listo, usuarioId])

  if (!listo) {
    return <div className="grid min-h-dvh place-items-center text-sm text-[var(--texto-suave)]">Cargando tu sesión…</div>
  }

  if (!usuarioId) {
    const enviarFormulario = async (evento: FormEvent<HTMLFormElement>) => {
      evento.preventDefault()
      setErrorAcceso(null)
      setMensajeAcceso(null)
      setEnviando(true)
      try {
        if (modoRegistro) {
          const sesion = await crearCuenta(correoForm, contrasena)
          if (!sesion) setMensajeAcceso('Revisa tu correo para confirmar la cuenta y después inicia sesión.')
        } else {
          await entrar(correoForm, contrasena)
        }
      } catch (error) {
        setErrorAcceso(error instanceof Error ? error.message : 'No se pudo completar el acceso.')
      } finally {
        setEnviando(false)
      }
    }

    return (
      <main className="grid min-h-dvh place-items-center bg-[var(--fondo)] px-4 py-8">
        <section className="w-full max-w-md rounded-3xl border border-[var(--borde)] bg-[var(--superficie)] p-6 shadow-xl sm:p-8">
          <h1 className="text-2xl font-bold">Organizador</h1>
          <p className="mt-2 text-sm text-[var(--texto-suave)]">Inicia sesión para sincronizar tus datos entre dispositivos.</p>
          {!supabaseConfigurado ? (
            <p role="alert" className="mt-5 rounded-xl bg-[var(--peligro-suave)] p-3 text-sm text-[var(--peligro)]">
              Supabase todavía no está configurado. Añade VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY a las variables del repositorio de GitHub y vuelve a publicar.
            </p>
          ) : (
            <form className="mt-6 grid gap-4" onSubmit={(evento) => void enviarFormulario(evento)}>
              <label className="grid gap-1.5 text-sm font-medium">Correo electrónico
                <input required type="email" autoComplete="email" value={correoForm} onChange={(evento) => setCorreoForm(evento.target.value)} className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5" />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">Contraseña
                <input required minLength={6} type="password" autoComplete={modoRegistro ? 'new-password' : 'current-password'} value={contrasena} onChange={(evento) => setContrasena(evento.target.value)} className="rounded-xl border border-[var(--borde)] bg-[var(--fondo)] px-3 py-2.5" />
              </label>
              {(errorAcceso || errorAuth) && <p role="alert" className="text-sm text-[var(--peligro)]">{errorAcceso ?? errorAuth}</p>}
              {mensajeAcceso && <p role="status" className="text-sm text-[var(--exito)]">{mensajeAcceso}</p>}
              <button disabled={enviando} className="rounded-xl bg-[var(--primario)] px-4 py-3 font-semibold text-white disabled:opacity-60">
                {enviando ? 'Un momento…' : modoRegistro ? 'Crear cuenta' : 'Iniciar sesión'}
              </button>
              <button type="button" className="text-sm text-[var(--primario)]" onClick={() => { setModoRegistro(!modoRegistro); setErrorAcceso(null); setMensajeAcceso(null) }}>
                {modoRegistro ? 'Ya tengo una cuenta' : 'Crear una cuenta nueva'}
              </button>
            </form>
          )}
        </section>
      </main>
    )
  }

  return (
    <Routes>
      <Route element={<EstructuraApp />}>
        <Route index element={<Navigate to="/hoy" replace />} />
        <Route path="hoy" element={<PaginaHoy />} />
        <Route path="asignaturas" element={<PaginaAsignaturas />} />
        <Route path="asignaturas/:id" element={<PaginaAsignaturaDetalle />} />
        <Route path="examenes" element={<PaginaExamenes />} />
        <Route path="tareas" element={<PaginaTareas />} />
        <Route path="calendario" element={<PaginaCalendario />} />
        <Route path="proyectos" element={<PaginaProyectos />} />
        <Route path="proyectos/:id" element={<PaginaProyectoDetalle />} />
        <Route path="habitos" element={<PaginaHabitos />} />
        <Route path="tiempo-estudio" element={<PaginaTiempoEstudio />} />
        <Route path="ajustes" element={<PaginaAjustes correo={correo} />} />
        <Route path="*" element={<PaginaNoEncontrada />} />
      </Route>
    </Routes>
  )
}

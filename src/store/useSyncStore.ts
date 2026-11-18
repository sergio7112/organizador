import { create } from 'zustand'
import { fusionarTresVias, sonIguales } from '../domain/merge'
import { crearDatosVacios } from '../domain/empty'
import type { Datos } from '../domain/types'
import {
  ErrorSync,
  escribirEstadoRemoto,
  guardarMeta,
  leerEstadoRemoto,
  leerMeta,
  type MetaSync,
} from '../lib/syncRemoto'
import { useAppStore, type Tienda } from './useAppStore'

export type EstadoSync =
  | 'inactivo'
  | 'conectando'
  | 'guardando'
  | 'sincronizado'
  | 'error'
  | 'desactivado'
  | 'no_disponible'

export interface TiendaSync {
  estado: EstadoSync
  mensaje: string | null
  ultimaSincronizacion: string | null
  sincronizarAhora: () => Promise<void>
}

/** Cada cuánto se pregunta al servidor si hay cambios de otro dispositivo. */
const INTERVALO_MS = 15_000
/** Espera tras un cambio local para no enviar en cada pulsación. */
const ESPERA_ENVIO_MS = 700

let meta: MetaSync = { revision: null, base: null, ultimaSincronizacion: null }
let usuarioActual: string | null = null
let generacionActual = 0
let cadena: Promise<unknown> = Promise.resolve()
let temporizadorEnvio: ReturnType<typeof setTimeout> | null = null
let temporizadorPoll: ReturnType<typeof setTimeout> | null = null
let temporizadorReintento: ReturnType<typeof setTimeout> | null = null
let desuscribir: (() => void) | null = null
let detener: (() => void) | null = null
let fallos = 0

export const useSyncStore = create<TiendaSync>()(() => ({
  estado: 'inactivo',
  mensaje: null,
  ultimaSincronizacion: meta.ultimaSincronizacion,
  sincronizarAhora: () => solicitarSincronizacion(),
}))

/** Encadena las operaciones para que nunca se pisen entre ellas. */
function enSerie<T>(tarea: () => Promise<T>): Promise<T> {
  const resultado = cadena.then(tarea, tarea)
  cadena = resultado.catch(() => undefined)
  return resultado
}

function fijarEstado(estado: EstadoSync, mensaje: string | null = null): void {
  useSyncStore.setState({ estado, mensaje })
}

function estaVacio(datos: Datos): boolean {
  return (
    datos.asignaturas.length === 0 &&
    datos.temas.length === 0 &&
    datos.examenes.length === 0 &&
    datos.tareas.length === 0 &&
    datos.proyectos.length === 0 &&
    datos.checklist.length === 0 &&
    datos.habitos.length === 0 &&
    datos.registrosHabitos.length === 0 &&
    datos.sesionesEstudio.length === 0
  )
}

function aplicar(datos: Datos): void {
  if (!sonIguales(datos, useAppStore.getState().datos)) {
    useAppStore.getState().reemplazarDatos(datos)
  }
}

function marcarSincronizado(revision: string | null, base: Datos): void {
  meta = {
    revision,
    base,
    ultimaSincronizacion: new Date().toISOString(),
  }
  if (usuarioActual) guardarMeta(usuarioActual, meta)
  useSyncStore.setState({
    estado: 'sincronizado',
    mensaje: null,
    ultimaSincronizacion: meta.ultimaSincronizacion,
  })
}

/**
 * Trae el estado del servidor, lo fusiona con el local y, si hace falta, sube
 * el resultado. La escritura es condicional: si otro dispositivo guardó a la
 * vez, se vuelve a intentar con los datos actualizados.
 */
async function sincronizarCompleto(generacion: number): Promise<void> {
  fijarEstado('conectando')
  const remoto = await leerEstadoRemoto()
  if (generacion !== generacionActual) return
  const local = useAppStore.getState().datos

  if (!remoto.datos) {
    // Todavía no hay nada guardado en el servidor.
    if (estaVacio(local)) {
      marcarSincronizado(remoto.revision, local)
      return
    }
    const escrito = await escribirEstadoRemoto(local, null)
    if (generacion !== generacionActual) return
    marcarSincronizado(escrito.revision, local)
    return
  }

  const base = meta.base ?? crearDatosVacios()
  const fusion = fusionarTresVias(base, local, remoto.datos)
  if (generacion !== generacionActual) return
  aplicar(fusion)

  if (sonIguales(fusion, remoto.datos)) {
    marcarSincronizado(remoto.revision, remoto.datos)
    return
  }

  fijarEstado('guardando')
  const escrito = await escribirEstadoRemoto(fusion, remoto.revision)
  if (generacion !== generacionActual) return
  marcarSincronizado(escrito.revision, fusion)
}

/** Sube solo lo que ha cambiado en este dispositivo, sin leer antes. */
async function enviarPendiente(generacion: number): Promise<void> {
  const local = useAppStore.getState().datos
  if (!local.ajustes.sincronizacionAutomatica) return
  if (meta.base && sonIguales(local, meta.base)) return
  if (!meta.base && estaVacio(local)) return

  fijarEstado('guardando')
  try {
    const escrito = await escribirEstadoRemoto(local, meta.revision)
    if (generacion !== generacionActual) return
    marcarSincronizado(escrito.revision, local)
  } catch (error) {
    if (error instanceof ErrorSync && error.tipo === 'conflicto') {
      await sincronizarCompleto(generacion)
      return
    }
    throw error
  }
}

function programarReintento(): void {
  if (temporizadorReintento) clearTimeout(temporizadorReintento)
  const espera = Math.min(60_000, 2_000 * 2 ** fallos)
  temporizadorReintento = setTimeout(() => {
    temporizadorReintento = null
    if (!useAppStore.getState().datos.ajustes.sincronizacionAutomatica) return
    void ejecutar(sincronizarCompleto, true)
  }, espera)
}

function ejecutar(
  tarea: (generacion: number) => Promise<void>,
  automatico: boolean,
): Promise<void> {
  const generacion = generacionActual
  return enSerie(async () => {
    if (generacion !== generacionActual) return
    try {
      await tarea(generacion)
      if (generacion !== generacionActual) return
      fallos = 0
    } catch (error) {
      if (generacion !== generacionActual) return
      const tipo = error instanceof ErrorSync ? error.tipo : 'servidor'
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No se pudieron sincronizar los datos.'

      if (tipo === 'no_disponible') {
        useSyncStore.setState({ estado: 'no_disponible', mensaje })
        return
      }

      useSyncStore.setState({ estado: 'error', mensaje })
      if (!automatico) return
      fallos += 1
      if (tipo === 'no_autorizado') return
      programarReintento()
    }
  })
}

function programarEnvio(): void {
  if (temporizadorEnvio) clearTimeout(temporizadorEnvio)
  temporizadorEnvio = setTimeout(() => {
    temporizadorEnvio = null
    if (!useAppStore.getState().datos.ajustes.sincronizacionAutomatica) return
    void ejecutar(enviarPendiente, true)
  }, ESPERA_ENVIO_MS)
}

async function solicitarSincronizacion(): Promise<void> {
  await ejecutar(sincronizarCompleto, false)
}

/**
 * Arranca la sincronización automática y devuelve la función para detenerla.
 * La llama `App` una sola vez; en React StrictMode se reinicia sin problema.
 */
const CLAVE_USUARIO_LOCAL = 'organizador:usuario:v1'

/** Aísla el contenido local al usuario y conserva los datos antiguos al primer acceso. */
export function prepararDatosUsuario(usuarioId: string): void {
  try {
    const anterior = localStorage.getItem(CLAVE_USUARIO_LOCAL)
    if (anterior && anterior !== usuarioId) {
      useAppStore.getState().reemplazarDatos(crearDatosVacios())
    }
    localStorage.setItem(CLAVE_USUARIO_LOCAL, usuarioId)
  } catch {
    // La sincronización remota sigue protegida por RLS aunque el almacenamiento local falle.
  }
}

export function iniciarSincronizacion(usuarioId: string): () => void {
  if (detener && usuarioActual === usuarioId) return detener
  detener?.()
  usuarioActual = usuarioId
  meta = leerMeta(usuarioId)
  const generacion = ++generacionActual

  let activo = true

  const automaticaActiva = () =>
    useAppStore.getState().datos.ajustes.sincronizacionAutomatica

  const alCambiarLaTienda = (estado: Tienda, anterior: Tienda) => {
    if (estado.datos === anterior.datos) return

    const activaAhora = estado.datos.ajustes.sincronizacionAutomatica
    const activaAntes = anterior.datos.ajustes.sincronizacionAutomatica

    if (activaAhora !== activaAntes) {
      if (!activaAhora) {
        if (temporizadorEnvio) {
          clearTimeout(temporizadorEnvio)
          temporizadorEnvio = null
        }
        useSyncStore.setState({ estado: 'desactivado', mensaje: null })
        return
      }
      void ejecutar(sincronizarCompleto, true)
      return
    }

    if (!activaAhora) return
    programarEnvio()
  }

  const alCambiarVisibilidad = () => {
    if (!activo) return
    if (document.visibilityState === 'visible') {
      if (automaticaActiva()) void ejecutar(sincronizarCompleto, true)
      return
    }
    // Al salir de la app, intenta enviar lo que quede pendiente.
    if (temporizadorEnvio) {
      clearTimeout(temporizadorEnvio)
      temporizadorEnvio = null
      if (automaticaActiva()) void ejecutar(enviarPendiente, true)
    }
  }

  const alVolverLaConexion = () => {
    if (activo && automaticaActiva()) {
      void ejecutar(sincronizarCompleto, true)
    }
  }

  const programarSiguienteConsulta = () => {
    if (!activo) return
    temporizadorPoll = setTimeout(() => {
      if (
        activo &&
        document.visibilityState === 'visible' &&
        automaticaActiva() &&
        useSyncStore.getState().estado !== 'no_disponible'
      ) {
        void ejecutar(sincronizarCompleto, true)
      }
      programarSiguienteConsulta()
    }, INTERVALO_MS)
  }

  desuscribir = useAppStore.subscribe(alCambiarLaTienda)
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
  window.addEventListener('online', alVolverLaConexion)

  if (automaticaActiva()) {
    void ejecutar(sincronizarCompleto, true)
  } else {
    useSyncStore.setState({ estado: 'desactivado', mensaje: null })
  }
  programarSiguienteConsulta()

  detener = () => {
    activo = false
    if (generacion === generacionActual) generacionActual += 1
    desuscribir?.()
    desuscribir = null
    document.removeEventListener('visibilitychange', alCambiarVisibilidad)
    window.removeEventListener('online', alVolverLaConexion)
    if (temporizadorEnvio) {
      clearTimeout(temporizadorEnvio)
      temporizadorEnvio = null
    }
    if (temporizadorPoll) {
      clearTimeout(temporizadorPoll)
      temporizadorPoll = null
    }
    if (temporizadorReintento) {
      clearTimeout(temporizadorReintento)
      temporizadorReintento = null
    }
    detener = null
    usuarioActual = null
  }

  return detener
}

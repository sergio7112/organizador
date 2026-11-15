import type { Datos } from '../domain/types'
import { normalizarDatos } from '../domain/normalize'
import { supabase } from './supabase'

const TIEMPO_MAXIMO_MS = 12_000
const CLAVE_META = 'organizador:sync:supabase:v1:'

export type TipoErrorSync =
  | 'conflicto'
  | 'sin_conexion'
  | 'no_disponible'
  | 'no_autorizado'
  | 'servidor'

export class ErrorSync extends Error {
  readonly tipo: TipoErrorSync

  constructor(mensaje: string, tipo: TipoErrorSync) {
    super(mensaje)
    this.name = 'ErrorSync'
    this.tipo = tipo
  }
}

export interface EstadoRemoto {
  revision: string | null
  datos: Datos | null
  actualizadoEn: string | null
}

export interface MetaSync {
  revision: string | null
  base: Datos | null
  ultimaSincronizacion: string | null
}

const META_VACIA: MetaSync = {
  revision: null,
  base: null,
  ultimaSincronizacion: null,
}

export function leerMeta(usuarioId: string): MetaSync {
  try {
    const crudo = localStorage.getItem(`${CLAVE_META}${usuarioId}`)
    if (!crudo) return { ...META_VACIA }
    const valor = JSON.parse(crudo) as Partial<MetaSync>
    return {
      revision: typeof valor.revision === 'string' ? valor.revision : null,
      base: valor.base ? normalizarDatos(valor.base) : null,
      ultimaSincronizacion:
        typeof valor.ultimaSincronizacion === 'string'
          ? valor.ultimaSincronizacion
          : null,
    }
  } catch {
    return { ...META_VACIA }
  }
}

export function guardarMeta(usuarioId: string, meta: MetaSync): void {
  try {
    localStorage.setItem(`${CLAVE_META}${usuarioId}`, JSON.stringify(meta))
  } catch {
    // Se reintentará en la siguiente sincronización.
  }
}

function revisarError(error: { message?: string; code?: string }): never {
  if (error.code === '42501' || /jwt|auth|session/i.test(error.message ?? '')) {
    throw new ErrorSync('La sesión ha caducado. Vuelve a iniciar sesión.', 'no_autorizado')
  }
  throw new ErrorSync(
    error.message ?? 'No se pudo conectar con Supabase.',
    navigator.onLine ? 'servidor' : 'sin_conexion',
  )
}

function normalizarRemoto(valor: unknown): Datos | null {
  if (typeof valor !== 'object' || valor === null) return null
  return normalizarDatos(valor as Partial<Datos>)
}

export async function leerEstadoRemoto(): Promise<EstadoRemoto> {
  if (!supabase) {
    throw new ErrorSync('Falta configurar Supabase.', 'no_disponible')
  }
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS)
  try {
    const { data, error } = await supabase
      .from('organizador_datos')
      .select('datos, revision, actualizado_en')
      .abortSignal(controlador.signal)
      .maybeSingle()
    if (error) revisarError(error)
    return {
      revision: data ? String(data.revision) : null,
      datos: normalizarRemoto(data?.datos),
      actualizadoEn: data?.actualizado_en ?? null,
    }
  } catch (error) {
    if (error instanceof ErrorSync) throw error
    throw new ErrorSync(
      'No hay conexión con el servicio de sincronización.',
      navigator.onLine ? 'servidor' : 'sin_conexion',
    )
  } finally {
    clearTimeout(temporizador)
  }
}

export async function escribirEstadoRemoto(
  datos: Datos,
  revisionBase: string | null,
): Promise<{ revision: string; actualizadoEn: string | null }> {
  if (!supabase) {
    throw new ErrorSync('Falta configurar Supabase.', 'no_disponible')
  }
  const controlador = new AbortController()
  const temporizador = setTimeout(() => controlador.abort(), TIEMPO_MAXIMO_MS)
  try {
    const { data, error } = await supabase
      .rpc('guardar_datos_organizador', {
        p_datos: datos,
        p_revision_base: revisionBase === null ? null : Number(revisionBase),
      })
      .abortSignal(controlador.signal)
    if (error) revisarError(error)
    const fila = Array.isArray(data) ? data[0] : null
    if (!fila || typeof fila.revision !== 'number') {
      throw new ErrorSync('Otro dispositivo guardó cambios antes.', 'conflicto')
    }
    return {
      revision: String(fila.revision),
      actualizadoEn: fila.actualizado_en ?? null,
    }
  } catch (error) {
    if (error instanceof ErrorSync) throw error
    throw new ErrorSync(
      'No hay conexión con el servicio de sincronización.',
      navigator.onLine ? 'servidor' : 'sin_conexion',
    )
  } finally {
    clearTimeout(temporizador)
  }
}

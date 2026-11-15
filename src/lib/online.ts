import { getUser, refreshSession } from '@netlify/identity'
import type { Datos } from '../domain/types'
import { importarDatos } from './sync'

export interface CopiaOnline {
  datos: Datos | null
  revision: number
  actualizadoEn: string | null
}

export async function solicitarOnline(method: 'GET' | 'PUT', body?: { datos: Datos; revision: number }): Promise<CopiaOnline> {
  await refreshSession()
  if (!await getUser()) throw new Error('Inicia sesión para acceder a tu copia online.')
  let response: Response
  try {
    response = await fetch('/api/datos', {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      headers: method === 'PUT' ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new Error('No se pudo conectar. Comprueba tu conexión a Internet y pulsa «Consultar estado». Tus datos locales se conservan.')
  }
  if (response.status === 401) throw new Error('Tu sesión ha caducado o no se pudo validar. Cierra sesión y vuelve a entrar. Tus datos locales se conservan.')
  let result
  try { result = await response.json() } catch { throw new Error('El almacenamiento online no está disponible. Vuelve a intentarlo.') }
  if (!response.ok) throw new Error(result.error ?? 'No se pudo conectar con el almacenamiento online.')
  return { ...result, datos: result.datos ? importarDatos(JSON.stringify(result.datos)) : null }
}

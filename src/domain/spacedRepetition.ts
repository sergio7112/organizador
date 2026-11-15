import type { EstadoTema, Repaso, Tema } from './types'
import { nuevoId } from './ids'
import { hoyISO, sumarDias } from './dates'

export const INTERVALOS_REPASO = [1, 3, 7] as const

/** Estado que alcanza un tema al completar un repaso de la cadena. */
export function estadoTrasCompletarRepaso(
  repaso: Repaso,
  tema: Tema,
): EstadoTema {
  if (repaso.intervaloDias === 7) return 'dominado'
  if (tema.estado === 'estudiando') return 'repasado'
  return tema.estado
}

/** Crea la cadena de repasos a 1, 3 y 7 días desde la fecha indicada. */
export function crearRepasos(temaId: string, desde: string = hoyISO()): Repaso[] {
  const programadoEn = new Date().toISOString()
  return INTERVALOS_REPASO.map((intervalo) => ({
    id: nuevoId(),
    temaId,
    fecha: sumarDias(desde, intervalo),
    intervaloDias: intervalo,
    programadoEn,
  }))
}

/** Repasos sin completar cuya fecha ya llegó (incluye atrasados). */
export function repasosPendientes(repasos: Repaso[], hasta: string = hoyISO()): Repaso[] {
  return repasos
    .filter((repaso) => !repaso.completadoEn && repaso.fecha <= hasta)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function repasosDeTema(repasos: Repaso[], temaId: string): Repaso[] {
  return repasos
    .filter((repaso) => repaso.temaId === temaId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

import { aFecha } from './dates'
import type { Datos, Habito } from './types'

/** Indica si un hábito toca hacerlo en una fecha concreta. */
export function habitoSeEspera(habito: Habito, fechaISO: string): boolean {
  const fecha = aFecha(fechaISO)

  switch (habito.frecuencia) {
    case 'diaria':
      return true
    case 'semanal':
    case 'personalizada':
      return habito.diasSemana?.includes(fecha.getDay()) ?? false
    case 'mensual':
      return habito.diaMes === fecha.getDate()
  }
}

/** Hábitos activos que toca hacer ese día, en su orden manual. */
export function habitosDeHoy(datos: Datos, fechaISO: string): Habito[] {
  return datos.habitos
    .filter((habito) => !habito.archivado && habitoSeEspera(habito, fechaISO))
    .sort((a, b) => a.orden - b.orden)
}

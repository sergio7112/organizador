import type { EstadoTarea, Prioridad, Tarea } from './types'
import { PESO_PRIORIDAD } from './types'
import { sumarDias } from './dates'

export interface FiltrosTareas {
  asignaturaId: string | 'todas'
  prioridad: Prioridad | 'todas'
  estado: EstadoTarea | 'todas'
}

export const FILTROS_VACIOS: FiltrosTareas = {
  asignaturaId: 'todas',
  prioridad: 'todas',
  estado: 'todas',
}

export function filtrarTareas(tareas: Tarea[], filtros: FiltrosTareas): Tarea[] {
  return tareas.filter((tarea) => {
    if (
      filtros.asignaturaId !== 'todas' &&
      !(tarea.vinculo?.tipo === 'asignatura' && tarea.vinculo.id === filtros.asignaturaId)
    ) {
      return false
    }
    if (filtros.prioridad !== 'todas' && tarea.prioridad !== filtros.prioridad) {
      return false
    }
    if (filtros.estado !== 'todas' && tarea.estado !== filtros.estado) {
      return false
    }
    return true
  })
}

export type ClaveGrupo =
  | 'atrasadas'
  | 'hoy'
  | 'semana'
  | 'mas_adelante'
  | 'completadas'

export interface GrupoTareas {
  clave: ClaveGrupo
  etiqueta: string
  tareas: Tarea[]
}

const ETIQUETAS: Record<ClaveGrupo, string> = {
  atrasadas: 'Atrasadas',
  hoy: 'Hoy',
  semana: 'Próximos 7 días',
  mas_adelante: 'Más adelante',
  completadas: 'Completadas',
}

function compararActivas(a: Tarea, b: Tarea): number {
  return (
    PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] ||
    a.fechaLimite.localeCompare(b.fechaLimite) ||
    a.titulo.localeCompare(b.titulo, 'es')
  )
}

/** Agrupa las tareas por urgencia conservando el orden de prioridad. */
export function agruparTareas(tareas: Tarea[], hoy: string): GrupoTareas[] {
  const activas = tareas.filter((tarea) => tarea.estado !== 'hecha').sort(compararActivas)
  const completadas = tareas
    .filter((tarea) => tarea.estado === 'hecha')
    .sort((a, b) => (b.completadaEn ?? '').localeCompare(a.completadaEn ?? ''))

  const limiteSemana = sumarDias(hoy, 7)
  const grupos: GrupoTareas[] = [
    {
      clave: 'atrasadas',
      etiqueta: ETIQUETAS.atrasadas,
      tareas: activas.filter((tarea) => tarea.fechaLimite < hoy),
    },
    {
      clave: 'hoy',
      etiqueta: ETIQUETAS.hoy,
      tareas: activas.filter((tarea) => tarea.fechaLimite === hoy),
    },
    {
      clave: 'semana',
      etiqueta: ETIQUETAS.semana,
      tareas: activas.filter(
        (tarea) => tarea.fechaLimite > hoy && tarea.fechaLimite <= limiteSemana,
      ),
    },
    {
      clave: 'mas_adelante',
      etiqueta: ETIQUETAS.mas_adelante,
      tareas: activas.filter((tarea) => tarea.fechaLimite > limiteSemana),
    },
    {
      clave: 'completadas',
      etiqueta: ETIQUETAS.completadas,
      tareas: completadas,
    },
  ]

  return grupos.filter((grupo) => grupo.tareas.length > 0)
}

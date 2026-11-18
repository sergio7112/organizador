import type { Datos } from './types'
import { esAtrasada } from './dates'

export type TipoEvento = 'examen' | 'tarea'

export interface EventoCalendario {
  id: string
  referenciaId: string
  tipo: TipoEvento
  titulo: string
  fecha: string
  asignaturaId?: string
  color: string
  hecha: boolean
  atrasada: boolean
}

/**
 * Une exámenes y tareas activas en una sola lista de eventos para el calendario.
 * Los exámenes tienen prioridad visual sobre las tareas del mismo día.
 */
export function eventosCalendario(
  datos: Datos,
  opciones: { incluirHechas?: boolean } = {},
): EventoCalendario[] {
  const { incluirHechas = false } = opciones
  const coloresAsignaturas = new Map(
    datos.asignaturas.map((asignatura) => [asignatura.id, asignatura.color]),
  )
  const coloresProyectos = new Map(
    datos.proyectos.map((proyecto) => [proyecto.id, proyecto.color]),
  )
  const colorAsignatura = (id?: string) =>
    (id ? coloresAsignaturas.get(id) : undefined) ?? 'var(--primario)'

  const examenes: EventoCalendario[] = datos.examenes.map((examen) => ({
    id: `examen-${examen.id}`,
    referenciaId: examen.id,
    tipo: 'examen',
    titulo: examen.titulo,
    fecha: examen.fecha,
    asignaturaId: examen.asignaturaId,
    color: colorAsignatura(examen.asignaturaId),
    hecha: false,
    atrasada: false,
  }))

  const tareas: EventoCalendario[] = datos.tareas
    .filter((tarea) => incluirHechas || tarea.estado !== 'hecha')
    .map((tarea) => {
      const asignaturaId =
        tarea.vinculo?.tipo === 'asignatura' ? tarea.vinculo.id : undefined
      const color =
        tarea.vinculo?.tipo === 'proyecto'
          ? (coloresProyectos.get(tarea.vinculo.id) ?? 'var(--primario)')
          : colorAsignatura(asignaturaId)
      return {
        id: `tarea-${tarea.id}`,
        referenciaId: tarea.id,
        tipo: 'tarea' as const,
        titulo: tarea.titulo,
        fecha: tarea.fechaLimite,
        ...(asignaturaId ? { asignaturaId } : {}),
        color,
        hecha: tarea.estado === 'hecha',
        atrasada: tarea.estado !== 'hecha' && esAtrasada(tarea.fechaLimite),
      }
    })

  return [...examenes, ...tareas].sort(
    (a, b) =>
      a.fecha.localeCompare(b.fecha) ||
      (a.tipo === b.tipo ? 0 : a.tipo === 'examen' ? -1 : 1) ||
      a.titulo.localeCompare(b.titulo, 'es'),
  )
}

/** Agrupa los eventos por fecha para pintar la rejilla sin recorrer la lista cada vez. */
export function agruparPorFecha(
  eventos: EventoCalendario[],
): Map<string, EventoCalendario[]> {
  const mapa = new Map<string, EventoCalendario[]>()
  for (const evento of eventos) {
    const lista = mapa.get(evento.fecha)
    if (lista) lista.push(evento)
    else mapa.set(evento.fecha, [evento])
  }
  return mapa
}

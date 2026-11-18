import { examenesFuturos, progresoExamen, temasDelExamen } from './exams'
import { ORDEN_ESTADO_TEMA, PESO_PRIORIDAD } from './types'
import type {
  Asignatura,
  Datos,
  EstadoTema,
  Examen,
  Tema,
  Prioridad,
  Tarea,
} from './types'

export interface TareaOrdenada extends Tarea {
  asignatura?: Asignatura
}

export interface SugerenciaEstudio {
  examen: Examen
  tema: Tema
  asignatura?: Asignatura
  diasRestantes: number
  porcentajeDominado: number
}

/** Tareas activas con fecha límite hoy o anterior, por prioridad y fecha. */
export function tareasDeHoy(tareas: Tarea[], hoy: string): Tarea[] {
  return tareas
    .filter((tarea) => tarea.estado !== 'hecha' && tarea.fechaLimite <= hoy)
    .sort(
      (a, b) =>
        PESO_PRIORIDAD[a.prioridad] - PESO_PRIORIDAD[b.prioridad] ||
        a.fechaLimite.localeCompare(b.fechaLimite) ||
        a.titulo.localeCompare(b.titulo, 'es'),
    )
}

export function tareaAtrasada(tarea: Tarea, hoy: string): boolean {
  return tarea.estado !== 'hecha' && tarea.fechaLimite < hoy
}

export function tareaEsDeHoy(tarea: Tarea, hoy: string): boolean {
  return tarea.estado !== 'hecha' && tarea.fechaLimite === hoy
}

export function prioridadPeso(prioridad: Prioridad): number {
  return PESO_PRIORIDAD[prioridad]
}

export function estadoTemaPeso(estado: EstadoTema): number {
  return ORDEN_ESTADO_TEMA[estado]
}

/**
 * Elige qué estudiar: el examen futuro más cercano con temario sin dominar y,
 * dentro de él, el tema con el estado más bajo.
 */
export function sugerenciaDeEstudio(
  datos: Datos,
  hoy: string,
): SugerenciaEstudio | null {
  const examenes = examenesFuturos(datos.examenes, hoy)

  for (const examen of examenes) {
    const temas = temasDelExamen(examen, datos.temas)
    if (temas.length === 0) continue

    const progreso = progresoExamen(examen, datos.temas)
    if (progreso.dominados === temas.length) continue

    const candidatos = temas
      .filter((tema) => tema.estado !== 'dominado')
      .sort(
        (a, b) =>
          ORDEN_ESTADO_TEMA[a.estado] - ORDEN_ESTADO_TEMA[b.estado] ||
          (a.nota ?? 11) - (b.nota ?? 11) ||
          a.orden - b.orden,
      )

    const tema = candidatos[0]
    if (!tema) continue

    const dias = Math.max(
      0,
      Math.round(
        (new Date(`${examen.fecha}T00:00:00`).getTime() -
          new Date(`${hoy}T00:00:00`).getTime()) /
          86400000,
      ),
    )

    return {
      examen,
      tema,
      asignatura: datos.asignaturas.find(
        (asignatura) => asignatura.id === tema.asignaturaId,
      ),
      diasRestantes: dias,
      porcentajeDominado: progreso.porcentajeDominado,
    }
  }

  return null
}

/** Temas que se están estudiando ahora mismo, del más reciente al más antiguo. */
export function temasEnEstudio(temas: Tema[]): Tema[] {
  return temas
    .filter((tema) => tema.estado === 'estudiando')
    .sort((a, b) => b.actualizadoEn.localeCompare(a.actualizadoEn))
}

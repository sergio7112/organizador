import type { Asignatura, Examen, Tema } from './types'

export interface ProgresoExamen {
  total: number
  dominados: number
  repasados: number
  estudiando: number
  sinEmpezar: number
  porcentajeDominado: number
  porcentajeAvance: number
}

export function temasDelExamen(examen: Examen, temas: Tema[]): Tema[] {
  const ids = new Set(examen.temaIds)
  return temas.filter((tema) => ids.has(tema.id))
}

export function progresoExamen(examen: Examen, temas: Tema[]): ProgresoExamen {
  const propios = temasDelExamen(examen, temas)
  const total = propios.length
  const dominados = propios.filter((t) => t.estado === 'dominado').length
  const repasados = propios.filter((t) => t.estado === 'repasado').length
  const estudiando = propios.filter((t) => t.estado === 'estudiando').length
  const sinEmpezar = propios.filter((t) => t.estado === 'sin_empezar').length

  const avance = dominados + repasados * 0.66 + estudiando * 0.33
  return {
    total,
    dominados,
    repasados,
    estudiando,
    sinEmpezar,
    porcentajeDominado: total === 0 ? 0 : Math.round((dominados / total) * 100),
    porcentajeAvance: total === 0 ? 0 : Math.round((avance / total) * 100),
  }
}

export function examenesFuturos(examenes: Examen[], hoy: string): Examen[] {
  return examenes
    .filter((examen) => examen.fecha >= hoy)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function proximoExamen(examenes: Examen[], hoy: string): Examen | null {
  return examenesFuturos(examenes, hoy)[0] ?? null
}

export function examenesDeAsignatura(
  examenes: Examen[],
  asignaturaId: string,
): Examen[] {
  return examenes
    .filter((examen) => examen.asignaturaId === asignaturaId)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
}

export function examenConAsignatura(
  examen: Examen,
  asignaturas: Asignatura[],
): Asignatura | undefined {
  return asignaturas.find((asignatura) => asignatura.id === examen.asignaturaId)
}

import type { Datos } from './types'

/**
 * Equivalencias entre los colores fríos que usaban las versiones anteriores
 * y la paleta actual. Se aplica al cargar datos guardados para que las
 * asignaturas y proyectos existentes conserven un color coherente.
 */
const EQUIVALENCIAS_CALIDAS: Record<string, string> = {
  '#4f46e5': '#9f1239', // Índigo -> Granate
  '#2563eb': '#f0616d', // Azul -> Coral
  '#0891b2': '#c2410c', // Cian -> Terracota
  '#059669': '#a16207', // Esmeralda -> Mostaza
  '#65a30d': '#d97706', // Verde -> Ámbar
  '#7c3aed': '#86198f', // Violeta -> Ciruela
  '#64748b': '#78716c', // Gris -> Piedra
  '#e11d48': '#db2777', // Rosa antiguo -> Rosa
}

/** Devuelve el equivalente actual de un color antiguo, o el mismo color. */
export function colorCalido(color: string): string {
  return EQUIVALENCIAS_CALIDAS[color.toLowerCase()] ?? color
}

/** Adapta los colores de asignaturas y proyectos a la paleta actual. */
export function migrarColoresCalidos(datos: Partial<Datos>): Partial<Datos> {
  return {
    ...datos,
    asignaturas: datos.asignaturas?.map((asignatura) => ({
      ...asignatura,
      color: colorCalido(asignatura.color),
    })),
    proyectos: datos.proyectos?.map((proyecto) => ({
      ...proyecto,
      color: colorCalido(proyecto.color),
    })),
    habitos: datos.habitos?.map((habito) => ({
      ...habito,
      color: colorCalido(habito.color),
    })),
  }
}

/** Paleta de colores para asignaturas, proyectos y hábitos. */
export { PALETA } from './types'

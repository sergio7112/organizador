import type { Ajustes, Datos, TemaOscuro, VistaCalendario } from './types'
import { VERSION_DATOS } from './types'

const TEMAS: TemaOscuro[] = ['claro', 'oscuro', 'sistema']
const VISTAS: VistaCalendario[] = ['semana', 'mes']

/**
 * Completa un conjunto de datos parcial (por ejemplo, de una versión antigua)
 * con listas vacías y ajustes por defecto. No valida el contenido.
 */
export function normalizarDatos(guardado?: Partial<Datos> | null): Datos {
  const tema = guardado?.ajustes?.tema
  const vistaCalendario = guardado?.ajustes?.vistaCalendario

  const sincronizacionAutomatica =
    typeof guardado?.ajustes?.sincronizacionAutomatica === 'boolean'
      ? guardado.ajustes.sincronizacionAutomatica
      : true

  const ajustes: Ajustes = {
    tema: tema && TEMAS.includes(tema) ? tema : 'sistema',
    vistaCalendario:
      vistaCalendario && VISTAS.includes(vistaCalendario)
        ? vistaCalendario
        : 'mes',
    sincronizacionAutomatica,
  }

  return {
    version: VERSION_DATOS,
    asignaturas: guardado?.asignaturas ?? [],
    temas: guardado?.temas ?? [],
    examenes: guardado?.examenes ?? [],
    tareas: guardado?.tareas ?? [],
    proyectos: guardado?.proyectos ?? [],
    checklist: guardado?.checklist ?? [],
    repasos: guardado?.repasos ?? [],
    errores: guardado?.errores ?? [],
    habitos: guardado?.habitos ?? [],
    registrosHabitos: guardado?.registrosHabitos ?? [],
    sesionesEstudio: guardado?.sesionesEstudio ?? [],
    ajustes,
  }
}

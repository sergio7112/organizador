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

  const horaValida = (valor: unknown, predeterminada: string) =>
    typeof valor === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(valor)
      ? valor
      : predeterminada

  const ajustes: Ajustes = {
    tema: tema && TEMAS.includes(tema) ? tema : 'sistema',
    vistaCalendario:
      vistaCalendario && VISTAS.includes(vistaCalendario)
        ? vistaCalendario
        : 'mes',
    sincronizacionAutomatica,
    notificacionesResumenDiario:
      guardado?.ajustes?.notificacionesResumenDiario === true,
    horaResumenDiario: horaValida(guardado?.ajustes?.horaResumenDiario, '08:00'),
    notificacionesProximosEventos:
      guardado?.ajustes?.notificacionesProximosEventos === true,
    horaAvisosProximosEventos: horaValida(
      guardado?.ajustes?.horaAvisosProximosEventos,
      '09:00',
    ),
  }

  return {
    version: VERSION_DATOS,
    asignaturas: guardado?.asignaturas ?? [],
    temas: guardado?.temas ?? [],
    examenes: guardado?.examenes ?? [],
    tareas: guardado?.tareas ?? [],
    proyectos: guardado?.proyectos ?? [],
    checklist: guardado?.checklist ?? [],
    habitos: guardado?.habitos ?? [],
    registrosHabitos: guardado?.registrosHabitos ?? [],
    sesionesEstudio: guardado?.sesionesEstudio ?? [],
    ajustes,
  }
}

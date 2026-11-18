import type { Datos } from './types'
import { VERSION_DATOS } from './types'

/** Datos iniciales de una instalación nueva: la aplicación arranca vacía. */
export function crearDatosVacios(): Datos {
  return {
    version: VERSION_DATOS,
    asignaturas: [],
    temas: [],
    examenes: [],
    tareas: [],
    proyectos: [],
    checklist: [],
    habitos: [],
    registrosHabitos: [],
    sesionesEstudio: [],
    ajustes: {
      tema: 'sistema',
      vistaCalendario: 'mes',
      sincronizacionAutomatica: true,
      notificacionesResumenDiario: false,
      horaResumenDiario: '08:00',
      notificacionesProximosEventos: false,
      horaAvisosProximosEventos: '09:00',
    },
  }
}

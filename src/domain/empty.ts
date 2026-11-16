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
    repasos: [],
    errores: [],
    habitos: [],
    registrosHabitos: [],
    sesionesEstudio: [],
    ajustes: {
      tema: 'sistema',
      vistaCalendario: 'mes',
      sincronizacionAutomatica: true,
    },
  }
}

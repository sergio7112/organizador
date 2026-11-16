import { describe, expect, it } from 'vitest'
import type { Datos } from '../types'
import {
  ErrorImportacion,
  exportarDatos,
  importarDatos,
  nombreCopiaSeguridad,
  syncJSON,
} from '../../lib/sync'

const DATOS: Datos = {
  version: 1,
  asignaturas: [
    {
      id: 'asig-1',
      nombre: 'Física',
      color: '#7c3aed',
      orden: 0,
      creadaEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  temas: [
    {
      id: 'tema-1',
      asignaturaId: 'asig-1',
      titulo: 'Campo gravitatorio',
      estado: 'estudiando',
      orden: 0,
      actualizadoEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  examenes: [
    {
      id: 'examen-1',
      asignaturaId: 'asig-1',
      titulo: 'Campos',
      fecha: '2026-11-22',
      temaIds: ['tema-1'],
      creadoEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  tareas: [
    {
      id: 'tarea-1',
      titulo: 'Entregar problemas',
      fechaLimite: '2026-11-15',
      prioridad: 'alta',
      vinculo: { tipo: 'asignatura', id: 'asig-1' },
      estado: 'pendiente',
      creadaEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  proyectos: [
    {
      id: 'proyecto-1',
      nombre: 'Trabajo de Física',
      color: '#4f46e5',
      notasMarkdown: '# Notas',
      creadoEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  checklist: [
    {
      id: 'check-1',
      proyectoId: 'proyecto-1',
      texto: 'Buscar fuentes',
      hecho: false,
      orden: 0,
    },
  ],
  repasos: [
    {
      id: 'repaso-1',
      temaId: 'tema-1',
      fecha: '2026-11-15',
      intervaloDias: 1,
      programadoEn: '2026-11-14T10:00:00.000Z',
    },
  ],
  errores: [
    {
      id: 'error-1',
      temaId: 'tema-1',
      queFallo: 'Me equivoqué en el signo',
      porQue: 'No comprobé el sentido del desplazamiento',
      fecha: '2026-11-14',
      resuelto: false,
    },
  ],
  habitos: [],
  registrosHabitos: [],
  sesionesEstudio: [],
  ajustes: {
    tema: 'oscuro',
    vistaCalendario: 'semana',
    sincronizacionAutomatica: true,
  },
}

describe('sincronización por JSON', () => {
  it('exporta con cabecera e importa conservando todos los datos', () => {
    const texto = exportarDatos(DATOS)
    const archivo = JSON.parse(texto) as {
      formato: string
      version: number
      datos: Datos
    }

    expect(archivo.formato).toBe('organizador-datos')
    expect(archivo.version).toBe(1)
    expect(importarDatos(texto)).toEqual(DATOS)
  })

  it('acepta un objeto de datos suelto sin cabecera', () => {
    expect(importarDatos(JSON.stringify(DATOS))).toEqual(DATOS)
  })

  it('funciona a través del adaptador SyncAdapter', async () => {
    const texto = await syncJSON.exportar(DATOS)
    await expect(syncJSON.importar(texto)).resolves.toEqual(DATOS)
  })

  it('genera un nombre de archivo con la fecha', () => {
    expect(nombreCopiaSeguridad(new Date(2026, 10, 14))).toBe(
      'organizador-2026-11-14.json',
    )
  })

  it('rechaza archivos que no son JSON', () => {
    expect(() => importarDatos('no es json')).toThrow(ErrorImportacion)
    expect(() => importarDatos('no es json')).toThrow(/JSON válido/)
  })

  it('rechaza copias de una versión más reciente', () => {
    expect(() =>
      importarDatos(JSON.stringify({ ...DATOS, version: 99 })),
    ).toThrow(/versión más reciente/)
  })

  it('rechaza listas que faltan', () => {
    const incompleto = JSON.stringify({ ...DATOS, temas: undefined })
    expect(() => importarDatos(incompleto)).toThrow(/«temas»/)
  })

  it('rechaza referencias a asignaturas que no existen', () => {
    const roto: Datos = {
      ...DATOS,
      temas: [{ ...DATOS.temas[0], asignaturaId: 'no-existe' }],
    }
    expect(() => importarDatos(JSON.stringify(roto))).toThrow(
      /asignatura que no existe/,
    )
  })

  it('rechaza identificadores repetidos', () => {
    const roto: Datos = {
      ...DATOS,
      temas: [DATOS.temas[0], { ...DATOS.temas[0], orden: 1 }],
    }
    expect(() => importarDatos(JSON.stringify(roto))).toThrow(
      /identificador repetido/,
    )
  })

  it('rechaza un estado de tema desconocido', () => {
    const roto = {
      ...DATOS,
      temas: [{ ...DATOS.temas[0], estado: 'inventado' }],
    }
    expect(() => importarDatos(JSON.stringify(roto))).toThrow(/estado.*no es válido/)
  })

  it('completa los ajustes si no vienen en el archivo', () => {
    const sinAjustes = JSON.parse(JSON.stringify(DATOS)) as Record<string, unknown>
    delete sinAjustes.ajustes
    expect(importarDatos(JSON.stringify(sinAjustes)).ajustes).toEqual({
      tema: 'sistema',
      vistaCalendario: 'mes',
      sincronizacionAutomatica: true,
    })
  })
})

import type {
  Asignatura,
  Ajustes,
  Datos,
  ErrorTema,
  Examen,
  ItemChecklist,
  Proyecto,
  Repaso,
  Tarea,
  Tema,
  VinculoTarea,
} from '../domain/types'
import {
  ESTADOS_TAREA,
  ESTADOS_TEMA,
  PRIORIDADES,
  VERSION_DATOS,
} from '../domain/types'
import { normalizarDatos } from '../domain/normalize'
import { isoDeFecha } from '../domain/dates'

type Registro = Record<string, unknown>

/**
 * Contrato para intercambiar datos entre dispositivos.
 * Hoy se implementa con archivos JSON; en el futuro podría añadirse
 * un adaptador contra un servidor sin cambiar la interfaz de la aplicación.
 */
export interface SyncAdapter {
  exportar: (datos: Datos) => Promise<string>
  importar: (contenido: string) => Promise<Datos>
}

export class ErrorImportacion extends Error {
  constructor(mensaje: string) {
    super(mensaje)
    this.name = 'ErrorImportacion'
  }
}

interface ArchivoExportado {
  formato: 'organizador-datos'
  version: number
  exportadoEn: string
  datos: Datos
}

const esRegistro = (valor: unknown): valor is Registro =>
  typeof valor === 'object' && valor !== null && !Array.isArray(valor)

function registro(valor: unknown, ruta: string): Registro {
  if (!esRegistro(valor)) {
    throw new ErrorImportacion(`${ruta} no tiene un formato válido.`)
  }
  return valor
}

function lista(contenido: Registro, campo: string): unknown[] {
  const valor = contenido[campo]
  if (!Array.isArray(valor)) {
    throw new ErrorImportacion(`El campo «${campo}» debe ser una lista.`)
  }
  return valor
}

function texto(valor: unknown, ruta: string): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new ErrorImportacion(`${ruta} debe ser un texto no vacío.`)
  }
  return valor
}

function textoOpcional(valor: unknown, ruta: string): string | undefined {
  if (valor === undefined || valor === null) return undefined
  if (typeof valor !== 'string') {
    throw new ErrorImportacion(`${ruta} debe ser un texto.`)
  }
  return valor
}

function numero(valor: unknown, ruta: string): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor)) {
    throw new ErrorImportacion(`${ruta} debe ser un número.`)
  }
  return valor
}

function numeroOpcional(valor: unknown, ruta: string): number | undefined {
  if (valor === undefined || valor === null) return undefined
  return numero(valor, ruta)
}

function booleano(valor: unknown, ruta: string): boolean {
  if (typeof valor !== 'boolean') {
    throw new ErrorImportacion(`${ruta} debe ser verdadero o falso.`)
  }
  return valor
}

function fecha(valor: unknown, ruta: string): string {
  if (typeof valor !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw new ErrorImportacion(`${ruta} debe tener el formato AAAA-MM-DD.`)
  }
  return valor
}

function esUnoDe<T extends string>(
  valor: unknown,
  opciones: readonly T[],
): valor is T {
  return typeof valor === 'string' && opciones.includes(valor as T)
}

function idUnico(valor: unknown, ruta: string, vistos: Set<string>): string {
  const id = texto(valor, ruta)
  if (vistos.has(id)) {
    throw new ErrorImportacion(`Hay un identificador repetido: «${id}».`)
  }
  vistos.add(id)
  return id
}

/**
 * Valida y normaliza el contenido de una copia de seguridad.
 * Acepta tanto el archivo exportado por la app como un objeto `Datos` suelto.
 */
export function importarDatos(contenido: string): Datos {
  let crudo: unknown
  try {
    crudo = JSON.parse(contenido)
  } catch {
    throw new ErrorImportacion('El archivo no contiene JSON válido.')
  }

  const raiz = registro(crudo, 'El archivo')
  const datosBrutos = esRegistro(raiz.datos) ? raiz.datos : raiz

  if (datosBrutos.version !== undefined) {
    if (
      typeof datosBrutos.version !== 'number' ||
      !Number.isFinite(datosBrutos.version)
    ) {
      throw new ErrorImportacion('La versión del archivo no es válida.')
    }
    if (datosBrutos.version > VERSION_DATOS) {
      throw new ErrorImportacion(
        'La copia se creó con una versión más reciente de la aplicación. Actualiza la app antes de importarla.',
      )
    }
  }

  const idsAsignaturas = new Set<string>()
  const asignaturas: Asignatura[] = lista(datosBrutos, 'asignaturas').map(
    (item, indice) => {
      const ruta = `asignaturas[${indice}]`
      const fila = registro(item, ruta)
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsAsignaturas),
        nombre: texto(fila.nombre, `${ruta}.nombre`),
        color: texto(fila.color, `${ruta}.color`),
        orden: numero(fila.orden, `${ruta}.orden`),
        creadaEn: texto(fila.creadaEn, `${ruta}.creadaEn`),
      }
    },
  )

  const idsTemas = new Set<string>()
  const temas: Tema[] = lista(datosBrutos, 'temas').map((item, indice) => {
    const ruta = `temas[${indice}]`
    const fila = registro(item, ruta)
    const asignaturaId = texto(fila.asignaturaId, `${ruta}.asignaturaId`)
    if (!idsAsignaturas.has(asignaturaId)) {
      throw new ErrorImportacion(
        `El tema ${indice + 1} apunta a una asignatura que no existe.`,
      )
    }
    if (!esUnoDe(fila.estado, ESTADOS_TEMA)) {
      throw new ErrorImportacion(
        `El estado del tema ${indice + 1} no es válido.`,
      )
    }
    const nota = numeroOpcional(fila.nota, `${ruta}.nota`)
    return {
      id: idUnico(fila.id, `${ruta}.id`, idsTemas),
      asignaturaId,
      titulo: texto(fila.titulo, `${ruta}.titulo`),
      estado: fila.estado,
      ...(nota !== undefined ? { nota } : {}),
      orden: numero(fila.orden, `${ruta}.orden`),
      actualizadoEn: texto(fila.actualizadoEn, `${ruta}.actualizadoEn`),
    }
  })

  const idsProyectos = new Set<string>()
  const proyectos: Proyecto[] = lista(datosBrutos, 'proyectos').map(
    (item, indice) => {
      const ruta = `proyectos[${indice}]`
      const fila = registro(item, ruta)
      const descripcion = textoOpcional(fila.descripcion, `${ruta}.descripcion`)
      if (typeof fila.notasMarkdown !== 'string') {
        throw new ErrorImportacion(`${ruta}.notasMarkdown debe ser un texto.`)
      }
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsProyectos),
        nombre: texto(fila.nombre, `${ruta}.nombre`),
        ...(descripcion !== undefined ? { descripcion } : {}),
        color: texto(fila.color, `${ruta}.color`),
        notasMarkdown: fila.notasMarkdown,
        creadoEn: texto(fila.creadoEn, `${ruta}.creadoEn`),
      }
    },
  )

  const idsChecklist = new Set<string>()
  const checklist: ItemChecklist[] = lista(datosBrutos, 'checklist').map(
    (item, indice) => {
      const ruta = `checklist[${indice}]`
      const fila = registro(item, ruta)
      const proyectoId = texto(fila.proyectoId, `${ruta}.proyectoId`)
      if (!idsProyectos.has(proyectoId)) {
        throw new ErrorImportacion(
          `El elemento de checklist ${indice + 1} apunta a un proyecto que no existe.`,
        )
      }
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsChecklist),
        proyectoId,
        texto: texto(fila.texto, `${ruta}.texto`),
        hecho: booleano(fila.hecho, `${ruta}.hecho`),
        orden: numero(fila.orden, `${ruta}.orden`),
      }
    },
  )

  const idsExamenes = new Set<string>()
  const examenes: Examen[] = lista(datosBrutos, 'examenes').map(
    (item, indice) => {
      const ruta = `examenes[${indice}]`
      const fila = registro(item, ruta)
      const asignaturaId = texto(fila.asignaturaId, `${ruta}.asignaturaId`)
      if (!idsAsignaturas.has(asignaturaId)) {
        throw new ErrorImportacion(
          `El examen ${indice + 1} apunta a una asignatura que no existe.`,
        )
      }
      const temaIds = lista(fila, 'temaIds').map((temaId, posicion) => {
        const id = texto(temaId, `${ruta}.temaIds[${posicion}]`)
        if (!idsTemas.has(id)) {
          throw new ErrorImportacion(
            `El examen ${indice + 1} incluye un tema que no existe.`,
          )
        }
        return id
      })
      const notas = textoOpcional(fila.notas, `${ruta}.notas`)
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsExamenes),
        asignaturaId,
        titulo: texto(fila.titulo, `${ruta}.titulo`),
        fecha: fecha(fila.fecha, `${ruta}.fecha`),
        temaIds,
        ...(notas !== undefined ? { notas } : {}),
        creadoEn: texto(fila.creadoEn, `${ruta}.creadoEn`),
      }
    },
  )

  const idsTareas = new Set<string>()
  const tareas: Tarea[] = lista(datosBrutos, 'tareas').map((item, indice) => {
    const ruta = `tareas[${indice}]`
    const fila = registro(item, ruta)
    if (!esUnoDe(fila.prioridad, PRIORIDADES)) {
      throw new ErrorImportacion(
        `La prioridad de la tarea ${indice + 1} no es válida.`,
      )
    }
    if (!esUnoDe(fila.estado, ESTADOS_TAREA)) {
      throw new ErrorImportacion(
        `El estado de la tarea ${indice + 1} no es válido.`,
      )
    }

    let vinculo: VinculoTarea | undefined
    if (fila.vinculo !== undefined && fila.vinculo !== null) {
      const vinculoBruto = registro(fila.vinculo, `${ruta}.vinculo`)
      const tipo = vinculoBruto.tipo
      if (tipo !== 'asignatura' && tipo !== 'proyecto') {
        throw new ErrorImportacion(
          `El vínculo de la tarea ${indice + 1} no es válido.`,
        )
      }
      const vinculoId = texto(vinculoBruto.id, `${ruta}.vinculo.id`)
      if (tipo === 'asignatura' && !idsAsignaturas.has(vinculoId)) {
        throw new ErrorImportacion(
          `La tarea ${indice + 1} apunta a una asignatura que no existe.`,
        )
      }
      if (tipo === 'proyecto' && !idsProyectos.has(vinculoId)) {
        throw new ErrorImportacion(
          `La tarea ${indice + 1} apunta a un proyecto que no existe.`,
        )
      }
      vinculo = { tipo, id: vinculoId }
    }

    const descripcion = textoOpcional(fila.descripcion, `${ruta}.descripcion`)
    const completadaEn = textoOpcional(
      fila.completadaEn,
      `${ruta}.completadaEn`,
    )
    return {
      id: idUnico(fila.id, `${ruta}.id`, idsTareas),
      titulo: texto(fila.titulo, `${ruta}.titulo`),
      ...(descripcion !== undefined ? { descripcion } : {}),
      fechaLimite: fecha(fila.fechaLimite, `${ruta}.fechaLimite`),
      prioridad: fila.prioridad,
      ...(vinculo ? { vinculo } : {}),
      estado: fila.estado,
      creadaEn: texto(fila.creadaEn, `${ruta}.creadaEn`),
      ...(completadaEn !== undefined ? { completadaEn } : {}),
    }
  })

  const idsRepasos = new Set<string>()
  const repasos: Repaso[] = lista(datosBrutos, 'repasos').map(
    (item, indice) => {
      const ruta = `repasos[${indice}]`
      const fila = registro(item, ruta)
      const temaId = texto(fila.temaId, `${ruta}.temaId`)
      if (!idsTemas.has(temaId)) {
        throw new ErrorImportacion(
          `El repaso ${indice + 1} apunta a un tema que no existe.`,
        )
      }
      const intervalo = fila.intervaloDias
      if (intervalo !== 1 && intervalo !== 3 && intervalo !== 7) {
        throw new ErrorImportacion(
          `El intervalo del repaso ${indice + 1} debe ser 1, 3 o 7 días.`,
        )
      }
      const completadoEn = textoOpcional(
        fila.completadoEn,
        `${ruta}.completadoEn`,
      )
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsRepasos),
        temaId,
        fecha: fecha(fila.fecha, `${ruta}.fecha`),
        intervaloDias: intervalo,
        programadoEn: texto(fila.programadoEn, `${ruta}.programadoEn`),
        ...(completadoEn !== undefined ? { completadoEn } : {}),
      }
    },
  )

  const idsErrores = new Set<string>()
  const errores: ErrorTema[] = lista(datosBrutos, 'errores').map(
    (item, indice) => {
      const ruta = `errores[${indice}]`
      const fila = registro(item, ruta)
      const temaId = texto(fila.temaId, `${ruta}.temaId`)
      if (!idsTemas.has(temaId)) {
        throw new ErrorImportacion(
          `El error ${indice + 1} apunta a un tema que no existe.`,
        )
      }
      if (typeof fila.porQue !== 'string') {
        throw new ErrorImportacion(`${ruta}.porQue debe ser un texto.`)
      }
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsErrores),
        temaId,
        queFallo: texto(fila.queFallo, `${ruta}.queFallo`),
        porQue: fila.porQue,
        fecha: fecha(fila.fecha, `${ruta}.fecha`),
        resuelto: booleano(fila.resuelto, `${ruta}.resuelto`),
      }
    },
  )

  const ajustesBrutos = esRegistro(datosBrutos.ajustes)
    ? datosBrutos.ajustes
    : {}
  const ajustes: Ajustes = {
    tema: esUnoDe(ajustesBrutos.tema, ['claro', 'oscuro', 'sistema'] as const)
      ? ajustesBrutos.tema
      : 'sistema',
    vistaCalendario: esUnoDe(ajustesBrutos.vistaCalendario, [
      'semana',
      'mes',
    ] as const)
      ? ajustesBrutos.vistaCalendario
      : 'mes',
  }

  return normalizarDatos({
    version: VERSION_DATOS,
    asignaturas,
    temas,
    examenes,
    tareas,
    proyectos,
    checklist,
    repasos,
    errores,
    ajustes,
  })
}

/** Serializa los datos con una cabecera que identifica el archivo. */
export function exportarDatos(datos: Datos): string {
  const archivo: ArchivoExportado = {
    formato: 'organizador-datos',
    version: VERSION_DATOS,
    exportadoEn: new Date().toISOString(),
    datos,
  }
  return JSON.stringify(archivo, null, 2)
}

export function nombreCopiaSeguridad(fecha = new Date()): string {
  return `organizador-${isoDeFecha(fecha)}.json`
}

export const syncJSON: SyncAdapter = {
  async exportar(datos) {
    return exportarDatos(datos)
  },
  async importar(contenido) {
    return importarDatos(contenido)
  },
}

/** Descarga un archivo de texto en el navegador. */
export function descargarArchivo(
  nombre: string,
  contenido: string,
  tipo = 'application/json',
): void {
  const blob = new Blob([contenido], { type: tipo })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

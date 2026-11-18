import type {
  Asignatura,
  Ajustes,
  Datos,
  Examen,
  Habito,
  ItemChecklist,
  Proyecto,
  RegistroHabito,
  SesionEstudio,
  Tarea,
  Tema,
  VinculoTarea,
} from '../domain/types'
import {
  ESTADOS_TAREA,
  ESTADOS_TEMA,
  FRECUENCIAS_HABITO,
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

/** Igual que `lista`, pero una copia antigua puede no incluir el campo. */
function listaOpcional(contenido: Registro, campo: string): unknown[] {
  const valor = contenido[campo]
  if (valor === undefined || valor === null) return []
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

function hora(valor: unknown, ruta: string): string {
  if (typeof valor !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(valor)) {
    throw new ErrorImportacion(`${ruta} debe tener el formato HH:mm.`)
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

  const idsHabitos = new Set<string>()
  const habitos: Habito[] = listaOpcional(datosBrutos, 'habitos').map(
    (item, indice) => {
      const ruta = `habitos[${indice}]`
      const fila = registro(item, ruta)
      if (!esUnoDe(fila.frecuencia, FRECUENCIAS_HABITO)) {
        throw new ErrorImportacion(
          `La frecuencia del hábito ${indice + 1} no es válida.`,
        )
      }
      const descripcion = textoOpcional(fila.descripcion, `${ruta}.descripcion`)
      const diasSemana = Array.isArray(fila.diasSemana)
        ? fila.diasSemana.map((dia, posicion) => {
            const valor = numero(dia, `${ruta}.diasSemana[${posicion}]`)
            if (!Number.isInteger(valor) || valor < 0 || valor > 6) {
              throw new ErrorImportacion(
                `${ruta}.diasSemana[${posicion}] debe ser un día de 0 a 6.`,
              )
            }
            return valor
          })
        : undefined
      const diaMes = numeroOpcional(fila.diaMes, `${ruta}.diaMes`)
      const objetivo = numeroOpcional(fila.objetivo, `${ruta}.objetivo`)
      const unidad = textoOpcional(fila.unidad, `${ruta}.unidad`)
      return {
        id: idUnico(fila.id, `${ruta}.id`, idsHabitos),
        nombre: texto(fila.nombre, `${ruta}.nombre`),
        ...(descripcion !== undefined ? { descripcion } : {}),
        color: texto(fila.color, `${ruta}.color`),
        frecuencia: fila.frecuencia,
        ...(diasSemana !== undefined ? { diasSemana } : {}),
        ...(diaMes !== undefined ? { diaMes } : {}),
        ...(objetivo !== undefined ? { objetivo } : {}),
        ...(unidad !== undefined ? { unidad } : {}),
        archivado: booleano(fila.archivado, `${ruta}.archivado`),
        creadoEn: texto(fila.creadoEn, `${ruta}.creadoEn`),
        orden: numero(fila.orden, `${ruta}.orden`),
      }
    },
  )

  const idsRegistros = new Set<string>()
  const registrosHabitos: RegistroHabito[] = listaOpcional(
    datosBrutos,
    'registrosHabitos',
  ).map((item, indice) => {
    const ruta = `registrosHabitos[${indice}]`
    const fila = registro(item, ruta)
    const habitoId = texto(fila.habitoId, `${ruta}.habitoId`)
    if (!idsHabitos.has(habitoId)) {
      throw new ErrorImportacion(
        `El registro ${indice + 1} apunta a un hábito que no existe.`,
      )
    }
    const valor = numeroOpcional(fila.valor, `${ruta}.valor`)
    const nota = textoOpcional(fila.nota, `${ruta}.nota`)
    return {
      id: idUnico(fila.id, `${ruta}.id`, idsRegistros),
      habitoId,
      fecha: fecha(fila.fecha, `${ruta}.fecha`),
      completado: booleano(fila.completado, `${ruta}.completado`),
      ...(valor !== undefined ? { valor } : {}),
      ...(nota !== undefined ? { nota } : {}),
      creadoEn: texto(fila.creadoEn, `${ruta}.creadoEn`),
    }
  })

  const idsSesiones = new Set<string>()
  const sesionesEstudio: SesionEstudio[] = listaOpcional(
    datosBrutos,
    'sesionesEstudio',
  ).map((item, indice) => {
    const ruta = `sesionesEstudio[${indice}]`
    const fila = registro(item, ruta)
    const asignaturaId = texto(fila.asignaturaId, `${ruta}.asignaturaId`)
    if (!idsAsignaturas.has(asignaturaId)) {
      throw new ErrorImportacion(
        `La sesión ${indice + 1} apunta a una asignatura que no existe.`,
      )
    }
    const notas = textoOpcional(fila.notas, `${ruta}.notas`)
    return {
      id: idUnico(fila.id, `${ruta}.id`, idsSesiones),
      asignaturaId,
      fecha: fecha(fila.fecha, `${ruta}.fecha`),
      inicio: hora(fila.inicio, `${ruta}.inicio`),
      fin: hora(fila.fin, `${ruta}.fin`),
      duracionMinutos: numero(
        fila.duracionMinutos,
        `${ruta}.duracionMinutos`,
      ),
      ...(notas !== undefined ? { notas } : {}),
      creadoEn: texto(fila.creadoEn, `${ruta}.creadoEn`),
    }
  })

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
    sincronizacionAutomatica:
      typeof ajustesBrutos.sincronizacionAutomatica === 'boolean'
        ? ajustesBrutos.sincronizacionAutomatica
        : true,
    notificacionesResumenDiario:
      ajustesBrutos.notificacionesResumenDiario === true,
    horaResumenDiario:
      typeof ajustesBrutos.horaResumenDiario === 'string'
        ? ajustesBrutos.horaResumenDiario
        : '08:00',
    notificacionesProximosEventos:
      ajustesBrutos.notificacionesProximosEventos === true,
    horaAvisosProximosEventos:
      typeof ajustesBrutos.horaAvisosProximosEventos === 'string'
        ? ajustesBrutos.horaAvisosProximosEventos
        : '09:00',
  }

  return normalizarDatos({
    version: VERSION_DATOS,
    asignaturas,
    temas,
    examenes,
    tareas,
    proyectos,
    checklist,
    habitos,
    registrosHabitos,
    sesionesEstudio,
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

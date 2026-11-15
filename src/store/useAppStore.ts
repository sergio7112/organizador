import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Asignatura,
  Ajustes,
  Datos,
  ErrorTema,
  EstadoTema,
  Examen,
  ItemChecklist,
  Proyecto,
  Tarea,
  Tema,
} from '../domain/types'
import { migrarColoresCalidos } from '../domain/colors'
import { crearDatosVacios } from '../domain/empty'
import { normalizarDatos } from '../domain/normalize'
import { nuevoId } from '../domain/ids'
import { hoyISO } from '../domain/dates'
import { crearRepasos, estadoTrasCompletarRepaso } from '../domain/spacedRepetition'

export type EntradaTarea = Omit<Tarea, 'id' | 'creadaEn' | 'completadaEn'>
export type EntradaExamen = Omit<Examen, 'id' | 'creadoEn'>
export type EntradaProyecto = Pick<
  Proyecto,
  'nombre' | 'color' | 'descripcion' | 'notasMarkdown'
>

export interface Acciones {
  crearAsignatura: (datos: { nombre: string; color: string }) => string
  actualizarAsignatura: (
    id: string,
    cambios: Partial<Pick<Asignatura, 'nombre' | 'color'>>,
  ) => void
  eliminarAsignatura: (id: string) => void

  crearTema: (datos: { asignaturaId: string; titulo: string }) => string
  actualizarTema: (
    id: string,
    cambios: Partial<Pick<Tema, 'titulo' | 'estado' | 'nota' | 'orden'>>,
  ) => void
  eliminarTema: (id: string) => void

  crearTarea: (datos: EntradaTarea) => string
  actualizarTarea: (id: string, cambios: Partial<EntradaTarea>) => void
  eliminarTarea: (id: string) => void

  crearExamen: (datos: EntradaExamen) => string
  actualizarExamen: (id: string, cambios: Partial<EntradaExamen>) => void
  eliminarExamen: (id: string) => void

  crearProyecto: (datos: EntradaProyecto) => string
  actualizarProyecto: (
    id: string,
    cambios: Partial<Omit<Proyecto, 'id' | 'creadoEn'>>,
  ) => void
  eliminarProyecto: (id: string) => void

  crearItemChecklist: (proyectoId: string, texto: string) => void
  actualizarItemChecklist: (
    id: string,
    cambios: Partial<Pick<ItemChecklist, 'texto' | 'hecho' | 'orden'>>,
  ) => void
  eliminarItemChecklist: (id: string) => void

  completarRepaso: (id: string) => void

  crearError: (datos: { temaId: string; queFallo: string; porQue: string }) => void
  actualizarError: (
    id: string,
    cambios: Partial<Pick<ErrorTema, 'queFallo' | 'porQue' | 'resuelto'>>,
  ) => void
  eliminarError: (id: string) => void

  cambiarAjustes: (cambios: Partial<Ajustes>) => void
  reemplazarDatos: (datos: Datos) => void
}

export interface Tienda extends Acciones {
  datos: Datos
}

const AHORA = () => new Date().toISOString()

/** Versión del formato guardado en localStorage (independiente del JSON exportado). */
const VERSION_ALMACENAMIENTO = 2

type EstadoPersistido = { datos: Datos }

export const useAppStore = create<Tienda>()(
  persist(
    (set) => {
      const editar = (fn: (datos: Datos) => Datos) =>
        set((estado) => ({ datos: fn(estado.datos) }))

      return {
        datos: crearDatosVacios(),

        crearAsignatura: ({ nombre, color }) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            asignaturas: [
              ...datos.asignaturas,
              {
                id,
                nombre: nombre.trim(),
                color,
                orden:
                  datos.asignaturas.reduce(
                    (maximo, asignatura) => Math.max(maximo, asignatura.orden),
                    -1,
                  ) + 1,
                creadaEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarAsignatura: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            asignaturas: datos.asignaturas.map((asignatura) =>
              asignatura.id === id ? { ...asignatura, ...cambios } : asignatura,
            ),
          })),

        eliminarAsignatura: (id) =>
          editar((datos) => {
            const temasEliminados = new Set(
              datos.temas
                .filter((tema) => tema.asignaturaId === id)
                .map((tema) => tema.id),
            )
            return {
              ...datos,
              asignaturas: datos.asignaturas.filter(
                (asignatura) => asignatura.id !== id,
              ),
              temas: datos.temas.filter((tema) => !temasEliminados.has(tema.id)),
              examenes: datos.examenes.filter(
                (examen) => examen.asignaturaId !== id,
              ),
              tareas: datos.tareas.map((tarea) =>
                tarea.vinculo?.tipo === 'asignatura' && tarea.vinculo.id === id
                  ? { ...tarea, vinculo: undefined }
                  : tarea,
              ),
              repasos: datos.repasos.filter(
                (repaso) => !temasEliminados.has(repaso.temaId),
              ),
              errores: datos.errores.filter(
                (error) => !temasEliminados.has(error.temaId),
              ),
            }
          }),

        crearTema: ({ asignaturaId, titulo }) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            temas: [
              ...datos.temas,
              {
                id,
                asignaturaId,
                titulo: titulo.trim(),
                estado: 'sin_empezar',
                orden: datos.temas.filter((tema) => tema.asignaturaId === asignaturaId)
                  .length,
                actualizadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarTema: (id, cambios) =>
          editar((datos) => {
            const anterior = datos.temas.find((tema) => tema.id === id)
            if (!anterior) return datos

            const tema: Tema = {
              ...anterior,
              ...cambios,
              actualizadoEn: AHORA(),
            }
            let repasos = datos.repasos

            if (cambios.estado && cambios.estado !== anterior.estado) {
              const pendientes = repasos.filter(
                (repaso) => repaso.temaId === id && !repaso.completadoEn,
              )

              if (cambios.estado === 'sin_empezar') {
                repasos = repasos.filter(
                  (repaso) => !(repaso.temaId === id && !repaso.completadoEn),
                )
              } else if (cambios.estado === 'estudiando' && pendientes.length === 0) {
                repasos = [...repasos, ...crearRepasos(id)]
              } else if (cambios.estado === 'dominado') {
                repasos = repasos.map((repaso) =>
                  repaso.temaId === id && !repaso.completadoEn
                    ? { ...repaso, completadoEn: AHORA() }
                    : repaso,
                )
              }
            }

            return {
              ...datos,
              temas: datos.temas.map((actual) => (actual.id === id ? tema : actual)),
              repasos,
            }
          }),

        eliminarTema: (id) =>
          editar((datos) => ({
            ...datos,
            temas: datos.temas.filter((tema) => tema.id !== id),
            examenes: datos.examenes.map((examen) => ({
              ...examen,
              temaIds: examen.temaIds.filter((temaId) => temaId !== id),
            })),
            repasos: datos.repasos.filter((repaso) => repaso.temaId !== id),
            errores: datos.errores.filter((error) => error.temaId !== id),
          })),

        crearTarea: (entrada) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            tareas: [
              ...datos.tareas,
              {
                ...entrada,
                id,
                creadaEn: AHORA(),
                ...(entrada.estado === 'hecha' ? { completadaEn: AHORA() } : {}),
              },
            ],
          }))
          return id
        },

        actualizarTarea: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            tareas: datos.tareas.map((tarea) => {
              if (tarea.id !== id) return tarea
              const estado = cambios.estado ?? tarea.estado
              return {
                ...tarea,
                ...cambios,
                ...(estado === 'hecha'
                  ? { completadaEn: tarea.completadaEn ?? AHORA() }
                  : { completadaEn: undefined }),
              }
            }),
          })),

        eliminarTarea: (id) =>
          editar((datos) => ({
            ...datos,
            tareas: datos.tareas.filter((tarea) => tarea.id !== id),
          })),

        crearExamen: (entrada) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            examenes: [
              ...datos.examenes,
              {
                ...entrada,
                temaIds: [...new Set(entrada.temaIds)],
                id,
                creadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarExamen: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            examenes: datos.examenes.map((examen) =>
              examen.id === id
                ? {
                    ...examen,
                    ...cambios,
                    temaIds: cambios.temaIds
                      ? [...new Set(cambios.temaIds)]
                      : examen.temaIds,
                  }
                : examen,
            ),
          })),

        eliminarExamen: (id) =>
          editar((datos) => ({
            ...datos,
            examenes: datos.examenes.filter((examen) => examen.id !== id),
          })),

        crearProyecto: (entrada) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            proyectos: [
              ...datos.proyectos,
              {
                nombre: entrada.nombre.trim(),
                color: entrada.color,
                ...(entrada.descripcion ? { descripcion: entrada.descripcion } : {}),
                notasMarkdown: entrada.notasMarkdown ?? '',
                id,
                creadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarProyecto: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            proyectos: datos.proyectos.map((proyecto) =>
              proyecto.id === id ? { ...proyecto, ...cambios } : proyecto,
            ),
          })),

        eliminarProyecto: (id) =>
          editar((datos) => ({
            ...datos,
            proyectos: datos.proyectos.filter((proyecto) => proyecto.id !== id),
            checklist: datos.checklist.filter((item) => item.proyectoId !== id),
            tareas: datos.tareas.map((tarea) =>
              tarea.vinculo?.tipo === 'proyecto' && tarea.vinculo.id === id
                ? { ...tarea, vinculo: undefined }
                : tarea,
            ),
          })),

        crearItemChecklist: (proyectoId, texto) =>
          editar((datos) => ({
            ...datos,
            checklist: [
              ...datos.checklist,
              {
                id: nuevoId(),
                proyectoId,
                texto: texto.trim(),
                hecho: false,
                orden: datos.checklist.filter((item) => item.proyectoId === proyectoId)
                  .length,
              },
            ],
          })),

        actualizarItemChecklist: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            checklist: datos.checklist.map((item) =>
              item.id === id ? { ...item, ...cambios } : item,
            ),
          })),

        eliminarItemChecklist: (id) =>
          editar((datos) => ({
            ...datos,
            checklist: datos.checklist.filter((item) => item.id !== id),
          })),

        completarRepaso: (id) =>
          editar((datos) => {
            const repaso = datos.repasos.find((actual) => actual.id === id)
            if (!repaso) return datos

            const completadoEn = AHORA()
            const repasos = datos.repasos.map((actual) => {
              if (actual.id === id) return { ...actual, completadoEn }
              if (
                repaso.intervaloDias === 7 &&
                actual.temaId === repaso.temaId &&
                !actual.completadoEn
              ) {
                return { ...actual, completadoEn }
              }
              return actual
            })
            const tema = datos.temas.find((actual) => actual.id === repaso.temaId)
            if (!tema) return { ...datos, repasos }

            const estado = estadoTrasCompletarRepaso(repaso, tema)
            if (estado === tema.estado) return { ...datos, repasos }

            return {
              ...datos,
              repasos,
              temas: datos.temas.map((actual) =>
                actual.id === tema.id
                  ? { ...actual, estado, actualizadoEn: completadoEn }
                  : actual,
              ),
            }
          }),

        crearError: ({ temaId, queFallo, porQue }) =>
          editar((datos) => ({
            ...datos,
            errores: [
              ...datos.errores,
              {
                id: nuevoId(),
                temaId,
                queFallo: queFallo.trim(),
                porQue: porQue.trim(),
                fecha: hoyISO(),
                resuelto: false,
              },
            ],
          })),

        actualizarError: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            errores: datos.errores.map((error) =>
              error.id === id ? { ...error, ...cambios } : error,
            ),
          })),

        eliminarError: (id) =>
          editar((datos) => ({
            ...datos,
            errores: datos.errores.filter((error) => error.id !== id),
          })),

        cambiarAjustes: (cambios) =>
          editar((datos) => ({
            ...datos,
            ajustes: { ...datos.ajustes, ...cambios },
          })),

        reemplazarDatos: (datos) =>
          set({
            datos: normalizarDatos(
              migrarColoresCalidos(structuredClone(datos)),
            ),
          }),
      }
    },
    {
      name: 'organizador:v1',
      version: VERSION_ALMACENAMIENTO,
      storage: createJSONStorage(() => localStorage),
      partialize: (estado) => ({ datos: estado.datos }),
      migrate: (persistido, version): EstadoPersistido => {
        const guardado = persistido as { datos?: Partial<Datos> } | undefined

        if (version >= VERSION_ALMACENAMIENTO && guardado?.datos) {
          return guardado as EstadoPersistido
        }

        // Las versiones anteriores se instalaban con datos de ejemplo. Al
        // actualizar se vacían, conservando solo las preferencias de la app.
        const vacios = crearDatosVacios()
        return {
          datos: {
            ...vacios,
            ajustes: {
              ...vacios.ajustes,
              ...(guardado?.datos?.ajustes ?? {}),
            },
          },
        }
      },
      merge: (persistido, actual) => {
        const guardado = persistido as { datos?: Partial<Datos> } | undefined
        if (!guardado?.datos) return actual
        return {
          ...actual,
          datos: normalizarDatos(migrarColoresCalidos(guardado.datos)),
        }
      },
    },
  ),
)

export type { Datos, EstadoTema }

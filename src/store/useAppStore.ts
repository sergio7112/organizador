import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type {
  Asignatura,
  Ajustes,
  Datos,
  ErrorTema,
  EstadoTema,
  Examen,
  Habito,
  ItemChecklist,
  Proyecto,
  RegistroHabito,
  SesionEstudio,
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
export type EntradaHabito = Omit<Habito, 'id' | 'creadoEn' | 'orden' | 'archivado'>
export type EntradaRegistroHabito = Omit<RegistroHabito, 'id' | 'creadoEn'>
export type EntradaSesionEstudio = Omit<SesionEstudio, 'id' | 'creadoEn' | 'duracionMinutos'>

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

  // Hábitos
  crearHabito: (datos: EntradaHabito) => string
  actualizarHabito: (id: string, cambios: Partial<EntradaHabito>) => void
  eliminarHabito: (id: string) => void
  archivarHabito: (id: string, archivado: boolean) => void
  reordenarHabitos: (ids: string[]) => void

  // Registros de hábitos
  crearRegistroHabito: (datos: EntradaRegistroHabito) => string
  actualizarRegistroHabito: (id: string, cambios: Partial<EntradaRegistroHabito>) => void
  eliminarRegistroHabito: (id: string) => void
  alternarRegistroHabito: (habitoId: string, fecha: string) => void

  // Sesiones de estudio
  crearSesionEstudio: (datos: EntradaSesionEstudio) => string
  actualizarSesionEstudio: (id: string, cambios: Partial<EntradaSesionEstudio>) => void
  eliminarSesionEstudio: (id: string) => void

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

        // Hábitos
        crearHabito: (entrada) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            habitos: [
              ...datos.habitos,
              {
                ...entrada,
                nombre: entrada.nombre.trim(),
                descripcion: entrada.descripcion?.trim(),
                id,
                archivado: false,
                orden: datos.habitos.reduce(
                  (maximo, habito) => Math.max(maximo, habito.orden),
                  -1,
                ) + 1,
                creadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarHabito: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            habitos: datos.habitos.map((habito) =>
              habito.id === id ? { ...habito, ...cambios } : habito,
            ),
          })),

        eliminarHabito: (id) =>
          editar((datos) => ({
            ...datos,
            habitos: datos.habitos.filter((habito) => habito.id !== id),
            registrosHabitos: datos.registrosHabitos.filter(
              (registro) => registro.habitoId !== id,
            ),
          })),

        archivarHabito: (id, archivado) =>
          editar((datos) => ({
            ...datos,
            habitos: datos.habitos.map((habito) =>
              habito.id === id ? { ...habito, archivado } : habito,
            ),
          })),

        reordenarHabitos: (ids) =>
          editar((datos) => ({
            ...datos,
            habitos: ids.map((id, index) => {
              const habito = datos.habitos.find((h) => h.id === id)
              return habito ? { ...habito, orden: index } : null
            }).filter((h): h is Habito => h !== null),
          })),

        // Registros de hábitos
        crearRegistroHabito: (entrada) => {
          const id = nuevoId()
          editar((datos) => ({
            ...datos,
            registrosHabitos: [
              ...datos.registrosHabitos,
              {
                ...entrada,
                id,
                creadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarRegistroHabito: (id, cambios) =>
          editar((datos) => ({
            ...datos,
            registrosHabitos: datos.registrosHabitos.map((registro) =>
              registro.id === id ? { ...registro, ...cambios } : registro,
            ),
          })),

        eliminarRegistroHabito: (id) =>
          editar((datos) => ({
            ...datos,
            registrosHabitos: datos.registrosHabitos.filter(
              (registro) => registro.id !== id,
            ),
          })),

        alternarRegistroHabito: (habitoId, fecha) =>
          editar((datos) => {
            const existente = datos.registrosHabitos.find(
              (r) => r.habitoId === habitoId && r.fecha === fecha,
            )
            if (existente) {
              return {
                ...datos,
                registrosHabitos: datos.registrosHabitos.map((r) =>
                  r.id === existente.id ? { ...r, completado: !r.completado } : r,
                ),
              }
            }
            const habito = datos.habitos.find((h) => h.id === habitoId)
            return {
              ...datos,
              registrosHabitos: [
                ...datos.registrosHabitos,
                {
                  id: nuevoId(),
                  habitoId,
                  fecha,
                  completado: true,
                  valor: habito?.objetivo ? 1 : undefined,
                  creadoEn: AHORA(),
                },
              ],
            }
          }),

        // Sesiones de estudio
        crearSesionEstudio: (entrada) => {
          const id = nuevoId()
          const inicio = new Date(`1970-01-01T${entrada.inicio}:00`)
          const fin = new Date(`1970-01-01T${entrada.fin}:00`)
          const duracionMinutos = Math.round((fin.getTime() - inicio.getTime()) / 60000)
          editar((datos) => ({
            ...datos,
            sesionesEstudio: [
              ...datos.sesionesEstudio,
              {
                ...entrada,
                id,
                duracionMinutos: Math.max(0, duracionMinutos),
                creadoEn: AHORA(),
              },
            ],
          }))
          return id
        },

        actualizarSesionEstudio: (id, cambios) =>
          editar((datos) => {
            const sesion = datos.sesionesEstudio.find((s) => s.id === id)
            if (!sesion) return datos
            const inicio = cambios.inicio ?? sesion.inicio
            const fin = cambios.fin ?? sesion.fin
            const inicioDate = new Date(`1970-01-01T${inicio}:00`)
            const finDate = new Date(`1970-01-01T${fin}:00`)
            const duracionMinutos = Math.round(
              (finDate.getTime() - inicioDate.getTime()) / 60000,
            )
            return {
              ...datos,
              sesionesEstudio: datos.sesionesEstudio.map((s) =>
                s.id === id
                  ? { ...s, ...cambios, duracionMinutos: Math.max(0, duracionMinutos) }
                  : s,
              ),
            }
          }),

        eliminarSesionEstudio: (id) =>
          editar((datos) => ({
            ...datos,
            sesionesEstudio: datos.sesionesEstudio.filter(
              (sesion) => sesion.id !== id,
            ),
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

import { useMemo, useState } from 'react'
import { ChevronDown, Plus, SlidersHorizontal, X } from 'lucide-react'
import type { EstadoTarea, Prioridad } from '../domain/types'
import {
  ESTADOS_TAREA,
  ETIQUETAS_ESTADO_TAREA,
  ETIQUETAS_PRIORIDAD,
  PRIORIDADES,
} from '../domain/types'
import { FILTROS_VACIOS, filtrarTareas } from '../domain/tasks'
import type { FiltrosTareas } from '../domain/tasks'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/format'
import { CabeceraPagina } from '../components/ui/CabeceraPagina'
import { Boton } from '../components/ui/Boton'
import { Tarjeta } from '../components/ui/Tarjeta'
import { Selector } from '../components/ui/Campos'
import { Etiqueta } from '../components/ui/Etiquetas'
import { ListaTareas } from '../components/tasks/ListaTareas'
import { ModalTarea } from '../components/tasks/ModalTarea'

export function PaginaTareas() {
  const datos = useAppStore((estado) => estado.datos)
  const [filtros, setFiltros] = useState<FiltrosTareas>(FILTROS_VACIOS)
  const [modalTarea, setModalTarea] = useState(false)
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const asignaturas = useMemo(
    () => datos.asignaturas.slice().sort((a, b) => a.orden - b.orden),
    [datos.asignaturas],
  )

  const filtradas = useMemo(
    () => filtrarTareas(datos.tareas, filtros),
    [datos.tareas, filtros],
  )

  const hayFiltros =
    filtros.asignaturaId !== 'todas' ||
    filtros.prioridad !== 'todas' ||
    filtros.estado !== 'todas'

  const filtrosActivos = [
    filtros.asignaturaId !== 'todas',
    filtros.prioridad !== 'todas',
    filtros.estado !== 'todas',
  ].filter(Boolean).length

  const activas = filtradas.filter((tarea) => tarea.estado !== 'hecha').length

  return (
    <>
      <CabeceraPagina
        titulo="Tareas"
        descripcion={`${activas} ${activas === 1 ? 'tarea activa' : 'tareas activas'}`}
        accion={
          <Boton onClick={() => setModalTarea(true)}>
            <Plus size={17} />
            Nueva tarea
          </Boton>
        }
      />

      <Tarjeta className="mb-5 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setMostrarFiltros((visible) => !visible)}
            aria-expanded={mostrarFiltros}
            aria-controls="panel-filtros"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--texto-suave)] sm:pointer-events-none"
          >
            <SlidersHorizontal size={14} />
            Filtros
            {filtrosActivos > 0 && <Etiqueta tono="primario">{filtrosActivos}</Etiqueta>}
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform sm:hidden',
                mostrarFiltros && 'rotate-180',
              )}
            />
          </button>
          {hayFiltros && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={() => setFiltros(FILTROS_VACIOS)}
              className="h-7 px-2 text-xs"
            >
              <X size={13} />
              Limpiar
            </Boton>
          )}
        </div>
        <div
          id="panel-filtros"
          className={cn(
            'grid gap-2 sm:grid-cols-2 xl:grid-cols-3',
            !mostrarFiltros && 'hidden sm:grid',
          )}
        >
          <Selector
            aria-label="Filtrar por asignatura"
            value={filtros.asignaturaId}
            onChange={(evento) =>
              setFiltros((actuales) => ({
                ...actuales,
                asignaturaId: evento.target.value,
              }))
            }
            className="h-10 text-sm"
          >
            <option value="todas">Todas las asignaturas</option>
            {asignaturas.map((asignatura) => (
              <option key={asignatura.id} value={asignatura.id}>
                {asignatura.nombre}
              </option>
            ))}
          </Selector>

          <Selector
            aria-label="Filtrar por prioridad"
            value={filtros.prioridad}
            onChange={(evento) =>
              setFiltros((actuales) => ({
                ...actuales,
                prioridad: evento.target.value as Prioridad | 'todas',
              }))
            }
            className="h-10 text-sm"
          >
            <option value="todas">Todas las prioridades</option>
            {PRIORIDADES.map((prioridad) => (
              <option key={prioridad} value={prioridad}>
                Prioridad {ETIQUETAS_PRIORIDAD[prioridad].toLowerCase()}
              </option>
            ))}
          </Selector>

          <Selector
            aria-label="Filtrar por estado"
            value={filtros.estado}
            onChange={(evento) =>
              setFiltros((actuales) => ({
                ...actuales,
                estado: evento.target.value as EstadoTarea | 'todas',
              }))
            }
            className="h-10 text-sm sm:col-span-2 xl:col-span-1"
          >
            <option value="todas">Todos los estados</option>
            {ESTADOS_TAREA.map((estado) => (
              <option key={estado} value={estado}>
                {ETIQUETAS_ESTADO_TAREA[estado]}
              </option>
            ))}
          </Selector>
        </div>
      </Tarjeta>

      <ListaTareas
        tareas={filtradas}
        agrupada
        accionVacio={
          <Boton variante="secundario" onClick={() => setModalTarea(true)}>
            <Plus size={16} />
            Crear la primera tarea
          </Boton>
        }
      />

      <ModalTarea abierto={modalTarea} onCerrar={() => setModalTarea(false)} />
    </>
  )
}

import { CalendarClock, Check, Pencil, Trash2 } from 'lucide-react'
import type { Asignatura, Proyecto, Tarea } from '../../domain/types'
import { esAtrasada, fechaCorta, textoDias } from '../../domain/dates'
import { cn } from '../../lib/format'
import { Boton } from '../ui/Boton'
import {
  EtiquetaPrioridad,
  EtiquetaEstadoTarea,
  PuntoColor,
} from '../ui/Etiquetas'

export function FilaTarea({
  tarea,
  asignatura,
  proyecto,
  onAlternar,
  onEditar,
  onEliminar,
}: {
  tarea: Tarea
  asignatura?: Asignatura
  proyecto?: Proyecto
  onAlternar: () => void
  onEditar: () => void
  onEliminar: () => void
}) {
  const hecha = tarea.estado === 'hecha'
  const atrasada = !hecha && esAtrasada(tarea.fechaLimite)

  return (
    <li className="flex items-start gap-2 px-3 py-3 sm:gap-3 sm:px-4">
      <button
        type="button"
        role="checkbox"
        aria-checked={hecha}
        aria-label={
          hecha ? `Marcar «${tarea.titulo}» como pendiente` : `Marcar «${tarea.titulo}» como hecha`
        }
        onClick={onAlternar}
        className={cn(
          'relative mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition-colors after:absolute after:-inset-2 after:content-[""]',
          hecha
            ? 'border-[var(--exito)] bg-[var(--exito)] text-[var(--primario-contraste)]'
            : 'border-[var(--borde)] hover:border-[var(--primario)]',
        )}
      >
        {hecha && <Check size={14} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm font-medium leading-snug',
            hecha && 'text-[var(--texto-suave)] line-through',
          )}
        >
          {tarea.titulo}
        </p>
        {tarea.descripcion && !hecha && (
          <p className="mt-0.5 line-clamp-2 text-xs text-[var(--texto-suave)]">
            {tarea.descripcion}
          </p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs">
          {asignatura && (
            <span className="inline-flex items-center gap-1.5 text-[var(--texto-suave)]">
              <PuntoColor color={asignatura.color} />
              {asignatura.nombre}
            </span>
          )}
          {proyecto && (
            <span className="inline-flex items-center gap-1.5 text-[var(--texto-suave)]">
              <PuntoColor color={proyecto.color} />
              {proyecto.nombre}
            </span>
          )}
          <EtiquetaPrioridad prioridad={tarea.prioridad} />
          {tarea.estado === 'en_curso' && (
            <EtiquetaEstadoTarea estado={tarea.estado} />
          )}
          <span
            className={cn(
              'inline-flex items-center gap-1',
              atrasada
                ? 'font-medium text-[var(--peligro)]'
                : 'text-[var(--texto-suave)]',
            )}
          >
            <CalendarClock size={13} />
            <span>{textoDias(tarea.fechaLimite)}</span>
            <span aria-hidden="true">·</span>
            <span>{fechaCorta(tarea.fechaLimite)}</span>
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <Boton
          variante="fantasma"
          tamano="icono"
          onClick={onEditar}
          aria-label={`Editar ${tarea.titulo}`}
          className="size-9"
        >
          <Pencil size={16} />
        </Boton>
        <Boton
          variante="fantasma"
          tamano="icono"
          onClick={onEliminar}
          aria-label={`Eliminar ${tarea.titulo}`}
          className="size-9 hover:text-[var(--peligro)]"
        >
          <Trash2 size={16} />
        </Boton>
      </div>
    </li>
  )
}

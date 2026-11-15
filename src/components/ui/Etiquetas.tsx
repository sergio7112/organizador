import type { ReactNode } from 'react'
import { cn } from '../../lib/format'
import type {
  EstadoTarea,
  EstadoTema,
  Prioridad,
} from '../../domain/types'
import {
  ETIQUETAS_ESTADO_TAREA,
  ETIQUETAS_ESTADO_TEMA,
  ETIQUETAS_PRIORIDAD,
} from '../../domain/types'

type Tono = 'neutro' | 'primario' | 'exito' | 'aviso' | 'peligro'

const TONOS: Record<Tono, string> = {
  neutro: 'bg-[var(--superficie-2)] text-[var(--texto-suave)]',
  primario: 'bg-[var(--primario-suave)] text-[var(--primario)]',
  exito: 'bg-[var(--exito-suave)] text-[var(--exito)]',
  aviso: 'bg-[var(--aviso-suave)] text-[var(--aviso)]',
  peligro: 'bg-[var(--peligro-suave)] text-[var(--peligro)]',
}

export function Etiqueta({
  children,
  tono = 'neutro',
  className,
}: {
  children: ReactNode
  tono?: Tono
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium leading-5',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function PuntoColor({
  color,
  className,
}: {
  color: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn('inline-block size-2.5 shrink-0 rounded-full', className)}
      style={{ backgroundColor: color }}
    />
  )
}

const TONO_ESTADO_TEMA: Record<EstadoTema, Tono> = {
  sin_empezar: 'neutro',
  estudiando: 'aviso',
  repasado: 'primario',
  dominado: 'exito',
}

export function EtiquetaEstadoTema({ estado }: { estado: EstadoTema }) {
  return <Etiqueta tono={TONO_ESTADO_TEMA[estado]}>{ETIQUETAS_ESTADO_TEMA[estado]}</Etiqueta>
}

const TONO_PRIORIDAD: Record<Prioridad, Tono> = {
  alta: 'peligro',
  media: 'aviso',
  baja: 'neutro',
}

export function EtiquetaPrioridad({ prioridad }: { prioridad: Prioridad }) {
  return (
    <Etiqueta tono={TONO_PRIORIDAD[prioridad]}>{ETIQUETAS_PRIORIDAD[prioridad]}</Etiqueta>
  )
}

const TONO_ESTADO_TAREA: Record<EstadoTarea, Tono> = {
  pendiente: 'neutro',
  en_curso: 'primario',
  hecha: 'exito',
}

export function EtiquetaEstadoTarea({ estado }: { estado: EstadoTarea }) {
  return (
    <Etiqueta tono={TONO_ESTADO_TAREA[estado]}>{ETIQUETAS_ESTADO_TAREA[estado]}</Etiqueta>
  )
}

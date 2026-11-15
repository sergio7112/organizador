import { CalendarDays, GraduationCap, Pencil, Trash2 } from 'lucide-react'
import type { Asignatura, Examen } from '../../domain/types'
import type { ProgresoExamen } from '../../domain/exams'
import { fechaCorta, diasHasta, esAtrasada, textoDias } from '../../domain/dates'
import { cn } from '../../lib/format'
import { Tarjeta } from '../ui/Tarjeta'
import { BarraProgreso } from '../ui/BarraProgreso'
import { Etiqueta, PuntoColor } from '../ui/Etiquetas'
import { Boton } from '../ui/Boton'

export function TarjetaExamen({
  examen,
  asignatura,
  progreso,
  onEditar,
  onEliminar,
}: {
  examen: Examen
  asignatura?: Asignatura
  progreso: ProgresoExamen
  onEditar?: () => void
  onEliminar?: () => void
}) {
  const pasado = esAtrasada(examen.fecha)
  const dias = diasHasta(examen.fecha)
  const urgente = dias >= 0 && dias <= 3

  return (
    <Tarjeta className="flex flex-col p-4">
      <div className="flex items-start gap-3">
        <span className="mt-1.5">
          <PuntoColor color={asignatura?.color ?? 'var(--primario)'} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug">{examen.titulo}</p>
          <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
            {asignatura?.nombre ?? 'Asignatura eliminada'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={cn(
              'text-lg font-semibold leading-none tabular-nums',
              urgente && !pasado ? 'text-[var(--peligro)]' : '',
              pasado && 'text-[var(--texto-suave)]',
            )}
          >
            {pasado ? textoDias(examen.fecha) : dias === 0 ? 'Hoy' : `${dias} d`}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[var(--texto-suave)]">
            <CalendarDays size={11} />
            {fechaCorta(examen.fecha)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <BarraProgreso
          valor={progreso.porcentajeDominado}
          etiqueta={`Temario dominado de ${examen.titulo}`}
        />
        <span className="w-9 text-right text-xs font-medium tabular-nums">
          {progreso.porcentajeDominado}%
        </span>
      </div>
      <p className="mt-1.5 text-xs text-[var(--texto-suave)]">
        {progreso.total === 0
          ? 'Sin temas asignados'
          : `${progreso.dominados} de ${progreso.total} temas dominados`}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {progreso.estudiando > 0 && (
          <Etiqueta tono="aviso">{progreso.estudiando} en estudio</Etiqueta>
        )}
        {progreso.repasados > 0 && (
          <Etiqueta tono="primario">
            {progreso.repasados} {progreso.repasados === 1 ? 'repasado' : 'repasados'}
          </Etiqueta>
        )}
        {progreso.sinEmpezar > 0 && (
          <Etiqueta>{progreso.sinEmpezar} sin empezar</Etiqueta>
        )}
        {progreso.total > 0 && progreso.dominados === progreso.total && (
          <Etiqueta tono="exito">
            <GraduationCap size={12} />
            Todo dominado
          </Etiqueta>
        )}
      </div>

      {(onEditar || onEliminar) && (
        <div className="mt-3 flex justify-end gap-1 border-t border-[var(--borde)] pt-2">
          {onEditar && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={onEditar}
              aria-label={`Editar ${examen.titulo}`}
            >
              <Pencil size={14} />
              Editar
            </Boton>
          )}
          {onEliminar && (
            <Boton
              variante="fantasma"
              tamano="sm"
              onClick={onEliminar}
              aria-label={`Eliminar ${examen.titulo}`}
              className="text-[var(--peligro)]"
            >
              <Trash2 size={14} />
              Eliminar
            </Boton>
          )}
        </div>
      )}
    </Tarjeta>
  )
}

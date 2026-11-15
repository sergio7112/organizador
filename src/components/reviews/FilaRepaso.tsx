import { Link } from 'react-router-dom'
import { CalendarClock, Check } from 'lucide-react'
import type { Asignatura, Repaso, Tema } from '../../domain/types'
import { hoyISO, textoDias } from '../../domain/dates'
import { Boton } from '../ui/Boton'
import { Etiqueta, PuntoColor } from '../ui/Etiquetas'

export function FilaRepaso({
  repaso,
  tema,
  asignatura,
  onCompletar,
}: {
  repaso: Repaso
  tema: Tema
  asignatura?: Asignatura
  onCompletar: () => void
}) {
  const atrasado = repaso.fecha < hoyISO()

  return (
    <li className="flex items-start gap-3 px-3 py-3 sm:px-4">
      <span className="mt-1.5">
        <PuntoColor color={asignatura?.color ?? 'var(--primario)'} />
      </span>
      <div className="min-w-0 flex-1">
        <Link
          to={`/asignaturas/${tema.asignaturaId}`}
          className="text-sm font-medium hover:underline"
        >
          {tema.titulo}
        </Link>
        <p className="mt-0.5 text-xs text-[var(--texto-suave)]">
          {asignatura?.nombre ?? 'Asignatura'} · Repaso a {repaso.intervaloDias}{' '}
          {repaso.intervaloDias === 1 ? 'día' : 'días'}
        </p>
        <div className="mt-1.5">
          <Etiqueta tono={atrasado ? 'peligro' : 'aviso'}>
            <CalendarClock size={11} />
            {atrasado ? `Atrasado · ${textoDias(repaso.fecha)}` : 'Hoy'}
          </Etiqueta>
        </div>
      </div>
      <Boton
        tamano="sm"
        onClick={onCompletar}
        aria-label={`Marcar repaso de ${tema.titulo} como hecho`}
      >
        <Check size={15} />
        Hecho
      </Boton>
    </li>
  )
}

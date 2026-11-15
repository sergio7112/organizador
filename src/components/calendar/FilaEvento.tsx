import { Link } from 'react-router-dom'
import { GraduationCap, ListChecks } from 'lucide-react'
import type { EventoCalendario } from '../../domain/calendar'
import { Etiqueta } from '../ui/Etiquetas'
import { cn } from '../../lib/format'

export function FilaEvento({
  evento,
  nombreAsignatura,
}: {
  evento: EventoCalendario
  nombreAsignatura?: string
}) {
  const Icono = evento.tipo === 'examen' ? GraduationCap : ListChecks
  const destino = evento.tipo === 'examen' ? '/examenes' : '/tareas'

  return (
    <Link
      to={destino}
      className="flex items-start gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--superficie-2)]"
    >
      <span
        className={cn(
          'mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg',
          evento.tipo === 'examen'
            ? 'bg-[var(--primario-suave)] text-[var(--primario)]'
            : 'bg-[var(--superficie-2)] text-[var(--texto-suave)]',
        )}
        style={
          evento.tipo === 'tarea'
            ? { color: evento.color, backgroundColor: `${evento.color}1a` }
            : undefined
        }
      >
        <Icono size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug">{evento.titulo}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--texto-suave)]">
          {evento.tipo === 'examen' ? 'Examen' : 'Entrega'}
          {nombreAsignatura ? ` · ${nombreAsignatura}` : ''}
        </p>
      </div>
      {evento.atrasada && <Etiqueta tono="peligro">Atrasada</Etiqueta>}
    </Link>
  )
}

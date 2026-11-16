import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function EstadoVacio({
  icono: Icono,
  titulo,
  descripcion,
  accion,
}: {
  icono: LucideIcon
  titulo: string
  descripcion?: string
  accion?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--borde)] px-6 py-12 text-center">
      <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-[var(--primario-suave)] text-[var(--primario)] ring-1 ring-[var(--primario-suave)]">
        <Icono size={22} />
      </span>
      <p className="text-sm font-semibold">{titulo}</p>
      {descripcion && (
        <p className="mt-1 max-w-sm text-sm text-[var(--texto-suave)]">{descripcion}</p>
      )}
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}

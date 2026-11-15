import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

export function CabeceraPagina({
  titulo,
  descripcion,
  accion,
  volver,
}: {
  titulo: string
  descripcion?: string
  accion?: ReactNode
  volver?: { ruta: string; etiqueta: string }
}) {
  return (
    <header className="mb-6">
      {volver && (
        <Link
          to={volver.ruta}
          className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-sm text-[var(--texto-suave)] transition-colors hover:text-[var(--texto)]"
        >
          <ChevronLeft size={16} />
          {volver.etiqueta}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{titulo}</h1>
          {descripcion && (
            <p className="mt-1 text-sm text-[var(--texto-suave)]">{descripcion}</p>
          )}
        </div>
        {accion}
      </div>
    </header>
  )
}

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
    <header className="mb-5">
      {volver && (
        <Link
          to={volver.ruta}
          className="-ml-1 mb-2 inline-flex items-center gap-0.5 text-[13px] text-[var(--texto-suave)] transition-colors hover:text-[var(--texto)]"
        >
          <ChevronLeft size={16} />
          {volver.etiqueta}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[24px] font-semibold leading-tight tracking-tight md:text-[28px]">
            {titulo}
          </h1>
          {descripcion && (
            <p className="mt-1 text-[13px] text-[var(--texto-suave)]">{descripcion}</p>
          )}
        </div>
        {accion && (
          <div className="w-full sm:w-auto sm:shrink-0 [&>*]:w-full sm:[&>*]:w-auto">
            {accion}
          </div>
        )}
      </div>
    </header>
  )
}

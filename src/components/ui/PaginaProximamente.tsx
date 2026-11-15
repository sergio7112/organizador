import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Boton } from './Boton'

export function PaginaProximamente({
  titulo,
  fase,
  descripcion,
  puntos,
}: {
  titulo: string
  fase: number
  descripcion: string
  puntos: string[]
}) {
  return (
    <div className="mx-auto max-w-xl py-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--primario)]">
        Fase {fase}
      </p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">{titulo}</h1>
      <p className="mt-2 text-sm text-[var(--texto-suave)]">{descripcion}</p>

      <ul className="mt-6 flex flex-col gap-2">
        {puntos.map((punto) => (
          <li key={punto} className="flex items-start gap-2 text-sm">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--primario)]" />
            {punto}
          </li>
        ))}
      </ul>

      <Boton variante="secundario" className="mt-8" onClick={() => window.history.back()}>
        <ArrowLeft size={16} />
        Volver
      </Boton>
      <Link
        to="/hoy"
        className="ml-4 text-sm text-[var(--texto-suave)] underline-offset-4 hover:underline"
      >
        Ir a Hoy
      </Link>
    </div>
  )
}

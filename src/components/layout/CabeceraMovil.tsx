import { Link } from 'react-router-dom'
import { GraduationCap, Settings } from 'lucide-react'

export function CabeceraMovil() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-[var(--borde)] bg-[var(--fondo)] px-4 pt-safe md:hidden">
      <Link to="/hoy" className="flex items-center gap-2 text-sm font-semibold">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--primario)] text-[var(--primario-contraste)]">
          <GraduationCap size={16} />
        </span>
        Organizador
      </Link>
      <Link
        to="/ajustes"
        aria-label="Ajustes"
        className="grid size-10 place-items-center rounded-xl text-[var(--texto-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]"
      >
        <Settings size={20} />
      </Link>
    </header>
  )
}

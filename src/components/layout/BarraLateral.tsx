import { Link, NavLink } from 'react-router-dom'
import { GraduationCap, Settings } from 'lucide-react'
import { SECCIONES, SECCION_AJUSTES } from './navegacion'
import { cn } from '../../lib/format'

const BASE_ENLACE =
  'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors'
const ACTIVO = 'bg-[var(--primario-suave)] text-[var(--primario)]'
const INACTIVO =
  'text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]'

export function BarraLateral() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-[var(--borde)] bg-[var(--superficie)] px-3 py-5 md:flex">
      <Link to="/hoy" className="mb-7 flex items-center gap-2.5 px-2">
        <span className="grid size-9 place-items-center rounded-xl bg-[var(--primario)] text-[var(--primario-contraste)]">
          <GraduationCap size={20} />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold leading-tight">Organizador</span>
          <span className="block text-xs text-[var(--texto-suave)]">
            2.º de Bachillerato
          </span>
        </span>
      </Link>

      <nav aria-label="Secciones" className="flex flex-col gap-1">
        {SECCIONES.map((seccion) => (
          <NavLink
            key={seccion.ruta}
            to={seccion.ruta}
            className={({ isActive }) =>
              cn(BASE_ENLACE, isActive ? ACTIVO : INACTIVO)
            }
          >
            <seccion.icono size={18} />
            {seccion.nombre}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-1 border-t border-[var(--borde)] pt-3">
        <NavLink
          to={SECCION_AJUSTES.ruta}
          className={({ isActive }) => cn(BASE_ENLACE, isActive ? ACTIVO : INACTIVO)}
        >
          <Settings size={18} />
          {SECCION_AJUSTES.nombre}
        </NavLink>
      </div>
    </aside>
  )
}

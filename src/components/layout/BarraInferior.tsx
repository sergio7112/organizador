import { NavLink } from 'react-router-dom'
import { SECCIONES } from './navegacion'
import { cn } from '../../lib/format'

export function BarraInferior() {
  const secciones = SECCIONES.filter((seccion) => seccion.enMovil)

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--borde)] bg-[var(--superficie)] pb-safe shadow-[0_-8px_24px_rgb(0_0_0/0.04)] md:hidden"
    >
      <ul className="grid grid-cols-5">
        {secciones.map((seccion) => (
          <li key={seccion.ruta}>
            <NavLink
              to={seccion.ruta}
              className="flex flex-col items-center gap-0.5 px-1 pb-1.5 pt-2 text-[10px] font-medium transition-colors"
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive
                        ? 'bg-[var(--primario-suave)] text-[var(--primario)]'
                        : 'text-[var(--texto-suave)]',
                    )}
                  >
                    <seccion.icono size={20} strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  <span
                    className={cn(
                      'leading-none',
                      isActive
                        ? 'text-[var(--primario)]'
                        : 'text-[var(--texto-suave)]',
                    )}
                  >
                    {seccion.nombre}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

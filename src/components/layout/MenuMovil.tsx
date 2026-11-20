import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { Settings, X } from 'lucide-react'
import { Logotipo } from '../ui/Logotipo'
import { SECCIONES, SECCION_AJUSTES } from './navegacion'
import { cn } from '../../lib/format'
import { bloquearScroll, desbloquearScroll } from '../../lib/scrollLock'

interface MenuMovilProps {
  abierto: boolean
  onCerrar: () => void
}

export function MenuMovil({ abierto, onCerrar }: MenuMovilProps) {
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)

    bloquearScroll()
    const focoAnterior = document.activeElement as HTMLElement | null
    panel.current?.querySelector<HTMLElement>('a, button')?.focus()

    return () => {
      document.removeEventListener('keydown', alPulsar)
      desbloquearScroll()
      focoAnterior?.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 md:hidden">
      <div
        className="animar-fondo absolute inset-0 bg-black/50"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className="animar-menu absolute inset-y-0 left-0 flex w-[86%] max-w-[320px] flex-col border-r border-[var(--borde)] bg-[var(--superficie)] pt-safe outline-none"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center">
              <Logotipo className="size-9" />
            </span>
            <span className="min-w-0">
              <span id={idTitulo} className="block text-[15px] font-semibold leading-tight">
                Organizador
              </span>
              <span className="block text-[11px] text-[var(--texto-suave)]">
                2.º de Bachillerato
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar menú"
            className="grid size-10 shrink-0 place-items-center rounded-xl text-[var(--texto-suave)] transition-colors hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]"
          >
            <X size={20} />
          </button>
        </div>

        <nav aria-label="Secciones" className="flex-1 overflow-y-auto px-2 pb-4">
          <ul className="grid gap-0.5">
            {SECCIONES.map((seccion) => (
              <li key={seccion.ruta}>
                <NavLink
                  to={seccion.ruta}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                      isActive
                        ? 'bg-[var(--primario-suave)] font-semibold text-[var(--primario)]'
                        : 'font-medium text-[var(--texto)] hover:bg-[var(--superficie-2)]',
                    )
                  }
                >
                  <seccion.icono size={19} />
                  {seccion.nombre}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-[var(--borde)] px-2 py-2 pb-safe">
          <NavLink
            to={SECCION_AJUSTES.ruta}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                isActive
                  ? 'bg-[var(--primario-suave)] font-semibold text-[var(--primario)]'
                  : 'font-medium text-[var(--texto)] hover:bg-[var(--superficie-2)]',
              )
            }
          >
            <Settings size={19} />
            {SECCION_AJUSTES.nombre}
          </NavLink>
        </div>
      </div>
    </div>,
    document.body,
  )
}

import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/format'
import { Boton } from './Boton'

const ANCHOS = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
}

export interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children: ReactNode
  pie?: ReactNode
  ancho?: keyof typeof ANCHOS
}

export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 'md',
}: ModalProps) {
  const idTitulo = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alPulsar)
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const focoAnterior = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', alPulsar)
      document.body.style.overflow = overflowAnterior
      focoAnterior?.focus()
    }
  }, [abierto, onCerrar])

  if (!abierto) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animar-fondo absolute inset-0 bg-black/45"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className={cn(
          'animar-panel relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--borde)] bg-[var(--superficie)] shadow-2xl outline-none sm:rounded-2xl',
          ANCHOS[ancho],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--borde)] px-5 py-4">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-base font-semibold">
              {titulo}
            </h2>
            {descripcion && (
              <p className="mt-0.5 text-sm text-[var(--texto-suave)]">{descripcion}</p>
            )}
          </div>
          <Boton
            variante="fantasma"
            tamano="icono"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="-mr-1 -mt-1"
          >
            <X size={18} />
          </Boton>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {pie && (
          <div className="flex justify-end gap-2 border-t border-[var(--borde)] px-5 py-3 pb-safe sm:pb-3">
            {pie}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

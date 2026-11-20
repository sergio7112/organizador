import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '../../lib/format'
import { bloquearScroll, desbloquearScroll } from '../../lib/scrollLock'
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
  const cerrarRef = useRef(onCerrar)
  const [alturaTeclado, setAlturaTeclado] = useState(0)

  useEffect(() => {
    cerrarRef.current = onCerrar
  }, [onCerrar])

  // En Android el teclado puede tapar el pie del modal aunque `dvh` cambie:
  // el viewport visual es el que se reduce. Lo medimos y desplazamos el panel.
  useEffect(() => {
    if (!abierto) return
    const vista = window.visualViewport
    if (!vista) return

    const medir = () => {
      setAlturaTeclado(Math.max(0, window.innerHeight - vista.height - vista.offsetTop))
    }
    medir()
    vista.addEventListener('resize', medir)
    vista.addEventListener('scroll', medir)
    return () => {
      vista.removeEventListener('resize', medir)
      vista.removeEventListener('scroll', medir)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') cerrarRef.current()
    }
    document.addEventListener('keydown', alPulsar)
    bloquearScroll()
    // Se captura aquí, antes de mover el foco al diálogo. Los campos ya no
    // usan autoFocus, así que el elemento activo sigue siendo el botón que
    // abrió el modal y se puede restaurar al cerrar.
    const focoAnterior = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => {
      document.removeEventListener('keydown', alPulsar)
      desbloquearScroll()
      focoAnterior?.focus()
    }
  }, [abierto])

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
        style={{
          marginBottom: alturaTeclado,
          maxHeight: `calc(100dvh - ${alturaTeclado}px - 1rem)`,
        }}
        className={cn(
          'animar-panel relative flex w-full flex-col overflow-hidden rounded-t-2xl border border-[var(--borde)] bg-[var(--superficie)] shadow-2xl outline-none sm:rounded-2xl',
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

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>

        {pie && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-[var(--borde)] px-5 pt-3 pb-modal">
            {pie}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}

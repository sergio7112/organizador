import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/format'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'
type Tamano = 'sm' | 'md' | 'icono'

const BASE =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl font-medium transition-colors disabled:pointer-events-none disabled:opacity-50'

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-[var(--primario)] text-[var(--primario-contraste)] shadow-[0_1px_2px_rgb(0_0_0/0.08)] hover:brightness-110 active:brightness-95',
  secundario:
    'border border-[var(--borde)] bg-[var(--superficie)] text-[var(--texto)] hover:bg-[var(--superficie-2)]',
  fantasma:
    'text-[var(--texto-suave)] hover:bg-[var(--superficie-2)] hover:text-[var(--texto)]',
  peligro:
    'bg-[var(--peligro-suave)] text-[var(--peligro)] hover:brightness-105',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  icono: 'size-10',
}

export interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
}

export function Boton({
  variante = 'primario',
  tamano = 'md',
  className,
  type = 'button',
  ...props
}: BotonProps) {
  return (
    <button
      type={type}
      className={cn(BASE, VARIANTES[variante], TAMANOS[tamano], className)}
      {...props}
    />
  )
}

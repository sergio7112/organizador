import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/format'

export function Tarjeta({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      style={style}
      className={cn(
        'rounded-3xl border border-[var(--borde)] bg-[var(--superficie)] shadow-[var(--sombra)] transition-[transform,box-shadow,border-color] duration-200',
        className,
      )}
    >
      {children}
    </div>
  )
}

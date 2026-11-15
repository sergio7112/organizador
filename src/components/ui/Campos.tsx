import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { cn } from '../../lib/format'

const BASE =
  'w-full rounded-xl border border-[var(--borde)] bg-[var(--superficie)] px-3 text-sm text-[var(--texto)] placeholder:text-[var(--texto-suave)] focus:border-[var(--primario)] focus:outline-none disabled:opacity-60'

export function Entrada({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(BASE, 'h-11', className)} {...props} />
}

export function Selector({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(BASE, 'h-11 pr-8', className)} {...props}>
      {children}
    </select>
  )
}

export function AreaTexto({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(BASE, 'min-h-24 resize-y py-2.5', className)}
      {...props}
    />
  )
}

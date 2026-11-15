import { cn } from '../../lib/format'

export function BarraProgreso({
  valor,
  color,
  etiqueta,
  className,
}: {
  valor: number
  color?: string
  etiqueta?: string
  className?: string
}) {
  const seguro = Math.max(0, Math.min(100, Math.round(valor)))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={seguro}
      aria-label={etiqueta ?? 'Progreso'}
      className={cn(
        'h-2 w-full overflow-hidden rounded-full bg-[var(--superficie-2)]',
        className,
      )}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${seguro}%`, backgroundColor: color ?? 'var(--primario)' }}
      />
    </div>
  )
}

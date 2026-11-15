import { cn } from '../../lib/format'

export interface OpcionSegmentada<T extends string> {
  valor: T
  etiqueta: string
}

export function ControlSegmentado<T extends string>({
  valor,
  opciones,
  onChange,
  ariaLabel,
  className,
}: {
  valor: T
  opciones: Array<OpcionSegmentada<T>>
  onChange: (valor: T) => void
  ariaLabel: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex w-fit rounded-xl border border-[var(--borde)] bg-[var(--superficie-2)] p-1',
        className,
      )}
    >
      {opciones.map((opcion) => {
        const activa = opcion.valor === valor
        return (
          <button
            key={opcion.valor}
            type="button"
            aria-pressed={activa}
            onClick={() => onChange(opcion.valor)}
            className={cn(
              'h-8 rounded-lg px-3 text-xs font-medium transition-colors',
              activa
                ? 'bg-[var(--superficie)] text-[var(--texto)] shadow-sm'
                : 'text-[var(--texto-suave)] hover:text-[var(--texto)]',
            )}
          >
            {opcion.etiqueta}
          </button>
        )
      })}
    </div>
  )
}

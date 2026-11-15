import { Check } from 'lucide-react'
import { PALETA } from '../../domain/types'
import { cn } from '../../lib/format'

export function SelectorColor({
  valor,
  onChange,
}: {
  valor: string
  onChange: (color: string) => void
}) {
  return (
    <div role="radiogroup" aria-label="Color de la asignatura" className="flex flex-wrap gap-2.5">
      {PALETA.map((color) => {
        const activo = valor === color.valor
        return (
          <button
            key={color.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={color.nombre}
            title={color.nombre}
            onClick={() => onChange(color.valor)}
            className={cn(
              'grid size-9 place-items-center rounded-full border-2 transition-transform',
              activo ? 'scale-110 border-[var(--texto)]' : 'border-transparent',
            )}
            style={{ backgroundColor: color.valor }}
          >
            {activo && <Check size={16} className="text-white drop-shadow" />}
          </button>
        )
      })}
    </div>
  )
}

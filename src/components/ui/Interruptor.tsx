/** Interruptor accesible reutilizable (role="switch"). */
export function Interruptor({
  activo,
  onChange,
  etiqueta,
  deshabilitado = false,
}: {
  activo: boolean
  onChange: (valor: boolean) => void
  etiqueta: string
  deshabilitado?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      disabled={deshabilitado}
      onClick={() => onChange(!activo)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
        activo ? 'bg-[var(--primario)]' : 'bg-[var(--borde)]',
        deshabilitado ? 'cursor-not-allowed opacity-50' : '',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          activo ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

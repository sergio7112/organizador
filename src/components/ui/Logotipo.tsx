/**
 * Marca de la aplicación: una libreta con renglones.
 * Se usa en la cabecera, el menú y los iconos de instalación.
 */
export function Logotipo({ className = 'size-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <rect width="64" height="64" rx="15" fill="#1f4e79" />
      <rect x="16.5" y="12" width="31" height="40" rx="5" fill="#ffffff" />
      <path
        d="M24 22.5h16M24 30.5h16M24 38.5h9"
        stroke="#1f4e79"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

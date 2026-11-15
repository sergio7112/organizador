import type { ReactNode } from 'react'

export function Campo({
  etiqueta,
  htmlFor,
  ayuda,
  obligatorio,
  children,
}: {
  etiqueta: string
  htmlFor?: string
  ayuda?: string
  obligatorio?: boolean
  children: ReactNode
}) {
  const contenido = (
    <>
      {etiqueta}
      {obligatorio && <span className="ml-0.5 text-[var(--peligro)]">*</span>}
    </>
  )

  return (
    <div className="flex flex-col gap-1.5">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {contenido}
        </label>
      ) : (
        <span className="text-sm font-medium">{contenido}</span>
      )}
      {children}
      {ayuda && <p className="text-xs text-[var(--texto-suave)]">{ayuda}</p>}
    </div>
  )
}

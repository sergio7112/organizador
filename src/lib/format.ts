export function cn(
  ...partes: Array<string | false | null | undefined>
): string {
  return partes.filter(Boolean).join(' ')
}

export function formatearNota(nota?: number): string {
  if (nota === undefined) return 'Sin nota'
  return nota.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

/** Pone en mayúscula solo la primera letra. */
export function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

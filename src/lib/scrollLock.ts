/**
 * Bloqueo del scroll de la página con contador: un modal y el menú lateral
 * pueden estar abiertos a la vez y el último en cerrarse no debe restaurar el
 * overflow antes de tiempo.
 */
let bloqueos = 0
let overflowAnterior = ''

export function bloquearScroll(): void {
  if (bloqueos === 0) {
    overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
  bloqueos += 1
}

export function desbloquearScroll(): void {
  bloqueos = Math.max(0, bloqueos - 1)
  if (bloqueos === 0) {
    document.body.style.overflow = overflowAnterior
  }
}

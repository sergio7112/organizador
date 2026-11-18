/** Envío de la notificación por Web Push. */

import webpush from 'web-push'
import type { MensajePush } from './dominio.ts'

export interface SuscripcionPush {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  zona: string
}

export class ErrorPush extends Error {
  estado?: number

  constructor(mensaje: string, estado?: number) {
    super(mensaje)
    this.name = 'ErrorPush'
    this.estado = estado
  }
}

/** Indica si el endpoint ya no existe y la suscripción debe borrarse. */
export function suscripcionCaducada(error: unknown): boolean {
  return error instanceof ErrorPush && (error.estado === 404 || error.estado === 410)
}

/** Lee las claves VAPID del entorno y las aplica al cliente de envío. */
export function configurarVapid(): void {
  const publica = Deno.env.get('VAPID_PUBLIC_KEY')
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  const asunto = Deno.env.get('VAPID_SUBJECT')

  if (!publica || !privada || !asunto) {
    throw new Error(
      'Faltan VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY o VAPID_SUBJECT en el entorno.',
    )
  }

  webpush.setVapidDetails(asunto, publica, privada)
}

export async function enviarPush(
  suscripcion: SuscripcionPush,
  mensaje: MensajePush,
): Promise<void> {
  try {
    await webpush.sendNotification(
      {
        endpoint: suscripcion.endpoint,
        keys: { p256dh: suscripcion.p256dh, auth: suscripcion.auth },
      },
      JSON.stringify(mensaje),
      { TTL: 3600 },
    )
  } catch (error) {
    const estado = (error as { statusCode?: number }).statusCode
    throw new ErrorPush(
      error instanceof Error ? error.message : 'No se pudo enviar el aviso.',
      estado,
    )
  }
}

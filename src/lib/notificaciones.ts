import { supabase } from './supabase'

/** Clave pública VAPID que se pasa al navegador al suscribirlo. */
const CLAVE_PUBLICA = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
const FUNCION = 'notificaciones'

export type EstadoNotificaciones =
  | 'activas'
  | 'inactivas'
  | 'bloqueadas'
  | 'no-soportado'

/** Indica si este navegador puede usar notificaciones push. */
export function soportadas(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** La app necesita la clave pública para poder suscribir el dispositivo. */
export function claveConfigurada(): boolean {
  return Boolean(CLAVE_PUBLICA)
}

function claveEnBytes(clave: string): ArrayBuffer {
  const base64 = clave.replace(/-/g, '+').replace(/_/g, '/')
  const relleno = '='.repeat((4 - (base64.length % 4)) % 4)
  const binario = atob(base64 + relleno)
  return Uint8Array.from(binario, (caracter) => caracter.charCodeAt(0)).buffer
}

function zonaHoraria(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

async function suscripcionActual(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const registro = await navigator.serviceWorker.getRegistration()
  return (await registro?.pushManager.getSubscription()) ?? null
}

async function registroDeAvisos(): Promise<ServiceWorkerRegistration> {
  const existente =
    (await navigator.serviceWorker.getRegistration()) ??
    (await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`))

  if (existente.active) return existente

  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, rechazar) => {
      setTimeout(
        () => rechazar(new Error('El service worker no arranca. Recarga la página e inténtalo de nuevo.')),
        8000,
      )
    }),
  ])
}

export async function estadoNotificaciones(): Promise<EstadoNotificaciones> {
  if (!soportadas()) return 'no-soportado'
  if (Notification.permission === 'denied') return 'bloqueadas'
  return (await suscripcionActual()) ? 'activas' : 'inactivas'
}

/** Pide permiso, suscribe el dispositivo y lo guarda en la cuenta. */
export async function activarNotificaciones(): Promise<void> {
  if (!supabase) throw new Error('La sincronización con Supabase no está configurada.')
  if (!import.meta.env.PROD) {
    throw new Error('Las notificaciones solo funcionan en la versión publicada de la app.')
  }
  if (!soportadas()) throw new Error('Este navegador no admite notificaciones push.')
  if (!CLAVE_PUBLICA) throw new Error('Falta la clave pública de notificaciones.')

  const permiso =
    Notification.permission === 'granted'
      ? 'granted'
      : await Notification.requestPermission()

  if (permiso !== 'granted') {
    throw new Error(
      permiso === 'denied'
        ? 'Has bloqueado las notificaciones. Actívalas en los ajustes del navegador para este sitio.'
        : 'No has dado permiso para mostrar notificaciones.',
    )
  }

  const registro = await registroDeAvisos()
  const suscripcion =
    (await registro.pushManager.getSubscription()) ??
    (await registro.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: claveEnBytes(CLAVE_PUBLICA),
    }))

  const { endpoint, keys } = suscripcion.toJSON()
  if (!endpoint || !keys?.p256dh || !keys.auth) {
    throw new Error('El navegador devolvió una suscripción incompleta.')
  }

  const { error } = await supabase.rpc('push_guardar_suscripcion', {
    p_endpoint: endpoint,
    p_p256dh: keys.p256dh,
    p_auth: keys.auth,
    p_zona: zonaHoraria(),
  })

  if (error) throw new Error('No se pudo guardar este dispositivo en tu cuenta.')
}

/** Quita el dispositivo de la cuenta y cancela la suscripción del navegador. */
export async function desactivarNotificaciones(): Promise<void> {
  if (!supabase) return
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return

  const { error } = await supabase.rpc('push_eliminar_suscripcion', {
    p_endpoint: suscripcion.endpoint,
  })
  if (error) throw new Error('No se pudo quitar este dispositivo de tu cuenta.')

  await suscripcion.unsubscribe()
}

/** Mantiene al día la zona horaria del dispositivo suscrito. */
export async function actualizarZona(): Promise<void> {
  if (!supabase) return
  const suscripcion = await suscripcionActual()
  if (!suscripcion) return

  await supabase.rpc('push_actualizar_zona', {
    p_endpoint: suscripcion.endpoint,
    p_zona: zonaHoraria(),
  })
}

/** Envía una notificación de prueba a los dispositivos de esta cuenta. */
export async function enviarPrueba(): Promise<void> {
  if (!supabase) throw new Error('La sincronización con Supabase no está configurada.')

  const { data, error } = await supabase.functions.invoke(FUNCION, {
    body: { prueba: true },
  })

  if (error) {
    // La función devuelve el motivo en el cuerpo de la respuesta de error.
    const contexto = (error as { context?: Response }).context
    const cuerpo = contexto
      ? ((await contexto.json().catch(() => null)) as { error?: string } | null)
      : null
    throw new Error(cuerpo?.error ?? 'No se pudo enviar la notificación de prueba.')
  }

  const respuesta = data as { error?: string } | null
  if (respuesta?.error) throw new Error(respuesta.error)
}

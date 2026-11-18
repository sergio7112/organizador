/**
 * Función de notificaciones push del Organizador.
 *
 * Se llama de dos formas:
 *  - Cron de Supabase (cabecera `x-organizador-cron`): revisa todos los
 *    dispositivos y envía los avisos que tocan a esa hora local.
 *  - Desde la app (token del usuario): envía una notificación de prueba solo a
 *    los dispositivos de esa persona.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { crearAvisos, horaLocal, tocaEnviar, type DatosPush, type MensajePush } from './dominio.ts'
import {
  configurarVapid,
  enviarPush,
  suscripcionCaducada,
  type SuscripcionPush,
} from './envio.ts'

const CABECERAS_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-organizador-cron',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const CAMPOS_SUSCRIPCION = 'id,user_id,endpoint,p256dh,auth,zona'

const AVISO_PRUEBA: MensajePush = {
  title: 'Notificaciones activas',
  body: 'Este es un aviso de prueba de Organizador. Todo funciona.',
  url: '#/hoy',
  tag: 'prueba',
}

function responder(cuerpo: unknown, estado = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CABECERAS_CORS, 'Content-Type': 'application/json' },
  })
}

function claveServicio(): string {
  const antigua = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (antigua) return antigua

  try {
    const claves = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}') as {
      default?: string
    }
    if (claves.default) return claves.default
  } catch {
    // Se informa del error de configuración al llamar a la función.
  }

  throw new Error('No está disponible la clave de servicio de Supabase.')
}

async function datosDeUsuario(
  admin: SupabaseClient,
  usuarioId: string,
): Promise<DatosPush | null> {
  const { data, error } = await admin
    .from('organizador_datos')
    .select('datos')
    .eq('user_id', usuarioId)
    .maybeSingle()

  if (error) throw error
  return data?.datos && typeof data.datos === 'object' ? (data.datos as DatosPush) : null
}

async function borrarSuscripcion(admin: SupabaseClient, id: string): Promise<void> {
  await admin.from('push_suscripciones').delete().eq('id', id)
}

/** Reserva el envío para no repetirlo. Devuelve false si ya se había enviado. */
async function reservarAviso(
  admin: SupabaseClient,
  suscripcionId: string,
  clave: string,
): Promise<boolean> {
  const { error } = await admin
    .from('push_enviadas')
    .insert({ suscripcion_id: suscripcionId, clave })

  if (!error) return true
  if (error.code === '23505') return false
  throw error
}

async function liberarAviso(
  admin: SupabaseClient,
  suscripcionId: string,
  clave: string,
): Promise<void> {
  await admin
    .from('push_enviadas')
    .delete()
    .eq('suscripcion_id', suscripcionId)
    .eq('clave', clave)
}

async function enviarAviso(
  admin: SupabaseClient,
  suscripcion: SuscripcionPush,
  clave: string,
  mensaje: MensajePush,
): Promise<boolean> {
  if (!(await reservarAviso(admin, suscripcion.id, clave))) return false

  try {
    await enviarPush(suscripcion, mensaje)
    return true
  } catch (error) {
    if (suscripcionCaducada(error)) {
      await borrarSuscripcion(admin, suscripcion.id)
      return false
    }
    await liberarAviso(admin, suscripcion.id, clave)
    throw error
  }
}

async function enviarPrueba(admin: SupabaseClient, usuarioId: string): Promise<Response> {
  const { data, error } = await admin
    .from('push_suscripciones')
    .select(CAMPOS_SUSCRIPCION)
    .eq('user_id', usuarioId)

  if (error) throw error

  const suscripciones = (data ?? []) as SuscripcionPush[]
  if (!suscripciones.length) {
    return responder({ error: 'Este dispositivo no está suscrito.' }, 409)
  }

  configurarVapid()
  let enviados = 0

  for (const suscripcion of suscripciones) {
    try {
      await enviarPush(suscripcion, AVISO_PRUEBA)
      enviados += 1
    } catch (error) {
      if (suscripcionCaducada(error)) await borrarSuscripcion(admin, suscripcion.id)
      else console.error('No se pudo enviar la prueba:', error)
    }
  }

  if (!enviados) return responder({ error: 'No se pudo enviar la notificación.' }, 502)
  return responder({ enviados })
}

/** Recorre los dispositivos y manda los avisos que tocan en este minuto. */
async function procesarAvisos(admin: SupabaseClient, ahora: Date): Promise<Response> {
  const { data, error } = await admin
    .from('push_suscripciones')
    .select(CAMPOS_SUSCRIPCION)

  if (error) throw error

  configurarVapid()

  const suscripciones = (data ?? []) as SuscripcionPush[]
  const datosPorUsuario = new Map<string, DatosPush | null>()
  let enviados = 0
  let errores = 0

  for (const suscripcion of suscripciones) {
    try {
      const local = horaLocal(ahora, suscripcion.zona || 'UTC')

      if (!datosPorUsuario.has(suscripcion.user_id)) {
        datosPorUsuario.set(
          suscripcion.user_id,
          await datosDeUsuario(admin, suscripcion.user_id),
        )
      }

      const datos = datosPorUsuario.get(suscripcion.user_id)
      if (!datos) continue

      const avisos = crearAvisos(datos, local.fecha).filter((aviso) =>
        tocaEnviar(aviso.hora, local.hora),
      )

      for (const aviso of avisos) {
        if (await enviarAviso(admin, suscripcion, aviso.clave, aviso.mensaje)) {
          enviados += 1
        }
      }
    } catch (error) {
      errores += 1
      console.error(`Error con la suscripción ${suscripcion.id}:`, error)
    }
  }

  return responder({ dispositivos: suscripciones.length, enviados, errores })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: CABECERAS_CORS })
  }
  if (request.method !== 'POST') {
    return responder({ error: 'Método no permitido.' }, 405)
  }

  const url = Deno.env.get('SUPABASE_URL')
  if (!url) return responder({ error: 'Falta SUPABASE_URL.' }, 500)

  let admin: SupabaseClient
  try {
    admin = createClient(url, claveServicio(), {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  } catch (error) {
    console.error(error)
    return responder({ error: 'No está configurada la clave de servicio.' }, 500)
  }

  const secretoCron = Deno.env.get('NOTIFICACIONES_CRON_SECRET')
  const esCron =
    Boolean(secretoCron) &&
    request.headers.get('x-organizador-cron') === secretoCron

  try {
    if (esCron) return await procesarAvisos(admin, new Date())

    const token = (request.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
    if (!token) return responder({ error: 'No autorizado.' }, 401)

    const { data, error } = await admin.auth.getUser(token)
    if (error || !data.user) return responder({ error: 'No autorizado.' }, 401)

    return await enviarPrueba(admin, data.user.id)
  } catch (error) {
    console.error('Error procesando notificaciones:', error)
    return responder({ error: 'No se pudieron procesar las notificaciones.' }, 500)
  }
})

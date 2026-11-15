import { getIdentityConfig } from '@netlify/identity'
import { and, eq } from 'drizzle-orm'
import { getDb } from '../../db/index.ts'
import { organizadores } from '../../db/schema.ts'
import { importarDatos } from '../../src/lib/sync.ts'

export const config = { path: '/api/*' }
const headers = { 'Cache-Control': 'no-store', 'Vary': 'Cookie' }
const json = (body, status = 200) => Response.json(body, { status, headers })

// Verify the session with Identity; never trust decoded claims or a user ID from the browser.
async function usuarioVerificado(request) {
  const cookie = request.headers.get('cookie')?.match(/(?:^|;\s*)nf_jwt=([^;]+)/)?.[1]
  const identity = getIdentityConfig()
  if (!cookie || !identity?.url) return null
  const response = await fetch(`${identity.url.replace(/\/$/, '')}/user`, {
    headers: { Authorization: `Bearer ${decodeURIComponent(cookie)}` },
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok) return null
  const user = await response.json()
  return typeof user.id === 'string' && user.confirmed_at ? user.id : null
}

export default async function handler(request) {
  if (new URL(request.url).pathname !== '/api/datos') return json({ error: 'Ruta no encontrada.' }, 404)
  if (!['GET', 'PUT'].includes(request.method)) return json({ error: 'Método no permitido.' }, 405)
  if (request.method === 'PUT' && request.headers.get('origin') !== new URL(request.url).origin) {
    return json({ error: 'Origen no permitido.' }, 403)
  }
  try {
    const usuarioId = await usuarioVerificado(request)
    if (!usuarioId) return json({ error: 'Inicia sesión para acceder a tus datos.' }, 401)
    const db = getDb()
    if (request.method === 'GET') {
      const [row] = await db.select().from(organizadores).where(eq(organizadores.usuarioId, usuarioId))
      return json(row ? { datos: row.datos, revision: row.revision, actualizadoEn: row.actualizadoEn } : { datos: null, revision: 0, actualizadoEn: null })
    }
    const body = await request.text()
    if (new TextEncoder().encode(body).length > 5 * 1024 * 1024) return json({ error: 'La copia supera el límite de 5 MB.' }, 413)
    let datos, revision
    try {
      const input = JSON.parse(body)
      revision = input.revision
      if (!Number.isSafeInteger(revision) || revision < 0) throw new Error()
      datos = importarDatos(JSON.stringify(input.datos))
    } catch {
      return json({ error: 'Los datos enviados no tienen un formato válido.' }, 400)
    }
    const rows = revision === 0
      ? await db.insert(organizadores).values({ usuarioId, datos }).onConflictDoNothing().returning()
      : await db.update(organizadores).set({ datos, revision: revision + 1, actualizadoEn: new Date() })
        .where(and(eq(organizadores.usuarioId, usuarioId), eq(organizadores.revision, revision))).returning()
    if (!rows.length) return json({ error: 'La copia online ha cambiado en otro dispositivo. Consulta su estado antes de volver a guardar.' }, 409)
    return json({ revision: rows[0].revision, actualizadoEn: rows[0].actualizadoEn })
  } catch {
    return json({ error: 'No se pudo acceder al almacenamiento online. Tus datos del navegador se conservan. Vuelve a intentarlo.' }, 503)
  }
}

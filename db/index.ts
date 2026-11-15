import { getDatabase } from '@netlify/database'
import { drizzle } from 'drizzle-orm/netlify-db'
import * as schema from './schema.js'

// Let the platform select the transport and refresh its connection credentials.
// Initialize inside a request so configuration failures remain recoverable.
let db: ReturnType<typeof crearConexion> | undefined
function crearConexion() {
  return drizzle({ client: getDatabase(), schema })
}
export function getDb() {
  return db ??= crearConexion()
}

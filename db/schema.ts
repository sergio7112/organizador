import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import type { Datos } from '../src/domain/types.js'

export const organizadores = pgTable('organizadores', {
  usuarioId: text('usuario_id').primaryKey(),
  datos: jsonb('datos').$type<Datos>().notNull(),
  revision: integer('revision').notNull().default(1),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true }).notNull().defaultNow(),
})

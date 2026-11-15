import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import { crearDatosVacios } from '../../src/domain/empty'

const mocks = vi.hoisted(() => ({ connect: vi.fn(), select: vi.fn(), insert: vi.fn(), update: vi.fn(), fetch: vi.fn(), where: vi.fn() }))
vi.mock('@netlify/identity', () => ({ getIdentityConfig: () => ({ url: 'https://identity.example.test/.netlify/identity' }) }))
vi.mock('../../db/index.ts', () => ({ getDb: () => { mocks.connect(); return { select: mocks.select, insert: mocks.insert, update: mocks.update } } }))
import handler from './index.mjs'

function request(method = 'GET', body, authenticated = true, origin = 'https://organizador.example.test') {
  return new Request('https://organizador.example.test/api/datos', {
    method,
    headers: { ...(authenticated ? { cookie: 'nf_jwt=test-session' } : {}), origin, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.fetch.mockResolvedValue(Response.json({ id: 'usuario-privado', confirmed_at: '2026-11-15' }))
  mocks.where.mockResolvedValue([])
  mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) })
})

describe('almacenamiento online privado', () => {
  it('exige una sesión antes de consultar la base de datos', async () => {
    const response = await handler(request('GET', undefined, false))
    expect(response.status).toBe(401)
    expect(mocks.select).not.toHaveBeenCalled()
  })

  it('rechaza una sesión que Identity no valida', async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 401 }))
    expect((await handler(request())).status).toBe(401)
    expect(mocks.select).not.toHaveBeenCalled()
  })

  it('limita las consultas al usuario verificado y evita la caché', async () => {
    const response = await handler(request())
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ datos: null, revision: 0, actualizadoEn: null })
    const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0])
    expect(query.params).toEqual(['usuario-privado'])
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  it('rechaza escrituras desde otro origen', async () => {
    const response = await handler(request('PUT', { datos: crearDatosVacios(), revision: 0 }, true, 'https://otro.example.test'))
    expect(response.status).toBe(403)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('valida los datos antes de guardarlos', async () => {
    expect((await handler(request('PUT', { datos: { tareas: 'incorrecto' }, revision: 0 }))).status).toBe(400)
    expect(mocks.insert).not.toHaveBeenCalled()
  })

  it('crea una primera copia asociada exclusivamente a la sesión', async () => {
    const returning = vi.fn().mockResolvedValue([{ revision: 1, actualizadoEn: '2026-11-15' }])
    const values = vi.fn().mockReturnValue({ onConflictDoNothing: () => ({ returning }) })
    mocks.insert.mockReturnValue({ values })
    const response = await handler(request('PUT', { datos: crearDatosVacios(), revision: 0, usuarioId: 'otro-usuario' }))
    expect(response.status).toBe(200)
    expect(values.mock.calls[0][0].usuarioId).toBe('usuario-privado')
  })

  it('impide sobrescribir una copia modificada por otro dispositivo', async () => {
    const where = vi.fn().mockReturnValue({ returning: async () => [] })
    mocks.update.mockReturnValue({ set: () => ({ where }) })
    const response = await handler(request('PUT', { datos: crearDatosVacios(), revision: 2 }))
    expect(response.status).toBe(409)
    const query = new PgDialect().sqlToQuery(where.mock.calls[0][0])
    expect(query.params).toEqual(['usuario-privado', 2])
  })

  it('devuelve un error recuperable si la conexión no puede inicializarse', async () => {
    mocks.connect.mockImplementation(() => { throw new Error('Configuration unavailable') })
    expect((await handler(request())).status).toBe(503)
    expect(mocks.select).not.toHaveBeenCalled()
  })

  it('devuelve un error recuperable si falla la base de datos', async () => {
    mocks.where.mockRejectedValue(new Error('Database unavailable'))
    expect((await handler(request())).status).toBe(503)
  })
})

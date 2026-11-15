import { beforeEach, expect, it, vi } from 'vitest'
const mocks = vi.hoisted(() => ({ getUser: vi.fn(), refreshSession: vi.fn(), fetch: vi.fn() }))
vi.mock('@netlify/identity', () => ({ getUser: mocks.getUser, refreshSession: mocks.refreshSession }))
import { solicitarOnline } from './online'

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('fetch', mocks.fetch)
  mocks.getUser.mockResolvedValue({ id: 'example-user' })
  mocks.refreshSession.mockResolvedValue(null)
})

it('waits for session renewal before requesting a private copy', async () => {
  mocks.refreshSession.mockImplementation(async () => {
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
  mocks.fetch.mockResolvedValue(Response.json({ datos: null, revision: 0, actualizadoEn: null }))
  expect(await solicitarOnline('GET')).toEqual({ datos: null, revision: 0, actualizadoEn: null })
  expect(mocks.fetch).toHaveBeenCalledWith('/api/datos', expect.objectContaining({ credentials: 'same-origin', cache: 'no-store' }))
})

it('explains how to recover an expired session', async () => {
  mocks.fetch.mockResolvedValue(Response.json({ error: 'Unauthorized' }, { status: 401 }))
  await expect(solicitarOnline('GET')).rejects.toThrow('Cierra sesión y vuelve a entrar')
})

it('preserves the server error instead of hiding the cause', async () => {
  mocks.fetch.mockResolvedValue(Response.json({ error: 'El almacenamiento no está disponible.' }, { status: 503 }))
  await expect(solicitarOnline('GET')).rejects.toThrow('El almacenamiento no está disponible.')
})

it('handles a network failure with an actionable message', async () => {
  mocks.fetch.mockRejectedValue(new TypeError('Failed to fetch'))
  await expect(solicitarOnline('GET')).rejects.toThrow('Comprueba tu conexión a Internet')
})

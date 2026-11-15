import { beforeEach, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getDatabase: vi.fn(), drizzle: vi.fn() }))
vi.mock('@netlify/database', () => ({ getDatabase: mocks.getDatabase }))
vi.mock('drizzle-orm/netlify-db', () => ({ drizzle: mocks.drizzle }))

beforeEach(() => {
  vi.resetModules()
  vi.resetAllMocks()
})

it('initializes lazily using the platform client and reuses the connection', async () => {
  const client = { driver: 'server', pool: {} }
  const connection = {}
  mocks.getDatabase.mockReturnValue(client)
  mocks.drizzle.mockReturnValue(connection)
  const { getDb } = await import('./index')
  expect(mocks.getDatabase).not.toHaveBeenCalled()
  expect(getDb()).toBe(connection)
  expect(getDb()).toBe(connection)
  expect(mocks.getDatabase).toHaveBeenCalledTimes(1)
  expect(mocks.drizzle).toHaveBeenCalledWith(expect.objectContaining({ client }))
})

it('can retry after runtime configuration becomes available', async () => {
  mocks.getDatabase.mockImplementationOnce(() => { throw new Error('Configuration unavailable') })
    .mockReturnValue({ driver: 'serverless', httpClient: {}, pool: {} })
  mocks.drizzle.mockReturnValue({})
  const { getDb } = await import('./index')
  expect(() => getDb()).toThrow('Configuration unavailable')
  expect(getDb()).toEqual({})
})

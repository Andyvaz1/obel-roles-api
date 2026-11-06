import { describe, expect, it } from 'vitest'
import { buildApp } from '../src/app.js'

const apiToken = 'test-token'
const auth = { authorization: `Bearer ${apiToken}` }

function setup() {
  return buildApp({ apiToken, logger: false })
}

describe('Roles API', () => {
  it('GET /health responde sin token', async () => {
    const app = setup()
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })

  it('rechaza requests sin token con 401', async () => {
    const app = setup()
    const res = await app.inject({ method: 'GET', url: '/roles' })
    expect(res.statusCode).toBe(401)
  })

  it('crea un rol con 201', async () => {
    const app = setup()
    const res = await app.inject({
      method: 'POST',
      url: '/roles',
      headers: auth,
      payload: { name: 'Editor', type: 'custom' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json()).toMatchObject({ name: 'Editor', type: 'custom' })
  })

  it('responde 400 si falta el name', async () => {
    const app = setup()
    const res = await app.inject({ method: 'POST', url: '/roles', headers: auth, payload: { type: 'custom' } })
    expect(res.statusCode).toBe(400)
  })

  it('asigna un rol y responde 409 si se repite', async () => {
    const app = setup()
    const assign = () =>
      app.inject({ method: 'POST', url: '/users/user-2/roles', headers: auth, payload: { roleId: 'role-admin' } })
    expect((await assign()).statusCode).toBe(200)
    expect((await assign()).statusCode).toBe(409)
  })
})

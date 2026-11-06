import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { healthResponseSchema } from '../schemas.js'

export const healthRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/health', { schema: { security: [], response: { 200: healthResponseSchema } } }, async () => {
    return { status: 'ok' }
  })
}

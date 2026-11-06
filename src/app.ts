import Fastify from 'fastify'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { createStore, type Store } from './data.js'
import { healthRoutes } from './routes/health.js'
import { rolesRoutes } from './routes/roles.js'
import { usersRoutes } from './routes/users.js'
import { errorHandler, notFoundHandler } from './errors.js'
import { createAuthHook } from './auth.js'

type BuildAppOptions = {
  apiToken: string
  store?: Store
  logger?: boolean
}

export function buildApp({ apiToken, store = createStore(), logger = true }: BuildAppOptions) {
  const app = Fastify({ logger }).withTypeProvider<ZodTypeProvider>()

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)
  app.setNotFoundHandler(notFoundHandler)

  app.register(swagger, {
    openapi: {
      info: { title: 'Roles API', description: 'API de roles y asignaciones a usuarios', version: '1.0.0' },
      components: {
        securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer' } },
      },
      security: [{ bearerAuth: [] }],
    },
    transform: jsonSchemaTransform,
  })
  app.register(swaggerUi, { routePrefix: '/docs' })

  app.register(healthRoutes)

  app.register(async (protectedApp) => {
    protectedApp.addHook('onRequest', createAuthHook(apiToken))
    protectedApp.register(rolesRoutes, { store })
    protectedApp.register(usersRoutes, { store })
  })

  return app
}

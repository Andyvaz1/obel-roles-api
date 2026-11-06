import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { Store } from '../data.js'
import {
  assignRoleBodySchema,
  errorSchema,
  roleSchema,
  userParamsSchema,
  userRoleParamsSchema,
  userSchema,
} from '../schemas.js'

type UsersRoutesOptions = { store: Store }

export const usersRoutes: FastifyPluginAsyncZod<UsersRoutesOptions> = async (app, { store }) => {
  app.get('/users', { schema: { response: { 200: z.array(userSchema) } } }, async () => {
    return store.listUsers()
  })

  app.get(
    '/users/:userId/roles',
    {
      schema: {
        params: userParamsSchema,
        response: { 200: z.array(roleSchema), 404: errorSchema },
      },
    },
    async (request, reply) => {
      const user = store.getUser(request.params.userId)
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el usuario ${request.params.userId}`,
        })
      }
      return store.listUserRoles(user.id)
    },
  )

  app.post(
    '/users/:userId/roles',
    {
      schema: {
        params: userParamsSchema,
        body: assignRoleBodySchema,
        response: { 200: z.array(roleSchema), 404: errorSchema, 409: errorSchema },
      },
    },
    async (request, reply) => {
      const { userId } = request.params
      const { roleId } = request.body

      const user = store.getUser(userId)
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el usuario ${userId}`,
        })
      }
      if (!store.getRole(roleId)) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el rol ${roleId}`,
        })
      }
      if (user.roleIds.includes(roleId)) {
        return reply.code(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: `El usuario ${userId} ya tiene el rol ${roleId}`,
        })
      }

      store.addRoleToUser(userId, roleId)
      return store.listUserRoles(userId)
    },
  )

  app.delete(
    '/users/:userId/roles/:roleId',
    {
      schema: {
        params: userRoleParamsSchema,
        response: { 204: z.null(), 404: errorSchema },
      },
    },
    async (request, reply) => {
      const { userId, roleId } = request.params

      const user = store.getUser(userId)
      if (!user) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el usuario ${userId}`,
        })
      }
      if (!store.getRole(roleId)) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el rol ${roleId}`,
        })
      }
      if (!user.roleIds.includes(roleId)) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `El usuario ${userId} no tiene el rol ${roleId}`,
        })
      }

      store.removeRoleFromUser(userId, roleId)
      return reply.code(204).send(null)
    },
  )
}

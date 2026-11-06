import { z } from 'zod'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { Store } from '../data.js'
import { createRoleBodySchema, errorSchema, roleParamsSchema, roleSchema, updateRoleBodySchema } from '../schemas.js'

type RolesRoutesOptions = { store: Store }

export const rolesRoutes: FastifyPluginAsyncZod<RolesRoutesOptions> = async (app, { store }) => {
  app.get('/roles', { schema: { response: { 200: z.array(roleSchema) } } }, async () => {
    return store.listRoles()
  })

  app.get(
    '/roles/:roleId',
    { schema: { params: roleParamsSchema, response: { 200: roleSchema, 404: errorSchema } } },
    async (request, reply) => {
      const role = store.getRole(request.params.roleId)
      if (!role) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el rol ${request.params.roleId}`,
        })
      }
      return role
    },
  )

  app.post(
    '/roles',
    { schema: { body: createRoleBodySchema, response: { 201: roleSchema } } },
    async (request, reply) => {
      const role = store.createRole(request.body)
      return reply.code(201).send(role)
    },
  )

  app.patch(
    '/roles/:roleId',
    {
      schema: {
        params: roleParamsSchema,
        body: updateRoleBodySchema,
        response: { 200: roleSchema, 404: errorSchema },
      },
    },
    async (request, reply) => {
      const role = store.updateRole(request.params.roleId, request.body)
      if (!role) {
        return reply.code(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: `No existe el rol ${request.params.roleId}`,
        })
      }
      return role
    },
  )
}

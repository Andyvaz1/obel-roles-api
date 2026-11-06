import { z } from 'zod'

// Valores permitidos para type y scope (ver supuestos en el README)
export const roleTypeSchema = z.enum(['system', 'custom'])
export const roleScopeSchema = z.enum(['global', 'account'])

// Cómo se ve un rol en las respuestas
export const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  type: roleTypeSchema.optional(),
  scope: roleScopeSchema.optional(),
})

// Lo que acepta POST /roles
export const createRoleBodySchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).optional(),
  type: roleTypeSchema.optional(),
  scope: roleScopeSchema.optional(),
})

// Lo que acepta PATCH /roles/:roleId: todo opcional, pero al menos un campo
export const updateRoleBodySchema = createRoleBodySchema.partial().refine((body) => Object.keys(body).length > 0, {
  message: 'Enviar al menos un campo para actualizar',
})

export const roleParamsSchema = z.object({ roleId: z.string() })

// Schemas de usuario
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  roleIds: z.array(z.string()),
})

export const userParamsSchema = z.object({ userId: z.string() })
export const userRoleParamsSchema = z.object({
  userId: z.string(),
  roleId: z.string(),
})
export const assignRoleBodySchema = z.object({ roleId: z.string().min(1) })

// Formato único de error para todas las respuestas 4xx/5xx
export const errorSchema = z.object({
  statusCode: z.number(),
  error: z.string(),
  message: z.string(),
  details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
})

export const healthResponseSchema = z.object({ status: z.string() })

// Tipado
export type Role = z.infer<typeof roleSchema>
export type User = z.infer<typeof userSchema>
export type CreateRoleBody = z.infer<typeof createRoleBodySchema>
export type UpdateRoleBody = z.infer<typeof updateRoleBodySchema>

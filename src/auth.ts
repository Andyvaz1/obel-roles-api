import type { FastifyRequest } from 'fastify'
import { AppError } from './errors.js'

export function createAuthHook(apiToken: string) {
  return async (request: FastifyRequest) => {
    if (request.headers.authorization !== `Bearer ${apiToken}`) {
      throw new AppError(401, 'Falta el token o no es válido')
    }
  }
}

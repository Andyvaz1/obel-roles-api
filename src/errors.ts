import { STATUS_CODES } from 'node:http'
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { hasZodFastifySchemaValidationErrors } from 'fastify-type-provider-zod'

export class AppError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply) {
  if (hasZodFastifySchemaValidationErrors(error)) {
    return reply.code(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Los datos enviados no son válidos',
      details: error.validation.map((issue) => ({
        path: `${error.validationContext}${issue.instancePath}`,
        message: issue.message,
      })),
    })
  }

  const statusCode = error instanceof AppError ? error.statusCode : (error.statusCode ?? 500)

  if (statusCode >= 500) {
    request.log.error(error)
    return reply.code(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: 'Ocurrió un error inesperado',
    })
  }

  return reply.code(statusCode).send({
    statusCode,
    error: STATUS_CODES[statusCode] ?? 'Error',
    message: error.message,
  })
}

export function notFoundHandler(request: FastifyRequest, reply: FastifyReply) {
  return reply.code(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `No existe la ruta ${request.method} ${request.url}`,
  })
}

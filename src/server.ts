import { buildApp } from './app.js'

const apiToken = process.env.API_TOKEN
if (!apiToken) {
  console.error('Falta la variable de entorno API_TOKEN')
  process.exit(1)
}

const app = buildApp({ apiToken })
const port = Number(process.env.PORT) || 3000

try {
  await app.listen({ port, host: '0.0.0.0' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}

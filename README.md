# Roles API

API REST para crear, editar y listar roles, y para asignar o quitar roles a usuarios precargados.

- **Deploy:** https://obel-roles-api.onrender.com
- **Documentación (Swagger):** https://obel-roles-api.onrender.com/docs
- **Health check:** https://obel-roles-api.onrender.com/health

## Stack

| Herramienta                                | Uso                                                              |
| ------------------------------------------ | ---------------------------------------------------------------- |
| Node.js 22+ y TypeScript                   | Runtime y lenguaje                                               |
| Fastify 5                                  | Servidor HTTP                                                    |
| Zod 4 + `fastify-type-provider-zod`        | Validación de entrada y salida, y tipos derivados de los schemas |
| `@fastify/swagger` + `@fastify/swagger-ui` | Documentación OpenAPI generada a partir de los schemas           |
| Vitest                                     | Tests con `app.inject` (sin levantar un puerto)                  |
| pnpm, Prettier                             | Gestor de paquetes y formato                                     |

### Por qué este stack

Decidí usar este stack y desplegar en Render aunque nunca había trabajado con Fastify ni con Render. Para lo que pedía el challenge (Swagger completo, validación y persistencia en memoria) me pareció la mejor opción:

- **Fastify + Zod:** con un solo schema por ruta obtengo la validación, los tipos de TypeScript y la documentación de Swagger, así que no se pueden desincronizar.
- **Render:** corre un proceso de Node que queda vivo entre requests, algo necesario para que los datos en memoria se mantengan. En una plataforma serverless (por ejemplo Vercel), cada request podría ejecutarse en una instancia distinta y los datos se perderían.

Esto me llevó más tiempo, porque tuve que aprender el framework y las librerías sobre la marcha.

## Correrlo localmente

Requisitos: Node.js 22 o superior y pnpm.

```bash
pnpm install
cp .env.example .env   # completar API_TOKEN con cualquier valor
pnpm dev
```

La API queda en `http://localhost:3000` y la documentación en `http://localhost:3000/docs`.

### Scripts

| Script                              | Qué hace                                                         |
| ----------------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                          | Servidor en modo desarrollo, lee `.env` y se reinicia al guardar |
| `pnpm build`                        | Compila TypeScript a `dist/`                                     |
| `pnpm start`                        | Corre la versión compilada (la que usa producción)               |
| `pnpm test`                         | Corre los tests                                                  |
| `pnpm format` / `pnpm format:check` | Formatea / verifica el formato con Prettier                      |

## Variables de entorno

| Variable    | Obligatoria | Descripción                                                            |
| ----------- | ----------- | ---------------------------------------------------------------------- |
| `API_TOKEN` | Sí          | Token que deben enviar los clientes. Si falta, el servidor no arranca. |
| `PORT`      | No          | Puerto HTTP. Por defecto `3000`. Render lo define automáticamente.     |

## Autenticación

Todas las rutas de `/roles` y `/users` requieren el header:

```
Authorization: Bearer <API_TOKEN>
```

Sin token o con un token inválido, la respuesta es `401`. `/health` y `/docs` son públicas.

Para probar desde Swagger: abrir `/docs`, tocar **Authorize** y pegar el token (sin la palabra `Bearer`).

## Endpoints

| Método | Ruta                           | Descripción                           | Respuestas         |
| ------ | ------------------------------ | ------------------------------------- | ------------------ |
| GET    | `/health`                      | Estado del servicio                   | 200                |
| GET    | `/roles`                       | Lista los roles                       | 200                |
| GET    | `/roles/:roleId`               | Obtiene un rol                        | 200, 404           |
| POST   | `/roles`                       | Crea un rol                           | 201, 400           |
| PATCH  | `/roles/:roleId`               | Edita un rol (parcial)                | 200, 400, 404      |
| GET    | `/users`                       | Lista los usuarios precargados        | 200                |
| GET    | `/users/:userId/roles`         | Roles de un usuario                   | 200, 404           |
| POST   | `/users/:userId/roles`         | Asigna un rol (`{ "roleId": "..." }`) | 200, 400, 404, 409 |
| DELETE | `/users/:userId/roles/:roleId` | Quita un rol                          | 204, 404           |

Un rol tiene `name` (obligatorio) y `description`, `type` y `scope` (opcionales).

```bash
curl -X POST http://localhost:3000/roles \
  -H "Authorization: Bearer $API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Editor", "type": "custom", "scope": "account"}'
```

### Datos precargados

| Roles                                   | Usuarios                                   |
| --------------------------------------- | ------------------------------------------ |
| `role-admin` (Admin, system, global)    | `user-1` Lionel Messi, con `role-admin`    |
| `role-viewer` (Viewer, system, account) | `user-2` Charly García, sin roles          |
|                                         | `user-3` Gustavo Cerati, con `role-viewer` |

### Formato de error

Todos los errores tienen la misma forma. Los errores de validación agregan `details` con un ítem por campo inválido:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Los datos enviados no son válidos",
  "details": [{ "path": "body/name", "message": "Invalid input: expected string, received undefined" }]
}
```

Los errores 500 devuelven un mensaje genérico; el detalle queda solo en los logs.

## Tests

```bash
pnpm test
```

Cubren: `/health` sin token, `401` sin token, creación de un rol (`201`), validación (`400`) y asignación duplicada (`409`). Cada test construye una app y un store nuevos, así que no comparten estado.

## Supuestos y decisiones

- **`type` y `scope` son listas cerradas:** `type` acepta `system` o `custom`, y `scope` acepta `global` o `account`. El enunciado no las define; se eligieron valores cerrados para validar la entrada y documentarlos en Swagger.
- **Persistencia en memoria.** Los datos se reinician cada vez que el servidor arranca (incluido cada deploy o reinicio en Render). El acceso a datos está aislado en `src/data.ts`, así que reemplazarlo por una base de datos no requiere tocar las rutas.
- **PATCH en lugar de PUT** para editar: solo se envían los campos a cambiar, y se exige al menos uno.
- **Asignar un rol responde `200`** con la lista actualizada de roles del usuario, porque modifica una colección existente en lugar de crear un recurso con URL propia.
- **Rol inexistente en el body responde `404`** (otra opción válida sería `422`).
- **Asignar un rol que el usuario ya tiene responde `409 Conflict`.**
- **Autenticación simplificada** con un único token por variable de entorno, como pide el enunciado.

## Estructura

```
src/
  app.ts          # buildApp(): arma la instancia de Fastify (sin listen), usada por server y tests
  server.ts       # punto de entrada: lee variables de entorno y hace listen
  schemas.ts      # schemas de Zod (validación, tipos y Swagger)
  data.ts         # store en memoria con datos precargados
  errors.ts       # AppError, error handler y 404 de rutas inexistentes
  auth.ts         # hook de autenticación por token
  routes/         # plugins de rutas: health, roles, users
test/
  app.test.ts
```

## Deploy (Render)

Web Service conectado a este repositorio:

- **Build command:** `pnpm install --frozen-lockfile && pnpm build`
- **Start command:** `pnpm start`
- **Health check path:** `/health`
- **Variables de entorno:** `API_TOKEN` (un valor largo y aleatorio, por ejemplo `openssl rand -hex 32`) y `NODE_VERSION=24`

En el plan gratuito el servicio se suspende tras un rato sin tráfico; el primer request después de eso puede tardar unos segundos.

## Mejoras posibles

- Persistencia en una base de datos (por ejemplo Postgres con Drizzle) implementando la misma interfaz del store.
- Comparación del token con `crypto.timingSafeEqual`.
- Centralizar los `404` de las rutas lanzando errores en lugar de responder en cada handler.
- Más tests (PATCH, DELETE, rutas inexistentes) y CI que corra `pnpm test` y `pnpm format:check`.

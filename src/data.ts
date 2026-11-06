import { randomUUID } from 'node:crypto'
import type { CreateRoleBody, Role, UpdateRoleBody, User } from './schemas.js'

const seedRoles: Role[] = [
  { id: 'role-admin', name: 'Admin', description: 'Acceso total', type: 'system', scope: 'global' },
  { id: 'role-viewer', name: 'Viewer', description: 'Solo lectura', type: 'system', scope: 'account' },
]

const seedUsers: User[] = [
  { id: 'user-1', name: 'Lionel Messi', email: 'leo@example.com', roleIds: ['role-admin'] },
  { id: 'user-2', name: 'Charly García', email: 'charly@example.com', roleIds: [] },
  { id: 'user-3', name: 'Gustavo Cerati', email: 'gustavo@example.com', roleIds: ['role-viewer'] },
]

export function createStore() {
  const roles = new Map<string, Role>()
  const users = new Map<string, User>()

  for (const role of structuredClone(seedRoles)) roles.set(role.id, role)
  for (const user of structuredClone(seedUsers)) users.set(user.id, user)

  return {
    listRoles(): Role[] {
      return [...roles.values()]
    },
    getRole(id: string): Role | undefined {
      return roles.get(id)
    },
    createRole(data: CreateRoleBody): Role {
      const role: Role = { id: randomUUID(), ...data }
      roles.set(role.id, role)
      return role
    },
    updateRole(id: string, data: UpdateRoleBody): Role | undefined {
      const current = roles.get(id)
      if (!current) return undefined
      const updated: Role = { ...current, ...data }
      roles.set(id, updated)
      return updated
    },
    listUsers(): User[] {
      return [...users.values()]
    },
    getUser(id: string): User | undefined {
      return users.get(id)
    },
    listUserRoles(userId: string): Role[] {
      const user = users.get(userId)
      if (!user) return []
      return user.roleIds.map((roleId) => roles.get(roleId)).filter((role): role is Role => role !== undefined)
    },
    addRoleToUser(userId: string, roleId: string): void {
      users.get(userId)?.roleIds.push(roleId)
    },
    removeRoleFromUser(userId: string, roleId: string): void {
      const user = users.get(userId)
      if (user) user.roleIds = user.roleIds.filter((id) => id !== roleId)
    },
  }
}

export type Store = ReturnType<typeof createStore>

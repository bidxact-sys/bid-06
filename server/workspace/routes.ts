import { Router } from 'express'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { db } from '../db'
import { clients, employees, memberships, notifications, projects, reminders } from '../db/app-schema'

export const workspaceRoutes = Router()

function requireUser(req: { header(name: string): string | undefined }) {
  const userId = req.header('x-user-id')
  if (!userId) throw new Error('Authentication required')
  return userId
}

workspaceRoutes.use((req, res, next) => {
  try {
    requireUser(req)
    next()
  } catch {
    res.status(401).json({ error: 'Authentication required' })
  }
})

workspaceRoutes.get('/notifications', async (req, res) => {
  const userId = requireUser(req)
  const rows = await db.select().from(notifications).where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt))).orderBy(desc(notifications.createdAt)).limit(50)
  res.json({ notifications: rows })
})

workspaceRoutes.post('/notifications/:id/read', async (req, res) => {
  const userId = requireUser(req)
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.id, req.params.id), eq(notifications.recipientUserId, userId)))
  res.status(204).end()
})

workspaceRoutes.get('/clients', async (req, res) => {
  const userId = requireUser(req)
  const rows = await db.select({ client: clients }).from(clients).innerJoin(memberships, eq(memberships.workspaceId, clients.workspaceId)).where(and(eq(memberships.userId, userId), eq(memberships.status, 'active')))
  res.json({ clients: rows.map((row) => row.client) })
})

workspaceRoutes.get('/projects', async (req, res) => {
  const userId = requireUser(req)
  const rows = await db.select({ project: projects }).from(projects).innerJoin(memberships, eq(memberships.workspaceId, projects.workspaceId)).where(and(eq(memberships.userId, userId), eq(memberships.status, 'active')))
  res.json({ projects: rows.map((row) => row.project) })
})

workspaceRoutes.get('/reminders', async (req, res) => {
  const userId = requireUser(req)
  const rows = await db.select({ reminder: reminders }).from(reminders).innerJoin(memberships, eq(memberships.workspaceId, reminders.workspaceId)).where(and(eq(memberships.userId, userId), eq(memberships.status, 'active'))).orderBy(reminders.dueAt)
  res.json({ reminders: rows.map((row) => row.reminder) })
})

workspaceRoutes.get('/employees', async (req, res) => {
  const userId = requireUser(req)
  const rows = await db.select({ employee: employees }).from(employees).innerJoin(memberships, eq(memberships.workspaceId, employees.workspaceId)).where(and(eq(memberships.userId, userId), eq(memberships.status, 'active')))
  res.json({ employees: rows.map((row) => row.employee) })
})

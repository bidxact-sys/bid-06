import 'dotenv/config'
import express from 'express'
import { financeRoutes } from './server/finance/routes'
import { stripeRoutes } from './server/stripe/routes'

export function createApp() {
  const app = express()
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    next()
  })
  app.use('/api/stripe', stripeRoutes)
  app.use(express.json({ limit: '1mb' }))
  app.options('*', (_req, res) => res.sendStatus(204))
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'finance-backend' }))
  app.use('/api/finance', financeRoutes)
  return app
}

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT || 8787)
  createApp().listen(port, () => console.log(`[backend] listening on ${port}`))
}

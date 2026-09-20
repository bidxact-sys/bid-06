import 'dotenv/config'
import express from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from './server/db/index'
import { financeAccounts, financeBudgets, financeGoals, financeRecurringRules, financeTransactions } from './server/db/schema'

const app = express()
app.use((_req, res, next) => { res.header('Access-Control-Allow-Origin', '*'); res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id'); res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); next() })
app.use(express.json({ limit: '1mb' }))

function userId(req: express.Request) {
  const value = req.header('x-user-id')
  if (!value) throw new Error('Missing x-user-id')
  return value
}
function number(value: unknown, name: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative number`)
  return parsed.toFixed(2)
}

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'finance-backend' }))
app.get('/api/finance/accounts', async (req, res) => {
  try { res.json(await db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId(req)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.get('/api/finance/transactions', async (req, res) => {
  try { res.json(await db.select().from(financeTransactions).where(eq(financeTransactions.userId, userId(req))).orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.id))) } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.post('/api/finance/transactions', async (req, res) => {
  try {
    const uid = userId(req)
    const body = req.body as Record<string, unknown>
    const amount = number(body.amount, 'amount')
    const type = String(body.type)
    if (!['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment'].includes(type)) throw new Error('Invalid transaction type')
    const [created] = await db.insert(financeTransactions).values({ userId: uid, accountId: Number(body.accountId), scope: body.scope === 'company' ? 'company' : 'personal', type, amount, description: String(body.description || 'Transaction'), transactionDate: body.transactionDate ? String(body.transactionDate) : undefined, category: body.category ? String(body.category) : null, counterparty: body.counterparty ? String(body.counterparty) : null, transferAccountId: body.transferAccountId ? Number(body.transferAccountId) : null }).returning()
    res.status(201).json(created)
  } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.get('/api/finance/budgets', async (req, res) => { try { res.json(await db.select().from(financeBudgets).where(eq(financeBudgets.userId, userId(req)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })
app.get('/api/finance/goals', async (req, res) => { try { res.json(await db.select().from(financeGoals).where(eq(financeGoals.userId, userId(req)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })
app.get('/api/finance/recurring', async (req, res) => { try { res.json(await db.select().from(financeRecurringRules).where(and(eq(financeRecurringRules.userId, userId(req)), eq(financeRecurringRules.isActive, true)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })

const port = Number(process.env.PORT || 8787)
app.listen(port, () => console.log(`[backend] listening on ${port}`))

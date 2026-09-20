import 'dotenv/config'
import express from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from './server/db/index'
import { financeAccounts, financeBudgets, financeGoals, financeRecurringRules, financeTransactions } from './server/db/schema'

const app = express()
app.use((_req, res, next) => { res.header('Access-Control-Allow-Origin', '*'); res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id'); res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS'); next() })
app.use(express.json({ limit: '1mb' }))
app.options('*', (_req, res) => res.sendStatus(204))

function scope(value: unknown): 'personal' | 'company' {
  if (value !== 'personal' && value !== 'company') throw new Error('scope must be personal or company')
  return value
}
function positiveInteger(value: unknown, name: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`)
  return parsed
}

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
app.post('/api/finance/accounts', async (req, res) => {
  try {
    const uid = userId(req)
    const body = req.body as Record<string, unknown>
    const name = String(body.name || '').trim()
    if (!name) throw new Error('name is required')
    const openingBalance = number(body.openingBalance || 0, 'openingBalance')
    const [created] = await db.insert(financeAccounts).values({ userId: uid, scope: scope(body.scope), name, type: String(body.type || 'checking'), currency: String(body.currency || 'USD'), openingBalance, currentBalance: openingBalance }).returning()
    res.status(201).json(created)
  } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.get('/api/finance/transactions', async (req, res) => {
  try { res.json(await db.select().from(financeTransactions).where(eq(financeTransactions.userId, userId(req))).orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.id))) } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.post('/api/finance/transactions', async (req, res) => {
  try {
    const uid = userId(req)
    const body = req.body as Record<string, unknown>
    const amount = number(body.amount, 'amount')
    const accountId = positiveInteger(body.accountId, 'accountId')
    const type = String(body.type)
    if (!['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment'].includes(type)) throw new Error('Invalid transaction type')
    const transactionScope = scope(body.scope)
    const description = String(body.description || '').trim()
    if (!description) throw new Error('description is required')
    const created = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, uid))).limit(1)
      if (!account) throw new Error('Account not found')
      const [row] = await tx.insert(financeTransactions).values({ userId: uid, accountId, scope: transactionScope, type, amount, description, transactionDate: body.transactionDate ? String(body.transactionDate) : undefined, category: body.category ? String(body.category) : null, counterparty: body.counterparty ? String(body.counterparty) : null, transferAccountId: body.transferAccountId ? positiveInteger(body.transferAccountId, 'transferAccountId') : null }).returning()
      const direction = type === 'income' || type === 'deposit' ? 1 : type === 'expense' || type === 'withdrawal' ? -1 : 0
      if (direction) await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) + direction * Number(amount)) }).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, uid)))
      if (type === 'transfer') {
        const transferAccountId = positiveInteger(body.transferAccountId, 'transferAccountId')
        if (transferAccountId === accountId) throw new Error('Transfer accounts must be different')
        const [destination] = await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, transferAccountId), eq(financeAccounts.userId, uid))).limit(1)
        if (!destination) throw new Error('Transfer destination account not found')
        await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) - Number(amount)) }).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, uid)))
        await tx.update(financeAccounts).set({ currentBalance: String(Number(destination.currentBalance) + Number(amount)) }).where(and(eq(financeAccounts.id, transferAccountId), eq(financeAccounts.userId, uid)))
      }
      return row
    })
    res.status(201).json(created)
  } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.delete('/api/finance/transactions/:id', async (req, res) => {
  try {
    const uid = userId(req)
    const transactionId = positiveInteger(req.params.id, 'transaction id')
    await db.transaction(async (tx) => {
      const [transaction] = await tx.select().from(financeTransactions).where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, uid))).limit(1)
      if (!transaction) throw new Error('Transaction not found')
      const direction = transaction.type === 'income' || transaction.type === 'deposit' ? -1 : transaction.type === 'expense' || transaction.type === 'withdrawal' ? 1 : 0
      if (direction) {
        const [account] = await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, transaction.accountId), eq(financeAccounts.userId, uid))).limit(1)
        if (account) await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) + direction * Number(transaction.amount)) }).where(and(eq(financeAccounts.id, transaction.accountId), eq(financeAccounts.userId, uid)))
      }
      await tx.delete(financeTransactions).where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, uid)))
    })
    res.status(204).send()
  } catch (error) { res.status(400).json({ error: (error as Error).message }) }
})
app.get('/api/finance/budgets', async (req, res) => { try { res.json(await db.select().from(financeBudgets).where(eq(financeBudgets.userId, userId(req)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })
app.get('/api/finance/goals', async (req, res) => { try { res.json(await db.select().from(financeGoals).where(eq(financeGoals.userId, userId(req)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })
app.get('/api/finance/recurring', async (req, res) => { try { res.json(await db.select().from(financeRecurringRules).where(and(eq(financeRecurringRules.userId, userId(req)), eq(financeRecurringRules.isActive, true)))) } catch (error) { res.status(400).json({ error: (error as Error).message }) } })

const port = Number(process.env.PORT || 8787)
app.listen(port, () => console.log(`[backend] listening on ${port}`))

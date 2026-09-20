export type FinanceScope = 'personal' | 'company'
export type FinanceTransactionType = 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal' | 'adjustment'

export interface FinanceAccountInput {
  name: string
  type: string
  scope: FinanceScope
  currency?: string
  openingBalance?: number
}

export interface FinanceTransactionInput {
  accountId: number
  scope: FinanceScope
  type: FinanceTransactionType
  amount: number
  description: string
  transactionDate?: string
  category?: string
  counterparty?: string
  transferAccountId?: number
}

const apiBase = import.meta.env.VITE_API_URL || ''
const userId = import.meta.env.VITE_FINANCE_USER_ID || 'preview-user'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId, ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Finance request failed')
  return payload as T
}

export const financeApi = {
  listAccounts: () => request('/api/finance/accounts'),
  createAccount: (input: FinanceAccountInput) => request('/api/finance/accounts', { method: 'POST', body: JSON.stringify(input) }),
  listTransactions: () => request('/api/finance/transactions'),
  createTransaction: (input: FinanceTransactionInput) => request('/api/finance/transactions', { method: 'POST', body: JSON.stringify(input) }),
  deleteTransaction: (id: number) => request<void>(`/api/finance/transactions/${id}`, { method: 'DELETE' }),
  listBudgets: () => request('/api/finance/budgets'),
  listGoals: () => request('/api/finance/goals'),
  listRecurringRules: () => request('/api/finance/recurring'),
}

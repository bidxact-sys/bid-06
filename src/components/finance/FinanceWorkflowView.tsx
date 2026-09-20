import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardCheck, Download, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { FinanceAccount, FinanceBudget, FinanceGoal, FinanceTransaction, RecurringBill } from '../../types/finance';
import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_NET_WORTH_HISTORY, INITIAL_TRANSACTIONS } from '../../data/financeData';
import { AccountsList } from './AccountsList';
import { TransactionsList } from './TransactionsList';
import { BudgetsProgress } from './BudgetsProgress';
import { RecurringBills } from './RecurringBills';
import { FinancialGoals } from './FinancialGoals';
import { NetWorthChart } from './NetWorthChart';
import { FinanceMetricCards } from './FinanceMetricCards';
import { AddAccountModal } from './AddAccountModal';
import { AddTransactionModal } from './AddTransactionModal';
import { AddGoalModal } from './AddGoalModal';

interface FinanceWorkflowViewProps {
  privacyMode: boolean;
}

type WorkflowStep = 'accounts' | 'transactions' | 'plan' | 'review';

export const FinanceWorkflowView: React.FC<FinanceWorkflowViewProps> = ({ privacyMode }) => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(INITIAL_TRANSACTIONS);
  const [budgets] = useState<FinanceBudget[]>(INITIAL_BUDGETS);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [bills] = useState<RecurringBill[]>([]);
  const [activeStep, setActiveStep] = useState<WorkflowStep>('accounts');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [lastReconciled, setLastReconciled] = useState<string | null>(null);

  const totals = useMemo(() => {
    const assets = accounts.filter((account) => !['credit', 'loan'].includes(account.category)).reduce((sum, account) => sum + account.balance, 0);
    const liabilities = accounts.filter((account) => ['credit', 'loan'].includes(account.category)).reduce((sum, account) => sum + account.balance, 0);
    const income = transactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);
    const spending = Math.abs(transactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0));
    return { assets, liabilities, netWorth: assets - liabilities, income, spending };
  }, [accounts, transactions]);

  const completeStep = (step: WorkflowStep) => {
    const order: WorkflowStep[] = ['accounts', 'transactions', 'plan', 'review'];
    setActiveStep(order[Math.min(order.indexOf(step) + 1, order.length - 1)]);
  };

  const exportSummary = () => {
    const lines = [
      'Bid Exact Personal Finance Monthly Summary',
      `Generated: ${new Date().toLocaleDateString()}`,
      `Net worth: $${totals.netWorth.toLocaleString()}`,
      `Assets: $${totals.assets.toLocaleString()}`,
      `Liabilities: $${totals.liabilities.toLocaleString()}`,
      `Income recorded: $${totals.income.toLocaleString()}`,
      `Spending recorded: $${totals.spending.toLocaleString()}`,
      `Transactions: ${transactions.length}`,
      `Accounts: ${accounts.length}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BidExact_Finance_Summary_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-5 lg:p-7 space-y-5 max-w-[1600px] mx-auto">
      <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4edea3] font-mono font-bold">Personal finance operating workflow</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-[#dae2fd]">Monthly money control center</h1>
            <p className="mt-1 text-sm text-[#86948a] max-w-2xl">Connect accounts, capture transactions, set the plan, then reconcile and close the month with an auditable summary.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsTransactionModalOpen(true)} className="h-9 px-3 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add transaction</button>
            <button onClick={exportSummary} className="h-9 px-3 rounded-md border border-[#2d3449] bg-[#171f33] text-[#dae2fd] text-xs font-mono inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export summary</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
          {[
            ['1', 'Connect accounts', 'accounts'],
            ['2', 'Capture activity', 'transactions'],
            ['3', 'Plan and protect', 'plan'],
            ['4', 'Review and close', 'review'],
          ].map(([number, label, step]) => {
            const active = activeStep === step;
            const complete = ['transactions', 'plan', 'review'].includes(activeStep) && step === 'accounts' || activeStep === 'plan' && step === 'transactions' || activeStep === 'review' && step === 'plan';
            return <button key={step} onClick={() => setActiveStep(step as WorkflowStep)} className={`text-left rounded-lg border p-3 transition-colors ${active ? 'border-[#4edea3]/60 bg-[#4edea3]/10' : 'border-[#222a3d] bg-[#0b1326] hover:border-[#3b455b]'}`}><span className={`text-[10px] font-mono ${active ? 'text-[#4edea3]' : 'text-[#86948a]'}`}>{complete ? '✓' : number}</span><span className="block mt-1 text-xs font-semibold text-[#dae2fd]">{label}</span></button>;
          })}
        </div>
      </section>

      <FinanceMetricCards
        totalAssets={totals.assets}
        totalLiabilities={totals.liabilities}
        netWorth={totals.netWorth}
        monthlyIncome={totals.income}
        monthlyExpenses={totals.spending}
        budgetAllocated={budgets.reduce((sum, budget) => sum + budget.allocated, 0)}
        budgetSpent={budgets.reduce((sum, budget) => sum + budget.spent, 0)}
        liquidCash={accounts.filter((account) => account.category === 'cash').reduce((sum, account) => sum + account.balance, 0)}
        privacyMode={privacyMode}
      />

      {activeStep === 'accounts' && <div className="space-y-4"><AccountsList accounts={accounts} privacyMode={privacyMode} onOpenAddAccount={() => setIsAccountModalOpen(true)} /><div className="flex justify-end"><button onClick={() => completeStep('accounts')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to activity</button></div></div>}
      {activeStep === 'transactions' && <div className="space-y-4"><TransactionsList transactions={transactions} privacyMode={privacyMode} onDeleteTransaction={(id) => setTransactions((current) => current.filter((transaction) => transaction.id !== id))} onOpenAddTransaction={() => setIsTransactionModalOpen(true)} searchQuery="" /><div className="flex justify-end"><button onClick={() => completeStep('transactions')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to planning</button></div></div>}
      {activeStep === 'plan' && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><BudgetsProgress budgets={budgets} privacyMode={privacyMode} /><RecurringBills bills={bills} privacyMode={privacyMode} /><FinancialGoals goals={goals} privacyMode={privacyMode} onOpenAddGoal={() => setIsGoalModalOpen(true)} onContributeGoal={() => undefined} /><div className="xl:col-span-2 flex justify-end"><button onClick={() => completeStep('plan')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to monthly close</button></div></div>}
      {activeStep === 'review' && <div className="space-y-4"><section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-bold">Monthly close checklist</p><h2 className="mt-1 text-lg font-bold text-[#dae2fd]">Review, reconcile, and close</h2></div><ShieldCheck className="w-5 h-5 text-[#4edea3]" /></div><div className="grid sm:grid-cols-2 gap-3 mt-5">{['All account balances reviewed', 'Pending transactions categorized', 'Budgets compared with actuals', 'Bills and goals reviewed'].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg border border-[#222a3d] bg-[#0b1326] p-3 text-xs text-[#bbcabf]"><CheckCircle2 className="w-4 h-4 text-[#4edea3]" />{item}</div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[#86948a]">{lastReconciled ? `Last closed ${lastReconciled}` : 'This month is ready for review.'}</span><button onClick={() => setLastReconciled(new Date().toLocaleDateString())} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Reconcile and close month</button></div></section><NetWorthChart data={INITIAL_NET_WORTH_HISTORY} privacyMode={privacyMode} /></div>}

      <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onAddAccount={(account) => setAccounts((current) => [...current, account])} />
      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} accounts={accounts} onAddTransaction={(transaction) => setTransactions((current) => [transaction, ...current])} />
      <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onAddGoal={(goal) => setGoals((current) => [...current, goal])} />
    </div>
  );
};

export default FinanceWorkflowView;

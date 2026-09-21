import React, { useMemo, useState } from 'react';
import { Activity, CheckCircle2, Clock3, Play, RefreshCw, Zap } from 'lucide-react';

interface FinanceSyncAutomationProps {
  onSyncNow: () => Promise<void> | void;
  connectedCount: number;
}

type SyncRun = {
  id: number;
  label: string;
  detail: string;
  status: 'completed' | 'running';
  time: string;
};

const initialRuns: SyncRun[] = [
  { id: 1, label: 'Scheduled sync', detail: 'Balances and transactions refreshed', status: 'completed', time: 'Today, 08:00' },
  { id: 2, label: 'Connection health check', detail: 'All connected providers responded', status: 'completed', time: 'Yesterday, 18:00' },
];

export const FinanceSyncAutomation: React.FC<FinanceSyncAutomationProps> = ({ onSyncNow, connectedCount }) => {
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [eventEnabled, setEventEnabled] = useState(true);
  const [frequency, setFrequency] = useState('Every 6 hours');
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<SyncRun[]>(initialRuns);

  const modeLabel = useMemo(() => scheduleEnabled && eventEnabled ? 'Scheduled + event-based' : scheduleEnabled ? 'Scheduled only' : eventEnabled ? 'Event-based only' : 'Paused', [scheduleEnabled, eventEnabled]);

  const runSync = async (label = 'Manual sync') => {
    if (isRunning) return;
    setIsRunning(true);
    const runId = Date.now();
    setRuns((current) => [{ id: runId, label, detail: 'Refreshing connected finance providers…', status: 'running' as const, time: 'Just now' }, ...current].slice(0, 4));
    try {
      await onSyncNow();
      setRuns((current) => current.map((run) => run.id === runId ? { ...run, detail: `${connectedCount} provider${connectedCount === 1 ? '' : 's'} checked successfully`, status: 'completed' } : run));
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-4 sm:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4edea3]/10 text-[#4edea3]"><Activity className="h-4 w-4" /></div>
            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#4edea3]">Workflow automation</p>
              <h2 className="mt-0.5 text-lg font-bold text-[#dae2fd]">Finance sync control</h2>
            </div>
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[#86948a]">Keep account balances and transactions current with scheduled refreshes and immediate provider events.</p>
        </div>
        <button type="button" onClick={() => void runSync()} disabled={isRunning} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md bg-[#4edea3] px-3 text-xs font-bold text-[#003824] disabled:cursor-wait disabled:opacity-60"><Play className="h-3.5 w-3.5" />{isRunning ? 'Syncing…' : 'Run sync now'}</button>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-3">
        <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] p-3">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#dae2fd]">Scheduled refresh</p><p className="mt-1 text-[11px] text-[#86948a]">Run even when no one is online.</p></div><button type="button" aria-pressed={scheduleEnabled} onClick={() => setScheduleEnabled((value) => !value)} className={`relative h-5 w-9 rounded-full transition-colors ${scheduleEnabled ? 'bg-[#4edea3]' : 'bg-[#3b455b]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#07101f] transition-transform ${scheduleEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div>
          <select aria-label="Sync frequency" value={frequency} onChange={(event) => setFrequency(event.target.value)} disabled={!scheduleEnabled} className="mt-3 h-8 w-full rounded-md border border-[#2d3449] bg-[#131b2e] px-2 text-xs text-[#dae2fd] disabled:opacity-50"><option>Every hour</option><option>Every 6 hours</option><option>Every 12 hours</option><option>Daily at 08:00</option></select>
        </div>
        <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold text-[#dae2fd]">Provider events</p><p className="mt-1 text-[11px] text-[#86948a]">Sync after a connection or webhook event.</p></div><button type="button" aria-pressed={eventEnabled} onClick={() => setEventEnabled((value) => !value)} className={`relative h-5 w-9 rounded-full transition-colors ${eventEnabled ? 'bg-[#4edea3]' : 'bg-[#3b455b]'}`}><span className={`absolute top-0.5 h-4 w-4 rounded-full bg-[#07101f] transition-transform ${eventEnabled ? 'translate-x-4' : 'translate-x-0.5'}`} /></button></div><div className="mt-3 flex items-center gap-2 text-[11px] text-[#bbcabf]"><Zap className="h-3.5 w-3.5 text-[#f6c453]" />Account connected, transaction posted</div></div>
        <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] p-3"><p className="text-[10px] font-mono uppercase tracking-wider text-[#91a0c5]">Current mode</p><p className="mt-1 text-sm font-bold text-[#4edea3]">{modeLabel}</p><p className="mt-2 text-[11px] text-[#86948a]">{connectedCount} connected provider{connectedCount === 1 ? '' : 's'} in scope</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#222a3d]"><div className="h-full rounded-full bg-[#4edea3]" style={{ width: `${Math.min(100, connectedCount * 25)}%` }} /></div></div>
      </div>

      <div className="mt-5 border-t border-[#222a3d] pt-4"><div className="mb-3 flex items-center justify-between"><div><p className="text-xs font-semibold text-[#dae2fd]">Recent runs</p><p className="mt-0.5 text-[11px] text-[#86948a]">{scheduleEnabled ? `${frequency} schedule is active.` : 'Scheduled refresh is paused.'}</p></div><RefreshCw className="h-4 w-4 text-[#91a0c5]" /></div><div className="grid gap-2 sm:grid-cols-2">{runs.map((run) => <div key={run.id} className="flex items-start gap-2 rounded-lg border border-[#222a3d] bg-[#0b1326] p-3"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${run.status === 'running' ? 'animate-pulse text-[#f6c453]' : 'text-[#4edea3]'}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold text-[#dae2fd]">{run.label}</span><span className="inline-flex items-center gap-1 text-[10px] text-[#86948a]"><Clock3 className="h-3 w-3" />{run.time}</span></div><p className="mt-1 text-[11px] text-[#86948a]">{run.detail}</p></div></div>)}</div></div>
    </section>
  );
};

export default FinanceSyncAutomation;

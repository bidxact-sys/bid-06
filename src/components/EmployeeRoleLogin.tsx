import React from 'react';
import { BriefcaseBusiness, Headset, ShieldCheck, LogOut } from 'lucide-react';

export type EmployeeRole = 'admin' | 'sales' | 'services';

const roles = [
  { id: 'admin' as const, label: 'Company Admin', detail: 'Full company operations and finance', icon: ShieldCheck, color: '#4edea3' },
  { id: 'sales' as const, label: 'Sales Team', detail: 'Leads, clients, proposals, and pipeline', icon: BriefcaseBusiness, color: '#72b7ff' },
  { id: 'services' as const, label: 'Services Team', detail: 'Assigned projects, delivery, and tasks', icon: Headset, color: '#ffb356' },
];

interface Props { role: EmployeeRole; onChange: (role: EmployeeRole) => void; }

export const EmployeeRoleLogin: React.FC<Props> = ({ role, onChange }) => (
  <section className="border-b border-[#29334a] bg-[#10182a] px-4 py-3 sm:px-6">
    <div className="mx-auto flex max-w-7xl flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#86948a]">Role-based access</p><p className="mt-1 text-sm font-semibold text-white">Signed in as {roles.find((item) => item.id === role)?.label}</p></div>
      <div className="flex flex-wrap gap-2" aria-label="Employee login roles">
        {roles.map(({ id, label, detail, icon: Icon, color }) => <button key={id} onClick={() => onChange(id)} aria-pressed={role === id} title={detail} className={`flex items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors ${role === id ? 'border-white/30 bg-white/10 text-white' : 'border-[#29334a] bg-[#0b1326] text-[#9da9c5] hover:border-white/20'}`}><Icon className="h-3.5 w-3.5" style={{ color }} /><span>{label}</span></button>)}
        <button onClick={() => onChange('admin')} className="flex items-center gap-2 rounded-md border border-[#29334a] px-3 py-2 text-xs text-[#9da9c5] hover:text-white"><LogOut className="h-3.5 w-3.5" />Switch role</button>
      </div>
    </div>
  </section>
);

export const RoleDashboardNotice: React.FC<{ role: EmployeeRole }> = ({ role }) => {
  if (role === 'admin') return null;
  const sales = role === 'sales';
  return <div className="mb-5 rounded-lg border border-[#29334a] bg-[#131b2e] p-4"><p className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: sales ? '#72b7ff' : '#ffb356' }}>{sales ? 'Sales workspace' : 'Services workspace'}</p><h2 className="mt-1 text-lg font-semibold text-white">{sales ? 'Revenue pipeline dashboard' : 'Service delivery dashboard'}</h2><p className="mt-1 text-xs text-[#9da9c5]">This interface is scoped to {sales ? 'clients, leads, bids, proposals, and follow-ups.' : 'assigned projects, delivery milestones, outsourced work, and time tracking.'}</p></div>;
};

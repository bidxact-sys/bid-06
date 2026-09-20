import React, { useState, useRef, useEffect } from 'react';
interface WealthTopHeaderProps {
  onOpenAddCompany: () => void;
  onOpenRecordCapital: () => void;
  onOpenSearch: () => void;
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  privacyMode?: boolean;
  onTogglePrivacy?: () => void;
  activeWorkspace?: 'personal-finance' | 'pre-con-estimating';
  onSwitchWorkspace?: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  onToggleMobileMenu?: () => void;
}

export const WealthTopHeader: React.FC<WealthTopHeaderProps> = ({
  onOpenAddCompany,
  onOpenRecordCapital,
  onOpenSearch,
  selectedPeriod,
  onSelectPeriod,
  privacyMode,
  onTogglePrivacy,
  activeWorkspace,
  onSwitchWorkspace,
  onToggleMobileMenu,
}) => {
  const [isPeriodMenuOpen, setIsPeriodMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const periodRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (periodRef.current && !periodRef.current.contains(event.target as Node)) {
        setIsPeriodMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const periods = [
    'Q3 2026 / YTD',
    'Q2 2026 (Audited)',
    'Q1 2026 (Audited)',
    'FY 2025 (Full Year)',
  ];

  return (
    <header className="fixed top-0 left-0 lg:left-72 right-0 h-14 bg-[#0b1326]/90 backdrop-blur-xl border-b border-[#222a3d] z-40 px-2.5 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 shadow-sm">
      {/* Workspace identity and mobile navigation */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#bbcabf] hover:text-white rounded-lg hover:bg-[#131b2e] transition-colors shrink-0"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-xl">menu</span>
          </button>
        )}
        <div className="hidden sm:flex items-center gap-2.5 min-w-0">
          <div className="h-9 w-9 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-lg text-[#4edea3]">account_balance_wallet</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-['Manrope'] text-sm lg:text-base font-bold text-[#edf2ff] truncate">Personal Financial Overview</h1>
              <span className="hidden lg:inline-flex items-center gap-1 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/20 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-[#4edea3]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#4edea3]" />Live
              </span>
            </div>
            <p className="text-[10px] text-[#91a0c5] font-mono truncate">Consolidated wealth, treasury &amp; company connections</p>
          </div>
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div className="flex max-w-[72%] items-center gap-1.5 sm:gap-2.5 shrink-0 overflow-x-auto no-scrollbar">
        {/* Mobile Search Button */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="md:hidden p-2 text-[#bbcabf] hover:text-white rounded hover:bg-[#131b2e] transition-colors"
          aria-label="Search"
          title="Search"
        >
          <span className="material-symbols-outlined text-lg">search</span>
        </button>

        {/* Global Search Button / Trigger */}
        <div
          onClick={onOpenSearch}
          className="hidden md:flex items-center bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] px-3 py-1.5 rounded gap-2 w-44 lg:w-60 text-[#bbcabf] cursor-pointer transition-colors"
        >
          <span className="material-symbols-outlined text-sm">search</span>
          <span className="text-xs flex-1 truncate">Search ledger...</span>
          <kbd className="font-mono text-[10px] bg-[#222a3d] px-1.5 py-0.5 rounded text-[#dae2fd]">Cmd+K</kbd>
        </div>

        {/* Period Selector */}
        <div className="relative hidden sm:block" ref={periodRef}>
          <div
            onClick={() => setIsPeriodMenuOpen(!isPeriodMenuOpen)}
            className="flex items-center bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] px-2.5 sm:px-3 py-1.5 rounded gap-1 sm:gap-1.5 text-[#dae2fd] cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-sm text-[#bbcabf]">date_range</span>
            <span className="font-mono text-xs">{selectedPeriod.split(' ')[0]}</span>
            <span className="material-symbols-outlined text-sm text-[#bbcabf]">arrow_drop_down</span>
          </div>

          {isPeriodMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-[#131b2e] border border-[#2d3449] rounded-md shadow-xl z-50 py-1">
              {periods.map((period) => (
                <button
                  key={period}
                  type="button"
                  onClick={() => {
                    onSelectPeriod(period);
                    setIsPeriodMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-mono transition-colors flex items-center justify-between ${
                    selectedPeriod === period
                      ? 'bg-[#10b981]/20 text-[#4edea3] font-bold'
                      : 'text-[#dae2fd] hover:bg-[#171f33]'
                  }`}
                >
                  <span>{period}</span>
                  {selectedPeriod === period && (
                    <span className="material-symbols-outlined text-xs text-[#4edea3]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Button: Record Capital / Distribution */}
        <button
          type="button"
          onClick={onOpenRecordCapital}
          className="flex items-center bg-[#10b981] hover:bg-[#059669] text-[#003824] px-2.5 sm:px-3.5 py-1.5 rounded gap-1 sm:gap-1.5 cursor-pointer font-['Manrope'] font-semibold text-xs transition-colors shadow-sm"
          title="New Capital or Action"
        >
          <span className="material-symbols-outlined text-sm font-bold">add</span>
          <span className="hidden sm:inline truncate">New Capital</span>
        </button>

        {/* Privacy Mode Toggle */}
        {onTogglePrivacy && (
          <button
            type="button"
            onClick={onTogglePrivacy}
            className={`p-1.5 sm:p-2 rounded transition-colors cursor-pointer ${
              privacyMode
                ? 'bg-[#10b981]/20 text-[#4edea3]'
                : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#131b2e]'
            }`}
            title={privacyMode ? 'Show Financial Figures' : 'Hide Financial Figures (Privacy Mode)'}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {privacyMode ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}

        {/* Switch to Estimating Workspace if provided */}
        {onSwitchWorkspace && (
          <button
            type="button"
            onClick={() => onSwitchWorkspace('pre-con-estimating')}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] text-[#adc6ff] rounded text-xs font-mono transition-colors"
            title="Switch to Bid Exact Pre-Con Estimating Hub"
          >
            <span className="material-symbols-outlined text-sm">engineering</span>
            <span>Estimating Hub</span>
          </button>
        )}

        {/* Quick Add Company Button */}
        <button
          type="button"
          onClick={onOpenAddCompany}
          className="hidden sm:flex items-center bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] border border-[#4edea3]/30 px-3 py-1.5 rounded gap-1.5 cursor-pointer font-mono text-xs font-semibold transition-colors shadow-sm"
          title="Add a new company entity"
        >
          <span className="material-symbols-outlined text-sm">domain_add</span>
          <span>+ Add Company</span>
        </button>

        {/* Notifications Icon with popover */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 rounded text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#131b2e] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ff7886] animate-pulse"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#131b2e] border border-[#2d3449] rounded-lg shadow-2xl z-50 p-3 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-[#222a3d]">
                <span className="font-['Manrope'] font-semibold text-sm text-[#dae2fd]">Notifications</span>
                <span className="font-mono text-[10px] bg-[#ff7886]/20 text-[#ffb2b7] px-2 py-0.5 rounded font-bold">1 Action Required</span>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <div className="p-2.5 rounded bg-[#222a3d]/80 border border-[#ff7886]/30 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#ffb2b7]">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>Cap Table Change Request</span>
                  </div>
                  <p className="text-[11px] text-[#bbcabf]">
                    Ahmad Khan proposed equity adjustment in Bid Exact LLC (Ahmad 60%, Umer 40%).
                  </p>
                  <span className="text-[10px] font-mono text-[#bbcabf] block">1 hour ago</span>
                </div>
                <div className="p-2 rounded bg-[#171f33] space-y-0.5">
                  <div className="text-xs font-medium text-[#dae2fd]">Distribution Cleared</div>
                  <p className="text-[11px] text-[#bbcabf]">+$10,000.00 wired from Bid Exact to Chase Personal Checking.</p>
                  <span className="text-[10px] font-mono text-[#bbcabf] block">Sep 14, 2024</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#222a3d]">
          <div className="flex flex-col text-right hidden lg:flex">
            <span className="font-['Manrope'] font-semibold text-sm text-[#dae2fd] leading-tight">
              Sarah Jenkins / Umer
            </span>
            <span className="font-mono text-[10px] text-[#4edea3] font-semibold">
              Personal Principal & Managing Partner
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#10b981] to-[#3b82f6] text-[#002113] font-bold text-xs flex items-center justify-center ring-1 ring-[#3c4a42]">
            UK
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  ChevronDown,
  Plus,
  FileQuestion,
  FileSpreadsheet,
  Building2,
  Check,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  Menu,
  CalendarClock
} from 'lucide-react';

interface TopNavProps {
  onOpenNewRfi: () => void;
  onOpenNewBid: () => void;
  onOpenNewClient: () => void;
  onOpenCommandPalette: () => void;
  selectedPeriod: string;
  onSelectPeriod: (period: string) => void;
  notificationCount: number;
  onToggleMobileMenu?: () => void;
  onNavigateToReminders?: () => void;
  urgentReminderCount?: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  onOpenNewRfi,
  onOpenNewBid,
  onOpenNewClient,
  onOpenCommandPalette,
  selectedPeriod,
  onSelectPeriod,
  notificationCount,
  onToggleMobileMenu,
  onNavigateToReminders,
  urgentReminderCount = 0,
}) => {
  const [showPeriodMenu, setShowPeriodMenu] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const periods = [
    'Q3 2024 (Active Period)',
    'Q2 2024 (Closed)',
    'Q1 2024 (Closed)',
    'FY 2024 (Full Year Forecast)',
  ];

  const notifications = [
    {
      id: 'notif-1',
      title: 'RFI-2024-089 Delta Calculated',
      time: '12m ago',
      desc: 'Structural schedule rebar revision calculated: +$48,150.00 to Bid #BID-8849',
      unread: true,
      type: 'delta',
    },
    {
      id: 'notif-2',
      title: 'Skanska USA Addendum Received',
      time: '1h ago',
      desc: 'MEP clash resolution package uploaded for Biotech Innovation Lab',
      unread: true,
      type: 'info',
    },
    {
      id: 'notif-3',
      title: 'SLA Escalation Warning',
      time: '3h ago',
      desc: 'RFI-2024-092 ceiling plenum clash SLA response due within 6 hours',
      unread: false,
      type: 'alert',
    },
  ];

  // Close menus on click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  return (
    <header
      id="app-top-header"
      className="h-14 border-b border-[#222a3d] bg-[#0b1326] px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 select-none gap-2 sm:gap-4"
    >
      {/* Left Area: Mobile Menu Toggle & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {onToggleMobileMenu && (
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 text-[#86948a] hover:text-white bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] rounded-md transition-colors shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        {/* Search Bar with Cmd+K */}
        <button
          id="btn-search-command-palette"
          onClick={onOpenCommandPalette}
          className="flex-1 h-9 bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-md px-2.5 sm:px-3 flex items-center justify-between text-xs text-[#86948a] transition-colors group cursor-pointer overflow-hidden"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-colors shrink-0" />
            <span className="text-[#86948a] group-hover:text-[#bbcabf] truncate hidden sm:inline">
              Search transactions, RFIs, projects (Cmd+K)...
            </span>
            <span className="text-[#86948a] group-hover:text-[#bbcabf] truncate sm:hidden">
              Search (⌘K)...
            </span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 font-mono text-[10px] bg-[#0b1326] text-[#86948a] px-1.5 py-0.5 rounded border border-[#222a3d] shrink-0 ml-1">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Period Selector Dropdown (hidden on very small screens, visible on md+) */}
        <div className="relative hidden md:block">
          <button
            id="btn-period-selector"
            onClick={() => setShowPeriodMenu(!showPeriodMenu)}
            className="h-9 px-2.5 sm:px-3 bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] rounded-md text-xs font-medium text-[#dae2fd] flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-[#86948a]" />
            <span className="font-mono text-xs">{selectedPeriod}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#86948a]" />
          </button>

          {showPeriodMenu && (
            <div
              id="menu-period-dropdown"
              className="absolute right-0 mt-1.5 w-60 bg-[#171f33] border border-[#2d3449] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-wider text-[#86948a] border-b border-[#222a3d]">
                Reporting Fiscal Period
              </div>
              {periods.map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    onSelectPeriod(p);
                    setShowPeriodMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-mono text-[#dae2fd] hover:bg-[#222a3d] flex items-center justify-between transition-colors"
                >
                  <span>{p}</span>
                  {selectedPeriod === p && (
                    <Check className="w-3.5 h-3.5 text-[#4edea3]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Primary "+ Create" Button */}
        <div className="relative">
          <button
            id="btn-create-primary"
            onClick={() => setShowCreateMenu(!showCreateMenu)}
            className="h-9 px-2.5 sm:px-3.5 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1 sm:gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Create</span>
            <ChevronDown className="w-3.5 h-3.5 stroke-[2.5] opacity-75" />
          </button>

          {showCreateMenu && (
            <div
              id="menu-create-dropdown"
              className="absolute right-0 mt-1.5 w-52 bg-[#171f33] border border-[#2d3449] rounded-lg shadow-2xl py-1.5 z-50"
            >
              <button
                id="btn-menu-new-rfi"
                onClick={() => {
                  setShowCreateMenu(false);
                  onOpenNewRfi();
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#dae2fd] hover:bg-[#222a3d] flex items-center gap-2.5 transition-colors"
              >
                <div className="p-1 rounded bg-[#ff7886]/10 text-[#ffb4ab]">
                  <FileQuestion className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-medium text-[#dae2fd]">New Pre-Con RFI</div>
                  <div className="text-[10px] text-[#86948a]">Formal inquiry to architect / GC</div>
                </div>
              </button>

              <button
                id="btn-menu-new-bid"
                onClick={() => {
                  setShowCreateMenu(false);
                  onOpenNewBid();
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#dae2fd] hover:bg-[#222a3d] flex items-center gap-2.5 transition-colors"
              >
                <div className="p-1 rounded bg-[#4edea3]/10 text-[#4edea3]">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-medium text-[#dae2fd]">New Proposal / Bid</div>
                  <div className="text-[10px] text-[#86948a]">Create takeoff estimate package</div>
                </div>
              </button>

              <button
                id="btn-menu-new-client"
                onClick={() => {
                  setShowCreateMenu(false);
                  onOpenNewClient();
                }}
                className="w-full px-3 py-2 text-left text-xs text-[#dae2fd] hover:bg-[#222a3d] flex items-center gap-2.5 transition-colors"
              >
                <div className="p-1 rounded bg-[#3b82f6]/10 text-[#adc6ff]">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="font-medium text-[#dae2fd]">Add Client Account</div>
                  <div className="text-[10px] text-[#86948a]">Tier-1 GC or developer profile</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="btn-notification-bell"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-md bg-[#131b2e] hover:bg-[#171f33] border border-[#222a3d] flex items-center justify-center text-[#86948a] hover:text-[#dae2fd] relative transition-colors cursor-pointer"
            title="Notifications & SLA Alerts"
          >
            <Bell className="w-4 h-4" />
            {notificationCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#ff7886] rounded-full ring-2 ring-[#0b1326]" />
            )}
          </button>

          {showNotifications && (
            <div
              id="menu-notifications-popover"
              className="absolute right-0 mt-1.5 w-80 bg-[#171f33] border border-[#2d3449] rounded-lg shadow-2xl z-50 overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-[#222a3d] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                  Live Notifications & SLA Alerts
                  <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#ff7886]/20 text-[#ffb4ab] rounded">
                    2 unread
                  </span>
                </span>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-[#86948a] hover:text-[#dae2fd]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[#222a3d] max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 text-left hover:bg-[#222a3d]/50 transition-colors ${
                      n.unread ? 'bg-[#131b2e]/60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {n.type === 'delta' && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
                        )}
                        {n.type === 'alert' && (
                          <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
                        )}
                        {n.type === 'info' && (
                          <Clock className="w-3.5 h-3.5 text-[#adc6ff]" />
                        )}
                        <span className="text-xs font-medium text-[#dae2fd]">
                          {n.title}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-[#86948a]">
                        {n.time}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#bbcabf] pl-5 leading-relaxed">
                      {n.desc}
                    </p>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-[#222a3d] bg-[#0b1326]">
                <button
                  id="btn-nav-to-reminders-from-notifs"
                  onClick={() => {
                    setShowNotifications(false);
                    onNavigateToReminders?.();
                  }}
                  className="w-full py-1.5 px-3 rounded bg-[#1f2b48] hover:bg-[#28375c] text-xs font-semibold text-[#4edea3] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  <span>Company Reminders ({urgentReminderCount > 0 ? `${urgentReminderCount} Urgent` : 'Schedule & Filings'})</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div
          id="user-profile-pill"
          className="flex items-center gap-2 pl-2 border-l border-[#222a3d]"
        >
          <div className="relative">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Marcus Vance"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#4edea3]/40"
              referrerPolicy="no-referrer"
            />
            <span className="absolute bottom-0 right-0 w-2 h-2 bg-[#4edea3] rounded-full ring-2 ring-[#0b1326]" />
          </div>
          <div className="hidden lg:block text-left leading-tight">
            <div className="text-xs font-semibold text-[#dae2fd]">Marcus Vance</div>
            <div className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase">
              Managing Principal
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

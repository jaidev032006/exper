import React, { useState } from 'react';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  PiggyBank,
  CalendarClock,
  Target,
  BarChart3,
  Tag,
  Settings,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

export type TabType =
  | 'dashboard'
  | 'transactions'
  | 'accounts'
  | 'budgets'
  | 'bills'
  | 'goals'
  | 'analytics'
  | 'categories'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: TabType;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  isMobileOpen,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse,
}) => {
  const { user, logout } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalCollapsed(!internalCollapsed));

  const navGroups: NavGroup[] = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'transactions', label: 'Transactions', icon: ReceiptText },
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      group: 'Wealth & Planning',
      items: [
        { id: 'accounts', label: 'Accounts & Wallets', icon: Wallet },
        { id: 'budgets', label: 'Budgets', icon: PiggyBank },
        { id: 'bills', label: 'Bills & Subscriptions', icon: CalendarClock },
        { id: 'goals', label: 'Savings Goals', icon: Target },
      ],
    },
    {
      group: 'Management',
      items: [
        { id: 'categories', label: 'Categories', icon: Tag },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  const handleNavClick = (tab: TabType) => {
    onTabChange(tab);
    onCloseMobile();
  };

  const NavContent = (
    <div className="flex flex-col h-full bg-[#FFFFFF] dark:bg-[#131E18] border-r border-[#E3E8E3] dark:border-[#203328] transition-all duration-200">
      {/* Brand Header */}
      <div className={`p-5 flex items-center justify-between border-b border-[#E3E8E3] dark:border-[#203328] ${isCollapsed ? 'px-3 justify-center' : ''}`}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Exper Logo Mark - Minimalist Emerald Wealth Emblem */}
          <div className="w-9 h-9 rounded-xl bg-[#137C5A] text-white flex items-center justify-center font-display font-black text-lg shadow-sm flex-shrink-0 tracking-tighter">
            E
          </div>

          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-base tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
                  Exper
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]">
                  PRO
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#627368] dark:text-[#8EA395] -mt-0.5 tracking-tight">
                Personal Wealth
              </p>
            </div>
          )}
        </div>

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-[#627368] hover:text-[#17231D] hover:bg-[#F2F4F1] dark:hover:bg-[#1C2C23] dark:text-[#8EA395] dark:hover:text-[#F2F6F3]"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className="space-y-1">
            {!isCollapsed && (
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                {group.group}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left relative group ${
                    isActive
                      ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] font-semibold shadow-sm'
                      : 'text-[#43564A] dark:text-[#8EA395] hover:text-[#17231D] dark:hover:text-[#F2F6F3] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]'
                  } ${isCollapsed ? 'justify-center px-0' : ''}`}
                >
                  {/* Active emerald left border indicator */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#137C5A] dark:bg-[#34D399] rounded-r-full" />
                  )}

                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive
                        ? 'text-[#137C5A] dark:text-[#34D399]'
                        : 'text-[#627368] dark:text-[#8EA395] group-hover:text-[#17231D] dark:group-hover:text-[#F2F6F3]'
                    }`}
                  />

                  {!isCollapsed && (
                    <span className="truncate flex-1 tracking-tight">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Desktop Toggle */}
      <div className="hidden lg:flex px-3 py-2 border-t border-[#E3E8E3] dark:border-[#203328] justify-end">
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="p-1.5 rounded-lg text-[#627368] hover:text-[#17231D] hover:bg-[#F2F4F1] dark:text-[#8EA395] dark:hover:text-[#F2F6F3] dark:hover:bg-[#1A2820] transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User Info & Sign Out Footer */}
      <div className={`p-3 border-t border-[#E3E8E3] dark:border-[#203328] ${isCollapsed ? 'px-2' : ''}`}>
        <div className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#F7F8F5] dark:bg-[#16231C] border border-[#E3E8E3] dark:border-[#203328] ${isCollapsed ? 'justify-center p-1.5' : 'justify-between'}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 text-left">
                <p className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">
                  {user?.email}
                </p>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-[#627368] hover:text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] rounded-lg transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:block h-screen sticky top-0 flex-shrink-0 z-30 transition-all duration-200 ${
          isCollapsed ? 'w-16' : 'w-60'
        }`}
      >
        {NavContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-[#0D1612]/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-[#FFFFFF] dark:bg-[#131E18] shadow-2xl">
            {NavContent}
          </div>
        </div>
      )}
    </>
  );
};

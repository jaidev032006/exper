import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Sun,
  Moon,
  Bell,
  Plus,
  CheckCheck,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../lib/api.js';
import { Notification } from '../types/index.js';
import { formatDate, formatRelativeTime } from '../utils/formatters.js';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenQuickAdd: () => void;
  onOpenCommandPalette: () => void;
  currentTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onOpenQuickAdd,
  onOpenCommandPalette,
  currentTab,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Tab metadata for context-aware title and subtitle
  const getTabMeta = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Overview',
          subtitle: 'Personal Financial Command Center',
        };
      case 'transactions':
        return {
          title: 'Transactions',
          subtitle: 'Cash flow records & verified financial ledger',
        };
      case 'accounts':
        return {
          title: 'Accounts & Wallets',
          subtitle: 'Consolidated balances, institutions & liquid cash',
        };
      case 'budgets':
        return {
          title: 'Monthly Budgets',
          subtitle: 'Category-level allocations & spending controls',
        };
      case 'bills':
        return {
          title: 'Bills & Subscriptions',
          subtitle: 'Upcoming payment schedule & recurring plans',
        };
      case 'goals':
        return {
          title: 'Savings Goals',
          subtitle: 'Target milestones, progress tracking & emergency funds',
        };
      case 'analytics':
        return {
          title: 'Analytics & Reports',
          subtitle: 'Historical trends, distribution & tax export',
        };
      case 'categories':
        return {
          title: 'Categories',
          subtitle: 'Income and expense classification system',
        };
      case 'settings':
        return {
          title: 'Account Settings',
          subtitle: 'Regional preferences, security & session options',
        };
      default:
        return {
          title: 'Exper',
          subtitle: 'Personal Wealth',
        };
    }
  };

  const meta = getTabMeta();

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res.success) {
        setNotifications(res.data);
        setUnreadCount(res.unreadCount);
      }
    } catch (e) {
      // quiet fail
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#F7F8F5]/90 dark:bg-[#0D1612]/90 backdrop-blur-md border-b border-[#E3E8E3] dark:border-[#203328] transition-colors">
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Mobile hamburger & Context-Aware Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-[#627368] dark:text-[#8EA395] hover:bg-[#EAEFEA] dark:hover:bg-[#1A2820] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate tracking-tight">
              {meta.title}
            </h1>
            <p className="hidden md:block text-[11px] font-medium text-[#627368] dark:text-[#8EA395] truncate -mt-0.5">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Center/Right: Date, Search, Notifications, Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Calendar date badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs font-medium text-[#627368] dark:text-[#8EA395] shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-[#137C5A] dark:text-[#34D399]" />
            <span>{formatDate(new Date(), 'EEEE, dd MMMM yyyy')}</span>
          </div>

          {/* Global Search / Command Palette Trigger */}
          <button
            onClick={onOpenCommandPalette}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FFFFFF] dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#627368] dark:text-[#8EA395] hover:border-[#137C5A] dark:hover:border-[#34D399] transition-all shadow-sm group"
            title="Search commands and pages (Ctrl+K)"
          >
            <Search className="w-3.5 h-3.5 group-hover:text-[#137C5A] dark:group-hover:text-[#34D399]" />
            <span className="hidden md:inline">Quick search...</span>
            <kbd className="hidden md:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-[#F7F8F5] dark:bg-[#1A2820] rounded border border-[#E3E8E3] dark:border-[#203328]">
              ⌘K
            </kbd>
          </button>

          {/* Primary "+ Add Transaction" Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Transaction</span>
            <span className="sm:hidden">Add</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#627368] dark:text-[#8EA395] hover:bg-[#EAEFEA] dark:hover:bg-[#1A2820] border border-[#E3E8E3] dark:border-[#203328] transition-colors bg-[#FFFFFF] dark:bg-[#131E18] shadow-sm"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-4 h-4 text-[#627368]" />
            ) : (
              <Sun className="w-4 h-4 text-[#E2E8F0]" />
            )}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-[#627368] dark:text-[#8EA395] hover:bg-[#EAEFEA] dark:hover:bg-[#1A2820] border border-[#E3E8E3] dark:border-[#203328] transition-colors relative bg-[#FFFFFF] dark:bg-[#131E18] shadow-sm"
              title="Notifications"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D94B4B] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#FFFFFF] dark:bg-[#131E18] rounded-2xl border border-[#E3E8E3] dark:border-[#203328] shadow-modal overflow-hidden animate-fade-in z-50">
                <div className="p-3.5 border-b border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-[#137C5A] dark:text-[#34D399] hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-[#E3E8E3]/60 dark:divide-[#203328]/60">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[#627368] dark:text-[#8EA395]">
                      No notifications right now.
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => !n.isRead && handleMarkRead(n.id)}
                        className={`p-3 text-xs transition-colors cursor-pointer ${
                          n.isRead
                            ? 'bg-transparent text-[#627368] dark:text-[#8EA395]'
                            : 'bg-[#F2F9F5] dark:bg-[#162E23]/40 text-[#17231D] dark:text-[#F2F6F3] font-medium'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          {n.type === 'ALERT' || n.type === 'WARNING' ? (
                            <AlertTriangle className="w-4 h-4 text-[#D94B4B] flex-shrink-0 mt-0.5" />
                          ) : n.type === 'SUCCESS' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#137C5A] flex-shrink-0 mt-0.5" />
                          ) : (
                            <Info className="w-4 h-4 text-[#137C5A] flex-shrink-0 mt-0.5" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold tracking-tight">{n.title}</p>
                            <p className="text-[11px] text-[#627368] dark:text-[#8EA395] mt-0.5 leading-relaxed">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-[#7E9786] dark:text-[#5E7766] mt-1">
                              {formatRelativeTime(n.createdAt)}
                            </p>
                          </div>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#137C5A] dark:bg-[#34D399] flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Compact User Profile Avatar & Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-[#EAEFEA] dark:hover:bg-[#1A2820] transition-colors"
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-lg bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] font-bold text-xs flex items-center justify-center border border-[#C4EBCE] dark:border-[#204B38] shadow-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-52 bg-[#FFFFFF] dark:bg-[#131E18] rounded-2xl border border-[#E3E8E3] dark:border-[#203328] shadow-modal overflow-hidden animate-fade-in z-50 p-1.5">
                <div className="px-3 py-2 border-b border-[#E3E8E3] dark:border-[#203328] mb-1">
                  <p className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate">
                    {user?.name}
                  </p>
                  <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">
                    {user?.email}
                  </p>
                </div>

                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  LayoutDashboard,
  ReceiptText,
  Wallet,
  PiggyBank,
  CalendarClock,
  Target,
  BarChart3,
  Tag,
  Settings,
  Plus,
  Sun,
  Moon,
  ArrowRight,
} from 'lucide-react';
import { TabType } from './Sidebar.js';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenQuickAdd: () => void;
  onToggleTheme: () => void;
  theme: 'light' | 'dark';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenQuickAdd,
  onToggleTheme,
  theme,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const actions = [
    {
      id: 'quick-add',
      title: 'Add New Transaction',
      subtitle: 'Record an income, expense, or transfer',
      icon: Plus,
      category: 'Actions',
      action: () => {
        onOpenQuickAdd();
        onClose();
      },
    },
    {
      id: 'toggle-theme',
      title: `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`,
      subtitle: 'Change appearance theme',
      icon: theme === 'light' ? Moon : Sun,
      category: 'Actions',
      action: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'dashboard',
      title: 'Go to Overview',
      subtitle: 'Personal Financial Command Center',
      icon: LayoutDashboard,
      category: 'Navigation',
      action: () => {
        onNavigateTab('dashboard');
        onClose();
      },
    },
    {
      id: 'transactions',
      title: 'Go to Transactions',
      subtitle: 'Review and filter all recorded transactions',
      icon: ReceiptText,
      category: 'Navigation',
      action: () => {
        onNavigateTab('transactions');
        onClose();
      },
    },
    {
      id: 'accounts',
      title: 'Go to Accounts & Wallets',
      subtitle: 'Manage bank accounts, cash, and credit cards',
      icon: Wallet,
      category: 'Navigation',
      action: () => {
        onNavigateTab('accounts');
        onClose();
      },
    },
    {
      id: 'budgets',
      title: 'Go to Budgets',
      subtitle: 'Set and track monthly spending limits',
      icon: PiggyBank,
      category: 'Navigation',
      action: () => {
        onNavigateTab('budgets');
        onClose();
      },
    },
    {
      id: 'bills',
      title: 'Go to Bills & Subscriptions',
      subtitle: 'Track recurring dues, subscriptions, and utility bills',
      icon: CalendarClock,
      category: 'Navigation',
      action: () => {
        onNavigateTab('bills');
        onClose();
      },
    },
    {
      id: 'goals',
      title: 'Go to Savings Goals',
      subtitle: 'Set financial targets and track milestones',
      icon: Target,
      category: 'Navigation',
      action: () => {
        onNavigateTab('goals');
        onClose();
      },
    },
    {
      id: 'analytics',
      title: 'Go to Analytics & Reports',
      subtitle: 'Income vs expense trends, breakdown, and CSV export',
      icon: BarChart3,
      category: 'Navigation',
      action: () => {
        onNavigateTab('analytics');
        onClose();
      },
    },
    {
      id: 'categories',
      title: 'Go to Categories',
      subtitle: 'Customize income and expense classification',
      icon: Tag,
      category: 'Navigation',
      action: () => {
        onNavigateTab('categories');
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Go to Settings',
      subtitle: 'Profile, currency, regional, and security preferences',
      icon: Settings,
      category: 'Navigation',
      action: () => {
        onNavigateTab('settings');
        onClose();
      },
    },
  ];

  const filteredActions = actions.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredActions[selectedIndex]) {
          filteredActions[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 sm:px-6">
      <div
        className="fixed inset-0 bg-[#0D1612]/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xl bg-[#FFFFFF] dark:bg-[#131E18] rounded-2xl border border-[#E3E8E3] dark:border-[#203328] shadow-modal overflow-hidden animate-fade-in z-10">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#E3E8E3] dark:border-[#203328] gap-3">
          <Search className="w-4 h-4 text-[#627368] dark:text-[#8EA395] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or jump to page... (ESC to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full bg-transparent text-sm text-[#17231D] dark:text-[#F2F6F3] placeholder-[#7E9786] dark:placeholder-[#5E7766] focus:outline-none"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium bg-[#F2F4F1] dark:bg-[#1A2820] text-[#627368] dark:text-[#8EA395] rounded border border-[#E3E8E3] dark:border-[#203328]">
            ESC
          </kbd>
        </div>

        {/* Action list */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#627368] dark:text-[#8EA395]">
              No matching commands or pages found.
            </div>
          ) : (
            filteredActions.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors ${
                    isSelected
                      ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                      : 'text-[#17231D] dark:text-[#F2F6F3] hover:bg-[#F7F8F5] dark:hover:bg-[#1A2820]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-1.5 rounded-lg ${
                      isSelected
                        ? 'bg-[#137C5A] text-white dark:bg-[#34D399] dark:text-[#0D1612]'
                        : 'bg-[#F2F4F1] dark:bg-[#1C2C23] text-[#627368] dark:text-[#8EA395]'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate tracking-tight">{item.title}</p>
                      <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">{item.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 transition-opacity ${isSelected ? 'opacity-100 text-[#137C5A] dark:text-[#34D399]' : 'opacity-0'}`} />
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-[#E3E8E3] dark:border-[#203328] bg-[#F7F8F5] dark:bg-[#0E1612] flex items-center justify-between text-[11px] text-[#627368] dark:text-[#8EA395]">
          <span>Navigate with <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328]">↑</kbd> <kbd className="px-1 py-0.5 rounded bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328]">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328]">Enter</kbd> to select</span>
        </div>
      </div>
    </div>
  );
};

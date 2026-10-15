import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.js';
import { ThemeProvider, useTheme } from './context/ThemeContext.js';
import { LoginPage } from './pages/auth/LoginPage.js';
import { RegisterPage } from './pages/auth/RegisterPage.js';
import { Sidebar, TabType } from './components/Sidebar.js';
import { Header } from './components/Header.js';
import { QuickAddModal } from './components/QuickAddModal.js';
import { CommandPalette } from './components/CommandPalette.js';
import { Toast, ToastProps } from './components/Toast.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { AccountsPage } from './pages/AccountsPage.js';
import { BudgetsPage } from './pages/BudgetsPage.js';
import { BillsPage } from './pages/BillsPage.js';
import { SavingsGoalsPage } from './pages/SavingsGoalsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { CategoriesPage } from './pages/CategoriesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { api } from './lib/api.js';
import { Account, Category, Bill } from './types/index.js';
import {
  LayoutDashboard,
  ReceiptText,
  Wallet,
  PiggyBank,
  Plus,
} from 'lucide-react';

export const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [authView, setAuthView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Shared app data
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active bill to pay immediately from dashboard
  const [activePayBill, setActivePayBill] = useState<Bill | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);

  const addToast = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const loadSharedData = async () => {
    if (!isAuthenticated) return;
    try {
      const [accRes, catRes] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
      ]);
      if (accRes.success) setAccounts(accRes.data);
      if (catRes.success) setCategories(catRes.data);
    } catch (e) {
      console.error('Failed to load shared app data:', e);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadSharedData();
    }
  }, [isAuthenticated]);

  // Global Ctrl+K / ⌘K shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Loading Screen
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F8F5] dark:bg-[#0D1612] space-y-3">
        <div className="w-10 h-10 rounded-xl bg-[#137C5A] text-white flex items-center justify-center font-bold text-lg animate-pulse">
          E
        </div>
        <p className="text-xs font-semibold text-[#627368] dark:text-[#8EA395]">
          Exper Personal Wealth
        </p>
      </div>
    );
  }

  // Auth Pages
  if (!isAuthenticated) {
    if (authView === 'REGISTER') {
      return (
        <RegisterPage
          onSwitchToLogin={() => setAuthView('LOGIN')}
          onRegisterSuccess={() => addToast('success', 'Welcome to Exper!')}
        />
      );
    }
    return (
      <LoginPage
        onSwitchToRegister={() => setAuthView('REGISTER')}
        onLoginSuccess={() => addToast('success', 'Logged in successfully')}
      />
    );
  }

  const handlePayBillQuick = (bill: Bill) => {
    setActivePayBill(bill);
    setCurrentTab('bills');
  };

  return (
    <div className="min-h-screen flex bg-[#F7F8F5] dark:bg-[#0D1612] text-[#17231D] dark:text-[#F2F6F3] transition-colors">
      {/* Sidebar (Desktop Persistent & Mobile Drawer) */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Header Bar */}
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenQuickAdd={() => setIsQuickAddOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          currentTab={currentTab}
        />

        {/* Page View Body */}
        <main className="flex-1 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <DashboardPage
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onPayBillQuick={handlePayBillQuick}
            />
          )}

          {currentTab === 'transactions' && (
            <TransactionsPage
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
              accounts={accounts}
              categories={categories}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountsPage
              accounts={accounts}
              onRefreshAccounts={loadSharedData}
              onOpenQuickAdd={() => setIsQuickAddOpen(true)}
            />
          )}

          {currentTab === 'budgets' && (
            <BudgetsPage categories={categories} />
          )}

          {currentTab === 'bills' && (
            <BillsPage
              accounts={accounts}
              categories={categories}
              activePayBill={activePayBill}
              onClearActivePayBill={() => setActivePayBill(null)}
              onRefreshDashboard={loadSharedData}
            />
          )}

          {currentTab === 'goals' && (
            <SavingsGoalsPage
              accounts={accounts}
              onRefreshAccounts={loadSharedData}
              onRefreshDashboard={loadSharedData}
            />
          )}

          {currentTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {currentTab === 'categories' && (
            <CategoriesPage
              categories={categories}
              onRefreshCategories={loadSharedData}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsPage onRefreshAll={loadSharedData} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#FFFFFF]/95 dark:bg-[#131E18]/95 backdrop-blur-md border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-around py-2 px-3 shadow-lg">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-colors ${
            currentTab === 'dashboard'
              ? 'text-[#137C5A] dark:text-[#34D399] font-bold'
              : 'text-[#627368] dark:text-[#8EA395]'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('transactions')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-colors ${
            currentTab === 'transactions'
              ? 'text-[#137C5A] dark:text-[#34D399] font-bold'
              : 'text-[#627368] dark:text-[#8EA395]'
          }`}
        >
          <ReceiptText className="w-4 h-4" />
          <span>Ledger</span>
        </button>

        {/* Floating Center Quick Add */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="-mt-5 w-11 h-11 rounded-full bg-[#137C5A] text-white flex items-center justify-center shadow-md active:scale-95 transition-transform"
          aria-label="Add Transaction"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
        </button>

        <button
          onClick={() => setCurrentTab('budgets')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-colors ${
            currentTab === 'budgets'
              ? 'text-[#137C5A] dark:text-[#34D399] font-bold'
              : 'text-[#627368] dark:text-[#8EA395]'
          }`}
        >
          <PiggyBank className="w-4 h-4" />
          <span>Budgets</span>
        </button>

        <button
          onClick={() => setCurrentTab('accounts')}
          className={`flex flex-col items-center gap-1 p-1 rounded-xl text-[10px] font-medium transition-colors ${
            currentTab === 'accounts'
              ? 'text-[#137C5A] dark:text-[#34D399] font-bold'
              : 'text-[#627368] dark:text-[#8EA395]'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Accounts</span>
        </button>
      </div>

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          loadSharedData();
          addToast('success', 'Transaction posted successfully');
        }}
        accounts={accounts}
        categories={categories}
      />

      {/* Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateTab={(tab) => setCurrentTab(tab)}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        onToggleTheme={toggleTheme}
        theme={theme}
      />

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

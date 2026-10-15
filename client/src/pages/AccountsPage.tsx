import React, { useState } from 'react';
import {
  Wallet,
  Building2,
  CreditCard,
  Banknote,
  Smartphone,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  MoreVertical,
  Check,
  X,
  Loader2,
  Trash2,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Account, AccountType } from '../types/index.js';
import { formatCurrency } from '../utils/formatters.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface AccountsPageProps {
  accounts: Account[];
  onRefreshAccounts: () => void;
  onOpenQuickAdd: () => void;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  onRefreshAccounts,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Account state
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('BANK');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#137C5A');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transfer state
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  // Delete account confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getAccountIcon = (type: AccountType) => {
    switch (type) {
      case 'BANK':
        return Building2;
      case 'CREDIT_CARD':
        return CreditCard;
      case 'CASH':
        return Banknote;
      case 'UPI':
        return Smartphone;
      case 'SAVINGS':
        return TrendingUp;
      default:
        return Wallet;
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please provide an account name');
      return;
    }

    try {
      setLoading(true);
      await api.createAccount({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        accountNumber: accountNumber.trim() || null,
        color,
        isDefault,
      });

      setIsAddModalOpen(false);
      setName('');
      setBalance('');
      setAccountNumber('');
      onRefreshAccounts();
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    const amt = parseFloat(transferAmount);
    if (isNaN(amt) || amt <= 0) {
      setTransferError('Please enter a valid transfer amount');
      return;
    }

    if (!fromAccountId || !toAccountId || fromAccountId === toAccountId) {
      setTransferError('Please select two distinct accounts');
      return;
    }

    try {
      setTransferLoading(true);
      await api.transferMoney({
        fromAccountId,
        toAccountId,
        amount: amt,
        description: transferDesc.trim() || 'Internal Account Transfer',
      });

      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferDesc('');
      onRefreshAccounts();
    } catch (err: any) {
      setTransferError(err.message || 'Transfer failed');
    } finally {
      setTransferLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletingId) return;
    try {
      await api.deleteAccount(deletingId);
      setDeletingId(null);
      onRefreshAccounts();
    } catch (e) {
      console.error(e);
    }
  };

  const openTransferModalWithSource = (srcId: string) => {
    setFromAccountId(srcId);
    const dest = accounts.find((a) => a.id !== srcId);
    if (dest) setToAccountId(dest.id);
    setIsTransferModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Accounts & Wallets
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Consolidated institutions, liquid savings, and internal capital movement
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              if (accounts.length >= 2) {
                setFromAccountId(accounts[0].id);
                setToAccountId(accounts[1].id);
              }
              setIsTransferModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs hover:border-[#137C5A] shadow-xs transition-all"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Transfer Money</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Account</span>
          </button>
        </div>
      </div>

      {/* Net Worth Summary Strip - Refined Pure Card */}
      <div className="fintech-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#137C5A] dark:bg-[#34D399]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#627368] dark:text-[#8EA395]">
              Consolidated Net Worth
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 font-medium">
            Calculated across {accounts.length} active holdings & credit limits
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] text-xs font-semibold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            <span>Multi-Account Sync Active</span>
          </div>
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.type);

          return (
            <div
              key={acc.id}
              className="fintech-card p-5 flex flex-col justify-between group transition-all duration-200 hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs"
                      style={{ backgroundColor: acc.color || '#137C5A' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                        {acc.name}
                      </h3>
                      <p className="text-[10px] uppercase font-semibold text-[#627368] dark:text-[#8EA395]">
                        {acc.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {acc.isDefault && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]">
                        Default
                      </span>
                    )}
                    <button
                      onClick={() => setDeletingId(acc.id)}
                      className="p-1.5 text-[#627368] hover:text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] rounded-lg transition-colors opacity-70 group-hover:opacity-100"
                      title="Delete account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="my-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                    Available Balance
                  </span>
                  <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
                    {formatCurrency(acc.balance)}
                  </div>
                </div>

                {acc.accountNumber && (
                  <p className="text-[11px] text-[#627368] dark:text-[#8EA395] font-mono mt-1">
                    •••• {acc.accountNumber.slice(-4)}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-3.5 border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
                <button
                  onClick={() => openTransferModalWithSource(acc.id)}
                  className="text-xs font-medium text-[#137C5A] dark:text-[#34D399] hover:underline flex items-center gap-1"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Transfer from this account</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Account Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Add Account or Wallet
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateAccount} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary, Emergency Reserve"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Account Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as AccountType)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  >
                    <option value="BANK">Bank Account</option>
                    <option value="UPI">UPI / Digital Wallet</option>
                    <option value="CASH">Cash Reserve</option>
                    <option value="CREDIT_CARD">Credit Card</option>
                    <option value="SAVINGS">Savings Vault</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Initial Balance (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Account Number / ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 50100234891"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1.5">
                  Badge Color
                </label>
                <div className="flex items-center gap-2">
                  {['#137C5A', '#2563EB', '#7C3AED', '#D97706', '#D94B4B', '#0F172A'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-[#137C5A]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefaultAccount"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-[#E3E8E3] text-[#137C5A] focus:ring-[#137C5A]"
                />
                <label htmlFor="isDefaultAccount" className="text-xs text-[#17231D] dark:text-[#F2F6F3] font-medium cursor-pointer">
                  Set as Primary Default Account
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Internal Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Transfer Between Accounts
              </h3>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {transferError}
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  From Account *
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{a.balance.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  To Account *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} (₹{a.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Transfer Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  placeholder="0.00"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Note / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Move to emergency fund"
                  value={transferDesc}
                  onChange={(e) => setTransferDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {transferLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Execute Transfer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Account"
        message="Are you sure you want to delete this account? Only accounts with no active ledger transactions can be safely removed."
        confirmText="Delete"
        onConfirm={handleDeleteAccount}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

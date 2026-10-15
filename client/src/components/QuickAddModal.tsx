import React, { useState, useEffect } from 'react';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Loader2, IndianRupee } from 'lucide-react';
import { api } from '../lib/api.js';
import { Account, Category, TransactionType } from '../types/index.js';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: Account[];
  categories: Category[];
}

export const QuickAddModal: React.FC<QuickAddModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
}) => {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set default account when accounts list changes
  useEffect(() => {
    if (accounts.length > 0) {
      const defaultAcc = accounts.find((a) => a.isDefault) || accounts[0];
      setAccountId(defaultAcc.id);
      if (accounts.length > 1) {
        const otherAcc = accounts.find((a) => a.id !== defaultAcc.id);
        if (otherAcc) setToAccountId(otherAcc.id);
      }
    }
  }, [accounts]);

  // Set default category according to type
  useEffect(() => {
    const relevantCategories = categories.filter((c) => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));
    if (relevantCategories.length > 0) {
      setCategoryId(relevantCategories[0].id);
    }
  }, [type, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid amount greater than ₹0');
      return;
    }

    if (!accountId) {
      setError('Please select a source account');
      return;
    }

    if (type === 'TRANSFER' && (!toAccountId || toAccountId === accountId)) {
      setError('Please select a different destination account');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a transaction title or description');
      return;
    }

    try {
      setLoading(true);
      await api.createTransaction({
        accountId,
        toAccountId: type === 'TRANSFER' ? toAccountId : null,
        categoryId: type !== 'TRANSFER' ? categoryId : null,
        type,
        amount: parsedAmount,
        date: new Date(date).toISOString(),
        description: description.trim(),
        merchant: merchant.trim() || null,
        paymentMethod,
        notes: notes.trim() || null,
        status: 'POSTED',
      });

      // Reset form
      setAmount('');
      setDescription('');
      setMerchant('');
      setNotes('');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 2000, 5000];

  const handleQuickAddAmount = (addVal: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount(String(cur + addVal));
  };

  const filteredCategories = categories.filter((c) => c.type === (type === 'INCOME' ? 'INCOME' : 'EXPENSE'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0D1612]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#FFFFFF] dark:bg-[#131E18] rounded-2xl border border-[#E3E8E3] dark:border-[#203328] shadow-modal overflow-hidden animate-fade-in z-10 my-8">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
              Record Transaction
            </h2>
            <p className="text-xs text-[#627368] dark:text-[#8EA395]">
              Add cash flow entry to your verified ledger
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#627368] hover:text-[#17231D] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] dark:text-[#8EA395] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] border border-[#FECACA] dark:border-[#4A2222] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
              {error}
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#F2F4F1] dark:bg-[#1A2820] border border-[#E3E8E3] dark:border-[#203328]">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'EXPENSE'
                  ? 'bg-white dark:bg-[#131E18] text-[#D94B4B] shadow-xs'
                  : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>

            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'INCOME'
                  ? 'bg-white dark:bg-[#131E18] text-[#137C5A] dark:text-[#34D399] shadow-xs'
                  : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>

            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                type === 'TRANSFER'
                  ? 'bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] shadow-xs'
                  : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount Large Input */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#627368] dark:text-[#8EA395] mb-1.5">
              Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-[#17231D] dark:text-[#F2F6F3]">
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-2xl font-bold rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-[#F7F8F5] dark:bg-[#18261F] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A] dark:focus:border-[#34D399] transition-all"
              />
            </div>

            {/* Quick Amount Increment Chips */}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAddAmount(q)}
                  className="px-2.5 py-1 rounded-lg bg-[#F2F4F1] dark:bg-[#1A2820] border border-[#E3E8E3] dark:border-[#203328] text-[11px] font-medium text-[#43564A] dark:text-[#8EA395] hover:text-[#17231D] hover:border-[#137C5A] transition-colors"
                >
                  +{q}
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Title & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Transaction Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Grocery Restock"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Merchant / Payee (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Blinkit, Swiggy"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>
          </div>

          {/* Account Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                {type === 'TRANSFER' ? 'From Account *' : 'Account *'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                  </option>
                ))}
              </select>
            </div>

            {type === 'TRANSFER' ? (
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  To Account *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (₹{acc.balance.toLocaleString('en-IN')})
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {filteredCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              >
                <option value="UPI">UPI / GPay / PhonePe</option>
                <option value="NETBANKING">Net Banking / IMPS</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="DEBIT_CARD">Debit Card</option>
                <option value="CASH">Cash</option>
                <option value="AUTO_DEBIT">Auto-Debit / Mandate</option>
              </select>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add reference tags, invoice ID, or personal context..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A] resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#137C5A] hover:bg-[#0F6549] text-white shadow-sm transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  PiggyBank,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Calendar,
  X,
  TrendingDown,
  TrendingUp,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Budget, Category } from '../types/index.js';
import { formatCurrency } from '../utils/formatters.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface BudgetsPageProps {
  categories: Category[];
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({ categories }) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [summary, setSummary] = useState<any>({
    totalBudget: 0,
    totalSpent: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Month selector
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedPeriod, setSelectedPeriod] = useState(currentMonthStr);

  // Add / Edit Budget Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Delete Budget
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      const res = await api.getBudgets(selectedPeriod);
      if (res.success) {
        setBudgets(res.data);
        setSummary(res.summary);
      }
    } catch (e) {
      console.error('Failed to load budgets:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [selectedPeriod]);

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setModalError('Please enter a valid budget limit');
      return;
    }

    if (!selectedCategory) {
      setModalError('Please choose a category');
      return;
    }

    try {
      setModalLoading(true);
      await api.saveBudget({
        categoryId: selectedCategory,
        amount: amt,
        period: selectedPeriod,
      });

      setIsModalOpen(false);
      setAmount('');
      fetchBudgets();
    } catch (err: any) {
      setModalError(err.message || 'Failed to save budget');
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingId) return;
    try {
      await api.deleteBudget(deletingId);
      setDeletingId(null);
      fetchBudgets();
    } catch (e) {
      console.error(e);
    }
  };

  const openAddModal = (catId?: string, existingLimit?: number) => {
    if (catId) {
      setSelectedCategory(catId);
      setAmount(existingLimit ? existingLimit.toString() : '');
    } else if (expenseCategories.length > 0) {
      setSelectedCategory(expenseCategories[0].id);
      setAmount('');
    }
    setModalError(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Monthly Budgets
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Category-level spending thresholds, consumption rates & overspending alerts
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs font-medium text-[#17231D] dark:text-[#F2F6F3] shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-[#137C5A] dark:text-[#34D399]" />
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none"
            />
          </div>

          <button
            onClick={() => openAddModal()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Create Budget</span>
          </button>
        </div>
      </div>

      {/* Overall Summary Banner (3 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Total Allocated Budget
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
            {formatCurrency(summary.totalBudget)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            Across {budgets.length} expense categories
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Total Spent this Month
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
            {formatCurrency(summary.totalSpent)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            {summary.overallPercentage.toFixed(1)}% of total allocation
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Remaining Spending Buffer
          </span>
          <div
            className={`text-xl sm:text-2xl font-bold tracking-tight mt-1 ${
              summary.totalRemaining < 0
                ? 'text-[#D94B4B]'
                : 'text-[#137C5A] dark:text-[#34D399]'
            }`}
          >
            {formatCurrency(summary.totalRemaining)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            {summary.totalRemaining < 0 ? 'Budget exceeded overall' : 'Safe spending margin'}
          </p>
        </div>
      </div>

      {/* Budgets Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#7E9786] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#137C5A] border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Calculating budget utilization...</p>
        </div>
      ) : budgets.length === 0 ? (
        <div className="fintech-card p-12 text-center flex flex-col items-center justify-center">
          <PiggyBank className="w-12 h-12 mb-3 opacity-40 text-[#7E9786]" />
          <h4 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
            No budgets configured for {selectedPeriod}
          </h4>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 max-w-sm">
            Set spending limits for categories like Food & Dining, Groceries, Shopping, and Travel to keep expenses under control.
          </p>
          <button
            onClick={() => openAddModal()}
            className="mt-4 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Add First Budget
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {budgets.map((b) => (
            <div
              key={b.id}
              className={`fintech-card p-5 flex flex-col justify-between transition-all ${
                b.isExceeded
                  ? 'border-[#FECACA] dark:border-[#4A2222]'
                  : b.isWarning
                  ? 'border-[#FDE68A] dark:border-[#523A0B]'
                  : ''
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs"
                      style={{ backgroundColor: b.category?.color || '#137C5A' }}
                    >
                      {b.category?.name[0] || 'C'}
                    </div>
                    <div>
                      <h3 className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                        {b.category?.name}
                      </h3>
                      <p className="text-[10px] text-[#627368] dark:text-[#8EA395]">
                        Monthly Cap: {formatCurrency(b.limit)}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setDeletingId(b.id)}
                    className="p-1 text-[#627368] hover:text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] rounded-lg transition-colors"
                    title="Delete budget"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="my-3 space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs font-bold text-[#17231D] dark:text-[#F2F6F3]">
                      {formatCurrency(b.spent)}
                    </span>
                    <span
                      className={`text-[11px] font-semibold ${
                        b.isExceeded
                          ? 'text-[#D94B4B]'
                          : b.isWarning
                          ? 'text-[#D97706]'
                          : 'text-[#137C5A] dark:text-[#34D399]'
                      }`}
                    >
                      {b.percentage.toFixed(0)}%
                    </span>
                  </div>

                  {/* Linear Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] dark:bg-[#1C2C23] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        b.isExceeded
                          ? 'bg-[#D94B4B]'
                          : b.isWarning
                          ? 'bg-[#D97706]'
                          : 'bg-[#137C5A] dark:bg-[#34D399]'
                      }`}
                      style={{ width: `${Math.min(100, b.percentage)}%` }}
                    />
                  </div>
                </div>

                <div className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                  {b.isExceeded ? (
                    <span className="text-[#D94B4B] font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Over budget by {formatCurrency(Math.abs(b.remaining))}
                    </span>
                  ) : (
                    <span>{formatCurrency(b.remaining)} remaining buffer</span>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E3E8E3] dark:border-[#203328] flex justify-end">
                <button
                  onClick={() => openAddModal(b.categoryId, b.limit)}
                  className="text-xs font-medium text-[#137C5A] dark:text-[#34D399] hover:underline"
                >
                  Edit Limit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Set Category Budget
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveBudget} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Expense Category *
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Monthly Limit (₹ INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="e.g. 15000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {modalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Budget</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Budget"
        message="Are you sure you want to delete this monthly budget limit? Historical transaction records will not be affected."
        confirmText="Delete"
        onConfirm={handleDeleteBudget}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

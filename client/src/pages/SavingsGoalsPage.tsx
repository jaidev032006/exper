import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { SavingsGoal, Account } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface SavingsGoalsPageProps {
  accounts: Account[];
  onRefreshAccounts: () => void;
  onRefreshDashboard?: () => void;
}

export const SavingsGoalsPage: React.FC<SavingsGoalsPageProps> = ({
  accounts,
  onRefreshAccounts,
  onRefreshDashboard,
}) => {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<any>({
    totalTarget: 0,
    totalSaved: 0,
    totalRemaining: 0,
    overallPercentage: 0,
  });
  const [loading, setLoading] = useState(true);

  // Add Goal Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Contribute Modal
  const [contributingGoal, setContributingGoal] = useState<SavingsGoal | null>(null);
  const [contribAmount, setContribAmount] = useState('');
  const [contribAccountId, setContribAccountId] = useState('');
  const [contribLoading, setContribLoading] = useState(false);
  const [contribError, setContribError] = useState<string | null>(null);

  // Delete Goal
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await api.getGoals();
      if (res.success) {
        setGoals(res.data);
        setSummary(res.summary);
      }
    } catch (e) {
      console.error('Failed to load goals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const target = parseFloat(targetAmount);
    if (isNaN(target) || target <= 0) {
      setAddError('Please enter a valid target amount');
      return;
    }

    try {
      setAddLoading(true);
      await api.createGoal({
        name: name.trim(),
        targetAmount: target,
        currentAmount: parseFloat(currentAmount) || 0,
        targetDate: targetDate ? new Date(targetDate).toISOString() : null,
        notes: notes.trim() || null,
      });

      setIsAddModalOpen(false);
      setName('');
      setTargetAmount('');
      setCurrentAmount('');
      setTargetDate('');
      setNotes('');
      fetchGoals();
      onRefreshDashboard?.();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create goal');
    } finally {
      setAddLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributingGoal) return;

    const amt = parseFloat(contribAmount);
    if (isNaN(amt) || amt <= 0) {
      setContribError('Please enter a valid contribution amount');
      return;
    }

    try {
      setContribLoading(true);
      setContribError(null);

      await api.contributeToGoal(contributingGoal.id, {
        amount: amt,
        fromAccountId: contribAccountId || undefined,
      });

      setContributingGoal(null);
      setContribAmount('');
      fetchGoals();
      onRefreshAccounts();
      onRefreshDashboard?.();
    } catch (err: any) {
      setContribError(err.message || 'Contribution failed');
    } finally {
      setContribLoading(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingId) return;
    try {
      await api.deleteGoal(deletingId);
      setDeletingId(null);
      fetchGoals();
      onRefreshDashboard?.();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Savings Goals & Milestones
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Target capital milestones, emergency runway funds & deliberate wealth accumulation
          </p>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Savings Goal</span>
        </button>
      </div>

      {/* Summary Banner (3 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Total Target Across Goals
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
            {formatCurrency(summary.totalTarget)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            {goals.length} active financial milestones
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Total Saved So Far
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#137C5A] dark:text-[#34D399] mt-1">
            {formatCurrency(summary.totalSaved)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            {summary.overallPercentage.toFixed(1)}% of cumulative target achieved
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Remaining Capital to Accumulate
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
            {formatCurrency(summary.totalRemaining)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            Build habits through systematic monthly deposits
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      {loading ? (
        <div className="p-12 text-center text-[#7E9786] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#137C5A] border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Loading savings milestones...</p>
        </div>
      ) : goals.length === 0 ? (
        <div className="fintech-card p-12 text-center flex flex-col items-center justify-center">
          <Target className="w-12 h-12 mb-3 opacity-40 text-[#7E9786]" />
          <h4 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
            No savings goals created
          </h4>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 max-w-sm">
            Set up an Emergency Runway Fund or save for investments, travel, or major asset purchases.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-4 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Set First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const isFinished = goal.percentage >= 100;
            return (
              <div
                key={goal.id}
                className="fintech-card p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] flex items-center justify-center font-bold text-xs shadow-xs">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                          {goal.name}
                        </h3>
                        {goal.targetDate && (
                          <p className="text-[10px] text-[#627368] dark:text-[#8EA395]">
                            Target: {formatDate(goal.targetDate, 'dd MMM yyyy')}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setDeletingId(goal.id)}
                      className="p-1 text-[#627368] hover:text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] rounded-lg transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="my-3 space-y-1.5">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[#17231D] dark:text-[#F2F6F3]">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-[11px] font-medium text-[#627368] dark:text-[#8EA395]">
                        Goal: {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    {/* Linear Progress Bar */}
                    <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] dark:bg-[#1C2C23] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#137C5A] dark:bg-[#34D399] transition-all duration-500"
                        style={{ width: `${Math.min(100, goal.percentage)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-[#137C5A] dark:text-[#34D399] font-semibold">
                      {goal.percentage.toFixed(0)}% reached
                    </span>
                    <span className="text-[#627368] dark:text-[#8EA395]">
                      {isFinished ? 'Completed 🎉' : `${formatCurrency(goal.remaining)} remaining`}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
                  <button
                    onClick={() => {
                      setContributingGoal(goal);
                      setContribAmount('');
                      setContribError(null);
                      if (accounts.length > 0) setContribAccountId(accounts[0].id);
                    }}
                    className="text-xs font-medium text-[#137C5A] dark:text-[#34D399] hover:underline flex items-center gap-1"
                  >
                    <span>+ Add Contribution</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contribute to Goal Modal */}
      {contributingGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                  Contribute to {contributingGoal.name}
                </h3>
                <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                  Deposit funds toward this milestone
                </p>
              </div>
              <button
                onClick={() => setContributingGoal(null)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {contribError && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {contribError}
              </div>
            )}

            <form onSubmit={handleContribute} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Contribution Amount (₹ INR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  placeholder="0.00"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Deduct from Account (Optional)
                </label>
                <select
                  value={contribAccountId}
                  onChange={(e) => setContribAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  <option value="">Do not link to bank balance</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setContributingGoal(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={contribLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {contribLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Deposit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Create Savings Goal
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {addError && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Goal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emergency Runway (6 Mo), Trip to Ladakh"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="e.g. 150000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Initial Deposit (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Target Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Notes & Strategy (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Auto-deposit ₹15k on salary day"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
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
                  disabled={addLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {addLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Goal</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Savings Goal"
        message="Are you sure you want to remove this savings goal? Your bank account balances will not be affected."
        confirmText="Delete"
        onConfirm={handleDeleteGoal}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Trash2,
  X,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Bill, Account, Category, BillRecurrence } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface BillsPageProps {
  accounts: Account[];
  categories: Category[];
  activePayBill?: Bill | null;
  onClearActivePayBill?: () => void;
  onRefreshDashboard?: () => void;
}

export const BillsPage: React.FC<BillsPageProps> = ({
  accounts,
  categories,
  activePayBill,
  onClearActivePayBill,
  onRefreshDashboard,
}) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Bill Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('MONTHLY');
  const [notes, setNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Pay Bill Modal
  const [payingBill, setPayingBill] = useState<Bill | null>(null);
  const [payAccountId, setPayAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [payLoading, setPayLoading] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Delete Bill
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await api.getBills();
      if (res.success) {
        setBills(res.data);
      }
    } catch (e) {
      console.error('Failed to load bills:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Sync external pay request if passed from dashboard
  useEffect(() => {
    if (activePayBill) {
      setPayingBill(activePayBill);
      if (accounts.length > 0) setPayAccountId(accounts[0].id);
    }
  }, [activePayBill, accounts]);

  useEffect(() => {
    if (accounts.length > 0 && !payAccountId) {
      const def = accounts.find((a) => a.isDefault) || accounts[0];
      setPayAccountId(def.id);
    }
  }, [accounts, payAccountId]);

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      setAddError('Please enter a valid bill amount');
      return;
    }

    if (!dueDate) {
      setAddError('Please specify the bill due date');
      return;
    }

    try {
      setAddLoading(true);
      await api.createBill({
        name: name.trim(),
        amount: amt,
        dueDate: new Date(dueDate).toISOString(),
        categoryId: categoryId || null,
        recurrence,
        notes: notes.trim() || null,
      });

      setIsAddModalOpen(false);
      setName('');
      setAmount('');
      setDueDate('');
      setNotes('');
      fetchBills();
      onRefreshDashboard?.();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create bill');
    } finally {
      setAddLoading(false);
    }
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingBill) return;

    try {
      setPayLoading(true);
      setPayError(null);

      await api.payBill(payingBill.id, {
        accountId: payAccountId,
        paymentMethod,
      });

      setPayingBill(null);
      onClearActivePayBill?.();
      fetchBills();
      onRefreshDashboard?.();
    } catch (err: any) {
      setPayError(err.message || 'Payment failed');
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!deletingId) return;
    try {
      await api.deleteBill(deletingId);
      setDeletingId(null);
      fetchBills();
      onRefreshDashboard?.();
    } catch (e) {
      console.error(e);
    }
  };

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  const pendingBills = bills.filter((b) => b.status !== 'PAID' && b.status !== 'CANCELLED');
  const paidBills = bills.filter((b) => b.status === 'PAID');
  const totalPendingAmount = pendingBills.reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Bills & Subscriptions
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Upcoming payment schedule, recurring frequencies & verified automated ledger posting
          </p>
        </div>

        <button
          onClick={() => {
            if (expenseCategories.length > 0) setCategoryId(expenseCategories[0].id);
            setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Bill</span>
        </button>
      </div>

      {/* Summary Banner (3 cols) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Pending Obligations
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
            {formatCurrency(totalPendingAmount)}
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            {pendingBills.length} unpaid upcoming obligations
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Due Soon (≤ 3 Days)
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#D97706] mt-1">
            {bills.filter((b) => b.status === 'DUE_SOON').length} bills
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            Immediate action recommended
          </p>
        </div>

        <div className="fintech-card p-5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
            Completed Payments
          </span>
          <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#137C5A] dark:text-[#34D399] mt-1">
            {paidBills.length} bills settled
          </div>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
            Seamlessly synchronized to expense ledger
          </p>
        </div>
      </div>

      {/* Bills List Card */}
      <div className="fintech-card overflow-hidden">
        <div className="p-5 border-b border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
            Scheduled Payment Portfolio
          </h3>
          <span className="text-xs text-[#627368] dark:text-[#8EA395]">
            {bills.length} total obligations
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-[#7E9786] flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#137C5A] border-t-transparent animate-spin" />
            <p className="text-xs font-medium">Checking scheduled obligations...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CalendarClock className="w-12 h-12 mb-3 opacity-40 text-[#7E9786]" />
            <h4 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
              No bills scheduled
            </h4>
            <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 max-w-sm">
              Keep recurring payments like rent, electricity, Netflix, SIPs, and insurance organized and paid on time.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Schedule First Bill
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E8E3] dark:border-[#203328] bg-[#F7F8F5]/60 dark:bg-[#16231C]/60 text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                  <th className="py-3 pl-5">Bill Name</th>
                  <th className="py-3 px-3">Recurrence</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Due Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 pr-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E3]/60 dark:divide-[#203328]/60 text-xs">
                {bills.map((bill) => {
                  const isPaid = bill.status === 'PAID';
                  const isOverdue = bill.status === 'OVERDUE';
                  const isDueSoon = bill.status === 'DUE_SOON';

                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-[#F7F8F5] dark:hover:bg-[#18261F] transition-colors"
                    >
                      <td className="py-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isPaid
                                ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                                : isOverdue
                                ? 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                                : isDueSoon
                                ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#2F2107] dark:text-[#FBBF24]'
                                : 'bg-[#F2F4F1] text-[#43564A] dark:bg-[#1C2C23] dark:text-[#8EA395]'
                            }`}
                          >
                            <CalendarClock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                              {bill.name}
                            </p>
                            {bill.notes && (
                              <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">
                                {bill.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F2F4F1] dark:bg-[#1C2C23] text-[#43564A] dark:text-[#8EA395] uppercase">
                          {bill.recurrence}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <span className="text-[#627368] dark:text-[#8EA395] font-medium text-xs">
                          {bill.category?.name || 'Recurring Plan'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-[#627368] dark:text-[#8EA395] text-xs">
                        {formatDate(bill.dueDate, 'dd MMM yyyy')}
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isPaid
                              ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                              : isOverdue
                              ? 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                              : isDueSoon
                              ? 'bg-[#FEF3C7] text-[#D97706] dark:bg-[#2F2107] dark:text-[#FBBF24]'
                              : 'bg-[#F2F4F1] text-[#43564A] dark:bg-[#1C2C23] dark:text-[#8EA395]'
                          }`}
                        >
                          {isPaid ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : isOverdue ? (
                            <AlertCircle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{bill.status.replace('_', ' ')}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-bold text-xs text-[#17231D] dark:text-[#F2F6F3]">
                          {formatCurrency(bill.amount)}
                        </span>
                      </td>

                      <td className="py-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPaid ? (
                            <button
                              onClick={() => {
                                setPayingBill(bill);
                                if (accounts.length > 0) setPayAccountId(accounts[0].id);
                              }}
                              className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#137C5A] hover:bg-[#0F6549] text-white shadow-xs transition-all"
                            >
                              Pay Now
                            </button>
                          ) : (
                            <span className="text-[11px] font-medium text-[#137C5A] dark:text-[#34D399]">
                              Settled
                            </span>
                          )}

                          <button
                            onClick={() => setDeletingId(bill.id)}
                            title="Delete bill"
                            className="p-1 rounded-lg text-[#627368] hover:text-[#D94B4B] hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pay Bill Modal */}
      {payingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <div>
                <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                  Pay Bill: {payingBill.name}
                </h3>
                <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                  Settle bill obligation and post record to ledger
                </p>
              </div>
              <button
                onClick={() => setPayingBill(null)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {payError && (
              <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {payError}
              </div>
            )}

            <form onSubmit={handlePayBill} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between">
                <span className="text-xs text-[#627368] dark:text-[#8EA395]">Bill Amount Due</span>
                <span className="text-lg font-bold text-[#17231D] dark:text-[#F2F6F3]">
                  {formatCurrency(payingBill.amount)}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Pay From Account *
                </label>
                <select
                  value={payAccountId}
                  onChange={(e) => setPayAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Available: {formatCurrency(a.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="NETBANKING">Net Banking</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="AUTO_DEBIT">Auto-Debit Mandate</option>
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={payLoading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {payLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm & Deduct Balance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Schedule Recurring Bill
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

            <form onSubmit={handleCreateBill} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Bill or Subscription Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fiber Internet, Office Rent, Term Plan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Next Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  >
                    <option value="">No Category</option>
                    {expenseCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Recurrence
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) => setRecurrence(e.target.value as BillRecurrence)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="ONCE">One-time Due</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Notes / Account Ref (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Consumer ID #920192"
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
                  <span>Save Bill</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Bill"
        message="Are you sure you want to remove this scheduled bill? Past paid transaction history will remain intact."
        confirmText="Delete"
        onConfirm={handleDeleteBill}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

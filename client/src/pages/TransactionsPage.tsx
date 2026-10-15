import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  Edit2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Receipt,
  X,
  FileSpreadsheet,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Transaction, Account, Category, TransactionType } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface TransactionsPageProps {
  onOpenQuickAdd: () => void;
  accounts: Account[];
  categories: Category[];
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenQuickAdd,
  accounts,
  categories,
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });

  // Filters & Search
  const [search, setSearch] = useState('');
  const [type, setType] = useState<string>('ALL');
  const [categoryId, setCategoryId] = useState<string>('ALL');
  const [accountId, setAccountId] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Delete confirmation
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit Modal
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editMerchant, setEditMerchant] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editAccountId, setEditAccountId] = useState('');
  const [editDate, setEditDate] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (type !== 'ALL') params.type = type;
      if (categoryId !== 'ALL') params.categoryId = categoryId;
      if (accountId !== 'ALL') params.accountId = accountId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getTransactions(params);
      if (res.success) {
        setTransactions(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [pagination.page, type, categoryId, accountId, startDate, endDate, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('ALL');
    setCategoryId('ALL');
    setAccountId('ALL');
    setStartDate('');
    setEndDate('');
    setSortBy('date');
    setSortOrder('desc');
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      await api.deleteTransaction(deletingId);
      setDeletingId(null);
      fetchTransactions();
    } catch (e) {
      console.error('Delete failed:', e);
    } finally {
      setIsDeleting(false);
    }
  };

  const openEditModal = (tx: Transaction) => {
    setEditingTransaction(tx);
    setEditAmount(tx.amount.toString());
    setEditDescription(tx.description);
    setEditMerchant(tx.merchant || '');
    setEditCategoryId(tx.categoryId || '');
    setEditAccountId(tx.accountId);
    setEditDate(new Date(tx.date).toISOString().split('T')[0]);
    setEditError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      setIsSavingEdit(true);
      setEditError(null);

      await api.updateTransaction(editingTransaction.id, {
        amount: parseFloat(editAmount),
        description: editDescription.trim(),
        merchant: editMerchant.trim() || null,
        categoryId: editCategoryId || null,
        accountId: editAccountId,
        date: new Date(editDate).toISOString(),
      });

      setEditingTransaction(null);
      fetchTransactions();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update transaction');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleExportCSV = () => {
    api.exportTransactionsCsv({
      type,
      categoryId,
      accountId,
      startDate,
      endDate,
      search,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Transaction Ledger
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Verified cash flow records with multi-dimensional filtering & CSV export
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs hover:border-[#137C5A] dark:hover:border-[#34D399] shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="fintech-card p-5 space-y-4">
        {/* Search input + Type filters row */}
        <div className="flex flex-col md:flex-row gap-3">
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-3.5 h-3.5 text-[#7E9786] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search description, merchant, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] placeholder-[#7E9786] focus:outline-none focus:border-[#137C5A]"
            />
          </form>

          {/* Type Switcher */}
          <div className="inline-flex p-1 bg-[#F2F4F1] dark:bg-[#1A2820] rounded-xl border border-[#E3E8E3] dark:border-[#203328] flex-shrink-0">
            {['ALL', 'EXPENSE', 'INCOME', 'TRANSFER'].map((t) => (
              <button
                key={t}
                onClick={() => {
                  setType(t);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  type === t
                    ? 'bg-white dark:bg-[#131E18] text-[#137C5A] dark:text-[#34D399] font-semibold shadow-xs'
                    : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
                }`}
              >
                {t === 'ALL' ? 'All Types' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdowns Row: Category, Account, Date range, Sort */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-3 border-t border-[#E3E8E3] dark:border-[#203328] text-xs">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766] mb-1">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
            >
              <option value="ALL">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766] mb-1">
              Account
            </label>
            <select
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
            >
              <option value="ALL">All Accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766] mb-1">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
            />
          </div>

          <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex items-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="w-full py-1.5 px-3 rounded-lg bg-[#F2F4F1] hover:bg-[#EAEFEA] dark:bg-[#1A2820] dark:hover:bg-[#203328] text-[#43564A] dark:text-[#8EA395] font-medium text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table Card */}
      <div className="fintech-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#7E9786] flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#137C5A] border-t-transparent animate-spin" />
            <p className="text-xs font-medium">Updating ledger entries...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-[#7E9786] flex flex-col items-center justify-center">
            <Receipt className="w-10 h-10 mb-2 opacity-40 text-[#7E9786]" />
            <h4 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
              No transactions match your criteria
            </h4>
            <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 max-w-sm">
              Try adjusting your search terms or filter parameters, or record a new transaction.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E8E3] dark:border-[#203328] bg-[#F7F8F5]/60 dark:bg-[#16231C]/60 text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                  <th className="py-3 pl-5">Transaction & Payee</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E3]/60 dark:divide-[#203328]/60 text-xs">
                {transactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#F7F8F5] dark:hover:bg-[#18261F] transition-colors group"
                    >
                      <td className="py-3 pl-5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isIncome
                                ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                                : isTransfer
                                ? 'bg-[#F2F4F1] text-[#43564A] dark:bg-[#1C2C23] dark:text-[#8EA395]'
                                : 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : isTransfer ? (
                              <RefreshCw className="w-3 h-3" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate">
                              {tx.description}
                            </p>
                            <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">
                              {tx.merchant ? `${tx.merchant} • ` : ''}
                              {tx.paymentMethod}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            isIncome
                              ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                              : isTransfer
                              ? 'bg-[#F2F4F1] text-[#43564A] dark:bg-[#1C2C23] dark:text-[#8EA395]'
                              : 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                          }`}
                        >
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#F2F4F1] dark:bg-[#1C2C23] text-[#43564A] dark:text-[#8EA395] font-medium text-[11px]">
                          {tx.category?.name || (isTransfer ? 'Transfer' : 'Uncategorized')}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-[#627368] dark:text-[#8EA395] font-medium text-xs">
                        {tx.account.name}
                        {tx.toAccount && ` → ${tx.toAccount.name}`}
                      </td>

                      <td className="py-3 px-3 text-[#627368] dark:text-[#8EA395] text-xs">
                        {formatDate(tx.date, 'dd MMM yyyy')}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={`font-bold text-xs ${
                            isIncome
                              ? 'text-[#137C5A] dark:text-[#34D399]'
                              : isTransfer
                              ? 'text-[#17231D] dark:text-[#F2F6F3]'
                              : 'text-[#D94B4B] dark:text-[#F87171]'
                          }`}
                        >
                          {isIncome ? '+' : isTransfer ? '' : '-'}
                          {formatCurrency(tx.amount)}
                        </span>
                      </td>

                      <td className="py-3 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(tx)}
                            title="Edit Transaction"
                            className="p-1 rounded-lg text-[#627368] hover:text-[#17231D] hover:bg-[#EAEFEA] dark:text-[#8EA395] dark:hover:text-[#F2F6F3] dark:hover:bg-[#1A2820] transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(tx.id)}
                            title="Delete Transaction"
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

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="p-3.5 border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between text-xs text-[#627368] dark:text-[#8EA395]">
            <span>
              Showing {transactions.length} of {pagination.total} records
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-lg border border-[#E3E8E3] dark:border-[#203328] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] disabled:opacity-30"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="font-medium px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-lg border border-[#E3E8E3] dark:border-[#203328] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] disabled:opacity-30"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? The corresponding account balances will be automatically adjusted."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingId(null)}
      />

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Edit Transaction
              </h3>
              <button
                onClick={() => setEditingTransaction(null)}
                className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Amount (₹ INR)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] text-sm font-bold text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              {editingTransaction.type !== 'TRANSFER' && (
                <div>
                  <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                    Category
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                  >
                    {categories
                      .filter((c) => c.type === editingTransaction.type)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setEditingTransaction(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

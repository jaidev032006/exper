import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PiggyBank,
  Receipt,
  Target,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  TrendingUp,
  CreditCard,
  Building2,
  Sparkles,
  ChevronRight,
  Eye,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../lib/api.js';
import { DashboardSummary, Transaction } from '../types/index.js';
import { SummaryCard } from '../components/SummaryCard.js';
import { formatCurrency, formatDate, formatPercentage } from '../utils/formatters.js';

interface DashboardPageProps {
  onOpenQuickAdd: () => void;
  onNavigateTab: (tab: any) => void;
  onPayBillQuick: (bill: any) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenQuickAdd,
  onNavigateTab,
  onPayBillQuick,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cash flow chart filters
  const [chartView, setChartView] = useState<'monthly' | 'weekly'>('monthly');
  const [showIncome, setShowIncome] = useState<boolean>(true);
  const [showExpense, setShowExpense] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardSummary();
      if (res.success) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Weekly breakdown from recent transactions if weekly view is selected
  const weeklyData = useMemo(() => {
    if (!data || !data.recentTransactions.length) return [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const buckets: { [key: string]: { day: string; income: number; expense: number } } = {};

    days.forEach((d) => {
      buckets[d] = { day: d, income: 0, expense: 0 };
    });

    data.recentTransactions.forEach((tx) => {
      try {
        const d = new Date(tx.date);
        const dayName = days[d.getDay()];
        if (tx.type === 'INCOME') buckets[dayName].income += tx.amount;
        if (tx.type === 'EXPENSE') buckets[dayName].expense += tx.amount;
      } catch (e) {
        // ignore invalid date
      }
    });

    return days.map((d) => buckets[d]);
  }, [data]);

  // Dynamic, verified financial insights based strictly on actual database data
  const realFinancialInsight = useMemo(() => {
    if (!data) return null;

    if (data.expenseChange !== undefined && data.expenseChange !== 0) {
      if (data.expenseChange < 0) {
        return `Your spending is ${Math.abs(data.expenseChange).toFixed(1)}% lower than last month.`;
      } else {
        return `Your spending is ${data.expenseChange.toFixed(1)}% higher than last month.`;
      }
    }

    if (data.savingsRate > 0) {
      return `Your current savings rate is ${data.savingsRate.toFixed(1)}% of your monthly income.`;
    }

    if (data.categoryBreakdown.length > 0) {
      const top = data.categoryBreakdown[0];
      return `${top.name} represents your highest spending category (${top.percentage}%).`;
    }

    if (data.totalBalance > 0) {
      return `Total consolidated available liquidity is ${formatCurrency(data.totalBalance)}.`;
    }

    return null;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] p-8 space-y-4">
        <div className="w-10 h-10 rounded-full border-3 border-[#137C5A] border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-[#627368] dark:text-[#8EA395]">
          Loading your financial overview...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-lg mx-auto my-12 text-center bg-[#FFFFFF] dark:bg-[#131E18] rounded-2xl border border-[#E3E8E3] dark:border-[#203328] shadow-card">
        <AlertCircle className="w-10 h-10 text-[#D94B4B] mx-auto mb-3" />
        <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-2">
          Unable to Load Financial Overview
        </h3>
        <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-6">
          {error || 'An error occurred while fetching your financial records.'}
        </p>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    );
  }

  const hasTransactions = data.recentTransactions.length > 0;
  const chartData = useMemo(() => {
    if (chartView === 'monthly') {
      return (data?.monthlyTrends || []).map((t) => ({
        label: t.month,
        income: t.income,
        expense: t.expense,
        savings: t.savings,
      }));
    }
    return weeklyData.map((w) => ({
      label: w.day,
      income: w.income,
      expense: w.expense,
      savings: w.income - w.expense,
    }));
  }, [chartView, data, weeklyData]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* A. Welcome Banner & Data-Driven Financial Insight */}
      <div className="fintech-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#137C5A] dark:bg-[#34D399]" />
            <span className="text-[11px] font-semibold tracking-wider uppercase text-[#627368] dark:text-[#8EA395]">
              Personal Wealth Overview
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Your money, in perspective.
          </h2>

          {realFinancialInsight && (
            <p className="text-xs text-[#43564A] dark:text-[#A4B7AA] mt-1.5 flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#137C5A] dark:text-[#34D399] flex-shrink-0" />
              <span>{realFinancialInsight}</span>
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onNavigateTab('transactions')}
            className="px-3.5 py-2 rounded-xl border border-[#E3E8E3] dark:border-[#203328] bg-[#F7F8F5] dark:bg-[#1A2820] text-xs font-medium text-[#17231D] dark:text-[#F2F6F3] hover:border-[#137C5A] dark:hover:border-[#34D399] transition-all flex items-center gap-1.5"
          >
            <span>View Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onOpenQuickAdd}
            className="px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white text-xs font-medium shadow-sm transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Transaction</span>
          </button>
        </div>
      </div>

      {/* B. Main Financial Overview: Anchor Balance Card + 4 Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Available Balance - Primary Visual Anchor (5 cols) */}
        <div className="lg:col-span-5 fintech-card p-6 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-[#131E18]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#627368] dark:text-[#8EA395]">
                Total Available Balance
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]">
                Consolidated
              </span>
            </div>

            {/* Large Elegant Balance Figure */}
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
              {formatCurrency(data.totalBalance)}
            </div>

            <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1.5 font-medium">
              Across {data.accounts.length} active financial accounts & reserves
            </p>
          </div>

          {/* Account Breakdown mini-cards */}
          <div className="mt-6 pt-4 border-t border-[#E3E8E3] dark:border-[#203328]">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766] mb-2.5">
              Liquid Account Holdings
            </p>
            <div className="grid grid-cols-2 gap-2">
              {data.accounts.slice(0, 4).map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onNavigateTab('accounts')}
                  className="p-2.5 rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] hover:border-[#137C5A] dark:hover:border-[#34D399] transition-colors cursor-pointer"
                >
                  <p className="text-[11px] font-medium text-[#627368] dark:text-[#8EA395] truncate">
                    {acc.name}
                  </p>
                  <p className="text-xs font-bold text-[#17231D] dark:text-[#F2F6F3] mt-0.5">
                    {formatCurrency(acc.balance)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Companion Summary Metric Cards (7 cols: 2x2 grid) */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SummaryCard
            title="Total Income"
            amount={data.totalIncome}
            change={data.incomeChange}
            variant="emerald"
            icon={ArrowUpRight}
            subtitle="this month"
          />

          <SummaryCard
            title="Total Expenses"
            amount={data.totalExpense}
            change={data.expenseChange}
            variant="coral"
            icon={ArrowDownRight}
            subtitle="this month"
          />

          <SummaryCard
            title="Net Savings"
            amount={data.netSavings}
            change={data.savingsChange}
            variant={data.netSavings >= 0 ? 'emerald' : 'coral'}
            icon={TrendingUp}
            subtitle="income minus expense"
          />

          <SummaryCard
            title="Savings Rate"
            amount={data.savingsRate}
            variant="slate"
            icon={PiggyBank}
            isRate={true}
            subtitle="of monthly earnings"
            badge={data.savingsRate >= 20 ? 'Optimal (≥20%)' : 'Needs attention'}
          />
        </div>
      </div>

      {/* C & D. Interactive Cash Flow Chart & Category Spending Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Interactive Cash Flow Chart (8 cols) */}
        <div className="lg:col-span-8 fintech-card p-6 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                Cash Flow Trajectory
              </h3>
              <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                Verified income vs expense comparison
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Income/Expense series toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowIncome(!showIncome)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    showIncome
                      ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                      : 'bg-transparent text-[#7E9786] line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#137C5A] dark:bg-[#34D399]" />
                  <span>Income</span>
                </button>

                <button
                  onClick={() => setShowExpense(!showExpense)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                    showExpense
                      ? 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                      : 'bg-transparent text-[#7E9786] line-through'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#D94B4B] dark:bg-[#F87171]" />
                  <span>Expense</span>
                </button>
              </div>

              {/* View Toggle */}
              <div className="flex p-0.5 rounded-lg bg-[#F2F4F1] dark:bg-[#1A2820] border border-[#E3E8E3] dark:border-[#203328]">
                <button
                  onClick={() => setChartView('monthly')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    chartView === 'monthly'
                      ? 'bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] shadow-xs'
                      : 'text-[#627368] dark:text-[#8EA395]'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setChartView('weekly')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    chartView === 'weekly'
                      ? 'bg-white dark:bg-[#131E18] text-[#17231D] dark:text-[#F2F6F3] shadow-xs'
                      : 'text-[#627368] dark:text-[#8EA395]'
                  }`}
                >
                  Weekly
                </button>
              </div>
            </div>
          </div>

          <div className="h-68 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#137C5A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#137C5A" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D94B4B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#D94B4B" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <XAxis
                  dataKey="label"
                  stroke="#7E9786"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#E3E8E3' }}
                />
                <YAxis
                  stroke="#7E9786"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [formatCurrency(Number(value)), name]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: '1px solid #203328',
                    background: '#131E18',
                    color: '#F2F6F3',
                    fontSize: '11px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                />
                {showIncome && (
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#137C5A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#incomeGrad)"
                  />
                )}
                {showExpense && (
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#D94B4B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#expenseGrad)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* D. Spending Breakdown (4 cols) */}
        <div className="lg:col-span-4 fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                Spending by Category
              </h3>
              <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                Distribution of monthly expenses
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('transactions')}
              className="text-xs text-[#137C5A] dark:text-[#34D399] font-medium hover:underline"
            >
              Filter
            </button>
          </div>

          {data.categoryBreakdown.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-[#7E9786] text-xs">
              <Receipt className="w-8 h-8 mb-2 opacity-50" />
              <span>No expenses recorded yet in this period.</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="amount"
                    >
                      {data.categoryBreakdown.map((cat, idx) => (
                        <Cell
                          key={`cell-${idx}`}
                          fill={cat.color || '#137C5A'}
                          stroke="transparent"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any, name: any, item: any) => [
                        `${formatCurrency(Number(val))} (${item.payload.percentage}%)`,
                        item.payload.name,
                      ]}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #203328',
                        background: '#131E18',
                        color: '#F2F6F3',
                        fontSize: '11px',
                        fontWeight: '500',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Category Legend Rows with click navigation */}
              <div className="mt-3 space-y-2 max-h-36 overflow-y-auto pr-1">
                {data.categoryBreakdown.slice(0, 5).map((c, i) => (
                  <div
                    key={i}
                    onClick={() => onNavigateTab('transactions')}
                    className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="font-medium text-[#17231D] dark:text-[#F2F6F3] truncate">
                        {c.name}
                      </span>
                    </div>
                    <div className="text-right flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                        {formatCurrency(c.amount)}
                      </span>
                      <span className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                        {c.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* F & G. Financial Goals, Budgets & Real Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Budgets (1 col) */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                Monthly Budgets
              </h3>
              <p className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                Category spending thresholds
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('budgets')}
              className="text-xs text-[#137C5A] dark:text-[#34D399] font-medium hover:underline"
            >
              Manage
            </button>
          </div>

          <div className="flex-1 space-y-3.5">
            {data.budgetSummaries.length === 0 ? (
              <div className="p-6 text-center text-[#7E9786] text-xs flex flex-col items-center justify-center h-full">
                <PiggyBank className="w-8 h-8 mb-2 opacity-50" />
                <span>No budgets configured for this month.</span>
                <button
                  onClick={() => onNavigateTab('budgets')}
                  className="mt-3 px-3 py-1 rounded-lg bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] text-xs font-semibold"
                >
                  Set Budget
                </button>
              </div>
            ) : (
              data.budgetSummaries.slice(0, 3).map((b) => (
                <div key={b.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#17231D] dark:text-[#F2F6F3]">
                      {b.category}
                    </span>
                    <span
                      className={`font-semibold ${
                        b.isExceeded
                          ? 'text-[#D94B4B]'
                          : b.isWarning
                          ? 'text-[#D97706]'
                          : 'text-[#627368] dark:text-[#8EA395]'
                      }`}
                    >
                      {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                    </span>
                  </div>

                  {/* Clean linear progress bar */}
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

                  <div className="flex justify-between text-[10px] text-[#7E9786] dark:text-[#8EA395]">
                    <span>{b.percentage.toFixed(0)}% utilized</span>
                    <span>
                      {b.isExceeded
                        ? `Exceeded by ${formatCurrency(Math.abs(b.remaining))}`
                        : `${formatCurrency(b.remaining)} left`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Savings Goals (1 col) */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                Savings Goals
              </h3>
              <p className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                Target milestone funds
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('goals')}
              className="text-xs text-[#137C5A] dark:text-[#34D399] font-medium hover:underline"
            >
              View all
            </button>
          </div>

          <div className="flex-1 space-y-3.5">
            {data.savingsGoals.length === 0 ? (
              <div className="p-6 text-center text-[#7E9786] text-xs flex flex-col items-center justify-center h-full">
                <Target className="w-8 h-8 mb-2 opacity-50" />
                <span>No active savings goals.</span>
                <button
                  onClick={() => onNavigateTab('goals')}
                  className="mt-3 px-3 py-1 rounded-lg bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] text-xs font-semibold"
                >
                  Create Goal
                </button>
              </div>
            ) : (
              data.savingsGoals.slice(0, 3).map((goal) => (
                <div key={goal.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#17231D] dark:text-[#F2F6F3] truncate pr-2">
                      {goal.name}
                    </span>
                    <span className="text-[#17231D] dark:text-[#F2F6F3] font-semibold flex-shrink-0">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] dark:bg-[#1C2C23] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#137C5A] dark:bg-[#34D399] transition-all duration-300"
                      style={{ width: `${Math.min(100, goal.percentage)}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] text-[#7E9786] dark:text-[#8EA395]">
                    <span className="text-[#137C5A] dark:text-[#34D399] font-semibold">
                      {goal.percentage.toFixed(0)}% reached
                    </span>
                    <span>
                      {goal.remaining === 0
                        ? 'Completed 🎉'
                        : `${formatCurrency(goal.remaining)} remaining`}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Bills & Scheduled Plans (1 col) */}
        <div className="fintech-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                Upcoming Obligations
              </h3>
              <p className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                Bills & recurring dues
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('bills')}
              className="text-xs text-[#137C5A] dark:text-[#34D399] font-medium hover:underline"
            >
              Schedule
            </button>
          </div>

          <div className="flex-1 space-y-2.5">
            {data.upcomingBills.length === 0 ? (
              <div className="p-6 text-center text-[#7E9786] text-xs flex flex-col items-center justify-center h-full">
                <CheckCircle2 className="w-8 h-8 mb-2 text-[#137C5A] dark:text-[#34D399]" />
                <span>All scheduled bills are currently paid!</span>
              </div>
            ) : (
              data.upcomingBills.slice(0, 3).map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328]"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate">
                      {bill.name}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-[#627368] dark:text-[#8EA395] mt-0.5">
                      <span>Due {formatDate(bill.dueDate, 'dd MMM')}</span>
                      <span
                        className={`px-1 py-0.2 rounded text-[9px] font-semibold ${
                          bill.status === 'OVERDUE'
                            ? 'bg-[#FEE2E2] text-[#D94B4B]'
                            : bill.status === 'DUE_SOON'
                            ? 'bg-[#FEF3C7] text-[#D97706]'
                            : 'bg-[#DDF5E8] text-[#137C5A]'
                        }`}
                      >
                        {bill.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs font-bold text-[#17231D] dark:text-[#F2F6F3]">
                      {formatCurrency(bill.amount)}
                    </span>
                    <button
                      onClick={() => onPayBillQuick(bill)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#137C5A] hover:bg-[#0F6549] text-white shadow-xs transition-all"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* E. Recent Transactions List */}
      <div className="fintech-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
              Recent Transactions
            </h3>
            <p className="text-xs text-[#627368] dark:text-[#8EA395]">
              Real-time ledger entries from your accounts
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-medium text-[#137C5A] dark:text-[#34D399] hover:underline flex items-center gap-1"
          >
            <span>All Transactions</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {!hasTransactions ? (
          <div className="p-10 text-center text-[#7E9786] flex flex-col items-center justify-center">
            <Receipt className="w-10 h-10 mb-2 opacity-40 text-[#7E9786]" />
            <h4 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
              No transactions recorded yet
            </h4>
            <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1 max-w-sm">
              Use the Add Transaction button above to record your first income, expense, or transfer.
            </p>
            <button
              onClick={onOpenQuickAdd}
              className="mt-4 px-3.5 py-1.5 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E3E8E3] dark:border-[#203328] text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                  <th className="pb-3 pl-2">Transaction Details</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Account</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right pr-2">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E3E8E3]/60 dark:divide-[#203328]/60 text-xs">
                {data.recentTransactions.slice(0, 7).map((tx) => {
                  const isIncome = tx.type === 'INCOME';
                  const isTransfer = tx.type === 'TRANSFER';

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-[#F7F8F5] dark:hover:bg-[#18261F] transition-colors"
                    >
                      <td className="py-3 pl-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
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
                            {tx.merchant && (
                              <p className="text-[10px] text-[#627368] dark:text-[#8EA395] truncate">
                                {tx.merchant} • {tx.paymentMethod}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-[#F2F4F1] dark:bg-[#1C2C23] text-[#43564A] dark:text-[#8EA395] font-medium text-[11px]">
                          {tx.category?.name || (isTransfer ? 'Transfer' : 'Uncategorized')}
                        </span>
                      </td>

                      <td className="py-3 text-[#627368] dark:text-[#8EA395] font-medium text-xs">
                        {tx.account.name}
                        {tx.toAccount && ` → ${tx.toAccount.name}`}
                      </td>

                      <td className="py-3 text-[#627368] dark:text-[#8EA395] text-xs">
                        {formatDate(tx.date, 'dd MMM yyyy')}
                      </td>

                      <td className="py-3 pr-2 text-right">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

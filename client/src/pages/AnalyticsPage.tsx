import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Printer,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  CreditCard,
  PieChart as PieIcon,
  RefreshCw,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../lib/api.js';
import { AnalyticsData } from '../types/index.js';
import { formatCurrency, formatDate } from '../utils/formatters.js';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics({ timeframe });
      if (res.success) {
        setData(res.data);
      }
    } catch (e) {
      console.error('Failed to load analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    api.exportTransactionsCsv({});
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in print:p-0">
      {/* Top Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Analytics & Reports
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Verified financial ratios, savings trends, category distribution & tax statements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Timeframe Switcher */}
          <div className="inline-flex p-1 bg-[#F2F4F1] dark:bg-[#1A2820] rounded-xl border border-[#E3E8E3] dark:border-[#203328]">
            {(['weekly', 'monthly', 'quarterly', 'yearly'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeframe === t
                    ? 'bg-white dark:bg-[#131E18] text-[#137C5A] dark:text-[#34D399] font-semibold shadow-xs'
                    : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs hover:border-[#137C5A] shadow-xs transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV Export</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Print Statement</span>
          </button>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold text-[#17231D]">
          Exper Personal Wealth Financial Statement
        </h1>
        <p className="text-xs text-[#627368]">
          Generated on {formatDate(new Date(), 'dd MMMM yyyy, HH:mm')} • Timeframe: {timeframe}
        </p>
      </div>

      {loading ? (
        <div className="p-16 text-center text-[#7E9786] flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#137C5A] border-t-transparent animate-spin" />
          <p className="text-xs font-medium">Computing financial analytics...</p>
        </div>
      ) : !data ? (
        <div className="fintech-card p-12 text-center text-[#7E9786] text-xs">
          Unable to generate analytics for this timeframe.
        </div>
      ) : (
        <>
          {/* Key Metric Strip (4 cols) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="fintech-card p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                Total Income
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#137C5A] dark:text-[#34D399] mt-1">
                {formatCurrency(data.totalIncome)}
              </div>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
                Inflow during {timeframe} period
              </p>
            </div>

            <div className="fintech-card p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                Total Expenses
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#D94B4B] mt-1">
                {formatCurrency(data.totalExpense)}
              </div>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
                Total settled spending
              </p>
            </div>

            <div className="fintech-card p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                Net Savings
              </span>
              <div
                className={`text-xl sm:text-2xl font-bold tracking-tight mt-1 ${
                  data.netSavings >= 0 ? 'text-[#137C5A] dark:text-[#34D399]' : 'text-[#D94B4B]'
                }`}
              >
                {formatCurrency(data.netSavings)}
              </div>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
                Savings Rate: {data.savingsRate.toFixed(1)}%
              </p>
            </div>

            <div className="fintech-card p-5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                Daily Average Spend
              </span>
              <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3] mt-1">
                {formatCurrency(data.averageDailySpending)}
              </div>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-1">
                Across {data.totalTransactions} recorded txns
              </p>
            </div>
          </div>

          {/* Cash Flow Timeline Chart */}
          <div className="fintech-card p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] tracking-tight">
                  Cash Flow Trajectory Over Time
                </h3>
                <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                  {data.startDate} to {data.endDate}
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs font-medium">
                <div className="flex items-center gap-1.5 text-[#137C5A] dark:text-[#34D399]">
                  <span className="w-2 h-2 rounded-full bg-[#137C5A] dark:bg-[#34D399]" />
                  <span>Income</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#D94B4B]">
                  <span className="w-2 h-2 rounded-full bg-[#D94B4B]" />
                  <span>Expense</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.timeline} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="analyticsIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#137C5A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#137C5A" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="analyticsExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D94B4B" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#D94B4B" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#7E9786" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="#7E9786"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                  />
                  <Tooltip
                    formatter={(val: any, name: any) => [formatCurrency(Number(val)), name]}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #203328',
                      background: '#131E18',
                      color: '#F2F6F3',
                      fontSize: '11px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke="#137C5A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expense"
                    stroke="#D94B4B"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#analyticsExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution Rows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Top Spending Categories */}
            <div className="fintech-card p-6">
              <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-1">
                Highest Expense Categories
              </h3>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-5">
                Breakdown of where capital was deployed
              </p>

              <div className="space-y-4">
                {data.topCategories.length === 0 ? (
                  <p className="text-xs text-[#7E9786]">No expenses in this period.</p>
                ) : (
                  data.topCategories.map((c, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-[#17231D] dark:text-[#F2F6F3]">
                          {c.name}
                        </span>
                        <span className="font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                          {formatCurrency(c.amount)} ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#EAEFEA] dark:bg-[#1C2C23] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${c.percentage}%`,
                            backgroundColor: c.color || '#137C5A',
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Complete Breakdown Table */}
            <div className="fintech-card p-6">
              <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-1">
                All Categorized Outflows
              </h3>
              <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-4">
                Transaction count and allocation percentage
              </p>

              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E3E8E3] dark:border-[#203328] text-[10px] font-semibold uppercase text-[#7E9786] dark:text-[#5E7766]">
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">Transactions</th>
                      <th className="pb-2 text-right">Total Spent</th>
                      <th className="pb-2 text-right">Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E8E3]/60 dark:divide-[#203328]/60">
                    {data.categoryBreakdown.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F8F5] dark:hover:bg-[#18261F]">
                        <td className="py-2.5 flex items-center gap-2">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color || '#137C5A' }}
                          />
                          <span className="font-medium text-[#17231D] dark:text-[#F2F6F3]">
                            {cat.name}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-[#627368] dark:text-[#8EA395]">
                          {cat.count}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                          {formatCurrency(cat.amount)}
                        </td>
                        <td className="py-2.5 text-right font-medium text-[#137C5A] dark:text-[#34D399]">
                          {cat.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

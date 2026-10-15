import { Router, Request, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { roundCurrency, calculateSavingsRate, calculatePercentageChange } from '../utils/math.js';

const router = Router();

router.get('/summary', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    // Define current period (default to current calendar month in Asia/Kolkata)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const periodStart = startDate ? new Date(startDate as string) : new Date(currentYear, currentMonth, 1);
    const periodEnd = endDate ? new Date(endDate as string) : new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // Calculate previous period for comparison (same duration immediately preceding)
    const periodDuration = periodEnd.getTime() - periodStart.getTime();
    const prevPeriodEnd = new Date(periodStart.getTime() - 1);
    const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDuration);

    // 1. Total available balance across all non-archived accounts
    const accounts = await prisma.account.findMany({
      where: { userId, isArchived: false },
    });
    const totalBalance = roundCurrency(accounts.reduce((sum, acc) => sum + Number(acc.balance), 0));

    // 2. Current period transactions (posted only, exclude transfers from income/expense sums)
    const currentTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'POSTED',
        date: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        category: true,
        account: true,
      },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryExpenseMap: { [catId: string]: { name: string; color: string; amount: number } } = {};

    for (const t of currentTransactions) {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += amt;
      } else if (t.type === 'EXPENSE') {
        totalExpense += amt;
        const catName = t.category?.name || 'Uncategorized';
        const catColor = t.category?.color || '#64748b';
        const catKey = t.categoryId || 'other';

        if (!categoryExpenseMap[catKey]) {
          categoryExpenseMap[catKey] = { name: catName, color: catColor, amount: 0 };
        }
        categoryExpenseMap[catKey].amount += amt;
      }
    }

    totalIncome = roundCurrency(totalIncome);
    totalExpense = roundCurrency(totalExpense);
    const netSavings = roundCurrency(totalIncome - totalExpense);
    const savingsRate = calculateSavingsRate(totalIncome, netSavings);

    // 3. Previous period transactions for comparative metrics
    const prevTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'POSTED',
        date: {
          gte: prevPeriodStart,
          lte: prevPeriodEnd,
        },
      },
    });

    let prevIncome = 0;
    let prevExpense = 0;
    for (const t of prevTransactions) {
      const amt = Number(t.amount);
      if (t.type === 'INCOME') prevIncome += amt;
      else if (t.type === 'EXPENSE') prevExpense += amt;
    }
    prevIncome = roundCurrency(prevIncome);
    prevExpense = roundCurrency(prevExpense);
    const prevSavings = roundCurrency(prevIncome - prevExpense);

    const incomeChange = calculatePercentageChange(totalIncome, prevIncome);
    const expenseChange = calculatePercentageChange(totalExpense, prevExpense);
    const savingsChange = calculatePercentageChange(netSavings, prevSavings);

    // 4. Category breakdown for Donut Chart
    const categoryBreakdown = Object.values(categoryExpenseMap)
      .map((cat) => ({
        name: cat.name,
        color: cat.color,
        amount: roundCurrency(cat.amount),
        percentage: totalExpense > 0 ? roundCurrency((cat.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // 5. Recent 6 Transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: 6,
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    // 6. Active Budgets Utilization
    const currentPeriodMonthStr = `${periodStart.getFullYear()}-${String(periodStart.getMonth() + 1).padStart(2, '0')}`;
    const budgets = await prisma.budget.findMany({
      where: {
        userId,
        period: currentPeriodMonthStr,
      },
      include: {
        category: true,
      },
    });

    const budgetSummaries = budgets.map((b) => {
      const limit = Number(b.amount);
      const spent = categoryExpenseMap[b.categoryId]?.amount || 0;
      const spentRounded = roundCurrency(spent);
      const remaining = roundCurrency(limit - spentRounded);
      const percentage = roundCurrency((spentRounded / limit) * 100);
      return {
        id: b.id,
        category: b.category.name,
        color: b.category.color,
        limit,
        spent: spentRounded,
        remaining,
        percentage,
        isExceeded: spentRounded > limit,
        isWarning: percentage >= 80 && percentage <= 100,
      };
    });

    // 7. Upcoming and Due Soon Bills (status not PAID or CANCELLED)
    const upcomingBills = await prisma.bill.findMany({
      where: {
        userId,
        status: { in: ['UPCOMING', 'DUE_SOON', 'OVERDUE'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
      include: {
        category: true,
      },
    });

    // 8. Savings Goals progress
    const savingsGoals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    });

    const goalsWithProgress = savingsGoals.map((g) => {
      const target = Number(g.targetAmount);
      const current = Number(g.currentAmount);
      return {
        ...g,
        targetAmount: roundCurrency(target),
        currentAmount: roundCurrency(current),
        percentage: target > 0 ? roundCurrency((current / target) * 100) : 0,
        remaining: roundCurrency(Math.max(0, target - current)),
      };
    });

    // 9. Monthly Income vs Expense Trend (Last 6 Months)
    const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1);
    const trendTransactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'POSTED',
        type: { in: ['INCOME', 'EXPENSE'] },
        date: { gte: sixMonthsAgo },
      },
      select: {
        type: true,
        amount: true,
        date: true,
      },
    });

    const monthsMap: { [key: string]: { month: string; income: number; expense: number; savings: number } } = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short' });
      monthsMap[key] = { month: label, income: 0, expense: 0, savings: 0 };
    }

    trendTransactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthsMap[key]) {
        const amt = Number(t.amount);
        if (t.type === 'INCOME') monthsMap[key].income += amt;
        if (t.type === 'EXPENSE') monthsMap[key].expense += amt;
      }
    });

    const monthlyTrends = Object.values(monthsMap).map((m) => ({
      ...m,
      income: roundCurrency(m.income),
      expense: roundCurrency(m.expense),
      savings: roundCurrency(m.income - m.expense),
    }));

    res.json({
      success: true,
      data: {
        totalBalance,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        incomeChange,
        expenseChange,
        savingsChange,
        categoryBreakdown,
        budgetSummaries,
        upcomingBills,
        savingsGoals: goalsWithProgress,
        monthlyTrends,
        recentTransactions,
        accounts,
      },
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard summary' });
  }
});

export default router;

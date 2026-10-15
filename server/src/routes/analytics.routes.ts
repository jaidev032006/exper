import { Router, Request, Response } from 'express';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { roundCurrency, calculateSavingsRate } from '../utils/math.js';

const router = Router();

router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { timeframe = 'monthly', year = new Date().getFullYear().toString() } = req.query;

    const parsedYear = parseInt(year as string, 10) || new Date().getFullYear();
    const now = new Date();

    let startDate: Date;
    let endDate: Date;

    if (timeframe === 'weekly') {
      // Last 7 days
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
    } else if (timeframe === 'monthly') {
      // Current month
      startDate = new Date(parsedYear, now.getMonth(), 1);
      endDate = new Date(parsedYear, now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (timeframe === 'quarterly') {
      // Current quarter (3 months)
      const currentQuarter = Math.floor(now.getMonth() / 3);
      startDate = new Date(parsedYear, currentQuarter * 3, 1);
      endDate = new Date(parsedYear, (currentQuarter + 1) * 3, 0, 23, 59, 59, 999);
    } else if (timeframe === 'yearly') {
      startDate = new Date(parsedYear, 0, 1);
      endDate = new Date(parsedYear, 11, 31, 23, 59, 59, 999);
    } else {
      // Default last 30 days
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
    }

    // Fetch posted transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        status: 'POSTED',
        date: { gte: startDate, lte: endDate },
      },
      include: {
        category: true,
        account: true,
      },
      orderBy: { date: 'asc' },
    });

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: { [key: string]: { name: string; color: string; amount: number; count: number } } = {};
    const timelineMap: { [dateStr: string]: { date: string; income: number; expense: number } } = {};

    for (const t of transactions) {
      const dateKey = new Date(t.date).toISOString().split('T')[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, income: 0, expense: 0 };
      }

      const amt = Number(t.amount);
      if (t.type === 'INCOME') {
        totalIncome += amt;
        timelineMap[dateKey].income += amt;
      } else if (t.type === 'EXPENSE') {
        totalExpense += amt;
        timelineMap[dateKey].expense += amt;

        const catName = t.category?.name || 'Uncategorized';
        const catColor = t.category?.color || '#64748b';
        const catId = t.categoryId || 'unknown';

        if (!categoryTotals[catId]) {
          categoryTotals[catId] = { name: catName, color: catColor, amount: 0, count: 0 };
        }
        categoryTotals[catId].amount += amt;
        categoryTotals[catId].count += 1;
      }
    }

    totalIncome = roundCurrency(totalIncome);
    totalExpense = roundCurrency(totalExpense);
    const netSavings = roundCurrency(totalIncome - totalExpense);
    const savingsRate = calculateSavingsRate(totalIncome, netSavings);

    // Calculate days in period
    const diffDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const averageDailySpending = roundCurrency(totalExpense / diffDays);

    // Sorted categories
    const categoryBreakdown = Object.values(categoryTotals)
      .map((c) => ({
        name: c.name,
        color: c.color,
        amount: roundCurrency(c.amount),
        count: c.count,
        percentage: totalExpense > 0 ? roundCurrency((c.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategories = categoryBreakdown.slice(0, 5);

    // Timeline series
    const timeline = Object.values(timelineMap).map((d) => ({
      date: d.date,
      income: roundCurrency(d.income),
      expense: roundCurrency(d.expense),
      savings: roundCurrency(d.income - d.expense),
    }));

    res.json({
      success: true,
      data: {
        timeframe,
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        netSavings,
        savingsRate,
        averageDailySpending,
        totalTransactions: transactions.length,
        categoryBreakdown,
        topCategories,
        timeline,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate analytics' });
  }
});

export default router;

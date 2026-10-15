import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { roundCurrency } from '../utils/math.js';

const router = Router();

const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  amount: z.number().positive('Budget amount must be greater than zero'),
  period: z.string().default(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }),
});

// List budgets with spent vs limit calculations
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { period } = req.query;

    const currentPeriod = (period as string) || (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    })();

    // Parse period to date range
    const [yearStr, monthStr] = currentPeriod.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // Also calculate previous month for comparison
    const prevMonthStartDate = new Date(year, month - 1, 1);
    const prevMonthEndDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await prisma.budget.findMany({
      where: { userId, period: currentPeriod },
      include: { category: true },
    });

    // Fetch posted expenses for this period
    const expenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        status: 'POSTED',
        date: { gte: startDate, lte: endDate },
      },
    });

    // Fetch posted expenses for previous period for comparison
    const prevExpenses = await prisma.transaction.findMany({
      where: {
        userId,
        type: 'EXPENSE',
        status: 'POSTED',
        date: { gte: prevMonthStartDate, lte: prevMonthEndDate },
      },
    });

    const categorySpentMap: { [catId: string]: number } = {};
    for (const exp of expenses) {
      if (exp.categoryId) {
        categorySpentMap[exp.categoryId] = (categorySpentMap[exp.categoryId] || 0) + Number(exp.amount);
      }
    }

    const prevCategorySpentMap: { [catId: string]: number } = {};
    for (const exp of prevExpenses) {
      if (exp.categoryId) {
        prevCategorySpentMap[exp.categoryId] = (prevCategorySpentMap[exp.categoryId] || 0) + Number(exp.amount);
      }
    }

    let totalBudget = 0;
    let totalSpent = 0;

    const data = budgets.map((b) => {
      const limit = Number(b.amount);
      const spent = roundCurrency(categorySpentMap[b.categoryId] || 0);
      const prevSpent = roundCurrency(prevCategorySpentMap[b.categoryId] || 0);
      const remaining = roundCurrency(limit - spent);
      const percentage = roundCurrency((spent / limit) * 100);
      totalBudget += limit;
      totalSpent += spent;

      return {
        id: b.id,
        categoryId: b.categoryId,
        category: b.category,
        period: b.period,
        limit,
        spent,
        prevSpent,
        remaining,
        percentage,
        isWarning: percentage >= 80 && percentage <= 100,
        isExceeded: spent > limit,
      };
    });

    totalBudget = roundCurrency(totalBudget);
    totalSpent = roundCurrency(totalSpent);

    res.json({
      success: true,
      data,
      summary: {
        totalBudget,
        totalSpent,
        totalRemaining: roundCurrency(totalBudget - totalSpent),
        overallPercentage: totalBudget > 0 ? roundCurrency((totalSpent / totalBudget) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('Budgets error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch budgets' });
  }
});

// Create or update budget
router.post('/', requireAuth, validateBody(budgetSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { categoryId, amount, period } = req.body;

    const roundedAmount = roundCurrency(amount);

    const budget = await prisma.budget.upsert({
      where: {
        userId_categoryId_period: {
          userId,
          categoryId,
          period,
        },
      },
      update: {
        amount: roundedAmount,
      },
      create: {
        userId,
        categoryId,
        amount: roundedAmount,
        period,
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({ success: true, message: 'Budget saved successfully', data: budget });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save budget' });
  }
});

// Delete budget
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.budget.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Budget not found' });
      return;
    }

    await prisma.budget.delete({ where: { id } });
    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete budget' });
  }
});

export default router;

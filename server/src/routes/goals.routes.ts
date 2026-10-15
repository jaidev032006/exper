import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { roundCurrency } from '../utils/math.js';

const router = Router();

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  targetAmount: z.number().positive('Target amount must be greater than zero'),
  currentAmount: z.number().min(0).default(0.0),
  targetDate: z.string().or(z.date()).optional().nullable(),
  color: z.string().default('#2563eb'),
  icon: z.string().default('target'),
  notes: z.string().optional().nullable(),
});

const contributeSchema = z.object({
  amount: z.number().positive('Contribution amount must be greater than zero'),
  fromAccountId: z.string().optional().nullable(),
});

// List all savings goals for user
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const goals = await prisma.savingsGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const goalsWithProgress = goals.map((g) => {
      const target = roundCurrency(g.targetAmount);
      const current = roundCurrency(g.currentAmount);
      const percentage = target > 0 ? roundCurrency((current / target) * 100) : 0;
      const remaining = roundCurrency(Math.max(0, target - current));

      let daysLeft: number | null = null;
      if (g.targetDate) {
        const diff = new Date(g.targetDate).getTime() - Date.now();
        daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      }

      return {
        ...g,
        targetAmount: target,
        currentAmount: current,
        percentage,
        remaining,
        daysLeft,
        isCompleted: current >= target,
      };
    });

    const totalTarget = roundCurrency(goals.reduce((sum, g) => sum + g.targetAmount, 0));
    const totalSaved = roundCurrency(goals.reduce((sum, g) => sum + g.currentAmount, 0));

    res.json({
      success: true,
      data: goalsWithProgress,
      summary: {
        totalTarget,
        totalSaved,
        totalRemaining: roundCurrency(Math.max(0, totalTarget - totalSaved)),
        overallPercentage: totalTarget > 0 ? roundCurrency((totalSaved / totalTarget) * 100) : 0,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch savings goals' });
  }
});

// Create savings goal
router.post('/', requireAuth, validateBody(goalSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, targetAmount, currentAmount, targetDate, color, icon, notes } = req.body;

    const goal = await prisma.savingsGoal.create({
      data: {
        userId,
        name,
        targetAmount: roundCurrency(targetAmount),
        currentAmount: roundCurrency(currentAmount || 0),
        targetDate: targetDate ? new Date(targetDate) : null,
        color: color || '#2563eb',
        icon: icon || 'target',
        notes,
      },
    });

    res.status(201).json({ success: true, message: 'Savings goal created successfully', data: goal });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create savings goal' });
  }
});

// Contribute to savings goal
router.post('/:id/contribute', requireAuth, validateBody(contributeSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const { amount, fromAccountId } = req.body;

    const goal = await prisma.savingsGoal.findFirst({
      where: { id, userId },
    });

    if (!goal) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    const contribution = roundCurrency(amount);

    const result = await prisma.$transaction(async (tx) => {
      // If deducted from a real account
      if (fromAccountId) {
        const account = await tx.account.findFirst({
          where: { id: fromAccountId, userId },
        });

        if (!account) {
          throw new Error('Contribution source account not found');
        }

        // Decrement source account
        await tx.account.update({
          where: { id: fromAccountId },
          data: { balance: { decrement: contribution } },
        });

        // Record a transfer/contribution transaction
        await tx.transaction.create({
          data: {
            userId,
            accountId: fromAccountId,
            type: 'EXPENSE',
            amount: contribution,
            date: new Date(),
            description: `Savings Goal Contribution: ${goal.name}`,
            paymentMethod: 'TRANSFER',
            notes: `Contributed to goal: ${goal.name}`,
            status: 'POSTED',
          },
        });
      }

      // Increment savings goal
      return tx.savingsGoal.update({
        where: { id },
        data: { currentAmount: { increment: contribution } },
      });
    });

    res.json({
      success: true,
      message: `Contributed ₹${contribution} to "${goal.name}".`,
      data: result,
    });
  } catch (error: any) {
    console.error('Contribute error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to contribute to savings goal' });
  }
});

// Update savings goal
router.put('/:id', requireAuth, validateBody(goalSchema.partial()), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    const updated = await prisma.savingsGoal.update({
      where: { id },
      data: {
        ...req.body,
        targetAmount: req.body.targetAmount ? roundCurrency(req.body.targetAmount) : existing.targetAmount,
        currentAmount: req.body.currentAmount !== undefined ? roundCurrency(req.body.currentAmount) : existing.currentAmount,
        targetDate: req.body.targetDate !== undefined ? (req.body.targetDate ? new Date(req.body.targetDate) : null) : existing.targetDate,
      },
    });

    res.json({ success: true, message: 'Savings goal updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update savings goal' });
  }
});

// Delete savings goal
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.savingsGoal.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Savings goal not found' });
      return;
    }

    await prisma.savingsGoal.delete({ where: { id } });
    res.json({ success: true, message: 'Savings goal deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete savings goal' });
  }
});

export default router;

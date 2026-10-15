import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { roundCurrency } from '../utils/math.js';

const router = Router();

const createAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['BANK', 'CASH', 'UPI', 'CREDIT_CARD', 'SAVINGS', 'WALLET']),
  balance: z.number().default(0.0),
  accountNumber: z.string().optional().nullable(),
  color: z.string().default('#2563eb'),
  isDefault: z.boolean().default(false),
});

const updateAccountSchema = createAccountSchema.partial();

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Transfer amount must be greater than zero'),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
  description: z.string().default('Internal Account Transfer'),
  notes: z.string().optional().nullable(),
});

// List all accounts for user
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const accounts = await prisma.account.findMany({
      where: { userId, isArchived: false },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });

    const totalBalance = roundCurrency(accounts.reduce((sum, a) => sum + Number(a.balance), 0));

    res.json({
      success: true,
      data: accounts.map((a) => ({ ...a, balance: roundCurrency(a.balance) })),
      totalBalance,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch accounts' });
  }
});

// Create account
router.post('/', requireAuth, validateBody(createAccountSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, type, balance, accountNumber, color, isDefault } = req.body;

    if (isDefault) {
      await prisma.account.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const account = await prisma.account.create({
      data: {
        userId,
        name,
        type,
        balance: roundCurrency(balance || 0),
        accountNumber,
        color: color || '#2563eb',
        isDefault: !!isDefault,
      },
    });

    res.status(201).json({ success: true, message: 'Account created successfully', data: account });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create account' });
  }
});

// Internal Transfer between accounts
router.post('/transfer', requireAuth, validateBody(transferSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { fromAccountId, toAccountId, amount, date, description, notes } = req.body;

    if (fromAccountId === toAccountId) {
      res.status(400).json({ success: false, message: 'Source and destination accounts must be different' });
      return;
    }

    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findFirst({ where: { id: fromAccountId, userId } }),
      prisma.account.findFirst({ where: { id: toAccountId, userId } }),
    ]);

    if (!fromAccount || !toAccount) {
      res.status(400).json({ success: false, message: 'One or both accounts were not found' });
      return;
    }

    const roundedAmount = roundCurrency(amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Decrement source account
      await tx.account.update({
        where: { id: fromAccountId },
        data: { balance: { decrement: roundedAmount } },
      });

      // 2. Increment destination account
      await tx.account.update({
        where: { id: toAccountId },
        data: { balance: { increment: roundedAmount } },
      });

      // 3. Record transfer transaction
      return tx.transaction.create({
        data: {
          userId,
          accountId: fromAccountId,
          toAccountId,
          type: 'TRANSFER',
          amount: roundedAmount,
          date: new Date(date),
          description: description || `Transfer from ${fromAccount.name} to ${toAccount.name}`,
          notes,
          paymentMethod: 'TRANSFER',
          status: 'POSTED',
        },
        include: {
          account: true,
          toAccount: true,
        },
      });
    });

    res.json({ success: true, message: 'Transfer completed successfully', data: result });
  } catch (error: any) {
    console.error('Transfer error:', error);
    res.status(500).json({ success: false, message: 'Failed to process transfer' });
  }
});

// Update account
router.put('/:id', requireAuth, validateBody(updateAccountSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Account not found' });
      return;
    }

    if (req.body.isDefault) {
      await prisma.account.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        ...req.body,
        balance: req.body.balance !== undefined ? roundCurrency(req.body.balance) : existing.balance,
      },
    });

    res.json({ success: true, message: 'Account updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update account' });
  }
});

// Delete account (or archive if it has linked transactions)
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.account.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Account not found' });
      return;
    }

    const txCount = await prisma.transaction.count({
      where: { OR: [{ accountId: id }, { toAccountId: id }] },
    });

    if (txCount > 0) {
      // Archive to preserve transaction history
      await prisma.account.update({
        where: { id },
        data: { isArchived: true },
      });
      res.json({ success: true, message: 'Account has associated transactions and was safely archived.' });
    } else {
      await prisma.account.delete({ where: { id } });
      res.json({ success: true, message: 'Account deleted successfully' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

export default router;

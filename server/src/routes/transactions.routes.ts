import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { roundCurrency } from '../utils/math.js';

const router = Router();

const createTransactionSchema = z.object({
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  amount: z.number().positive('Amount must be greater than zero'),
  date: z.string().or(z.date()),
  description: z.string().min(1, 'Description is required'),
  merchant: z.string().optional().nullable(),
  paymentMethod: z.string().default('UPI'),
  notes: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
  status: z.enum(['POSTED', 'PENDING']).default('POSTED'),
});

const updateTransactionSchema = createTransactionSchema.partial();

// List transactions with filtering, search, sorting and pagination
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      type,
      categoryId,
      accountId,
      startDate,
      endDate,
      search,
      sortBy = 'date',
      sortOrder = 'desc',
      page = '1',
      limit = '20',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where: any = { userId };

    if (type && type !== 'ALL') {
      where.type = type;
    }

    if (categoryId && categoryId !== 'ALL') {
      where.categoryId = categoryId;
    }

    if (accountId && accountId !== 'ALL') {
      where.OR = [{ accountId }, { toAccountId: accountId }];
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    if (search) {
      const q = String(search).trim();
      where.AND = [
        {
          OR: [
            { description: { contains: q } },
            { merchant: { contains: q } },
            { notes: { contains: q } },
          ],
        },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { [sortBy as string]: sortOrder === 'asc' ? 'asc' : 'desc' },
        skip,
        take,
        include: {
          category: true,
          account: true,
          toAccount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error: any) {
    console.error('List transactions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
});

// Export filtered transactions to CSV
router.get('/export/csv', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type, categoryId, accountId, startDate, endDate, search } = req.query;

    const where: any = { userId };
    if (type && type !== 'ALL') where.type = type;
    if (categoryId && categoryId !== 'ALL') where.categoryId = categoryId;
    if (accountId && accountId !== 'ALL') where.OR = [{ accountId }, { toAccountId: accountId }];
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }
    if (search) {
      const q = String(search).trim();
      where.AND = [
        {
          OR: [
            { description: { contains: q } },
            { merchant: { contains: q } },
          ],
        },
      ];
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    const headers = ['Transaction ID', 'Date', 'Type', 'Category', 'Description', 'Merchant', 'Payment Method', 'Account', 'To Account', 'Amount (INR)', 'Status'];
    const rows = transactions.map((t) => [
      t.id,
      new Date(t.date).toISOString().split('T')[0],
      t.type,
      t.category?.name || 'Uncategorized',
      `"${(t.description || '').replace(/"/g, '""')}"`,
      `"${(t.merchant || '').replace(/"/g, '""')}"`,
      t.paymentMethod,
      `"${t.account.name}"`,
      t.toAccount ? `"${t.toAccount.name}"` : '',
      t.amount.toFixed(2),
      t.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="exper-transactions.csv"');
    res.send(csvContent);
  } catch (error: any) {
    console.error('CSV export error:', error);
    res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
});

// Get single transaction
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        category: true,
        account: true,
        toAccount: true,
      },
    });

    if (!transaction) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    res.json({ success: true, data: transaction });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch transaction' });
  }
});

// Create Transaction with Atomic Account Balance Update
router.post('/', requireAuth, validateBody(createTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const {
      accountId,
      toAccountId,
      categoryId,
      type,
      amount,
      date,
      description,
      merchant,
      paymentMethod,
      notes,
      receiptUrl,
      status,
    } = req.body;

    const roundedAmount = roundCurrency(amount);

    // Verify account ownership
    const sourceAccount = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!sourceAccount) {
      res.status(400).json({ success: false, message: 'Source account not found' });
      return;
    }

    if (type === 'TRANSFER') {
      if (!toAccountId || toAccountId === accountId) {
        res.status(400).json({ success: false, message: 'Destination account must be different from source account' });
        return;
      }
      const destAccount = await prisma.account.findFirst({
        where: { id: toAccountId, userId },
      });
      if (!destAccount) {
        res.status(400).json({ success: false, message: 'Destination account not found' });
        return;
      }
    }

    // Atomic transaction
    const created = await prisma.$transaction(async (tx) => {
      // Create transaction record
      const newTx = await tx.transaction.create({
        data: {
          userId,
          accountId,
          toAccountId: type === 'TRANSFER' ? toAccountId : null,
          categoryId: type !== 'TRANSFER' ? categoryId : null,
          type,
          amount: roundedAmount,
          date: new Date(date),
          description,
          merchant,
          paymentMethod,
          notes,
          receiptUrl,
          status,
        },
        include: {
          category: true,
          account: true,
          toAccount: true,
        },
      });

      // Update account balances if status is POSTED
      if (status === 'POSTED') {
        if (type === 'INCOME') {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { increment: roundedAmount } },
          });
        } else if (type === 'EXPENSE') {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: roundedAmount } },
          });
        } else if (type === 'TRANSFER' && toAccountId) {
          await tx.account.update({
            where: { id: accountId },
            data: { balance: { decrement: roundedAmount } },
          });
          await tx.account.update({
            where: { id: toAccountId },
            data: { balance: { increment: roundedAmount } },
          });
        }
      }

      return newTx;
    });

    res.status(201).json({ success: true, message: 'Transaction created successfully', data: created });
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to create transaction' });
  }
});

// Update Transaction with Reverted/Reapplied Balances
router.put('/:id', requireAuth, validateBody(updateTransactionSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTx) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Revert existing balance impact if it was POSTED
      if (existingTx.status === 'POSTED') {
        if (existingTx.type === 'INCOME') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { decrement: existingTx.amount } },
          });
        } else if (existingTx.type === 'EXPENSE') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
        } else if (existingTx.type === 'TRANSFER' && existingTx.toAccountId) {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
          await tx.account.update({
            where: { id: existingTx.toAccountId },
            data: { balance: { decrement: existingTx.amount } },
          });
        }
      }

      // 2. Prepare new fields
      const newType = req.body.type || existingTx.type;
      const newAmount = req.body.amount ? roundCurrency(req.body.amount) : existingTx.amount;
      const newAccountId = req.body.accountId || existingTx.accountId;
      const newToAccountId = newType === 'TRANSFER' ? (req.body.toAccountId || existingTx.toAccountId) : null;
      const newStatus = req.body.status || existingTx.status;

      // 3. Apply new balance impact if newStatus is POSTED
      if (newStatus === 'POSTED') {
        if (newType === 'INCOME') {
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { increment: newAmount } },
          });
        } else if (newType === 'EXPENSE') {
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { decrement: newAmount } },
          });
        } else if (newType === 'TRANSFER' && newToAccountId) {
          await tx.account.update({
            where: { id: newAccountId },
            data: { balance: { decrement: newAmount } },
          });
          await tx.account.update({
            where: { id: newToAccountId },
            data: { balance: { increment: newAmount } },
          });
        }
      }

      // 4. Update transaction
      return tx.transaction.update({
        where: { id },
        data: {
          accountId: newAccountId,
          toAccountId: newToAccountId,
          categoryId: newType !== 'TRANSFER' ? (req.body.categoryId !== undefined ? req.body.categoryId : existingTx.categoryId) : null,
          type: newType,
          amount: newAmount,
          date: req.body.date ? new Date(req.body.date) : existingTx.date,
          description: req.body.description || existingTx.description,
          merchant: req.body.merchant !== undefined ? req.body.merchant : existingTx.merchant,
          paymentMethod: req.body.paymentMethod || existingTx.paymentMethod,
          notes: req.body.notes !== undefined ? req.body.notes : existingTx.notes,
          receiptUrl: req.body.receiptUrl !== undefined ? req.body.receiptUrl : existingTx.receiptUrl,
          status: newStatus,
        },
        include: {
          category: true,
          account: true,
          toAccount: true,
        },
      });
    });

    res.json({ success: true, message: 'Transaction updated successfully', data: updated });
  } catch (error: any) {
    console.error('Update transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to update transaction' });
  }
});

// Delete Transaction
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existingTx = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existingTx) {
      res.status(404).json({ success: false, message: 'Transaction not found' });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Revert account balances if POSTED
      if (existingTx.status === 'POSTED') {
        if (existingTx.type === 'INCOME') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { decrement: existingTx.amount } },
          });
        } else if (existingTx.type === 'EXPENSE') {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
        } else if (existingTx.type === 'TRANSFER' && existingTx.toAccountId) {
          await tx.account.update({
            where: { id: existingTx.accountId },
            data: { balance: { increment: existingTx.amount } },
          });
          await tx.account.update({
            where: { id: existingTx.toAccountId },
            data: { balance: { decrement: existingTx.amount } },
          });
        }
      }

      // If linked to a bill, detach or reset bill status
      await tx.bill.updateMany({
        where: { paidTransactionId: id },
        data: { paidTransactionId: null, status: 'UPCOMING', paidAt: null },
      });

      await tx.transaction.delete({
        where: { id },
      });
    });

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete transaction' });
  }
});

export default router;

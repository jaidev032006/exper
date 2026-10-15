import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { roundCurrency } from '../utils/math.js';

const router = Router();

const billSchema = z.object({
  name: z.string().min(1, 'Bill name is required'),
  amount: z.number().positive('Amount must be greater than zero'),
  dueDate: z.string().or(z.date()),
  categoryId: z.string().optional().nullable(),
  recurrence: z.enum(['ONCE', 'MONTHLY', 'QUARTERLY', 'YEARLY']).default('MONTHLY'),
  notes: z.string().optional().nullable(),
});

const payBillSchema = z.object({
  accountId: z.string().min(1, 'Payment account is required'),
  paymentMethod: z.string().default('UPI'),
  date: z.string().or(z.date()).default(() => new Date().toISOString()),
});

// Helper to calculate dynamic status based on due date
function computeBillStatus(dueDate: Date, existingStatus: string): string {
  if (existingStatus === 'PAID' || existingStatus === 'CANCELLED') return existingStatus;
  const now = new Date();
  const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'OVERDUE';
  if (diffDays <= 3) return 'DUE_SOON';
  return 'UPCOMING';
}

// List all bills for user
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const bills = await prisma.bill.findMany({
      where: { userId },
      orderBy: { dueDate: 'asc' },
      include: { category: true },
    });

    const updatedBills = bills.map((b) => {
      const computedStatus = computeBillStatus(new Date(b.dueDate), b.status);
      return {
        ...b,
        amount: roundCurrency(b.amount),
        status: computedStatus,
      };
    });

    res.json({ success: true, data: updatedBills });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch bills' });
  }
});

// Create bill
router.post('/', requireAuth, validateBody(billSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, amount, dueDate, categoryId, recurrence, notes } = req.body;

    const parsedDate = new Date(dueDate);
    const status = computeBillStatus(parsedDate, 'UPCOMING');

    const bill = await prisma.bill.create({
      data: {
        userId,
        name,
        amount: roundCurrency(amount),
        dueDate: parsedDate,
        categoryId,
        recurrence,
        status,
        notes,
      },
      include: { category: true },
    });

    res.status(201).json({ success: true, message: 'Bill added successfully', data: bill });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create bill' });
  }
});

// Pay bill (Idempotent - posts expense transaction and marks bill paid)
router.post('/:id/pay', requireAuth, validateBody(payBillSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;
    const { accountId, paymentMethod, date } = req.body;

    const bill = await prisma.bill.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!bill) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    if (bill.status === 'PAID') {
      res.status(400).json({ success: false, message: 'This bill has already been paid and posted.' });
      return;
    }

    const account = await prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      res.status(400).json({ success: false, message: 'Payment account not found' });
      return;
    }

    const roundedAmount = roundCurrency(bill.amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the posted expense transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          accountId,
          categoryId: bill.categoryId,
          type: 'EXPENSE',
          amount: roundedAmount,
          date: new Date(date),
          description: `Bill Payment: ${bill.name}`,
          merchant: bill.name,
          paymentMethod: paymentMethod || 'UPI',
          notes: bill.notes,
          status: 'POSTED',
        },
      });

      // 2. Decrement the payment account balance
      await tx.account.update({
        where: { id: accountId },
        data: { balance: { decrement: roundedAmount } },
      });

      // 3. Mark bill as PAID and link to the created transaction
      const updatedBill = await tx.bill.update({
        where: { id },
        data: {
          status: 'PAID',
          paidTransactionId: transaction.id,
          paidAt: new Date(date),
        },
        include: { category: true },
      });

      return { bill: updatedBill, transaction };
    });

    res.json({
      success: true,
      message: `Bill "${bill.name}" marked as paid. Expense of ₹${roundedAmount} posted to ${account.name}.`,
      data: result,
    });
  } catch (error: any) {
    console.error('Pay bill error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bill payment' });
  }
});

// Update bill
router.put('/:id', requireAuth, validateBody(billSchema.partial()), async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.bill.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        ...req.body,
        amount: req.body.amount ? roundCurrency(req.body.amount) : existing.amount,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : existing.dueDate,
      },
      include: { category: true },
    });

    res.json({ success: true, message: 'Bill updated successfully', data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update bill' });
  }
});

// Delete bill
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const userId = req.user!.id;

    const existing = await prisma.bill.findFirst({ where: { id, userId } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Bill not found' });
      return;
    }

    await prisma.bill.delete({ where: { id } });
    res.json({ success: true, message: 'Bill deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete bill' });
  }
});

export default router;

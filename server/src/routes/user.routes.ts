import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createDefaultCategoriesForUser } from '../utils/defaults.js';

const router = Router();

const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  currency: z.string().default('INR').optional(),
  timezone: z.string().default('Asia/Kolkata').optional(),
});

// Update Profile
router.put('/profile', requireAuth, validateBody(updateProfileSchema), async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { name, currency, timezone } = req.body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(timezone && { timezone }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        currency: true,
        timezone: true,
      },
    });

    res.json({ success: true, message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
});

// Full Data Export (JSON)
router.get('/export', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [user, accounts, categories, transactions, budgets, bills, goals] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, currency: true, timezone: true, createdAt: true },
      }),
      prisma.account.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.bill.findMany({ where: { userId } }),
      prisma.savingsGoal.findMany({ where: { userId } }),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      app: 'Exper Personal Expense Tracker',
      user,
      accounts,
      categories,
      transactions,
      budgets,
      bills,
      goals,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="exper-backup-data.json"');
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to export user data' });
  }
});

// Reset Demo Data for testing
router.post('/reset-demo', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    await prisma.$transaction(async (tx) => {
      // Clear all existing data for this user
      await tx.transaction.deleteMany({ where: { userId } });
      await tx.bill.deleteMany({ where: { userId } });
      await tx.budget.deleteMany({ where: { userId } });
      await tx.savingsGoal.deleteMany({ where: { userId } });
      await tx.notification.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });
      await tx.category.deleteMany({ where: { userId } });

      // Re-create categories
      await createDefaultCategoriesForUser(userId);

      // Create accounts
      const hdfc = await tx.account.create({
        data: { userId, name: 'HDFC Salary Account', type: 'BANK', balance: 64500, accountNumber: '•••• 7812', color: '#2563eb', isDefault: true },
      });
      const upi = await tx.account.create({
        data: { userId, name: 'PhonePe / UPI', type: 'UPI', balance: 8250, accountNumber: 'jaivik@ybl', color: '#6366f1' },
      });
      const cash = await tx.account.create({
        data: { userId, name: 'Cash Wallet', type: 'CASH', balance: 4200, color: '#16a34a' },
      });
      const credit = await tx.account.create({
        data: { userId, name: 'Amazon Pay ICICI Card', type: 'CREDIT_CARD', balance: 14200, accountNumber: '•••• 1094', color: '#ea580c' },
      });

      // Categories lookup
      const foodCat = await tx.category.findFirst({ where: { userId, name: 'Food and Dining' } });
      const salaryCat = await tx.category.findFirst({ where: { userId, name: 'Salary' } });
      const rentCat = await tx.category.findFirst({ where: { userId, name: 'Rent' } });
      const groceryCat = await tx.category.findFirst({ where: { userId, name: 'Groceries' } });
      const utilCat = await tx.category.findFirst({ where: { userId, name: 'Utilities' } });
      const shoppingCat = await tx.category.findFirst({ where: { userId, name: 'Shopping' } });
      const freelanceCat = await tx.category.findFirst({ where: { userId, name: 'Freelancing' } });
      const transportCat = await tx.category.findFirst({ where: { userId, name: 'Transportation' } });

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Transactions
      await tx.transaction.createMany({
        data: [
          { userId, accountId: hdfc.id, categoryId: salaryCat?.id, type: 'INCOME', amount: 85000, date: new Date(currentYear, currentMonth, 1), description: 'Monthly Tech Salary', merchant: 'Tech Corp', paymentMethod: 'NET_BANKING', status: 'POSTED' },
          { userId, accountId: hdfc.id, categoryId: freelanceCat?.id, type: 'INCOME', amount: 22000, date: new Date(currentYear, currentMonth, 5), description: 'UI/UX Freelance Design Project', merchant: 'Client Direct', paymentMethod: 'NET_BANKING', status: 'POSTED' },
          { userId, accountId: hdfc.id, categoryId: rentCat?.id, type: 'EXPENSE', amount: 22000, date: new Date(currentYear, currentMonth, 2), description: 'Apartment Rent October', merchant: 'Landlord', paymentMethod: 'NET_BANKING', status: 'POSTED' },
          { userId, accountId: upi.id, categoryId: foodCat?.id, type: 'EXPENSE', amount: 840, date: new Date(currentYear, currentMonth, 4), description: 'Dinner with friends at Social', merchant: 'Social Offline', paymentMethod: 'UPI', status: 'POSTED' },
          { userId, accountId: upi.id, categoryId: groceryCat?.id, type: 'EXPENSE', amount: 2450, date: new Date(currentYear, currentMonth, 7), description: 'Weekly groceries at Nature Basket', merchant: 'Nature Basket', paymentMethod: 'UPI', status: 'POSTED' },
          { userId, accountId: upi.id, categoryId: transportCat?.id, type: 'EXPENSE', amount: 480, date: new Date(currentYear, currentMonth, 9), description: 'Uber Premier ride to CyberCity', merchant: 'Uber India', paymentMethod: 'UPI', status: 'POSTED' },
          { userId, accountId: credit.id, categoryId: shoppingCat?.id, type: 'EXPENSE', amount: 4299, date: new Date(currentYear, currentMonth, 11), description: 'Noise Cancelling Headphones', merchant: 'Amazon India', paymentMethod: 'CREDIT_CARD', status: 'POSTED' },
          { userId, accountId: upi.id, categoryId: utilCat?.id, type: 'EXPENSE', amount: 1540, date: new Date(currentYear, currentMonth, 12), description: 'Airtel Fiber Broadband Bill', merchant: 'Airtel Broadband', paymentMethod: 'UPI', status: 'POSTED' },
          { userId, accountId: upi.id, categoryId: foodCat?.id, type: 'EXPENSE', amount: 420, date: new Date(currentYear, currentMonth, 14), description: 'Swiggy Gourmet Lunch Bowl', merchant: 'Swiggy', paymentMethod: 'UPI', status: 'POSTED' },
        ],
      });

      // Budgets
      const currentPeriod = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      if (foodCat) await tx.budget.create({ data: { userId, categoryId: foodCat.id, amount: 12000, period: currentPeriod } });
      if (groceryCat) await tx.budget.create({ data: { userId, categoryId: groceryCat.id, amount: 10000, period: currentPeriod } });
      if (shoppingCat) await tx.budget.create({ data: { userId, categoryId: shoppingCat.id, amount: 8000, period: currentPeriod } });
      if (transportCat) await tx.budget.create({ data: { userId, categoryId: transportCat.id, amount: 5000, period: currentPeriod } });

      // Bills
      await tx.bill.createMany({
        data: [
          { userId, categoryId: rentCat?.id, name: 'House Rent', amount: 22000, dueDate: new Date(currentYear, currentMonth + 1, 2), recurrence: 'MONTHLY', status: 'UPCOMING', notes: 'Transfer via NEFT' },
          { userId, categoryId: utilCat?.id, name: 'Airtel Xstream Fiber', amount: 1199, dueDate: new Date(currentYear, currentMonth, 22), recurrence: 'MONTHLY', status: 'DUE_SOON', notes: 'Autopay on 22nd' },
          { userId, categoryId: utilCat?.id, name: 'Electricity Bill (BESCOM)', amount: 2400, dueDate: new Date(currentYear, currentMonth, 25), recurrence: 'MONTHLY', status: 'UPCOMING' },
          { userId, name: 'Netflix Premium & Spotify', amount: 799, dueDate: new Date(currentYear, currentMonth, 28), recurrence: 'MONTHLY', status: 'UPCOMING' },
        ],
      });

      // Savings Goals
      await tx.savingsGoal.createMany({
        data: [
          { userId, name: 'Emergency Safety Fund', targetAmount: 250000, currentAmount: 185000, targetDate: new Date(currentYear + 1, 5, 30), color: '#16a34a', icon: 'shield-check', notes: '6 months runway' },
          { userId, name: 'M3 MacBook Pro Upgrade', targetAmount: 180000, currentAmount: 120000, targetDate: new Date(currentYear, 11, 25), color: '#2563eb', icon: 'laptop', notes: 'Personal workstation' },
          { userId, name: 'Goa Holiday with Friends', targetAmount: 40000, currentAmount: 28000, targetDate: new Date(currentYear, 11, 15), color: '#ec4899', icon: 'plane' },
        ],
      });

      // Welcome Notification
      await tx.notification.create({
        data: {
          userId,
          title: 'Demo Financial Data Initialized',
          message: 'Your account has been reset with realistic Indian Rupee expenses, accounts, budgets, bills, and goals.',
          type: 'SUCCESS',
        },
      });
    });

    res.json({ success: true, message: 'Demo data has been successfully re-initialized.' });
  } catch (error: any) {
    console.error('Reset demo error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset demo data' });
  }
});

// Delete user account
router.delete('/account', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    await prisma.user.delete({ where: { id: userId } });
    res.clearCookie('token');
    res.json({ success: true, message: 'Account deleted permanently' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

export default router;

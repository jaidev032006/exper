import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { createDefaultCategoriesForUser } from '../src/utils/defaults.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Finora database seed...');

  // Clean existing demo data
  await prisma.transaction.deleteMany({});
  await prisma.bill.deleteMany({});
  await prisma.budget.deleteMany({});
  await prisma.savingsGoal.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Exper@123', salt);

  // 1. Primary Demo User
  const demoUser = await prisma.user.create({
    data: {
      name: 'Jaivik Sharma',
      email: 'demo@exper.app',
      passwordHash,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  // Also create demo@finora.app for backward compatibility
  await prisma.user.create({
    data: {
      name: 'Jaivik Sharma (Legacy)',
      email: 'demo@finora.app',
      passwordHash,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  // 2. Secondary User for testing data isolation
  const testUser = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@exper.app',
      passwordHash,
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    },
  });

  await createDefaultCategoriesForUser(demoUser.id);
  await createDefaultCategoriesForUser(testUser.id);

  // 3. Demo Accounts
  const hdfc = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'HDFC Salary Account',
      type: 'BANK',
      balance: 64500,
      accountNumber: '•••• 7812',
      color: '#2563eb',
      isDefault: true,
    },
  });

  const upi = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'PhonePe / UPI',
      type: 'UPI',
      balance: 8250,
      accountNumber: 'jaivik@ybl',
      color: '#6366f1',
    },
  });

  const cash = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'Cash in Hand',
      type: 'CASH',
      balance: 4200,
      color: '#16a34a',
    },
  });

  const credit = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'Amazon Pay ICICI Card',
      type: 'CREDIT_CARD',
      balance: 14200,
      accountNumber: '•••• 1094',
      color: '#ea580c',
    },
  });

  const savingsAcc = await prisma.account.create({
    data: {
      userId: demoUser.id,
      name: 'Wealth / Emergency Savings',
      type: 'SAVINGS',
      balance: 185000,
      accountNumber: '•••• 3391',
      color: '#059669',
    },
  });

  // 4. Fetch Category IDs
  const foodCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Food and Dining' } });
  const salaryCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Salary' } });
  const rentCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Rent' } });
  const groceryCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Groceries' } });
  const utilCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Utilities' } });
  const shoppingCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Shopping' } });
  const freelanceCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Freelancing' } });
  const transportCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Transportation' } });
  const entCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Entertainment' } });
  const fuelCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Fuel' } });
  const healthCat = await prisma.category.findFirst({ where: { userId: demoUser.id, name: 'Health' } });

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  // 5. Seed Transactions for current month and previous month
  const transactionsData = [
    // Income
    { userId: demoUser.id, accountId: hdfc.id, categoryId: salaryCat?.id, type: 'INCOME', amount: 85000, date: new Date(y, m, 1, 9, 30), description: 'Tech Corp Monthly Salary', merchant: 'Tech Corp India', paymentMethod: 'NET_BANKING', status: 'POSTED' },
    { userId: demoUser.id, accountId: hdfc.id, categoryId: freelanceCat?.id, type: 'INCOME', amount: 24500, date: new Date(y, m, 5, 14, 0), description: 'Fintech Mobile App Design Milestone', merchant: 'Apex Studio', paymentMethod: 'NET_BANKING', status: 'POSTED' },

    // Expenses
    { userId: demoUser.id, accountId: hdfc.id, categoryId: rentCat?.id, type: 'EXPENSE', amount: 22000, date: new Date(y, m, 2, 11, 0), description: 'Apartment Monthly Rent', merchant: 'Sobha Heights', paymentMethod: 'NET_BANKING', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: groceryCat?.id, type: 'EXPENSE', amount: 3240, date: new Date(y, m, 3, 18, 20), description: 'Fresh vegetables & pantry essentials', merchant: 'Nature Basket', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: foodCat?.id, type: 'EXPENSE', amount: 680, date: new Date(y, m, 4, 13, 15), description: 'Team lunch bowl & cold brew', merchant: 'Blue Tokai Coffee', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: transportCat?.id, type: 'EXPENSE', amount: 490, date: new Date(y, m, 6, 8, 45), description: 'Uber Premier to client meeting', merchant: 'Uber India', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: credit.id, categoryId: shoppingCat?.id, type: 'EXPENSE', amount: 4499, date: new Date(y, m, 8, 20, 10), description: 'Sony WH-CH720N Noise Cancelling Headphones', merchant: 'Amazon India', paymentMethod: 'CREDIT_CARD', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: utilCat?.id, type: 'EXPENSE', amount: 1415, date: new Date(y, m, 10, 10, 0), description: 'Airtel Xstream 200Mbps Fiber Bill', merchant: 'Airtel Broadband', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: cash.id, categoryId: fuelCat?.id, type: 'EXPENSE', amount: 1800, date: new Date(y, m, 11, 17, 30), description: 'Shell V-Power Fuel Refill', merchant: 'Shell India', paymentMethod: 'CASH', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: foodCat?.id, type: 'EXPENSE', amount: 920, date: new Date(y, m, 12, 21, 0), description: 'Dinner with friends at Burma Burma', merchant: 'Burma Burma', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: credit.id, categoryId: entCat?.id, type: 'EXPENSE', amount: 1100, date: new Date(y, m, 13, 19, 0), description: 'IMAX Cinema Tickets (Dune)', merchant: 'PVR INOX', paymentMethod: 'CREDIT_CARD', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: healthCat?.id, type: 'EXPENSE', amount: 1250, date: new Date(y, m, 14, 16, 20), description: 'Monthly vitamins and prescription medicine', merchant: 'Apollo Pharmacy', paymentMethod: 'UPI', status: 'POSTED' },

    // Internal Transfer (HDFC to UPI wallet - ₹5,000)
    { userId: demoUser.id, accountId: hdfc.id, toAccountId: upi.id, type: 'TRANSFER', amount: 5000, date: new Date(y, m, 7, 10, 30), description: 'Top-up PhonePe Wallet from HDFC', paymentMethod: 'TRANSFER', status: 'POSTED' },

    // Previous Month Transactions for comparative period statistics
    { userId: demoUser.id, accountId: hdfc.id, categoryId: salaryCat?.id, type: 'INCOME', amount: 85000, date: new Date(y, m - 1, 1, 9, 30), description: 'Tech Corp Previous Month Salary', paymentMethod: 'NET_BANKING', status: 'POSTED' },
    { userId: demoUser.id, accountId: hdfc.id, categoryId: rentCat?.id, type: 'EXPENSE', amount: 22000, date: new Date(y, m - 1, 2, 10, 0), description: 'Previous Month Rent', paymentMethod: 'NET_BANKING', status: 'POSTED' },
    { userId: demoUser.id, accountId: upi.id, categoryId: groceryCat?.id, type: 'EXPENSE', amount: 6200, date: new Date(y, m - 1, 15, 12, 0), description: 'Previous Month Groceries', paymentMethod: 'UPI', status: 'POSTED' },
    { userId: demoUser.id, accountId: credit.id, categoryId: shoppingCat?.id, type: 'EXPENSE', amount: 7800, date: new Date(y, m - 1, 20, 15, 0), description: 'Previous Month Shopping & Festive Gifts', paymentMethod: 'CREDIT_CARD', status: 'POSTED' },
  ];

  await prisma.transaction.createMany({ data: transactionsData });

  // 6. Monthly Budgets
  const currentPeriod = `${y}-${String(m + 1).padStart(2, '0')}`;
  if (foodCat) await prisma.budget.create({ data: { userId: demoUser.id, categoryId: foodCat.id, amount: 10000, period: currentPeriod } });
  if (groceryCat) await prisma.budget.create({ data: { userId: demoUser.id, categoryId: groceryCat.id, amount: 8000, period: currentPeriod } });
  if (shoppingCat) await prisma.budget.create({ data: { userId: demoUser.id, categoryId: shoppingCat.id, amount: 8000, period: currentPeriod } });
  if (transportCat) await prisma.budget.create({ data: { userId: demoUser.id, categoryId: transportCat.id, amount: 4000, period: currentPeriod } });
  if (entCat) await prisma.budget.create({ data: { userId: demoUser.id, categoryId: entCat.id, amount: 3000, period: currentPeriod } });

  // 7. Bills & Recurring Obligations
  await prisma.bill.createMany({
    data: [
      { userId: demoUser.id, categoryId: rentCat?.id, name: 'House Rent (Sobha Heights)', amount: 22000, dueDate: new Date(y, m + 1, 2), recurrence: 'MONTHLY', status: 'UPCOMING', notes: 'Autopay via NEFT' },
      { userId: demoUser.id, categoryId: utilCat?.id, name: 'BESCOM Electricity Bill', amount: 2150, dueDate: new Date(y, m, 22), recurrence: 'MONTHLY', status: 'DUE_SOON', notes: 'Consumer ID: 10982344' },
      { userId: demoUser.id, categoryId: utilCat?.id, name: 'Airtel Xstream Fiber Broadband', amount: 1199, dueDate: new Date(y, m, 26), recurrence: 'MONTHLY', status: 'UPCOMING' },
      { userId: demoUser.id, name: 'Netflix Premium (4K Family)', amount: 649, dueDate: new Date(y, m, 28), recurrence: 'MONTHLY', status: 'UPCOMING' },
      { userId: demoUser.id, categoryId: healthCat?.id, name: 'Care Health Super Top-up Insurance', amount: 6500, dueDate: new Date(y, m + 1, 10), recurrence: 'YEARLY', status: 'UPCOMING' },
    ],
  });

  // 8. Savings Goals
  await prisma.savingsGoal.createMany({
    data: [
      { userId: demoUser.id, name: 'Emergency Runway Fund', targetAmount: 250000, currentAmount: 185000, targetDate: new Date(y + 1, 5, 30), color: '#16a34a', icon: 'shield-check', notes: '6 months of living expenses' },
      { userId: demoUser.id, name: 'Apple M3 Pro MacBook', targetAmount: 199900, currentAmount: 135000, targetDate: new Date(y, 11, 20), color: '#2563eb', icon: 'laptop', notes: 'Development workstation' },
      { userId: demoUser.id, name: 'Goa Holiday with College Friends', targetAmount: 45000, currentAmount: 32000, targetDate: new Date(y, 11, 10), color: '#ec4899', icon: 'plane' },
      { userId: demoUser.id, name: 'Royal Enfield Hunter 350', targetAmount: 180000, currentAmount: 65000, targetDate: new Date(y + 1, 3, 15), color: '#d97706', icon: 'bike' },
    ],
  });

  // 9. In-app Notifications
  await prisma.notification.createMany({
    data: [
      { userId: demoUser.id, title: 'October Salary Credited', message: '₹85,000 from Tech Corp India has been credited to your HDFC Salary Account.', type: 'SUCCESS' },
      { userId: demoUser.id, title: 'Upcoming Bill Due Soon', message: 'BESCOM Electricity Bill of ₹2,150 is due on October 22.', type: 'WARNING' },
      { userId: demoUser.id, title: 'Budget Status Update', message: 'You have utilized 32% of your Food and Dining budget for this month. Good job!', type: 'INFO' },
    ],
  });

  console.log('✅ Exper database seeded successfully with realistic demo data!');
  console.log('👉 Demo login credentials: demo@exper.app / Exper@123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import prisma from '../prisma.js';

describe('Finora Financial Engine & Security Tests', () => {
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let accountA1Id: string;
  let accountA2Id: string;
  let accountB1Id: string;

  beforeAll(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Alpha',
        email: `alpha_${Date.now()}@exper.test`,
        password: 'Password123!',
      });
    expect(resA.status).toBe(201);
    userAToken = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Beta',
        email: `beta_${Date.now()}@exper.test`,
        password: 'Password123!',
      });
    expect(resB.status).toBe(201);
    userBToken = resB.body.token;
    userBId = resB.body.user.id;

    // Get User A accounts
    const accsA = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(accsA.status).toBe(200);
    accountA1Id = accsA.body.data[0].id;
    accountA2Id = accsA.body.data[1].id;

    // Get User B accounts
    const accsB = await request(app)
      .get('/api/accounts')
      .set('Authorization', `Bearer ${userBToken}`);
    expect(accsB.status).toBe(200);
    accountB1Id = accsB.body.data[0].id;
  }, 30000);

  afterAll(async () => {
    // Cleanup test users
    if (userAId) await prisma.user.deleteMany({ where: { id: userAId } });
    if (userBId) await prisma.user.deleteMany({ where: { id: userBId } });
    await prisma.$disconnect();
  }, 30000);

  it('1. Rejects login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@finora.test',
        password: 'wrongpassword',
      });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('2. Enforces User-to-User Data Isolation', async () => {
    // User B tries to view transactions or account belonging to User A
    const res = await request(app)
      .get(`/api/transactions`)
      .set('Authorization', `Bearer ${userBToken}`);
    expect(res.status).toBe(200);
    // User B has 0 transactions
    expect(res.body.data.length).toBe(0);

    // User B tries to transfer money from User A's account!
    const illicitTransfer = await request(app)
      .post('/api/accounts/transfer')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        fromAccountId: accountA1Id,
        toAccountId: accountB1Id,
        amount: 1000,
        description: 'Unauthorized transfer attempt',
      });
    expect(illicitTransfer.status).toBe(400);
    expect(illicitTransfer.body.success).toBe(false);
  });

  it('3. Accurate Financial Calculations (Income, Expense, Account Balance)', async () => {
    // Get initial balance
    const accBefore = await prisma.account.findUnique({ where: { id: accountA1Id } });
    const initialBalance = Number(accBefore!.balance);

    // Post Income of 5000
    const incomeRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        accountId: accountA1Id,
        type: 'INCOME',
        amount: 5000,
        date: new Date().toISOString(),
        description: 'Test Freelance Income',
        paymentMethod: 'UPI',
        status: 'POSTED',
      });
    expect(incomeRes.status).toBe(201);

    // Check account balance increased by exactly 5000
    const accAfterIncome = await prisma.account.findUnique({ where: { id: accountA1Id } });
    expect(Number(accAfterIncome!.balance)).toBe(initialBalance + 5000);

    // Post Expense of 1200
    const expRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        accountId: accountA1Id,
        type: 'EXPENSE',
        amount: 1200,
        date: new Date().toISOString(),
        description: 'Test Grocery Expense',
        paymentMethod: 'UPI',
        status: 'POSTED',
      });
    expect(expRes.status).toBe(201);

    // Check account balance decreased by exactly 1200
    const accAfterExpense = await prisma.account.findUnique({ where: { id: accountA1Id } });
    expect(Number(accAfterExpense!.balance)).toBe(initialBalance + 5000 - 1200);

    // Check Dashboard summary metrics
    const summaryRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(summaryRes.status).toBe(200);
    expect(summaryRes.body.data.totalIncome).toBe(5000);
    expect(summaryRes.body.data.totalExpense).toBe(1200);
    expect(summaryRes.body.data.netSavings).toBe(3800);
    expect(summaryRes.body.data.savingsRate).toBe(76); // (3800/5000)*100
  });

  it('4. Internal Transfers adjust accounts without double-counting income or expenses', async () => {
    const acc1Before = await prisma.account.findUnique({ where: { id: accountA1Id } });
    const acc2Before = await prisma.account.findUnique({ where: { id: accountA2Id } });

    const transferRes = await request(app)
      .post('/api/accounts/transfer')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        fromAccountId: accountA1Id,
        toAccountId: accountA2Id,
        amount: 2000,
        description: 'Move to secondary wallet',
      });
    expect(transferRes.status).toBe(200);

    const acc1After = await prisma.account.findUnique({ where: { id: accountA1Id } });
    const acc2After = await prisma.account.findUnique({ where: { id: accountA2Id } });

    expect(Number(acc1After!.balance)).toBe(Number(acc1Before!.balance) - 2000);
    expect(Number(acc2After!.balance)).toBe(Number(acc2Before!.balance) + 2000);

    // Verify dashboard: Income and Expense must NOT change!
    const summaryRes = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(summaryRes.body.data.totalIncome).toBe(5000); // Unchanged!
    expect(summaryRes.body.data.totalExpense).toBe(1200); // Unchanged!
  });

  it('5. Bill Payment Workflow & Duplicate Payment Prevention', async () => {
    // Create a bill
    const billRes = await request(app)
      .post('/api/bills')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        name: 'Internet Fiber Bill',
        amount: 999,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        recurrence: 'MONTHLY',
      });
    expect(billRes.status).toBe(201);
    const billId = billRes.body.data.id;

    // Pay bill
    const payRes = await request(app)
      .post(`/api/bills/${billId}/pay`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        accountId: accountA1Id,
        paymentMethod: 'UPI',
      });
    expect(payRes.status).toBe(200);
    expect(payRes.body.data.bill.status).toBe('PAID');

    // Attempt to pay the same bill again (Must fail with 400 to prevent duplicate charge)
    const duplicatePayRes = await request(app)
      .post(`/api/bills/${billId}/pay`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        accountId: accountA1Id,
        paymentMethod: 'UPI',
      });
    expect(duplicatePayRes.status).toBe(400);
    expect(duplicatePayRes.body.message).toContain('already been paid');
  });
});

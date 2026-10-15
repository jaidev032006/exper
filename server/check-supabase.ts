import prisma from './src/prisma.js';

async function verifySupabase() {
  console.log('Testing live connection to Supabase PostgreSQL...');
  
  const versionResult = await prisma.$queryRawUnsafe<any[]>('SELECT version()');
  const currentDbResult = await prisma.$queryRawUnsafe<any[]>('SELECT current_database(), current_user, inet_server_addr()');
  
  const userCount = await prisma.user.count();
  const accountCount = await prisma.account.count();
  const txCount = await prisma.transaction.count();
  const categoryCount = await prisma.category.count();
  const budgetCount = await prisma.budget.count();
  const billCount = await prisma.bill.count();
  const goalCount = await prisma.savingsGoal.count();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, currency: true, timezone: true }
  });

  console.log('--- SUPABASE CONNECTION STATUS ---');
  console.log('Status: CONNECTED & ONLINE');
  console.log('Server Engine:', versionResult[0].version);
  console.log('Active DB & User:', currentDbResult[0]);
  console.log('\n--- LIVE TABLE COUNTS IN SUPABASE ---');
  console.log({
    users: userCount,
    accounts: accountCount,
    transactions: txCount,
    categories: categoryCount,
    budgets: budgetCount,
    bills: billCount,
    savingsGoals: goalCount
  });
  console.log('\n--- REGISTERED USERS IN SUPABASE ---');
  console.log(users);
}

verifySupabase()
  .catch((e) => {
    console.error('Connection check failed:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

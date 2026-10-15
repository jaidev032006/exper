export interface User {
  id: string;
  name: string;
  email: string;
  currency: string;
  timezone: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type AccountType = 'BANK' | 'CASH' | 'UPI' | 'CREDIT_CARD' | 'SAVINGS' | 'WALLET';

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
  accountNumber?: string | null;
  color: string;
  isDefault: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'EXPENSE' | 'INCOME';

export interface Category {
  id: string;
  userId?: string | null;
  name: string;
  type: CategoryType;
  icon: string;
  color: string;
  isDefault: boolean;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  merchant?: string | null;
  paymentMethod: string;
  notes?: string | null;
  receiptUrl?: string | null;
  status: 'POSTED' | 'PENDING';
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
  account: Account;
  toAccount?: Account | null;
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  period: string;
  limit: number;
  spent: number;
  prevSpent?: number;
  remaining: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
  category: Category;
}

export type BillStatus = 'UPCOMING' | 'DUE_SOON' | 'OVERDUE' | 'PAID' | 'CANCELLED';
export type BillRecurrence = 'ONCE' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface Bill {
  id: string;
  userId: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  dueDate: string;
  recurrence: BillRecurrence;
  status: BillStatus;
  paidTransactionId?: string | null;
  paidAt?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category | null;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  color?: string | null;
  icon?: string | null;
  notes?: string | null;
  percentage: number;
  remaining: number;
  daysLeft?: number | null;
  isCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  isRead: boolean;
  createdAt: string;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  incomeChange: number;
  expenseChange: number;
  savingsChange: number;
  categoryBreakdown: {
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  budgetSummaries: {
    id: string;
    category: string;
    color: string;
    limit: number;
    spent: number;
    remaining: number;
    percentage: number;
    isExceeded: boolean;
    isWarning: boolean;
  }[];
  upcomingBills: Bill[];
  savingsGoals: SavingsGoal[];
  monthlyTrends: {
    month: string;
    income: number;
    expense: number;
    savings: number;
  }[];
  recentTransactions: Transaction[];
  accounts: Account[];
}

export interface AnalyticsData {
  timeframe: string;
  startDate: string;
  endDate: string;
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  averageDailySpending: number;
  totalTransactions: number;
  categoryBreakdown: {
    name: string;
    color: string;
    amount: number;
    count: number;
    percentage: number;
  }[];
  topCategories: {
    name: string;
    color: string;
    amount: number;
    percentage: number;
  }[];
  timeline: {
    date: string;
    income: number;
    expense: number;
    savings: number;
  }[];
}

import prisma from '../prisma.js';

export const DEFAULT_CATEGORIES = [
  // Expenses
  { name: 'Food and Dining', type: 'EXPENSE', icon: 'UtensilsCrossed', color: '#ea580c' },
  { name: 'Groceries', type: 'EXPENSE', icon: 'ShoppingCart', color: '#16a34a' },
  { name: 'Transportation', type: 'EXPENSE', icon: 'Car', color: '#4f46e5' },
  { name: 'Fuel', type: 'EXPENSE', icon: 'Fuel', color: '#0f766e' },
  { name: 'Education', type: 'EXPENSE', icon: 'GraduationCap', color: '#059669' },
  { name: 'Shopping', type: 'EXPENSE', icon: 'ShoppingBag', color: '#db2777' },
  { name: 'Entertainment', type: 'EXPENSE', icon: 'Film', color: '#7c3aed' },
  { name: 'Health', type: 'EXPENSE', icon: 'HeartPulse', color: '#dc2626' },
  { name: 'Rent', type: 'EXPENSE', icon: 'Home', color: '#d97706' },
  { name: 'Utilities', type: 'EXPENSE', icon: 'Zap', color: '#0284c7' },
  { name: 'Subscriptions', type: 'EXPENSE', icon: 'Tv', color: '#8b5cf6' },
  { name: 'Travel', type: 'EXPENSE', icon: 'Plane', color: '#2563eb' },
  { name: 'Personal Care', type: 'EXPENSE', icon: 'Sparkles', color: '#ec4899' },
  { name: 'Bills', type: 'EXPENSE', icon: 'Receipt', color: '#b45309' },
  { name: 'Other', type: 'EXPENSE', icon: 'MoreHorizontal', color: '#64748b' },

  // Income
  { name: 'Salary', type: 'INCOME', icon: 'Briefcase', color: '#16a34a' },
  { name: 'Freelancing', type: 'INCOME', icon: 'Laptop', color: '#0284c7' },
  { name: 'Business', type: 'INCOME', icon: 'Building2', color: '#2563eb' },
  { name: 'Scholarship', type: 'INCOME', icon: 'Award', color: '#059669' },
  { name: 'Allowance', type: 'INCOME', icon: 'Coins', color: '#d97706' },
  { name: 'Interest', type: 'INCOME', icon: 'TrendingUp', color: '#7c3aed' },
  { name: 'Gifts', type: 'INCOME', icon: 'Gift', color: '#db2777' },
  { name: 'Other Income', type: 'INCOME', icon: 'PlusCircle', color: '#64748b' },
];

export async function createDefaultCategoriesForUser(userId: string) {
  const existing = await prisma.category.count({ where: { userId } });
  if (existing > 0) return;

  const records = DEFAULT_CATEGORIES.map((cat) => ({
    userId,
    name: cat.name,
    type: cat.type,
    icon: cat.icon,
    color: cat.color,
    isDefault: true,
  }));

  await prisma.category.createMany({
    data: records,
  });
}

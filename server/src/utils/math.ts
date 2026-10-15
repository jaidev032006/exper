/**
 * Accurate financial rounding and arithmetic utilities
 * Avoids floating-point drift by rounding to 2 decimal places (minor currency units)
 */

export function roundCurrency(amount: any): number {
  const num = typeof amount === 'number' ? amount : Number(amount) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatINR(amount: number): string {
  const rounded = roundCurrency(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(rounded);
}

export function calculateSavingsRate(income: number, savings: number): number {
  if (income <= 0) return 0;
  const rate = (savings / income) * 100;
  return Math.min(100, Math.max(0, roundCurrency(rate)));
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const change = ((current - previous) / Math.abs(previous)) * 100;
  return roundCurrency(change);
}

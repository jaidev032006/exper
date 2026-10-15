import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Format monetary amount to Indian Rupee (₹) format with comma grouping
 * e.g. ₹1,85,000.00
 */
export function formatCurrency(amount: number, hideDecimals = false): string {
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hideDecimals ? 0 : 2,
    maximumFractionDigits: hideDecimals ? 0 : 2,
  }).format(absAmount);

  return isNegative ? `-${formatted}` : formatted;
}

export function formatDate(dateStringOrObj: string | Date, dateFormat = 'dd MMM yyyy'): string {
  try {
    const date = typeof dateStringOrObj === 'string' ? parseISO(dateStringOrObj) : dateStringOrObj;
    return format(date, dateFormat);
  } catch (e) {
    return String(dateStringOrObj);
  }
}

export function formatRelativeTime(dateStringOrObj: string | Date): string {
  try {
    const date = typeof dateStringOrObj === 'string' ? parseISO(dateStringOrObj) : dateStringOrObj;
    return formatDistanceToNow(date, { addSuffix: true });
  } catch (e) {
    return '';
  }
}

export function formatPercentage(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

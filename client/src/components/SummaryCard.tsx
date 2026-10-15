import React from 'react';
import { ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react';
import { formatCurrency, formatPercentage } from '../utils/formatters.js';

interface SummaryCardProps {
  title: string;
  amount: number;
  change?: number;
  icon?: React.ElementType;
  variant?: 'emerald' | 'coral' | 'slate' | 'default';
  subtitle?: string;
  badge?: string;
  isRate?: boolean;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  amount,
  change,
  icon: Icon = Wallet,
  variant = 'default',
  subtitle,
  badge,
  isRate = false,
}) => {
  const isPositive = (change || 0) >= 0;

  const iconColors = {
    emerald: 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]',
    coral: 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]',
    slate: 'bg-[#F2F4F1] text-[#627368] dark:bg-[#1C2C23] dark:text-[#8EA395]',
    default: 'bg-[#F2F4F1] text-[#43564A] dark:bg-[#1C2C23] dark:text-[#8EA395]',
  }[variant];

  return (
    <div className="fintech-card p-5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#627368] dark:text-[#8EA395]">
          {title}
        </span>
        <div className={`p-2 rounded-xl ${iconColors}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div>
        <div className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
          {isRate ? `${amount.toFixed(1)}%` : formatCurrency(amount)}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {change !== undefined && (
            <div
              className={`inline-flex items-center gap-0.5 text-[11px] font-medium px-2 py-0.5 rounded-md ${
                variant === 'coral'
                  ? isPositive
                    ? 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
                    : 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                  : isPositive
                  ? 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
                  : 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
              }`}
            >
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              <span>{formatPercentage(Math.abs(change))}</span>
            </div>
          )}

          <p className="text-[11px] text-[#7E9786] dark:text-[#7A9182] truncate">
            {subtitle || (change !== undefined ? 'vs last month' : '')}
          </p>
        </div>

        {badge && (
          <div className="mt-3 pt-2.5 border-t border-[#E3E8E3] dark:border-[#203328] flex items-center justify-between text-[11px] text-[#627368] dark:text-[#8EA395]">
            <span>{badge}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#137C5A] dark:bg-[#34D399]" />
          </div>
        )}
      </div>
    </div>
  );
};

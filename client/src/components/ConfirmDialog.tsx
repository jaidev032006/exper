import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
        <div className="flex items-start gap-3.5">
          <div className={`p-2.5 rounded-xl flex-shrink-0 ${
            isDestructive
              ? 'bg-[#FEE2E2] text-[#D94B4B] dark:bg-[#2A1717] dark:text-[#F87171]'
              : 'bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399]'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-1">
              {title}
            </h3>
            <p className="text-xs text-[#627368] dark:text-[#8EA395] leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 mt-5 pt-3.5 border-t border-[#E3E8E3] dark:border-[#203328]">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all active:scale-95 ${
              isDestructive
                ? 'bg-[#D94B4B] hover:bg-[#C53030]'
                : 'bg-[#137C5A] hover:bg-[#0F6549]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

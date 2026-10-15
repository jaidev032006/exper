import React, { useState } from 'react';
import { X, KeyRound, Check, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../../lib/api.js';
import { auth, sendPasswordResetEmail } from '../../lib/firebase.js';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessMessage: (msg: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessMessage,
}) => {
  const [step, setStep] = useState<'REQUEST' | 'RESET'>('REQUEST');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      // Send Firebase password reset email if account exists
      sendPasswordResetEmail(auth, email.trim()).catch(() => {});

      const res = await api.forgotPassword(email);
      if (res.demoCode) {
        setDemoCodeHint(res.demoCode);
        setCode(res.demoCode);
      }
      setStep('RESET');
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch reset request');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      await api.resetPassword({
        email,
        code,
        newPassword,
      });
      onSuccessMessage('Password reset successfully. Please log in with your new password.');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] flex items-center justify-center font-bold text-xs shadow-xs">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                {step === 'REQUEST' ? 'Reset Password' : 'Set New Password'}
              </h3>
              <p className="text-xs text-[#627368] dark:text-[#8EA395]">
                {step === 'REQUEST'
                  ? 'We will send a reset code to your email'
                  : 'Enter the code and your new password'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#627368] hover:text-[#17231D] rounded-lg hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
            {error}
          </div>
        )}

        {demoCodeHint && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-[#DDF5E8] dark:bg-[#162E23] text-[#137C5A] dark:text-[#34D399] text-xs font-medium">
            💡 Verification code dispatched! Demo verification code: <strong>{demoCodeHint}</strong>
          </div>
        )}

        {step === 'REQUEST' ? (
          <form onSubmit={handleRequestCode} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Account Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                4-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 8942"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs font-mono tracking-widest text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 mt-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

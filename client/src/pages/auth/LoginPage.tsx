import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { ForgotPasswordModal } from './ForgotPasswordModal.js';

interface LoginPageProps {
  onSwitchToRegister: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSwitchToRegister,
  onLoginSuccess,
}) => {
  const { login, demoLogin, loginWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError('Please provide both email address and password');
      return;
    }

    try {
      setLoading(true);
      await login({ email: email.trim(), password });
      onLoginSuccess();
    } catch (err: any) {
      let msg = err.message || 'Login failed. Please verify your credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        msg = 'Invalid email address or password. Please verify and try again.';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'Access temporarily restricted due to many failed attempts. Try again later or reset password.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      setDemoLoading(true);
      await demoLogin();
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
    } finally {
      setDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
      onLoginSuccess();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        return;
      }
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[#F7F8F5] dark:bg-[#0D1612] transition-colors relative">
      <div className="w-full max-w-md z-10 my-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#137C5A] text-white font-black text-xl shadow-xs mb-3">
            E
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Exper
          </h1>
          <p className="text-xs font-medium text-[#627368] dark:text-[#8EA395] mt-0.5">
            Personal Wealth & Financial Ledger
          </p>
        </div>

        {/* Card Box */}
        <div className="fintech-card p-7 sm:p-8">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-[#17231D] dark:text-[#F2F6F3]">
              Welcome back
            </h2>
            <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
              Sign in with your Firebase credentials or explore instantly with demo
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-[#FEE2E2] dark:bg-[#2A1717] border border-[#FECACA] dark:border-[#4A2222] text-[#C53030] dark:text-[#F87171] text-xs font-medium">
              {error}
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 rounded-xl bg-[#DDF5E8] dark:bg-[#162E23] border border-[#C4EBCE] dark:border-[#204B38] text-[#137C5A] dark:text-[#34D399] text-xs font-semibold">
              {successNotice}
            </div>
          )}

          {/* Quick Access Action Buttons */}
          <div className="space-y-2.5 mb-5">
            {/* 1-Click Demo Login */}
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={demoLoading || loading || googleLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              {demoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>1-Click Demo Access (Explore Exper)</span>
                </>
              )}
            </button>

            {/* Google Firebase Sign In */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading || loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-white dark:bg-[#131E18] hover:bg-[#F7F8F5] dark:hover:bg-[#1A2820] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs border border-[#E3E8E3] dark:border-[#203328] shadow-xs flex items-center justify-center gap-2.5 active:scale-95 transition-all disabled:opacity-50"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#137C5A]" />
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 h-px bg-[#E3E8E3] dark:bg-[#203328]" />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7E9786] dark:text-[#5E7766]">
                Or email credentials
              </span>
              <div className="flex-1 h-px bg-[#E3E8E3] dark:bg-[#203328]" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-[#7E9786] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A] transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-[11px] font-medium text-[#137C5A] dark:text-[#34D399] hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#7E9786] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-xs text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 text-[#7E9786] hover:text-[#17231D] absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#137C5A] border-[#E3E8E3] focus:ring-[#137C5A]"
                />
                <span className="text-[11px] text-[#627368] dark:text-[#8EA395]">
                  Remember session
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="mt-5 pt-4 border-t border-[#E3E8E3] dark:border-[#203328] text-center">
            <p className="text-xs text-[#627368] dark:text-[#8EA395]">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-[#137C5A] dark:text-[#34D399] hover:underline ml-1"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        onSuccessMessage={(msg) => setSuccessNotice(msg)}
      />
    </div>
  );
};

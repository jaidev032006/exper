import React, { useState } from 'react';
import {
  Settings,
  User as UserIcon,
  Sun,
  Moon,
  Download,
  RotateCcw,
  Trash2,
  Check,
  Shield,
  Loader2,
  FileJson,
  FileSpreadsheet,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { useTheme } from '../context/ThemeContext.js';
import { api } from '../lib/api.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface SettingsPageProps {
  onRefreshAll: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onRefreshAll }) => {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [currency] = useState('INR (₹)');
  const [timezone] = useState('Asia/Kolkata (IST)');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);

  // Reset Demo Data
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Delete Account
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage(null);
    try {
      setSavingProfile(true);
      const res = await api.updateProfile({ name: name.trim() });
      if (res.success && res.user) {
        updateUser(res.user);
        setProfileMessage('Profile details saved successfully.');
      }
    } catch (e: any) {
      setProfileMessage('Failed to save profile changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleResetDemoData = async () => {
    try {
      setResetting(true);
      await api.resetDemoData();
      setIsResetConfirmOpen(false);
      onRefreshAll();
      setProfileMessage('Demo financial data successfully refreshed with realistic Indian data!');
    } catch (e: any) {
      console.error(e);
    } finally {
      setResetting(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await api.deleteAccountData();
      logout();
    } catch (e: any) {
      console.error(e);
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
          Account & Preferences
        </h2>
        <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
          Manage your personal profile, regional currency formats, theme aesthetics & portable data
        </p>
      </div>

      {profileMessage && (
        <div className="p-3.5 rounded-xl bg-[#DDF5E8] dark:bg-[#162E23] border border-[#C4EBCE] dark:border-[#204B38] text-[#137C5A] dark:text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{profileMessage}</span>
        </div>
      )}

      {/* Profile Card */}
      <div className="fintech-card p-6">
        <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#E3E8E3] dark:border-[#203328]">
          <div className="w-9 h-9 rounded-xl bg-[#DDF5E8] text-[#137C5A] dark:bg-[#162E23] dark:text-[#34D399] flex items-center justify-center font-bold text-xs shadow-xs">
            <UserIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3]">
              Personal Information
            </h3>
            <p className="text-[11px] text-[#627368] dark:text-[#8EA395]">
              Update your display name and view localized financial settings
            </p>
          </div>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] text-[#7E9786] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Default Currency
              </label>
              <input
                type="text"
                disabled
                value={currency}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] text-[#7E9786] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                Financial Timezone
              </label>
              <input
                type="text"
                disabled
                value={timezone}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#F7F8F5] dark:bg-[#18261F] border border-[#E3E8E3] dark:border-[#203328] text-[#7E9786] cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              {savingProfile && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>

      {/* Appearance Card */}
      <div className="fintech-card p-6">
        <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-1">
          Appearance & Theme
        </h3>
        <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-5">
          Select between light warm fintech and dark charcoal-green aesthetics
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
              theme === 'light'
                ? 'border-[#137C5A] bg-[#DDF5E8]/40 shadow-xs ring-1 ring-[#137C5A]'
                : 'border-[#E3E8E3] dark:border-[#203328] hover:border-[#7E9786]'
            }`}
          >
            <div className="p-2 rounded-lg bg-[#FEF3C7] text-[#D97706]">
              <Sun className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] block">
                Modern Light Fintech
              </span>
              <span className="text-[11px] text-[#627368]">Warm ivory & forest emerald</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
              theme === 'dark'
                ? 'border-[#34D399] bg-[#162E23]/60 shadow-xs ring-1 ring-[#34D399]'
                : 'border-[#E3E8E3] dark:border-[#203328] hover:border-[#7E9786]'
            }`}
          >
            <div className="p-2 rounded-lg bg-[#1C2C23] text-[#34D399]">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] block">
                Deep Charcoal Green
              </span>
              <span className="text-[11px] text-[#8EA395]">Elevated dark surfaces</span>
            </div>
          </button>
        </div>
      </div>

      {/* Data Management & Export Card */}
      <div className="fintech-card p-6">
        <h3 className="text-sm font-semibold text-[#17231D] dark:text-[#F2F6F3] mb-1">
          Data Export & Backup
        </h3>
        <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-5">
          Download a complete portable archive of your accounts, categories, and ledger entries
        </p>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => api.exportAllData()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7F8F5] hover:bg-[#EAEFEA] dark:bg-[#1A2820] dark:hover:bg-[#203328] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs transition-all"
          >
            <FileJson className="w-4 h-4 text-[#137C5A] dark:text-[#34D399]" />
            <span>Export Complete JSON Backup</span>
          </button>

          <button
            onClick={() => api.exportTransactionsCsv()}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#F7F8F5] hover:bg-[#EAEFEA] dark:bg-[#1A2820] dark:hover:bg-[#203328] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#137C5A] dark:text-[#34D399]" />
            <span>Export Transactions (CSV)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Reset Demo Data / Delete Account */}
      <div className="fintech-card p-6 border-[#FECACA] dark:border-[#4A2222]">
        <h3 className="text-sm font-semibold text-[#D94B4B] mb-1">
          Danger Zone
        </h3>
        <p className="text-xs text-[#627368] dark:text-[#8EA395] mb-5">
          Re-seed sample financial data for testing or permanently remove your account
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl border border-[#E3E8E3] dark:border-[#203328] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820] text-[#17231D] dark:text-[#F2F6F3] font-medium text-xs transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset with Sample Data</span>
          </button>

          <button
            onClick={() => setIsDeleteConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#D94B4B] hover:bg-[#C53030] text-white font-medium text-xs shadow-xs transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* Reset Confirmation */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        title="Reset Demo Data"
        message="This will overwrite your existing test transactions and restore realistic Indian financial test accounts and transactions. Proceed?"
        confirmText="Reset Now"
        onConfirm={handleResetDemoData}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Permanently Delete Account"
        message="Are you sure you want to permanently delete your account and all associated accounts, transactions, and categories? This action cannot be undone."
        confirmText="Delete Permanently"
        onConfirm={handleDeleteAccount}
        onCancel={() => setIsDeleteConfirmOpen(false)}
      />
    </div>
  );
};

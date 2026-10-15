import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  X,
  Check,
  FolderPlus,
  Loader2,
} from 'lucide-react';
import { api } from '../lib/api.js';
import { Category, CategoryType } from '../types/index.js';
import { ConfirmDialog } from '../components/ConfirmDialog.js';

interface CategoriesPageProps {
  categories: Category[];
  onRefreshCategories: () => void;
}

const PRESET_COLORS = [
  '#137C5A', // Forest Emerald
  '#0F766E', // Deep Teal
  '#2563EB', // Blue
  '#7C3AED', // Purple
  '#D97706', // Amber
  '#EA580C', // Orange
  '#D94B4B', // Coral Red
  '#475569', // Slate
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  onRefreshCategories,
}) => {
  const [activeType, setActiveType] = useState<CategoryType>('EXPENSE');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#137C5A');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Please provide a category name');
      return;
    }

    try {
      setLoading(true);
      await api.createCategory({
        name: name.trim(),
        type: activeType,
        color,
        icon: 'tag',
      });

      setIsModalOpen(false);
      setName('');
      onRefreshCategories();
    } catch (err: any) {
      setError(err.message || 'Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingId) return;
    try {
      await api.deleteCategory(deletingId);
      setDeletingId(null);
      onRefreshCategories();
    } catch (e) {
      console.error(e);
    }
  };

  const filteredCategories = categories.filter((c) => c.type === activeType);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#17231D] dark:text-[#F2F6F3]">
            Category Management
          </h2>
          <p className="text-xs text-[#627368] dark:text-[#8EA395] mt-0.5">
            Classify and organize income and expense streams with customized indicators
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Expense / Income Switcher */}
          <div className="inline-flex p-1 bg-[#F2F4F1] dark:bg-[#1A2820] rounded-xl border border-[#E3E8E3] dark:border-[#203328]">
            <button
              onClick={() => setActiveType('EXPENSE')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeType === 'EXPENSE'
                  ? 'bg-white dark:bg-[#131E18] text-[#D94B4B] font-semibold shadow-xs'
                  : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
              }`}
            >
              Expense Categories
            </button>
            <button
              onClick={() => setActiveType('INCOME')}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                activeType === 'INCOME'
                  ? 'bg-white dark:bg-[#131E18] text-[#137C5A] dark:text-[#34D399] font-semibold shadow-xs'
                  : 'text-[#627368] dark:text-[#8EA395] hover:text-[#17231D]'
              }`}
            >
              Income Categories
            </button>
          </div>

          <button
            onClick={() => {
              setError(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#137C5A] hover:bg-[#0F6549] text-white font-medium text-xs shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredCategories.map((cat) => (
          <div
            key={cat.id}
            className="fintech-card p-4 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-xs flex-shrink-0"
                style={{ backgroundColor: cat.color || '#137C5A' }}
              >
                {cat.name[0]}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-semibold text-[#17231D] dark:text-[#F2F6F3] truncate">
                  {cat.name}
                </h3>
                <span className="text-[10px] text-[#627368] dark:text-[#8EA395]">
                  {cat.isDefault ? 'System Default' : 'Custom Tag'}
                </span>
              </div>
            </div>

            {!cat.isDefault && (
              <button
                onClick={() => setDeletingId(cat.id)}
                title="Delete Custom Category"
                className="p-1 text-[#627368] hover:text-[#D94B4B] rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#2A1717] opacity-60 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0D1612]/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-[#131E18] rounded-2xl p-6 shadow-modal border border-[#E3E8E3] dark:border-[#203328]">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#E3E8E3] dark:border-[#203328] mb-4">
              <h3 className="text-base font-semibold text-[#17231D] dark:text-[#F2F6F3]">
                Create {activeType === 'INCOME' ? 'Income' : 'Expense'} Category
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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

            <form onSubmit={handleCreateCategory} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Freelance Consulting, Subscriptions"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#131E18] border border-[#E3E8E3] dark:border-[#203328] text-[#17231D] dark:text-[#F2F6F3] focus:outline-none focus:border-[#137C5A]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#627368] dark:text-[#8EA395] mb-1.5">
                  Color Tag
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-offset-2 ring-[#137C5A]' : ''
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-[#E3E8E3] dark:border-[#203328]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#627368] dark:text-[#8EA395] hover:bg-[#F2F4F1] dark:hover:bg-[#1A2820]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#137C5A] hover:bg-[#0F6549] shadow-xs flex items-center gap-1.5"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Category</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        title="Delete Category"
        message="Are you sure you want to delete this custom category? Associated transactions will be marked as uncategorized."
        confirmText="Delete"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingId(null)}
      />
    </div>
  );
};

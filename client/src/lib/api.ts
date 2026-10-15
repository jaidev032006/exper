const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('finora_token');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    localStorage.removeItem('finora_token');
    localStorage.removeItem('finora_user');
    window.dispatchEvent(new Event('finora_auth_logout'));
  }

  // Handle CSV or file downloads
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('text/csv') || contentType.includes('application/octet-stream'))) {
    const blob = await response.blob();
    return blob as unknown as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(data.message || 'An error occurred while communicating with the server', response.status, data);
  }

  return data;
}

export const api = {
  // Auth
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),

  register: (userData: { name: string; email: string; password: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),

  demoLogin: () => request('/auth/demo-login', { method: 'POST' }),

  firebaseSync: (payload: { email: string; name?: string; uid: string; photoUrl?: string }) =>
    request('/auth/firebase-sync', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request('/auth/me'),

  forgotPassword: (email: string) =>
    request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (payload: { email: string; code: string; newPassword: string }) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  // Dashboard
  getDashboardSummary: (params?: { startDate?: string; endDate?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/dashboard/summary${query ? `?${query}` : ''}`);
  },

  // Transactions
  getTransactions: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    return request(`/transactions${query ? `?${query}` : ''}`);
  },

  createTransaction: (data: any) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(data) }),

  updateTransaction: (id: string, data: any) =>
    request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteTransaction: (id: string) =>
    request(`/transactions/${id}`, { method: 'DELETE' }),

  exportTransactionsCsv: (params?: any) => {
    const query = new URLSearchParams(params).toString();
    const token = localStorage.getItem('finora_token');
    window.open(`${API_BASE}/transactions/export/csv?${query}&auth=${token}`, '_blank');
  },

  // Accounts
  getAccounts: () => request('/accounts'),

  createAccount: (data: any) =>
    request('/accounts', { method: 'POST', body: JSON.stringify(data) }),

  updateAccount: (id: string, data: any) =>
    request(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteAccount: (id: string) =>
    request(`/accounts/${id}`, { method: 'DELETE' }),

  transferMoney: (data: { fromAccountId: string; toAccountId: string; amount: number; description?: string; notes?: string }) =>
    request('/accounts/transfer', { method: 'POST', body: JSON.stringify(data) }),

  // Budgets
  getBudgets: (period?: string) =>
    request(`/budgets${period ? `?period=${period}` : ''}`),

  saveBudget: (data: { categoryId: string; amount: number; period?: string }) =>
    request('/budgets', { method: 'POST', body: JSON.stringify(data) }),

  deleteBudget: (id: string) =>
    request(`/budgets/${id}`, { method: 'DELETE' }),

  // Bills
  getBills: () => request('/bills'),

  createBill: (data: any) =>
    request('/bills', { method: 'POST', body: JSON.stringify(data) }),

  updateBill: (id: string, data: any) =>
    request(`/bills/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteBill: (id: string) =>
    request(`/bills/${id}`, { method: 'DELETE' }),

  payBill: (id: string, data: { accountId: string; paymentMethod?: string }) =>
    request(`/bills/${id}/pay`, { method: 'POST', body: JSON.stringify(data) }),

  // Savings Goals
  getGoals: () => request('/goals'),

  createGoal: (data: any) =>
    request('/goals', { method: 'POST', body: JSON.stringify(data) }),

  updateGoal: (id: string, data: any) =>
    request(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteGoal: (id: string) =>
    request(`/goals/${id}`, { method: 'DELETE' }),

  contributeToGoal: (id: string, data: { amount: number; fromAccountId?: string }) =>
    request(`/goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(data) }),

  // Categories
  getCategories: (type?: string) =>
    request(`/categories${type ? `?type=${type}` : ''}`),

  createCategory: (data: any) =>
    request('/categories', { method: 'POST', body: JSON.stringify(data) }),

  updateCategory: (id: string, data: any) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteCategory: (id: string) =>
    request(`/categories/${id}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: (params?: { timeframe?: string; year?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/analytics${query ? `?${query}` : ''}`);
  },

  // Notifications
  getNotifications: () => request('/notifications'),

  markNotificationRead: (id: string) =>
    request(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request('/notifications/mark-all-read', { method: 'POST' }),

  // User & Settings
  updateProfile: (data: any) =>
    request('/user/profile', { method: 'PUT', body: JSON.stringify(data) }),

  exportAllData: () => {
    const token = localStorage.getItem('finora_token');
    window.open(`${API_BASE}/user/export?auth=${token}`, '_blank');
  },

  resetDemoData: () =>
    request('/user/reset-demo', { method: 'POST' }),

  deleteAccountData: () =>
    request('/user/account', { method: 'DELETE' }),
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to get authorization headers
const getHeaders = (hasBody: boolean) => {
  const token = localStorage.getItem('fintrack_token');
  const headers: Record<string, string> = {};
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

// Generic fetch wrapper
const request = async (path: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${path}`;
  const hasBody = !!options.body;
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(hasBody),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || 'Une erreur est survenue');
  }

  // If CSV download
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response.text();
  }

  return response.json();
};

export const api = {
  // Auth
  auth: {
    login: (body: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    register: (body: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    me: () => request('/auth/me'),
    updateProfile: (body: any) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
    updateSecurity: (body: any) => request('/auth/security', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  // Stores
  stores: {
    findAll: () => request('/stores'),
    findOne: (id: string) => request(`/stores/${id}`),
    getStats: () => request('/stores/stats'),
    create: (body: any) => request('/stores', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/stores/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/stores/${id}`, { method: 'DELETE' }),
  },

  // Locations
  locations: {
    getCountries: () => request('/locations/countries'),
    getRegions: (countryName: string) => request(`/locations/regions?countryName=${encodeURIComponent(countryName)}`),
    getCities: (countryName: string, regionName: string) => request(`/locations/cities?countryName=${encodeURIComponent(countryName)}&regionName=${encodeURIComponent(regionName)}`),
  },


  // Categories
  categories: {
    findAll: () => request('/categories'),
    findAllFlat: () => request('/categories/flat'),
    create: (body: any) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),
  },

  // Invoices
  invoices: {
    findAll: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request(`/invoices?${qs}`);
    },
    findOne: (id: string) => request(`/invoices/${id}`),
    create: (body: any) => request('/invoices', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/invoices/${id}`, { method: 'DELETE' }),
    ocr: (imageBase64: string, filename?: string) => request('/invoices/ocr', { method: 'POST', body: JSON.stringify({ image: imageBase64, filename }) }),
    getUniqueProducts: () => request('/invoices/products/unique'),
    bulkDelete: (ids: string[]) => request('/invoices/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
  },

  // Budgets
  budgets: {
    findAll: () => request('/budgets'),
    getReports: (month: number, year: number) => request(`/budgets/reports?month=${month}&year=${year}`),
    create: (body: any) => request('/budgets', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/budgets/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/budgets/${id}`, { method: 'DELETE' }),
  },

  // Analytics
  analytics: {
    getDashboard: () => request('/analytics/dashboard'),
    getKpiDetails: () => request('/analytics/kpi-details'),
    comparePrices: (productName: string) => request(`/analytics/prices?productName=${encodeURIComponent(productName)}`),
    getConsumption: () => request('/analytics/consumption'),
    getAlerts: () => request('/analytics/alerts'),
    getProductHistory: (productName: string) => request(`/analytics/product-history?productName=${encodeURIComponent(productName)}`),
  },

  // Reports
  reports: {
    getCSVUrl: (type: string) => `${API_BASE_URL}/reports/export?type=${type}&token=${localStorage.getItem('gesfin_token')}`,
    exportCSV: (type: string) => request(`/reports/export?type=${type}`),
  },

  // Products
  products: {
    findAll: () => request('/products'),
    findOne: (id: string) => request(`/products/${id}`),
    create: (body: any) => request('/products', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: any) => request(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  },
};


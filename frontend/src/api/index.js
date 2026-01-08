import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  me: () => api.get('/auth/me'),
};

// Stores API
export const storesAPI = {
  getAll: () => api.get('/stores'),
  getMy: () => api.get('/stores/my'),
  getDetailedStats: (storeId, startDate, endDate) => {
    let url = '/orders/store/' + storeId + '/stats/detailed';
    const params = [];
    if (startDate) params.push('start_date=' + startDate);
    if (endDate) params.push('end_date=' + endDate);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
  },
  getById: (id) => api.get('/stores/' + id),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put('/stores/' + id, data),
  delete: (id) => api.delete('/stores/' + id),
};

// Categories API
export const categoriesAPI = {
  getByStore: (storeId) => api.get('/categories/store/' + storeId),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put('/categories/' + id, data),
  delete: (id) => api.delete('/categories/' + id),
};

// Products API
export const productsAPI = {
  getByStore: (storeId, categoryId) => {
    let url = '/products/store/' + storeId;
    if (categoryId) url += '?category_id=' + categoryId;
    return api.get(url);
  },
  getById: (id) => api.get('/products/' + id),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put('/products/' + id, data),
  delete: (id) => api.delete('/products/' + id),
};

// Tables API
export const tablesAPI = {
  getByStore: (storeId) => api.get('/tables/store/' + storeId),
  getByQrCode: (qrCode) => api.get('/tables/qr/' + qrCode),
  create: (data) => api.post('/tables', data),
  update: (id, data) => api.put('/tables/' + id, data),
  regenerateQr: (id) => api.post('/tables/' + id + '/regenerate-qr'),
  delete: (id) => api.delete('/tables/' + id),
};

// Staff API
export const staffAPI = {
  getByStore: (storeId) => api.get('/staff/store/' + storeId),
  create: (storeId, data) => api.post('/staff/store/' + storeId, data),
  updateRole: (id, role) => api.put('/staff/' + id, { role }),
  delete: (id) => api.delete('/staff/' + id),
  getMyStores: () => api.get('/staff/my-stores'),
  getMyRole: (storeId) => api.get('/staff/my-role/' + storeId),
  getRoles: () => api.get('/staff/roles'),
};

// Orders API
export const ordersAPI = {
  getByStore: (storeId, status, date) => {
    let url = '/orders/store/' + storeId;
    const params = [];
    if (status) params.push('status=' + status);
    if (date) params.push('date=' + date);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
  },
  getStats: (storeId, startDate, endDate) => {
    let url = '/orders/store/' + storeId + '/stats';
    const params = [];
    if (startDate) params.push('start_date=' + startDate);
    if (endDate) params.push('end_date=' + endDate);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
  },
  getById: (id) => api.get('/orders/' + id),
  create: (data) => api.post('/orders', data),
  updateStatus: (id, status) => api.put('/orders/' + id + '/status', { status }),
  updatePayment: (id, payment_method, payment_status) =>
    api.put('/orders/' + id + '/payment', { payment_method, payment_status }),
  updateQueue: (id, queue_number, estimated_minutes) => api.put('/orders/' + id + '/queue', { queue_number, estimated_minutes }),
  getNextQueue: (storeId) => api.get('/orders/store/' + storeId + '/next-queue'),
  delete: (id) => api.delete('/orders/' + id),
};


// Analytics API (대표 전용)
export const analyticsAPI = {
  getSales: (storeId, period, start, end) => {
    let url = '/analytics/' + storeId + '/sales?period=' + period;
    if (start) url += '&start=' + start;
    if (end) url += '&end=' + end;
    return api.get(url);
  },
  getComparison: (storeId, period) => api.get('/analytics/' + storeId + '/comparison?period=' + period),
  getProducts: (storeId, start, end, limit, sort) => {
    let url = '/analytics/' + storeId + '/products?limit=' + (limit || 10);
    if (start) url += '&start=' + start;
    if (end) url += '&end=' + end;
    if (sort) url += '&sort=' + sort;
    return api.get(url);
  },
  getStaff: (storeId, start, end) => {
    let url = '/analytics/' + storeId + '/staff';
    const params = [];
    if (start) params.push('start=' + start);
    if (end) params.push('end=' + end);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
  },
  getHourly: (storeId, start, end) => {
    let url = '/analytics/' + storeId + '/hourly';
    const params = [];
    if (start) params.push('start=' + start);
    if (end) params.push('end=' + end);
    if (params.length > 0) url += '?' + params.join('&');
    return api.get(url);
  }
};

export default api;

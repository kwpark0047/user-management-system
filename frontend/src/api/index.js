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
  delete: (id) => api.delete('/orders/' + id),
};

export default api;

import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authAPI = {
  register: (d: any) => api.post('/auth/register', d).then(r => r.data),
  login: (d: any) => api.post('/auth/login', d).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
};

export const transactionsAPI = {
  list: () => api.get('/transactions').then(r => r.data),
  create: (d: any) => api.post('/transactions', d).then(r => r.data),
  delete: (id: string) => api.delete(`/transactions/${id}`).then(r => r.data),
  getSummary: () => api.get('/transactions/summary').then(r => r.data),
};

export const categoriesAPI = {
  list: () => api.get('/categories').then(r => r.data),
  create: (d: any) => api.post('/categories', d).then(r => r.data),
  update: (id: string, d: any) => api.put(`/categories/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/categories/${id}`).then(r => r.data),
};

export const goalsAPI = {
  list: () => api.get('/goals').then(r => r.data),
  create: (d: any) => api.post('/goals', d).then(r => r.data),
  update: (id: string, d: any) => api.put(`/goals/${id}`, d).then(r => r.data),
  delete: (id: string) => api.delete(`/goals/${id}`).then(r => r.data),
};

export const salaryAPI = {
  get: (month: number, year: number) => api.get('/salary', { params: { month, year } }).then(r => r.data),
  set: (month: number, year: number, amount: number) => api.post('/salary', { month, year, amount }).then(r => r.data),
};
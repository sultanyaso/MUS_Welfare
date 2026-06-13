import axios from 'axios';

const api = axios.create({
  baseURL: 'https://mus-welfare.vercel.app/api' //use this for production (Vercel auto-sets BACKEND_URL in .env to this) - make sure to also set FRONTEND_URL in backend .env to https://mus-welfare-frontend.vercel.app/ and update CORS in backend/src/server.js accordingly    
  //baseURL: 'http://localhost:5000/api' // Use this for local development
});

// Attach JWT + smart Content-Type (don't override for FormData)
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('mus_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  register:  data => api.post('/auth/register', data),
  login:     data => api.post('/auth/login', data),
  me:        ()   => api.get('/auth/me'),
  seedAdmin: data => api.post('/auth/seed-admin', data),
};

export const adminAPI = {
  getStats:           ()             => api.get('/admin/stats'),
  getMembers:         (status='all', page=1) => api.get(`/admin/members?status=${status}&page=${page}`),
  approve:            id             => api.patch(`/admin/members/${id}/approve`),
  reject:             id             => api.patch(`/admin/members/${id}/reject`),
  deactivate:         id             => api.patch(`/admin/members/${id}/deactivate`),
  deleteMember:       id             => api.delete(`/admin/members/${id}`),
  // Pending self-payments
  getPendingPayments: ()             => api.get('/admin/pending-payments'),
  approvePayment:     (id, note='') => api.patch(`/admin/pending-payments/${id}/approve`, { adminNote: note }),
  rejectPayment:      (id, note='') => api.patch(`/admin/pending-payments/${id}/reject`,  { adminNote: note }),
};

export const paymentAPI = {
  record:            data          => api.post('/payments', data),
  getAll:            (params = {}) => api.get('/payments', { params }),
  getSummary:        (year)        => api.get('/payments/summary', { params: { year } }),
  getMemberPayments: (memberId)    => api.get(`/payments/member/${memberId}`),
  deletePayment:     id            => api.delete(`/payments/${id}`),
};

export const memberAPI = {
  getStats:       ()     => api.get('/member/stats'),
  getDirectory:   ()     => api.get('/member/directory'),
  getMyPayments:  ()     => api.get('/member/my-payments'),
  getOrgPayments: (year) => api.get('/member/org-payments', { params: { year } }),
  getSummary:     (year) => api.get('/member/summary', { params: { year } }),
  // FormData handles both qr (no file) and account (with screenshot)
  submitPayment:  (formData) => api.post('/member/submit-payment', formData),
};

//family tree api
export const familyAPI = {
  getAll:    ()           => api.get('/family-tree'),
  addMember: (data)       => api.post('/family-tree', data),
  update:    (id, data)   => api.patch(`/family-tree/${id}`, data),
  remove:    (id)         => api.delete(`/family-tree/${id}`),
};

export default api;
export const announcementAPI = {
  getAll:      ()         => api.get('/announcements'),
  create:      data       => api.post('/announcements', data),
  update:      (id, data) => api.patch(`/announcements/${id}`, data),
  delete:      id         => api.delete(`/announcements/${id}`),
  resendEmail: id         => api.post(`/announcements/${id}/resend-email`),
};
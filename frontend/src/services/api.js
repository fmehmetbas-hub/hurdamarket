import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://hurdamarket-backend.onrender.com/api',
  timeout: 15000,
});

// Her isteğe token ekle
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('hm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → login'e yönlendir
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hm_token');
      window.location.href = '/giris';
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const authApi = {
  sendOtp:  (phone)       => api.post('/auth/send-otp', { phone }),
  register: (data)        => api.post('/auth/register', data),
  login:    (phone, pass) => api.post('/auth/login', { phone, password: pass }),
  me:       ()            => api.get('/auth/me'),
  updateMe: (data)        => api.patch('/auth/me', data),
};

// ── Listings ──────────────────────────────────────
export const listingsApi = {
  getAll:   (params)      => api.get('/listings', { params }),
  getMine:  ()            => api.get('/listings/mine'),          // FIX: was using getAll with user_id param
  getForMap:(params)      => api.get('/listings/map', { params }), // FIX: moved from separate mapApi
  getById:  (id)          => api.get(`/listings/${id}`),
  create:   (data)        => api.post('/listings', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:   (id, data)    => api.put(`/listings/${id}`, data),
  delete:   (id)          => api.delete(`/listings/${id}`),
};

// ── Offers ────────────────────────────────────────
export const offersApi = {
  create:        (listingId, data) => api.post(`/listings/${listingId}/offers`, data),
  getForListing: (listingId)       => api.get(`/listings/${listingId}/offers`),
  updateStatus:  (offerId, status) => api.patch(`/offers/${offerId}`, { status }),
  getMine:       ()                => api.get('/offers/my'),
};

// ── Messages ──────────────────────────────────────
export const messagesApi = {
  getByOffer: (offerId) => api.get(`/messages/${offerId}`),
};

// ── Favorites ─────────────────────────────────────
export const favoritesApi = {
  toggle: (listingId) => api.post(`/favorites/${listingId}`),
  getAll: ()          => api.get('/favorites'),
  check:  (listingId) => api.get(`/favorites/check/${listingId}`),
};

// ── Notifications ─────────────────────────────────
export const notificationsApi = {
  getAll:      ()    => api.get('/notifications'),
  markRead:    (id)  => api.patch(`/notifications/${id}/read`),
  markAllRead: ()    => api.patch('/notifications/read-all'),
};

export default api;

// ── Admin ─────────────────────────────────────────
export const adminApi = {
  getStats:       ()              => api.get('/admin/stats'),
  getUsers:       (params)        => api.get('/admin/users', { params }),
  updateUser:     (id, data)      => api.patch(`/admin/users/${id}`, data),
  getListings:    (params)        => api.get('/admin/listings', { params }),
  updateListing:  (id, data)      => api.patch(`/admin/listings/${id}`, data),
  getReports:     (params)        => api.get('/admin/reports', { params }),
  updateReport:   (id, data)      => api.patch(`/admin/reports/${id}`, data),
};

export const reportsApi = {
  create: (data) => api.post('/reports', data),
};

// ── Payments ──────────────────────────────────────
export const paymentsApi = {
  getPlans:          ()            => api.get('/payments/plans'),
  getHistory:        ()            => api.get('/payments/history'),
  getSubscription:   ()            => api.get('/payments/subscription'),
  getCommissionInfo: (offerId)     => api.get(`/payments/commission-info/${offerId}`),
  initiateCommission:(offerId)     => api.post(`/payments/commission/${offerId}`),
  subscribe:         (planSlug, interval) => api.post('/payments/subscribe', { planSlug, interval }),
  cancelSubscription:()            => api.delete('/payments/subscription'),
  verifySession:     (sessionId)   => api.get(`/payments/verify-session/${sessionId}`),
};

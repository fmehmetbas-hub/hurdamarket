import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
});

// Token interceptor
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('hm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 handler
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await SecureStore.deleteItemAsync('hm_token');
      // Global event — navigation store bunu yakalar
      globalThis.__authExpired?.();
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────
export const authApi = {
  sendOtp:  (phone)            => api.post('/auth/send-otp', { phone }),
  register: (data)             => api.post('/auth/register', data),
  login:    (phone, password)  => api.post('/auth/login', { phone, password }),
  me:       ()                 => api.get('/auth/me'),
  updateMe: (data)             => api.patch('/auth/me', data),
};

// ── Listings ──────────────────────────────────────
export const listingsApi = {
  getAll:    (params)      => api.get('/listings', { params }),
  getMine:   ()            => api.get('/listings/mine'),
  getForMap: (params)      => api.get('/listings/map', { params }),
  getById:   (id)          => api.get(`/listings/${id}`),
  create:    (data)        => api.post('/listings', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  update:    (id, data)    => api.put(`/listings/${id}`, data),
  delete:    (id)          => api.delete(`/listings/${id}`),
};

// ── Offers ────────────────────────────────────────
export const offersApi = {
  create:        (listingId, data)  => api.post(`/listings/${listingId}/offers`, data),
  getForListing: (listingId)        => api.get(`/listings/${listingId}/offers`),
  updateStatus:  (offerId, status)  => api.patch(`/offers/${offerId}`, { status }),
  getMine:       ()                 => api.get('/offers/my'),
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
  getAll:      ()     => api.get('/notifications'),
  markRead:    (id)   => api.patch(`/notifications/${id}/read`),
  markAllRead: ()     => api.patch('/notifications/read-all'),
  registerPushToken: (token, platform) =>
    api.post('/notifications/push-token', { token, platform }),
};

// ── Payments ──────────────────────────────────────
export const paymentsApi = {
  getPlans:           ()          => api.get('/payments/plans'),
  getSubscription:    ()          => api.get('/payments/subscription'),
  getCommissionInfo:  (offerId)   => api.get(`/payments/commission-info/${offerId}`),
  initiateCommission: (offerId)   => api.post(`/payments/commission/${offerId}`),
  subscribe:          (planSlug, interval) =>
    api.post('/payments/subscribe', { planSlug, interval }),
};

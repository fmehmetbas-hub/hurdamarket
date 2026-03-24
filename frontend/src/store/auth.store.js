import { create } from 'zustand';
import { authApi } from '../services/api';

const useAuthStore = create((set) => ({
  user:    null,
  token:   localStorage.getItem('hm_token') || null,
  loading: false,

  login: async (phone, password) => {
    set({ loading: true });
    const { data } = await authApi.login(phone, password);
    localStorage.setItem('hm_token', data.token);
    set({ user: data.user, token: data.token, loading: false });
    return data.user;
  },

  register: async (formData) => {
    set({ loading: true });
    const { data } = await authApi.register(formData);
    localStorage.setItem('hm_token', data.token);
    set({ user: data.user, token: data.token, loading: false });
    return data.user;
  },

  fetchMe: async () => {
    try {
      const { data } = await authApi.me();
      set({ user: data.user });
    } catch {
      localStorage.removeItem('hm_token');
      set({ user: null, token: null });
    }
  },

  logout: () => {
    localStorage.removeItem('hm_token');
    set({ user: null, token: null });
    window.location.href = '/';
  },
}));

export default useAuthStore;

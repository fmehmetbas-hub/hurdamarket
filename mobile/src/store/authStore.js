import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { authApi } from '../services/api';

const useAuthStore = create((set, get) => ({
  user:    null,
  token:   null,
  loading: false,
  hydrated: false,

  // Uygulama açıldığında token'ı SecureStore'dan yükle
  hydrate: async () => {
    try {
      const token = await SecureStore.getItemAsync('hm_token');
      if (token) {
        set({ token });
        const { data } = await authApi.me();
        set({ user: data.user });
      }
    } catch {
      await SecureStore.deleteItemAsync('hm_token');
    } finally {
      set({ hydrated: true });
    }
  },

  login: async (phone, password) => {
    set({ loading: true });
    try {
      const { data } = await authApi.login(phone, password);
      await SecureStore.setItemAsync('hm_token', data.token);
      set({ user: data.user, token: data.token });
      return data.user;
    } finally {
      set({ loading: false });
    }
  },

  register: async (formData) => {
    set({ loading: true });
    try {
      const { data } = await authApi.register(formData);
      await SecureStore.setItemAsync('hm_token', data.token);
      set({ user: data.user, token: data.token });
      return data.user;
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('hm_token');
    set({ user: null, token: null });
  },

  updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),
}));

export default useAuthStore;

import { create } from 'zustand';
import { authAPI } from '../api';

const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('devplanner_user') || 'null'),
  token: localStorage.getItem('devplanner_token') || null,
  loading: false,

  login: async (email, password) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem('devplanner_token', data.token);
      localStorage.setItem('devplanner_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    }
  },

  register: async (name, email, password) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.register({ name, email, password });
      localStorage.setItem('devplanner_token', data.token);
      localStorage.setItem('devplanner_user', JSON.stringify(data.user));
      set({ user: data.user, token: data.token, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('devplanner_token');
    localStorage.removeItem('devplanner_user');
    set({ user: null, token: null });
  },

  updateProfile: async (data) => {
    try {
      const res = await authAPI.updateProfile(data);
      localStorage.setItem('devplanner_user', JSON.stringify(res.data.user));
      set({ user: res.data.user });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Update failed' };
    }
  },

  fetchUser: async () => {
    try {
      const { data } = await authAPI.getMe();
      localStorage.setItem('devplanner_user', JSON.stringify(data.user));
      set({ user: data.user });
    } catch {
      // Token invalid
      get().logout();
    }
  }
}));

export default useAuthStore;

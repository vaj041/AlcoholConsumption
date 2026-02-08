import { create } from 'zustand';
import type { User } from '../types';
import { authService } from '../services/authService';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || 'An error occurred';
  }
  return 'An error occurred';
};

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,
  isLoading: false,
  error: null,

  setToken: (token) => set({ token }),
  
  setUser: (user) => set({ user }),

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.login({ email, password });
      set({ token: response.token, user: response.user, isLoading: false });
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const response = await authService.register({ email, password });
      set({ token: response.token, user: response.user, isLoading: false });
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ token: null, user: null });
  },

  loadUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const user = await authService.getCurrentUser();
      set({ user, token });
    } catch {
      set({ token: null, user: null });
      localStorage.removeItem('token');
    }
  },
}));

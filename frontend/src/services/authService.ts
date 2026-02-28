import api from './api';
import type { AuditLogsResponse, AuthResponse, LoginCredentials, RegisterCredentials, UpdateUserRoleData, User } from '../types';

export const authService = {
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  async getUsers(): Promise<User[]> {
    const { data } = await api.get<User[]>('/auth/admin/users');
    return data;
  },

  async updateUserRole(userId: number, payload: UpdateUserRoleData): Promise<User> {
    const { data } = await api.patch<User>(`/auth/admin/users/${userId}/role`, payload);
    return data;
  },

  async getAuditLogs(page: number, pageSize: number): Promise<AuditLogsResponse> {
    const { data } = await api.get<AuditLogsResponse>(`/auth/admin/audit-logs?page=${page}&pageSize=${pageSize}`);
    return data;
  },

  logout() {
    localStorage.removeItem('token');
  },
};

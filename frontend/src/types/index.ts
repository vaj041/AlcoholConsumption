export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Drink {
  id: number;
  name: string;
  volumeMl: number;
  alcoholPct: number;
  userId: number;
  createdAt: string;
}

export interface Entry {
  id: number;
  date: string;
  quantity: number;
  drinkId: number;
  userId: number;
  createdAt: string;
  drink: Drink;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
}

export interface UpdateUserRoleData {
  role: UserRole;
}

export interface AuditLog {
  id: number;
  action: string;
  targetType: string;
  targetId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
  actorUser: {
    id: number;
    email: string;
  };
}

export interface AuditLogsResponse {
  page: number;
  pageSize: number;
  total: number;
  logs: AuditLog[];
}

export interface CreateEntryData {
  drinkId: number;
  quantity: number;
  date: string;
}

export interface StatsResponse {
  period: {
    from: string;
    to: string;
  };
  total: {
    pureAlcoholGrams: number;
    pureAlcoholMl: number;
    entries: number;
  };
  daily: Array<{
    date: string;
    grams: number;
    ml: number;
    entries: number;
  }>;
}

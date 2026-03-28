import api from './api';
import type { StatsResponse } from '../types';

export const statsService = {
  async getStats(from: string, to: string): Promise<StatsResponse> {
    const { data } = await api.get<StatsResponse>(`/stats?from=${from}&to=${to}`);
    return data;
  },
};

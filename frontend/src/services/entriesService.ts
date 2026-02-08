import api from './api';
import type { Entry } from '../types';

export const entriesService = {
  async getAll(from?: string, to?: string): Promise<Entry[]> {
    const params = new URLSearchParams();
    if (from) params.append('from', from);
    if (to) params.append('to', to);
    
    const { data } = await api.get<Entry[]>(`/entries?${params.toString()}`);
    return data;
  },

  async create(entry: { date: string; quantity: number; drinkId: number }): Promise<Entry> {
    const { data } = await api.post<Entry>('/entries', entry);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/entries/${id}`);
  },
};

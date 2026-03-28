import api from './api';
import type { Drink } from '../types';

export const drinksService = {
  async getAll(): Promise<Drink[]> {
    const { data } = await api.get<Drink[]>('/drinks');
    return data;
  },

  async create(drink: Omit<Drink, 'id' | 'userId' | 'createdAt'>): Promise<Drink> {
    const { data } = await api.post<Drink>('/drinks', drink);
    return data;
  },

  async update(id: number, drink: Partial<Omit<Drink, 'id' | 'userId' | 'createdAt'>>): Promise<Drink> {
    const { data } = await api.put<Drink>(`/drinks/${id}`, drink);
    return data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/drinks/${id}`);
  },
};

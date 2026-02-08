import { create } from 'zustand';
import type { Drink } from '../types';
import { drinksService } from '../services/drinksService';

const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error || 'An error occurred';
  }
  return 'An error occurred';
};

interface DrinksState {
  drinks: Drink[];
  isLoading: boolean;
  error: string | null;
  
  fetchDrinks: () => Promise<void>;
  addDrink: (drink: Omit<Drink, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateDrink: (id: number, drink: Partial<Omit<Drink, 'id' | 'userId' | 'createdAt'>>) => Promise<void>;
  deleteDrink: (id: number) => Promise<void>;
}

export const useDrinksStore = create<DrinksState>((set) => ({
  drinks: [],
  isLoading: false,
  error: null,

  fetchDrinks: async () => {
    try {
      set({ isLoading: true, error: null });
      const drinks = await drinksService.getAll();
      set({ drinks, isLoading: false });
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Failed to fetch drinks', 
        isLoading: false 
      });
    }
  },

  addDrink: async (drink) => {
    try {
      set({ isLoading: true, error: null });
      const newDrink = await drinksService.create(drink);
      set((state) => ({ 
        drinks: [newDrink, ...state.drinks], 
        isLoading: false 
      }));
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Failed to add drink', 
        isLoading: false 
      });
      throw error;
    }
  },

  updateDrink: async (id, drink) => {
    try {
      set({ isLoading: true, error: null });
      const updatedDrink = await drinksService.update(id, drink);
      set((state) => ({
        drinks: state.drinks.map((d) => (d.id === id ? updatedDrink : d)),
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Failed to update drink', 
        isLoading: false 
      });
      throw error;
    }
  },

  deleteDrink: async (id) => {
    try {
      set({ isLoading: true, error: null });
      await drinksService.delete(id);
      set((state) => ({
        drinks: state.drinks.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error: unknown) {
      set({ 
        error: getErrorMessage(error) || 'Failed to delete drink', 
        isLoading: false 
      });
      throw error;
    }
  },
}));

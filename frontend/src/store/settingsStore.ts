import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';

interface SettingsState {
  theme: ThemeMode;
  defaultDrinkId: number | null;
  setTheme: (theme: ThemeMode) => void;
  setDefaultDrinkId: (drinkId: number | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      defaultDrinkId: null,
      setTheme: (theme) => set({ theme }),
      setDefaultDrinkId: (defaultDrinkId) => set({ defaultDrinkId }),
    }),
    {
      name: 'app-settings',
    },
  ),
);

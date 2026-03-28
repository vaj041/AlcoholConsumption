import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'light' | 'dark';
export type LanguageMode = 'en' | 'cs';

interface SettingsState {
  theme: ThemeMode;
  language: LanguageMode;
  defaultDrinkId: number | null;
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: LanguageMode) => void;
  setDefaultDrinkId: (drinkId: number | null) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      defaultDrinkId: null,
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setDefaultDrinkId: (defaultDrinkId) => set({ defaultDrinkId }),
    }),
    {
      name: 'app-settings',
    },
  ),
);

import api from './api';
import type { SupportedLanguage, TranslationDictionary } from '../i18n/dictionary';

type TranslationsResponse = {
  lang: string;
  count: number;
  translations: TranslationDictionary;
};

export const translationsService = {
  async getTranslations(language: SupportedLanguage): Promise<TranslationDictionary> {
    const { data } = await api.get<TranslationsResponse>(`/translations?lang=${language}`);
    return data.translations ?? {};
  },
};

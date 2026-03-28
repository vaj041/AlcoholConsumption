import api from './api';
import type { SupportedLanguage, TranslationDictionary } from '../i18n/dictionary';

type TranslationsResponse = {
  lang: string;
  count: number;
  translations: TranslationDictionary;
};

type BulkUpsertItem = {
  code: string;
  text: string;
  description?: string;
};

type BulkUpsertResponse = {
  lang: string;
  upserted: number;
};

type AdminTermsResponse = {
  lang: string;
  count: number;
  terms: AdminTranslationTerm[];
};

export type AdminTranslationTerm = {
  code: string;
  description: string | null;
  text: string;
  updatedAt: string | null;
};

export const translationsService = {
  async getTranslations(language: SupportedLanguage): Promise<TranslationDictionary> {
    const { data } = await api.get<TranslationsResponse>(`/translations?lang=${language}`);
    return data.translations ?? {};
  },

  async bulkUpsert(language: SupportedLanguage, items: BulkUpsertItem[]): Promise<BulkUpsertResponse> {
    const { data } = await api.post<BulkUpsertResponse>('/translations/bulk-upsert', {
      lang: language,
      items,
    });

    return data;
  },

  async getAdminTerms(language: SupportedLanguage): Promise<AdminTranslationTerm[]> {
    const { data } = await api.get<AdminTermsResponse>(`/translations/admin/terms?lang=${language}`);
    return data.terms ?? [];
  },
};

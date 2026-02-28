import { DICTIONARIES, EN_DICTIONARY, type SupportedLanguage } from './dictionary';
import type { TranslationDictionary } from './dictionary';

export type TranslationParams = Record<string, string | number>;

class I18nService {
  private remoteDictionaries: Partial<Record<SupportedLanguage, TranslationDictionary>> = {};

  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = params[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  setRemoteDictionary(language: SupportedLanguage, dictionary: TranslationDictionary): void {
    this.remoteDictionaries[language] = dictionary;
  }

  clearRemoteDictionary(language: SupportedLanguage): void {
    delete this.remoteDictionaries[language];
  }

  tr(language: SupportedLanguage, code: string, fallback: string, params?: TranslationParams): string {
    const remoteDictionary = this.remoteDictionaries[language] ?? {};
    const dictionary = DICTIONARIES[language] ?? {};
    const text = remoteDictionary[code] ?? dictionary[code] ?? EN_DICTIONARY[code] ?? fallback;
    return this.interpolate(text, params);
  }
}

export const i18n = new I18nService();

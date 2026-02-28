import { DICTIONARIES, EN_DICTIONARY, type SupportedLanguage } from './dictionary';

export type TranslationParams = Record<string, string | number>;

class I18nService {
  private interpolate(template: string, params?: TranslationParams): string {
    if (!params) {
      return template;
    }

    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = params[key];
      return value === undefined || value === null ? '' : String(value);
    });
  }

  tr(language: SupportedLanguage, code: string, fallback: string, params?: TranslationParams): string {
    const dictionary = DICTIONARIES[language] ?? {};
    const text = dictionary[code] ?? EN_DICTIONARY[code] ?? fallback;
    return this.interpolate(text, params);
  }
}

export const i18n = new I18nService();

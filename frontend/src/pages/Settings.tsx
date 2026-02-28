import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import Button from '../components/Button';
import { useDrinksStore } from '../store/drinksStore';
import { useSettingsStore } from '../store/settingsStore';
import { tr } from '../i18n/tr';
import { translationsService } from '../services/translationsService';
import type { SupportedLanguage } from '../i18n/dictionary';

const pureAlcoholGramsPerDrink = (volumeMl: number, alcoholPct: number) => volumeMl * (alcoholPct / 100) * 0.789;

export default function Settings() {
  const { drinks, fetchDrinks, isLoading } = useDrinksStore();
  const { theme, language, defaultDrinkId, setTheme, setLanguage, setDefaultDrinkId } = useSettingsStore();
  const [adminLang, setAdminLang] = useState<SupportedLanguage>(language);
  const [termCode, setTermCode] = useState('');
  const [termText, setTermText] = useState('');
  const [termDescription, setTermDescription] = useState('');
  const [translationError, setTranslationError] = useState<string | null>(null);
  const [translationSuccess, setTranslationSuccess] = useState<string | null>(null);
  const [isSavingTranslation, setIsSavingTranslation] = useState(false);

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

  useEffect(() => {
    setAdminLang(language);
  }, [language]);

  const sortedDrinks = useMemo(() => {
    if (!defaultDrinkId) {
      return drinks;
    }

    return [...drinks].sort((a, b) => {
      if (a.id === defaultDrinkId) return -1;
      if (b.id === defaultDrinkId) return 1;
      return 0;
    });
  }, [drinks, defaultDrinkId]);

  const selectedDefaultDrink = drinks.find((drink) => drink.id === defaultDrinkId) ?? null;

  const handleSaveTranslation = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const code = termCode.trim();
    const text = termText.trim();
    const description = termDescription.trim();

    if (!code) {
      setTranslationSuccess(null);
      setTranslationError(tr.settings.translationsValidationCode());
      return;
    }

    if (!text) {
      setTranslationSuccess(null);
      setTranslationError(tr.settings.translationsValidationText());
      return;
    }

    try {
      setIsSavingTranslation(true);
      setTranslationError(null);
      setTranslationSuccess(null);

      await translationsService.bulkUpsert(adminLang, [
        {
          code,
          text,
          description: description || undefined,
        },
      ]);

      setTranslationSuccess(tr.settings.translationsSuccess());
    } catch {
      setTranslationError(tr.settings.translationsError());
    } finally {
      setIsSavingTranslation(false);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tr.settings.title()}</h1>

      <div className="grid gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{tr.settings.themeTitle()}</h2>
            <p className="text-sm text-base-content/70 mb-3">{tr.settings.themeDescription()}</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant={theme === 'light' ? 'primary' : 'outline'}
                onClick={() => setTheme('light')}
              >
                {tr.settings.themeLight()}
              </Button>
              <Button
                type="button"
                variant={theme === 'dark' ? 'primary' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                {tr.settings.themeDark()}
              </Button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{tr.settings.languageTitle()}</h2>
            <p className="text-sm text-base-content/70 mb-3">{tr.settings.languageDescription()}</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant={language === 'en' ? 'primary' : 'outline'}
                onClick={() => setLanguage('en')}
              >
                {tr.settings.languageEn()}
              </Button>
              <Button
                type="button"
                variant={language === 'cs' ? 'primary' : 'outline'}
                onClick={() => setLanguage('cs')}
              >
                {tr.settings.languageCs()}
              </Button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{tr.settings.defaultDrinkTitle()}</h2>
            <p className="text-sm text-base-content/70 mb-3">
              {tr.settings.defaultDrinkDescription()}
            </p>

            <div className="form-control max-w-xl">
              <label className="label">
                <span className="label-text">{tr.settings.defaultDrinkLabel()}</span>
              </label>
              <select
                className="select select-bordered"
                value={defaultDrinkId ?? ''}
                onChange={(e) => setDefaultDrinkId(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
              >
                <option value="">{tr.settings.defaultDrinkNone()}</option>
                {sortedDrinks.map((drink) => (
                  <option key={drink.id} value={drink.id}>
                    {drink.name} ({drink.volumeMl}ml, {drink.alcoholPct}%)
                  </option>
                ))}
              </select>
            </div>

            {selectedDefaultDrink && (
              <div className="mt-4 p-3 rounded-lg bg-base-200 text-sm">
                {tr.settings.defaultDrinkPureAlcohol(
                  selectedDefaultDrink.name,
                  pureAlcoholGramsPerDrink(selectedDefaultDrink.volumeMl, selectedDefaultDrink.alcoholPct).toFixed(1),
                )}
              </div>
            )}
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{tr.settings.translationsTitle()}</h2>
            <p className="text-sm text-base-content/70 mb-3">{tr.settings.translationsDescription()}</p>

            {translationSuccess && (
              <div className="alert alert-success mb-4">
                <span>{translationSuccess}</span>
              </div>
            )}

            {translationError && (
              <div className="alert alert-error mb-4">
                <span>{translationError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTranslation} className="grid gap-4 max-w-2xl">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsLanguage()}</span>
                </label>
                <select
                  className="select select-bordered"
                  value={adminLang}
                  onChange={(event) => setAdminLang(event.target.value as SupportedLanguage)}
                  disabled={isSavingTranslation}
                >
                  <option value="en">{tr.settings.languageEn()}</option>
                  <option value="cs">{tr.settings.languageCs()}</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsCode()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termCode}
                  onChange={(event) => setTermCode(event.target.value)}
                  placeholder={tr.settings.translationsCodePlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsText()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termText}
                  onChange={(event) => setTermText(event.target.value)}
                  placeholder={tr.settings.translationsTextPlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.settings.translationsNote()}</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered"
                  value={termDescription}
                  onChange={(event) => setTermDescription(event.target.value)}
                  placeholder={tr.settings.translationsNotePlaceholder()}
                  disabled={isSavingTranslation}
                />
              </div>

              <div>
                <Button type="submit" variant="primary" disabled={isSavingTranslation}>
                  {isSavingTranslation ? tr.settings.translationsSaving() : tr.settings.translationsSave()}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

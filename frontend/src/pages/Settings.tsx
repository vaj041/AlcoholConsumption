import { useEffect, useMemo } from 'react';
import Button from '../components/Button';
import { useDrinksStore } from '../store/drinksStore';
import { useSettingsStore } from '../store/settingsStore';
import { tr } from '../i18n/tr';

const pureAlcoholGramsPerDrink = (volumeMl: number, alcoholPct: number) => volumeMl * (alcoholPct / 100) * 0.789;

export default function Settings() {
  const { drinks, fetchDrinks, isLoading } = useDrinksStore();
  const { theme, language, defaultDrinkId, setTheme, setLanguage, setDefaultDrinkId } = useSettingsStore();

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

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
      </div>
    </div>
  );
}

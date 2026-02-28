import { useEffect, useMemo } from 'react';
import Button from '../components/Button';
import { useDrinksStore } from '../store/drinksStore';
import { useSettingsStore } from '../store/settingsStore';

const pureAlcoholGramsPerDrink = (volumeMl: number, alcoholPct: number) => volumeMl * (alcoholPct / 100) * 0.789;

export default function Settings() {
  const { drinks, fetchDrinks, isLoading } = useDrinksStore();
  const { theme, defaultDrinkId, setTheme, setDefaultDrinkId } = useSettingsStore();

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
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid gap-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Theme</h2>
            <p className="text-sm text-base-content/70 mb-3">Choose app appearance.</p>

            <div className="flex gap-3">
              <Button
                type="button"
                variant={theme === 'light' ? 'primary' : 'outline'}
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                type="button"
                variant={theme === 'dark' ? 'primary' : 'outline'}
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Default Drink</h2>
            <p className="text-sm text-base-content/70 mb-3">
              This drink will be used in Statistics to show average consumed drinks per day.
            </p>

            <div className="form-control max-w-xl">
              <label className="label">
                <span className="label-text">Default drink</span>
              </label>
              <select
                className="select select-bordered"
                value={defaultDrinkId ?? ''}
                onChange={(e) => setDefaultDrinkId(e.target.value ? Number(e.target.value) : null)}
                disabled={isLoading}
              >
                <option value="">No default drink</option>
                {sortedDrinks.map((drink) => (
                  <option key={drink.id} value={drink.id}>
                    {drink.name} ({drink.volumeMl}ml, {drink.alcoholPct}%)
                  </option>
                ))}
              </select>
            </div>

            {selectedDefaultDrink && (
              <div className="mt-4 p-3 rounded-lg bg-base-200 text-sm">
                1 {selectedDefaultDrink.name} ={' '}
                {pureAlcoholGramsPerDrink(selectedDefaultDrink.volumeMl, selectedDefaultDrink.alcoholPct).toFixed(1)}g pure alcohol
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { statsService } from '../services/statsService';
import type { StatsResponse } from '../types';

type PresetKey = 'prevWeek' | 'thisWeek' | 'prevMonth' | 'thisMonth';

type DateRange = {
  from: string;
  to: string;
};

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const startOfWeekMonday = (date: Date) => {
  const result = new Date(date);
  const weekday = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - weekday);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeekSunday = (date: Date) => {
  const result = startOfWeekMonday(date);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);

const getPresetRange = (preset: PresetKey): DateRange => {
  const now = new Date();

  if (preset === 'thisWeek') {
    return {
      from: toDateInput(startOfWeekMonday(now)),
      to: toDateInput(endOfWeekSunday(now)),
    };
  }

  if (preset === 'prevWeek') {
    const thisWeekStart = startOfWeekMonday(now);
    const prevWeekStart = new Date(thisWeekStart);
    prevWeekStart.setDate(thisWeekStart.getDate() - 7);
    const prevWeekEnd = endOfWeekSunday(prevWeekStart);

    return {
      from: toDateInput(prevWeekStart),
      to: toDateInput(prevWeekEnd),
    };
  }

  if (preset === 'thisMonth') {
    return {
      from: toDateInput(startOfMonth(now)),
      to: toDateInput(endOfMonth(now)),
    };
  }

  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return {
    from: toDateInput(startOfMonth(prevMonthDate)),
    to: toDateInput(endOfMonth(prevMonthDate)),
  };
};

const PRESET_LABELS: Record<PresetKey, string> = {
  prevWeek: 'Minulý týden',
  thisWeek: 'Tento týden',
  prevMonth: 'Minulý měsíc',
  thisMonth: 'Tento měsíc',
};

export default function Statistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activePreset, setActivePreset] = useState<PresetKey | null>('thisWeek');
  const [fromDate, setFromDate] = useState(() => getPresetRange('thisWeek').from);
  const [toDate, setToDate] = useState(() => getPresetRange('thisWeek').to);

  const loadStats = async (from: string, to: string) => {
    try {
      setIsLoading(true);
      setError('');
      const data = await statsService.getStats(from, to);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initialRange = getPresetRange('thisWeek');
    loadStats(initialRange.from, initialRange.to);
  }, []);

  const handlePresetClick = (preset: PresetKey) => {
    const range = getPresetRange(preset);
    setActivePreset(preset);
    setFromDate(range.from);
    setToDate(range.to);
    loadStats(range.from, range.to);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset(null);
    loadStats(fromDate, toDate);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Statistics</h1>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Předvolené období</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(PRESET_LABELS) as PresetKey[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className={`btn ${activePreset === preset ? 'btn-primary' : 'btn-outline'}`}
                disabled={isLoading}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Vlastní rozsah (volitelné)</h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">From</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setActivePreset(null);
                }}
                className="input input-bordered"
                required
              />
            </div>
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">To</span>
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setActivePreset(null);
                }}
                className="input input-bordered"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? 'Loading...' : 'Load Statistics'}
            </button>
          </form>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="card bg-primary text-primary-content shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Total Pure Alcohol</h2>
                <p className="text-3xl font-bold">{stats.total.pureAlcoholGrams.toFixed(1)}g</p>
                <p className="text-sm opacity-80">{stats.total.pureAlcoholMl.toFixed(1)}ml</p>
              </div>
            </div>

            <div className="card bg-secondary text-secondary-content shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Total Entries</h2>
                <p className="text-3xl font-bold">{stats.total.entries}</p>
                <p className="text-sm opacity-80">drinks consumed</p>
              </div>
            </div>

            <div className="card bg-accent text-accent-content shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Daily Average</h2>
                <p className="text-3xl font-bold">
                  {stats.daily.length > 0
                    ? (stats.total.pureAlcoholGrams / stats.daily.length).toFixed(1)
                    : '0.0'}
                  g
                </p>
                <p className="text-sm opacity-80">per day</p>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Daily Breakdown</h2>
              {stats.daily.length === 0 ? (
                <p className="text-center text-base-content/60 py-8">No data for selected period</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Entries</th>
                        <th>Pure Alcohol (ml)</th>
                        <th>Pure Alcohol (g)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.daily.map((day) => (
                        <tr key={day.date}>
                          <td>
                            {new Date(day.date).toLocaleDateString('cs-CZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td>{day.entries}</td>
                          <td>{day.ml.toFixed(1)} ml</td>
                          <td className="font-semibold">{day.grams.toFixed(1)} g</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!stats && !isLoading && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-center text-base-content/60">
              Select a date range and click "Load Statistics" to view your consumption data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

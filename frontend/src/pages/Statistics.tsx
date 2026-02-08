import { useState } from 'react';
import { statsService } from '../services/statsService';
import type { StatsResponse } from '../types';

export default function Statistics() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await statsService.getStats(fromDate, toDate);
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStats();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Statistics</h1>

      <div className="card bg-base-100 shadow-xl mb-6">
        <div className="card-body">
          <h2 className="card-title">Select Date Range</h2>
          <form onSubmit={handleSubmit} className="flex gap-4 items-end">
            <div className="form-control flex-1">
              <label className="label">
                <span className="label-text">From</span>
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
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
                onChange={(e) => setToDate(e.target.value)}
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

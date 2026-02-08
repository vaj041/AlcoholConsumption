import { useEffect, useState } from 'react';
import { entriesService } from '../services/entriesService';
import type { Entry } from '../types';

export default function History() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await entriesService.getAll();
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await entriesService.delete(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
    }
  };

  const calculatePureAlcohol = (entry: Entry) => {
    const volumeMl = entry.drink.volumeMl * entry.quantity;
    const pureAlcoholMl = volumeMl * (entry.drink.alcoholPct / 100);
    const pureAlcoholGrams = pureAlcoholMl * 0.789;
    return { ml: pureAlcoholMl.toFixed(1), grams: pureAlcoholGrams.toFixed(1) };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('cs-CZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">History</h1>
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">History</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-center text-base-content/60">No entries yet. Start tracking your consumption!</p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map((entry) => {
            const pureAlcohol = calculatePureAlcohol(entry);
            return (
              <div key={entry.id} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h2 className="card-title text-primary">{entry.drink.name}</h2>
                      <p className="text-sm text-base-content/60">{formatDate(entry.date)}</p>
                      <div className="mt-2 space-y-1">
                        <p>
                          <span className="font-semibold">Quantity:</span> {entry.quantity}x
                        </p>
                        <p>
                          <span className="font-semibold">Volume:</span> {entry.drink.volumeMl}ml × {entry.quantity} = {(entry.drink.volumeMl * entry.quantity).toFixed(0)}ml
                        </p>
                        <p>
                          <span className="font-semibold">Alcohol:</span> {entry.drink.alcoholPct}%
                        </p>
                        <p className="text-lg font-bold text-accent">
                          Pure alcohol: {pureAlcohol.ml}ml ({pureAlcohol.grams}g)
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="btn btn-error btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

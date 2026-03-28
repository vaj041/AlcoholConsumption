import { useEffect, useState } from 'react';
import { entriesService } from '../services/entriesService';
import Button from '../components/Button';
import { tr } from '../i18n/tr';
import { useSettingsStore } from '../store/settingsStore';
import type { Entry } from '../types';

export default function History() {
  const language = useSettingsStore((state) => state.language);
  const locale = language === 'cs' ? 'cs-CZ' : 'en-GB';
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editDate, setEditDate] = useState('');

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
      setError(err instanceof Error ? err.message : tr.history.errorLoad());
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (entry: Entry) => {
    setEditingEntry(entry);
    setEditQuantity(entry.quantity.toString());
    setEditDate(new Date(entry.date).toISOString().split('T')[0]);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditQuantity('');
    setEditDate('');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    try {
      const updatedEntry = await entriesService.update(editingEntry.id, {
        quantity: parseFloat(editQuantity),
        date: new Date(editDate).toISOString(),
      });

      setEntries(entries.map((e) => (e.id === updatedEntry.id ? updatedEntry : e)));
      handleCancelEdit();
    } catch (err) {
      alert(err instanceof Error ? err.message : tr.history.errorUpdate());
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(tr.history.deleteConfirm())) return;

    try {
      await entriesService.delete(id);
      setEntries(entries.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : tr.history.errorDelete());
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
    return date.toLocaleDateString(locale, {
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
        <h1 className="text-3xl font-bold mb-6">{tr.history.title()}</h1>
        <div className="flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{tr.history.title()}</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <p className="text-center text-base-content/60">{tr.history.empty()}</p>
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
                          <span className="font-semibold">{tr.history.quantity()}:</span> {entry.quantity}x
                        </p>
                        <p>
                          <span className="font-semibold">{tr.history.volume()}:</span> {entry.drink.volumeMl}ml × {entry.quantity} = {(entry.drink.volumeMl * entry.quantity).toFixed(0)}ml
                        </p>
                        <p>
                          <span className="font-semibold">{tr.history.alcohol()}:</span> {entry.drink.alcoholPct}%
                        </p>
                        <p className="text-lg font-bold text-accent">
                          {tr.history.pureAlcohol()}: {pureAlcohol.ml}ml ({pureAlcohol.grams}g)
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleEdit(entry)}
                        variant="secondary"
                        className="btn-sm"
                      >
                        {tr.common.edit()}
                      </Button>
                      <Button
                        onClick={() => handleDelete(entry.id)}
                        variant="danger"
                        className="btn-sm"
                      >
                        {tr.common.delete()}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingEntry && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">{tr.history.editTitle(editingEntry.drink.name)}</h3>
            
            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.history.quantity()}</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  className="input input-bordered"
                  min="0.1"
                  max="100"
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">{tr.dashboard.date()}</span>
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="modal-action">
              <Button onClick={handleCancelEdit} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} variant="primary">
                {tr.common.save()}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

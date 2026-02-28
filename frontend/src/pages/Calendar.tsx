import { useEffect, useMemo, useState } from 'react';
import Button from '../components/Button';
import { entriesService } from '../services/entriesService';
import { useDrinksStore } from '../store/drinksStore';
import { useSettingsStore } from '../store/settingsStore';
import type { Entry } from '../types';

type DayCell = {
  date: Date;
  dateKey: string;
  inCurrentMonth: boolean;
};

type DayStats = {
  entries: Entry[];
  totalMl: number;
  totalGrams: number;
};

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const getDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('cs-CZ', {
    month: 'long',
    year: 'numeric',
  });

const getCalendarDays = (monthDate: Date): DayCell[] => {
  const startOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const endOfMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

  const firstWeekday = (startOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(startOfMonth);
  gridStart.setDate(startOfMonth.getDate() - firstWeekday);

  const lastWeekday = (endOfMonth.getDay() + 6) % 7;
  const trailingDays = 6 - lastWeekday;

  const totalCells = firstWeekday + endOfMonth.getDate() + trailingDays;

  return Array.from({ length: totalCells }, (_, index) => {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);

    return {
      date: cellDate,
      dateKey: getDateKey(cellDate),
      inCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
    };
  });
};

const getDayStats = (entries: Entry[]): DayStats => {
  let totalMl = 0;
  let totalGrams = 0;

  entries.forEach((entry) => {
    const volumeMl = entry.drink.volumeMl * entry.quantity;
    const pureAlcoholMl = volumeMl * (entry.drink.alcoholPct / 100);
    const pureAlcoholGrams = pureAlcoholMl * 0.789;

    totalMl += pureAlcoholMl;
    totalGrams += pureAlcoholGrams;
  });

  return {
    entries,
    totalMl,
    totalGrams,
  };
};

const getTooltipText = (
  stats: DayStats | undefined,
  defaultDrinkName: string | null,
  defaultDrinkPureAlcoholGrams: number | null,
): string => {
  if (!stats || stats.entries.length === 0) {
    return 'No drinks';
  }

  const topDrinks = stats.entries
    .slice(0, 3)
    .map((entry) => `${entry.drink.name} (${entry.quantity}x)`)
    .join(', ');

  const defaultDrinkPart =
    defaultDrinkName && defaultDrinkPureAlcoholGrams && defaultDrinkPureAlcoholGrams > 0
      ? ` • ≈ ${(stats.totalGrams / defaultDrinkPureAlcoholGrams).toFixed(1)} ${defaultDrinkName}`
      : '';

  return `${stats.entries.length} entries • ${stats.totalGrams.toFixed(1)}g alcohol${defaultDrinkPart} • ${topDrinks}`;
};

export default function Calendar() {
  const { drinks, fetchDrinks } = useDrinksStore();
  const defaultDrinkId = useSettingsStore((state) => state.defaultDrinkId);

  const [monthDate, setMonthDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDrinkId, setSelectedDrinkId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDayModalOpen, setIsDayModalOpen] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('1');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);

  const calendarDays = useMemo(() => getCalendarDays(monthDate), [monthDate]);

  const entriesByDay = useMemo(() => {
    const grouped = new Map<string, Entry[]>();

    entries.forEach((entry) => {
      const key = getDateKey(new Date(entry.date));
      const current = grouped.get(key) ?? [];
      grouped.set(key, [...current, entry]);
    });

    return grouped;
  }, [entries]);

  const statsByDay = useMemo(() => {
    const result = new Map<string, DayStats>();

    entriesByDay.forEach((dayEntries, dateKey) => {
      result.set(dateKey, getDayStats(dayEntries));
    });

    return result;
  }, [entriesByDay]);

  const selectedDayEntries = useMemo(() => {
    if (!selectedDayKey) {
      return [];
    }

    const dayEntries = entriesByDay.get(selectedDayKey) ?? [];
    return [...dayEntries].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entriesByDay, selectedDayKey]);

  const selectedDayStats = useMemo(() => getDayStats(selectedDayEntries), [selectedDayEntries]);

  const selectedDefaultDrink = drinks.find((drink) => drink.id === defaultDrinkId) ?? null;

  const defaultDrinkPureAlcoholGrams = selectedDefaultDrink
    ? selectedDefaultDrink.volumeMl * (selectedDefaultDrink.alcoholPct / 100) * 0.789
    : null;

  const selectedDayDefaultDrinks =
    defaultDrinkPureAlcoholGrams && defaultDrinkPureAlcoholGrams > 0
      ? selectedDayStats.totalGrams / defaultDrinkPureAlcoholGrams
      : null;

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

  useEffect(() => {
    loadMonthEntries(monthDate);
  }, [monthDate]);

  const loadMonthEntries = async (dateInMonth: Date) => {
    try {
      setIsLoading(true);
      setError('');

      const from = getDateKey(new Date(dateInMonth.getFullYear(), dateInMonth.getMonth(), 1));
      const to = getDateKey(new Date(dateInMonth.getFullYear(), dateInMonth.getMonth() + 1, 0));

      const data = await entriesService.getAll(from, to);
      setEntries(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calendar entries');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = (dateKey: string) => {
    setSelectedDate(dateKey);
    setSelectedDrinkId(drinks[0] ? String(drinks[0].id) : '');
    setQuantity('1');
    setIsModalOpen(true);
  };

  const openDayModal = (dateKey: string) => {
    setSelectedDayKey(dateKey);
    setEditingEntryId(null);
    setEditQuantity('1');
    setIsDayModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDate('');
    setSelectedDrinkId('');
    setQuantity('1');
  };

  const closeDayModal = () => {
    setIsDayModalOpen(false);
    setSelectedDayKey('');
    setEditingEntryId(null);
    setEditQuantity('1');
  };

  const startEditEntry = (entry: Entry) => {
    setEditingEntryId(entry.id);
    setEditQuantity(String(entry.quantity));
  };

  const cancelEditEntry = () => {
    setEditingEntryId(null);
    setEditQuantity('1');
  };

  const handleSaveEdit = async (entryId: number) => {
    try {
      setIsEditing(true);
      const updatedEntry = await entriesService.update(entryId, {
        quantity: Number(editQuantity),
      });

      setEntries((prev) => prev.map((entry) => (entry.id === entryId ? updatedEntry : entry)));
      cancelEditEntry();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update entry');
    } finally {
      setIsEditing(false);
    }
  };

  const handleDeleteEntry = async (entryId: number) => {
    if (!confirm('Are you sure you want to delete this entry?')) {
      return;
    }

    try {
      setIsDeletingId(entryId);
      await entriesService.delete(entryId);
      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete entry');
    } finally {
      setIsDeletingId(null);
    }
  };

  const openAddModalFromDay = () => {
    if (!selectedDayKey) {
      return;
    }

    setIsDayModalOpen(false);
    openAddModal(selectedDayKey);
  };

  const handleAddEntry = async () => {
    if (!selectedDate || !selectedDrinkId) {
      return;
    }

    try {
      setIsSubmitting(true);
      await entriesService.create({
        drinkId: Number(selectedDrinkId),
        quantity: Number(quantity),
        date: new Date(selectedDate).toISOString(),
      });

      await loadMonthEntries(monthDate);
      closeModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goPrevMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goNextMonth = () => {
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>

        <div className="join">
          <Button type="button" variant="outline" className="join-item" onClick={goPrevMonth}>
            ←
          </Button>
          <Button type="button" variant="outline" className="join-item btn-ghost min-w-52 pointer-events-none">
            {getMonthLabel(monthDate)}
          </Button>
          <Button type="button" variant="outline" className="join-item" onClick={goNextMonth}>
            →
          </Button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {WEEK_DAYS.map((weekday) => (
              <div key={weekday} className="text-center text-sm font-semibold text-base-content/70 py-2">
                {weekday}
              </div>
            ))}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                const dayStats = statsByDay.get(day.dateKey);
                const isToday = day.dateKey === getDateKey(new Date());

                return (
                  <div
                    key={day.dateKey}
                    className={`tooltip tooltip-top min-h-28 rounded-lg border p-2 flex flex-col ${
                      day.inCurrentMonth ? 'bg-base-100 border-base-300' : 'bg-base-200/50 border-base-300/60'
                    } ${isToday ? 'ring-2 ring-primary' : ''}`}
                    data-tip={getTooltipText(
                      dayStats,
                      selectedDefaultDrink?.name ?? null,
                      defaultDrinkPureAlcoholGrams,
                    )}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDayModal(day.dateKey)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        openDayModal(day.dateKey);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${day.inCurrentMonth ? '' : 'text-base-content/50'}`}>
                        {day.date.getDate()}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        className="btn-ghost btn-xs"
                        onClick={(event) => {
                          event.stopPropagation();
                          openAddModal(day.dateKey);
                        }}
                        title="Add drink"
                      >
                        +
                      </Button>
                    </div>

                    {dayStats && dayStats.entries.length > 0 ? (
                      <div className="mt-auto space-y-1">
                        <div className="badge badge-primary badge-sm">{dayStats.entries.length} entries</div>
                        <div className="text-xs text-base-content/70">{dayStats.totalGrams.toFixed(1)}g alcohol</div>
                        {defaultDrinkPureAlcoholGrams && defaultDrinkPureAlcoholGrams > 0 && selectedDefaultDrink && (
                          <div className="text-xs text-base-content/70">
                            ≈ {(dayStats.totalGrams / defaultDrinkPureAlcoholGrams).toFixed(1)} {selectedDefaultDrink.name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-auto text-xs text-base-content/50">No drinks</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add drink for {selectedDate}</h3>

            <div className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Drink</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={selectedDrinkId}
                  onChange={(e) => setSelectedDrinkId(e.target.value)}
                  disabled={drinks.length === 0 || isSubmitting}
                >
                  {drinks.length === 0 ? (
                    <option value="">No drinks available</option>
                  ) : (
                    drinks.map((drink) => (
                      <option key={drink.id} value={drink.id}>
                        {drink.name} ({drink.volumeMl}ml, {drink.alcoholPct}%)
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  className="input input-bordered"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="modal-action">
              <Button type="button" variant="outline" onClick={closeModal} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleAddEntry}
                disabled={isSubmitting || !selectedDrinkId}
              >
                {isSubmitting ? 'Saving...' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isDayModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-lg">Entries for {selectedDayKey}</h3>
                <p className="text-sm text-base-content/70">
                  {selectedDayEntries.length} entries • {selectedDayStats.totalGrams.toFixed(1)}g alcohol
                </p>
                {selectedDayDefaultDrinks !== null && selectedDefaultDrink && (
                  <p className="text-sm text-base-content/70">
                    ≈ {selectedDayDefaultDrinks.toFixed(1)} {selectedDefaultDrink.name}
                  </p>
                )}
              </div>
              <Button type="button" variant="primary" className="btn-sm" onClick={openAddModalFromDay}>
                + Add drink
              </Button>
            </div>

            {selectedDayEntries.length === 0 ? (
              <div className="text-sm text-base-content/60 py-4">No drinks on this day.</div>
            ) : (
              <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                {selectedDayEntries.map((entry) => {
                  const volumeMl = entry.drink.volumeMl * entry.quantity;
                  const pureAlcoholMl = volumeMl * (entry.drink.alcoholPct / 100);
                  const pureAlcoholGrams = pureAlcoholMl * 0.789;
                  const isEditingThis = editingEntryId === entry.id;

                  return (
                    <div key={entry.id} className="border border-base-300 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{entry.drink.name}</div>
                          <div className="text-sm text-base-content/70">
                            {entry.drink.volumeMl}ml • {entry.drink.alcoholPct}%
                          </div>
                          <div className="text-xs text-base-content/60">
                            {new Date(entry.date).toLocaleTimeString('cs-CZ', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">{pureAlcoholMl.toFixed(1)}ml</div>
                          <div className="font-semibold text-accent">{pureAlcoholGrams.toFixed(1)}g</div>
                        </div>
                      </div>

                      {isEditingThis ? (
                        <div className="mt-3 flex items-center gap-2">
                          <input
                            type="number"
                            min="0.1"
                            step="0.1"
                            className="input input-bordered input-sm w-28"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            disabled={isEditing}
                          />
                          <Button
                            type="button"
                            variant="primary"
                            className="btn-sm"
                            onClick={() => handleSaveEdit(entry.id)}
                            disabled={isEditing}
                          >
                            {isEditing ? 'Saving...' : 'Save'}
                          </Button>
                          <Button type="button" variant="outline" className="btn-ghost btn-sm" onClick={cancelEditEntry} disabled={isEditing}>
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3 flex items-center gap-2">
                          <div className="badge badge-outline">Quantity: {entry.quantity}x</div>
                          <Button type="button" variant="secondary" className="btn-sm" onClick={() => startEditEntry(entry)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            className="btn-sm"
                            onClick={() => handleDeleteEntry(entry.id)}
                            disabled={isDeletingId === entry.id}
                          >
                            {isDeletingId === entry.id ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="modal-action">
              <Button type="button" variant="outline" onClick={closeDayModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

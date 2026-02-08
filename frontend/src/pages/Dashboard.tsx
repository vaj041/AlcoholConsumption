import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDrinksStore } from '../store/drinksStore';
import { entriesService } from '../services/entriesService';
import type { CreateEntryData, Entry } from '../types';

interface EntryFormData {
  drinkId: string;
  quantity: number;
  date: string;
}

export default function Dashboard() {
  const { drinks, fetchDrinks } = useDrinksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [todayEntries, setTodayEntries] = useState<Entry[]>([]);
  const [isLoadingToday, setIsLoadingToday] = useState(true);
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EntryFormData>({
    defaultValues: {
      date: new Date().toISOString().split('T')[0]
    }
  });

  useEffect(() => {
    fetchDrinks();
    loadTodayEntries();
  }, [fetchDrinks]);

  const loadTodayEntries = async () => {
    try {
      setIsLoadingToday(true);
      const today = new Date().toISOString().split('T')[0];
      const allEntries = await entriesService.getAll();
      const todaysEntries = allEntries.filter(entry => 
        entry.date.startsWith(today)
      );
      setTodayEntries(todaysEntries);
    } catch (err) {
      console.error('Failed to load today entries:', err);
    } finally {
      setIsLoadingToday(false);
    }
  };

  const calculateTodayStats = () => {
    let totalGrams = 0;
    let totalMl = 0;

    todayEntries.forEach(entry => {
      const volumeMl = entry.drink.volumeMl * entry.quantity;
      const pureAlcoholMl = volumeMl * (entry.drink.alcoholPct / 100);
      const pureAlcoholGrams = pureAlcoholMl * 0.789;
      totalMl += pureAlcoholMl;
      totalGrams += pureAlcoholGrams;
    });

    return { totalGrams, totalMl };
  };

  const onSubmit = async (data: EntryFormData) => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      setSuccessMessage('');

      const entryData: CreateEntryData = {
        drinkId: parseInt(data.drinkId),
        quantity: data.quantity,
        date: new Date(data.date).toISOString()
      };

      await entriesService.create(entryData);
      setSuccessMessage('Entry added successfully!');
      reset({
        drinkId: '',
        quantity: 1,
        date: new Date().toISOString().split('T')[0]
      });
      
      // Reload today's entries if the added entry is for today
      const today = new Date().toISOString().split('T')[0];
      if (data.date === today) {
        loadTodayEntries();
      }
      
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to add entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const todayStats = calculateTodayStats();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <div className="grid gap-4">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Quick Add Entry</h2>
            
            {successMessage && (
              <div className="alert alert-success">
                <span>{successMessage}</span>
              </div>
            )}
            
            {errorMessage && (
              <div className="alert alert-error">
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Drink</span>
                </label>
                <select
                  {...register('drinkId', { required: 'Please select a drink' })}
                  className="select select-bordered w-full"
                  disabled={isSubmitting || drinks.length === 0}
                >
                  <option value="">Select a drink...</option>
                  {drinks.map((drink) => (
                    <option key={drink.id} value={drink.id}>
                      {drink.name} ({drink.volumeMl}ml, {drink.alcoholPct}%)
                    </option>
                  ))}
                </select>
                {errors.drinkId && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.drinkId.message}</span>
                  </label>
                )}
                {drinks.length === 0 && (
                  <label className="label">
                    <span className="label-text-alt text-warning">No drinks available. Add drinks first.</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Quantity</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  {...register('quantity', {
                    required: 'Quantity is required',
                    min: { value: 0.1, message: 'Quantity must be at least 0.1' },
                    max: { value: 100, message: 'Quantity must be at most 100' }
                  })}
                  className="input input-bordered w-full"
                  placeholder="1"
                  disabled={isSubmitting}
                />
                {errors.quantity && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.quantity.message}</span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  {...register('date', { required: 'Date is required' })}
                  className="input input-bordered w-full"
                  disabled={isSubmitting}
                />
                {errors.date && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.date.message}</span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isSubmitting || drinks.length === 0}
              >
                {isSubmitting ? 'Adding...' : 'Add Entry'}
              </button>
            </form>
          </div>
        </div>
        
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Today's Summary</h2>
            {isLoadingToday ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : todayEntries.length === 0 ? (
              <p className="text-base-content/60">No entries for today yet</p>
            ) : (
              <div className="space-y-4">
                <div className="stats shadow w-full">
                  <div className="stat">
                    <div className="stat-title">Entries Today</div>
                    <div className="stat-value text-primary">{todayEntries.length}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Pure Alcohol</div>
                    <div className="stat-value text-secondary">{todayStats.totalGrams.toFixed(1)}g</div>
                    <div className="stat-desc">{todayStats.totalMl.toFixed(1)}ml</div>
                  </div>
                </div>
                
                <div className="divider">Today's Drinks</div>
                
                <div className="space-y-2">
                  {todayEntries.map(entry => {
                    const volumeMl = entry.drink.volumeMl * entry.quantity;
                    const pureAlcoholMl = volumeMl * (entry.drink.alcoholPct / 100);
                    const pureAlcoholGrams = pureAlcoholMl * 0.789;
                    
                    return (
                      <div key={entry.id} className="flex justify-between items-center p-3 bg-base-200 rounded-lg">
                        <div>
                          <p className="font-semibold">{entry.drink.name}</p>
                          <p className="text-sm text-base-content/60">
                            {entry.quantity}x {entry.drink.volumeMl}ml ({entry.drink.alcoholPct}%)
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-accent">{pureAlcoholGrams.toFixed(1)}g</p>
                          <p className="text-xs text-base-content/60">{pureAlcoholMl.toFixed(1)}ml</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

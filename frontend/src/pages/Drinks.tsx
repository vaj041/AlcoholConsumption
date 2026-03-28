import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDrinksStore } from '../store/drinksStore';
import Button from '../components/Button';
import { tr } from '../i18n/tr';

interface DrinkForm {
  name: string;
  volumeMl: number;
  alcoholPct: number;
}

export default function Drinks() {
  const { drinks, isLoading, fetchDrinks, addDrink, deleteDrink } = useDrinksStore();
  const { register, handleSubmit, reset, formState: { errors } } = useForm<DrinkForm>();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchDrinks();
  }, [fetchDrinks]);

  const onSubmit = async (data: DrinkForm) => {
    try {
      await addDrink(data);
      reset();
      setShowForm(false);
    } catch (error) {
      console.error(tr.drinks.addFailed(), error);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm(tr.drinks.deleteConfirm())) {
      await deleteDrink(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{tr.drinks.title()}</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? tr.drinks.cancel() : tr.drinks.addDrink()}
        </Button>
      </div>

      {showForm && (
        <div className="card bg-base-100 shadow-xl mb-6">
          <div className="card-body">
            <h2 className="card-title">{tr.drinks.newDrink()}</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label">
                    <span className="label-text">{tr.drinks.name()}</span>
                </label>
                <input
                  type="text"
                  placeholder={tr.drinks.namePlaceholder()}
                  className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
                  {...register('name', { required: tr.drinks.validationNameRequired() })}
                />
                {errors.name && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.name.message}</span>
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{tr.drinks.volume()}</span>
                  </label>
                  <input
                    type="number"
                    placeholder={tr.drinks.volumePlaceholder()}
                    className={`input input-bordered ${errors.volumeMl ? 'input-error' : ''}`}
                    {...register('volumeMl', { 
                      required: tr.drinks.validationVolumeRequired(),
                      min: { value: 1, message: tr.drinks.validationVolumePositive() }
                    })}
                  />
                  {errors.volumeMl && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.volumeMl.message}</span>
                    </label>
                  )}
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">{tr.drinks.alcohol()}</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder={tr.drinks.alcoholPlaceholder()}
                    className={`input input-bordered ${errors.alcoholPct ? 'input-error' : ''}`}
                    {...register('alcoholPct', { 
                      required: tr.drinks.validationAlcoholRequired(),
                      min: { value: 0, message: tr.drinks.validationPositive() },
                      max: { value: 100, message: tr.drinks.validationMax100() }
                    })}
                  />
                  {errors.alcoholPct && (
                    <label className="label">
                      <span className="label-text-alt text-error">{errors.alcoholPct.message}</span>
                    </label>
                  )}
                </div>
              </div>

              <Button type="submit" variant="primary" className="w-full">
                {tr.drinks.addDrinkSubmit()}
              </Button>
            </form>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : (
        <div className="grid gap-4">
          {drinks.map((drink) => (
            <div key={drink.id} className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="card-title">{drink.name}</h2>
                    <p className="text-base-content/70">
                      {drink.volumeMl}ml • {drink.alcoholPct}% alcohol
                    </p>
                    <p className="text-sm text-base-content/50 mt-2">
                      Pure alcohol: {(drink.volumeMl * (drink.alcoholPct / 100) * 0.789).toFixed(1)}g
                    </p>
                  </div>
                  <Button
                    variant="danger"
                    className="btn-sm"
                    onClick={() => handleDelete(drink.id)}
                  >
                    {tr.drinks.delete()}
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {drinks.length === 0 && (
            <div className="text-center py-12 text-base-content/50">
              {tr.drinks.empty()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

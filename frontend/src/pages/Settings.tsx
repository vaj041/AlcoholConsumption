import { useEffect, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { FormProvider, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button';
import PasswordFields, { type PasswordFieldsValues } from '../components/PasswordFields';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { useDrinksStore } from '../store/drinksStore';
import { useSettingsStore } from '../store/settingsStore';
import { tr } from '../i18n/tr';

const pureAlcoholGramsPerDrink = (volumeMl: number, alcoholPct: number) => volumeMl * (alcoholPct / 100) * 0.789;

type ChangePasswordForm = PasswordFieldsValues & { currentPassword: string };

export default function Settings() {
  const { drinks, fetchDrinks, isLoading } = useDrinksStore();
  const { theme, language, defaultDrinkId, setTheme, setLanguage, setDefaultDrinkId } = useSettingsStore();
  const form = useForm<ChangePasswordForm>();
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const changePassword = async ({ currentPassword, newPassword }: ChangePasswordForm) => {
    setPasswordError(null);
    try {
      await authService.changePassword(currentPassword, newPassword);
      // Let the protected-route redirect finish before navigating with the success message.
      flushSync(() => logout());
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error === 'CURRENT_PASSWORD_INCORRECT') {
        setPasswordError(tr.auth.currentPasswordIncorrect());
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setPasswordError(tr.auth.tooManyAttempts());
      } else {
        setPasswordError(tr.auth.changePasswordFailed());
      }
    }
  };

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
            <h2 className="card-title">{tr.auth.changePassword()}</h2>
            <p className="text-sm text-base-content/70">{tr.auth.changePasswordDescription()}</p>
            {passwordError && <div className="alert alert-error" role="alert">{passwordError}</div>}
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(changePassword)} className="space-y-4 max-w-xl">
                <div className="form-control">
                  <label className="label" htmlFor="current-password"><span className="label-text">{tr.auth.currentPassword()}</span></label>
                  <input
                    id="current-password"
                    type="password"
                    autoComplete="current-password"
                    className={`input input-bordered ${form.formState.errors.currentPassword ? 'input-error' : ''}`}
                    {...form.register('currentPassword', { required: tr.auth.passwordRequired() })}
                  />
                  {form.formState.errors.currentPassword && (
                    <span className="text-sm text-error">{form.formState.errors.currentPassword.message}</span>
                  )}
                </div>
                <PasswordFields />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? tr.auth.savingPassword() : tr.auth.changePassword()}
                </Button>
              </form>
            </FormProvider>
          </div>
        </div>
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

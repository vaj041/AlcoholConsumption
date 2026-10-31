import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button';
import PasswordFields, { type PasswordFieldsValues } from '../components/PasswordFields';
import { tr } from '../i18n/tr';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';

export default function ResetPassword() {
  const { hash } = useLocation();
  const value = new URLSearchParams(hash.slice(1)).get('token');
  const token = value && /^[a-f0-9]{64}$/.test(value) ? value : null;
  const [error, setError] = useState<{ token: string; message: string } | null>(null);
  const form = useForm<PasswordFieldsValues>();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const onSubmit = async ({ newPassword }: PasswordFieldsValues) => {
    if (!token) return;
    setError(null);
    try {
      await authService.resetPassword(token, newPassword);
      logout();
      navigate('/login', { replace: true, state: { passwordChanged: true } });
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.error === 'INVALID_OR_EXPIRED_RESET_TOKEN') {
        setError({ token, message: tr.auth.resetInvalid() });
      } else if (axios.isAxiosError(err) && err.response?.status === 429) {
        setError({ token, message: tr.auth.tooManyAttempts() });
      } else {
        setError({ token, message: tr.auth.resetFailed() });
      }
    }
  };

  const errorMessage = error?.token === token ? error.message : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title justify-center">{tr.auth.resetPasswordTitle()}</h1>
          {(!token || errorMessage) && <div className="alert alert-error" role="alert">{token ? errorMessage : tr.auth.resetInvalid()}</div>}
          {token && (
            <FormProvider {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <PasswordFields />
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? tr.auth.savingPassword() : tr.auth.resetPassword()}
                </Button>
              </form>
            </FormProvider>
          )}
          <Button variant="outline" onClick={() => navigate('/forgot-password')}>{tr.auth.sendResetLink()}</Button>
        </div>
      </div>
    </div>
  );
}

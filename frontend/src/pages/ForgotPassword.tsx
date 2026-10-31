import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button';
import { tr } from '../i18n/tr';
import { authService } from '../services/authService';
import { useSettingsStore } from '../store/settingsStore';

type ForgotPasswordForm = { email: string };

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordForm>();
  const language = useSettingsStore((state) => state.language);
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async ({ email }: ForgotPasswordForm) => {
    setError(null);
    try {
      await authService.forgotPassword(email, language);
      setSubmitted(true);
    } catch (err) {
      setError(axios.isAxiosError(err) && err.response?.status === 429
        ? tr.auth.tooManyAttempts() : tr.auth.resetRequestFailed());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h1 className="card-title justify-center">{tr.auth.forgotPasswordTitle()}</h1>
          <p>{tr.auth.forgotPasswordDescription()}</p>
          {error && <div className="alert alert-error" role="alert">{error}</div>}
          {submitted ? (
            <div className="alert alert-success" role="status">{tr.auth.resetRequested()}</div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="form-control">
                <label className="label" htmlFor="reset-email"><span className="label-text">{tr.auth.email()}</span></label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                  {...register('email', {
                    required: tr.auth.emailRequired(),
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: tr.auth.invalidEmail() },
                  })}
                />
                {errors.email && <span className="text-sm text-error">{errors.email.message}</span>}
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? tr.auth.sendingResetLink() : tr.auth.sendResetLink()}
              </Button>
            </form>
          )}
          <Button variant="outline" onClick={() => navigate('/login')}>{tr.auth.backToLogin()}</Button>
        </div>
      </div>
    </div>
  );
}

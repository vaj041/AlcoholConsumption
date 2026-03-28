import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import Button from '../components/Button';
import { tr } from '../i18n/tr';

interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
}

export default function Register() {
  const { register: registerForm, handleSubmit, formState: { errors }, watch } = useForm<RegisterForm>();
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError(null);
      await registerUser(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error || tr.auth.registrationFailed())
        : tr.auth.registrationFailed();
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center">🍺 {tr.auth.appTitle()}</h2>
          <p className="text-center text-base-content/70 mb-4">{tr.auth.registerTitle()}</p>
          
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                  <span className="label-text">{tr.auth.email()}</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                {...registerForm('email', { 
                  required: tr.auth.emailRequired(),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: tr.auth.invalidEmail()
                  }
                })}
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                  <span className="label-text">{tr.auth.password()}</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                {...registerForm('password', { 
                  required: tr.auth.passwordRequired(),
                  minLength: {
                    value: 6,
                    message: tr.auth.passwordMin()
                  }
                })}
              />
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            <div className="form-control">
              <label className="label">
                  <span className="label-text">{tr.auth.confirmPassword()}</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                {...registerForm('confirmPassword', { 
                  required: tr.auth.confirmPasswordRequired(),
                  validate: value => value === password || tr.auth.passwordsMismatch()
                })}
              />
              {errors.confirmPassword && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
                </label>
              )}
            </div>

            <div className="form-control mt-6">
              <Button
                type="submit" 
                variant="primary"
                className={isLoading ? 'loading' : ''}
                disabled={isLoading}
              >
                {isLoading ? tr.auth.creatingAccount() : tr.auth.register()}
              </Button>
            </div>
          </form>

          <div className="divider">{tr.auth.or()}</div>

          <Button variant="outline" className="btn-sm" onClick={() => navigate('/login')}>
            {tr.auth.alreadyHaveAccount()}
          </Button>
        </div>
      </div>
    </div>
  );
}

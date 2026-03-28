import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import Button from '../components/Button';
import { tr } from '../i18n/tr';

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (data: LoginForm) => {
    try {
      setError(null);
      await login(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error || tr.auth.loginFailed())
        : tr.auth.loginFailed();
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center">🍺 {tr.auth.appTitle()}</h2>
          <p className="text-center text-base-content/70 mb-4">{tr.auth.loginTitle()}</p>
          
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
                {...register('email', { 
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
                {...register('password', { 
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

            <div className="form-control mt-6">
              <Button
                type="submit" 
                variant="primary"
                className={isLoading ? 'loading' : ''}
                disabled={isLoading}
              >
                {isLoading ? tr.auth.loggingIn() : tr.auth.login()}
              </Button>
            </div>
          </form>

          <div className="divider">{tr.auth.or()}</div>

          <Button variant="outline" className="btn-sm" onClick={() => navigate('/register')}>
            {tr.auth.createAccount()}
          </Button>
        </div>
      </div>
    </div>
  );
}

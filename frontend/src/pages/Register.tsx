import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useState } from 'react';
import Button from '../components/Button';

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
        ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Registration failed')
        : 'Registration failed';
      setError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center">🍺 Alcohol Tracker</h2>
          <p className="text-center text-base-content/70 mb-4">Create your account</p>
          
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
                {...registerForm('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
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
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
                {...registerForm('password', { 
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
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
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
                {...registerForm('confirmPassword', { 
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
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
                {isLoading ? 'Creating account...' : 'Register'}
              </Button>
            </div>
          </form>

          <div className="divider">OR</div>

          <Button variant="outline" className="btn-sm" onClick={() => navigate('/login')}>
            Already have an account? Login
          </Button>
        </div>
      </div>
    </div>
  );
}

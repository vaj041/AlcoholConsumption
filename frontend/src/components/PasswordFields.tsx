import { useFormContext } from 'react-hook-form';
import { tr } from '../i18n/tr';

export interface PasswordFieldsValues {
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordFields() {
  const { register, formState: { errors } } = useFormContext<PasswordFieldsValues>();

  return (
    <>
      <div className="form-control">
        <label className="label" htmlFor="new-password">
          <span className="label-text">{tr.auth.newPassword()}</span>
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          className={`input input-bordered ${errors.newPassword ? 'input-error' : ''}`}
          {...register('newPassword', {
            required: tr.auth.passwordRequired(),
            minLength: { value: 6, message: tr.auth.passwordMin() },
            validate: (value) => new TextEncoder().encode(value).length <= 72 || tr.auth.passwordMaxBytes(),
          })}
        />
        {errors.newPassword && <span className="text-sm text-error">{errors.newPassword.message}</span>}
      </div>
      <div className="form-control">
        <label className="label" htmlFor="confirm-new-password">
          <span className="label-text">{tr.auth.confirmPassword()}</span>
        </label>
        <input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          className={`input input-bordered ${errors.confirmPassword ? 'input-error' : ''}`}
          {...register('confirmPassword', {
            required: tr.auth.confirmPasswordRequired(),
            validate: (value, values) => value === values.newPassword || tr.auth.passwordsMismatch(),
          })}
        />
        {errors.confirmPassword && <span className="text-sm text-error">{errors.confirmPassword.message}</span>}
      </div>
    </>
  );
}

import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';

type ButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>;

const variantClassMap: Record<ButtonVariant, string> = {
  primary: 'bg-blue-500 hover:bg-blue-700 text-white border-blue-700',
  secondary: 'bg-slate-500 hover:bg-slate-700 text-white border-slate-700',
  outline: 'bg-transparent hover:bg-slate-100 text-slate-700 border-slate-400',
  danger: 'bg-red-500 hover:bg-red-700 text-white border-red-700',
};

export default function Button({
  children,
  variant = 'primary',
  onClick,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn font-bold border transition-colors ${variantClassMap[variant]} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}

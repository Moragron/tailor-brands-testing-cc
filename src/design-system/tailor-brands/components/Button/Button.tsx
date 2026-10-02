import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  /** primary: the main action of a view. secondary: alternative or dismissive actions. */
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
};

export function Button({ variant = 'primary', fullWidth, className = '', type = 'button', ...rest }: ButtonProps) {
  return (
    <button
      type={type}
      className={`tb-button tb-button--${variant}${fullWidth ? ' tb-button--full' : ''} tb-focusable ${className}`}
      {...rest}
    />
  );
}

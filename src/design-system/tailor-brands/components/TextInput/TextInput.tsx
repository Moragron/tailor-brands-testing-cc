import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type TextInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & {
  label: string;
  /** Visually hide the label when the screen heading already asks the question */
  hideLabel?: boolean;
  helper?: ReactNode;
  /** Fixed prefix inside the field, e.g. a country code or currency symbol */
  prefix?: ReactNode;
  /** Error message; styled with the feedback-error token. */
  error?: ReactNode;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, hideLabel, helper, prefix, error, id: idProp, className = '', ...rest }, ref,
) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const describedBy = [helper && `${id}-helper`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`tb-field ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'tb-visually-hidden' : 'tb-field__label'}>{label}</label>
      <div className="tb-field__control" data-invalid={error ? true : undefined}>
        {prefix && <span className="tb-field__prefix">{prefix}</span>}
        <input ref={ref} id={id} className="tb-field__input" aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
      </div>
      {helper && <p id={`${id}-helper`} className="tb-caption">{helper}</p>}
      {error && <p id={`${id}-error`} className="tb-field__error">{error}</p>}
    </div>
  );
});

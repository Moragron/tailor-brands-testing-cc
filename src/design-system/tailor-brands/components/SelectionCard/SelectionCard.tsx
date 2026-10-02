import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

export type SelectionCardOption = { value: string; label: ReactNode; description?: ReactNode };

export type SelectionCardGroupProps = {
  label: string;
  options: SelectionCardOption[];
  value: string | null;
  onChange: (value: string) => void;
};

/** Single-select list of cards (radio semantics) for options that need a label and a description. */
export function SelectionCardGroup({ label, options, value, onChange }: SelectionCardGroupProps) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const next = (i + d + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  const focusIndex = Math.max(0, options.findIndex((o) => o.value === value));
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`} className="tb-card-group">
      <span id={`${id}-label`} className="tb-visually-hidden">{label}</span>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el; }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={i === focusIndex ? 0 : -1}
          data-selected={value === o.value || undefined}
          className="tb-selection-card tb-focusable"
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => onKey(e, i)}
        >
          <span className="tb-selection-card__radio" aria-hidden />
          <span>
            <span className="tb-selection-card__label">{o.label}</span>
            {o.description && <span className="tb-selection-card__desc">{o.description}</span>}
          </span>
        </button>
      ))}
    </div>
  );
}

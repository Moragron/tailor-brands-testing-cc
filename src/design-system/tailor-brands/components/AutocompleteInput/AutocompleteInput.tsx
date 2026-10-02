import { useId, useMemo, useState, type KeyboardEvent } from 'react';

export type AutocompleteInputProps = {
  label: string;
  hideLabel?: boolean;
  options: string[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  maxResults?: number;
};

/**
 * Combobox (WAI-ARIA 1.2 pattern). Only choosing an option sets a value; free text alone
 * never does, so a form can stay incomplete until a real option is picked.
 */
export function AutocompleteInput({ label, hideLabel, options, value, onChange, placeholder, maxResults = 8 }: AutocompleteInputProps) {
  const id = useId();
  const [query, setQuery] = useState(value ?? '');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const matches = useMemo(
    () => options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase())).slice(0, maxResults),
    [options, query, maxResults],
  );
  const choose = (o: string) => { onChange(o); setQuery(o); setOpen(false); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && open && matches[active]) { e.preventDefault(); choose(matches[active]); }
    else if (e.key === 'Escape') setOpen(false);
  };
  const showList = open && query.length > 0 && matches.length > 0;
  return (
    <div className="tb-field tb-autocomplete">
      <label htmlFor={id} className={hideLabel ? 'tb-visually-hidden' : 'tb-field__label'}>{label}</label>
      <div className="tb-field__control" data-filled={value ? true : undefined}>
        <input
          id={id}
          className="tb-field__input"
          role="combobox"
          aria-expanded={showList}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${id}-opt-${active}` : undefined}
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); if (value) onChange(null); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKey}
        />
      </div>
      {showList && (
        <ul id={`${id}-list`} role="listbox" className="tb-autocomplete__list">
          {matches.map((o, i) => (
            <li
              key={o}
              id={`${id}-opt-${i}`}
              role="option"
              aria-selected={i === active}
              data-active={i === active || undefined}
              onMouseDown={(e) => { e.preventDefault(); choose(o); }}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

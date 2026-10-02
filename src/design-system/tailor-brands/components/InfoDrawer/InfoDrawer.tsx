import { useId, useState, type ReactNode } from 'react';

export type InfoDrawerSection = { heading: string; body: ReactNode };

export type InfoDrawerProps = {
  /** Text of the toggle, e.g. "Learn more" */
  triggerLabel: string;
  sections: InfoDrawerSection[];
  defaultOpen?: boolean;
};

/** Inline disclosure: a text toggle that expands a panel of headed sections. */
export function InfoDrawer({ triggerLabel, sections, defaultOpen = false }: InfoDrawerProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className="tb-info-drawer">
      <button type="button" className="tb-info-drawer__trigger tb-focusable" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        {triggerLabel}
        <span aria-hidden className="tb-info-drawer__chevron" data-open={open || undefined}>▾</span>
      </button>
      <div id={id} hidden={!open} className="tb-info-drawer__panel">
        {sections.map((s) => (
          <section key={s.heading}>
            <h4 className="tb-info-drawer__heading">{s.heading}</h4>
            <div className="tb-info-drawer__body">{s.body}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

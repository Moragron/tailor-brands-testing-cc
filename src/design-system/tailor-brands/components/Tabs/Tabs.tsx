import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

export type TabItem = { id: string; label: string; content: ReactNode };

export type TabsProps = { tabs: TabItem[]; defaultTab?: string };

/** Tabs (WAI-ARIA tabs pattern, arrow-key navigation). */
export function Tabs({ tabs, defaultTab }: TabsProps) {
  const id = useId();
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const n = (i + d + tabs.length) % tabs.length;
    setActive(tabs[n].id);
    refs.current[n]?.focus();
  };
  return (
    <div className="tb-tabs">
      <div role="tablist" className="tb-tabs__list">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            id={`${id}-tab-${t.id}`}
            aria-selected={active === t.id}
            aria-controls={`${id}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            className="tb-tabs__tab tb-focusable"
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} role="tabpanel" id={`${id}-panel-${t.id}`} aria-labelledby={`${id}-tab-${t.id}`} hidden={active !== t.id} className="tb-tabs__panel">
          {t.content}
        </div>
      ))}
    </div>
  );
}

export type ListGroup = { heading: string; items: ReactNode[] };

/** Groups of items under small uppercase headings, e.g. a schedule or checklist. */
export function GroupedList({ groups }: { groups: ListGroup[] }) {
  return (
    <div className="tb-grouped-list">
      {groups.map((g) => (
        <section key={g.heading}>
          <h4 className="tb-grouped-list__heading">{g.heading}</h4>
          <ul className="tb-grouped-list__items">{g.items.map((item, i) => <li key={i}>{item}</li>)}</ul>
        </section>
      ))}
    </div>
  );
}

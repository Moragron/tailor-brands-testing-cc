import type { ReactNode } from 'react';
import { Button } from '../Button/Button';
import { InfoDrawer, type InfoDrawerSection } from '../InfoDrawer/InfoDrawer';

export type AddOnCardProps = {
  /** Small uppercase heading of the group */
  title: string;
  /** AddOnItem elements */
  children: ReactNode;
};

/** A titled card listing optional items the user can add or remove. */
export function AddOnCard({ title, children }: AddOnCardProps) {
  return (
    <section className="tb-addon" aria-label={title}>
      <h3 className="tb-addon__title">{title}</h3>
      <ul className="tb-addon__items">{children}</ul>
    </section>
  );
}

export type AddOnItemProps = {
  title: string;
  /** Small tag next to the title, e.g. "New" */
  badge?: string;
  description?: ReactNode;
  /** Optional price shown next to the title */
  price?: ReactNode;
  /** Optional expandable details */
  info?: { triggerLabel: string; sections: InfoDrawerSection[] };
  /**
   * toggle: one button that flips between addLabel and removeLabel.
   * choice: two buttons, skipLabel and addLabel.
   */
  mode?: 'toggle' | 'choice';
  added: boolean;
  onChange: (added: boolean) => void;
  addLabel?: string;
  removeLabel?: string;
  skipLabel?: string;
};

export function AddOnItem({
  title, badge, description, price, info, mode = 'toggle', added, onChange,
  addLabel = 'Add', removeLabel = 'Remove', skipLabel = 'Skip',
}: AddOnItemProps) {
  return (
    <li className="tb-addon-item" data-added={added || undefined}>
      <div className="tb-addon-item__main">
        <div className="tb-addon-item__title">
          {title}
          {badge && <span className="tb-badge">{badge}</span>}
          {price && <span className="tb-addon-item__price">{price}</span>}
        </div>
        {description && <p className="tb-caption">{description}</p>}
        {info && <InfoDrawer triggerLabel={info.triggerLabel} sections={info.sections} />}
      </div>
      <div className="tb-addon-item__actions">
        {mode === 'toggle' ? (
          <Button variant={added ? 'secondary' : 'primary'} aria-pressed={added} onClick={() => onChange(!added)}>
            {added ? removeLabel : addLabel}
          </Button>
        ) : (
          <>
            <Button variant="secondary" aria-pressed={!added} onClick={() => onChange(false)}>{skipLabel}</Button>
            <Button variant="primary" aria-pressed={added} onClick={() => onChange(true)}>{addLabel}</Button>
          </>
        )}
      </div>
    </li>
  );
}

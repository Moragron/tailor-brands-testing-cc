import type { ReactNode } from 'react';

export type PromoBannerProps = {
  /** Optional leading emoji or icon */
  icon?: ReactNode;
  children: ReactNode;
  /** Omit to render a non-dismissible banner */
  onDismiss?: () => void;
  /** Accessible label of the dismiss button */
  dismissLabel?: string;
  /** Accessible name of the banner region */
  label?: string;
  /** Sticks to the top of the scroll container */
  sticky?: boolean;
};

/** Full-width announcement strip, e.g. above a page header. */
export function PromoBanner({ icon, children, onDismiss, dismissLabel = 'Dismiss', label = 'Announcement', sticky = true }: PromoBannerProps) {
  return (
    <div className={`tb-promo${sticky ? ' tb-promo--sticky' : ''}`} role="region" aria-label={label}>
      {icon && <span className="tb-promo__icon" aria-hidden>{icon}</span>}
      <span className="tb-promo__text">{children}</span>
      {onDismiss && (
        <button type="button" className="tb-promo__close tb-focusable" aria-label={dismissLabel} onClick={onDismiss}>×</button>
      )}
    </div>
  );
}

import type { ReactNode } from 'react';
import { Button } from '../Button/Button';

export type PricingCardProps = {
  name: string;
  price: string;
  period?: string;
  priceNote?: string;
  /** Small highlight tag, e.g. "Most popular" */
  badge?: string;
  features: ReactNode[];
  /** Renders a full-width button when set */
  ctaLabel?: string;
  onCtaClick?: () => void;
  highlighted?: boolean;
};

/** Plan or product card: name, price, feature list and an optional call to action. */
export function PricingCard({ name, price, period, priceNote, badge, features, ctaLabel, onCtaClick, highlighted }: PricingCardProps) {
  return (
    <article className="tb-pricing" data-highlighted={highlighted || undefined}>
      <header className="tb-pricing__head">
        <h3 className="tb-h3">{name}</h3>
        {badge && <span className="tb-badge">{badge}</span>}
      </header>
      <div className="tb-pricing__price">
        <span className="tb-h1">{price}</span>
        {period && <span className="tb-caption">{period}</span>}
      </div>
      {priceNote && <p className="tb-caption">{priceNote}</p>}
      <ul className="tb-pricing__features">{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
      {ctaLabel && <Button fullWidth variant={highlighted ? 'primary' : 'secondary'} onClick={onCtaClick}>{ctaLabel}</Button>}
    </article>
  );
}

import type { ReactNode } from 'react';
import { PromoBanner, StepLayout } from '../design-system/tailor-brands';

/** Shell shared by every screen: example-content banner, brand, optional progress, footer actions. */
export function Frame({ top, footer, children }: { top?: ReactNode; footer?: ReactNode; children: ReactNode }) {
  return (
    <StepLayout
      banner={<PromoBanner label="Example content" sticky={false}>This is an example flow. All copy is example content.</PromoBanner>}
      brand={<span className="tb-h3">Brand starter</span>}
      top={top}
      footer={footer}
    >
      <div className="flex flex-col gap-(--tb-space-6)">{children}</div>
    </StepLayout>
  );
}

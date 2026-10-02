import type { ReactNode } from 'react';

export type StepLayoutProps = {
  /** Left of the header: your logo or wordmark */
  brand?: ReactNode;
  /** Right of the header: usually a <ProgressStepper /> */
  top?: ReactNode;
  /** Above the header: usually a sticky <PromoBanner /> */
  banner?: ReactNode;
  children: ReactNode;
  /** Bottom action row: usually <Button>s */
  footer?: ReactNode;
};

/** Page shell for a focused, one-thing-per-page experience: header, centred content column, action row. */
export function StepLayout({ brand, top, banner, children, footer }: StepLayoutProps) {
  return (
    <div className="tb-step-layout">
      {banner}
      {(brand || top) && (
        <header className="tb-step-layout__header">
          <span className="tb-step-layout__brand">{brand}</span>
          {top}
        </header>
      )}
      <main className="tb-step-layout__main">{children}</main>
      {footer && (
        <footer className="tb-step-layout__footer">
          <div className="tb-step-layout__footer-inner">{footer}</div>
        </footer>
      )}
    </div>
  );
}

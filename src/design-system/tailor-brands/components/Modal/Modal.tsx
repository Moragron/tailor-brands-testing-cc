import { useEffect, useId, useRef, type ReactNode } from 'react';

export type ModalProps = {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  /** Pass to render a close button and close on Escape; omit for a gate that can't be dismissed */
  onClose?: () => void;
  /** Accessible label of the close button */
  closeLabel?: string;
};

/** Dialog rendered in place (not in a portal) so it can sit over GatedContent. */
export function Modal({ open, title, children, onClose, closeLabel = 'Close' }: ModalProps) {
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    (root?.querySelector<HTMLElement>('input, select, textarea') ?? root?.querySelector<HTMLElement>('button, [tabindex]'))?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="tb-modal__scrim">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} className="tb-modal">
        {onClose && <button type="button" className="tb-modal__close tb-focusable" aria-label={closeLabel} onClick={onClose}>×</button>}
        <h2 id={`${id}-title`} className="tb-h2 tb-modal__title">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export type GatedContentProps = {
  /** Content shown blurred and inert behind the gate while locked */
  children: ReactNode;
  locked: boolean;
  /** Usually a <Modal> */
  gate: ReactNode;
};

/** Puts a gate (usually a <Modal>) over blurred, non-interactive content until unlocked. */
export function GatedContent({ children, locked, gate }: GatedContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  // Set as a DOM property: the `inert` JSX prop only exists in React 19, and Lovable projects may run React 18.
  useEffect(() => {
    if (contentRef.current) contentRef.current.inert = locked;
  }, [locked]);
  return (
    <div className="tb-gated">
      <div ref={contentRef} className="tb-gated__content" data-locked={locked || undefined} aria-hidden={locked || undefined}>
        {children}
      </div>
      {locked && gate}
    </div>
  );
}

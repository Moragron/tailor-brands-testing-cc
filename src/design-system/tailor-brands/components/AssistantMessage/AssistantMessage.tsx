import type { ReactNode } from 'react';

export type AssistantMessageProps = {
  /** Shows an animated "working" indicator instead of the content */
  thinking?: boolean;
  /** Text shown (and announced) while thinking, e.g. "Thinking" */
  thinkingLabel?: string;
  children?: ReactNode;
};

/** Conversational, first-person message (e.g. from an assistant), with a loading state. */
export function AssistantMessage({ thinking, thinkingLabel, children }: AssistantMessageProps) {
  return (
    <div className="tb-assistant" aria-live="polite" aria-busy={thinking || undefined}>
      {thinking ? (
        <span className="tb-assistant__thinking">
          {thinkingLabel ?? <span className="tb-visually-hidden">Loading</span>}
          <span aria-hidden className="tb-assistant__dots"><i>.</i><i>.</i><i>.</i></span>
        </span>
      ) : children}
    </div>
  );
}

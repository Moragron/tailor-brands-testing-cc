
type FractionProps = { variant?: 'fraction'; current: number; total: number };
type SectionsProps = { variant: 'sections'; sections: string[]; activeIndex: number };
export type ProgressStepperProps = FractionProps | SectionsProps;

/**
 * Progress through a multi-step experience.
 * - "fraction": a compact "2/5" counter.
 * - "sections": a row of named sections with the active one emphasised.
 */
export function ProgressStepper(props: ProgressStepperProps) {
  if (props.variant === 'sections') {
    return (
      <nav className="tb-stepper tb-stepper--sections" aria-label="Progress">
        <ol>
          {props.sections.map((s, i) => (
            <li
              key={s}
              data-state={i < props.activeIndex ? 'complete' : i === props.activeIndex ? 'active' : 'upcoming'}
              aria-current={i === props.activeIndex ? 'step' : undefined}
            >
              {s}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
  return (
    <div className="tb-stepper tb-stepper--fraction" aria-label={`Step ${props.current} of ${props.total}`}>
      {props.current}/{props.total}
    </div>
  );
}

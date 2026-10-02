import { useState } from 'react';
import { Button, ChipGroup, SelectionCardGroup } from '../design-system/tailor-brands';
import type { UseCase } from '../engine/types';
import { Frame } from './Frame';

type Props = {
  useCases: UseCase[];
  /** Step labels, in tree order, ending with "Outcome". */
  stepLabels: string[];
  /** stepIndex = index of the step to stop at, or null to play to the outcome. */
  onOpen: (useCase: UseCase, stepIndex: number | null) => void;
  onBack: () => void;
  panel: React.ReactNode;
};

/** Jump into any step of a scenario from spec/use-cases.json, with its answers pre-filled. */
export function ScenarioPicker({ useCases, stepLabels, onOpen, onBack, panel }: Props) {
  const [id, setId] = useState<string | null>(null);
  const [step, setStep] = useState<string[]>([stepLabels[0]]);
  const chosen = useCases.find((u) => u.id === id);
  const stepIndex = stepLabels.indexOf(step[0]);
  return (
    <Frame
      footer={
        <>
          <Button variant="secondary" onClick={onBack}>Back</Button>
          <Button disabled={!chosen} onClick={() => chosen && onOpen(chosen, stepIndex === stepLabels.length - 1 ? null : stepIndex)}>
            Open scenario
          </Button>
        </>
      }
    >
      <h1 className="tb-h1">Try a scenario</h1>
      <SelectionCardGroup label="Scenario" value={id} onChange={setId}
        options={useCases.map((u) => ({ value: u.id, label: u.id, description: u.persona }))} />
      <h2 className="tb-h3">Start at</h2>
      <ChipGroup mode="single" label="Start at" options={stepLabels} value={step} onChange={setStep} />
      {panel}
    </Frame>
  );
}

import { Button, GroupedList, PricingCard } from '../design-system/tailor-brands';
import type { SessionRecord } from '../adapters/types';
import type { Classification, OutcomeNode } from '../engine/types';
import { Frame } from './Frame';

export type SaveStatus = 'saving' | 'saved' | 'memory' | 'error' | 'preview';

const saveNote: Record<SaveStatus, string> = {
  saving: 'Saving this session…',
  saved: 'Saved to your private sessions.',
  memory: 'Storage is not available in this view, so this session is kept in memory only and disappears when you close the page.',
  error: 'Saving failed, so this session is kept in this tab only.',
  preview: 'Scenario preview: nothing was saved.',
};

const describeClassification = (c?: Classification) => {
  if (!c) return 'Business type: taken from the scenario (the AI step was not run).';
  const how = c.source === 'ai' ? 'classified by Claude' : 'classified by the keyword rule';
  const time = c.ms !== undefined ? `, ${(c.ms / 1000).toFixed(1)} s` : '';
  return `Business type "${c.category}" ${how} (confidence ${c.confidence.toFixed(2)}${time}).${c.note ? ` ${c.note}` : ''}`;
};

type Props = {
  node: OutcomeNode;
  classification?: Classification;
  status: SaveStatus;
  previous: SessionRecord[] | null;
  onRestart: () => void;
  onEdit: () => void;
  panel: React.ReactNode;
};

export function OutcomeScreen({ node, classification, status, previous, onRestart, onEdit, panel }: Props) {
  const { outcome } = node;
  return (
    <Frame
      footer={
        <>
          <Button variant="secondary" onClick={onEdit}>Edit answers</Button>
          <Button onClick={onRestart}>Start over</Button>
        </>
      }
    >
      <h1 className="tb-h1">Your recommended starting point</h1>
      <PricingCard name={outcome.plan} price={outcome.price} period={outcome.period} features={outcome.items} highlighted />
      <p className="tb-body">{outcome.reason}</p>
      <p className="tb-caption">{describeClassification(classification)}</p>
      <p className="tb-caption">{saveNote[status]}</p>
      {previous && previous.length > 0 && (
        <GroupedList groups={[{
          heading: 'Your previous sessions',
          items: previous.map((s) => `${new Date(s.at).toLocaleString()}: ${s.outcome.replace('outcome-', '')}`),
        }]} />
      )}
      {panel}
    </Frame>
  );
}

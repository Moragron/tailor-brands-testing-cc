import { useState } from 'react';
import { AssistantMessage, Button, ChipGroup, ProgressStepper, SelectionCardGroup, TextInput } from '../design-system/tailor-brands';
import type { QuestionNode, Value } from '../engine/types';
import { Frame } from './Frame';

type Props = {
  node: QuestionNode;
  /** 1-based position of this step and the number of steps. */
  position: number;
  total: number;
  initial?: Value;
  onSubmit: (value: Value) => Promise<void>;
  onBack?: () => void;
  onScenarios?: () => void;
  panel: React.ReactNode;
};

/** One screen per question node; the node's kind picks the design-system input. */
export function QuestionScreen({ node, position, total, initial, onSubmit, onBack, onScenarios, panel }: Props) {
  const [single, setSingle] = useState<string | null>(node.kind === 'single' && typeof initial === 'string' ? initial : null);
  const [multi, setMulti] = useState<string[]>(node.kind === 'multi' && Array.isArray(initial) ? initial : []);
  const [text, setText] = useState(node.kind === 'text' && typeof initial === 'string' ? initial : '');
  const [busy, setBusy] = useState(false);

  const value: Value | null = node.kind === 'single' ? single : node.kind === 'multi' ? (multi.length ? multi : null) : text.trim() || null;
  const submit = async () => {
    if (!value || busy) return;
    setBusy(true);
    try { await onSubmit(value); } finally { setBusy(false); }
  };

  return (
    <Frame
      top={<ProgressStepper current={position} total={total} />}
      footer={
        <>
          {onBack && <Button variant="secondary" onClick={onBack} disabled={busy}>Back</Button>}
          {!onBack && onScenarios && <Button variant="secondary" onClick={onScenarios}>Try a scenario</Button>}
          <Button disabled={!value || busy} onClick={submit}>Continue</Button>
        </>
      }
    >
      <h1 className="tb-h1">{node.prompt}</h1>
      {node.kind === 'single' && (
        <SelectionCardGroup label={node.prompt} options={node.options ?? []} value={single} onChange={setSingle} />
      )}
      {node.kind === 'multi' && (
        <ChipGroup label={node.prompt} options={(node.options ?? []).map((o) => o.label)}
          value={multi.map((v) => node.options?.find((o) => o.value === v)?.label ?? v)}
          onChange={(labels) => setMulti(labels.map((l) => node.options?.find((o) => o.label === l)?.value ?? l))} />
      )}
      {node.kind === 'text' && (
        <TextInput label={node.prompt} hideLabel placeholder={node.placeholder} value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      )}
      {busy && node.classify && <AssistantMessage thinking thinkingLabel="Working out your business type" />}
      {panel}
    </Frame>
  );
}

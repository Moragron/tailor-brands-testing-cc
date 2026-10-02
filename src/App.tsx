// Picks adapters at runtime and renders the flow. The page renders at once with local adapters;
// Artifact capabilities, when this viewer has them, replace the matching adapter as they resolve.
import { useEffect, useMemo, useRef, useState } from 'react';
import treeJson from '../spec/decision-tree.json';
import useCaseJson from '../spec/use-cases.json';
import { createArtifactAdapters } from './adapters/artifact';
import { createLocalAdapters } from './adapters/local';
import type { Adapters, SessionRecord } from './adapters/types';
import { answer, getNode, loadTree, next, playUseCase, questionNodes, rewind, start } from './engine/engine';
import type { Classification, State, UseCase, Value } from './engine/types';
import { CapabilityPanel } from './screens/CapabilityPanel';
import { OutcomeScreen, type SaveStatus } from './screens/OutcomeScreen';
import { QuestionScreen } from './screens/QuestionScreen';
import { ScenarioPicker } from './screens/ScenarioPicker';

const tree = loadTree(treeJson);
const useCases = useCaseJson.useCases as UseCase[];
const questions = questionNodes(tree);
const stepLabels = [...questions.map((_, i) => `Step ${i + 1}`), 'Outcome'];

const newId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type Result = { classification?: Classification; status: SaveStatus; previous: SessionRecord[] | null };

export function App() {
  const [adapters, setAdapters] = useState<Adapters>(createLocalAdapters);
  const [resolving, setResolving] = useState(true);
  const [state, setState] = useState<State>(() => start(tree));
  const [view, setView] = useState<'flow' | 'scenarios'>('flow');
  const [classification, setClassification] = useState<Classification | undefined>();
  const [result, setResult] = useState<Result | null>(null);
  const [epoch, setEpoch] = useState(0); // bumps when the flow is replaced, so inputs re-initialise
  const live = useRef(adapters);
  live.current = adapters;

  useEffect(() => {
    let cancelled = false;
    createArtifactAdapters()
      .then((found) => { if (!cancelled) setAdapters((prev) => ({ ...prev, ...found })); })
      .finally(() => { if (!cancelled) setResolving(false); });
    return () => { cancelled = true; };
  }, []);

  const panel = useMemo(() => <CapabilityPanel adapters={adapters} resolving={resolving} />, [adapters, resolving]);

  const open = (s: State, preview = false) => {
    setState(s);
    setResult(null);
    setClassification(undefined);
    setView('flow');
    setEpoch((e) => e + 1);
    if (preview && getNode(tree, s.path[s.path.length - 1]).type === 'outcome') {
      setResult({ status: 'preview', previous: null });
    }
  };

  const finish = async (final: State, cls: Classification | undefined) => {
    const { storage, ai, identity } = live.current;
    const record: SessionRecord = {
      id: newId(),
      at: new Date().toISOString(),
      answers: final.answers,
      path: final.path,
      outcome: final.path[final.path.length - 1],
      ...(cls ? { classification: cls } : {}),
      adapters: { storage: storage.kind, ai: ai.kind, identity: identity.kind },
    };
    let status: SaveStatus = storage.persistent ? 'saved' : 'memory';
    try { await storage.save(record); } catch { status = 'error'; }
    let previous: SessionRecord[] | null = null;
    if (storage.persistent && status === 'saved') {
      try { previous = await storage.list(); } catch { previous = null; }
    }
    setResult({ classification: cls, status, previous });
  };

  const submit = async (value: Value) => {
    const node = getNode(tree, state.path[state.path.length - 1]);
    if (node.type !== 'question') return;
    let cls: Classification | undefined = classification;
    let category: string | undefined;
    if (node.classify) {
      // The only place the AI adapter is called: after the user submits the free-text step.
      cls = await live.current.ai.classify(value as string, node.classify);
      category = cls.category;
      setClassification(cls);
    }
    const step = next(tree, answer(tree, state, node.id, value, category));
    setState(step.state);
    if (step.kind === 'outcome') await finish(step.state, cls);
  };

  if (view === 'scenarios') {
    return (
      <ScenarioPicker
        useCases={useCases}
        stepLabels={stepLabels}
        panel={panel}
        onBack={() => setView('flow')}
        onOpen={(uc, stepIndex) => open(playUseCase(tree, uc, stepIndex === null ? {} : { upTo: stepIndex }), true)}
      />
    );
  }

  const node = getNode(tree, state.path[state.path.length - 1]);
  if (node.type === 'outcome') {
    return (
      <OutcomeScreen
        node={node}
        classification={result?.classification ?? classification}
        status={result?.status ?? 'saving'}
        previous={result?.previous ?? null}
        panel={panel}
        onRestart={() => open(start(tree))}
        onEdit={() => { setState(rewind(state, tree.start)); setResult(null); setEpoch((e) => e + 1); }}
      />
    );
  }

  const index = state.path.length - 1;
  return (
    <QuestionScreen
      key={`${node.id}-${epoch}`}
      node={node}
      position={index + 1}
      total={questions.length}
      initial={state.answers[node.id]}
      panel={panel}
      onSubmit={submit}
      onBack={index > 0 ? () => { setState(rewind(state, state.path[index - 1])); setEpoch((e) => e + 1); } : undefined}
      onScenarios={() => setView('scenarios')}
    />
  );
}

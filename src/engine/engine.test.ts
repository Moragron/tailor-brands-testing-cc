import { describe, expect, it } from 'vitest';
import treeJson from '../../spec/decision-tree.json';
import useCaseJson from '../../spec/use-cases.json';
import { answer, classifyByKeywords, getNode, loadTree, next, path, playUseCase, rewind, start, validateTree } from './engine';
import type { QuestionNode, Tree, UseCase } from './types';

const tree = loadTree(treeJson);
const useCases = useCaseJson.useCases as UseCase[];
const clone = (): Tree => structuredClone(tree);

describe('use cases (spec/use-cases.json)', () => {
  it('has at least four scenarios', () => expect(useCases.length).toBeGreaterThanOrEqual(4));

  it.each(useCases)('$id reaches its expected path and outcome', (uc) => {
    // The AI step never calls sample here: aiCategory is injected, or the keyword rule is used.
    const state = playUseCase(tree, uc);
    expect(path(state)).toEqual(uc.expectedPath);
    expect(state.path[state.path.length - 1]).toBe(uc.expectedOutcome);
    expect(getNode(tree, uc.expectedOutcome).type).toBe('outcome');
  });

  it('covers every outcome in the tree', () => {
    const reached = new Set(useCases.map((u) => u.expectedOutcome));
    const outcomes = tree.nodes.filter((n) => n.type === 'outcome').map((n) => n.id);
    expect(outcomes.filter((id) => !reached.has(id))).toEqual([]);
  });

  it('can stop at any step with earlier answers submitted and its own pre-filled', () => {
    const uc = useCases[0];
    const state = playUseCase(tree, uc, { upTo: 1 });
    expect(path(state)).toEqual(['stage', 'needs']);
    expect(state.answers.needs).toEqual(uc.answers.needs);
    expect('describe' in state.answers).toBe(false);
  });
});

describe('engine', () => {
  it('start puts the walker on the start node', () => {
    expect(path(start(tree))).toEqual([tree.start]);
  });

  it('answer is pure and rejects invalid values', () => {
    const s0 = start(tree);
    const s1 = answer(tree, s0, 'stage', 'idea');
    expect(s0.answers).toEqual({});
    expect(s1.answers).toEqual({ stage: 'idea' });
    expect(() => answer(tree, s0, 'stage', 'nope')).toThrow();
    expect(() => answer(tree, s0, 'needs', ['website'])).toThrow(/not been reached/);
  });

  it('next needs an answer, then returns the next question', () => {
    const s0 = start(tree);
    expect(() => next(tree, s0)).toThrow(/not answered/);
    const step = next(tree, answer(tree, s0, 'stage', 'idea'));
    expect(step.kind).toBe('question');
    expect(step.node.id).toBe('needs');
    expect(path(step.state)).toEqual(['stage', 'needs']);
  });

  it('a text question with a classify spec needs a category before next', () => {
    let s = answer(tree, start(tree), 'stage', 'idea');
    s = next(tree, s).state;
    s = next(tree, answer(tree, s, 'needs', ['name-logo'])).state;
    s = answer(tree, s, 'describe', 'A bakery');
    expect(() => next(tree, s)).toThrow(/not classified/);
    expect(() => answer(tree, s, 'describe', 'A bakery', 'not-a-category')).toThrow();
  });

  it('re-answering an earlier step drops the later path and answers', () => {
    const uc = useCases[0];
    const done = playUseCase(tree, uc);
    const back = answer(tree, done, 'needs', ['website']);
    expect(path(back)).toEqual(['stage', 'needs']);
    expect(Object.keys(back.answers).sort()).toEqual(['needs', 'stage']);
  });

  it('rewind goes back and keeps the target step answered', () => {
    const done = playUseCase(tree, useCases[0]);
    const back = rewind(done, 'needs');
    expect(path(back)).toEqual(['stage', 'needs']);
    expect(back.answers.needs).toEqual(useCases[0].answers.needs);
    expect('describe' in back.answers || 'describe.category' in back.answers).toBe(false);
  });

  it('first matching edge wins (precedence)', () => {
    // idea + name-logo matches the first edge even though the category also matches a later one.
    const uc: UseCase = { ...useCases[0], aiCategory: 'online-store' };
    expect(path(playUseCase(tree, uc)).pop()).toBe('outcome-foundation');
  });
});

describe('keyword fallback', () => {
  const spec = (getNode(tree, 'describe') as QuestionNode).classify!;
  it('picks the category with the most keyword hits', () => {
    const r = classifyByKeywords(spec, 'I sell handmade products online');
    expect(r).toMatchObject({ category: 'online-store', source: 'keywords' });
    expect(r.confidence).toBeGreaterThan(0);
  });
  it('uses the fallback with zero confidence when nothing matches', () => {
    expect(classifyByKeywords(spec, 'zzz')).toMatchObject({ category: spec.fallback, confidence: 0 });
  });
});

describe('validation', () => {
  it('accepts the shipped tree', () => expect(validateTree(tree)).toEqual([]));

  it('rejects an unknown node id', () => {
    const t = clone();
    (t.nodes[0] as QuestionNode).edges[0].to = 'ghost';
    expect(validateTree(t).join('\n')).toMatch(/unknown node "ghost"/);
  });

  it('rejects unreachable nodes', () => {
    const t = clone();
    t.nodes.push({ id: 'island', type: 'outcome', outcome: { plan: 'x', price: '$1', items: ['a', 'b'], reason: 'r' } });
    expect(validateTree(t).join('\n')).toMatch(/"island" is unreachable/);
  });

  it('rejects leaves without an outcome', () => {
    const t = clone();
    (t.nodes[2] as QuestionNode).edges = [];
    expect(validateTree(t).join('\n')).toMatch(/Leaf "describe" has no outcome/);
    const t2 = clone();
    delete (t2.nodes[3] as { outcome?: unknown }).outcome;
    expect(validateTree(t2).join('\n')).toMatch(/Leaf "outcome-foundation" has no outcome/);
  });

  it('rejects conditions on unknown answers and values', () => {
    const t = clone();
    (t.nodes[2] as QuestionNode).edges[0].when = { op: 'equals', answer: 'ghost', value: 'x' };
    expect(validateTree(t).join('\n')).toMatch(/unknown answer "ghost"/);
    const t2 = clone();
    (t2.nodes[2] as QuestionNode).edges[0].when = { op: 'equals', answer: 'stage', value: 'retired' };
    expect(validateTree(t2).join('\n')).toMatch(/"retired" is not a value of "stage"/);
  });

  it('rejects operators that do not fit the answer kind, and a missing fallback edge', () => {
    const t = clone();
    (t.nodes[2] as QuestionNode).edges[0].when = { op: 'includes', answer: 'stage', value: 'idea' };
    expect(validateTree(t).join('\n')).toMatch(/"includes" needs a multi-select/);
    const t2 = clone();
    (t2.nodes[2] as QuestionNode).edges.pop();
    expect(validateTree(t2).join('\n')).toMatch(/last edge must be unconditional/);
  });

  it('loadTree throws with all problems listed', () => {
    const t = clone();
    t.start = 'ghost';
    expect(() => loadTree(t)).toThrow(/Invalid decision tree/);
  });
});

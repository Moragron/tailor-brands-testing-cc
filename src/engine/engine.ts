// Pure decision-tree engine: no React, no platform, no I/O. Everything returns new values.
import type {
  Answers, Classification, ClassifySpec, Condition, QuestionNode, State, Step, Tree, TreeNode, UseCase, Value,
} from './types';

const byId = (tree: Tree, id: string): TreeNode => {
  const node = tree.nodes.find((n) => n.id === id);
  if (!node) throw new Error(`Unknown node "${id}"`);
  return node;
};

export const getNode = byId;

export const questionNodes = (tree: Tree): QuestionNode[] =>
  tree.nodes.filter((n): n is QuestionNode => n.type === 'question');

// ---------- conditions ----------

export function evaluate(cond: Condition, answers: Answers): boolean {
  switch (cond.op) {
    case 'equals': return answers[cond.answer] === cond.value;
    case 'includes': {
      const v = answers[cond.answer];
      return Array.isArray(v) && v.includes(cond.value);
    }
    case 'all': return cond.of.every((c) => evaluate(c, answers));
    case 'any': return cond.of.some((c) => evaluate(c, answers));
  }
}

// ---------- validation ----------

/** Answer keys a condition may reference, with the values they can hold (null = free text). */
function answerDomain(tree: Tree): Map<string, { kind: 'single' | 'multi' | 'text'; values: Set<string> | null }> {
  const domain = new Map<string, { kind: 'single' | 'multi' | 'text'; values: Set<string> | null }>();
  for (const q of questionNodes(tree)) {
    domain.set(q.id, { kind: q.kind, values: q.options ? new Set(q.options.map((o) => o.value)) : null });
    if (q.classify) domain.set(`${q.id}.category`, { kind: 'single', values: new Set(q.classify.categories.map((c) => c.value)) });
  }
  return domain;
}

function checkCondition(cond: Condition, domain: ReturnType<typeof answerDomain>, where: string, errors: string[]): void {
  if (cond.op === 'all' || cond.op === 'any') {
    if (!cond.of?.length) errors.push(`${where}: "${cond.op}" needs at least one condition`);
    cond.of?.forEach((c) => checkCondition(c, domain, where, errors));
    return;
  }
  if (cond.op !== 'equals' && cond.op !== 'includes') {
    errors.push(`${where}: unknown condition operator "${(cond as { op: string }).op}"`);
    return;
  }
  const target = domain.get(cond.answer);
  if (!target) return void errors.push(`${where}: condition on unknown answer "${cond.answer}"`);
  if (target.values && !target.values.has(cond.value)) errors.push(`${where}: "${cond.value}" is not a value of "${cond.answer}"`);
  if (cond.op === 'equals' && target.kind === 'multi') errors.push(`${where}: "equals" on multi-select "${cond.answer}" (use "includes")`);
  if (cond.op === 'includes' && target.kind !== 'multi') errors.push(`${where}: "includes" needs a multi-select answer, "${cond.answer}" is ${target.kind}`);
}

/** Returns every problem found; an empty list means the tree is valid. */
export function validateTree(tree: Tree): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const n of tree.nodes) {
    if (ids.has(n.id)) errors.push(`Duplicate node id "${n.id}"`);
    ids.add(n.id);
  }
  if (!ids.has(tree.start)) errors.push(`Unknown start node "${tree.start}"`);

  const domain = answerDomain(tree);
  for (const n of tree.nodes) {
    if (n.type === 'outcome') {
      const o = n.outcome;
      if (!o) errors.push(`Leaf "${n.id}" has no outcome`);
      else if (!o.plan || !o.reason || o.items.length < 2 || o.items.length > 3) {
        errors.push(`Outcome "${n.id}" needs a plan, a reason and two or three items`);
      }
      continue;
    }
    if (!n.edges?.length) {
      errors.push(`Leaf "${n.id}" has no outcome (a question needs edges)`);
      continue;
    }
    if ((n.kind === 'single' || n.kind === 'multi') && !n.options?.length) errors.push(`Question "${n.id}" has no options`);
    if (n.classify) {
      const values = new Set(n.classify.categories.map((c) => c.value));
      if (n.kind !== 'text') errors.push(`Question "${n.id}": only text questions can classify`);
      if (!values.has(n.classify.fallback)) errors.push(`Question "${n.id}": fallback "${n.classify.fallback}" is not a category`);
    }
    n.edges.forEach((e, i) => {
      const where = `Edge ${i + 1} of "${n.id}"`;
      if (!ids.has(e.to)) errors.push(`${where} points to unknown node "${e.to}"`);
      if (e.when) checkCondition(e.when, domain, where, errors);
    });
    if (n.edges[n.edges.length - 1].when) errors.push(`Question "${n.id}": the last edge must be unconditional`);
  }

  // Reachability from the start node.
  const seen = new Set<string>();
  const stack = ids.has(tree.start) ? [tree.start] : [];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    const n = tree.nodes.find((x) => x.id === id);
    if (n?.type === 'question') n.edges.forEach((e) => ids.has(e.to) && stack.push(e.to));
  }
  for (const n of tree.nodes) if (!seen.has(n.id)) errors.push(`Node "${n.id}" is unreachable`);
  return errors;
}

/** Validates on load: throws one error listing every problem. */
export function loadTree(json: unknown): Tree {
  const tree = json as Tree;
  const errors = validateTree(tree);
  if (errors.length) throw new Error(`Invalid decision tree:\n- ${errors.join('\n- ')}`);
  return tree;
}

// ---------- walking ----------

export const start = (tree: Tree): State => ({ answers: {}, path: [tree.start] });

/**
 * Records the answer for a visited question. Answering an earlier step discards the later path and answers.
 * For a text question with a classify spec, pass the category the AI step (or keyword rule) chose.
 */
export function answer(tree: Tree, state: State, nodeId: string, value: Value, category?: string): State {
  const node = byId(tree, nodeId);
  if (node.type !== 'question') throw new Error(`"${nodeId}" is not a question`);
  const idx = state.path.indexOf(nodeId);
  if (idx === -1) throw new Error(`"${nodeId}" has not been reached`);

  if (node.kind === 'single') {
    if (typeof value !== 'string' || !node.options?.some((o) => o.value === value)) throw new Error(`Invalid choice for "${nodeId}"`);
  } else if (node.kind === 'multi') {
    if (!Array.isArray(value) || !value.length || !value.every((v) => node.options?.some((o) => o.value === v))) {
      throw new Error(`Invalid selection for "${nodeId}"`);
    }
  } else if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`"${nodeId}" needs some text`);
  }
  if (category !== undefined && !node.classify?.categories.some((c) => c.value === category)) {
    throw new Error(`"${category}" is not a category of "${nodeId}"`);
  }

  const dropped = state.path.slice(idx + 1);
  const answers: Answers = {};
  for (const [key, v] of Object.entries(state.answers)) {
    const owner = key.split('.')[0];
    if (!dropped.includes(owner) && owner !== nodeId) answers[key] = v;
  }
  answers[nodeId] = value;
  if (category !== undefined) answers[`${nodeId}.category`] = category;
  return { answers, path: state.path.slice(0, idx + 1) };
}

/** The node that follows the current one, with the state advanced onto it. Throws if the current question is unanswered. */
export function next(tree: Tree, state: State): Step {
  const current = byId(tree, state.path[state.path.length - 1]);
  if (current.type !== 'question') throw new Error('The flow has already reached an outcome');
  if (!(current.id in state.answers)) throw new Error(`"${current.id}" is not answered yet`);
  if (current.classify && !(`${current.id}.category` in state.answers)) throw new Error(`"${current.id}" is not classified yet`);

  const edge = current.edges.find((e) => !e.when || evaluate(e.when, state.answers));
  if (!edge) throw new Error(`No edge matches after "${current.id}"`);
  const node = byId(tree, edge.to);
  const advanced: State = { answers: state.answers, path: [...state.path, node.id] };
  return node.type === 'outcome' ? { kind: 'outcome', node, state: advanced } : { kind: 'question', node, state: advanced };
}

export const path = (state: State): string[] => [...state.path];

/** Moves the walker back to an earlier node, keeping its own answer (pre-filled) and dropping everything after it. */
export function rewind(state: State, nodeId: string): State {
  const idx = state.path.indexOf(nodeId);
  if (idx === -1) throw new Error(`"${nodeId}" has not been reached`);
  const dropped = state.path.slice(idx + 1);
  const answers: Answers = {};
  for (const [key, v] of Object.entries(state.answers)) if (!dropped.includes(key.split('.')[0])) answers[key] = v;
  return { answers, path: state.path.slice(0, idx + 1) };
}

// ---------- the AI step's deterministic fallback ----------

/** Keyword rule used when no AI is available (and as the tests' reference). */
export function classifyByKeywords(spec: ClassifySpec, text: string): Classification {
  const lower = text.toLowerCase();
  let best: { value: string; hits: number } | null = null;
  for (const c of spec.categories) {
    const hits = c.keywords.filter((k) => lower.includes(k)).length;
    if (hits > (best?.hits ?? 0)) best = { value: c.value, hits };
  }
  return best
    ? { category: best.value, confidence: Math.min(0.9, 0.4 + best.hits * 0.2), source: 'keywords' }
    : { category: spec.fallback, confidence: 0, source: 'keywords', note: 'No keyword matched; used the default category.' };
}

// ---------- scenarios ----------

/**
 * Plays a use case to a given step. `upTo` = index in the path of the step to stop at (answers of earlier steps are
 * submitted, the stop step's own answer is pre-filled but not submitted). Omit it to play to the outcome.
 * `classify` supplies the category of a text step; tests pass the scenario's aiCategory or the keyword rule.
 */
export function playUseCase(
  tree: Tree,
  uc: UseCase,
  opts: { upTo?: number; classify?: (node: QuestionNode, text: string) => string } = {},
): State {
  const classify = opts.classify ?? ((node, text) => uc.aiCategory ?? classifyByKeywords(node.classify!, text).category);
  let state = start(tree);
  for (let i = 0; ; i++) {
    const node = byId(tree, state.path[state.path.length - 1]);
    if (node.type === 'outcome') return state;
    const value = uc.answers[node.id];
    if (value === undefined) throw new Error(`Use case "${uc.id}" has no answer for "${node.id}"`);
    const category = node.classify ? classify(node, value as string) : undefined;
    state = answer(tree, state, node.id, value, category);
    if (opts.upTo === i) return state;
    state = next(tree, state).state;
  }
}

// Data model of a decision tree. Pure types: no React, no platform.

export type Value = string | string[];

/** Flat answer map. Keys are question ids; a classified text question also gets "<id>.category". */
export type Answers = Record<string, Value>;

export type Condition =
  | { op: 'equals'; answer: string; value: string }
  | { op: 'includes'; answer: string; value: string }
  | { op: 'all'; of: Condition[] }
  | { op: 'any'; of: Condition[] };

export type Edge = { to: string; /** Omitted = unconditional (the fallback). First matching edge wins. */ when?: Condition };

export type Option = { value: string; label: string; description?: string };

export type Category = { value: string; label: string; keywords: string[] };

/** The AI step: a free-text answer is classified into one of these categories. */
export type ClassifySpec = { categories: Category[]; /** Used when no keyword matches. */ fallback: string };

export type QuestionNode = {
  id: string;
  type: 'question';
  kind: 'single' | 'multi' | 'text';
  prompt: string;
  placeholder?: string;
  options?: Option[];
  classify?: ClassifySpec;
  edges: Edge[];
};

export type Outcome = { plan: string; price: string; period?: string; items: string[]; reason: string };

export type OutcomeNode = { id: string; type: 'outcome'; outcome: Outcome };

export type TreeNode = QuestionNode | OutcomeNode;

export type Tree = { id: string; title: string; exampleContent: true; start: string; nodes: TreeNode[] };

/** `path` always starts at the tree's start node; its last entry is the current node. */
export type State = { answers: Answers; path: string[] };

export type Step =
  | { kind: 'question'; node: QuestionNode; state: State }
  | { kind: 'outcome'; node: OutcomeNode; state: State };

export type Classification = { category: string; confidence: number; source: 'ai' | 'keywords'; ms?: number; note?: string };

export type UseCase = {
  id: string;
  persona: string;
  answers: Record<string, Value>;
  aiCategory?: string;
  expectedPath: string[];
  expectedOutcome: string;
};

// Platform services as interfaces. The engine and screens only know these; each platform supplies an implementation.
import type { Answers, Classification, ClassifySpec } from '../engine/types';

export type AdapterKind = 'artifact' | 'local';

export type SessionRecord = {
  id: string;
  at: string;
  answers: Answers;
  path: string[];
  outcome: string;
  classification?: Classification;
  /** Which adapters were live when the session was saved. */
  adapters: { storage: AdapterKind; ai: AdapterKind; identity: AdapterKind };
};

export interface StorageAdapter {
  kind: AdapterKind;
  /** True when sessions outlive the page (so "previous sessions" is meaningful). */
  persistent: boolean;
  save(record: SessionRecord): Promise<void>;
  list(): Promise<SessionRecord[]>;
}

export interface AIAdapter {
  kind: AdapterKind;
  /** Classifies free text into one of the spec's categories. Never throws: falls back to the keyword rule. */
  classify(text: string, spec: ClassifySpec): Promise<Classification>;
}

export interface IdentityAdapter {
  kind: AdapterKind;
  /** Opaque id of the viewer, or null when anonymous. */
  id(): Promise<string | null>;
}

export type Adapters = { storage: StorageAdapter; ai: AIAdapter; identity: IdentityAdapter };

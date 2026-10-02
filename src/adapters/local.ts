// In-memory fallback: works anywhere, needs no platform.
import { classifyByKeywords } from '../engine/engine';
import type { Adapters, SessionRecord } from './types';

export function createLocalAdapters(): Adapters {
  const sessions: SessionRecord[] = [];
  return {
    storage: {
      kind: 'local',
      persistent: false,
      async save(record) { sessions.unshift(record); },
      async list() { return [...sessions]; },
    },
    ai: {
      kind: 'local',
      async classify(text, spec) { return classifyByKeywords(spec, text); },
    },
    identity: { kind: 'local', async id() { return null; } },
  };
}

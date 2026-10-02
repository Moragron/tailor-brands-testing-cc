import { InfoDrawer } from '../design-system/tailor-brands';
import type { Adapters, AdapterKind } from '../adapters/types';

const label = (kind: AdapterKind, artifact: string, local: string) => (kind === 'artifact' ? `Artifact: ${artifact}` : `Local: ${local}`);

/** Collapsible list of which adapters are live in this view. */
export function CapabilityPanel({ adapters, resolving }: { adapters: Adapters; resolving: boolean }) {
  return (
    <InfoDrawer
      triggerLabel="What this view supports"
      sections={[
        { heading: 'Storage (db)', body: label(adapters.storage.kind, 'sessions saved privately to you', 'kept in memory for this tab') },
        { heading: 'AI (sample)', body: label(adapters.ai.kind, 'Claude classifies your sentence', 'keyword rule') },
        { heading: 'Identity (user)', body: label(adapters.identity.kind, 'signed-in viewer', 'anonymous') },
        ...(resolving ? [{ heading: 'Status', body: 'Checking what this view supports…' }] : []),
      ]}
    />
  );
}

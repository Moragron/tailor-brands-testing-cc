import { expect, it } from 'vitest';
import { sessionsPath } from './artifact';

it('sessions live in a collection path (odd segment count) under the private data/users/<id> prefix', () => {
  const path = sessionsPath('u_abc');
  expect(path.startsWith('data/users/u_abc/')).toBe(true);
  expect(path.split('/').length % 2).toBe(1);
});

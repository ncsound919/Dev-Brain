import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GenomeMutationEngine } from '../engine/genomeMutationEngine';

describe('GenomeMutationEngine', () => {
  beforeEach(() => {
    // We only test the fallback deterministic path because the API path requires fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Force fallback'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('runEvolution (no model)', () => {
    it('returns NO variants when the model is unreachable instead of fabricating', async () => {
      // 2026-10-15 audit: the old fallback was a per-generation Math.random walk
      // presented as "evolution" (two identical runs differed). This test now
      // pins the honest behaviour: unreachable model => empty, never invented.
      const variants = await GenomeMutationEngine.runEvolution('Test Strategy', 5);
      expect(variants).toEqual([]);
    });

    it('is deterministic on the failure path (no hidden randomness)', async () => {
      const a = await GenomeMutationEngine.runEvolution('Test Strategy', 5);
      const b = await GenomeMutationEngine.runEvolution('Test Strategy', 5);
      expect(a).toEqual(b);
    });
  });
});

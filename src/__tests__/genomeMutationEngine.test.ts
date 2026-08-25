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

  describe('runEvolution (Fallback)', () => {
    it('should evolve genome variants across generations', async () => {
      const generations = 5;
      const variants = await GenomeMutationEngine.runEvolution('Test Strategy', generations);
      
      expect(variants).toHaveLength(generations + 1); // 0 to 5
      expect(variants[0].generation).toBe(0);
      expect(variants[0].traits.speed).toBe(50);
      
      expect(variants[variants.length - 1].generation).toBe(5);
      
      // Values should remain within 0-100 bounds
      variants.forEach(variant => {
        expect(variant.traits.speed).toBeGreaterThanOrEqual(0);
        expect(variant.traits.speed).toBeLessThanOrEqual(100);
        expect(variant.traits.risk).toBeGreaterThanOrEqual(0);
        expect(variant.traits.risk).toBeLessThanOrEqual(100);
      });
    });
  });
});

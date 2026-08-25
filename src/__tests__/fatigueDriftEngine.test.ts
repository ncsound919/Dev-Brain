import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FatigueDriftEngine } from '../engine/fatigueDriftEngine';

describe('FatigueDriftEngine', () => {
  beforeEach(() => {
    // We only test the fallback deterministic path because the API path requires fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Force fallback'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('simulateBurnout (Fallback)', () => {
    it('should generate fatigue drift data points for the given time horizon', async () => {
      const data = await FatigueDriftEngine.simulateBurnout(80, 40, 12);
      
      expect(data).toHaveLength(12);
      expect(data[0].month).toBe(1);
      expect(data[11].month).toBe(12);
      
      // Structural integrity should degrade over time
      expect(data[0].structuralIntegrity).toBeGreaterThanOrEqual(data[11].structuralIntegrity);
      
      // Cognitive load should increase
      expect(data[11].cognitiveLoad).toBeGreaterThanOrEqual(data[0].cognitiveLoad);
    });
  });
});

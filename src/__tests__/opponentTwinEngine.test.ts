import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OpponentTwinEngine } from '../engine/opponentTwinEngine';

describe('OpponentTwinEngine', () => {
  beforeEach(() => {
    // We only test the fallback deterministic path because the API path requires fetch
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Force fallback'));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getTwinForSector (Fallback)', () => {
    it('should return a defensive scheme for science/sports sector', async () => {
      const twin = await OpponentTwinEngine.getTwinForSector('science_sports');
      expect(twin.type).toBe('DEFENSIVE_SCHEME');
      expect(twin.aggressiveness).toBe(0.95);
    });

    it('should return a market competitor for business sector', async () => {
      const twin = await OpponentTwinEngine.getTwinForSector('business');
      expect(twin.type).toBe('MARKET_COMPETITOR');
      expect(twin.aggressiveness).toBe(0.8);
    });
  });

  describe('simulateScrimmage (Fallback)', () => {
    it('should generate counter moves for a given twin', async () => {
      const twin = await OpponentTwinEngine.getTwinForSector('business');
      const moves = await OpponentTwinEngine.simulateScrimmage('Price Drop', twin);
      
      expect(moves.length).toBeGreaterThan(0);
      expect(moves[0].moveName).toBeDefined();
      expect(moves[0].probability).toBeDefined();
      
      // Moves should be sorted by probability descending
      if (moves.length > 1) {
        expect(moves[0].probability).toBeGreaterThanOrEqual(moves[1].probability);
      }
    });
  });
});

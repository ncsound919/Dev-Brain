import { describe, it, expect } from 'vitest';
import { DecisionMatrixEngine } from '../engine/decisionMatrixEngine';
import { WeightedDecisionOption } from '../types';

describe('DecisionMatrixEngine', () => {
  describe('normalizeWeights', () => {
    it('should normalize weights to exactly 100%', () => {
      const options = [
        { id: '1', weightPercentage: 10 } as WeightedDecisionOption,
        { id: '2', weightPercentage: 20 } as WeightedDecisionOption,
        { id: '3', weightPercentage: 20 } as WeightedDecisionOption,
      ];
      
      const result = DecisionMatrixEngine.normalizeWeights(options);
      
      const sum = result.reduce((acc, opt) => acc + opt.weightPercentage, 0);
      expect(sum).toBe(100);
      
      // Sorted descending
      expect(result[0].weightPercentage).toBeGreaterThanOrEqual(result[1].weightPercentage);
      expect(result[1].weightPercentage).toBeGreaterThanOrEqual(result[2].weightPercentage);
    });

    it('should handle zero raw total by distributing equally', () => {
      const options = [
        { id: '1', weightPercentage: 0 } as WeightedDecisionOption,
        { id: '2', weightPercentage: 0 } as WeightedDecisionOption,
        { id: '3', weightPercentage: 0 } as WeightedDecisionOption,
      ];
      
      const result = DecisionMatrixEngine.normalizeWeights(options);
      
      const sum = result.reduce((acc, opt) => acc + opt.weightPercentage, 0);
      expect(sum).toBe(100);
      // Remainder goes to first option, so 34, 33, 33
      expect(result.map(o => o.weightPercentage)).toEqual([34, 33, 33]);
    });
  });
});

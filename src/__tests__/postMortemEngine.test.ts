import { describe, it, expect } from 'vitest';
import { globalPostMortemEngine } from '../engine/postMortemEngine';

describe('PostMortemCalibrationEngine', () => {
  describe('calculateBrierScore', () => {
    it('should correctly calculate Brier score', () => {
      // (0.8 - 1)^2 = 0.04
      expect(globalPostMortemEngine.calculateBrierScore(0.8, 1)).toBeCloseTo(0.04);
      // (0.2 - 0)^2 = 0.04
      expect(globalPostMortemEngine.calculateBrierScore(0.2, 0)).toBeCloseTo(0.04);
      // (0.9 - 0)^2 = 0.81
      expect(globalPostMortemEngine.calculateBrierScore(0.9, 0)).toBeCloseTo(0.81);
    });
  });

  describe('getCalibrationRating', () => {
    it('should assign EXCELLENT for brier < 0.04', () => {
      expect(globalPostMortemEngine.getCalibrationRating(0.01, 0.9, 1)).toBe('EXCELLENT');
    });

    it('should assign OVERCONFIDENT for high prediction but failure', () => {
      expect(globalPostMortemEngine.getCalibrationRating(0.64, 0.8, 0)).toBe('OVERCONFIDENT');
    });

    it('should assign UNDERCONFIDENT for low prediction but success', () => {
      expect(globalPostMortemEngine.getCalibrationRating(0.49, 0.3, 1)).toBe('UNDERCONFIDENT');
    });
  });

  describe('addRecord and computeOverview', () => {
    it('should incorporate new records into the overview', () => {
      const initialCount = globalPostMortemEngine.getAllRecords().length;
      
      const newRecord = globalPostMortemEngine.createNewPostMortem({
        decisionTitle: 'Test Decision',
        sector: 'dev',
        chosenOption: 'Option A',
        predictedProbability: 0.9,
        actualOutcome: 'success',
        metricVariances: [],
        rootCauses: [],
        keyLessons: [],
        retrospectiveSummary: 'Success',
        leaders: []
      });

      expect(newRecord.brierScore).toBeCloseTo(0.01);
      expect(newRecord.calibrationRating).toBe('EXCELLENT');

      const records = globalPostMortemEngine.getAllRecords();
      expect(records.length).toBe(initialCount + 1);

      const overview = globalPostMortemEngine.computeOverview();
      expect(overview.totalDecisionsLogged).toBe(initialCount + 1);
      
      const devPerformance = overview.sectorPerformance.find(s => s.sector === 'dev');
      expect(devPerformance).toBeDefined();
      expect(devPerformance!.decisionsCount).toBeGreaterThan(0);
    });
  });
});

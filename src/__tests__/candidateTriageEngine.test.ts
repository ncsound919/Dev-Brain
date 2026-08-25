import { describe, it, expect } from 'vitest';
import { CandidateTriageEngine } from '../engine/candidateTriageEngine';
import { CandidateMethod } from '../types';

describe('CandidateTriageEngine', () => {
  describe('runTriage', () => {
    const mockCandidates: CandidateMethod[] = [
      {
        id: 'c1',
        title: 'Perfect Candidate',
        description: 'Should pass everything',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 90,
          constraintFit: 90,
          complexityBoundedness: 90,
          riskFloor: 90,
          speedToValue: 90,
          strategicUpside: 90
        }
      } as any,
      {
        id: 'c2',
        title: 'Hard Constraint Fail',
        description: 'Constraint score too low',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 90,
          constraintFit: 40, // < 52 cutoff
          complexityBoundedness: 90,
          riskFloor: 90,
          speedToValue: 90,
          strategicUpside: 90
        }
      } as any,
      {
        id: 'c3',
        title: 'Complexity Bloat Fail',
        description: 'Too complex, low feasibility',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 50,
          constraintFit: 90,
          complexityBoundedness: 40, // < 42
          riskFloor: 90,
          speedToValue: 90,
          strategicUpside: 90
        }
      } as any,
      {
        id: 'c4',
        title: 'Average Candidate',
        description: 'Passes gates but not top score',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 70,
          constraintFit: 70,
          complexityBoundedness: 70,
          riskFloor: 70,
          speedToValue: 70,
          strategicUpside: 70
        }
      } as any,
      {
        id: 'c5',
        title: 'Another Average Candidate',
        description: 'Passes gates',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 75,
          constraintFit: 75,
          complexityBoundedness: 75,
          riskFloor: 75,
          speedToValue: 75,
          strategicUpside: 75
        }
      } as any,
      {
        id: 'c6',
        title: 'Good Candidate 1',
        description: 'Passes gates',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 80,
          constraintFit: 80,
          complexityBoundedness: 80,
          riskFloor: 80,
          speedToValue: 80,
          strategicUpside: 80
        }
      } as any,
      {
        id: 'c7',
        title: 'Good Candidate 2',
        description: 'Passes gates',
        sourceSector: 'dev',
        preScreenScores: {
          feasibility: 85,
          constraintFit: 85,
          complexityBoundedness: 85,
          riskFloor: 85,
          speedToValue: 85,
          strategicUpside: 85
        }
      } as any
    ];

    it('should correctly eliminate candidates failing hard gates and sort survivors', () => {
      const result = CandidateTriageEngine.runTriage('Test problem', 'balanced_pareto', 'dev', mockCandidates);
      
      const eliminated = result.prunedMethods;
      const survivors = result.top5Methods;

      expect(eliminated.length).toBeGreaterThanOrEqual(2);
      expect(eliminated.find(c => c.id === 'c2')?.eliminationStage).toBe('HARD_CONSTRAINT_FAIL');
      expect(eliminated.find(c => c.id === 'c3')?.eliminationStage).toBe('COMPLEXITY_CEILING_FAIL');

      // Best candidate should be top of survivors
      expect(survivors[0].id).toBe('c1');
      expect(survivors[0].status).toBe('shortlisted_top_5');
    });
  });
});

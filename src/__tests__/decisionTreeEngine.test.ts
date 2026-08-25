import { describe, it, expect } from 'vitest';
import { DecisionTreeEngine } from '../engine/decisionTreeEngine';
import { DecisionTree } from '../types';

describe('DecisionTreeEngine', () => {
  describe('evaluateCondition', () => {
    it('should evaluate "equals" correctly', () => {
      expect(DecisionTreeEngine.evaluateCondition('test', 'equals', 'TEST')).toBe(true);
      expect(DecisionTreeEngine.evaluateCondition('test', 'equals', 'other')).toBe(false);
    });

    it('should evaluate "greater_than" correctly', () => {
      expect(DecisionTreeEngine.evaluateCondition(10, 'greater_than', 5)).toBe(true);
      expect(DecisionTreeEngine.evaluateCondition(5, 'greater_than', 10)).toBe(false);
    });

    it('should handle undefined values gracefully', () => {
      expect(DecisionTreeEngine.evaluateCondition(undefined, 'equals', 'anything')).toBe(false);
      expect(DecisionTreeEngine.evaluateCondition(undefined, 'is_false', 'anything')).toBe(true);
    });
    
    it('should evaluate "in_list" correctly', () => {
      expect(DecisionTreeEngine.evaluateCondition('apple', 'in_list', ['apple', 'banana'])).toBe(true);
      expect(DecisionTreeEngine.evaluateCondition('cherry', 'in_list', ['apple', 'banana'])).toBe(false);
    });
  });

  describe('traverseTree', () => {
    const mockTree: DecisionTree = {
      id: 'tree-1',
      name: 'Test Tree',
      domain: 'dev' as any,
      rootNodeId: 'node-1',
      nodes: {
        'node-1': {
          id: 'node-1',
          title: 'Start',
          description: '',
          type: 'condition',
          field: 'userAge',
          branches: [
            { id: 'b1', targetNodeId: 'node-2', label: 'Adult', condition: { field: 'userAge', operator: 'greater_than_or_equal', value: 18 } },
            { id: 'b2', targetNodeId: 'node-3', label: 'Minor', condition: { field: 'userAge', operator: 'less_than', value: 18 } }
          ]
        },
        'node-2': {
          id: 'node-2',
          title: 'Approved',
          description: '',
          type: 'action_verdict',
          verdict: { status: 'AUTO_APPROVED' as any, riskTier: 'LOW', reason: 'Adult' } as any
        },
        'node-3': {
          id: 'node-3',
          title: 'Rejected',
          description: '',
          type: 'action_verdict',
          verdict: { status: 'HARD_BLOCK' as any, riskTier: 'HIGH', reason: 'Minor' } as any
        }
      }
    } as any;

    it('should correctly traverse to adult branch', () => {
      const result = DecisionTreeEngine.traverseTree(mockTree, { userAge: 25 });
      expect(result.finalNode.id).toBe('node-2');
      expect(result.trace).toHaveLength(2);
      expect(result.trace[0].branchTakenLabel).toBe('Adult');
    });

    it('should correctly traverse to minor branch', () => {
      const result = DecisionTreeEngine.traverseTree(mockTree, { userAge: 16 });
      expect(result.finalNode.id).toBe('node-3');
      expect(result.trace).toHaveLength(2);
      expect(result.trace[0].branchTakenLabel).toBe('Minor');
    });
  });
});

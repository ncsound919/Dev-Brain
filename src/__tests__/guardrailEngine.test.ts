import { describe, it, expect } from 'vitest';
import { GuardrailEngine } from '../engine/guardrailEngine';
import { AgentActionPayload, GuardrailRule } from '../types';

describe('GuardrailEngine', () => {
  describe('calculateBlastRadius', () => {
    it('should assign CATASTROPHIC risk tier for extreme financial amounts', () => {
      const payload: AgentActionPayload = {
        actionType: 'transfer' as any,
        parameters: { amount_usd: 6000 }
      } as any;
      const result = GuardrailEngine.calculateBlastRadius(payload);
      
      expect(result.financialRiskScore).toBe(95);
      expect(result.riskTier).toBe('CATASTROPHIC');
    });

    it('should assign HIGH risk for destructive syntax', () => {
      const payload: AgentActionPayload = {
        actionType: 'db_query' as any,
        parameters: { has_destructive_syntax: true }
      } as any;
      const result = GuardrailEngine.calculateBlastRadius(payload);
      
      expect(result.systemIntegrityScore).toBe(100);
      expect(result.isIrreversible).toBe(true);
      expect(result.riskTier).toBe('CATASTROPHIC');
    });

    it('should assign LOW risk for safe actions', () => {
      const payload: AgentActionPayload = {
        actionType: 'read' as any,
        parameters: { amount_usd: 10 }
      } as any;
      const result = GuardrailEngine.calculateBlastRadius(payload);
      
      expect(result.riskTier).toBe('LOW');
    });
  });

  describe('evaluateGuardrails', () => {
    const rules: GuardrailRule[] = [
      {
        id: 'r1',
        name: 'Max Spend Rule',
        description: '',
        severity: 'BLOCKING',
        enabled: true,
        evaluator: { field: 'amount', operator: 'greater_than', thresholdValue: 1000 },
        remediationAdvice: 'Lower amount'
      } as any,
      {
        id: 'r2',
        name: 'Unsafe Syntax',
        description: '',
        severity: 'ESCALATION_REQUIRED',
        enabled: true,
        evaluator: { field: 'unsafe', operator: 'is_true', thresholdValue: true },
        remediationAdvice: 'Escalate'
      } as any
    ];

    it('should return no violations if conditions are not met', () => {
      const payload: AgentActionPayload = {
        actionType: 'test' as any,
        parameters: { amount: 500, unsafe: false }
      } as any;
      const result = GuardrailEngine.evaluateGuardrails(payload, rules);
      
      expect(result.violatedRules).toHaveLength(0);
      expect(result.hasBlockingViolations).toBe(false);
      expect(result.hasEscalationViolations).toBe(false);
    });

    it('should flag blocking violations', () => {
      const payload: AgentActionPayload = {
        actionType: 'test' as any,
        parameters: { amount: 1500, unsafe: false }
      } as any;
      const result = GuardrailEngine.evaluateGuardrails(payload, rules);
      
      expect(result.violatedRules).toHaveLength(1);
      expect(result.violatedRules[0].ruleId).toBe('r1');
      expect(result.hasBlockingViolations).toBe(true);
      expect(result.hasEscalationViolations).toBe(false);
    });
  });
});

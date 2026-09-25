import { describe, expect, it } from 'vitest';
import {
  decisionMatrixAdvisory,
  buildMatrixChoiceAdvisory,
  decideSystemOne,
  jevEnabled,
  type JevResult,
} from '../engine/jevClient';
import type { DecisionMatrixResult, WeightedDecisionOption } from '../types';

const OPTION_A: WeightedDecisionOption = {
  id: 'opt_a',
  title: 'Deterministic Modular Pipeline',
  description: 'd',
  weightPercentage: 56,
  confidenceScore: 95,
  pros: [],
  cons: [],
  riskLevel: 'LOW',
  expectedROI: 'x',
  timeToValue: 'y',
  recommended: true,
  verdictTag: 'STRONGLY_RECOMMENDED',
  mitigationStrategy: 'm',
  supportingLeaders: [],
  scores: { feasibility: 90, upsidePotential: 90, safetyFloor: 90, executionSpeed: 80, capitalEfficiency: 80 },
};

const OPTION_B: WeightedDecisionOption = {
  id: 'opt_b',
  title: 'Autonomous Agent Mesh',
  description: 'd',
  weightPercentage: 29,
  confidenceScore: 76,
  pros: [],
  cons: [],
  riskLevel: 'HIGH',
  expectedROI: 'x',
  timeToValue: 'y',
  recommended: false,
  verdictTag: 'VIABLE_ALTERNATIVE',
  mitigationStrategy: 'm',
  supportingLeaders: [],
  scores: { feasibility: 86, upsidePotential: 90, safetyFloor: 58, executionSpeed: 96, capitalEfficiency: 70 },
};

function matrix(): DecisionMatrixResult {
  return {
    id: 'matrix_decide_1',
    decisionTopic: 'Choose an architecture for the agent platform',
    context: 'ctx',
    totalOptionsCount: 2,
    options: [OPTION_A, OPTION_B],
    recommendedOptionId: 'opt_a',
    synthesisRationale: 'r',
    tradeOffSummary: 't',
    generatedBy: 'deterministic_engine',
    timestamp: new Date().toISOString(),
    normalizedPercentageSum: 100,
  };
}

describe('decisionMatrixAdvisory', () => {
  it('builds a compact state plus one choice question with an entry per option', () => {
    const { state, questions, options } = decisionMatrixAdvisory(matrix());
    expect(options.length).toBe(2);
    const q = questions.choose;
    expect(q.type).toBe('choice');
    if (q.type !== 'choice') return;
    expect(Object.keys(q.criteria)).toEqual(['opt_a', 'opt_b']);
    const s = state as { options: Array<{ id: string; weightPercentage: number }> };
    expect(s.options[1].weightPercentage).toBe(29);
  });
});

describe('buildMatrixChoiceAdvisory', () => {
  it('maps the Jev choice to a recommended option id + probability', () => {
    const result: JevResult = {
      ok: true,
      source: 'localjev',
      model: 'localjev-0.2',
      answers: {
        choose: { type: 'choice', choice: 'opt_b', probabilities: { opt_a: 0.4, opt_b: 0.6 }, confidence: 0.88 },
      },
      usage: { inputTokens: 200, outputTokens: 5 },
      latencyMs: 150,
    };
    const advisory = buildMatrixChoiceAdvisory(result, [OPTION_A, OPTION_B]);
    expect(advisory.ok).toBe(true);
    expect(advisory.recommendedOptionId).toBe('opt_b');
    expect(advisory.recommendedTitle).toBe('Autonomous Agent Mesh');
    expect(advisory.probability).toBeCloseTo(0.6);
    expect(advisory.confidence).toBe(0.88);
  });

  it('reports offline honestly when the call failed', () => {
    const advisory = buildMatrixChoiceAdvisory({ ok: false, source: 'offline', latencyMs: 4, error: 'nope' }, [OPTION_A]);
    expect(advisory.ok).toBe(false);
    expect(advisory.source).toBe('offline');
    expect(advisory.recommendedOptionId).toBeUndefined();
  });
});

describe('decideSystemOne offline gate', () => {
  it('returns ok:false offline when the tier is disabled, never fabricating', async () => {
    process.env.DEV_BRAIN_JEV_ENABLED = '0';
    try {
      const result = await decideSystemOne({ state: 's', questions: { go: { type: 'noul', instructions: 'Go?' } } });
      expect(result.ok).toBe(false);
      expect(result.source).toBe('offline');
      expect(result.error).toMatch(/disabled/);
    } finally {
      delete process.env.DEV_BRAIN_JEV_ENABLED;
    }
  });

  it('requires no API key when a default base URL is present (localjev)', async () => {
    delete process.env.DEV_BRAIN_JEV_ENABLED;
    delete process.env.TYPESAFE_API_KEY;
    delete process.env.AI_GATEWAY_API_KEY;
    const prev = process.env.TYPESAFE_BASE_URL;
    delete process.env.TYPESAFE_BASE_URL;
    try {
      expect(jevEnabled()).toBe(true);
    } finally {
      if (prev !== undefined) process.env.TYPESAFE_BASE_URL = prev;
    }
  });
});
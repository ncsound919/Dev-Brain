import { describe, it, expect } from 'vitest';
import { DeterministicReasoningEngine } from '../engine/reasoningEngine';
import { ALL_LEADER_GENOMES } from '../data/genomes';

describe('DeterministicReasoningEngine', () => {
  const engine = new DeterministicReasoningEngine();
  const sampleGenomes = ['andrej-karpathy', 'tim-dettmers', 'clayton-christensen', 'warren-buffett'];
  const sampleProblem = 'How do we design a cost-efficient LLM training loop while maintaining business moat and disciplined capital allocation?';

  it('should execute full 3-phase FSM transitions (PERCEIVE, ROUTE, SYNTHESIZE)', () => {
    const result = engine.reasonAboutProblem(sampleProblem, sampleGenomes, ['dev', 'business', 'financial']);

    expect(result).toBeDefined();
    expect(result.states).toHaveLength(3);

    const phases = result.states.map(s => s.phase);
    expect(phases).toEqual(['PERCEIVE', 'ROUTE', 'SYNTHESIZE']);

    expect(result.states[0].name).toBe('ANALYZE_PROBLEM');
    expect(result.states[1].name).toBe('MATCH_GENOMES');
    expect(result.states[2].name).toBe('SYNTHESIZE_SOLUTION');
  });

  it('should guarantee 100% determinism across 50 consecutive runs', () => {
    const runs = Array.from({ length: 50 }, () =>
      engine.reasonAboutProblem(sampleProblem, sampleGenomes, ['dev', 'business'])
    );

    const firstRunOutput = JSON.stringify(runs[0].output);
    const firstRunAudit = JSON.stringify(runs[0].auditTrail.source_attribution);

    for (let i = 1; i < runs.length; i++) {
      expect(JSON.stringify(runs[i].output)).toBe(firstRunOutput);
      expect(JSON.stringify(runs[i].auditTrail.source_attribution)).toBe(firstRunAudit);
    }
  });

  it('should rank genomes according to relevance and believability weighting', () => {
    const result = engine.reasonAboutProblem('Cellular immunotherapy CAR-T design for solid tumors', Object.keys(ALL_LEADER_GENOMES), ['science_biotech']);
    const routeState = result.states.find(s => s.phase === 'ROUTE');

    expect(routeState?.outputs.rankedGenomes).toBeDefined();
    const ranked = routeState?.outputs.rankedGenomes || [];
    expect(ranked.length).toBeGreaterThan(0);

    const topGenomes = ranked.slice(0, 5).map(g => g.id);
    expect(topGenomes.some(id => id.includes('carl-june') || id.includes('sadelain') || id.includes('sharma'))).toBe(true);
  });

  it('should generate a complete, fully traceable audit trail', () => {
    const result = engine.reasonAboutProblem(sampleProblem, sampleGenomes, ['dev']);

    expect(result.auditTrail).toBeDefined();
    expect(result.auditTrail.fully_traceable).toBe(true);
    expect(result.auditTrail.problem_input).toBe(sampleProblem);
    expect(result.auditTrail.source_attribution.length).toBeGreaterThan(0);

    for (const attr of result.auditTrail.source_attribution) {
      expect(attr.leader).toBeDefined();
      expect(attr.sources.length).toBeGreaterThan(0);
    }
  });
});

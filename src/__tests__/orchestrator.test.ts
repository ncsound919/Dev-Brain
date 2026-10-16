import { describe, it, expect } from 'vitest';
import { MultiAgentOrchestrator } from '../engine/orchestrator';
import { DeterministicReasoningEngine } from '../engine/reasoningEngine';

describe('MultiAgentOrchestrator', () => {
  const engine = new DeterministicReasoningEngine();
  const orchestrator = new MultiAgentOrchestrator(engine);
  const sampleGenomes = ['andrej-karpathy', 'clayton-christensen', 'warren-buffett', 'carl-june', 'andy-galpin'];

  it('should initialize multi-domain agents from leader genomes', () => {
    orchestrator.createAgentsFromGenomes(sampleGenomes);
    expect(Object.keys(orchestrator.agents)).toHaveLength(sampleGenomes.length);

    for (const key of sampleGenomes) {
      const agent = orchestrator.agents[key];
      expect(agent).toBeDefined();
      expect(agent.agent).toBeDefined();
      expect(agent.sector).toBeDefined();
      expect(agent.perspective).toBeDefined();
      expect(agent.confidence).toBeGreaterThan(0);
      expect(agent.weight).toBeGreaterThan(0);
    }
  });

  it('should compute consensus and debate across diverse sectors', () => {
    orchestrator.createAgentsFromGenomes(sampleGenomes);
    const result = orchestrator.debateAndConsense('Multi-sector strategy formulation');

    expect(result.consensus).toBeDefined();
    expect(result.consensus.agreementLevel).toBeGreaterThan(0);
    expect(result.consensus.averageConfidence).toBeGreaterThan(0.85);
    expect(result.consensus.sectorDiversity).toBe(0.83); // 5 distinct / 6 total sectors

    expect(result.debate).toBeDefined();
    expect(typeof result.debate).toBe('string');
    expect(result.debate.length).toBeGreaterThan(50);
  });

  it('names the problem in the debate instead of discarding it', () => {
    orchestrator.createAgentsFromGenomes(sampleGenomes);
    const problem = 'Ship the redesign or harden the consent gate first?';
    const result = orchestrator.debateAndConsense(problem);
    expect(result.debate).toContain(problem);
  });

  // 2026-10-15 audit: agreementLevel used to be `0.72 + n/25·0.25` — a function
  // of the AGENT COUNT, so "94% consensus" meant "you picked five leaders", and
  // the old test asserting `> 0` passed for any input. These pin the real
  // property: agreement is confidence dispersion, so disagreement must move it.
  it('reports lower agreement when the agents disagree than when they agree', () => {
    const agree = orchestrator.computeConsensus({
      a: { agent: 'a', sector: 'dev', subBrain: 'x', perspective: '', toolChoice: '', confidence: 0.9, weight: 1, failureModeWarning: '' },
      b: { agent: 'b', sector: 'dev', subBrain: 'x', perspective: '', toolChoice: '', confidence: 0.9, weight: 1, failureModeWarning: '' },
    });
    const disagree = orchestrator.computeConsensus({
      a: { agent: 'a', sector: 'dev', subBrain: 'x', perspective: '', toolChoice: '', confidence: 0.99, weight: 1, failureModeWarning: '' },
      b: { agent: 'b', sector: 'dev', subBrain: 'x', perspective: '', toolChoice: '', confidence: 0.2, weight: 1, failureModeWarning: '' },
    });
    expect(agree.agreementLevel).toBeGreaterThan(disagree.agreementLevel);
    expect(disagree.agreementLevel).toBeLessThan(0.5);
  });

  it('does not call zero agents unanimous', () => {
    const none = orchestrator.computeConsensus({});
    expect(none.agreementLevel).toBe(0);
    expect(none.strongConsensus).toBe(false);
  });
});

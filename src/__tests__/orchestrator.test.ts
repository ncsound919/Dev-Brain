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
});

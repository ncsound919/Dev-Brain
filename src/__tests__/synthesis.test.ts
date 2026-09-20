import { describe, it, expect } from 'vitest';
import { SynthesisEngine } from '../engine/synthesis';
import { DeterministicReasoningEngine } from '../engine/reasoningEngine';
import { MultiAgentOrchestrator } from '../engine/orchestrator';

describe('SynthesisEngine', () => {
  const engine = new DeterministicReasoningEngine();
  const orchestrator = new MultiAgentOrchestrator(engine);
  const sampleGenomes = ['andrej-karpathy', 'clayton-christensen', 'warren-buffett'];
  const problem = 'Building an AI startup with strong defensibility and sustainable unit economics';

  it('should generate unified output and complete 5-section audit report', () => {
    const reasoning = engine.reasonAboutProblem(problem, sampleGenomes, ['dev', 'business', 'financial']);
    orchestrator.createAgentsFromGenomes(sampleGenomes);
    const debate = orchestrator.debateAndConsense(problem);

    const synthesis = SynthesisEngine.generateUnifiedOutput(reasoning, debate.agents, debate.consensus);

    expect(synthesis).toBeDefined();
    expect(synthesis.recommendations.length).toBeGreaterThan(3);
    expect(synthesis.decisionMatrix).toBeDefined();
    expect(synthesis.decisionMatrix?.options.length).toBeGreaterThanOrEqual(2);

    // Audit Report 5 Sections Check
    const audit = synthesis.auditReport;
    expect(audit.section_1_input).toBeDefined();
    expect(audit.section_2_state_transitions).toHaveLength(3);
    expect(audit.section_3_agent_collaboration).toBeDefined();
    expect(audit.section_4_public_attribution.length).toBeGreaterThan(0);
    expect(audit.section_5_reproducibility.determinism_guarantee).toBeDefined();
    expect(audit.section_5_reproducibility.full_trace_available).toBe(true);
  });
});

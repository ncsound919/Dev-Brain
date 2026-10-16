import { ALL_LEADER_GENOMES } from '../data/genomes';
import { DeterministicReasoningEngine } from './reasoningEngine';
import { AgentPerspective, ConsensusData, OrchestrationResult } from '../types';

export class MultiAgentOrchestrator {
  public engine: DeterministicReasoningEngine;
  public agents: Record<string, AgentPerspective> = {};

  constructor(engine: DeterministicReasoningEngine) {
    this.engine = engine;
  }

  public createAgentsFromGenomes(genomeKeys: string[]): void {
    this.agents = {};
    genomeKeys.forEach(key => {
      const genome = ALL_LEADER_GENOMES[key];
      if (genome) {
        this.agents[key] = {
          agent: genome.name,
          sector: genome.sector,
          subBrain: genome.subBrain,
          perspective: `Applying '${genome.coreStrength}' via mental models: ${genome.mentalModels.join(' • ')}`,
          toolChoice: genome.toolchain[0] || 'Domain-specific framework',
          confidence: genome.determinismRating,
          weight: genome.believabilityWeight,
          failureModeWarning: `Failure mode to prevent: ${genome.debuggingStyle}`
        };
      }
    });
  }

  public debateAndConsense(problem: string): OrchestrationResult {
    const thoughts: Record<string, AgentPerspective> = {};

    Object.keys(this.agents).forEach(key => {
      const agent = this.agents[key];
      const genome = ALL_LEADER_GENOMES[key];
      thoughts[key] = {
        agent: agent.agent,
        sector: agent.sector,
        subBrain: agent.subBrain,
        perspective: `[${genome?.subBrain || 'Core'}] Emphasizes ${genome?.mentalModels[0] || 'first-principles'} → Focus: ${genome?.optimizationPattern || 'systematic optimization'}`,
        toolChoice: agent.toolChoice,
        confidence: genome?.determinismRating || 0.94,
        weight: genome?.believabilityWeight || 0.95,
        failureModeWarning: `Audit Focus: ${genome?.debuggingStyle || 'Verification check'}`
      };
    });

    const consensus = this.computeConsensus(thoughts);
    const debate = this.synthesizeDebate(thoughts, problem);

    return {
      agents: this.agents,
      allPerspectives: thoughts,
      consensus,
      debate
    };
  }

  public computeConsensus(thoughts: Record<string, AgentPerspective>): ConsensusData {
    const allAgents = Object.values(thoughts);
    // No agents is not unanimity. The old empty case returned agreementLevel 1
    // and strongConsensus true — the fabricated extreme.
    if (allAgents.length === 0) {
      return { agreementLevel: 0, averageConfidence: 0, strongConsensus: false, sectorDiversity: 0 };
    }
    const weightedConfSum = allAgents.reduce((sum, t) => sum + (t.confidence * t.weight), 0);
    const totalWeights = allAgents.reduce((sum, t) => sum + t.weight, 0);
    const avgConfidence = totalWeights > 0 ? weightedConfSum / totalWeights : 0;

    const uniqueSectors = new Set(allAgents.map(a => a.sector)).size;
    const sectorDiversity = Number((uniqueSectors / 6).toFixed(2));

    // agreementLevel is the DISPERSION of the agents' stated confidences
    // (1 - normalised standard deviation), a real function of the inputs. It
    // replaces `0.72 + agentCount/25 * 0.25`, in which "agreement" was
    // literally how many agents you happened to select (measured 2026-10-15
    // audit; the formula was pinned by a test asserting `> 0`, which it
    // satisfied for any input including zero agents). Stated plainly: these
    // perspectives are static genome templates, so this measures confidence
    // spread, not deliberative agreement — it is named for what it computes.
    const confMean = allAgents.reduce((s, t) => s + t.confidence, 0) / allAgents.length;
    const variance = allAgents.reduce((s, t) => s + (t.confidence - confMean) ** 2, 0) / allAgents.length;
    const stdDev = Math.sqrt(variance);
    const agreementLevel = Number(Math.min(1, Math.max(0, 1 - stdDev / 0.5)).toFixed(3));

    return {
      agreementLevel,
      averageConfidence: Number(avgConfidence.toFixed(3)),
      strongConsensus: avgConfidence > 0.93 && agreementLevel > 0.8,
      sectorDiversity
    };
  }

  public synthesizeDebate(thoughts: Record<string, AgentPerspective>, problem = ''): string {
    const agentList = Object.values(thoughts);
    const header = problem.trim()
      ? `Question put to the council: ${problem.trim()}\n\n`
      : '';
    return header + agentList
      .sort((a, b) => (b.confidence * b.weight) - (a.confidence * a.weight))
      .map((t, i) => `${i + 1}. [${t.sector.toUpperCase()} | ${t.subBrain}] ${t.agent} (Believability: ${(t.weight * 100).toFixed(0)}%): ${t.perspective}\n   • Preferred Framework: ${t.toolChoice}\n   • ${t.failureModeWarning}`)
      .join('\n\n');
  }
}

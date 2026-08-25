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

  public debateAndConsense(_problem: string): OrchestrationResult {
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
    const debate = this.synthesizeDebate(thoughts);

    return {
      agents: this.agents,
      allPerspectives: thoughts,
      consensus,
      debate
    };
  }

  public computeConsensus(thoughts: Record<string, AgentPerspective>): ConsensusData {
    const allAgents = Object.values(thoughts);
    if (allAgents.length === 0) {
      return { agreementLevel: 1, averageConfidence: 0.95, strongConsensus: true, sectorDiversity: 1 };
    }
    const weightedConfSum = allAgents.reduce((sum, t) => sum + (t.confidence * t.weight), 0);
    const totalWeights = allAgents.reduce((sum, t) => sum + t.weight, 0);
    const avgConfidence = weightedConfSum / totalWeights;

    const uniqueSectors = new Set(allAgents.map(a => a.sector)).size;
    const sectorDiversity = Number((uniqueSectors / 5).toFixed(2));

    return {
      agreementLevel: Math.min(1, Math.max(0.78, 0.72 + (allAgents.length / 25) * 0.25)),
      averageConfidence: Number(avgConfidence.toFixed(3)),
      strongConsensus: avgConfidence > 0.93,
      sectorDiversity
    };
  }

  public synthesizeDebate(thoughts: Record<string, AgentPerspective>): string {
    const agentList = Object.values(thoughts);
    return agentList
      .sort((a, b) => (b.confidence * b.weight) - (a.confidence * a.weight))
      .map((t, i) => `${i + 1}. [${t.sector.toUpperCase()} | ${t.subBrain}] ${t.agent} (Believability: ${(t.weight * 100).toFixed(0)}%): ${t.perspective}\n   • Preferred Framework: ${t.toolChoice}\n   • ${t.failureModeWarning}`)
      .join('\n\n');
  }
}

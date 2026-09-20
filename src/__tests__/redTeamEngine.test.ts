import { describe, it, expect } from 'vitest';
import { AdversarialRedTeamEngine } from '../engine/redTeamEngine';

describe('AdversarialRedTeamEngine', () => {
  const redTeam = new AdversarialRedTeamEngine();

  it('should evaluate a decision across 4 adversarial stress vectors', () => {
    const result = redTeam.runSimulation({
      decisionTitle: 'Deploy Event-Driven Kafka Ingestion Pipeline',
      evaluatedOption: 'Append-Only CQRS Architecture'
    });

    expect(result).toBeDefined();
    expect(result.scenarios).toHaveLength(4);

    const scenarioTypes = result.scenarios.map(s => s.type);
    expect(scenarioTypes).toContain('adversary_counter');
    expect(scenarioTypes).toContain('black_swan');
    expect(scenarioTypes).toContain('cascade_friction');
    expect(scenarioTypes).toContain('regulatory_shock');

    expect(result.resilienceScore).toBeGreaterThan(0);
    expect(result.resilienceScore).toBeLessThanOrEqual(100);
    expect(result.recommendedFortifications.length).toBeGreaterThan(0);
  });
});

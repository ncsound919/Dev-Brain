import { describe, it, expect } from 'vitest';
import { OutcomeSimulatorEngine, CURATED_SIMULATION_RUNS } from '../engine/outcomeSimulatorEngine';

describe('OutcomeSimulatorEngine', () => {
  const engine = new OutcomeSimulatorEngine();

  it('should load curated simulation runs', () => {
    expect(CURATED_SIMULATION_RUNS.length).toBeGreaterThan(0);
    const sampleRun = CURATED_SIMULATION_RUNS[0];
    expect(sampleRun.roads.length).toBeGreaterThanOrEqual(2);
    expect(sampleRun.recommendedRoadId).toBeDefined();

    const recommended = sampleRun.roads.find(r => r.id === sampleRun.recommendedRoadId);
    expect(recommended).toBeDefined();
    expect(recommended?.milestones).toHaveLength(5); // day_30, day_90, day_180, year_1, year_3
  });

  it('should synthesize and simulate custom decision options', () => {
    const customRun = engine.generateDynamicSimulation({
      title: 'Cloud Architecture Migration',
      context: 'High-throughput real-time payment gateway',
      optionA: 'Distributed Kafka Stream & CQRS',
      optionB: 'Vertical PostgreSQL Scale'
    });

    expect(customRun).toBeDefined();
    expect(customRun.roads).toHaveLength(2);
    expect(customRun.roads[0].milestones).toHaveLength(5);
    expect(customRun.roads[0].overallSurvivalRate).toBeGreaterThan(customRun.roads[1].overallSurvivalRate);
  });
});

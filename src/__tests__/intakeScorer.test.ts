import { describe, it, expect } from 'vitest';
import { runIntake, scoreTool, buildDecisionMatrix, IntakeToolInput } from '../engine/intakeScorer';

const SAMPLE_TOOLS: IntakeToolInput[] = [
  { name: 'LatticeDB', repo: 'jeffhajewski/latticedb', license: 'MIT', language: 'Zig', platform: 'embedded', stars: 300, tags: ['memory', 'rag', 'graph'] },
  { name: 'OwnMem', repo: 'grpcer/ownmem', license: 'Apache-2.0', language: 'TypeScript', platform: 'windows', stars: 70, tags: ['memory', 'knowledge'] },
  { name: 'kern', repo: 'getkern/kern', license: 'Apache-2.0', language: 'Rust', platform: 'linux-wsl', stars: 140, tags: ['sandbox', 'container'] },
  { name: 'Halofy', repo: 'halofyai/halofy', license: 'AGPL-3.0', language: 'TypeScript', platform: 'windows', stars: 40, tags: ['security', 'governance', 'mcp'] },
  { name: 'hayamimi', repo: 'jackyrx/NX_hayamimi', license: 'MIT', language: 'Python', platform: 'windows', stars: 15, tags: ['stt', 'voice'] },
  { name: 'Sentio', repo: 'truespar/sentio', license: 'MIT', language: 'Rust', platform: 'docker', stars: 500, tags: ['email', 'mailbox'] },
  { name: 'Workout Guide', repo: 'bryllim/workout-guide', license: 'MIT', language: 'TypeScript', platform: 'any', stars: 160, tags: ['fitness', 'health'] },
];

describe('intake scorer', () => {
  it('scores a single tool deterministically (same input → same audit)', () => {
    const a = scoreTool(SAMPLE_TOOLS[0]);
    const b = scoreTool(SAMPLE_TOOLS[0]);
    expect(a.audit).toBe(b.audit);
    expect(a.compositeTriageScore).toBe(b.compositeTriageScore);
    expect(a.preScreenScores.feasibility).toBeGreaterThanOrEqual(0);
    expect(a.preScreenScores.feasibility).toBeLessThanOrEqual(100);
  });

  it('gates copyleft licenses hard (Halofy must be pruned or low-ranked)', () => {
    const result = runIntake({ tools: SAMPLE_TOOLS });
    const halofy = result.ranked.find((t) => t.title === 'Halofy')!;
    expect(halofy.preScreenScores.constraintFit).toBeLessThan(52);
    expect(halofy.status).toBe('pruned_eliminated');
    expect(halofy.eliminationStage).toBe('HARD_CONSTRAINT_FAIL');
  });

  it('ranks the 7 pulled assets and returns top picks + pruned', () => {
    const result = runIntake({ tools: SAMPLE_TOOLS });
    expect(result.totalEvaluated).toBe(7);
    expect(result.topPicks.length).toBe(5);
    expect(result.pruned.length).toBeGreaterThanOrEqual(1);
    expect(result.triage).not.toBeNull();
    expect(result.decisionReadinessScore).toBeGreaterThanOrEqual(0);
  });

  it('handles fewer than 5 tools without the stage-gate engine (small batches)', () => {
    const result = runIntake({ tools: SAMPLE_TOOLS.slice(0, 3) });
    expect(result.totalEvaluated).toBe(3);
    expect(result.ranked.length).toBe(3);
    expect(result.triage).toBeNull();
    // ranked descending
    for (let i = 1; i < result.ranked.length; i++) {
      expect(result.ranked[i - 1].compositeTriageScore).toBeGreaterThanOrEqual(result.ranked[i].compositeTriageScore);
    }
  });
});

describe('decision matrix (primary decision layer)', () => {
  it('builds a 100%-normalized weighted matrix from >=5 candidates (triage path)', () => {
    const matrix = buildDecisionMatrix({ tools: SAMPLE_TOOLS, problem: 'which fleet tools to wire first?' });
    expect(matrix.normalizedPercentageSum).toBe(100);
    expect(matrix.recommendedOptionId).toBeTruthy();
    expect(matrix.options).toHaveLength(5);
    const sum = matrix.options.reduce((a, o) => a + o.weightPercentage, 0);
    expect(sum).toBe(100);
    expect(matrix.generatedBy).toBe('deterministic_engine');
  });

  it('builds a weighted matrix from <5 candidates (direct path)', () => {
    const matrix = buildDecisionMatrix({ tools: SAMPLE_TOOLS.slice(0, 3), problem: 'pick a memory backend' });
    expect(matrix.totalOptionsCount).toBe(3);
    expect(matrix.options.reduce((a, o) => a + o.weightPercentage, 0)).toBe(100);
    expect(matrix.recommendedOptionId).toBeTruthy();
  });

  it('is deterministic: same input → same recommendation + weights', () => {
    const a = buildDecisionMatrix({ tools: SAMPLE_TOOLS, problem: 'decide' });
    const b = buildDecisionMatrix({ tools: SAMPLE_TOOLS, problem: 'decide' });
    expect(a.recommendedOptionId).toBe(b.recommendedOptionId);
    expect(a.options.map((o) => o.weightPercentage)).toEqual(b.options.map((o) => o.weightPercentage));
  });

  it('differentiates agenda goals from repair items (primary decision layer)', () => {
    const matrix = buildDecisionMatrix({
      problem: 'focus + repair ordering',
      tools: [
        { id: 'goal:E1', title: 'Advance: E1 Platform tiers', description: 'agenda goal', tags: ['agenda'] },
        { id: 'goal:E4', title: 'Advance: E4 Vertical products', description: 'agenda goal', tags: ['agenda'] },
        { id: 'job:Daily Marketing Run', title: 'Repair job: Daily Marketing Run', description: 'ssrf blocked', tags: ['repair'] },
        { id: 'mon:agent-browser', title: 'Restore monitor: agent-browser', description: 'down', tags: ['repair'] },
      ],
    });
    const goalOpts = matrix.options.filter((o) => o.title.startsWith('Advance:'));
    const repairOpts = matrix.options.filter((o) => o.title.startsWith('Repair') || o.title.startsWith('Restore'));
    // agenda goals carry higher strategic upside → higher composite → recommended
    expect(goalOpts.some((o) => o.recommended)).toBe(true);
    expect(goalOpts[0].scores.upsidePotential).toBeGreaterThanOrEqual(82);
    expect(repairOpts[0].scores.executionSpeed).toBeGreaterThanOrEqual(84);
    expect(matrix.normalizedPercentageSum).toBe(100);
  });
});
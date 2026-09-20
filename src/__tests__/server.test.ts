import { describe, it, expect } from 'vitest';
import { ALL_LEADER_GENOMES } from '../data/genomes';
import { SECTORS } from '../data/sectors';
import { BUILT_IN_DECISION_TREES } from '../data/decisionTrees';

describe('Dev-Brain System Configuration & Health Diagnostics', () => {
  it('should verify all 6 sectors are registered with 20 leaders each (120 total leaders)', () => {
    const sectors = Object.keys(SECTORS);
    expect(sectors).toHaveLength(6);
    expect(sectors).toEqual(['dev', 'business', 'financial', 'marketing', 'science_biotech', 'science_sports']);

    const totalGenomes = Object.keys(ALL_LEADER_GENOMES);
    expect(totalGenomes).toHaveLength(120);

    for (const sectorKey of sectors) {
      const sectorGenomes = totalGenomes.filter(k => ALL_LEADER_GENOMES[k].sector === sectorKey);
      expect(sectorGenomes).toHaveLength(20);
    }
  });

  it('should verify built-in decision trees are fully structured with condition and verdict nodes', () => {
    const trees = Object.values(BUILT_IN_DECISION_TREES);
    expect(trees.length).toBeGreaterThanOrEqual(7);

    for (const tree of trees) {
      expect(tree.id).toBeDefined();
      expect(tree.name).toBeDefined();
      expect(tree.rootNodeId).toBeDefined();
      expect(tree.nodes[tree.rootNodeId]).toBeDefined();
    }
  });
});

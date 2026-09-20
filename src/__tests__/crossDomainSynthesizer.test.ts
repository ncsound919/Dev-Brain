import { describe, it, expect } from 'vitest';
import { CrossDomainSynthesizer } from '../engine/crossDomainSynthesizer';
import { ALL_LEADER_GENOMES } from '../data/genomes';

describe('CrossDomainSynthesizer', () => {
  const synthesizer = new CrossDomainSynthesizer();

  it('should return rich curated cross-domain hybrids', () => {
    const hybrids = synthesizer.getAllHybrids();
    expect(hybrids.length).toBeGreaterThan(0);

    for (const hybrid of hybrids) {
      expect(hybrid.domainA).toBeDefined();
      expect(hybrid.domainB).toBeDefined();
      expect(hybrid.synergyFormula).toBeDefined();
      expect(hybrid.actionableProtocol.length).toBeGreaterThan(0);
      expect(hybrid.applicabilityScore).toBeGreaterThan(80);
    }
  });

  it('should dynamically synthesize cross-domain hybrids between any two leaders', () => {
    const leaderA = ALL_LEADER_GENOMES['andrej-karpathy']; // Dev
    const leaderB = ALL_LEADER_GENOMES['warren-buffett']; // Financial

    expect(leaderA).toBeDefined();
    expect(leaderB).toBeDefined();

    const hybrid = synthesizer.synthesizeCustomHybrid(leaderA, leaderB);
    expect(hybrid).toBeDefined();
    expect(hybrid.domainA).toBe('dev');
    expect(hybrid.domainB).toBe('financial');
    expect(hybrid.actionableProtocol).toHaveLength(4);
    expect(hybrid.applicabilityScore).toBeGreaterThan(80);
  });
});

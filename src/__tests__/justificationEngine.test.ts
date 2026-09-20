import { describe, it, expect } from 'vitest';
import { JustificationEngine, CURATED_JUSTIFICATIONS } from '../engine/justificationEngine';

describe('JustificationEngine', () => {
  const engine = new JustificationEngine();

  it('should contain rich curated justifications with axioms and falsifiability tripwires', () => {
    expect(CURATED_JUSTIFICATIONS.length).toBeGreaterThan(0);
    const sample = CURATED_JUSTIFICATIONS[0];

    expect(sample.firstPrinciplesAxioms.length).toBeGreaterThan(0);
    expect(sample.counterfactualRejections.length).toBeGreaterThan(0);
    expect(sample.falsifiabilityConditions.length).toBeGreaterThan(0);
    expect(sample.audienceExplanations.executiveBrief).toBeDefined();
    expect(sample.audienceExplanations.architectTechnicalProof).toBeDefined();
  });

  it('should dynamically generate justifications from decision matrices', () => {
    const dynamic = engine.generateDynamicJustification({
      decisionTitle: 'Adopt Zero-Knowledge Passkey Authentication',
      chosenOption: 'WebAuthn Passkeys with Ed25519 asymmetric verification',
      sector: 'dev',
      coreProblem: 'Eliminating phishing and shared secrets across all vault authentication gates',
      rejectedOptions: ['Legacy username/password', 'SMS 2FA']
    });

    expect(dynamic).toBeDefined();
    expect(dynamic.firstPrinciplesAxioms.length).toBeGreaterThanOrEqual(2);
    expect(dynamic.counterfactualRejections.length).toBeGreaterThanOrEqual(2);
    expect(dynamic.paretoOptimalityScore).toBeGreaterThan(80);
    expect(dynamic.audienceExplanations.auditorComplianceRationale).toBeDefined();
  });
});

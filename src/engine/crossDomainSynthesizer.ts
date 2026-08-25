import { CrossDomainHybrid, LeaderGenome } from '../types';

export const CURATED_CROSS_DOMAIN_HYBRIDS: CrossDomainHybrid[] = [
  {
    id: 'hybrid-001',
    title: 'CNS Micro-Sprint CPU Throttling (Dev + Sports Science)',
    domainA: 'dev',
    leaderA: 'Linus Torvalds',
    modelA: 'Good Taste & Special Cases Elimination',
    domainB: 'science_sports',
    leaderB: 'Charlie Francis',
    modelB: 'High-Low CNS Neuromuscular Periodization',
    hybridMentalModelName: 'Neuromorphic Compute Interval Periodization',
    synergyFormula: 'Torvalds Special-Case Simplicity × Francis 95%+ CNS Burst/Recovery Curve',
    conceptualBridge: 'Just as Charlie Francis proved that training at 80-90% velocity causes maximal nervous system fatigue with minimal speed adaptation, running CPU/GPU workloads at constant 85% load causes memory thrashing and thermal throttling. Systems must cycle between 100% hermetic sprint bursts and deep idle garbage collection.',
    actionableProtocol: [
      'Eliminate continuous background polling; batch all event writes into 100% saturated micro-bursts.',
      'Enforce mandatory 200ms zero-allocation recovery intervals between high-throughput batch bursts.',
      'Treat server memory leaks like neuromuscular central fatigue—reboot worker containers before degradation occurs.'
    ],
    realWorldEnterpriseCase: 'High-frequency trading exchange reduced tail latency variance by 42% by adopting sprint-recovery thread scheduling over continuous thread pooling.',
    antiPatternTrap: 'Running servers at steady 75-85% capacity thinking it is "safe"—it produces maximum latency jitter and undetected thermal throttling.',
    applicabilityScore: 96
  },
  {
    id: 'hybrid-002',
    title: 'Stochastic Immunotherapy Boolean Gating (Financial + Biotech)',
    domainA: 'financial',
    leaderA: 'Jim Simons',
    modelA: 'Non-Random Statistical Invariance & Hidden Markov Regimes',
    domainB: 'science_biotech',
    leaderB: 'Carl June',
    modelB: 'SynNotch Boolean AND/NOT Synthetic Cell Circuitry',
    hybridMentalModelName: 'Dual-Key Algorithmic Gating Matrix',
    synergyFormula: 'Simons Statistical Edge Filtering × June Synthetic Antigen Boolean Logic',
    conceptualBridge: 'Carl June prevents healthy tissue destruction in cancer therapy by requiring two tumor antigens (Antigen A AND Antigen B) to activate cell killing. Applying this to quantitative trading or risk management: never execute high-leverage orders on a single indicator; require dual uncorrelated statistical regimes to trigger capital deployment.',
    actionableProtocol: [
      'Require Boolean AND logic across two completely independent orthogonal datasets before triggering automated execution.',
      'Install an automated "SynNotch NOT-gate": if macro volatility exceeds threshold, instantaneously kill all child processes.',
      'Treat False Positive trades with the same gravity as CAR-T off-target toxicity.'
    ],
    realWorldEnterpriseCase: 'Multi-strategy hedge fund reduced drawdown during market crashes to near-zero by requiring simultaneous microstructure order-flow and macro-credit boolean confirmations.',
    antiPatternTrap: 'Single-signal trigger execution without orthogonal confirmation channels.',
    applicabilityScore: 94
  },
  {
    id: 'hybrid-003',
    title: 'Radical Margin of Safety (Business + Financial)',
    domainA: 'business',
    leaderA: 'Jeff Bezos',
    modelA: 'Two-Way Door Decisions & Working Backwards',
    domainB: 'financial',
    leaderB: 'Warren Buffett',
    modelB: 'Margin of Safety & Inversion (Munger)',
    hybridMentalModelName: 'Reversible Asymmetric Capital Moats',
    synergyFormula: 'Bezos Two-Way Speed × Buffett 40% Margin of Safety Buffer',
    conceptualBridge: 'Merge Bezos high-velocity decision categorization (Type 1 vs Type 2) with Buffett and Mungers deep margin of safety. If a decision is Type 2 (reversible), move at 90% velocity with zero excess buffer; if Type 1 (irreversible), demand a minimum 40% financial, latency, or capacity margin of safety before proceeding.',
    actionableProtocol: [
      'Tag every architectural and strategic initiative strictly as Type 1 (One-Way) or Type 2 (Two-Way).',
      'For all Type 1 decisions, calculate the Worst-Case Inversion: what kills the company if this fails?',
      'Enforce an automatic 1.5x runway or capacity buffer on all irreversible commitments.'
    ],
    realWorldEnterpriseCase: 'Cloud infrastructure scaleup survived a 50% revenue drop during macroeconomic downturn by strictly buffering Type 1 infrastructure contracts while aggressively testing Type 2 pricing models.',
    antiPatternTrap: 'Applying cumbersome 6-month approval committees to Type 2 reversible experiments, while rushing through Type 1 irreversible multi-year contracts.',
    applicabilityScore: 98
  },
  {
    id: 'hybrid-004',
    title: 'Biomechanical Micro-Dosing for Developer Burnout (Dev + Sports Science)',
    domainA: 'dev',
    leaderA: 'Martin Fowler',
    modelA: 'Continuous Refactoring & Strangler Fig Migration',
    domainB: 'science_sports',
    leaderB: 'Jill Cook',
    modelB: 'Tendinopathy Isometric Loading Continuum',
    hybridMentalModelName: 'Isometric Codebase & Cognitive Loading',
    synergyFormula: 'Fowler Micro-Refactoring Strangler × Cook Heavy Slow Resistance Loading',
    conceptualBridge: 'Jill Cook demonstrated that resting an injured tendon makes it weaker, while heavy slow resistance (HSR) heals it without inflammatory spikes. Similarly, stopping all feature work to do a massive "rewrite" fails; continuous micro-dosed refactoring maintains cognitive and codebase resilience under steady tension.',
    actionableProtocol: [
      'Ban 6-month freeze-and-rewrite projects; enforce 15% refactoring budget on every single feature PR.',
      'Apply "isometric architectural holds": freeze flaky tests immediately in isolated suites before they poison CI/CD.',
      'Treat developer fatigue with structured micro-deployments rather than chaotic heroic crunch pushes.'
    ],
    realWorldEnterpriseCase: 'Tier-1 enterprise SaaS reduced engineering churn by 60% and doubled release velocity by converting a monolithic rewrite into a continuous Strangler Fig HSR protocol.',
    antiPatternTrap: 'Complete development stoppage for full system rebuilds, which almost universally results in second-system syndrome.',
    applicabilityScore: 92
  }
];

export class CrossDomainSynthesizer {
  public getAllHybrids(): CrossDomainHybrid[] {
    return CURATED_CROSS_DOMAIN_HYBRIDS;
  }

  public synthesizeCustomHybrid(
    leaderA: LeaderGenome,
    leaderB: LeaderGenome
  ): CrossDomainHybrid {
    const isSameSector = leaderA.sector === leaderB.sector;
    const modelA = leaderA.mentalModels[0] || 'Domain Heuristic A';
    const modelB = leaderB.mentalModels[0] || 'Domain Heuristic B';

    const hybridName = `${leaderA.name.split(' ').pop()}–${leaderB.name.split(' ').pop()} ${
      isSameSector ? 'Convergence Protocol' : 'Cross-Disciplinary Synthesizer'
    }`;

    return {
      id: `synth-${leaderA.id}-${leaderB.id}-${Date.now().toString(36)}`,
      title: `${leaderA.name} (${leaderA.sector}) × ${leaderB.name} (${leaderB.sector})`,
      domainA: leaderA.sector,
      leaderA: leaderA.name,
      modelA,
      domainB: leaderB.sector,
      leaderB: leaderB.name,
      modelB,
      hybridMentalModelName: hybridName,
      synergyFormula: `(${leaderA.name}: ${modelA}) ⊗ (${leaderB.name}: ${modelB})`,
      conceptualBridge: `By bridging ${leaderA.name}'s focus on "${leaderA.coreStrength}" with ${leaderB.name}'s philosophy of "${leaderB.coreStrength}", we create an orthogonal decision filter that eliminates single-domain blind spots. This forces the system to balance ${leaderA.debuggingStyle} with ${leaderB.optimizationPattern}.`,
      actionableProtocol: [
        `Step 1 (Perception): Filter problem inputs through ${leaderA.name}'s primary question: "${leaderA.favoriteQuestions[0] || 'What is the root invariant?'}"`,
        `Step 2 (Deliberation): Pressure-test constraints using ${leaderB.name}'s mental model: "${modelB}".`,
        `Step 3 (Execution): Implement using ${leaderA.name}'s toolchain pattern (${leaderA.toolchain.slice(0, 2).join(', ')}) reinforced by ${leaderB.name}'s governance rules.`,
        `Step 4 (Validation): Apply deterministic audit checklist combining ${leaderA.sector} precision with ${leaderB.sector} risk boundaries.`
      ],
      realWorldEnterpriseCase: `Applicable to enterprise situations where ${leaderA.sector.toUpperCase()} precision must be deployed under intense ${leaderB.sector.toUpperCase()} uncertainty or resource constraints.`,
      antiPatternTrap: `Over-indexing on ${leaderA.name}'s approach while neglecting ${leaderB.name}'s safety and failure constraints.`,
      applicabilityScore: Math.round((leaderA.believabilityWeight + leaderB.believabilityWeight) * 48)
    };
  }
}

export const globalCrossDomainSynthesizer = new CrossDomainSynthesizer();

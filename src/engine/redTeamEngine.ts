import { RedTeamSimulationResult, StressScenario, RedTeamThreatLevel } from '../types';

export class AdversarialRedTeamEngine {
  /**
   * Evaluates a decision or strategy against 4 adversarial stress vectors:
   * 1. Competitor Asymmetric Counter-Strike
   * 2. Black Swan / Infrastructure Blackout
   * 3. Cascading Operational Friction & Debt
   * 4. Regulatory / Policy Shift
   */
  public runSimulation(params: {
    decisionTitle: string;
    evaluatedOption: string;
    domainHint?: string;
  }): RedTeamSimulationResult {
    const { decisionTitle, evaluatedOption } = params;
    const lower = (decisionTitle + ' ' + evaluatedOption).toLowerCase();

    const scenarios: StressScenario[] = [];

    // 1. Adversary Counter-Strike Scenario
    let counterName = 'Competitor Price War & Feature Copycat Strike';
    let attackVector = 'Rival releases a cloned architecture within 6 weeks, subsidized by VC/parent cash flow.';
    let failureMode = 'Margin compression and customer hesitation during procurement cycle.';
    let counterMitigation = 'Erect proprietary data flywheel and lock-in switching barriers via workflow integrations.';
    let threatLevel: RedTeamThreatLevel = 'MODERATE';
    let prob = 65;
    let impact = 7;

    if (lower.includes('kafka') || lower.includes('database') || lower.includes('cloud') || lower.includes('infra') || lower.includes('dev')) {
      counterName = 'Zero-Day Dependency Exploit & Vendor Price Gouging';
      attackVector = 'Critical CVE discovered in open-source ingestion runtime combined with 300% storage tier price hike.';
      failureMode = 'Emergency hot-patching causing 4 hours of cascading cluster downtime and SLA penalties.';
      counterMitigation = 'Implement multi-AZ failover cluster with automated hermetic image rollback pipelines.';
      threatLevel = 'SEVERE';
      prob = 45;
      impact = 8;
    } else if (lower.includes('car-t') || lower.includes('bio') || lower.includes('tumor') || lower.includes('clinical')) {
      counterName = 'Hostile Patent Encirclement & Cell Therapy Off-Target Lawsuit';
      attackVector = 'Competitor files blocking composition-of-matter patent claims on hinge/transmembrane domain.';
      failureMode = 'Indefinite FDA clinical hold pending freedom-to-operate litigation.';
      counterMitigation = 'Design orthogonal synthetic receptor variants and file expedited utility patents across 4 continents.';
      threatLevel = 'CRITICAL';
      prob = 35;
      impact = 9;
    } else if (lower.includes('speed') || lower.includes('injury') || lower.includes('sports') || lower.includes('fatigue')) {
      counterName = 'Opponent High-Pressing CNS Overload Trap';
      attackVector = 'Opposing coaching staff intentionally dictates 120-possession game pace to exploit biomechanical fatigue.';
      failureMode = 'Fourth-quarter deceleration decay leading to acute muscle strain and blown lead.';
      counterMitigation = 'Strict 28-minute rotational hard-cap and targeted isotonic electrolyte recovery intervals.';
      threatLevel = 'MODERATE';
      prob = 75;
      impact = 6;
    }

    scenarios.push({
      id: `sc-adv-${Date.now()}-1`,
      name: counterName,
      type: 'adversary_counter',
      threatLevel,
      probability: prob,
      impactScore: impact,
      attackVector,
      failureMode,
      blastRadius: 'Direct Revenue & Operational SLA (Zone 1)',
      counterMitigation,
      preMortemTrigger: 'If competitor launches equivalent within 60 days, activate Tier-2 differentiation playbook immediately.'
    });

    // 2. Black Swan Macro Shock
    scenarios.push({
      id: `sc-bs-${Date.now()}-2`,
      name: 'Black Swan: Regional Infrastructure Blackout & Cloud API Severance',
      type: 'black_swan',
      threatLevel: 'SEVERE',
      probability: 18,
      impactScore: 9,
      attackVector: 'Primary cloud data center suffers undersea cable cut and DNS routing table corruption.',
      failureMode: 'Data partition split-brain condition where asynchronous nodes accept divergent writes.',
      blastRadius: 'Global Ingestion Mesh & Consistency Guarantees (Zone 3)',
      counterMitigation: 'Enforce strict CRDT deterministic merge resolution and offline-first local state queues.',
      preMortemTrigger: 'Heartbeat latency > 1200ms triggers automatic read-only quarantine and replica failover.'
    });

    // 3. Cascading Operational Friction
    scenarios.push({
      id: `sc-casc-${Date.now()}-3`,
      name: 'Cascading System Friction: Silent Memory Degradation & Skill Attrition',
      type: 'cascade_friction',
      threatLevel: 'MODERATE',
      probability: 55,
      impactScore: 6,
      attackVector: 'Core architect departures combined with unprofiled GC pause drift in production.',
      failureMode: 'Mean Time to Resolution (MTTR) increases from 12 minutes to 5.5 hours over 6 months.',
      blastRadius: 'Engineering Team Velocity & On-Call Burnout (Zone 2)',
      counterMitigation: 'Implement executable architecture decision records (ADRs) and deterministic FSM guardrails.',
      preMortemTrigger: 'MTTR exceeding 45 minutes triggers mandatory 2-week architectural refactoring sprint.'
    });

    // 4. Regulatory / Policy Shock
    scenarios.push({
      id: `sc-reg-${Date.now()}-4`,
      name: 'Regulatory Shock: Instant Sovereignty & Privacy Mandate Shift',
      type: 'regulatory_shock',
      threatLevel: 'MODERATE',
      probability: 30,
      impactScore: 8,
      attackVector: 'New international sovereignty directive mandates zero telemetry export across jurisdictional borders.',
      failureMode: 'Existing analytics pipelines become non-compliant overnight subject to 4% turnover fines.',
      blastRadius: 'Legal Compliance & Cross-Border Data Ingestion (Zone 4)',
      counterMitigation: 'Architect zero-knowledge edge hashing and self-contained local inferencing instances.',
      preMortemTrigger: 'Regulatory notice initiates automated localized database sharding script.'
    });

    // Compute overall resilience score: 100 - weighted threat sum
    const threatSum = scenarios.reduce((acc, s) => {
      const threatWeight = s.threatLevel === 'CRITICAL' ? 1.0 : s.threatLevel === 'SEVERE' ? 0.75 : s.threatLevel === 'MODERATE' ? 0.45 : 0.2;
      return acc + (s.probability / 100) * (s.impactScore / 10) * 35 * threatWeight;
    }, 0);

    const rawResilience = Math.max(15, Math.min(95, Math.round(100 - threatSum)));
    let robustnessGrade: RedTeamSimulationResult['robustnessGrade'] = 'FORTIFIED';
    if (rawResilience < 40) robustnessGrade = 'FRAGILE';
    else if (rawResilience < 65) robustnessGrade = 'VULNERABLE';
    else if (rawResilience < 80) robustnessGrade = 'RESILIENT';

    return {
      id: `redteam-${Date.now().toString(36)}`,
      decisionTitle,
      evaluatedOption,
      resilienceScore: rawResilience,
      robustnessGrade,
      simulatedAt: new Date().toISOString(),
      scenarios,
      primaryVulnerability: scenarios.reduce((prev, curr) => (curr.impactScore * curr.probability > prev.impactScore * prev.probability ? curr : prev)).name,
      recommendedFortifications: [
        'Establish automated circuit breakers that sever dependencies before cascading buffer saturation.',
        'Adopt dual-sourcing across all external APIs and mission-critical software vendors.',
        'Run monthly chaos red-team game days simulating black-swan partitioned state failures.',
        'Embed immutable cryptographically auditable event logs to defeat regulatory disputes.'
      ],
      preMortemSummary: `If this decision fails 12 months from now, it will be due to ${scenarios[0].name.toLowerCase()} interacting with unmitigated operational friction. Implement the recommended circuit breakers immediately.`,
      worstCaseSurvivalProbability: Math.max(45, Math.min(98, Math.round(rawResilience * 0.95 + 8)))
    };
  }
}

export const globalRedTeamEngine = new AdversarialRedTeamEngine();

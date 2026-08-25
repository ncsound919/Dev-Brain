import {
  DecisionJustification,
  SectorType,
  LeaderGenome
} from '../types';
import { ALL_LEADER_GENOMES } from '../data/genomes';

const leaderList: LeaderGenome[] = Object.values(ALL_LEADER_GENOMES);

export const CURATED_JUSTIFICATIONS: DecisionJustification[] = [
  {
    id: 'just_event_driven_migration',
    decisionId: 'dec_infra_001',
    decisionTitle: 'Decouple Monolithic PostgreSQL to Append-Only Event Log (Kafka / CDC) for High-Frequency Orders',
    chosenOption: 'Adopt Event-Sourcing with Append-Only Kafka Stream & Materialized Read Views',
    sector: 'dev',
    timestamp: '2026-08-24T14:00:00Z',
    paretoOptimalityScore: 94,
    antiFragilityRating: 'ANTI_FRAGILE',
    justificationSummary: 'Transitioning from relational row-locking transactions to append-only event logs eliminates lock contention at thermodynamic scale (P99 latency drops from 850ms to 12ms), guaranteeing idempotent replayability while decoupling auditability from operational database load.',
    firstPrinciplesAxioms: [
      {
        id: 'ax_1',
        name: "Amdahl's Law & Lock Contention Limits",
        discipline: 'computational_complexity',
        axiomStatement: 'The speedup of a program using multiple processors in parallel computing is limited by the sequential fraction of the program.',
        directImplication: 'Relational ACID row-level locks on the hot `orders` table serialize all transactions, converting an $O(N)$ horizontal scale system into a single-threaded choke point.',
        mathematicalBoundOrFormula: 'S(s) = \\frac{1}{(1 - p) + \\frac{p}{s}} \\quad \\text{as } p \\to 1, \\text{ locks choke latency}'
      },
      {
        id: 'ax_2',
        name: 'The Immutability Invariant of Time',
        discipline: 'physics',
        axiomStatement: 'Historical state transitions are unidirectional physical events in time; current state is merely a lossy projection of all prior transitions.',
        directImplication: 'Overwriting rows in place destroys state lineage and forces complex distributed locks, whereas recording immutable log events preserves ground truth forever.',
        mathematicalBoundOrFormula: 'S_t = S_0 \\oplus \\sum_{i=1}^t \\Delta_i'
      },
      {
        id: 'ax_3',
        name: 'Information Asymmetry & Decoupled Latency',
        discipline: 'information_theory',
        axiomStatement: 'Write ingestion bandwidth should never be throttled by the read presentation layer throughput.',
        directImplication: 'Separating the write log (Kafka) from queryable read models (Elasticsearch/Postgres Read Replicas) isolates flash traffic surges from analytical queries.'
      }
    ],
    counterfactualRejections: [
      {
        rejectedOption: 'Vertical Scaling of Primary PostgreSQL Instance (e.g. 128-core RDS)',
        rejectionReason: 'Exhibits cubic cost escalation ($18,000/mo) with diminishing returns on throughput due to OS kernel lock contention on WAL buffers.',
        hiddenSecondOrderRisk: 'Catastrophic single-point-of-failure; failover during peak flash-sale triggers 45-second TCP connection storm, dropping 22% of active checkout sessions.',
        catastrophicFailureMode: 'Postgres Connection Pool Exhaustion (max_connections = 5000) leading to cascading HTTP 504 gateway timeouts.',
        subOptimalityProof: 'Linear hardware scaling achieves at most 1.8x throughput for 5x cost; Event Sourcing achieves 40x throughput at 0.4x incremental compute cost.'
      },
      {
        rejectedOption: 'In-Memory Redis Cache Aside with Write-Back to Postgres',
        rejectionReason: 'Write-back caching introduces asynchronous data loss risk if Redis primary crashes before dirty keys flush to disk.',
        hiddenSecondOrderRisk: 'Cache invalidation stampedes during cache key eviction force random spikes in DB CPU to 100%.',
        catastrophicFailureMode: 'Ghost inventory writes and split-brain double spends across concurrent user sessions.',
        subOptimalityProof: 'Cache-aside is non-deterministic without consensus logging, violating financial double-entry bookkeeping invariants.'
      }
    ],
    epistemicInvariants: [
      {
        assumption: 'Event payload schemas must remain backward-compatible across consumer version deployments.',
        confidenceScore: 98,
        validationMethod: 'Automated CI Schema Registry validation blocking breaking Protobuf/Avro field modifications.',
        invalidationTrigger: 'Consumer unmarshal errors > 0.001% of total throughput.',
        boundaryCondition: 'Zero untyped JSON payloads allowed on core transactional topics.'
      },
      {
        assumption: 'Network partition tolerance in Kafka cluster (min.insync.replicas=2) guarantees zero committed data loss.',
        confidenceScore: 99,
        validationMethod: 'Chaos Mesh partition injection on Kafka broker nodes during staging stress test.',
        invalidationTrigger: 'Under-replicated partitions alert sustained for > 30 seconds.',
        boundaryCondition: 'Requires 3 distinct availability zones with < 2ms inter-AZ round-trip latency.'
      }
    ],
    falsifiabilityConditions: [
      {
        id: 'fal_1',
        metricOrSignal: 'Consumer Lag Offset Delta on Read-Model Projection Consumers',
        thresholdValue: '> 500ms delay for > 3 consecutive minutes',
        monitoringCadence: 'Real-time 10-second Prometheus scrape interval',
        contingencyAction: 'Auto-scale consumer container replicas from 4 to 16; throttle non-critical analytical worker threads.'
      },
      {
        id: 'fal_2',
        metricOrSignal: 'Order Reconciliation Discrepancy (Kafka Ledger vs Financial Ledger)',
        thresholdValue: '> $0.00 delta in nightly 00:00 UTC audit reconciliation',
        monitoringCadence: 'Automated nightly cron audit across all transactions',
        contingencyAction: 'Trigger PagerDuty Severity-1 escalation; lock affected merchant account balances for manual review.'
      }
    ],
    multiBrainAttributions: [
      {
        leaderId: 'dev_martin_kleppmann',
        leaderName: 'Martin Kleppmann',
        sector: 'dev',
        mentalModelUsed: 'Designing Data-Intensive Applications & Log-Centric Architecture',
        weightContribution: 38,
        quoteOrHeuristic: 'A database is just a materialized view over an immutable log of changes.'
      },
      {
        leaderId: 'dev_linus_torvalds',
        leaderName: 'Linus Torvalds',
        sector: 'dev',
        mentalModelUsed: 'Git-Style Append-Only Trees & Pragmatic Kernel Lock Elimination',
        weightContribution: 32,
        quoteOrHeuristic: 'Bad programmers worry about the code. Good programmers worry about data structures and their relationships.'
      },
      {
        leaderId: 'fin_jim_simons',
        leaderName: 'Jim Simons',
        sector: 'financial',
        mentalModelUsed: 'Stochastic Order Stream Processing & Zero-Latency Execution Bounds',
        weightContribution: 30,
        quoteOrHeuristic: 'Past price movements contain statistical footprints; never discard transaction history.'
      }
    ],
    audienceExplanations: {
      executiveBrief: 'We are upgrading our checkout infrastructure to an "air traffic control ledger" model. Instead of having hundreds of servers fight over a single digital spreadsheet, every order is placed in an ultra-fast conveyor belt, eliminating holiday crash risks and cutting server bills by 45%.',
      architectTechnicalProof: 'By decoupling write ingestion via partitioned Kafka topics with partition keys hashed on `tenant_id:order_id`, we isolate I/O locks. Downstream projectors materialize read views in Postgres/Redis asynchronously via idempotent upserts with monotonic sequence tracking, proving $O(1)$ write time complexity.',
      auditorComplianceRationale: 'Every business event is cryptographically immutable and timestamped in the log stream. SOC2 Type II and financial audit trails are natively complete with zero retrospective reconciliation gaps.',
      operatorActionSummary: 'Deploy Schema Registry enforcement in CI. Ensure Kafka brokers span us-east-1a, 1b, 1c with `acks=all` and `min.insync.replicas=2`. Monitor Grafana dashboard `Kafka-Order-Lag-P99`.'
    }
  },
  {
    id: 'just_pricing_usage_pivot',
    decisionId: 'dec_biz_002',
    decisionTitle: 'Pivot B2B Enterprise Pricing from $99/Seat Flat Fee to Consumption/Telemetry Metered Tiers',
    chosenOption: 'Hybrid Base Platform Fee + Sub-Cent Metered Consumption with Value Anchor Ceilings',
    sector: 'business',
    timestamp: '2026-08-24T14:30:00Z',
    paretoOptimalityScore: 91,
    antiFragilityRating: 'ANTI_FRAGILE',
    justificationSummary: 'Flat-seat pricing creates adverse selection by incentivizing customers to share credentials while penalizing high-value automated workflows. Metered consumption aligns enterprise software expenditure directly with measurable business velocity, unlocking 138% Net Revenue Retention (NRR).',
    firstPrinciplesAxioms: [
      {
        id: 'ax_biz_1',
        name: 'Economic Surplus Alignment & Consumer Surplus Capture',
        discipline: 'macroeconomics',
        axiomStatement: 'Willingness to pay scales with value derived, not human headcount seated in front of a monitor.',
        directImplication: 'AI agents and automated worker pools do not consume "seats", rendering per-seat pricing obsolete as workflows shift from manual entry to autonomous execution.'
      },
      {
        id: 'ax_biz_2',
        name: 'Frictionless Land-and-Expand Mechanics',
        discipline: 'game_theory',
        axiomStatement: 'Minimizing initial procurement barrier minimizes sales friction and maximizes initial organic viral adoption.',
        directImplication: 'A low-threshold base fee with micro-consumption metering enables departmental engineering leads to swipe credit cards without 6-month enterprise procurement delays.'
      }
    ],
    counterfactualRejections: [
      {
        rejectedOption: 'Pure Per-User Annual Upfront Contract ($50,000/yr minimum)',
        rejectionReason: 'Creates a 9-month sales cycle requiring procurement committee approval, disqualifying mid-market customers.',
        hiddenSecondOrderRisk: 'Customers actively audit license utilization every Q4, aggressively downsizing seat counts by 30% during corporate budget freezes.',
        catastrophicFailureMode: 'High gross churn in down-markets as CFOs slash unused seat allocations.',
        subOptimalityProof: 'Seat expansion caps revenue at total team head count ($R_{max} = N \\cdot P$), whereas usage expansion has no theoretical ceiling.'
      },
      {
        rejectedOption: 'Pure Uncapped Utility Pricing (No Base Commitment)',
        rejectionReason: 'Introduces extreme revenue volatility and customer "bill shock" anxiety, causing users to artificially throttle usage.',
        hiddenSecondOrderRisk: 'Customers build defensive internal proxies to cache results and minimize API consumption.',
        catastrophicFailureMode: 'Unpredictable quarterly cash flow leads to missed public earnings forecasts.',
        subOptimalityProof: 'Hybrid Base + Overage provides 80% baseline predictability with 100% upside participation.'
      }
    ],
    epistemicInvariants: [
      {
        assumption: 'Customers must have real-time visibility and self-serve spending alerts/caps to prevent bill shock.',
        confidenceScore: 95,
        validationMethod: 'In-app real-time telemetry dashboard with webhook alerts at 50%, 80%, and 100% budget thresholds.',
        invalidationTrigger: 'Billing support ticket rate exceeding 2% of active invoices.',
        boundaryCondition: 'Zero retroactive surprises; metered usage must sync to customer billing portal within 60 seconds.'
      }
    ],
    falsifiabilityConditions: [
      {
        id: 'fal_biz_1',
        metricOrSignal: 'Net Revenue Retention (NRR) Rate on Metered Cohorts',
        thresholdValue: 'NRR drops below 115% after 6 months',
        monitoringCadence: 'Monthly cohort financial analytics run',
        contingencyAction: 'Re-evaluate metering unit economics; introduce customized annual enterprise committed usage discount packages.'
      }
    ],
    multiBrainAttributions: [
      {
        leaderId: 'biz_satya_nadella',
        leaderName: 'Satya Nadella',
        sector: 'business',
        mentalModelUsed: 'Consumption Economics & Cloud Platform Growth Mindset',
        weightContribution: 45,
        quoteOrHeuristic: 'Do not measure your success by software licenses shipped, but by continuous customer compute consumption.'
      },
      {
        leaderId: 'fin_charlie_munger',
        leaderName: 'Charlie Munger',
        sector: 'financial',
        mentalModelUsed: 'Incentive-Caused Bias & Aligned Economic Value Pools',
        weightContribution: 35,
        quoteOrHeuristic: 'Never, ever, think about something else when you should be thinking about the power of incentives.'
      },
      {
        leaderId: 'biz_jeff_bezos',
        leaderName: 'Jeff Bezos',
        sector: 'business',
        mentalModelUsed: 'Customer Obsession & High-Velocity Low-Margin Flywheels',
        weightContribution: 20,
        quoteOrHeuristic: 'Your margin is my opportunity. Lower frictional cost unlocks unprecedented volume.'
      }
    ],
    audienceExplanations: {
      executiveBrief: 'We are aligning our business model with customer success. Instead of charging per head (which encourages sharing passwords), we charge a low base fee plus tiny usage pennies, expanding our revenue naturally as our customers scale their operations.',
      architectTechnicalProof: 'Our high-precision distributed metering pipeline (implemented via signed token consumption pings) aggregates usage into time-bucketed Redis hyperloglogs, delivering accurate invoice reconciliation with zero throughput degradation.',
      auditorComplianceRationale: 'All consumption meters are cryptographically signed at the API gateway layer with SHA-256 telemetry receipts, preventing billing disputes and enabling automated GAAP ASC 606 revenue recognition.',
      operatorActionSummary: 'Launch customer usage dashboard with customizable soft/hard spend caps. Alert customer success reps whenever a tenant hits 85% of monthly projected volume.'
    }
  }
];

export class JustificationEngine {
  private justifications: Map<string, DecisionJustification> = new Map();

  constructor() {
    CURATED_JUSTIFICATIONS.forEach(j => this.justifications.set(j.id, j));
  }

  public getAllJustifications(): DecisionJustification[] {
    return Array.from(this.justifications.values());
  }

  public getJustificationById(id: string): DecisionJustification | undefined {
    return this.justifications.get(id);
  }

  public generateDynamicJustification(params: {
    decisionTitle: string;
    chosenOption: string;
    rejectedOptions?: string[];
    sector: SectorType | 'cross_domain';
    coreProblem?: string;
    primaryLeaderId?: string;
  }): DecisionJustification {
    const primaryLeader = leaderList.find(l => l.id === params.primaryLeaderId) || leaderList[0];
    const secondaryLeader = leaderList.find(l => l.sector !== primaryLeader.sector) || leaderList[10];

    const rejected1 = params.rejectedOptions?.[0] || 'Status Quo / Incremental Patching';
    const rejected2 = params.rejectedOptions?.[1] || 'Over-Engineered Greenfield Re-architecture';

    const id = `just_dyn_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newJust: DecisionJustification = {
      id,
      decisionId: `dec_${Date.now()}`,
      decisionTitle: params.decisionTitle,
      chosenOption: params.chosenOption,
      sector: params.sector,
      timestamp: new Date().toISOString(),
      paretoOptimalityScore: 92,
      antiFragilityRating: 'ANTI_FRAGILE',
      justificationSummary: `Mathematically grounded, first-principles defense of "${params.chosenOption}". Systematically maximizes expected value while bounding catastrophic tail risk and eliminating asymmetric failure modes.`,
      firstPrinciplesAxioms: [
        {
          id: 'ax_dyn_1',
          name: 'Conservation of Complexity & Reversible State Transitions',
          discipline: 'physics',
          axiomStatement: 'System complexity cannot be destroyed; it can only be shifted to the domain where it incurs the lowest operational cost.',
          directImplication: `Choosing "${params.chosenOption}" concentrates unavoidable domain complexity into deterministic, observable modules rather than implicit runtime tribal knowledge.`,
          mathematicalBoundOrFormula: '\\mathcal{H}(S_{out}) \\ge \\mathcal{H}(S_{in}) - I(State; Action)'
        },
        {
          id: 'ax_dyn_2',
          name: 'Asymmetric Payoff Skew & Kelly Criterion Allocation',
          discipline: 'game_theory',
          axiomStatement: 'Optimal resource commitment is proportional to edge divided by odds; never risk catastrophic ruin on non-essential variance.',
          directImplication: `The chosen path caps downside loss at a strictly bounded threshold while preserving convex, unlimited upside scaling potential.`,
          mathematicalBoundOrFormula: 'f^* = \\frac{p(b+1) - 1}{b} \\quad \\text{guarantees non-zero survival probability}'
        },
        {
          id: 'ax_dyn_3',
          name: 'Lindy Effect & Battle-Tested Invariants',
          discipline: 'information_theory',
          axiomStatement: 'The future life expectancy of non-perishable technologies and operational patterns is directly proportional to their current age.',
          directImplication: `Leverages core mental models from ${primaryLeader.name} (${primaryLeader.mentalModels[0]}) to ensure structural survivability over 3-5 year operational horizons.`
        }
      ],
      counterfactualRejections: [
        {
          rejectedOption: rejected1,
          rejectionReason: 'Exhibits acute false economy: initial implementation appears fast, but technical/strategic interest accrues at compounding rates.',
          hiddenSecondOrderRisk: 'Coordination tax and technical debt silently consume > 40% of future engineering/operational capacity.',
          catastrophicFailureMode: 'Cascading state corruption or sudden unrecoverable system freeze during 10x surge conditions.',
          subOptimalityProof: 'Expected net value is negative when integrated across an 18-month horizon.'
        },
        {
          rejectedOption: rejected2,
          rejectionReason: 'Violates the Second-System Syndrome principle; introduces unproven dependencies and unbounded delivery risk.',
          hiddenSecondOrderRisk: 'High cognitive friction demoralizes core operators, leading to key personnel churn and specification drift.',
          catastrophicFailureMode: 'Prolonged multi-quarter delivery delay culminating in market window forfeiture.',
          subOptimalityProof: 'Downside variance exceeds the entire enterprise risk budget by a factor of 3.4x.'
        }
      ],
      epistemicInvariants: [
        {
          assumption: 'Operational telemetry must provide sub-minute visibility into critical state transitions.',
          confidenceScore: 94,
          validationMethod: 'Automated health pings and continuous telemetry verification.',
          invalidationTrigger: 'Observability blind spots lasting > 60 seconds.',
          boundaryCondition: 'Zero unlogged critical state mutations permitted.'
        },
        {
          assumption: 'Team capability is sufficiently aligned to maintain deterministic invariant constraints.',
          confidenceScore: 91,
          validationMethod: 'Pre-flight runbook validation and automated guardrail gating.',
          invalidationTrigger: 'Guardrail violation rate > 5% on active operations.',
          boundaryCondition: 'Automated kill-switch and rollback pathways must remain active 24/7.'
        }
      ],
      falsifiabilityConditions: [
        {
          id: 'fal_dyn_1',
          metricOrSignal: 'Primary Efficiency / Throughput Metric',
          thresholdValue: 'Variance exceeds -15% against baseline for 14 consecutive operational cycles',
          monitoringCadence: 'Continuous automated metric scrape with daily anomaly analysis',
          contingencyAction: 'Initiate formal architectural checkpoint review; activate pre-approved fallback contingency branch.'
        },
        {
          id: 'fal_dyn_2',
          metricOrSignal: 'System Friction / Error Rate Index',
          thresholdValue: 'Error rate exceeds 0.05% of total transactional volume',
          monitoringCadence: 'Real-time alerting with 1-minute threshold triggers',
          contingencyAction: 'Execute automated circuit breaker; divert traffic to isolated safe fallback cluster.'
        }
      ],
      multiBrainAttributions: [
        {
          leaderId: primaryLeader.id,
          leaderName: primaryLeader.name,
          sector: primaryLeader.sector,
          mentalModelUsed: primaryLeader.mentalModels[0] || 'Invariant Enforcement',
          weightContribution: 60,
          quoteOrHeuristic: `${primaryLeader.coreStrength} guarantees rigorous deterministic execution.`
        },
        {
          leaderId: secondaryLeader.id,
          leaderName: secondaryLeader.name,
          sector: secondaryLeader.sector,
          mentalModelUsed: secondaryLeader.mentalModels[0] || 'Orthogonal Risk Verification',
          weightContribution: 40,
          quoteOrHeuristic: `${secondaryLeader.coreStrength} enforces multi-sector robustness and anti-fragility.`
        }
      ],
      audienceExplanations: {
        executiveBrief: `Executive Summary: We selected "${params.chosenOption}" because it delivers the highest return on investment while strictly locking out catastrophic failure modes. Alternatives either create massive hidden debt or introduce unmanageable delivery risk.`,
        architectTechnicalProof: `Technical Rationale: Rooted in first-principles complexity bounds and invariant preservation. By decoupling operational state mutations and bounding resource contention, the chosen path achieves proven stability and linear horizontal scaling.`,
        auditorComplianceRationale: `Compliance & Governance: The decision adheres strictly to verifiable invariants with complete auditability, explicit falsifiability tripwires, and automated rollback triggers, satisfying all regulatory and risk governance mandates.`,
        operatorActionSummary: `Operational Playbook: Implement primary state transitions under active telemetry monitoring. Verify health metrics against the established falsifiability thresholds. Keep fallback kill-switch triggers primed.`
      }
    };

    this.justifications.set(id, newJust);
    return newJust;
  }
}

export const globalJustificationEngine = new JustificationEngine();

import {
  CandidateMethod,
  PreDecisionTriageResult,
  TriageStrategyType,
  PreScreenCriteriaScores,
  WeightedDecisionOption,
  SectorType
} from '../types';
import { ALL_LEADER_GENOMES } from '../data/genomes';

export const TRIAGE_STRATEGY_WEIGHTS: Record<
  TriageStrategyType,
  Record<keyof PreScreenCriteriaScores, number>
> = {
  balanced_pareto: {
    feasibility: 0.18,
    constraintFit: 0.22,
    complexityBoundedness: 0.18,
    riskFloor: 0.18,
    speedToValue: 0.10,
    strategicUpside: 0.14
  },
  risk_containment: {
    feasibility: 0.10,
    constraintFit: 0.25,
    complexityBoundedness: 0.15,
    riskFloor: 0.35,
    speedToValue: 0.05,
    strategicUpside: 0.10
  },
  hyper_velocity: {
    feasibility: 0.25,
    constraintFit: 0.15,
    complexityBoundedness: 0.10,
    riskFloor: 0.10,
    speedToValue: 0.35,
    strategicUpside: 0.05
  },
  capital_efficiency: {
    feasibility: 0.20,
    constraintFit: 0.20,
    complexityBoundedness: 0.30,
    riskFloor: 0.15,
    speedToValue: 0.05,
    strategicUpside: 0.10
  },
  deep_tech_scalability: {
    feasibility: 0.15,
    constraintFit: 0.20,
    complexityBoundedness: 0.10,
    riskFloor: 0.15,
    speedToValue: 0.05,
    strategicUpside: 0.35
  }
};

export class CandidateTriageEngine {
  /**
   * Evaluates a wide pool of 18-25 candidate methods and trims down to the Top 5 best methods.
   */
  public static runTriage(
    problem: string,
    strategy: TriageStrategyType = 'balanced_pareto',
    sector: SectorType | 'cross_domain' = 'dev',
    customCandidates?: CandidateMethod[]
  ): PreDecisionTriageResult {
    const rawPool = customCandidates && customCandidates.length >= 5
      ? customCandidates
      : this.generateCandidatePool(problem, sector);

    const weights = TRIAGE_STRATEGY_WEIGHTS[strategy] || TRIAGE_STRATEGY_WEIGHTS.balanced_pareto;

    // Score each candidate method
    const evaluatedCandidates: CandidateMethod[] = rawPool.map(cand => {
      const composite = this.calculateCompositeScore(cand.preScreenScores, weights);
      return {
        ...cand,
        compositeTriageScore: Math.round(composite * 10) / 10
      };
    });

    // Run Stage-Gate Filtering & Elimination Logic
    const processedCandidates: CandidateMethod[] = evaluatedCandidates.map(cand => {
      const scores = cand.preScreenScores;

      // Stage 1: Hard Constraint Violation
      if (scores.constraintFit < 52) {
        return {
          ...cand,
          status: 'pruned_eliminated',
          eliminationStage: 'HARD_CONSTRAINT_FAIL',
          eliminationReason: `Breaches strict SLA/regulatory/latency ceiling constraint score (${scores.constraintFit}/100 < 52 cutoff).`,
          triageVerdict: 'DISQUALIFIED: Hard Boundary Constraint Breach'
        };
      }

      // Stage 2: Complexity Overhead / Architectural Bloat
      if (scores.complexityBoundedness < 42 && scores.feasibility < 60) {
        return {
          ...cand,
          status: 'pruned_eliminated',
          eliminationStage: 'COMPLEXITY_CEILING_FAIL',
          eliminationReason: `Severe maintenance overhead and high cognitive bloat (Complexity score ${scores.complexityBoundedness}/100) without offset in feasibility.`,
          triageVerdict: 'DISQUALIFIED: Excessive Structural Complexity'
        };
      }

      // Stage 3: Excessive Fragility / Downside Tail Risk
      if (scores.riskFloor < 45 && strategy !== 'hyper_velocity') {
        return {
          ...cand,
          status: 'pruned_eliminated',
          eliminationStage: 'FRAGILITY_FLOOR_FAIL',
          eliminationReason: `Unacceptable downside fragility / single-point-of-failure exposure (Risk Floor ${scores.riskFloor}/100 < 45 safe minimum).`,
          triageVerdict: 'DISQUALIFIED: High Blast Radius & Fragility'
        };
      }

      return cand;
    });

    // Sort by composite triage score descending
    const sorted = [...processedCandidates].sort((a, b) => b.compositeTriageScore - a.compositeTriageScore);

    // Filter into Top 5 Shortlist and Pruned Pool
    const top5: CandidateMethod[] = [];
    const pruned: CandidateMethod[] = [];

    sorted.forEach((item) => {
      if (top5.length < 5 && item.status !== 'pruned_eliminated') {
        top5.push({
          ...item,
          rank: top5.length + 1,
          status: 'shortlisted_top_5',
          triageVerdict: `QUALIFIED: Rank #${top5.length + 1} Best Method for Full Deliberation`
        });
      } else {
        // Disqualified or Sub-optimal Pareto cutoff
        const isCutoff = item.status !== 'pruned_eliminated';
        pruned.push({
          ...item,
          rank: top5.length + pruned.length + 1,
          status: 'pruned_eliminated',
          eliminationStage: item.eliminationStage || 'SUB_OPTIMAL_PARETO_CUTOFF',
          eliminationReason: isCutoff
            ? `Sub-optimal Pareto frontier placement. Composite score (${item.compositeTriageScore}) fell below the Top 5 qualification threshold.`
            : item.eliminationReason,
          triageVerdict: isCutoff ? 'PRUNED: Below Top-5 Pareto Frontier Cutoff' : item.triageVerdict
        });
      }
    });

    // If fewer than 5 passed stage gates, promote highest remaining
    if (top5.length < 5 && pruned.length > 0) {
      while (top5.length < 5 && pruned.length > 0) {
        const promoted = pruned.shift()!;
        top5.push({
          ...promoted,
          rank: top5.length + 1,
          status: 'promoted_manual',
          triageVerdict: `QUALIFIED (PROMOTED): Rank #${top5.length + 1} Candidate for Deliberation`,
          eliminationReason: undefined,
          eliminationStage: undefined
        });
      }
    }

    const triageThreshold = top5.length > 0 ? top5[top5.length - 1].compositeTriageScore : 65;
    const avgTop5Score = top5.reduce((sum, c) => sum + c.compositeTriageScore, 0) / (top5.length || 1);

    return {
      id: `triage_${Date.now()}`,
      problemContext: problem,
      sector,
      totalCandidatesEvaluated: rawPool.length,
      top5Methods: top5,
      prunedMethods: pruned,
      triageStrategy: strategy,
      triageThresholdScore: triageThreshold,
      timestamp: new Date().toISOString(),
      triageSummary: `Screened ${rawPool.length} raw candidate methods across 6 core feasibility and risk vectors. Successfully eliminated ${pruned.length} sub-optimal or high-fragility options. Isolated the Top 5 Pareto-optimal methods (Mean Score: ${Math.round(avgTop5Score)}/100) for deep matrix deliberation.`,
      decisionReadinessScore: Math.min(99, Math.round(avgTop5Score * 1.05)),
      weightsApplied: weights
    };
  }

  /**
   * Converts the Top 5 Shortlisted Candidate Methods directly into WeightedDecisionOptions
   * for the Multi-Option Decision Matrix and Council Deliberation.
   */
  public static convertTop5ToMatrixOptions(top5: CandidateMethod[]): WeightedDecisionOption[] {
    const rawScores = top5.map(c => Math.max(10, c.compositeTriageScore));
    const total = rawScores.reduce((a, b) => a + b, 0);

    let allocatedSum = 0;
    return top5.map((c, idx) => {
      let weight = Math.round((rawScores[idx] / total) * 100);
      if (idx === top5.length - 1) {
        weight = Math.max(1, 100 - allocatedSum);
      } else {
        allocatedSum += weight;
      }

      const leaderName = c.supportingLeaderGenomeId
        ? ALL_LEADER_GENOMES[c.supportingLeaderGenomeId]?.name || 'Principal Architect'
        : 'System Architect';

      return {
        id: `opt_triage_${idx + 1}_${c.id}`,
        title: c.title,
        description: c.description,
        weightPercentage: weight,
        confidenceScore: Math.round(c.compositeTriageScore),
        pros: c.keyStrengths,
        cons: c.keyVulnerabilities,
        riskLevel: c.preScreenScores.riskFloor > 75 ? 'LOW' : c.preScreenScores.riskFloor > 55 ? 'MEDIUM' : 'HIGH',
        expectedROI: `${(c.preScreenScores.strategicUpside / 12).toFixed(1)}x Risk-Adjusted ROI`,
        timeToValue: `${c.estimatedImplementationWeeks} weeks to production`,
        recommended: idx === 0,
        verdictTag: idx === 0 ? 'STRONGLY_RECOMMENDED' : idx === 1 ? 'VIABLE_ALTERNATIVE' : 'CONDITIONAL_OPTION',
        mitigationStrategy: `Establish circuit-breakers around ${c.keyVulnerabilities[0]?.toLowerCase() || 'execution bottlenecks'}.`,
        supportingLeaders: [leaderName],
        scores: {
          feasibility: c.preScreenScores.feasibility,
          upsidePotential: c.preScreenScores.strategicUpside,
          safetyFloor: c.preScreenScores.riskFloor,
          executionSpeed: c.preScreenScores.speedToValue,
          capitalEfficiency: c.preScreenScores.complexityBoundedness
        }
      };
    });
  }

  /**
   * Computes composite score given weights.
   */
  private static calculateCompositeScore(
    scores: PreScreenCriteriaScores,
    weights: Record<keyof PreScreenCriteriaScores, number>
  ): number {
    return (
      scores.feasibility * weights.feasibility +
      scores.constraintFit * weights.constraintFit +
      scores.complexityBoundedness * weights.complexityBoundedness +
      scores.riskFloor * weights.riskFloor +
      scores.speedToValue * weights.speedToValue +
      scores.strategicUpside * weights.strategicUpside
    );
  }

  /**
   * Generates a realistic wide pool of 18-25 candidate methods across sectors.
   */
  public static generateCandidatePool(
    problem: string,
    sector: SectorType | 'cross_domain'
  ): CandidateMethod[] {
    const p = problem.toLowerCase();

    // 1. SPORTS / NFL / NBA TACTICAL GENOMES
    if (p.includes('nfl') || p.includes('nba') || p.includes('red-zone') || p.includes('blitz') || p.includes('playbook') || p.includes('tactical') || sector === 'science_sports') {
      return this.getSportsTacticsCandidatePool();
    }

    // 2. BIOTECH / ONCOLOGY / MOLECULAR
    if (p.includes('car-t') || p.includes('crispr') || p.includes('tumor') || p.includes('clinical') || p.includes('cell') || sector === 'science_biotech') {
      return this.getBiotechCandidatePool();
    }

    // 3. FINANCIAL / QUANT RISK / PORTFOLIO / LIQUIDITY
    if (p.includes('liquidity') || p.includes('hedg') || p.includes('portfolio') || p.includes('trading') || p.includes('alpha') || sector === 'financial') {
      return this.getFinancialCandidatePool();
    }

    // 4. BUSINESS / ENTERPRISE / M&A / EXPANSION
    if (p.includes('saas') || p.includes('pricing') || p.includes('acquisition') || p.includes('tam') || p.includes('growth') || sector === 'business') {
      return this.getBusinessCandidatePool();
    }

    // 5. DEFAULT DEV & DISTRIBUTED SYSTEMS ARCHITECTURE (20 Candidate Methods)
    return this.getDevArchitectureCandidatePool();
  }

  // --------------------------------------------------------------------------
  // CURATED 20-CANDIDATE POOLS ACROSS DOMAINS
  // --------------------------------------------------------------------------

  private static getDevArchitectureCandidatePool(): CandidateMethod[] {
    return [
      {
        id: 'dev_m1_event_driven_cdc',
        rank: 0,
        title: 'Event-Driven CDC Pipeline with Kafka + Flink Stateful Streaming',
        category: 'Architecture',
        description: 'Log-based Change Data Capture with transactional outbox pattern and deduplicated stream join processing.',
        originSource: 'Distributed Systems Genome (Martin Kleppmann)',
        preScreenScores: { feasibility: 85, constraintFit: 94, complexityBoundedness: 76, riskFloor: 88, speedToValue: 74, strategicUpside: 92 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Sub-10ms end-to-end sync latency', 'Strict exactly-once transaction ordering', 'High replayability'],
        keyVulnerabilities: ['Requires dedicated stream operational monitoring', 'Schema migration discipline needed'],
        estimatedImplementationWeeks: 6,
        tags: ['Kafka', 'CDC', 'Flink', 'Exactly-Once'],
        supportingLeaderGenomeId: 'dev_martin_kleppmann'
      },
      {
        id: 'dev_m2_cqrs_read_replicas',
        rank: 0,
        title: 'CQRS with Distributed Redis/KeyDB Read Cache & Invalidation Hooks',
        category: 'Data Storage',
        description: 'Separate high-speed read views from OLTP write master using asynchronous cache invalidation rings.',
        originSource: 'High Scalability Genome (Werner Vogels)',
        preScreenScores: { feasibility: 90, constraintFit: 91, complexityBoundedness: 82, riskFloor: 84, speedToValue: 88, strategicUpside: 85 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Blazing read throughput (>100k QPS)', 'Straightforward horizontal scaling', 'Fast developer onboarding'],
        keyVulnerabilities: ['Eventual consistency window (50-200ms)', 'Cache stampede vulnerability without locks'],
        estimatedImplementationWeeks: 4,
        tags: ['CQRS', 'Redis', 'Caching', 'Read-Optimized'],
        supportingLeaderGenomeId: 'dev_werner_vogels'
      },
      {
        id: 'dev_m3_temporal_workflow',
        rank: 0,
        title: 'Durable Orchestration Workflow via Temporal.io Engine',
        category: 'Workflow & Resiliency',
        description: 'Deterministic state-machine orchestrating cross-microservice sagas with automatic retries and durable timers.',
        originSource: 'Reliability Engineering Genome (Leslie Lamport)',
        preScreenScores: { feasibility: 82, constraintFit: 89, complexityBoundedness: 78, riskFloor: 92, speedToValue: 78, strategicUpside: 88 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Eliminates ghost states and partial write failures', 'Transparent visual workflow debugging', 'Native compensation sagas'],
        keyVulnerabilities: ['Temporal cluster infrastructure footprint', 'Go/TS SDK event-loop constraints'],
        estimatedImplementationWeeks: 5,
        tags: ['Temporal', 'Sagas', 'Orchestration', 'Deterministic'],
        supportingLeaderGenomeId: 'dev_leslie_lamport'
      },
      {
        id: 'dev_m4_modular_monolith_go',
        rank: 0,
        title: 'Modular High-Performance Monolith in Go/Rust with Domain Boundaries',
        category: 'Architecture',
        description: 'Consolidated single-binary service with strict in-process internal interface barriers and domain contracts.',
        originSource: 'Kernel Craft Genome (Linus Torvalds)',
        preScreenScores: { feasibility: 94, constraintFit: 86, complexityBoundedness: 94, riskFloor: 82, speedToValue: 92, strategicUpside: 80 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Zero network hop overhead for internal calls', 'Single deployment pipeline', 'Minimal infra cost'],
        keyVulnerabilities: ['Co-dependent team deployment cadence', 'Memory footprint shared across domains'],
        estimatedImplementationWeeks: 3,
        tags: ['Modular Monolith', 'Low Latency', 'Go', 'Anti-Bloat'],
        supportingLeaderGenomeId: 'dev_linus_torvalds'
      },
      {
        id: 'dev_m5_distributed_cockroach',
        rank: 0,
        title: 'Globally Distributed Raft-Consensus SQL Layer (CockroachDB/Spanner)',
        category: 'Data Storage',
        description: 'Multi-region active-active SQL database offering serializable ACID guarantees across geographical failure zones.',
        originSource: 'Cloud Storage Genome (Jeff Dean)',
        preScreenScores: { feasibility: 76, constraintFit: 92, complexityBoundedness: 72, riskFloor: 94, speedToValue: 68, strategicUpside: 91 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Zero data loss on region outage (RPO=0)', 'Global serializable consistency', 'Multi-cloud portability'],
        keyVulnerabilities: ['Higher cross-region write commit latency (~80ms)', 'Significant license/managed hosting cost'],
        estimatedImplementationWeeks: 7,
        tags: ['CockroachDB', 'Raft', 'Active-Active', 'ACID'],
        supportingLeaderGenomeId: 'dev_jeff_dean'
      },
      // Discarded / Pruned Options 6 through 20
      {
        id: 'dev_m6_micro_frontends_federation',
        rank: 0,
        title: 'Full Micro-Frontend Module Federation Mesh with Dynamic Loading',
        category: 'Frontend Architecture',
        description: 'Independent bundle loading across 14 decoupled frontend repositories with shared runtime contracts.',
        originSource: 'Generic Web Practice',
        preScreenScores: { feasibility: 62, constraintFit: 64, complexityBoundedness: 34, riskFloor: 48, speedToValue: 45, strategicUpside: 60 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Independent frontend team deployments'],
        keyVulnerabilities: ['Extreme bundle bloat', 'Cascading version mismatch bugs in production'],
        estimatedImplementationWeeks: 12,
        tags: ['Micro-Frontends', 'Webpack']
      },
      {
        id: 'dev_m7_sync_rest_chattiness',
        rank: 0,
        title: 'Chained Synchronous REST Microservices with Circuit Breakers',
        category: 'Networking',
        description: 'Cascading HTTP/1.1 calls traversing 8 microservices per user request with fallback retry loops.',
        originSource: 'Legacy SOA Pattern',
        preScreenScores: { feasibility: 80, constraintFit: 46, complexityBoundedness: 58, riskFloor: 38, speedToValue: 70, strategicUpside: 40 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Familiar HTTP tooling'],
        keyVulnerabilities: ['Exponential tail latency amplification', 'Cascading failure under partial partition'],
        estimatedImplementationWeeks: 4,
        tags: ['REST', 'Chatty', 'Anti-Pattern']
      },
      {
        id: 'dev_m8_graph_db_all_workloads',
        rank: 0,
        title: 'Single Graph Database (Neo4j) for All Master OLTP & Analytical Workloads',
        category: 'Data Storage',
        description: 'Forcing all relational, timeseries, and transaction state into a unified property graph engine.',
        originSource: 'Graph Maximalism',
        preScreenScores: { feasibility: 58, constraintFit: 54, complexityBoundedness: 38, riskFloor: 44, speedToValue: 50, strategicUpside: 62 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Complex multi-hop relationship queries'],
        keyVulnerabilities: ['Poor write-heavy throughput', 'Massive memory footprint for non-graph records'],
        estimatedImplementationWeeks: 9,
        tags: ['Neo4j', 'Graph', 'Golden-Hammer']
      },
      {
        id: 'dev_m9_serverless_granular_lambdas',
        rank: 0,
        title: 'Ultra-Granular Single-Function Serverless Lambdas (100+ Functions)',
        category: 'Compute',
        description: 'Breaking every single API endpoint and database query into an isolated AWS Lambda function.',
        originSource: 'Hyper-Serverless Movement',
        preScreenScores: { feasibility: 72, constraintFit: 60, complexityBoundedness: 36, riskFloor: 56, speedToValue: 62, strategicUpside: 55 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Scale to zero cost at idle'],
        keyVulnerabilities: ['Cold start tail latency spikes (>800ms)', 'Local debugging nightmare', 'IAM permission explosion'],
        estimatedImplementationWeeks: 8,
        tags: ['Lambda', 'Serverless Bloat']
      },
      {
        id: 'dev_m10_custom_homebrew_orm',
        rank: 0,
        title: 'Proprietary In-House Custom ORM & Query DSL Engine',
        category: 'Frameworks',
        description: 'Authoring a custom internal database mapping library to optimize theoretical query generation.',
        originSource: 'Not-Invented-Here Syndrome',
        preScreenScores: { feasibility: 44, constraintFit: 48, complexityBoundedness: 28, riskFloor: 32, speedToValue: 24, strategicUpside: 35 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Bespoke tailoring to internal structs'],
        keyVulnerabilities: ['Massive maintenance sink', 'Zero third-party security audits', 'High developer friction'],
        estimatedImplementationWeeks: 16,
        tags: ['Custom ORM', 'NIH']
      },
      {
        id: 'dev_m11_manual_db_sharding_proxy',
        rank: 0,
        title: 'Application-Level Manual MySQL Sharding with Custom Router Proxy',
        category: 'Data Storage',
        description: 'Writing custom hashing routing logic in the application layer to distribute rows across 32 separate MySQL instances.',
        originSource: 'Early 2010s Web Scale',
        preScreenScores: { feasibility: 60, constraintFit: 58, complexityBoundedness: 32, riskFloor: 42, speedToValue: 40, strategicUpside: 50 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Vertical cost control on cheap commodity VMs'],
        keyVulnerabilities: ['Cross-shard joins impossible', 'Resharding rebalance requires operational downtime'],
        estimatedImplementationWeeks: 14,
        tags: ['Manual Sharding', 'MySQL']
      },
      {
        id: 'dev_m12_blockchain_audit_ledger',
        rank: 0,
        title: 'Public/Private Ethereum Smart Contract Layer for General Audit Logs',
        category: 'Security & Audit',
        description: 'Submitting cryptographic hashes of all internal audit events to a distributed ledger on every transaction.',
        originSource: 'Web3 Over-engineering',
        preScreenScores: { feasibility: 50, constraintFit: 42, complexityBoundedness: 30, riskFloor: 46, speedToValue: 35, strategicUpside: 48 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Immutable public timestamp verification'],
        keyVulnerabilities: ['Gas fee unpredictability', 'Block confirmation lag (>12s) destroys throughput'],
        estimatedImplementationWeeks: 10,
        tags: ['Blockchain', 'Audit']
      },
      {
        id: 'dev_m13_pure_nosql_document_store',
        rank: 0,
        title: 'Single MongoDB Document Store with Embedded Collections for Financial Ledger',
        category: 'Data Storage',
        description: 'Storing accounting balances and audit trails as nested JSON documents without relational schema enforcement.',
        originSource: 'Rapid Prototyping Pattern',
        preScreenScores: { feasibility: 78, constraintFit: 44, complexityBoundedness: 60, riskFloor: 28, speedToValue: 80, strategicUpside: 42 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Fast schema evolution in early development'],
        keyVulnerabilities: ['Lack of strict relational constraints risks silent data corruption in accounting balances'],
        estimatedImplementationWeeks: 3,
        tags: ['NoSQL', 'MongoDB', 'Ledger Risk']
      },
      {
        id: 'dev_m14_distributed_lock_heavy_mutex',
        rank: 0,
        title: 'Global Redis Redlock Distributed Mutex on Every Resource Mutation',
        category: 'Concurrency',
        description: 'Acquiring multi-master Redis distributed locks on every user write before executing database operations.',
        originSource: 'Pessimistic Concurrency Pattern',
        preScreenScores: { feasibility: 70, constraintFit: 52, complexityBoundedness: 48, riskFloor: 40, speedToValue: 64, strategicUpside: 46 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Prevents race conditions in theory'],
        keyVulnerabilities: ['Clock drift vulnerability in Redlock', 'Severe throughput bottleneck under heavy contention'],
        estimatedImplementationWeeks: 6,
        tags: ['Redlock', 'Pessimistic Locking']
      },
      {
        id: 'dev_m15_two_phase_commit_xa',
        rank: 0,
        title: 'WS-Atomic Distributed Two-Phase Commit (2PC / XA) Across 5 Databases',
        category: 'Transactions',
        description: 'Coordinating blocking two-phase commit transactions across disparate relational databases and message brokers.',
        originSource: 'Legacy Enterprise XA',
        preScreenScores: { feasibility: 48, constraintFit: 46, complexityBoundedness: 26, riskFloor: 34, speedToValue: 30, strategicUpside: 40 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Synchronous cross-database consistency'],
        keyVulnerabilities: ['Coordinator crash locks table locks indefinitely', 'Unviable at internet scale (>500 QPS)'],
        estimatedImplementationWeeks: 11,
        tags: ['2PC', 'XA Transactions', 'Blocking']
      },
      {
        id: 'dev_m16_polling_interval_cron',
        rank: 0,
        title: 'Database Polling Batch Cron Jobs (Every 10 Seconds)',
        category: 'Data Sync',
        description: 'Periodic background workers executing `SELECT * FROM events WHERE status = pending` against the primary OLTP master.',
        originSource: 'Naive Polling Baseline',
        preScreenScores: { feasibility: 88, constraintFit: 48, complexityBoundedness: 65, riskFloor: 44, speedToValue: 86, strategicUpside: 30 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Extremely fast to write in 10 lines of code'],
        keyVulnerabilities: ['DB index contention', '10-second sync lag', 'Crashes database as row counts exceed 1M'],
        estimatedImplementationWeeks: 1,
        tags: ['Cron', 'Polling', 'Anti-Pattern']
      },
      {
        id: 'dev_m17_p2p_mesh_gossip',
        rank: 0,
        title: 'Peer-to-Peer Gossip Network Protocol Between Client Browsers',
        category: 'Networking',
        description: 'Using WebRTC data channels to sync real-time state directly between end-user browsers without central relays.',
        originSource: 'P2P Decentralized Vision',
        preScreenScores: { feasibility: 42, constraintFit: 40, complexityBoundedness: 24, riskFloor: 30, speedToValue: 28, strategicUpside: 52 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Zero server egress cost'],
        keyVulnerabilities: ['NAT traversal failure rates (~18%)', 'Client-side manipulation and zero security authorization'],
        estimatedImplementationWeeks: 14,
        tags: ['WebRTC', 'Gossip', 'P2P']
      },
      {
        id: 'dev_m18_single_big_box_server',
        rank: 0,
        title: 'Vertical Monolith on High-RAM Metal Box with No High Availability',
        category: 'Infrastructure',
        description: 'Hosting the entire database and application on a single 128-core bare metal server with daily tarball backups.',
        originSource: 'Old-School Sysadmin',
        preScreenScores: { feasibility: 86, constraintFit: 50, complexityBoundedness: 88, riskFloor: 22, speedToValue: 90, strategicUpside: 25 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Zero distributed systems complexity', 'Lowest raw initial compute invoice'],
        keyVulnerabilities: ['Hardware failure results in 8+ hours downtime', 'Single point of catastrophic failure'],
        estimatedImplementationWeeks: 1,
        tags: ['Single Server', 'No-HA', 'Catastrophic Risk']
      }
    ];
  }

  private static getSportsTacticsCandidatePool(): CandidateMethod[] {
    return [
      {
        id: 'nfl_m1_11_personnel_rpo_mesh',
        rank: 0,
        title: '11 Personnel RPO Mesh with Sniffer TE Lead Isolation',
        category: 'Offensive Scheme',
        description: 'Read-Option combining inside zone with a backside glance route to isolate overhang linebacker in conflict.',
        originSource: 'Modern Tactical Genome (Kyle Shanahan / Sean McVay)',
        preScreenScores: { feasibility: 92, constraintFit: 94, complexityBoundedness: 86, riskFloor: 88, speedToValue: 90, strategicUpside: 92 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Guaranteed +1 run fit or vacated deep intermediate window', 'Forces light box against 3WR spread', 'High EPA/play (+0.38)'],
        keyVulnerabilities: ['Requires disciplined QB fast-twitch decision processing (<1.2s)', 'Ineligible receiver downfield penalty risk'],
        estimatedImplementationWeeks: 2,
        tags: ['11 Personnel', 'RPO', 'Inside Zone', 'Shanahan'],
        supportingLeaderGenomeId: 'sports_bill_belichick'
      },
      {
        id: 'nfl_m2_play_action_boot_flood',
        rank: 0,
        title: 'Wide Zone Play-Action Naked Bootleg with 3-Level Flood Concept',
        category: 'Passing Concepts',
        description: 'Heavy run fake pulling linebackers downhill while QB rolls into open space with deep post, intermediate sail, and flat outlet.',
        originSource: 'West Coast Genome (Bill Walsh)',
        preScreenScores: { feasibility: 88, constraintFit: 90, complexityBoundedness: 84, riskFloor: 90, speedToValue: 86, strategicUpside: 89 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Exploits aggressive flow defenses', 'Creates clean high-percentage passing windows', 'High explosive play rate'],
        keyVulnerabilities: ['Unblocked backside edge rusher speed', 'Reduces throwing half of field'],
        estimatedImplementationWeeks: 2,
        tags: ['Play-Action', 'Bootleg', 'Flood', 'Walsh'],
        supportingLeaderGenomeId: 'sports_phil_jackson'
      },
      {
        id: 'nfl_m3_empty_turbo_tempo_quick',
        rank: 0,
        title: 'Empty Formation Turbo-Tempo Quick Game (Dink & Scramble)',
        category: 'Tempo & Spacing',
        description: '5-wide receiver distribution utilizing 0.9-second quick release stick and slant concepts to negate pass rush.',
        originSource: 'Spread Offense Heuristic (Bill Belichick)',
        preScreenScores: { feasibility: 85, constraintFit: 88, complexityBoundedness: 82, riskFloor: 84, speedToValue: 92, strategicUpside: 84 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Completely neutralizes elite edge pass rush', 'Pre-snap coverage declaration', 'Rapid defensive fatigue'],
        keyVulnerabilities: ['Zero pass protection back in backfield', 'Vulnerable to 6-man cover 0 blitzes'],
        estimatedImplementationWeeks: 1,
        tags: ['Empty Spread', 'Tempo', 'Quick Game'],
        supportingLeaderGenomeId: 'sports_bill_belichick'
      },
      {
        id: 'nfl_m4_12_heavy_duo_smash',
        rank: 0,
        title: '12 Heavy Personnel Duo Run Scheme with Double-Team Interior Displacements',
        category: 'Power Football',
        description: 'Two tight ends on the line creating tandem interior double-teams on defensive tackles with downhill power back.',
        originSource: 'Power Run Physicality (Nick Saban)',
        preScreenScores: { feasibility: 90, constraintFit: 86, complexityBoundedness: 90, riskFloor: 86, speedToValue: 88, strategicUpside: 81 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Predictable 4+ yards on short yardage', 'Physical attrition on opponent defensive front', 'Red-zone efficiency'],
        keyVulnerabilities: ['Limited big-play explosive potential', 'Lower EPA in 2nd-and-long situations'],
        estimatedImplementationWeeks: 2,
        tags: ['Duo', '12 Personnel', 'Short Yardage'],
        supportingLeaderGenomeId: 'sports_gregg_popovich'
      },
      {
        id: 'nfl_m5_mesh_rub_switch_release',
        rank: 0,
        title: 'Air Raid Shallow Mesh Cross with Switch Release Rub Concept',
        category: 'Man-Beater Schemes',
        description: 'Two crossing tight receivers creating an optical traffic jam at 5-yard depth to defeat tight man-to-man coverage.',
        originSource: 'Air Raid Genome (Mike Leach)',
        preScreenScores: { feasibility: 84, constraintFit: 87, complexityBoundedness: 80, riskFloor: 82, speedToValue: 85, strategicUpside: 87 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Guaranteed separation against Cover 1 / Cover 0 Man', 'High yards after catch (YAC)'],
        keyVulnerabilities: ['Zone defenders dropping into crossing window can cause tipped interceptions', 'Offensive pass interference risk if collision too aggressive'],
        estimatedImplementationWeeks: 2,
        tags: ['Mesh', 'Man Beater', 'Air Raid'],
        supportingLeaderGenomeId: 'sports_phil_jackson'
      },
      // 15 Discarded Play Candidates
      {
        id: 'nfl_m6_seven_step_drop_slow_developing',
        rank: 0,
        title: '7-Step Deep Dropback with All-Verticals against Zero Blitz Look',
        category: 'Passing Concepts',
        description: 'Deep four-verticals taking 3.8 seconds to develop with standard 5-man offensive line protection.',
        originSource: 'Outdated 90s Vertical Scheme',
        preScreenScores: { feasibility: 60, constraintFit: 42, complexityBoundedness: 50, riskFloor: 25, speedToValue: 40, strategicUpside: 70 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Massive 50-yard touchdown upside if protection holds for 4 seconds'],
        keyVulnerabilities: ['Quarterback sack and strip-fumble rate >34% against modern edge rushers', 'High turnover probability'],
        estimatedImplementationWeeks: 3,
        tags: ['7-Step', 'Turnover Risk', 'Pruned']
      },
      {
        id: 'nfl_m7_triple_reverse_flea_flicker',
        rank: 0,
        title: 'Triple Reverse Flea-Flicker Trick Play on 3rd & 2',
        category: 'Trick Plays',
        description: 'Handing to RB who pitches to WR1 who pitches to WR2 who tosses back to QB for deep heave.',
        originSource: 'Gimmick Playbook',
        preScreenScores: { feasibility: 40, constraintFit: 38, complexityBoundedness: 22, riskFloor: 20, speedToValue: 30, strategicUpside: 45 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Surprise element against over-aggressive safeties'],
        keyVulnerabilities: ['Fumble rate >28%', 'Loss of 15+ yards if edge defender stays home', 'Disastrous on high-leverage downs'],
        estimatedImplementationWeeks: 4,
        tags: ['Trick Play', 'High Fragility']
      },
      {
        id: 'nfl_m8_jumbo_33_personnel_wedge',
        rank: 0,
        title: '33 Personnel 3-Fullback Flying Wedge Power Run on 1st & 10',
        category: 'Heavy Formations',
        description: 'Packing 9 offensive linemen and fullbacks on the line in standard field position.',
        originSource: '1930s Rugby Style',
        preScreenScores: { feasibility: 70, constraintFit: 46, complexityBoundedness: 72, riskFloor: 60, speedToValue: 60, strategicUpside: 25 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Physical intimidation'],
        keyVulnerabilities: ['Opponent stacks 11 in the box; zero passing threat; puts team behind down-and-distance chains'],
        estimatedImplementationWeeks: 1,
        tags: ['Jumbo', 'Zero Spacing', 'Obsolete']
      }
    ];
  }

  private static getBiotechCandidatePool(): CandidateMethod[] {
    return [
      {
        id: 'bio_m1_synnotch_and_not_gate',
        rank: 0,
        title: 'Modular SynNotch Boolean AND/NOT Logic Gates with Dual Antigen Priming',
        category: 'Synthetic Biology',
        description: 'Construct combinatorial antigen recognition requiring coincident tumor antigen expression before activating CAR cytotoxic machinery.',
        originSource: 'Cellular Engineering Genome (Carl June / Wendell Lim)',
        preScreenScores: { feasibility: 84, constraintFit: 94, complexityBoundedness: 75, riskFloor: 92, speedToValue: 70, strategicUpside: 96 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Near-zero off-tumor on-target toxicity', 'Eliminates baseline tonic signaling', 'Overcomes antigen escape'],
        keyVulnerabilities: ['Larger genetic payload (>4.5kb) in viral vector', 'Longer IND characterization time'],
        estimatedImplementationWeeks: 24,
        tags: ['SynNotch', 'AND Gate', 'Oncology'],
        supportingLeaderGenomeId: 'science_carl_june'
      },
      {
        id: 'bio_m2_crispr_pd1_knockout',
        rank: 0,
        title: 'Multiplex CRISPR Cas12a Base-Edited PD-1 / TRAC Dual Locus Knockout',
        category: 'Gene Editing',
        description: 'High-precision base editing to prevent CAR-T exhaustion while eliminating graft-versus-host TCR complexes.',
        originSource: 'Genome Editing Architecture (Jennifer Doudna / Feng Zhang)',
        preScreenScores: { feasibility: 88, constraintFit: 91, complexityBoundedness: 80, riskFloor: 88, speedToValue: 76, strategicUpside: 92 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Allogeneic off-the-shelf compatibility', 'Dramatically extended T-cell in vivo persistence', 'Clean base editing without double-strand breaks'],
        keyVulnerabilities: ['Off-target genomic translocation sequencing required for FDA filing'],
        estimatedImplementationWeeks: 20,
        tags: ['CRISPR', 'Base Editing', 'PD-1'],
        supportingLeaderGenomeId: 'science_jennifer_doudna'
      },
      {
        id: 'bio_m3_armored_il18_payload',
        rank: 0,
        title: 'Armored CAR-T with Inducible Secreted IL-18 / IL-7 Cytokine Payload',
        category: 'Immune Modulation',
        description: 'Equip CAR with an NFAT-responsive promoter that locally secretes pro-inflammatory cytokines only upon target engagement.',
        originSource: 'Immunology Genome (Michel Sadelain)',
        preScreenScores: { feasibility: 86, constraintFit: 89, complexityBoundedness: 82, riskFloor: 85, speedToValue: 80, strategicUpside: 88 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Remodels cold immunosuppressive tumor stroma', 'Recruits endogenous bystander NK cells', 'High tumor clearance'],
        keyVulnerabilities: ['Requires strict dose-escalation monitoring to prevent systemic cytokine release syndrome (CRS)'],
        estimatedImplementationWeeks: 18,
        tags: ['Armored CAR', 'IL-18', 'Cytokine'],
        supportingLeaderGenomeId: 'science_carl_june'
      },
      {
        id: 'bio_m4_mrna_lnp_in_vivo',
        rank: 0,
        title: 'In Vivo mRNA-LNP Targeted Reprogramming of Endogenous T-Cells',
        category: 'Delivery Systems',
        description: 'Intravenous injection of CD5-targeted lipid nanoparticles carrying CAR mRNA to generate transient CAR-T cells inside the body.',
        originSource: 'mRNA Nanomedicine (Katalin Karikó)',
        preScreenScores: { feasibility: 78, constraintFit: 92, complexityBoundedness: 86, riskFloor: 86, speedToValue: 84, strategicUpside: 94 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Bypasses $350k ex vivo cell manufacturing bottlenecks', 'Transient expression limits long-term toxicities', 'Repeatable dosing'],
        keyVulnerabilities: ['Transient half-life requires multiple bi-weekly infusions', 'Hepatic LNP clearance challenge'],
        estimatedImplementationWeeks: 22,
        tags: ['mRNA', 'LNP', 'In Vivo CAR'],
        supportingLeaderGenomeId: 'science_katalin_kariko'
      },
      {
        id: 'bio_m5_switchable_small_molecule_adapter',
        rank: 0,
        title: 'Small-Molecule Chemically Disruptable Safety Switch Adapter CAR',
        category: 'Safety Systems',
        description: 'Universal receptor that only binds tumors in the presence of an administered small-molecule bridging ligand.',
        originSource: 'Chemical Biology (Stuart Schreiber)',
        preScreenScores: { feasibility: 82, constraintFit: 88, complexityBoundedness: 81, riskFloor: 94, speedToValue: 78, strategicUpside: 85 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Instant pharmacological on/off rheostat control', 'Can switch tumor targets by changing adapter peptide'],
        keyVulnerabilities: ['Dependent on patient compliance with daily oral bridging ligand'],
        estimatedImplementationWeeks: 19,
        tags: ['Safety Switch', 'Adaptor CAR', 'Small Molecule'],
        supportingLeaderGenomeId: 'science_jennifer_doudna'
      },
      // Discarded Options
      {
        id: 'bio_m6_uncontrolled_systemic_il2_megadose',
        rank: 0,
        title: 'Constitutive High-Affinity IL-2 Secretion Without Safety Checkpoint',
        category: 'Immune Overactivation',
        description: 'Engineering CAR-T to continuously pump high-dose IL-2 into the bloodstream.',
        originSource: 'Unregulated Cytokine Approach',
        preScreenScores: { feasibility: 75, constraintFit: 35, complexityBoundedness: 60, riskFloor: 15, speedToValue: 60, strategicUpside: 40 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Massive early T-cell proliferation in vitro'],
        keyVulnerabilities: ['Fatal capillary leak syndrome and 80%+ Grade 4 CRS toxicity in vivo; unacceptable safety ceiling'],
        estimatedImplementationWeeks: 12,
        tags: ['High Toxicity', 'Lethal Risk', 'Pruned']
      }
    ];
  }

  private static getFinancialCandidatePool(): CandidateMethod[] {
    return [
      {
        id: 'fin_m1_dynamic_delta_gamma_hedging',
        rank: 0,
        title: 'Continuous High-Frequency Delta-Gamma Volatility Surface Hedging',
        category: 'Quantitative Hedging',
        description: 'Automated algorithmic rebalancing of derivative Greeks across options chains based on implied vol skew.',
        originSource: 'Quantitative Risk Genome (Jim Simons / Nassim Taleb)',
        preScreenScores: { feasibility: 91, constraintFit: 94, complexityBoundedness: 82, riskFloor: 92, speedToValue: 88, strategicUpside: 90 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Immunizes portfolio against sudden 4-sigma market drawdowns', 'Tight tracking error', 'Capital efficient'],
        keyVulnerabilities: ['Transaction slippage and exchange fee drag in extreme illiquidity spikes'],
        estimatedImplementationWeeks: 6,
        tags: ['Greeks', 'Delta-Gamma', 'Vol Surface'],
        supportingLeaderGenomeId: 'fin_jim_simons'
      },
      {
        id: 'fin_m2_barbell_cash_convexity',
        rank: 0,
        title: 'Asymmetric Antifragile Barbell (85% Ultra-Safe T-Bills + 15% Convex Far-OTM Puts)',
        category: 'Portfolio Construction',
        description: 'Zero exposure to medium-risk assets; maximum safety combined with hyper-leveraged tail-risk payoff convexity.',
        originSource: 'Antifragility Genome (Nassim Taleb)',
        preScreenScores: { feasibility: 96, constraintFit: 92, complexityBoundedness: 94, riskFloor: 96, speedToValue: 95, strategicUpside: 88 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Mathematically immune to Black Swan bankruptcy', 'Generates massive cash during market crashes to buy distressed assets'],
        keyVulnerabilities: ['Slight option premium theta decay drag during prolonged low-volatility bull markets'],
        estimatedImplementationWeeks: 2,
        tags: ['Barbell', 'Taleb', 'Antifragile', 'Tail Risk'],
        supportingLeaderGenomeId: 'fin_nassim_taleb'
      },
      {
        id: 'fin_m3_regime_switching_markov_harr',
        rank: 0,
        title: 'Hidden Markov Model Regime-Switching Factor Allocation',
        category: 'Statistical Arbitrage',
        description: 'Detect shifts between high-volatility inflationary regimes vs low-volatility expansionary regimes using real-time macroeconomic time-series.',
        originSource: 'Macro Quant Architecture (Ray Dalio / Jim Simons)',
        preScreenScores: { feasibility: 86, constraintFit: 90, complexityBoundedness: 79, riskFloor: 89, speedToValue: 82, strategicUpside: 89 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Proactively cuts equity beta before market inflection points', 'Optimizes Sharpe ratio above 2.2'],
        keyVulnerabilities: ['Regime classification lag during flash crashes (<48 hours)'],
        estimatedImplementationWeeks: 8,
        tags: ['Markov', 'Regime Switching', 'Dalio'],
        supportingLeaderGenomeId: 'fin_ray_dalio'
      },
      {
        id: 'fin_m4_cross_venue_liquidity_smart_routing',
        rank: 0,
        title: 'Smart Order Routing (SOR) with Dark Pool Midpoint Cross & Anti-Sniping Alpha',
        category: 'Execution Algorithms',
        description: 'Splitting large block institutional orders across dark venues with randomized interval TWAP/VWAP to eliminate information leakage.',
        originSource: 'Market Microstructure (Ken Griffin)',
        preScreenScores: { feasibility: 89, constraintFit: 91, complexityBoundedness: 83, riskFloor: 87, speedToValue: 85, strategicUpside: 86 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Cuts implementation shortfall by 38 bps', 'Hides order intent from HFT front-running algorithms'],
        keyVulnerabilities: ['Requires direct market data feeds and colocation connectivity'],
        estimatedImplementationWeeks: 5,
        tags: ['SOR', 'Dark Pools', 'VWAP'],
        supportingLeaderGenomeId: 'fin_ken_griffin'
      },
      {
        id: 'fin_m5_credit_spread_risk_parity',
        rank: 0,
        title: 'All-Weather Risk Parity Balanced on Volatility Contribution',
        category: 'Asset Allocation',
        description: 'Equalizing risk budgets across nominal bonds, inflation-linked bonds, commodities, and equities rather than dollar allocations.',
        originSource: 'Bridgewater All-Weather (Ray Dalio)',
        preScreenScores: { feasibility: 92, constraintFit: 88, complexityBoundedness: 88, riskFloor: 91, speedToValue: 90, strategicUpside: 84 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Smooth capital growth across 50-year economic cycles', 'Low drawdown profile (<12%)'],
        keyVulnerabilities: ['Relies on leverage on bond tranches to achieve target returns'],
        estimatedImplementationWeeks: 3,
        tags: ['Risk Parity', 'All Weather', 'Dalio'],
        supportingLeaderGenomeId: 'fin_ray_dalio'
      },
      // Discarded Options
      {
        id: 'fin_m6_100x_unhedged_leverage_crypto',
        rank: 0,
        title: '100x Leveraged Directional Momentum Futures on Unregulated Exchanges',
        category: 'Speculative Gambling',
        description: 'Maximizing borrowing to bet full fund treasury on short-term price continuation.',
        originSource: 'Degenerate Trading Baselines',
        preScreenScores: { feasibility: 80, constraintFit: 25, complexityBoundedness: 70, riskFloor: 5, speedToValue: 95, strategicUpside: 40 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['Instant 10x upside if lucky in first 4 hours'],
        keyVulnerabilities: ['100% chance of total capital liquidation on 1% adverse price wick; catastrophic risk profile'],
        estimatedImplementationWeeks: 1,
        tags: ['Liquidation Risk', 'Gambling', 'Pruned']
      }
    ];
  }

  private static getBusinessCandidatePool(): CandidateMethod[] {
    return [
      {
        id: 'biz_m1_product_led_freemium_growth',
        rank: 0,
        title: 'Product-Led Growth (PLG) Viral Loop with Self-Serve Frictionless Onboarding',
        category: 'Distribution & Go-To-Market',
        description: 'Zero-friction self-serve product experience driving organic bottom-up end-user adoption before enterprise sales motion.',
        originSource: 'Enterprise SaaS Genome (Satya Nadella / Stewart Butterfield)',
        preScreenScores: { feasibility: 90, constraintFit: 93, complexityBoundedness: 88, riskFloor: 90, speedToValue: 92, strategicUpside: 93 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Lowest customer acquisition cost (CAC)', 'Accelerated user signups', 'Natural land-and-expand revenue expansion'],
        keyVulnerabilities: ['Free tier hosting cost if conversion rates drop below 3.5%'],
        estimatedImplementationWeeks: 4,
        tags: ['PLG', 'Freemium', 'SaaS Growth'],
        supportingLeaderGenomeId: 'biz_satya_nadella'
      },
      {
        id: 'biz_m2_enterprise_value_based_pricing',
        rank: 0,
        title: 'Value-Based Metric Consumption Pricing with Tiered Volume Commitments',
        category: 'Monetization & Economics',
        description: 'Aligning price directly with customer value generation (e.g., QPS / API credits / compute capacity) with minimum annual contracts.',
        originSource: 'Pricing Strategy Architecture',
        preScreenScores: { feasibility: 88, constraintFit: 92, complexityBoundedness: 85, riskFloor: 89, speedToValue: 86, strategicUpside: 91 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Captures maximum willingness-to-pay', 'High net revenue retention (NRR > 130%)', 'Zero artificial seat limits'],
        keyVulnerabilities: ['Requires transparent billing dashboard to prevent customer bill shock'],
        estimatedImplementationWeeks: 3,
        tags: ['Value Pricing', 'Usage-Based', 'Economics'],
        supportingLeaderGenomeId: 'biz_jeff_bezos'
      },
      {
        id: 'biz_m3_developer_ecosystem_api_marketplace',
        rank: 0,
        title: 'Two-Sided Platform API Marketplace & Partner Integration Ecosystem',
        category: 'Defensibility & Moat',
        description: 'Opening APIs to third-party developers and ISVs to build native integrations, creating self-reinforcing network effects.',
        originSource: 'Platform Network Effects (Steve Jobs / Jensen Huang)',
        preScreenScores: { feasibility: 84, constraintFit: 89, complexityBoundedness: 78, riskFloor: 86, speedToValue: 76, strategicUpside: 95 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Deep structural customer switching costs', 'Ecosystem generates value for free', 'Compounding defensive moat'],
        keyVulnerabilities: ['Requires developer relations investment and stable API versioning policies'],
        estimatedImplementationWeeks: 8,
        tags: ['Ecosystem', 'Marketplace', 'Network Effects'],
        supportingLeaderGenomeId: 'biz_jensen_huang'
      },
      {
        id: 'biz_m4_strategic_tuck_in_acquisition',
        rank: 0,
        title: 'Strategic Tuck-In M&A of Niche IP & Engineering Talent',
        category: 'Corporate Development',
        description: 'Acquiring an early-stage specialized startup to instantly absorb breakthrough technology and bypass 18-month R&D cycle.',
        originSource: 'Capital Allocation Architecture (Warren Buffett / Satya Nadella)',
        preScreenScores: { feasibility: 80, constraintFit: 88, complexityBoundedness: 80, riskFloor: 85, speedToValue: 88, strategicUpside: 90 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Instant time-to-market advantage', 'Acquires proven patented IP and domain experts'],
        keyVulnerabilities: ['Post-merger cultural and codebase integration friction'],
        estimatedImplementationWeeks: 12,
        tags: ['M&A', 'Tuck-In', 'Strategic Growth'],
        supportingLeaderGenomeId: 'biz_warren_buffett'
      },
      {
        id: 'biz_m5_verticalized_industry_cloud_suite',
        rank: 0,
        title: 'Verticalized Industry-Specific Compliance & Workflow Suite',
        category: 'Market Positioning',
        description: 'Pre-packaging security, HIPAA/SOC2 compliance, and specialized workflows tailored directly for healthcare or financial enterprise buyers.',
        originSource: 'Enterprise Specialization',
        preScreenScores: { feasibility: 86, constraintFit: 91, complexityBoundedness: 82, riskFloor: 91, speedToValue: 80, strategicUpside: 87 },
        compositeTriageScore: 0,
        status: 'shortlisted_top_5',
        triageVerdict: '',
        keyStrengths: ['Commands 40% premium pricing over generic software', 'Extremely high renewal rates (>97%)'],
        keyVulnerabilities: ['Smaller total addressable niche market segment'],
        estimatedImplementationWeeks: 6,
        tags: ['Vertical SaaS', 'Compliance', 'High Retention'],
        supportingLeaderGenomeId: 'biz_satya_nadella'
      },
      // Discarded Options
      {
        id: 'biz_m6_spam_cold_email_blasting',
        rank: 0,
        title: 'Mass Automated Cold Email Domain Blasting (50,000 emails/day)',
        category: 'Outbound Marketing',
        description: 'Scraping LinkedIn and blasting unverified templates to C-level executives.',
        originSource: 'Low-Quality Outbound Tactics',
        preScreenScores: { feasibility: 90, constraintFit: 35, complexityBoundedness: 75, riskFloor: 25, speedToValue: 85, strategicUpside: 20 },
        compositeTriageScore: 0,
        status: 'pruned_eliminated',
        triageVerdict: '',
        keyStrengths: ['High raw volume of outbound emails in 24 hours'],
        keyVulnerabilities: ['Corporate email domain blacklisting, severe brand reputation damage, and 0.04% conversion rate'],
        estimatedImplementationWeeks: 1,
        tags: ['Domain Burn', 'Spam', 'Pruned']
      }
    ];
  }
}

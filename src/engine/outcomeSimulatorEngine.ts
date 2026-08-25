import {
  OutcomeSimulationRun,
  SimulatedRoad,
  TimelineMilestone,
  EnvironmentalSimulationLevers,
  SimulationHorizon
} from '../types';

export const CURATED_SIMULATION_RUNS: OutcomeSimulationRun[] = [
  {
    id: 'sim_arch_kafka_vs_monolith',
    simulationTitle: 'Architecture Strategy: Event-Driven Kafka Stream vs. Vertical Monolith Scale vs. Serverless Microservices',
    context: 'Evaluating core transaction processing infrastructure over a 3-year horizon as platform scale explodes from 10k to 500k transactions per minute.',
    simulatedAt: '2026-08-24T14:00:00Z',
    recommendedRoadId: 'road_event_stream',
    synthesisComparativeVerdict: 'Road A (Event-Driven Streaming) exhibits the highest long-term survival rate (94%) and compounds positive ROI (+320% at Year 3), completely avoiding the catastrophic lock contention collapse that strikes Road B at 50x scale.',
    levers: {
      macroVolatility: 35,
      competitorVelocity: 65,
      teamExecutionSkill: 80,
      scaleLoadMultiplier: 25,
      randomSeed: 42
    },
    roads: [
      {
        id: 'road_event_stream',
        optionTitle: 'Road A: Append-Only Event Sourcing (Kafka + CQRS Read Projections)',
        optionDescription: 'Decouple write ingestion into immutable Kafka log streams, materializing independent read views asynchronously in Redis/Postgres.',
        isRecommended: true,
        strategicPhilosophy: 'Thermodynamic scalability through decoupled lock-free immutability.',
        overallSurvivalRate: 94,
        expectedNetPresentValue: 4200,
        fragilityIndex: 2.1,
        keyTakeaway: 'Initial 60-day migration complexity yields compounding 40x throughput gains and near-zero outage risk at hyperscale.',
        milestones: [
          {
            horizon: 'day_30',
            horizonLabel: 'T+30 Days: Core Pipeline & Dual Writing',
            elapsedDays: 30,
            expectedState: 'Dual-writing orders to Postgres and Kafka topic. Initial consumer lag is high while dev team learns stream idempotency.',
            keyEvents: [
              'Kafka Schema Registry configured in CI/CD pipeline',
              'First 10% of checkout traffic routed through Kafka producer',
              'Initial developer cognitive friction around asynchronous eventual consistency'
            ],
            metrics: {
              roiPercentage: -15,
              systemReliabilitySLA: 99.92,
              teamVelocityScore: 68,
              technicalDebtAccumulation: 25,
              riskExposureScore: 35,
              customerRetentionRate: 97.5,
              monthlyCashBurnOrProfit: -45
            },
            primaryBottleneckOrRisk: 'Consumer unmarshal errors due to evolving event schemas.',
            mitigationApplied: 'Strict Protobuf backwards-compatibility gates enforced in GitHub Actions.'
          },
          {
            horizon: 'day_90',
            horizonLabel: 'T+90 Days: Cutover & Primary DB Relieved',
            elapsedDays: 90,
            expectedState: 'Full cutover achieved. Primary Postgres CPU utilization plummets from 88% to 14%. P99 checkout latency drops to 18ms.',
            keyEvents: [
              'PostgreSQL row locks eliminated from order checkout path',
              'Zero lost orders recorded during Black Friday 12x flash traffic surge',
              'Analytical team launches real-time fraud detection consumer off the live event stream'
            ],
            metrics: {
              roiPercentage: 45,
              systemReliabilitySLA: 99.98,
              teamVelocityScore: 82,
              technicalDebtAccumulation: 18,
              riskExposureScore: 20,
              customerRetentionRate: 98.8,
              monthlyCashBurnOrProfit: 80
            },
            primaryBottleneckOrRisk: 'Kafka broker partition skew during unexpected flash sales.',
            mitigationApplied: 'Dynamic partition hashing using `tenant_id:timestamp_bucket`.'
          },
          {
            horizon: 'day_180',
            horizonLabel: 'T+180 Days: Multi-Region Read Replicas & CQRS Maturity',
            elapsedDays: 180,
            expectedState: 'Multi-region read views materialized in edge data centers. API response times hit global P95 of 22ms.',
            keyEvents: [
              'Zero downtime maintenance achieved for all read-model schema updates',
              'Developer velocity surges as new micro-features attach as passive event consumers without touching core monolith',
              'Infrastructure cost per transaction drops by 48%'
            ],
            metrics: {
              roiPercentage: 140,
              systemReliabilitySLA: 99.99,
              teamVelocityScore: 91,
              technicalDebtAccumulation: 12,
              riskExposureScore: 15,
              customerRetentionRate: 99.2,
              monthlyCashBurnOrProfit: 210
            },
            primaryBottleneckOrRisk: 'Event log retention storage costs exceeding projected budget.',
            mitigationApplied: 'Tiered Kafka storage configured with auto-offload to AWS S3 Glacier after 7 days.'
          },
          {
            horizon: 'year_1',
            horizonLabel: 'T+1 Year: Strategic Architectural Equilibrium',
            elapsedDays: 365,
            expectedState: 'Engineered as an autonomous event mesh. Platform easily absorbs 25x organic customer growth with zero architectural refactoring.',
            keyEvents: [
              'Full SOC2 Type II cryptographic audit passed with 100% immutable event lineage',
              'Competitor suffers major multi-hour database lock outage; 14 enterprise clients migrate to us',
              'Engineering team onboard time reduced from 6 weeks to 8 days due to isolated consumer contracts'
            ],
            metrics: {
              roiPercentage: 230,
              systemReliabilitySLA: 99.995,
              teamVelocityScore: 94,
              technicalDebtAccumulation: 10,
              riskExposureScore: 10,
              customerRetentionRate: 99.5,
              monthlyCashBurnOrProfit: 350
            },
            primaryBottleneckOrRisk: 'Minor schema version drift across legacy microservices.',
            mitigationApplied: 'Automated semantic schema deprecation bot in CI.'
          },
          {
            horizon: 'year_3',
            horizonLabel: 'T+3 Years: Compounding Competitive Moat',
            elapsedDays: 1095,
            expectedState: 'Platform operates as a real-time predictive data operating system. Real-time AI models trained directly on 3-year immutable event streams.',
            keyEvents: [
              'Autonomous real-time pricing and inventory optimization generating $8.5M in incremental annual margin',
              'System handles 500k TPS with single-digit millisecond latency across 4 continents',
              'Total cumulative infrastructure cost savings exceed $3.2M vs monolithic projections'
            ],
            metrics: {
              roiPercentage: 320,
              systemReliabilitySLA: 99.999,
              teamVelocityScore: 96,
              technicalDebtAccumulation: 8,
              riskExposureScore: 8,
              customerRetentionRate: 99.7,
              monthlyCashBurnOrProfit: 580
            },
            primaryBottleneckOrRisk: 'Global network partition edge cases.',
            mitigationApplied: 'Active-active multi-region Kafka mirror maker clusters with automated quorum arbitration.'
          }
        ],
        branchingForks: [
          {
            id: 'fork_1',
            atHorizon: 'day_90',
            triggerCondition: 'Consumer Lag exceeds 500ms during peak load surge',
            forkQuestion: 'How should the system scale stream consumer throughput?',
            branchA: {
              name: 'Scale Consumer Worker Replicas & Sub-partition Topics (Recommended)',
              consequence: 'Instantly restores sub-10ms latency; zero architectural debt incurred.',
              probability: 85,
              expectedRoiDelta: 20
            },
            branchB: {
              name: 'Temporarily bypass event log and write directly to database',
              consequence: 'Short-term relief causes massive data reconciliation drift and corrupts audit lineage.',
              probability: 15,
              expectedRoiDelta: -45
            }
          }
        ],
        monteCarlo: {
          p90BestCase: {
            roiPercentage: 420,
            systemReliabilitySLA: 99.999,
            teamVelocityScore: 98,
            technicalDebtAccumulation: 5,
            riskExposureScore: 5,
            customerRetentionRate: 99.9,
            monthlyCashBurnOrProfit: 750,
            narrative: 'Flawless execution: Zero unhandled partitions, rapid developer adoption, enterprise NRR hits 145% as clients praise real-time webhook responsiveness.'
          },
          p50ExpectedBaseCase: {
            roiPercentage: 320,
            systemReliabilitySLA: 99.99,
            teamVelocityScore: 94,
            technicalDebtAccumulation: 10,
            riskExposureScore: 10,
            customerRetentionRate: 99.5,
            monthlyCashBurnOrProfit: 580,
            narrative: 'High-confidence baseline: 60-day migration learning curve followed by robust linear horizontal scaling and $3M+ infrastructure savings.'
          },
          p10StressCase: {
            roiPercentage: 110,
            systemReliabilitySLA: 99.85,
            teamVelocityScore: 78,
            technicalDebtAccumulation: 28,
            riskExposureScore: 32,
            customerRetentionRate: 96.5,
            monthlyCashBurnOrProfit: 140,
            narrative: 'Team takes 4 extra months to master CQRS eventual consistency; occasional consumer lag bugs require manual rebalancing during holidays.'
          },
          p1TailRiskCollapse: {
            roiPercentage: -65,
            systemReliabilitySLA: 98.5,
            teamVelocityScore: 40,
            technicalDebtAccumulation: 75,
            riskExposureScore: 85,
            customerRetentionRate: 88.0,
            monthlyCashBurnOrProfit: -120,
            narrative: 'Catastrophic misconfiguration: Unpartitioned single hot topic causes cascading broker OOM crash during national campaign, losing 4 hours of uncommitted state.'
          }
        }
      },
      {
        id: 'road_vertical_monolith',
        optionTitle: 'Road B: Vertical Monolithic Scaling (128-Core High-Memory Postgres)',
        optionDescription: 'Keep existing monolithic relational schema and upgrade database instance sizes to top-tier AWS RDS `db.r6g.32xlarge` instances with read replicas.',
        isRecommended: false,
        strategicPhilosophy: 'Simplicity and familiar ACID guarantees at the expense of thermodynamic lock contention limits.',
        overallSurvivalRate: 38,
        expectedNetPresentValue: -850,
        fragilityIndex: 7.8,
        keyTakeaway: 'Fast and cheap to start, but hits a catastrophic wall at month 6 when WAL lock contention causes cascading timeout outages during peak traffic.',
        milestones: [
          {
            horizon: 'day_30',
            horizonLabel: 'T+30 Days: Instant Gratification & Fast Rollout',
            elapsedDays: 30,
            expectedState: 'Database upgraded in 20-minute maintenance window. Dev team continues shipping features with zero new paradigm learning curve.',
            keyEvents: [
              'Upgraded to 128-core RDS instance with 1TB RAM',
              'Initial latency feels crisp; developers celebrate fast delivery',
              'Cloud infrastructure bill jumps by $14,000/month'
            ],
            metrics: {
              roiPercentage: 15,
              systemReliabilitySLA: 99.90,
              teamVelocityScore: 85,
              technicalDebtAccumulation: 35,
              riskExposureScore: 45,
              customerRetentionRate: 97.0,
              monthlyCashBurnOrProfit: -20
            },
            primaryBottleneckOrRisk: 'High idle cloud infrastructure expenditure.',
            mitigationApplied: 'Purchased 1-year AWS Reserved Instance discount to lower cost.'
          },
          {
            horizon: 'day_90',
            horizonLabel: 'T+90 Days: Lock Contention Warnings & Connection Leaks',
            elapsedDays: 90,
            expectedState: 'Traffic doubles. Database CPU sits at 65%, but P99 latency begins spiking to 650ms due to row lock contention on the `orders` and `users` tables.',
            keyEvents: [
              'Connection pool exhaustion alerts trigger 4 times in one week',
              'Engineers spend 40% of sprint time manually optimizing SQL indexes and query plans',
              'Read replicas lag behind primary by up to 12 seconds during flash writes'
            ],
            metrics: {
              roiPercentage: -10,
              systemReliabilitySLA: 99.65,
              teamVelocityScore: 62,
              technicalDebtAccumulation: 55,
              riskExposureScore: 65,
              customerRetentionRate: 95.2,
              monthlyCashBurnOrProfit: -65
            },
            primaryBottleneckOrRisk: 'Row-level locking on hot tables preventing concurrent checkouts.',
            mitigationApplied: 'Added PgBouncer connection pooling and aggressive query timeout limits.'
          },
          {
            horizon: 'day_180',
            horizonLabel: 'T+180 Days: The Wall — Cascading 504 Outage',
            elapsedDays: 180,
            expectedState: 'Scale hits 15x. During prime-time flash sale, WAL write lock saturation triggers 42-minute total platform freeze and cascading 504 gateway timeouts.',
            keyEvents: [
              'Catastrophic 42-minute outage causes $450k in lost checkout revenue',
              'Executive emergency post-mortem mandates total freeze on product features',
              'Senior backend architect resigns due to severe on-call burnout'
            ],
            metrics: {
              roiPercentage: -75,
              systemReliabilitySLA: 98.40,
              teamVelocityScore: 35,
              technicalDebtAccumulation: 80,
              riskExposureScore: 88,
              customerRetentionRate: 90.1,
              monthlyCashBurnOrProfit: -180
            },
            primaryBottleneckOrRisk: 'Single primary node hardware capacity ceiling reached.',
            mitigationApplied: 'Emergency sharding script hacked together under extreme stress.'
          },
          {
            horizon: 'year_1',
            horizonLabel: 'T+1 Year: Technical Debt Paralysis',
            elapsedDays: 365,
            expectedState: 'System is an unstable patchwork of manual database shards, custom application routing logic, and fragile caching layers.',
            keyEvents: [
              'Feature delivery velocity drops to 25% of baseline',
              'Infrastructure bills exceed $45,000/month while performance remains jittery',
              'Board mandates emergency complete architectural rebuild'
            ],
            metrics: {
              roiPercentage: -140,
              systemReliabilitySLA: 98.10,
              teamVelocityScore: 28,
              technicalDebtAccumulation: 92,
              riskExposureScore: 92,
              customerRetentionRate: 85.0,
              monthlyCashBurnOrProfit: -240
            },
            primaryBottleneckOrRisk: 'Manual cross-shard joins causing data corruption.',
            mitigationApplied: 'Hired expensive external database consultants.'
          },
          {
            horizon: 'year_3',
            horizonLabel: 'T+3 Years: Legacy Rewrite Disaster',
            elapsedDays: 1095,
            expectedState: 'Total legacy paralysis: 18-month rewrite project is currently 6 months behind schedule while competitors capture 60% of market share.',
            keyEvents: [
              'Market leadership permanently lost to modern event-driven competitors',
              'Cumulative outage losses exceed $2.8M',
              'Original monolith requires 24/7 dedicated manual firefighting team'
            ],
            metrics: {
              roiPercentage: -220,
              systemReliabilitySLA: 97.50,
              teamVelocityScore: 20,
              technicalDebtAccumulation: 98,
              riskExposureScore: 96,
              customerRetentionRate: 78.0,
              monthlyCashBurnOrProfit: -350
            },
            primaryBottleneckOrRisk: 'Complete architectural obsolescence.',
            mitigationApplied: 'Forced to acquire external technology startup to replace legacy backend.'
          }
        ],
        branchingForks: [
          {
            id: 'fork_monolith_1',
            atHorizon: 'day_180',
            triggerCondition: 'Primary DB crashes under 100% CPU lock storm',
            forkQuestion: 'Emergency response path during outage crisis:',
            branchA: {
              name: 'Emergency Sharding by Tenant ID (High Risk Hack)',
              consequence: 'Breaks global analytics queries and takes 3 weeks of sleepless firefighting.',
              probability: 60,
              expectedRoiDelta: -60
            },
            branchB: {
              name: 'Rate-limit and drop 50% of incoming users at the gateway',
              consequence: 'Saves database from crashing but destroys customer trust and triggers immediate churn.',
              probability: 40,
              expectedRoiDelta: -80
            }
          }
        ],
        monteCarlo: {
          p90BestCase: {
            roiPercentage: 20,
            systemReliabilitySLA: 99.4,
            teamVelocityScore: 60,
            technicalDebtAccumulation: 65,
            riskExposureScore: 55,
            customerRetentionRate: 94.0,
            monthlyCashBurnOrProfit: 10,
            narrative: 'Traffic growth remains sluggish (only 2x); monolith holds on through aggressive caching, though cloud bills remain high.'
          },
          p50ExpectedBaseCase: {
            roiPercentage: -140,
            systemReliabilitySLA: 98.1,
            teamVelocityScore: 28,
            technicalDebtAccumulation: 92,
            riskExposureScore: 92,
            customerRetentionRate: 85.0,
            monthlyCashBurnOrProfit: -240,
            narrative: 'Moderate growth triggers lock storms at month 6; feature velocity collapses as team enters perpetual reactive firefighting mode.'
          },
          p10StressCase: {
            roiPercentage: -280,
            systemReliabilitySLA: 96.5,
            teamVelocityScore: 15,
            technicalDebtAccumulation: 99,
            riskExposureScore: 98,
            customerRetentionRate: 72.0,
            monthlyCashBurnOrProfit: -420,
            narrative: 'Early viral growth instantly crushes database; multiple prolonged outages lead to class-action SLA penalty payouts and key customer cancellations.'
          },
          p1TailRiskCollapse: {
            roiPercentage: -450,
            systemReliabilitySLA: 92.0,
            teamVelocityScore: 5,
            technicalDebtAccumulation: 100,
            riskExposureScore: 100,
            customerRetentionRate: 55.0,
            monthlyCashBurnOrProfit: -600,
            narrative: 'Total company failure: Irrecoverable split-brain data corruption during manual database sharding hack destroys account balances; company forced into fire sale.'
          }
        }
      },
      {
        id: 'road_serverless_microservices',
        optionTitle: 'Road C: Granular Serverless Microservices (50+ Lambda Functions + DynamoDB)',
        optionDescription: 'Decompose every API route into fine-grained serverless Lambda functions connected via API Gateway and EventBridge.',
        isRecommended: false,
        strategicPhilosophy: 'Extreme granular serverless decomposition for zero idle cost.',
        overallSurvivalRate: 62,
        expectedNetPresentValue: 1100,
        fragilityIndex: 5.4,
        keyTakeaway: 'Great for zero-idle cost and burst scaling, but introduces high cold-start latency, microservice sprawl, and severe distributed debugging friction.',
        milestones: [
          {
            horizon: 'day_30',
            horizonLabel: 'T+30 Days: Fast Deployment of First 10 Functions',
            elapsedDays: 30,
            expectedState: 'Initial micro-functions deployed quickly via Serverless Framework. Cloud bills are virtually $0.',
            keyEvents: [
              'Zero server management required',
              'Cold start latency spikes to 1200ms on Python Lambdas',
              'Developers excited by simple deployment model'
            ],
            metrics: {
              roiPercentage: 10,
              systemReliabilitySLA: 99.70,
              teamVelocityScore: 78,
              technicalDebtAccumulation: 30,
              riskExposureScore: 30,
              customerRetentionRate: 96.5,
              monthlyCashBurnOrProfit: 15
            },
            primaryBottleneckOrRisk: 'Cold-start latency on VPC-connected Lambdas.',
            mitigationApplied: 'Configured Provisioned Concurrency on hot checkout functions.'
          },
          {
            horizon: 'day_90',
            horizonLabel: 'T+90 Days: Microservice Sprawl & EventBridge Latency',
            elapsedDays: 90,
            expectedState: 'Function count swells to 65. Distributed tracing becomes mandatory to diagnose multi-hop latency bottlenecks.',
            keyEvents: [
              'Local development environment becomes impossible to run on developer laptops',
              'EventBridge choreography creates circular event trigger bug during deploy',
              'Provisioned concurrency costs begin rivaling traditional EC2 clusters'
            ],
            metrics: {
              roiPercentage: 35,
              systemReliabilitySLA: 99.75,
              teamVelocityScore: 65,
              technicalDebtAccumulation: 50,
              riskExposureScore: 45,
              customerRetentionRate: 97.0,
              monthlyCashBurnOrProfit: 45
            },
            primaryBottleneckOrRisk: 'Distributed tracing complexity across 60+ decoupled lambdas.',
            mitigationApplied: 'Deployed AWS X-Ray and OpenTelemetry distributed spans.'
          },
          {
            horizon: 'day_180',
            horizonLabel: 'T+180 Days: DynamoDB Single-Table Design Bottlenecks',
            elapsedDays: 180,
            expectedState: 'Access patterns evolve, requiring complex secondary indexes on DynamoDB. Unanticipated query patterns require full table scans.',
            keyEvents: [
              'Data schema changes require expensive custom ETL migration lambdas',
              'P99 latency stabilizes at 140ms due to multi-hop function chaining',
              'Overall system scales well with bursts, but developer friction remains moderate'
            ],
            metrics: {
              roiPercentage: 85,
              systemReliabilitySLA: 99.85,
              teamVelocityScore: 68,
              technicalDebtAccumulation: 52,
              riskExposureScore: 35,
              customerRetentionRate: 98.0,
              monthlyCashBurnOrProfit: 110
            },
            primaryBottleneckOrRisk: 'High cognitive overhead of DynamoDB single-table design.',
            mitigationApplied: 'Standardized query patterns through shared internal SDK.'
          },
          {
            horizon: 'year_1',
            horizonLabel: 'T+1 Year: Operational Plateau',
            elapsedDays: 365,
            expectedState: 'System handles large traffic spikes reliably, but monthly AWS bills for API Gateway and EventBridge requests exceed $28,000.',
            keyEvents: [
              'Zero infrastructure outages, but continuous micro-latency complaints from enterprise mobile clients',
              'Complex IAM permission policies require 2 full-time DevOps engineers to maintain'
            ],
            metrics: {
              roiPercentage: 110,
              systemReliabilitySLA: 99.90,
              teamVelocityScore: 72,
              technicalDebtAccumulation: 45,
              riskExposureScore: 28,
              customerRetentionRate: 98.5,
              monthlyCashBurnOrProfit: 160
            },
            primaryBottleneckOrRisk: 'Cloud vendor lock-in to proprietary AWS serverless primitives.',
            mitigationApplied: 'Containerized hot-path lambdas into AWS ECS Fargate.'
          },
          {
            horizon: 'year_3',
            horizonLabel: 'T+3 Years: Partial Consolidation',
            elapsedDays: 1095,
            expectedState: 'Team consolidates 80 micro-functions into 4 coarse-grained modular services to reduce network hop latency and billing overhead.',
            keyEvents: [
              'Platform achieves solid 99.92% reliability at moderate operational cost',
              'Delivery velocity stabilizes at good industry average'
            ],
            metrics: {
              roiPercentage: 160,
              systemReliabilitySLA: 99.92,
              teamVelocityScore: 78,
              technicalDebtAccumulation: 35,
              riskExposureScore: 22,
              customerRetentionRate: 98.8,
              monthlyCashBurnOrProfit: 240
            },
            primaryBottleneckOrRisk: 'Multi-hop network serialization overhead.',
            mitigationApplied: 'Consolidated related domain functions into unified containers.'
          }
        ],
        branchingForks: [
          {
            id: 'fork_serverless_1',
            atHorizon: 'day_90',
            triggerCondition: 'AWS API Gateway & EventBridge monthly bill exceeds $20k',
            forkQuestion: 'Strategy to optimize serverless request billing:',
            branchA: {
              name: 'Consolidate granular functions into coarse microservices behind ALB (Recommended)',
              consequence: 'Cuts AWS bill by 60% and reduces cold-start hops.',
              probability: 75,
              expectedRoiDelta: 30
            },
            branchB: {
              name: 'Apply aggressive request throttling on free-tier clients',
              consequence: 'Lowers AWS bill but throttles customer onboarding conversion by 25%.',
              probability: 25,
              expectedRoiDelta: -15
            }
          }
        ],
        monteCarlo: {
          p90BestCase: {
            roiPercentage: 240,
            systemReliabilitySLA: 99.95,
            teamVelocityScore: 88,
            technicalDebtAccumulation: 25,
            riskExposureScore: 18,
            customerRetentionRate: 99.2,
            monthlyCashBurnOrProfit: 380,
            narrative: 'Disciplined function boundaries and automated OpenTelemetry tracing prevent sprawl; serverless handles viral spikes smoothly.'
          },
          p50ExpectedBaseCase: {
            roiPercentage: 160,
            systemReliabilitySLA: 99.92,
            teamVelocityScore: 78,
            technicalDebtAccumulation: 35,
            riskExposureScore: 22,
            customerRetentionRate: 98.8,
            monthlyCashBurnOrProfit: 240,
            narrative: 'Solid operational stability with moderate developer overhead from distributed debugging and vendor lock-in.'
          },
          p10StressCase: {
            roiPercentage: 40,
            systemReliabilitySLA: 99.4,
            teamVelocityScore: 55,
            technicalDebtAccumulation: 68,
            riskExposureScore: 50,
            customerRetentionRate: 96.0,
            monthlyCashBurnOrProfit: 50,
            narrative: 'Severe function sprawl (150+ lambdas) causes debugging paralysis; high API Gateway costs erode profit margins.'
          },
          p1TailRiskCollapse: {
            roiPercentage: -80,
            systemReliabilitySLA: 98.0,
            teamVelocityScore: 30,
            technicalDebtAccumulation: 85,
            riskExposureScore: 75,
            customerRetentionRate: 91.0,
            monthlyCashBurnOrProfit: -90,
            narrative: 'Circular EventBridge loop triggers runaway Lambda invocations overnight, exhausting AWS account quota and generating a $180k surprise bill.'
          }
        }
      }
    ]
  }
];

export class OutcomeSimulatorEngine {
  private runs: Map<string, OutcomeSimulationRun> = new Map();

  constructor() {
    CURATED_SIMULATION_RUNS.forEach(r => this.runs.set(r.id, r));
  }

  public getAllRuns(): OutcomeSimulationRun[] {
    return Array.from(this.runs.values());
  }

  public getRunById(id: string): OutcomeSimulationRun | undefined {
    return this.runs.get(id);
  }

  public recalculateWithLevers(
    baseRun: OutcomeSimulationRun,
    newLevers: EnvironmentalSimulationLevers
  ): OutcomeSimulationRun {
    // Deterministic simulation adjustment based on levers
    const skillMultiplier = (newLevers.teamExecutionSkill - 50) / 100; // -0.5 to +0.5
    const volatilityPenalty = (newLevers.macroVolatility - 30) / 100; // negative impact
    const competitorDrag = (newLevers.competitorVelocity - 50) / 100;
    const scaleStrain = (newLevers.scaleLoadMultiplier - 10) / 50;

    const modifiedRoads: SimulatedRoad[] = baseRun.roads.map(road => {
      const isRoadA = road.id.includes('event') || road.isRecommended;
      const isRoadB = road.id.includes('monolith');

      // Road A benefits heavily from team skill and scales smoothly under high scale load
      // Road B suffers exponentially under scale strain and volatility
      const roadSurvivalDelta = isRoadA
        ? Math.round(skillMultiplier * 15 - volatilityPenalty * 8 - scaleStrain * 3)
        : isRoadB
        ? Math.round(skillMultiplier * 10 - volatilityPenalty * 25 - scaleStrain * 35)
        : Math.round(skillMultiplier * 12 - volatilityPenalty * 15 - scaleStrain * 10);

      const survivalRate = Math.max(5, Math.min(99, road.overallSurvivalRate + roadSurvivalDelta));

      const updatedMilestones: TimelineMilestone[] = road.milestones.map((m, idx) => {
        const timeFactor = (idx + 1) * 0.2;
        const roiDelta = isRoadA
          ? Math.round(skillMultiplier * 40 * timeFactor - competitorDrag * 20)
          : isRoadB
          ? Math.round(-scaleStrain * 60 * timeFactor - volatilityPenalty * 30)
          : Math.round(skillMultiplier * 20 * timeFactor);

        const slaDelta = isRoadB && scaleStrain > 0.3 ? -0.4 * timeFactor : (skillMultiplier * 0.05);

        return {
          ...m,
          metrics: {
            ...m.metrics,
            roiPercentage: Math.round(m.metrics.roiPercentage + roiDelta),
            systemReliabilitySLA: Number(Math.max(90, Math.min(99.999, m.metrics.systemReliabilitySLA + slaDelta)).toFixed(3)),
            teamVelocityScore: Math.max(10, Math.min(100, Math.round(m.metrics.teamVelocityScore + skillMultiplier * 15))),
            technicalDebtAccumulation: Math.max(2, Math.min(99, Math.round(m.metrics.technicalDebtAccumulation - skillMultiplier * 10 + (isRoadB ? scaleStrain * 15 : 0)))),
            monthlyCashBurnOrProfit: Math.round(m.metrics.monthlyCashBurnOrProfit + roiDelta * 0.8)
          }
        };
      });

      return {
        ...road,
        overallSurvivalRate: survivalRate,
        milestones: updatedMilestones
      };
    });

    const updatedRun: OutcomeSimulationRun = {
      ...baseRun,
      id: `sim_run_${Date.now()}`,
      levers: newLevers,
      roads: modifiedRoads,
      simulatedAt: new Date().toISOString()
    };

    this.runs.set(updatedRun.id, updatedRun);
    return updatedRun;
  }

  public generateDynamicSimulation(params: {
    title: string;
    context: string;
    optionA: string;
    optionB: string;
    optionC?: string;
    levers?: EnvironmentalSimulationLevers;
  }): OutcomeSimulationRun {
    const levers: EnvironmentalSimulationLevers = params.levers || {
      macroVolatility: 40,
      competitorVelocity: 60,
      teamExecutionSkill: 75,
      scaleLoadMultiplier: 20,
      randomSeed: 101
    };

    const runId = `sim_dyn_${Date.now()}`;

    const roadA: SimulatedRoad = {
      id: 'road_opt_a',
      optionTitle: `Road 1: ${params.optionA}`,
      optionDescription: `Disciplined, deterministic implementation of ${params.optionA} with rigorous guardrails and telemetry.`,
      isRecommended: true,
      strategicPhilosophy: 'Invariant-first architectural discipline with bounded risk exposure.',
      overallSurvivalRate: 92,
      expectedNetPresentValue: 3400,
      fragilityIndex: 2.3,
      keyTakeaway: 'High upfront engineering rigor yields 4x ROI compounding with minimal operational debt.',
      milestones: this.buildMilestoneLadder(params.optionA, true, 180, 99.98, 92, 12),
      branchingForks: [
        {
          id: 'fork_dyn_1',
          atHorizon: 'day_90',
          triggerCondition: 'Volume surges 5x faster than baseline forecast',
          forkQuestion: `How to handle accelerated scale under ${params.optionA}?`,
          branchA: {
            name: 'Auto-scale worker tiers with proactive caching (Recommended)',
            consequence: 'Absorbs surge cleanly with +25% margin expansion.',
            probability: 80,
            expectedRoiDelta: 25
          },
          branchB: {
            name: 'Throttle peak concurrency to protect fixed budget',
            consequence: 'Caps cost but introduces user queue wait times.',
            probability: 20,
            expectedRoiDelta: -10
          }
        }
      ],
      monteCarlo: {
        p90BestCase: {
          roiPercentage: 380,
          systemReliabilitySLA: 99.995,
          teamVelocityScore: 96,
          technicalDebtAccumulation: 6,
          riskExposureScore: 8,
          customerRetentionRate: 99.4,
          monthlyCashBurnOrProfit: 450,
          narrative: 'Superlinear adoption with exceptional reliability and frictionless operational execution.'
        },
        p50ExpectedBaseCase: {
          roiPercentage: 240,
          systemReliabilitySLA: 99.98,
          teamVelocityScore: 90,
          technicalDebtAccumulation: 12,
          riskExposureScore: 12,
          customerRetentionRate: 98.9,
          monthlyCashBurnOrProfit: 290,
          narrative: 'Predictable high-yield trajectory with robust resilience against market volatility.'
        },
        p10StressCase: {
          roiPercentage: 80,
          systemReliabilitySLA: 99.7,
          teamVelocityScore: 72,
          technicalDebtAccumulation: 30,
          riskExposureScore: 35,
          customerRetentionRate: 96.0,
          monthlyCashBurnOrProfit: 90,
          narrative: 'Execution headwinds delay full rollout by 90 days; solid fundamentals maintain positive net return.'
        },
        p1TailRiskCollapse: {
          roiPercentage: -40,
          systemReliabilitySLA: 98.2,
          teamVelocityScore: 45,
          technicalDebtAccumulation: 65,
          riskExposureScore: 70,
          customerRetentionRate: 89.0,
          monthlyCashBurnOrProfit: -60,
          narrative: 'Unexpected external regulatory or vendor API rupture forces rapid architecture pivot.'
        }
      }
    };

    const roadB: SimulatedRoad = {
      id: 'road_opt_b',
      optionTitle: `Road 2: ${params.optionB}`,
      optionDescription: `Alternative approach: ${params.optionB}.`,
      isRecommended: false,
      strategicPhilosophy: 'Opportunistic or legacy-biased implementation path.',
      overallSurvivalRate: 48,
      expectedNetPresentValue: -320,
      fragilityIndex: 6.9,
      keyTakeaway: 'Short-term speed creates compounding downstream friction and second-order failure modes.',
      milestones: this.buildMilestoneLadder(params.optionB, false, -45, 98.6, 45, 78),
      branchingForks: [
        {
          id: 'fork_dyn_2',
          atHorizon: 'day_180',
          triggerCondition: 'Accumulated technical/operational debt slows release velocity by > 50%',
          forkQuestion: 'Resolution path for mounting system friction:',
          branchA: {
            name: 'Emergency freeze on feature development to pay down debt',
            consequence: 'Stabilizes platform but forfeits next quarter roadmap deliverables.',
            probability: 60,
            expectedRoiDelta: -30
          },
          branchB: {
            name: 'Push forward through debt with temporary duct-tape fixes',
            consequence: 'Triggers acute outage risk during next seasonal traffic peak.',
            probability: 40,
            expectedRoiDelta: -75
          }
        }
      ],
      monteCarlo: {
        p90BestCase: {
          roiPercentage: 60,
          systemReliabilitySLA: 99.5,
          teamVelocityScore: 70,
          technicalDebtAccumulation: 50,
          riskExposureScore: 40,
          customerRetentionRate: 96.0,
          monthlyCashBurnOrProfit: 40,
          narrative: 'Low stress environment allows quick-and-dirty approach to survive without catastrophic rupture.'
        },
        p50ExpectedBaseCase: {
          roiPercentage: -45,
          systemReliabilitySLA: 98.6,
          teamVelocityScore: 45,
          technicalDebtAccumulation: 78,
          riskExposureScore: 68,
          customerRetentionRate: 91.0,
          monthlyCashBurnOrProfit: -80,
          narrative: 'Compounding coordination overhead and latency jitter drag the initiative into the red by Month 9.'
        },
        p10StressCase: {
          roiPercentage: -180,
          systemReliabilitySLA: 97.2,
          teamVelocityScore: 25,
          technicalDebtAccumulation: 92,
          riskExposureScore: 88,
          customerRetentionRate: 82.0,
          monthlyCashBurnOrProfit: -210,
          narrative: 'Scale surge creates cascading downtime; team spends all capacity on manual firefighting.'
        },
        p1TailRiskCollapse: {
          roiPercentage: -320,
          systemReliabilitySLA: 93.0,
          teamVelocityScore: 10,
          technicalDebtAccumulation: 99,
          riskExposureScore: 98,
          customerRetentionRate: 65.0,
          monthlyCashBurnOrProfit: -400,
          narrative: 'System collapse triggers critical customer data loss or severe compliance audit breach.'
        }
      }
    };

    const roads = [roadA, roadB];

    if (params.optionC) {
      const roadC: SimulatedRoad = {
        id: 'road_opt_c',
        optionTitle: `Road 3: ${params.optionC}`,
        optionDescription: `Conservative or outsourced path: ${params.optionC}.`,
        isRecommended: false,
        strategicPhilosophy: 'Risk-averse third-party delegation with high ongoing recurring unit economics.',
        overallSurvivalRate: 70,
        expectedNetPresentValue: 950,
        fragilityIndex: 4.8,
        keyTakeaway: 'Safe and predictable baseline with capped upside and moderate vendor margin drag.',
        milestones: this.buildMilestoneLadder(params.optionC, false, 80, 99.85, 75, 38),
        branchingForks: [],
        monteCarlo: {
          p90BestCase: {
            roiPercentage: 140,
            systemReliabilitySLA: 99.92,
            teamVelocityScore: 82,
            technicalDebtAccumulation: 25,
            riskExposureScore: 20,
            customerRetentionRate: 98.0,
            monthlyCashBurnOrProfit: 140,
            narrative: 'Vendor delivers on SLA; integration remains stable.'
          },
          p50ExpectedBaseCase: {
            roiPercentage: 80,
            systemReliabilitySLA: 99.85,
            teamVelocityScore: 75,
            technicalDebtAccumulation: 38,
            riskExposureScore: 30,
            customerRetentionRate: 97.2,
            monthlyCashBurnOrProfit: 85,
            narrative: 'Steady operational cadence, but vendor subscription costs scale faster than revenue.'
          },
          p10StressCase: {
            roiPercentage: -20,
            systemReliabilitySLA: 99.1,
            teamVelocityScore: 50,
            technicalDebtAccumulation: 55,
            riskExposureScore: 52,
            customerRetentionRate: 93.0,
            monthlyCashBurnOrProfit: -30,
            narrative: 'Vendor increases prices by 40% at annual renewal; migration friction traps team.'
          },
          p1TailRiskCollapse: {
            roiPercentage: -120,
            systemReliabilitySLA: 96.5,
            teamVelocityScore: 25,
            technicalDebtAccumulation: 80,
            riskExposureScore: 82,
            customerRetentionRate: 84.0,
            monthlyCashBurnOrProfit: -150,
            narrative: 'Vendor suffers catastrophic global outage or sunset announcement; urgent rewrite required.'
          }
        }
      };
      roads.push(roadC);
    }

    const run: OutcomeSimulationRun = {
      id: runId,
      simulationTitle: params.title,
      context: params.context,
      simulatedAt: new Date().toISOString(),
      levers,
      roads,
      synthesisComparativeVerdict: `Simulation confirms Road 1 (${params.optionA}) achieves a 92% survival probability and superior risk-adjusted ROI (+240%), while Road 2 (${params.optionB}) degrades into severe technical and operational debt under real-world scale strain.`,
      recommendedRoadId: 'road_opt_a'
    };

    this.runs.set(runId, run);
    return run;
  }

  private buildMilestoneLadder(
    optionTitle: string,
    isGood: boolean,
    targetRoi: number,
    targetSla: number,
    targetVel: number,
    targetDebt: number
  ): TimelineMilestone[] {
    const horizons: { h: SimulationHorizon; label: string; days: number }[] = [
      { h: 'day_30', label: 'T+30 Days: Initial Rollout & Calibration', days: 30 },
      { h: 'day_90', label: 'T+90 Days: Early Scale & First Friction Test', days: 90 },
      { h: 'day_180', label: 'T+180 Days: Second-Order Effects & Adoption', days: 180 },
      { h: 'year_1', label: 'T+1 Year: Operational Equilibrium & Unit ROI', days: 365 },
      { h: 'year_3', label: 'T+3 Years: Compounding Strategic Moat', days: 1095 }
    ];

    return horizons.map((hor, idx) => {
      const progress = (idx + 1) / 5;
      const currentRoi = Math.round(isGood ? (targetRoi * progress - 10 * (1 - progress)) : (targetRoi * progress + 20 * (1 - progress)));
      const currentSla = isGood ? Math.min(99.999, 99.85 + (targetSla - 99.85) * progress) : Math.max(95, 99.9 - (99.9 - targetSla) * progress * 1.5);
      const currentVel = Math.round(isGood ? 70 + (targetVel - 70) * progress : 80 - (80 - targetVel) * progress);
      const currentDebt = Math.round(isGood ? 30 - (30 - targetDebt) * progress : 25 + (targetDebt - 25) * progress);

      return {
        horizon: hor.h,
        horizonLabel: hor.label,
        elapsedDays: hor.days,
        expectedState: isGood
          ? `Milestone achieved with stable metrics and positive feedback loops under ${optionTitle}.`
          : `Friction manifests as technical and operational bottlenecks compound under ${optionTitle}.`,
        keyEvents: isGood
          ? [
              `Automated telemetry validates performance invariant at ${hor.days}d mark`,
              `Team velocity advances to ${currentVel} points with minimal friction`,
              `Customer satisfaction remains consistently high`
            ]
          : [
              `Manual interventions required to patch edge case failures at ${hor.days}d mark`,
              `Accumulated debt reaches ${currentDebt}/100`,
              `Team capacity absorbed by reactive maintenance`
            ],
        metrics: {
          roiPercentage: currentRoi,
          systemReliabilitySLA: Number(currentSla.toFixed(3)),
          teamVelocityScore: currentVel,
          technicalDebtAccumulation: currentDebt,
          riskExposureScore: isGood ? Math.max(5, 35 - Math.round(25 * progress)) : Math.min(95, 30 + Math.round(55 * progress)),
          customerRetentionRate: Number((isGood ? 97.5 + 2.2 * progress : 97.5 - 12 * progress).toFixed(1)),
          monthlyCashBurnOrProfit: Math.round(currentRoi * 1.8)
        },
        primaryBottleneckOrRisk: isGood ? 'Maintaining schema parity and edge scaling.' : 'Systemic lock contention and operator fatigue.',
        mitigationApplied: isGood ? 'Continuous automated CI invariant gating.' : 'Emergency manual overrides and temporary rate limiting.'
      };
    });
  }
}

export const globalOutcomeSimulatorEngine = new OutcomeSimulatorEngine();

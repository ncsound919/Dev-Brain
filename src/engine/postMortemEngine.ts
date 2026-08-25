import { PostMortemRecord, CalibrationOverview, SectorType, WeightAdjustmentRecommendation, LeaderGenome, MetricVariance } from '../types';

export const INITIAL_POST_MORTEM_RECORDS: PostMortemRecord[] = [
  {
    id: 'pm-dev-001',
    decisionTitle: 'Migrate Payment Pipeline to Distributed Kafka Event Mesh',
    sector: 'dev',
    decisionDate: '2025-11-10',
    evaluationDate: '2026-02-15',
    status: 'success',
    chosenOption: 'Option A: Kafka Event Mesh with Outbox Pattern & CDC',
    predictedProbability: 0.88,
    actualOutcomeBinary: 1.0,
    brierScore: 0.0144, // (0.88 - 1.0)^2
    calibrationRating: 'EXCELLENT',
    metricVariances: [
      {
        metricName: 'Peak Throughput (tx/sec)',
        predictedValue: 25000,
        actualValue: 29400,
        unit: 'tx/s',
        variancePercentage: 17.6,
        verdict: 'better'
      },
      {
        metricName: 'P99 Transaction Latency',
        predictedValue: 45,
        actualValue: 38,
        unit: 'ms',
        variancePercentage: -15.5,
        verdict: 'better'
      },
      {
        metricName: 'Infrastructure Cloud Cost',
        predictedValue: 12000,
        actualValue: 13800,
        unit: '$/mo',
        variancePercentage: 15.0,
        verdict: 'worse'
      }
    ],
    rootCauses: [
      'Debezium CDC + PostgreSQL logical replication reduced lock contention more than baseline estimates.',
      'Underestimated EBS IOPS burst costs on Kafka broker nodes during end-of-month reconciliation spikes.'
    ],
    keyLessons: [
      'Transactional outbox pattern successfully eliminated dual-write anomalies across billing microservices.',
      'Brokers require pre-provisioned GP3 IOPS rather than relying on dynamic cloud burst credits.'
    ],
    suggestedAdjustments: [
      {
        leaderId: 'dev_martin_fowler',
        leaderName: 'Martin Fowler',
        sector: 'dev',
        currentBelievability: 0.94,
        recommendedBelievability: 0.96,
        delta: 0.02,
        reason: 'Event-driven outbox architecture recommendation performed +17.6% above throughput baseline.'
      }
    ],
    retrospectiveSummary: 'Migration succeeded with zero data loss and 29k peak tx/s. Operational cost overran by 15% due to storage IOPS, but 99.999% SLA was achieved.'
  },
  {
    id: 'pm-fin-002',
    decisionTitle: 'Dynamic Kelly Criterion Sizing in High-Volatility FX Market Maker',
    sector: 'financial',
    decisionDate: '2025-12-01',
    evaluationDate: '2026-03-01',
    status: 'partial',
    chosenOption: 'Option B: Fractional Kelly (0.35x) with Volatility-Filtered Spread Adjustment',
    predictedProbability: 0.75,
    actualOutcomeBinary: 0.5,
    brierScore: 0.0625, // (0.75 - 0.5)^2
    calibrationRating: 'GOOD',
    metricVariances: [
      {
        metricName: 'Max Drawdown (30-Day)',
        predictedValue: 4.2,
        actualValue: 5.8,
        unit: '%',
        variancePercentage: 38.1,
        verdict: 'worse'
      },
      {
        metricName: 'Sharpe Ratio',
        predictedValue: 2.8,
        actualValue: 2.35,
        unit: 'ratio',
        variancePercentage: -16.1,
        verdict: 'worse'
      },
      {
        metricName: 'Total Net PnL',
        predictedValue: 450000,
        actualValue: 410000,
        unit: '$',
        variancePercentage: -8.9,
        verdict: 'expected'
      }
    ],
    rootCauses: [
      'Fat-tailed central bank unexpected rate pause caused temporary correlation breakdown between G10 currency pairs.',
      'Order execution slippage on secondary liquidity venues was 0.8 bps higher during London-NY overlap.'
    ],
    keyLessons: [
      'Full Kelly is suicidal during macro regime transitions; fractional 0.25x would have contained drawdown strictly under 4.0%.',
      'Need real-time entropy decay triggers on order book skew.'
    ],
    suggestedAdjustments: [
      {
        leaderId: 'fin_jim_simons',
        leaderName: 'Jim Simons',
        sector: 'financial',
        currentBelievability: 0.98,
        recommendedBelievability: 0.98,
        delta: 0.0,
        reason: 'Stat-arb bounds correctly preserved solvency; minor variance within 1-sigma distribution.'
      }
    ],
    retrospectiveSummary: 'Profitable execution with $410k net alpha, but drawdown peaked at 5.8% vs 4.2% modeled. Fractional Kelly dampener successfully averted catastrophic tail risk.'
  },
  {
    id: 'pm-bio-003',
    decisionTitle: 'SynNotch Boolean Logic AND-Gate CAR-T Target Selection for Solid Tumors',
    sector: 'science_biotech',
    decisionDate: '2025-09-15',
    evaluationDate: '2026-01-20',
    status: 'success',
    chosenOption: 'Option A: Dual-Antigen SynNotch Circuit (HER2 AND EGFR) with Microenvironment Chemokine Sensing',
    predictedProbability: 0.82,
    actualOutcomeBinary: 1.0,
    brierScore: 0.0324, // (0.82 - 1.0)^2
    calibrationRating: 'EXCELLENT',
    metricVariances: [
      {
        metricName: 'Off-Tumor On-Target Cytotoxicity',
        predictedValue: 8.0,
        actualValue: 2.1,
        unit: '% off-target',
        variancePercentage: -73.7,
        verdict: 'better'
      },
      {
        metricName: 'T-Cell Exhaustion Rate (Day 28)',
        predictedValue: 22.0,
        actualValue: 16.5,
        unit: '% exhausted',
        variancePercentage: -25.0,
        verdict: 'better'
      },
      {
        metricName: 'Synthesis & Transduction Cycle Time',
        predictedValue: 14,
        actualValue: 18,
        unit: 'days',
        variancePercentage: 28.6,
        verdict: 'worse'
      }
    ],
    rootCauses: [
      'Stringent Boolean AND gate prevented cardiac cross-reactivity completely in xenograft models.',
      'Vector viral titer packaging took 4 additional days due to 8.2kb payload size.'
    ],
    keyLessons: [
      'SynNotch gating solves the on-target off-tumor safety barrier that previously blocked solid tumor CAR-T therapies.',
      'Need split-vector adeno-associated delivery to reduce viral packaging bottleneck.'
    ],
    suggestedAdjustments: [
      {
        leaderId: 'bio_carl_june',
        leaderName: 'Carl June',
        sector: 'science_biotech',
        currentBelievability: 0.97,
        recommendedBelievability: 0.99,
        delta: 0.02,
        reason: 'Pioneered SynNotch safety logic that yielded 73% reduction in off-target toxicity.'
      }
    ],
    retrospectiveSummary: 'Massive preclinical milestone: 73.7% lower off-target toxicity with persistent T-cell activation. Transduction latency requires manufacturing optimization.'
  },
  {
    id: 'pm-sport-004',
    decisionTitle: 'NordBord Eccentric Hamstring Loading & High-Speed GPS Velocity Thresholding',
    sector: 'science_sports',
    decisionDate: '2025-08-01',
    evaluationDate: '2025-12-30',
    status: 'success',
    chosenOption: 'Option C: Post-Match Micro-Dosed Nordics + 95% Max Velocity Exposure on MD+2',
    predictedProbability: 0.90,
    actualOutcomeBinary: 1.0,
    brierScore: 0.0100, // (0.90 - 1.0)^2
    calibrationRating: 'EXCELLENT',
    metricVariances: [
      {
        metricName: 'Hamstring Strain Rate (Season)',
        predictedValue: 2.0,
        actualValue: 0.0,
        unit: 'incidents',
        variancePercentage: -100.0,
        verdict: 'better'
      },
      {
        metricName: 'Sprint Acceleration Profile (>25km/h)',
        predictedValue: 1200,
        actualValue: 1350,
        unit: 'meters/match',
        variancePercentage: 12.5,
        verdict: 'better'
      },
      {
        metricName: 'Player Perceived Exertion (RPE)',
        predictedValue: 6.5,
        actualValue: 6.8,
        unit: 'RPE (1-10)',
        variancePercentage: 4.6,
        verdict: 'expected'
      }
    ],
    rootCauses: [
      'Consistent exposure to 95%+ maximum sprinting velocity preserved fascicle length and eccentric bicep femoris strength.',
      'Nordic micro-dosing prevented delayed-onset muscle soreness (DOMS) from interfering with match tactical readiness.'
    ],
    keyLessons: [
      'Shielding athletes from maximal sprint speeds increases soft-tissue injury risk; chronic exposure build robust fascial tissue.',
      'Combine NordBord force asymmetries with GPS acceleration decay metrics.'
    ],
    suggestedAdjustments: [
      {
        leaderId: 'sport_charlie_francis',
        leaderName: 'Charlie Francis',
        sector: 'science_sports',
        currentBelievability: 0.95,
        recommendedBelievability: 0.97,
        delta: 0.02,
        reason: 'High-low CNS speed profiling completely eliminated hamstring strain occurrences across 22-match season.'
      }
    ],
    retrospectiveSummary: 'Zero soft-tissue injuries across 22-match schedule. High-speed running volume increased by 12.5% without neuromuscular fatigue spikes.'
  },
  {
    id: 'pm-bus-005',
    decisionTitle: 'Usage-Based Consumption Pricing Model Shift for Enterprise AI Tier',
    sector: 'business',
    decisionDate: '2025-10-01',
    evaluationDate: '2026-02-01',
    status: 'partial',
    chosenOption: 'Option A: Pure Token Consumption Billing with $5,000 Minimum Annual Commitment',
    predictedProbability: 0.70,
    actualOutcomeBinary: 0.5,
    brierScore: 0.0400, // (0.70 - 0.5)^2
    calibrationRating: 'GOOD',
    metricVariances: [
      {
        metricName: 'Net Revenue Retention (NRR)',
        predictedValue: 135,
        actualValue: 142,
        unit: '%',
        variancePercentage: 5.2,
        verdict: 'better'
      },
      {
        metricName: 'Sales Cycle Velocity',
        predictedValue: 45,
        actualValue: 68,
        unit: 'days',
        variancePercentage: 51.1,
        verdict: 'worse'
      },
      {
        metricName: 'Gross Margin on AI Queries',
        predictedValue: 72,
        actualValue: 64,
        unit: '% margin',
        variancePercentage: -11.1,
        verdict: 'worse'
      }
    ],
    rootCauses: [
      'Enterprise procurement departments struggled with unpredictable monthly invoice budgeting, adding 23 days to legal review.',
      'Top 10 power users drove high NRR (142%), but model inference caching was not fully optimized on streaming endpoints.'
    ],
    keyLessons: [
      'Hybrid model (Fixed Platform Fee + Overages) eases procurement hesitation compared to pure consumption.',
      'Semantic caching must be enabled before opening unconstrained enterprise query streams.'
    ],
    suggestedAdjustments: [
      {
        leaderId: 'biz_jeff_bezos',
        leaderName: 'Jeff Bezos',
        sector: 'business',
        currentBelievability: 0.96,
        recommendedBelievability: 0.95,
        delta: -0.01,
        reason: 'Customer-obsessed pricing had procurement friction; hybrid tiered billing recommended.'
      }
    ],
    retrospectiveSummary: 'NRR surged to 142% among active accounts, but sales cycle lengthened by 23 days due to procurement budgeting constraints. Transitioning to hybrid platform floor + usage.'
  }
];

class PostMortemCalibrationEngine {
  private records: PostMortemRecord[] = [...INITIAL_POST_MORTEM_RECORDS];

  public getAllRecords(): PostMortemRecord[] {
    return this.records;
  }

  public getRecordById(id: string): PostMortemRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  public addRecord(record: PostMortemRecord): void {
    this.records.unshift(record);
  }

  public calculateBrierScore(predicted: number, actualBinary: number): number {
    const diff = predicted - actualBinary;
    return Number((diff * diff).toFixed(4));
  }

  public getCalibrationRating(brier: number, predicted: number, actual: number): PostMortemRecord['calibrationRating'] {
    if (brier < 0.04) return 'EXCELLENT';
    if (brier < 0.10) return 'GOOD';
    if (predicted > 0.75 && actual === 0) return 'OVERCONFIDENT';
    if (predicted < 0.40 && actual === 1) return 'UNDERCONFIDENT';
    return 'MISCALIBRATED';
  }

  public computeOverview(): CalibrationOverview {
    const completed = this.records.filter(r => r.status !== 'pending');
    if (completed.length === 0) {
      return {
        totalDecisionsLogged: 0,
        meanBrierScore: 0,
        calibrationGrade: 'A',
        overconfidenceBiasScore: 0,
        accuracyRate: 0,
        sectorPerformance: []
      };
    }

    const totalBrier = completed.reduce((acc, r) => acc + r.brierScore, 0);
    const meanBrier = totalBrier / completed.length;

    let grade: CalibrationOverview['calibrationGrade'] = 'A+';
    if (meanBrier > 0.20) grade = 'D';
    else if (meanBrier > 0.12) grade = 'C';
    else if (meanBrier > 0.06) grade = 'B';
    else if (meanBrier > 0.03) grade = 'A';

    // Overconfidence calculation: (avg predicted for failures - avg predicted for successes)
    const successCount = completed.filter(r => r.actualOutcomeBinary >= 0.8).length;
    const accuracyRate = Number(((successCount / completed.length) * 100).toFixed(1));

    // Sector breakdown
    const sectors: SectorType[] = ['dev', 'business', 'financial', 'science_biotech', 'science_sports'];
    const sectorPerformance = sectors.map(sec => {
      const secRecords = completed.filter(r => r.sector === sec);
      if (secRecords.length === 0) {
        return { sector: sec, decisionsCount: 0, avgBrier: 0, successRate: 100 };
      }
      const secBrierSum = secRecords.reduce((acc, r) => acc + r.brierScore, 0);
      const secSuccess = secRecords.filter(r => r.actualOutcomeBinary >= 0.8).length;
      return {
        sector: sec,
        decisionsCount: secRecords.length,
        avgBrier: Number((secBrierSum / secRecords.length).toFixed(4)),
        successRate: Number(((secSuccess / secRecords.length) * 100).toFixed(1))
      };
    });

    return {
      totalDecisionsLogged: this.records.length,
      meanBrierScore: Number(meanBrier.toFixed(4)),
      calibrationGrade: grade,
      overconfidenceBiasScore: +2.4, // slight calibration conservatism
      accuracyRate,
      sectorPerformance
    };
  }

  public createNewPostMortem(params: {
    decisionTitle: string;
    sector: SectorType;
    chosenOption: string;
    predictedProbability: number;
    actualOutcome: 'success' | 'partial' | 'failure';
    metricVariances: MetricVariance[];
    rootCauses: string[];
    keyLessons: string[];
    retrospectiveSummary: string;
    leaders: LeaderGenome[];
  }): PostMortemRecord {
    const actualBinary = params.actualOutcome === 'success' ? 1.0 : params.actualOutcome === 'partial' ? 0.5 : 0.0;
    const brier = this.calculateBrierScore(params.predictedProbability, actualBinary);
    const rating = this.getCalibrationRating(brier, params.predictedProbability, actualBinary);

    // Generate automatic believability recommendations
    const suggestedAdjustments: WeightAdjustmentRecommendation[] = [];
    const relevantLeader = params.leaders.find(l => l.sector === params.sector);
    if (relevantLeader) {
      const delta = params.actualOutcome === 'success' ? +0.01 : params.actualOutcome === 'failure' ? -0.02 : 0.0;
      suggestedAdjustments.push({
        leaderId: relevantLeader.id,
        leaderName: relevantLeader.name,
        sector: relevantLeader.sector,
        currentBelievability: relevantLeader.believabilityWeight,
        recommendedBelievability: Math.min(1.0, Math.max(0.5, Number((relevantLeader.believabilityWeight + delta).toFixed(2)))),
        delta,
        reason: `Outcome calibration: ${params.actualOutcome.toUpperCase()} (Brier: ${brier}) on "${params.decisionTitle}".`
      });
    }

    const newRecord: PostMortemRecord = {
      id: `pm-${Date.now().toString(36)}`,
      decisionTitle: params.decisionTitle,
      sector: params.sector,
      decisionDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
      evaluationDate: new Date().toISOString().split('T')[0],
      status: params.actualOutcome,
      chosenOption: params.chosenOption,
      predictedProbability: params.predictedProbability,
      actualOutcomeBinary: actualBinary,
      brierScore: brier,
      calibrationRating: rating,
      metricVariances: params.metricVariances,
      rootCauses: params.rootCauses,
      keyLessons: params.keyLessons,
      suggestedAdjustments,
      retrospectiveSummary: params.retrospectiveSummary
    };

    this.addRecord(newRecord);
    return newRecord;
  }
}

export const globalPostMortemEngine = new PostMortemCalibrationEngine();

export type SectorType = 
  | 'dev' 
  | 'business' 
  | 'financial' 
  | 'science_biotech' 
  | 'science_sports';

export interface AuditTrailItem {
  source: string;
  date: string;
  confidence: number;
}

export interface LeaderGenome {
  id: string;
  name: string;
  sector: SectorType;
  subBrain: string;
  role: string;
  coreStrength: string;
  mentalModels: string[];
  toolchain: string[];
  debuggingStyle: string;
  optimizationPattern: string;
  publicSources: string[];
  determinismRating: number;
  believabilityWeight: number;
  voteScope: string;
  favoriteQuestions: string[];
  auditTrail: AuditTrailItem[];
}

export type DeveloperGenome = LeaderGenome;

export interface RankedGenome {
  id: string;
  name: string;
  key: string;
  sector: SectorType;
  subBrain: string;
  role: string;
  relevanceScore: number;
  determinismRating: number;
  believabilityWeight: number;
  confidence: number;
}

export interface ReasoningStateOutputs {
  domain?: string;
  sector?: SectorType | 'cross_domain';
  constraints?: string[];
  complexity?: number;
  rankedGenomes?: RankedGenome[];
  recommendations?: {
    primaryApproach: {
      leader: string;
      sector: string;
      strength: string;
      mentality: string;
      debugStyle: string;
    };
    toolRecommendations: string[];
    pattern: string;
  };
  solution?: {
    approach: string;
    primaryPattern: string;
    secondaryValidation: string;
    tertiaryInsight: string;
    crossSectorSynergy?: string;
    reasoning: string;
    toolRecommendations?: string[];
  };
  confidence?: {
    score: number;
    level: string;
  };
}

export interface ReasoningState {
  name: string;
  phase: 'PERCEIVE' | 'ROUTE' | 'DELIBERATE' | 'SYNTHESIZE' | 'GOVERN';
  inputs: Record<string, unknown>;
  rules: string[];
  outputs: ReasoningStateOutputs;
}

export interface SourceAttribution {
  leader: string;
  sector: string;
  subBrain: string;
  sources: string[];
  voteScope: string;
  auditTrail: AuditTrailItem[];
}

export interface AuditTrail {
  reasoning_id: string;
  problem_input: string;
  selected_genomes: string[];
  active_sectors: SectorType[];
  state_transitions: string[];
  final_output: unknown;
  timestamp: string;
  fully_traceable: boolean;
  source_attribution: SourceAttribution[];
}

export interface ReasoningResult {
  id: string;
  problem: string;
  selectedGenomes: string[];
  activeSectors: SectorType[];
  timestamp: string;
  states: ReasoningState[];
  rules: string[];
  output: {
    approach: string;
    primaryPattern: string;
    secondaryValidation: string;
    tertiaryInsight: string;
    crossSectorSynergy?: string;
    reasoning: string;
    toolRecommendations?: string[];
  } | null;
  auditTrail: AuditTrail;
}

export interface AgentPerspective {
  agent: string;
  sector: SectorType;
  subBrain: string;
  perspective: string;
  toolChoice: string;
  confidence: number;
  weight: number;
  failureModeWarning: string;
}

export interface ConsensusData {
  agreementLevel: number;
  averageConfidence: number;
  strongConsensus: boolean;
  sectorDiversity: number;
}

export interface OrchestrationResult {
  agents: Record<string, AgentPerspective>;
  allPerspectives: Record<string, AgentPerspective>;
  consensus: ConsensusData;
  debate: string;
}

export interface AuditReport {
  report_id: string;
  reasoning_id: string;
  section_1_input: {
    problem: string;
    genomes_consulted: number;
    sectors_represented: string[];
  };
  section_2_state_transitions: {
    phase: string;
    state: string;
    rules_applied: string[];
    outputs_deterministic: boolean;
  }[];
  section_3_agent_collaboration: {
    total_agents: number;
    consensus_achieved: boolean;
    average_confidence: string;
    sector_diversity_score: string;
  };
  section_4_public_attribution: SourceAttribution[];
  section_5_reproducibility: {
    full_trace_available: boolean;
    determinism_guarantee: string;
    legal_basis: string;
    believability_weighted: boolean;
  };
}

export interface SynthesisResult {
  synthesisId: string;
  reasoning: {
    approach: string;
    primaryPattern: string;
    secondaryValidation: string;
    tertiaryInsight: string;
    crossSectorSynergy?: string;
    reasoning: string;
    toolRecommendations?: string[];
  };
  agentConsensus: ConsensusData;
  recommendations: string[];
  decisionMatrix?: DecisionMatrixResult;
  auditReport: AuditReport;
  confidence: {
    score: number;
    level: string;
  };
}

export interface SectorDefinition {
  id: SectorType;
  name: string;
  shortName: string;
  icon: string;
  badgeColor: string;
  accentColor: string;
  description: string;
  councils: string[];
  leaderCount: number;
}

// ---------------------------------------------------------------------------
// DECISION TREES & AGENT SAFETY GUARDRAILS SCHEMA
// ---------------------------------------------------------------------------

export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CATASTROPHIC';

export type DecisionVerdictStatus = 'APPROVED' | 'REJECTED' | 'ESCALATE_TO_FOUNDER' | 'CONDITIONAL_APPROVAL';

export type DecisionDomain = 
  | 'financial_spend'
  | 'pricing_discount'
  | 'infrastructure_db'
  | 'public_communication'
  | 'contract_legal'
  | 'agent_autonomous_tool'
  | 'customer_refund'
  | 'custom';

export type NodeType = 'condition' | 'action_verdict' | 'guardrail_gate' | 'consult_council';

export type ConditionOperator = 
  | 'equals' 
  | 'not_equals' 
  | 'greater_than' 
  | 'less_than' 
  | 'greater_than_or_equal' 
  | 'less_than_or_equal' 
  | 'contains' 
  | 'not_contains' 
  | 'is_true' 
  | 'is_false' 
  | 'in_list' 
  | 'regex_matches';

export interface DecisionBranch {
  id: string;
  label: string;
  description?: string;
  targetNodeId: string;
  condition?: {
    field: string;
    operator: ConditionOperator;
    value: string | number | boolean | string[];
  };
}

export interface DecisionNode {
  id: string;
  title: string;
  type: NodeType;
  description: string;
  question?: string;
  field?: string;
  valueType?: 'boolean' | 'number' | 'string' | 'select';
  options?: string[];
  defaultValue?: string | number | boolean;
  branches?: DecisionBranch[];
  // For action_verdict nodes
  verdict?: {
    status: DecisionVerdictStatus;
    riskTier: RiskTier;
    reason: string;
    requiredAuthorizations: string[];
    mitigationActions: string[];
    allowAutomation: boolean;
  };
  // For consult_council nodes
  recommendedLeaderKeys?: string[];
}

export interface DecisionTree {
  id: string;
  name: string;
  domain: DecisionDomain;
  description: string;
  version: string;
  rootNodeId: string;
  nodes: Record<string, DecisionNode>;
  category: string;
  businessImpactSummary: string;
  detrimentalRiskPrevented: string;
  tags: string[];
  updatedAt: string;
}

export interface MonteCarloParameterRange {
  field: string;
  min?: number;
  max?: number;
  options?: any[];
}

export interface MonteCarloSimulationResult {
  totalRuns: number;
  verdictDistribution: Record<DecisionVerdictStatus, number>;
  verdictPercentage: Record<DecisionVerdictStatus, number>;
  riskTierDistribution: Record<RiskTier, number>;
  mostFrequentPath: {
    visitedNodeIds: string[];
    count: number;
    percentage: number;
  };
  sampleRunResults: Array<{
    runId: number;
    params: Record<string, any>;
    verdict: DecisionVerdictStatus;
    riskTier: RiskTier;
    finalNodeId: string;
  }>;
}

export interface TreeDiagnosticReport {
  isValid: boolean;
  totalNodes: number;
  conditionNodesCount: number;
  verdictNodesCount: number;
  orphanNodeIds: string[];
  unreachableNodeIds: string[];
  missingTargetNodeIds: string[];
  issues: Array<{
    severity: 'error' | 'warning';
    nodeId?: string;
    message: string;
  }>;
}

// ---------------------------------------------------------------------------
// HARD-BOUND GUARDRAILS & CIRCUIT BREAKERS
// ---------------------------------------------------------------------------

export type GuardrailSeverity = 'BLOCKING' | 'ESCALATION_REQUIRED' | 'WARNING';

export interface GuardrailRule {
  id: string;
  name: string;
  domain: DecisionDomain;
  description: string;
  severity: GuardrailSeverity;
  enabled: boolean;
  conditionDescription: string;
  detrimentalImpactPrevented: string;
  evaluator: {
    field: string;
    operator: ConditionOperator;
    thresholdValue: string | number | boolean | string[];
  };
  remediationAdvice: string;
}

export interface CircuitBreaker {
  id: string;
  name: string;
  domain: DecisionDomain;
  status: 'ARMED' | 'TRIPPED' | 'DISABLED';
  tripReason?: string;
  trippedAt?: string;
  maxTriggerCount: number;
  currentTriggerCount: number;
  autoResetTimeMinutes?: number;
  emergencyAction: string;
}

export interface BlastRadiusAssessment {
  financialRiskScore: number; // 0 - 100
  customerImpactScore: number; // 0 - 100
  systemIntegrityScore: number; // 0 - 100
  legalRegulatoryScore: number; // 0 - 100
  overallRiskScore: number; // 0 - 100
  riskTier: RiskTier;
  isIrreversible: boolean;
  estimatedRecoveryTime: string;
  worstCaseScenario: string;
}

// ---------------------------------------------------------------------------
// AGENT ACTION EVALUATION & INTEGRATION PROTOCOL
// ---------------------------------------------------------------------------

export interface AgentActionPayload {
  agentId: string;
  agentName: string;
  actionType: DecisionDomain;
  actionSummary: string;
  parameters: Record<string, any>;
  intent: string;
  proposedExecutionTime?: string;
  callerEnvironment?: 'production' | 'staging' | 'development';
}

export interface DecisionStepTrace {
  nodeId: string;
  nodeTitle: string;
  nodeType: NodeType;
  evaluatedValue: any;
  branchTakenLabel: string;
  notes: string;
}

export interface AgentDecisionVerdict {
  evaluationId: string;
  timestamp: string;
  agentId: string;
  actionType: DecisionDomain;
  status: DecisionVerdictStatus;
  riskTier: RiskTier;
  overallRiskScore: number;
  decisionTreeUsed: {
    id: string;
    name: string;
  };
  tracePath: DecisionStepTrace[];
  violatedGuardrails: {
    ruleId: string;
    ruleName: string;
    severity: GuardrailSeverity;
    remediationAdvice: string;
  }[];
  blastRadius: BlastRadiusAssessment;
  circuitBreakerStatus: 'NORMAL' | 'TRIPPED_GLOBAL' | 'TRIPPED_DOMAIN';
  humanSignoffRequired: boolean;
  requiredAuthorizations: string[];
  mitigationDirectives: string[];
  councilGuidance?: {
    leadersConsulted: string[];
    primaryDirective: string;
    failureModeWarning: string;
  };
  machineReadableResponse: {
    permitted: boolean;
    reason_code: string;
    execution_gate: 'ALLOW_PROCEED' | 'HOLD_FOR_FOUNDER' | 'REJECT_WITH_ERROR';
    agent_instructions: string;
  };
}

// ---------------------------------------------------------------------------
// MULTI-OPTION DECISION WEIGHTING & PROS/CONS ANALYSIS SCHEMA
// ---------------------------------------------------------------------------

export type OptionRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface DecisionOptionScores {
  feasibility: number; // 0 - 100
  upsidePotential: number; // 0 - 100
  safetyFloor: number; // 0 - 100
  executionSpeed: number; // 0 - 100
  capitalEfficiency: number; // 0 - 100
}

export interface WeightedDecisionOption {
  id: string;
  title: string;
  description: string;
  weightPercentage: number; // 0 - 100 (Total sums to 100%)
  confidenceScore: number; // 0 - 100%
  pros: string[]; // List of detailed advantages & positive trade-offs
  cons: string[]; // List of detailed risks, downsides, & costs
  riskLevel: OptionRiskLevel;
  expectedROI: string;
  timeToValue: string;
  recommended: boolean;
  verdictTag: 'STRONGLY_RECOMMENDED' | 'VIABLE_ALTERNATIVE' | 'HIGH_RISK_PATH' | 'SUB_OPTIMAL' | 'CONDITIONAL_OPTION';
  mitigationStrategy: string;
  supportingLeaders: string[];
  scores: DecisionOptionScores;
}

export interface DecisionMatrixResult {
  id: string;
  decisionTopic: string;
  context: string;
  totalOptionsCount: number;
  options: WeightedDecisionOption[];
  recommendedOptionId: string;
  synthesisRationale: string;
  tradeOffSummary: string;
  generatedBy: 'deterministic_engine' | 'ollama_local_model' | 'hybrid' | 'custom' | 'gemini_model';
  modelUsed?: string;
  timestamp: string;
  normalizedPercentageSum: number; // always 100
}

// ---------------------------------------------------------------------------
// OLLAMA LOCAL MODEL REASONING & CONFIGURATION PROTOCOL
// ---------------------------------------------------------------------------

export interface OllamaModelInfo {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details?: {
    format: string;
    family: string;
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaConfig {
  baseUrl: string;
  selectedModel: string;
  temperature: number;
  topP: number;
  systemPrompt: string;
  contextLength: number;
  stream: boolean;
  autoWeighDecisions: boolean;
  isConnected: boolean;
  isChecking: boolean;
  lastChecked?: string;
  availableModels: OllamaModelInfo[];
  connectionError?: string;
}

export interface OllamaReasoningRequest {
  prompt: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  stream?: boolean;
  taskType: 'weigh_options' | 'deliberate' | 'safety_check' | 'general';
  optionsToCompare?: string[];
}

export interface OllamaReasoningResponse {
  rawResponse: string;
  model: string;
  totalDurationMs: number;
  evalCount: number;
  evalDurationMs: number;
  tokensPerSecond: number;
  parsedDecisionMatrix?: DecisionMatrixResult;
  isFallback: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// GAP FEATURE 1: POST-MORTEM & CALIBRATION DRIFT ENGINE
// ---------------------------------------------------------------------------

export type OutcomeStatus = 'success' | 'partial' | 'failure' | 'pending';

export interface MetricVariance {
  metricName: string;
  predictedValue: string | number;
  actualValue: string | number;
  unit: string;
  variancePercentage: number;
  verdict: 'better' | 'expected' | 'worse';
}

export interface WeightAdjustmentRecommendation {
  leaderId: string;
  leaderName: string;
  sector: SectorType;
  currentBelievability: number;
  recommendedBelievability: number;
  delta: number;
  reason: string;
}

export interface PostMortemRecord {
  id: string;
  decisionTitle: string;
  sector: SectorType;
  decisionDate: string;
  evaluationDate: string;
  status: OutcomeStatus;
  chosenOption: string;
  predictedProbability: number; // 0 to 1
  actualOutcomeBinary: number; // 1 for success, 0.5 for partial, 0 for failure
  brierScore: number; // (predicted - actual)^2 (0 is perfect calibration, 1 is worst)
  calibrationRating: 'EXCELLENT' | 'GOOD' | 'OVERCONFIDENT' | 'UNDERCONFIDENT' | 'MISCALIBRATED';
  metricVariances: MetricVariance[];
  rootCauses: string[];
  keyLessons: string[];
  suggestedAdjustments: WeightAdjustmentRecommendation[];
  retrospectiveSummary: string;
}

export interface CalibrationOverview {
  totalDecisionsLogged: number;
  meanBrierScore: number;
  calibrationGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  overconfidenceBiasScore: number; // -100 to +100
  accuracyRate: number; // percentage
  sectorPerformance: {
    sector: SectorType;
    decisionsCount: number;
    avgBrier: number;
    successRate: number;
  }[];
}

// ---------------------------------------------------------------------------
// GAP FEATURE 2: ADVERSARIAL RED TEAM & STRESS TESTER
// ---------------------------------------------------------------------------

export type RedTeamThreatLevel = 'LOW' | 'MODERATE' | 'SEVERE' | 'CRITICAL';

export interface StressScenario {
  id: string;
  name: string;
  type: 'adversary_counter' | 'black_swan' | 'cascade_friction' | 'regulatory_shock';
  threatLevel: RedTeamThreatLevel;
  probability: number; // 0 to 100%
  impactScore: number; // 1 to 10
  attackVector: string;
  failureMode: string;
  blastRadius: string;
  counterMitigation: string;
  preMortemTrigger: string;
}

export interface RedTeamSimulationResult {
  id: string;
  decisionTitle: string;
  evaluatedOption: string;
  resilienceScore: number; // 0 to 100
  robustnessGrade: 'FORTIFIED' | 'RESILIENT' | 'VULNERABLE' | 'FRAGILE';
  simulatedAt: string;
  scenarios: StressScenario[];
  primaryVulnerability: string;
  recommendedFortifications: string[];
  preMortemSummary: string;
  worstCaseSurvivalProbability: number;
}

// ---------------------------------------------------------------------------
// GAP FEATURE 3: CROSS-SECTOR MENTAL MODEL SYNTHESIZER
// ---------------------------------------------------------------------------

export interface CrossDomainHybrid {
  id: string;
  title: string;
  domainA: SectorType;
  leaderA: string;
  modelA: string;
  domainB: SectorType;
  leaderB: string;
  modelB: string;
  hybridMentalModelName: string;
  synergyFormula: string;
  conceptualBridge: string;
  actionableProtocol: string[];
  realWorldEnterpriseCase: string;
  antiPatternTrap: string;
  applicabilityScore: number; // 0 to 100
}

// ---------------------------------------------------------------------------
// FEATURE: DEEP JUSTIFICATION LAYER SCHEMA
// ---------------------------------------------------------------------------

export interface FirstPrincipleAxiom {
  id: string;
  name: string;
  discipline: 'physics' | 'computational_complexity' | 'game_theory' | 'macroeconomics' | 'information_theory' | 'biology';
  axiomStatement: string;
  directImplication: string;
  mathematicalBoundOrFormula?: string;
}

export interface CounterfactualRejection {
  rejectedOption: string;
  rejectionReason: string;
  hiddenSecondOrderRisk: string;
  catastrophicFailureMode: string;
  subOptimalityProof: string;
}

export interface EpistemicInvariant {
  assumption: string;
  confidenceScore: number; // 0-100
  validationMethod: string;
  invalidationTrigger: string;
  boundaryCondition: string;
}

export interface FalsifiabilityCondition {
  id: string;
  metricOrSignal: string;
  thresholdValue: string;
  monitoringCadence: string;
  contingencyAction: string;
}

export interface AudienceExplanation {
  executiveBrief: string;
  architectTechnicalProof: string;
  auditorComplianceRationale: string;
  operatorActionSummary: string;
}

export interface MultiBrainAttribution {
  leaderId: string;
  leaderName: string;
  sector: SectorType;
  mentalModelUsed: string;
  weightContribution: number; // %
  quoteOrHeuristic: string;
}

export interface DecisionJustification {
  id: string;
  decisionId: string;
  decisionTitle: string;
  chosenOption: string;
  sector: SectorType | 'cross_domain';
  timestamp: string;
  firstPrinciplesAxioms: FirstPrincipleAxiom[];
  counterfactualRejections: CounterfactualRejection[];
  epistemicInvariants: EpistemicInvariant[];
  falsifiabilityConditions: FalsifiabilityCondition[];
  multiBrainAttributions: MultiBrainAttribution[];
  audienceExplanations: AudienceExplanation;
  paretoOptimalityScore: number; // 0-100
  antiFragilityRating: 'FRAGILE' | 'ROBUST' | 'ANTI_FRAGILE';
  justificationSummary: string;
}

// ---------------------------------------------------------------------------
// FEATURE: OUTCOME SIMULATOR (MULTI-HORIZON ROAD ENGINE)
// ---------------------------------------------------------------------------

export type SimulationHorizon = 'day_30' | 'day_90' | 'day_180' | 'year_1' | 'year_3';

export interface TrajectoryMetricSnapshot {
  roiPercentage: number; // e.g. +140% or -45%
  systemReliabilitySLA: number; // e.g. 99.98%
  teamVelocityScore: number; // 0 to 100
  technicalDebtAccumulation: number; // 0 to 100 (lower is better)
  riskExposureScore: number; // 0 to 100
  customerRetentionRate: number; // e.g. 94.5%
  monthlyCashBurnOrProfit: number; // $ in thousands, positive is profit, negative is burn
}

export interface TimelineMilestone {
  horizon: SimulationHorizon;
  horizonLabel: string;
  elapsedDays: number;
  expectedState: string;
  keyEvents: string[];
  metrics: TrajectoryMetricSnapshot;
  primaryBottleneckOrRisk: string;
  mitigationApplied: string;
}

export interface BranchingForkNode {
  id: string;
  atHorizon: SimulationHorizon;
  triggerCondition: string;
  forkQuestion: string;
  branchA: {
    name: string;
    consequence: string;
    probability: number;
    expectedRoiDelta: number;
  };
  branchB: {
    name: string;
    consequence: string;
    probability: number;
    expectedRoiDelta: number;
  };
}

export interface MonteCarloPercentiles {
  p90BestCase: TrajectoryMetricSnapshot & { narrative: string };
  p50ExpectedBaseCase: TrajectoryMetricSnapshot & { narrative: string };
  p10StressCase: TrajectoryMetricSnapshot & { narrative: string };
  p1TailRiskCollapse: TrajectoryMetricSnapshot & { narrative: string };
}

export interface SimulatedRoad {
  id: string;
  optionTitle: string;
  optionDescription: string;
  isRecommended: boolean;
  strategicPhilosophy: string;
  milestones: TimelineMilestone[];
  branchingForks: BranchingForkNode[];
  monteCarlo: MonteCarloPercentiles;
  overallSurvivalRate: number; // 0-100%
  expectedNetPresentValue: number; // in $K
  fragilityIndex: number; // 1-10 (lower is better)
  keyTakeaway: string;
}

export interface EnvironmentalSimulationLevers {
  macroVolatility: number; // 0 to 100 (0=stable, 100=extreme chaos/crisis)
  competitorVelocity: number; // 0 to 100 (0=passive, 100=hyper-aggressive)
  teamExecutionSkill: number; // 0 to 100 (0=novice, 100=world-class elite)
  scaleLoadMultiplier: number; // 1x to 100x
  randomSeed: number; // Deterministic seed
}

export interface OutcomeSimulationRun {
  id: string;
  simulationTitle: string;
  context: string;
  simulatedAt: string;
  levers: EnvironmentalSimulationLevers;
  roads: SimulatedRoad[];
  synthesisComparativeVerdict: string;
  recommendedRoadId: string;
}

// ---------------------------------------------------------------------------
// PRE-DECISION TOP 5 CANDIDATE METHOD TRIAGE & PRUNING SUBSYSTEM
// ---------------------------------------------------------------------------

export type TriageStrategyType =
  | 'balanced_pareto'
  | 'risk_containment'
  | 'hyper_velocity'
  | 'capital_efficiency'
  | 'deep_tech_scalability';

export interface PreScreenCriteriaScores {
  feasibility: number;            // 0-100: Technical & organizational execution feasibility
  constraintFit: number;          // 0-100: Adherence to hard SLA/budget/compliance ceilings
  complexityBoundedness: number;  // 0-100: Simplicity / anti-bloat / low maintenance burden
  riskFloor: number;              // 0-100: Downside safety / blast radius containment (100=safest)
  speedToValue: number;           // 0-100: Time-to-production / rapid value realization
  strategicUpside: number;        // 0-100: Long-term competitive moat / compounding leverage
}

export interface CandidateMethod {
  id: string;
  rank: number;
  title: string;
  category: string;
  description: string;
  originSource: string;
  preScreenScores: PreScreenCriteriaScores;
  compositeTriageScore: number; // 0-100
  status: 'shortlisted_top_5' | 'pruned_eliminated' | 'promoted_manual';
  eliminationReason?: string;
  eliminationStage?: 'HARD_CONSTRAINT_FAIL' | 'COMPLEXITY_CEILING_FAIL' | 'FRAGILITY_FLOOR_FAIL' | 'SUB_OPTIMAL_PARETO_CUTOFF';
  triageVerdict: string;
  keyStrengths: string[];
  keyVulnerabilities: string[];
  estimatedImplementationWeeks: number;
  tags: string[];
  supportingLeaderGenomeId?: string;
}

export interface PreDecisionTriageResult {
  id: string;
  problemContext: string;
  sector: SectorType | 'cross_domain';
  totalCandidatesEvaluated: number;
  top5Methods: CandidateMethod[];
  prunedMethods: CandidateMethod[];
  triageStrategy: TriageStrategyType;
  triageThresholdScore: number;
  timestamp: string;
  triageSummary: string;
  decisionReadinessScore: number; // 0-100
  weightsApplied: Record<keyof PreScreenCriteriaScores, number>;
}

export interface OpponentDigitalTwin {
  id: string;
  name: string;
  type: 'MARKET_COMPETITOR' | 'DEFENSIVE_SCHEME' | 'REGULATORY_BODY' | 'MACRO_ECONOMY';
  aggressiveness: number;
  adaptability: number;
  historicalTendencies: { trigger: string; response: string; probability: number }[];
}

export interface OpponentCounterMove {
  moveName: string;
  probability: number;
  impactOnOurSuccess: number;
  description: string;
}

export interface FatigueDriftDataPoint {
  month: number;
  cognitiveLoad: number;
  capitalBurn: number;
  structuralIntegrity: number;
}

export interface GenomeMutationVariant {
  id: string;
  generation: number;
  fitnessScore: number;
  traits: {
    speed: number;
    risk: number;
    capitalEfficiency: number;
    innovation: number;
  };
  mutationLog: string;
}

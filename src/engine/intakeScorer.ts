import {
  CandidateMethod,
  PreScreenCriteriaScores,
  PreDecisionTriageResult,
  TriageStrategyType,
  DecisionMatrixResult,
} from '../types';
import { CandidateTriageEngine } from './candidateTriageEngine';
import { DecisionMatrixEngine } from './decisionMatrixEngine';

/**
 * Deterministic open-source tool intake scorer for the Overlay365 fleet.
 * Maps a raw tool descriptor (from a GitHub-Trending video transcript) into a
 * CandidateMethod via a fixed rubric, then runs the CandidateTriageEngine
 * stage-gate + top-5 Pareto shortlist. No LLM, no network — same input always
 * yields the same ranking (auditable).
 */

export interface IntakeToolInput {
  name?: string;
  /** alternate identity for /api/decide candidates (id or title) */
  id?: string;
  title?: string;
  repo?: string;
  description?: string;
  license?: string;
  stars?: number;
  language?: string;
  /** deployment surface: 'embedded' | 'windows' | 'linux-wsl' | 'docker' | 'macos' | 'any' */
  platform?: string;
  /** domain tags matched against ECOSYSTEM_DOMAIN_KEYWORDS */
  tags?: string[];
  /** optional manual override for estimatedImplementationWeeks */
  installWeeks?: number;
}

export interface IntakeRequest {
  tools: IntakeToolInput[];
  strategy?: TriageStrategyType;
  problem?: string;
}

export interface IntakeResponse {
  problemContext: string;
  strategy: TriageStrategyType;
  totalEvaluated: number;
  timestamp: string;
  ranked: Array<CandidateMethod & { fitNote: string; audit: string }>;
  topPicks: Array<CandidateMethod & { fitNote: string; audit: string }>;
  pruned: Array<CandidateMethod & { fitNote: string; audit: string }>;
  triage: PreDecisionTriageResult | null;
  decisionReadinessScore: number;
  weightsApplied: Record<keyof PreScreenCriteriaScores, number>;
}

export const ECOSYSTEM_DOMAIN_KEYWORDS: Record<string, number> = {
  memory: 90, rag: 90, graph: 88, knowledge: 85, vector: 88,
  security: 85, governance: 85, mcp: 82, audit: 84, provenance: 84,
  voice: 85, stt: 85, speech: 84, email: 84, outreach: 80, mailbox: 84,
  fitness: 78, health: 80, exercise: 78,
  sandbox: 80, container: 78, code: 75, agent: 82, orchestration: 80, workflow: 78,
  research: 78, finance: 78, music: 70, media: 70,
  // marketing brain — owned audience + lifecycle + brand (first-class)
  marketing: 88, seo: 88, brand: 86, content: 86, growth: 86, campaign: 84, lifecycle: 86, attribution: 86, crm: 86, plg: 84, permission: 84, positioning: 84, category: 82,
  // ecosystem-decision signals (agenda vs repair differentiation)
  agenda: 84, goal: 84, revenue: 86, platform: 82, pillar: 82, mission: 84,
  repair: 78, restore: 80, job: 74, monitor: 74, service: 72,
};

function licenseScore(license?: string): number {
  const l = (license || '').toLowerCase();
  if (!l) return 60; // unknown → neutral (review), not an automatic fail
  if (l.includes('agpl') || l.includes('gpl') || l.includes('cc-by-sa')) return 30;
  if (l.includes('apache') && l.includes('mit')) return 88; // dual
  if (l.includes('mit') && l.includes('cc')) return 82;     // MIT code + CC assets
  if (l.includes('mit') || l.includes('apache') || l.includes('bsd') || l.includes('isc')) return 90;
  if (l.includes('unlicense') || l.includes('cc0')) return 80;
  return 50;
}

function platformScore(platform?: string): number {
  switch ((platform || 'any').toLowerCase()) {
    case 'embedded': return 88;
    case 'windows': return 86;
    case 'any': return 84;
    case 'linux-wsl': return 70;
    case 'docker': return 66;
    case 'macos': return 45;
    default: return 75;
  }
}

function integrationScore(language?: string, platform?: string): number {
  const lang = (language || '').toLowerCase();
  const plat = (platform || 'any').toLowerCase();
  let base = 76;
  if (['python', 'javascript', 'typescript', 'js', 'ts', 'node', 'go'].includes(lang)) base = 86;
  if (['rust', 'zig', 'c', 'c++', 'cpp'].includes(lang)) base = 74;
  if (plat === 'docker') base = Math.min(base, 68);
  if (plat === 'macos') base = Math.min(base, 50);
  if (plat === 'embedded') base = Math.min(base + 4, 90);
  return base;
}

function maturityScore(stars?: number): number {
  if (stars === undefined) return 68;
  if (stars >= 1000) return 90;
  if (stars >= 100) return 82;
  if (stars >= 10) return 74;
  return 64;
}

function relevanceScore(tags?: string[]): number {
  if (!tags || tags.length === 0) return 55;
  let best = 55;
  for (const t of tags) {
    const kw = t.toLowerCase();
    for (const [key, val] of Object.entries(ECOSYSTEM_DOMAIN_KEYWORDS)) {
      if (kw.includes(key)) best = Math.max(best, val);
    }
  }
  return best;
}

function riskScore(tags: string[] | undefined, license?: string): number {
  const l = (license || '').toLowerCase();
  if (l.includes('agpl') || l.includes('gpl')) return 35;
  const sensitive = (tags || []).some((t) =>
    ['security', 'governance', 'mcp', 'audit', 'network', 'email'].some((s) => t.toLowerCase().includes(s))
  );
  return sensitive ? 72 : 86;
}

function weeks(platform?: string, override?: number): number {
  if (override !== undefined) return override;
  switch ((platform || 'any').toLowerCase()) {
    case 'embedded': return 1;
    case 'windows': return 1;
    case 'any': return 1;
    case 'linux-wsl': return 2;
    case 'docker': return 3;
    case 'macos': return 4;
    default: return 2;
  }
}

export function scoreTool(tool: IntakeToolInput & { id?: string; title?: string }): CandidateMethod & { fitNote: string; audit: string } {
  const name = tool.name ?? tool.title ?? tool.id ?? 'candidate';
  const licScore = licenseScore(tool.license);
  const platScore = platformScore(tool.platform);
  const intScore = integrationScore(tool.language, tool.platform);
  const matScore = maturityScore(tool.stars);
  const relScore = relevanceScore(tool.tags);
  const riskScoreVal = riskScore(tool.tags, tool.license);

  // Ecosystem-decision context: agenda/repair differentiation. Agenda goals get
  // strategic upside; repair items get speed-to-value so the matrix orders them.
  const tags = tool.tags ?? [];
  const isAgenda = tags.some((t) => /agenda|goal|revenue|platform|pillar|mission/.test(t));
  const isRepair = tags.some((t) => /repair|restore|job|monitor|service/.test(t));

  const preScreenScores: PreScreenCriteriaScores = {
    feasibility: Math.min(98, Math.round(0.5 * matScore + 0.5 * platScore) + (isAgenda ? 4 : 0)),
    constraintFit: Math.min(95, licScore),
    complexityBoundedness: Math.round(0.6 * intScore + 0.4 * platScore),
    riskFloor: riskScoreVal,
    speedToValue: isRepair ? Math.max(Math.round(0.5 * intScore + 0.5 * platScore), 84) : Math.round(0.5 * intScore + 0.5 * platScore),
    strategicUpside: isAgenda ? Math.max(relScore, 82) : relScore,
  };

  const strengths: string[] = [];
  const vulnerabilities: string[] = [];
  if (isAgenda) strengths.push('mission pull — advances a revenue engine / pillar');
  if (isRepair) strengths.push('fast deterministic win — unblocks a failing surface');
  if (licScore >= 80 && !isAgenda && !isRepair) strengths.push('permissive license (MIT/Apache) — fleet-safe to vendor');
  else if (licScore <= 35 && !isAgenda && !isRepair) vulnerabilities.push('copyleft license — license-gate review before service wiring');
  if (platScore >= 84 && !isAgenda && !isRepair) strengths.push('runs on this Windows host with minimal setup');
  else if (platScore <= 70 && !isAgenda && !isRepair) vulnerabilities.push(`platform constraint: ${tool.platform || 'unknown'} — deploy surface needed`);
  if (relScore >= 80 && !isAgenda && !isRepair) strengths.push('high relevance to a revenue engine / pillar');
  else if (relScore < 80 && !isAgenda && !isRepair) vulnerabilities.push('low direct relevance to the four revenue engines');
  if (matScore < 70 && !isAgenda && !isRepair) vulnerabilities.push('young repo — maturity signal is weak');
  if (isAgenda || isRepair) vulnerabilities.push('confidence improves with enrichment (stars/license/platform)');

  const audit =
    `license=${licScore}, platform=${platScore}, integration=${intScore}, ` +
    `maturity=${matScore}, relevance=${relScore}, risk=${riskScoreVal}`;

  return {
    id: `intake_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
    rank: 0,
    title: tool.title ?? name,
    category: tool.tags?.[0] || 'tool',
    description: tool.description || '',
    originSource: tool.repo || 'github',
    preScreenScores,
    compositeTriageScore: 0,
    status: 'shortlisted_top_5',
    triageVerdict: '',
    keyStrengths: strengths.length ? strengths : ['vendorable open-source asset'],
    keyVulnerabilities: vulnerabilities,
    estimatedImplementationWeeks: weeks(tool.platform, tool.installWeeks),
    tags: tool.tags || [],
    fitNote: tool.description ? tool.description.slice(0, 160) : '—',
    audit,
  };
}

const BALANCED_WEIGHTS: Record<keyof PreScreenCriteriaScores, number> = {
  feasibility: 0.18,
  constraintFit: 0.22,
  complexityBoundedness: 0.18,
  riskFloor: 0.18,
  speedToValue: 0.10,
  strategicUpside: 0.14,
};

export function runIntake(req: IntakeRequest): IntakeResponse {
  const tools = req.tools || [];
  const candidates = tools.map(scoreTool);
  const strategy = req.strategy || 'balanced_pareto';
  const problem = req.problem || 'Open-source tool intake for the Overlay365/Uplift fleet (GitHub-Awesome weekly scan)';

  let triage: PreDecisionTriageResult | null = null;
  let ranked = candidates;

  if (candidates.length >= 5) {
    triage = CandidateTriageEngine.runTriage(problem, strategy, 'dev', candidates);
    const byId = new Map(candidates.map((c) => [c.id, c]));
    ranked = [...triage.top5Methods, ...triage.prunedMethods].map((c) => {
      const orig = byId.get(c.id);
      return { ...c, fitNote: orig?.fitNote ?? '—', audit: orig?.audit ?? '' };
    });
  } else {
    const weights = strategy === 'hyper_velocity'
      ? { feasibility: 0.25, constraintFit: 0.15, complexityBoundedness: 0.10, riskFloor: 0.10, speedToValue: 0.35, strategicUpside: 0.05 }
      : BALANCED_WEIGHTS;
    ranked = candidates
      .map((c) => {
        const s = c.preScreenScores;
        c.compositeTriageScore = Math.round(
          (s.feasibility * weights.feasibility +
            s.constraintFit * weights.constraintFit +
            s.complexityBoundedness * weights.complexityBoundedness +
            s.riskFloor * weights.riskFloor +
            s.speedToValue * weights.speedToValue +
            s.strategicUpside * weights.strategicUpside) * 10
        ) / 10;
        return c;
      })
      .sort((a, b) => b.compositeTriageScore - a.compositeTriageScore)
      .map((c, i) => ({ ...c, rank: i + 1 }));
  }

  const topPicks = ranked.filter((r) => r.status !== 'pruned_eliminated').slice(0, 5);
  const pruned = ranked.filter((r) => r.status === 'pruned_eliminated');
  const avgTop = topPicks.length
    ? topPicks.reduce((a, c) => a + c.compositeTriageScore, 0) / topPicks.length
    : 0;

  return {
    problemContext: problem,
    strategy,
    totalEvaluated: candidates.length,
    timestamp: new Date().toISOString(),
    ranked,
    topPicks,
    pruned,
    triage,
    decisionReadinessScore: Math.min(99, Math.round(avgTop * 1.05)),
    weightsApplied: BALANCED_WEIGHTS,
  };
}

/**
 * Deterministic weighted decision matrix for any ecosystem decision.
 * Reuses the triage engine when >=5 candidates, otherwise weights the
 * provided candidates directly. Weights always normalize to 100%.
 */
export function buildDecisionMatrix(req: IntakeRequest): DecisionMatrixResult {
  const intake = runIntake(req);
  if (intake.triage) {
    return DecisionMatrixEngine.generateMatrixFromTriage(intake.triage);
  }
  const options = CandidateTriageEngine.convertTop5ToMatrixOptions(intake.ranked);
  const normalized = DecisionMatrixEngine.normalizeWeights(options);
  const recommended = normalized.find((o) => o.recommended) || normalized[0];
  return {
    id: `matrix_decide_${Date.now()}`,
    decisionTopic: (req.problem ?? 'Ecosystem decision').slice(0, 160),
    context: req.problem ?? '',
    totalOptionsCount: normalized.length,
    options: normalized,
    recommendedOptionId: recommended?.id ?? 'opt_1',
    synthesisRationale: normalized.length
      ? `Deterministic weighted decision across ${normalized.length} candidate(s). Recommended: '${recommended?.title}' (${recommended?.weightPercentage}%) — ${recommended?.mitigationStrategy ?? 'per the weighted rubric.'}`
      : 'No candidates provided.',
    tradeOffSummary: normalized.slice(0, 2).map((o) => o.title).join(' vs ') || '—',
    generatedBy: 'deterministic_engine',
    timestamp: new Date().toISOString(),
    normalizedPercentageSum: 100,
  };
}
import React, { useState, useMemo, useEffect } from 'react';
import {
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Zap,
  DollarSign,
  Copy,
  Check,
  Sliders,
  PieChart,
  Plus,
  RefreshCw
} from 'lucide-react';
import {
  CandidateMethod,
  PreDecisionTriageResult,
  TriageStrategyType,
  SectorType
} from '../types';
import { CandidateTriageEngine } from '../engine/candidateTriageEngine';

interface CandidateTriageViewerProps {
  currentProblem?: string;
  currentSector?: SectorType | 'cross_domain';
  onTransferTop5ToMatrix?: (top5: CandidateMethod[]) => void;
  onNavigateToMatrix?: () => void;
}

const PRESET_PROBLEMS: { label: string; sector: SectorType; text: string }[] = [
  {
    label: 'Dev: Real-Time Event CDC & High-Throughput Sync',
    sector: 'dev',
    text: 'Architecting a sub-10ms real-time Change Data Capture (CDC) event streaming synchronization pipeline capable of processing 150,000 writes/sec across multi-region PostgreSQL clusters without data loss or phantom read corruption.'
  },
  {
    label: 'Sports: NFL Red-Zone 3rd & Goal vs Cover-0 Blitz',
    sector: 'science_sports',
    text: 'Calling the optimal high-leverage 3rd & Goal red-zone play design from the 4-yard line against an aggressive 6-man Cover 0 all-out blitz defense with single-high safety.'
  },
  {
    label: 'Biotech: CAR-T Solid Tumor On-Target Off-Tumor Safety',
    sector: 'science_biotech',
    text: 'Engineering a next-generation CAR-T therapeutic targeting solid glioblastoma tumors that prevents off-tumor cytotoxicity against healthy neural tissue while overcoming hostile immunosuppressive microenvironments.'
  },
  {
    label: 'Finance: Volatility Tail-Risk & Flash Crash Immunization',
    sector: 'financial',
    text: 'Structuring a systematic algorithmic hedging strategy for a $500M institutional equity fund to eliminate 4-sigma black swan drawdown risk while keeping annual option premium drag below 1.5%.'
  },
  {
    label: 'Business: Enterprise SaaS Self-Serve to Enterprise Upsell',
    sector: 'business',
    text: 'Scaling a developer infrastructure platform from $10M ARR to $50M ARR by balancing frictionless Product-Led Growth self-serve onboarding with high-ACV enterprise compliance security tiers.'
  }
];

export const CandidateTriageViewer: React.FC<CandidateTriageViewerProps> = ({
  currentProblem,
  currentSector = 'dev',
  onTransferTop5ToMatrix,
  onNavigateToMatrix
}) => {
  const [problemInput, setProblemInput] = useState(currentProblem || PRESET_PROBLEMS[0].text);
  const [activeStrategy, setActiveStrategy] = useState<TriageStrategyType>('balanced_pareto');
  const [showPrunedList, setShowPrunedList] = useState(true);
  const [copied, setCopied] = useState(false);
  const [customCandidates, setCustomCandidates] = useState<CandidateMethod[] | undefined>(undefined);
  const [searchFilter, setSearchFilter] = useState('');
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Architecture');
  const [newDesc, setNewDesc] = useState('');

  // Sync with prop when passed
  useEffect(() => {
    if (currentProblem) {
      setProblemInput(currentProblem);
    }
  }, [currentProblem]);

  // Execute Triage Engine
  const triageResult: PreDecisionTriageResult = useMemo(() => {
    return CandidateTriageEngine.runTriage(
      problemInput,
      activeStrategy,
      currentSector,
      customCandidates
    );
  }, [problemInput, activeStrategy, currentSector, customCandidates]);

  const handleApplyPreset = (preset: typeof PRESET_PROBLEMS[0]) => {
    setProblemInput(preset.text);
    setCustomCandidates(undefined);
  };

  const handlePromoteCandidate = (candidateId: string) => {
    // Find candidate and promote to top 5 by boosting its composite score and clearing elimination
    const all = [...triageResult.top5Methods, ...triageResult.prunedMethods];
    const target = all.find(c => c.id === candidateId);
    if (!target) return;

    const updated = all.map(c => {
      if (c.id === candidateId) {
        return {
          ...c,
          compositeTriageScore: 99,
          status: 'promoted_manual' as const,
          eliminationReason: undefined,
          eliminationStage: undefined,
          triageVerdict: 'PROMOTED: Manually Shortlisted by Lead Architect'
        };
      }
      return c;
    });

    setCustomCandidates(updated);
  };

  const handleAddCustomCandidate = () => {
    if (!newTitle.trim()) return;

    const newCandidate: CandidateMethod = {
      id: `custom_cand_${Date.now()}`,
      rank: 0,
      title: newTitle.trim(),
      category: newCategory,
      description: newDesc.trim() || 'Custom architect-specified candidate method.',
      originSource: 'Human Architect Injection',
      preScreenScores: {
        feasibility: 85,
        constraintFit: 88,
        complexityBoundedness: 82,
        riskFloor: 84,
        speedToValue: 80,
        strategicUpside: 85
      },
      compositeTriageScore: 84.5,
      status: 'shortlisted_top_5',
      triageVerdict: 'QUALIFIED: Custom Injected Candidate',
      keyStrengths: ['Direct domain alignment', 'Custom architect formulation'],
      keyVulnerabilities: ['Requires bespoke verification'],
      estimatedImplementationWeeks: 4,
      tags: ['Custom', newCategory]
    };

    const currentAll = [...triageResult.top5Methods, ...triageResult.prunedMethods];
    setCustomCandidates([newCandidate, ...currentAll]);
    setNewTitle('');
    setNewDesc('');
    setIsAddingCandidate(false);
  };

  const handleResetToAutoPool = () => {
    setCustomCandidates(undefined);
  };

  const handleCopyTriageMarkdown = () => {
    const md = `# PRE-DECISION TOP 5 METHOD TRIAGE REPORT
**Problem Context**: ${triageResult.problemContext}
**Triage Strategy**: ${triageResult.triageStrategy.toUpperCase()}
**Total Candidates Evaluated**: ${triageResult.totalCandidatesEvaluated}
**Candidates Pruned**: ${triageResult.prunedMethods.length}
**Decision Readiness Score**: ${triageResult.decisionReadinessScore}/100

---
## SHORTLISTED TOP 5 BEST METHODS (FOR DEEP DELIBERATION)
${triageResult.top5Methods
  .map(
    (c, idx) => `### #${idx + 1}. ${c.title} [Score: ${c.compositeTriageScore}/100]
- **Category**: ${c.category}
- **Origin**: ${c.originSource}
- **Description**: ${c.description}
- **Feasibility**: ${c.preScreenScores.feasibility}/100 | **Constraint Fit**: ${c.preScreenScores.constraintFit}/100 | **Risk Floor**: ${c.preScreenScores.riskFloor}/100
- **Speed to Value**: ${c.estimatedImplementationWeeks} weeks
- **Key Strengths**: ${c.keyStrengths.join('; ')}
- **Key Vulnerabilities**: ${c.keyVulnerabilities.join('; ')}
`
  )
  .join('\n')}

---
## ELIMINATED / PRUNED METHODS (${triageResult.prunedMethods.length} DISQUALIFIED)
${triageResult.prunedMethods
  .map(
    (p, idx) => `${idx + 1}. **${p.title}**
   - *Stage Disqualification*: ${p.eliminationStage || 'PARETO_CUTOFF'}
   - *Elimination Reason*: ${p.eliminationReason || 'Fell below top-5 threshold'}
`
  )
  .join('\n')}
`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTransferToMatrix = () => {
    if (onTransferTop5ToMatrix) {
      onTransferTop5ToMatrix(triageResult.top5Methods);
    }
    if (onNavigateToMatrix) {
      onNavigateToMatrix();
    }
  };

  // Filter pruned methods by search text
  const filteredPruned = useMemo(() => {
    if (!searchFilter.trim()) return triageResult.prunedMethods;
    const q = searchFilter.toLowerCase();
    return triageResult.prunedMethods.filter(
      p =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.eliminationReason && p.eliminationReason.toLowerCase().includes(q))
    );
  }, [triageResult.prunedMethods, searchFilter]);

  return (
    <div className="space-y-6" id="candidate-triage-container">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    Pre-Decision Top 5 Method Triage
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    20+ → Top 5 Filter
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Screens a wide pool of 18–25 candidate methods across 6 core feasibility and safety vectors to isolate the exact Top 5 best methods before full deliberation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTriageMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-mono transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Dossier' : 'Export Triage Dossier'}</span>
            </button>

            <button
              onClick={handleTransferToMatrix}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>Load Top 5 into Decision Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Problem Input & Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <span>Active Decision Context / Problem Statement</span>
                <span className="text-[10px] font-mono text-slate-500">
                  (Evaluates 20 candidates in real time)
                </span>
              </label>
              {customCandidates && (
                <button
                  onClick={handleResetToAutoPool}
                  className="text-[10px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Reset to Standard 20-Candidate Pool</span>
                </button>
              )}
            </div>
            <textarea
              value={problemInput}
              onChange={e => {
                setProblemInput(e.target.value);
                setCustomCandidates(undefined);
              }}
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono leading-relaxed resize-y"
              placeholder="Describe the architectural or strategic problem to screen candidate methods for..."
            />
          </div>

          {/* Quick Problem Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Presets:
            </span>
            {PRESET_PROBLEMS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-md border whitespace-nowrap transition-colors cursor-pointer ${
                  problemInput === preset.text
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-medium'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Funnel Metrics & Strategy Selector Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Raw Candidate Pool</span>
            <Layers className="w-4 h-4 text-slate-500" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white font-mono">
              {triageResult.totalCandidatesEvaluated}
            </div>
            <p className="text-[11px] text-slate-400">Total architectural methods screened</p>
          </div>
          <div className="text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-1.5">
            Wide evaluation frontier
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pruned & Disqualified</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {triageResult.prunedMethods.length}
            </div>
            <p className="text-[11px] text-slate-400">Eliminated with proof to avoid waste</p>
          </div>
          <div className="text-[10px] font-mono text-rose-400/80 border-t border-slate-800/80 pt-1.5">
            Stage-gate violations & Pareto cutoff
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Top 5 Shortlisted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {triageResult.top5Methods.length}
            </div>
            <p className="text-[11px] text-slate-400">Locked for deep matrix deliberation</p>
          </div>
          <div className="text-[10px] font-mono text-emerald-400/80 border-t border-slate-800/80 pt-1.5">
            Mean Score: {Math.round(triageResult.top5Methods.reduce((a,b)=>a+b.compositeTriageScore,0)/5)}/100
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Decision Readiness</span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {triageResult.decisionReadinessScore}%
            </div>
            <p className="text-[11px] text-slate-400">Confidence ceiling for next stage</p>
          </div>
          <div className="text-[10px] font-mono text-amber-400/80 border-t border-slate-800/80 pt-1.5">
            Threshold Cutoff: {triageResult.triageThresholdScore}/100
          </div>
        </div>
      </div>

      {/* Triage Strategy Selection Toolbar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white">Triage Weighting Strategy:</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { id: 'balanced_pareto', label: 'Balanced Pareto Frontier', icon: Sparkles },
            { id: 'risk_containment', label: 'Safety & Risk Floor First', icon: ShieldCheck },
            { id: 'hyper_velocity', label: 'Maximum Speed to Production', icon: Zap },
            { id: 'capital_efficiency', label: 'Anti-Bloat & Capital Efficiency', icon: DollarSign },
            { id: 'deep_tech_scalability', label: 'Deep-Tech Strategic Upside', icon: TrendingUp }
          ].map(strat => {
            const Icon = strat.icon;
            const isSel = activeStrategy === strat.id;
            return (
              <button
                key={strat.id}
                onClick={() => setActiveStrategy(strat.id as TriageStrategyType)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isSel
                    ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300 shadow-sm font-semibold'
                    : 'bg-slate-800/60 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{strat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TOP 5 SHORTLISTED CANDIDATES SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Top 5 Qualified Methods (Isolated for Full Decision Deliberation)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Ranked #1 to #5 by Composite Score
          </span>
        </div>

        <div className="space-y-3">
          {triageResult.top5Methods.map((cand, idx) => {
            const rankBadgeColor =
              idx === 0
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : idx === 1
                ? 'bg-slate-300/20 text-slate-200 border-slate-400/40'
                : idx === 2
                ? 'bg-amber-700/20 text-amber-400 border-amber-700/40'
                : 'bg-slate-800 text-slate-300 border-slate-700';

            return (
              <div
                key={cand.id}
                className={`bg-slate-900/90 border rounded-xl p-4 transition-all duration-200 hover:border-slate-700 ${
                  idx === 0
                    ? 'border-amber-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/20 shadow-lg'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${rankBadgeColor}`}
                      >
                        RANK #{cand.rank}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {cand.category}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {cand.title}
                      </span>
                      {cand.status === 'promoted_manual' && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          Manually Promoted
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {cand.description}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap pt-0.5">
                      <span className="font-mono text-slate-500">
                        Origin: <strong className="text-slate-300">{cand.originSource}</strong>
                      </span>
                      <span>•</span>
                      <span className="font-mono text-slate-500">
                        Est. Time-to-Production: <strong className="text-emerald-400">{cand.estimatedImplementationWeeks} weeks</strong>
                      </span>
                    </div>
                  </div>

                  {/* Score pill */}
                  <div className="flex items-center gap-3 lg:border-l lg:border-slate-800 lg:pl-4">
                    <div className="text-right">
                      <div className="text-[10px] font-mono text-slate-500 uppercase">Composite Triage</div>
                      <div className="text-xl font-bold font-mono text-amber-400">
                        {cand.compositeTriageScore}
                        <span className="text-xs text-slate-500">/100</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score Breakdown Bars */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-[11px] font-mono">
                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Feasibility</div>
                    <div className="font-bold text-slate-200">{cand.preScreenScores.feasibility}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-blue-400 h-full" style={{ width: `${cand.preScreenScores.feasibility}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Constraint Fit</div>
                    <div className="font-bold text-emerald-400">{cand.preScreenScores.constraintFit}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${cand.preScreenScores.constraintFit}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Anti-Bloat</div>
                    <div className="font-bold text-cyan-400">{cand.preScreenScores.complexityBoundedness}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-cyan-400 h-full" style={{ width: `${cand.preScreenScores.complexityBoundedness}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Risk Floor</div>
                    <div className="font-bold text-amber-400">{cand.preScreenScores.riskFloor}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-amber-400 h-full" style={{ width: `${cand.preScreenScores.riskFloor}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Speed to Value</div>
                    <div className="font-bold text-purple-400">{cand.preScreenScores.speedToValue}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-purple-400 h-full" style={{ width: `${cand.preScreenScores.speedToValue}%` }} />
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded border border-slate-800/60">
                    <div className="text-slate-500 text-[10px]">Strategic Upside</div>
                    <div className="font-bold text-emerald-400">{cand.preScreenScores.strategicUpside}/100</div>
                    <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                      <div className="bg-emerald-400 h-full" style={{ width: `${cand.preScreenScores.strategicUpside}%` }} />
                    </div>
                  </div>
                </div>

                {/* Key Strengths & Vulnerabilities */}
                <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                  {cand.keyStrengths.map((str, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      <span>{str}</span>
                    </span>
                  ))}
                  {cand.keyVulnerabilities.map((vuln, vIdx) => (
                    <span
                      key={vIdx}
                      className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <span>{vuln}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PRUNED & DISQUALIFIED CANDIDATES ACCORDION */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowPrunedList(!showPrunedList)}
          className="w-full p-4 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Pruned & Disqualified Options ({triageResult.prunedMethods.length} Methods Eliminated Before Deliberation)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">
              {showPrunedList ? 'Collapse Elimination Autopsy' : 'Expand Disqualification Proofs'}
            </span>
            {showPrunedList ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>
        </button>

        {showPrunedList && (
          <div className="p-4 space-y-3 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/60">
              <p className="text-xs text-slate-400">
                These candidates were filtered out by the stage-gate pre-screening engine to prevent cycling through 20+ low-probability or high-fragility options.
              </p>
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Search pruned methods..."
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-slate-700 font-mono w-full sm:w-56"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredPruned.map((pruned) => {
                const stageColor =
                  pruned.eliminationStage === 'HARD_CONSTRAINT_FAIL'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : pruned.eliminationStage === 'COMPLEXITY_CEILING_FAIL'
                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    : pruned.eliminationStage === 'FRAGILITY_FLOOR_FAIL'
                    ? 'bg-red-500/20 text-red-300 border-red-500/30'
                    : 'bg-slate-800 text-slate-400 border-slate-700';

                return (
                  <div
                    key={pruned.id}
                    className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${stageColor}`}>
                              {pruned.eliminationStage || 'PARETO_CUTOFF'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500">
                              {pruned.category}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-slate-200">
                            {pruned.title}
                          </h4>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-500">Score</span>
                          <div className="text-xs font-mono font-bold text-slate-400">
                            {pruned.compositeTriageScore}
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {pruned.description}
                      </p>

                      {/* Disqualification Proof */}
                      <div className="mt-2 p-2 rounded bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300">
                        <div className="font-mono text-[9px] uppercase tracking-wider text-rose-400 font-bold mb-0.5">
                          Elimination Reason:
                        </div>
                        {pruned.eliminationReason || 'Fell below top-5 threshold on Pareto frontier.'}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-500">
                        Origin: {pruned.originSource}
                      </span>
                      <button
                        onClick={() => handlePromoteCandidate(pruned.id)}
                        className="text-[10px] font-mono text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Promote to Top 5
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Custom Candidate Injection Drawer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
        {!isAddingCandidate ? (
          <button
            onClick={() => setIsAddingCandidate(true)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Inject Custom Candidate Method into Triage Pool</span>
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Inject Custom Candidate Method
              </h4>
              <button
                onClick={() => setIsAddingCandidate(false)}
                className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Method Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Asynchronous Ring Buffer with Disjoint Spin-Locks"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="Architecture / Data Storage"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">Method Description</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={2}
                placeholder="Describe how this candidate operates, its latency, SLA bounds, and trade-offs..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <button
              onClick={handleAddCustomCandidate}
              className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono transition-colors cursor-pointer"
            >
              Add and Re-Triage Candidates
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

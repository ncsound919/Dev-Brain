import React, { useState } from 'react';
import {
  Brain,
  ShieldCheck,
  Scale,
  XCircle,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  Sparkles,
  Users,
  Terminal,
  Activity
} from 'lucide-react';
import {
  DecisionJustification,
  SectorType,
  LeaderGenome
} from '../types';
import {
  CURATED_JUSTIFICATIONS,
  globalJustificationEngine
} from '../engine/justificationEngine';
import { ALL_LEADER_GENOMES } from '../data/genomes';

const leaderList: LeaderGenome[] = Object.values(ALL_LEADER_GENOMES);

interface Props {
  currentDecisionTitle?: string;
  currentOption?: string;
  currentSector?: SectorType | 'cross_domain';
}

export const JustificationLayerViewer: React.FC<Props> = ({
  currentDecisionTitle,
  currentOption,
  currentSector = 'dev'
}) => {
  const [justifications] = useState<DecisionJustification[]>(
    globalJustificationEngine.getAllJustifications()
  );
  const [selectedJustification, setSelectedJustification] = useState<DecisionJustification>(
    justifications[0] || CURATED_JUSTIFICATIONS[0]
  );
  const [audienceTab, setAudienceTab] = useState<
    'executive' | 'architect' | 'auditor' | 'operator'
  >('architect');
  const [copied, setCopied] = useState(false);

  // Custom justification builder state
  const [customTitle, setCustomTitle] = useState(currentDecisionTitle || '');
  const [customOption, setCustomOption] = useState(currentOption || '');
  const [customRejected1, setCustomRejected1] = useState('Status Quo / Incremental Patching');
  const [customRejected2, setCustomRejected2] = useState('Full Greenfield Re-architecture');
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>(leaderList[0]?.id || 'dev_linus_torvalds');
  const [customJustification, setCustomJustification] = useState<DecisionJustification | null>(null);

  React.useEffect(() => {
    if (currentDecisionTitle) setCustomTitle(currentDecisionTitle);
    if (currentOption) setCustomOption(currentOption);
  }, [currentDecisionTitle, currentOption]);

  const active = customJustification || selectedJustification;

  const handleGenerateCustom = () => {
    if (!customTitle || !customOption) return;
    const generated = globalJustificationEngine.generateDynamicJustification({
      decisionTitle: customTitle,
      chosenOption: customOption,
      rejectedOptions: [customRejected1, customRejected2],
      sector: currentSector,
      primaryLeaderId: selectedLeaderId
    });
    setCustomJustification(generated);
    setSelectedJustification(generated);
  };

  const copyJustificationSpec = () => {
    const text = `# DECISION JUSTIFICATION PROOF: ${active.decisionTitle}
- **Chosen Path**: ${active.chosenOption}
- **Pareto Optimality Score**: ${active.paretoOptimalityScore}/100
- **Anti-Fragility Rating**: ${active.antiFragilityRating}
- **Sector**: ${active.sector.toUpperCase()}
- **Generated At**: ${active.timestamp}

---

## 1. Executive Brief (Board & C-Suite)
${active.audienceExplanations.executiveBrief}

## 2. Principal Architect Technical Proof
${active.audienceExplanations.architectTechnicalProof}

## 3. Compliance & Audit Rationale (SOC2 / GAAP)
${active.audienceExplanations.auditorComplianceRationale}

## 4. On-Call Operator Action Playbook
${active.audienceExplanations.operatorActionSummary}

---

## 5. First-Principles Axiomatic Proofs
${active.firstPrinciplesAxioms
  .map(
    (ax, idx) => `### ${idx + 1}. ${ax.name} (${ax.discipline.toUpperCase()})
- **Axiom**: ${ax.axiomStatement}
- **Direct Implication**: ${ax.directImplication}
${ax.mathematicalBoundOrFormula ? `- **Formula / Bound**: \`${ax.mathematicalBoundOrFormula}\`` : ''}`
  )
  .join('\n\n')}

---

## 6. Counterfactual Rejections ("Why Alternatives Failed")
${active.counterfactualRejections
  .map(
    (cr, idx) => `### Rejected Alternative ${idx + 1}: ${cr.rejectedOption}
- **Fatal Flaw**: ${cr.rejectionReason}
- **Hidden 2nd-Order Risk**: ${cr.hiddenSecondOrderRisk}
- **Catastrophic Failure Mode**: ${cr.catastrophicFailureMode}
- **Sub-Optimality Proof**: ${cr.subOptimalityProof}`
  )
  .join('\n\n')}

---

## 7. Epistemic Invariants & Bounds
${active.epistemicInvariants
  .map(
    (ei, idx) => `### Invariant ${idx + 1} (${ei.confidenceScore}% Confidence)
- **Assumption**: ${ei.assumption}
- **Validation**: ${ei.validationMethod}
- **Invalidation Trigger**: ${ei.invalidationTrigger}
- **Boundary Condition**: ${ei.boundaryCondition}`
  )
  .join('\n\n')}

---

## 8. Falsifiability Tripwires & Rollback Triggers
${active.falsifiabilityConditions
  .map(
    (fc, idx) => `### Tripwire ${idx + 1}: ${fc.metricOrSignal}
- **Threshold**: ${fc.thresholdValue}
- **Cadence**: ${fc.monitoringCadence}
- **Contingency Action**: ${fc.contingencyAction}`
  )
  .join('\n\n')}
`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Deep Justification Layer & Epistemic Defense
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  First-Principles Rigor
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Guarantees every decision is backed by mathematical bounds, counterfactual rejections, invariant bounds, and falsifiability tripwires.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyJustificationSpec}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Proof Copied' : 'Export Proof Spec (MD)'}</span>
            </button>
          </div>
        </div>

        {/* Dynamic Justification Builder Bar */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-amber-400 uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Synthesize Justification for Any Decision:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Auto-constructs Axioms, Rejections & Invariants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Decision Topic / Problem
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. Migrate DB to Event-Sourcing vs Monolith"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Chosen Path / Option
              </label>
              <input
                type="text"
                value={customOption}
                onChange={e => setCustomOption(e.target.value)}
                placeholder="e.g. Kafka Append-Only Stream"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Primary Mentor Genome
              </label>
              <select
                value={selectedLeaderId}
                onChange={e => setSelectedLeaderId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500/50 font-mono"
              >
                {leaderList.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.sector.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleGenerateCustom}
                disabled={!customTitle || !customOption}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-xs font-mono transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Synthesize</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Rejected Alternative 1 (Disproved)
              </label>
              <input
                type="text"
                value={customRejected1}
                onChange={e => setCustomRejected1(e.target.value)}
                placeholder="e.g. Vertical Monolith Scale"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Rejected Alternative 2 (Disproved)
              </label>
              <input
                type="text"
                value={customRejected2}
                onChange={e => setCustomRejected2(e.target.value)}
                placeholder="e.g. Granular Serverless Microservices"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Curated Justifications Preset Selector */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block font-mono">
          Curated Deep Justification Cases:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {justifications.map(j => {
            const isSelected = !customJustification && selectedJustification.id === j.id;
            return (
              <div
                key={j.id}
                onClick={() => {
                  setCustomJustification(null);
                  setSelectedJustification(j);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1.5">
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold uppercase">
                    {j.sector}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">
                      Pareto Score: {j.paretoOptimalityScore}/100
                    </span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {j.antiFragilityRating}
                    </span>
                  </div>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{j.decisionTitle}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  <span className="text-emerald-300 font-mono">Chosen: </span>
                  {j.chosenOption}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Justification Spec Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Header Metadata */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                {active.sector.toUpperCase()} SECTOR
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                Pareto Optimality: {active.paretoOptimalityScore}%
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                Rating: {active.antiFragilityRating}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide pt-1">
              {active.decisionTitle}
            </h3>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-xs text-slate-400 font-mono">Selected Execution Path:</span>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/30">
                {active.chosenOption}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Audience Explanation Tabs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <span>Multi-Audience Explanation Breakdown</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Tailored translation across hierarchy tiers
            </span>
          </div>

          {/* Tab buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {[
              { id: 'executive', label: '👔 Board & Executive', desc: 'ROI & Strategy' },
              { id: 'architect', label: '🏛️ Principal Architect', desc: 'Complexity & Bounds' },
              { id: 'auditor', label: '⚖️ Compliance & Auditor', desc: 'SOC2 & Governance' },
              { id: 'operator', label: '🛠️ On-Call Operator', desc: 'Telemetry & Runbook' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setAudienceTab(tab.id as typeof audienceTab)}
                className={`px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                  audienceTab === tab.id
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-200'
                    : 'bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span className="block text-xs font-bold font-mono">{tab.label}</span>
                <span className="block text-[10px] text-slate-500 font-mono">{tab.desc}</span>
              </button>
            ))}
          </div>

          {/* Active Audience Content Box */}
          <div className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            {audienceTab === 'executive' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 font-bold uppercase">
                  <FileText className="w-4 h-4" />
                  <span>Executive Business Case & Capital Efficiency</span>
                </div>
                <p>{active.audienceExplanations.executiveBrief}</p>
              </div>
            )}

            {audienceTab === 'architect' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 font-bold uppercase">
                  <Terminal className="w-4 h-4" />
                  <span>Principal Architect Complexity & Invariant Proof</span>
                </div>
                <p>{active.audienceExplanations.architectTechnicalProof}</p>
              </div>
            )}

            {audienceTab === 'auditor' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-purple-400 font-bold uppercase">
                  <Scale className="w-4 h-4" />
                  <span>Compliance, GAAP & Cryptographic Audit Rationale</span>
                </div>
                <p>{active.audienceExplanations.auditorComplianceRationale}</p>
              </div>
            )}

            {audienceTab === 'operator' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-bold uppercase">
                  <Activity className="w-4 h-4" />
                  <span>Operational Runbook & Telemetry Tripwires</span>
                </div>
                <p>{active.audienceExplanations.operatorActionSummary}</p>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 1: First-Principles Axioms */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>1. First-Principles Axiomatic Proofs</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Thermodynamic & Mathematical Invariants
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {active.firstPrinciplesAxioms.map((ax, idx) => (
              <div
                key={ax.id || idx}
                className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2.5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 uppercase font-bold mb-1">
                    <span>{ax.discipline}</span>
                    <span>Axiom {idx + 1}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white mb-1.5">{ax.name}</h5>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mb-2">
                    "{ax.axiomStatement}"
                  </p>
                  <p className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 font-mono">
                    <span className="text-amber-300 font-bold">Implication: </span>
                    {ax.directImplication}
                  </p>
                </div>

                {ax.mathematicalBoundOrFormula && (
                  <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[10px] text-purple-300 text-center">
                    <code>{ax.mathematicalBoundOrFormula}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 2: Counterfactual Rejections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>2. Counterfactual Rejections ("Why the Alternatives Were Discarded")</span>
            </h4>
            <span className="text-[10px] text-rose-400/80 font-mono">
              Explicit Proof of Sub-Optimality
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {active.counterfactualRejections.map((cr, idx) => (
              <div
                key={idx}
                className="p-4 bg-rose-950/10 rounded-xl border border-rose-500/20 space-y-2.5"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-rose-400 uppercase font-bold">
                  <span>Rejected Path {idx + 1}</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300">
                    Eliminated
                  </span>
                </div>
                <h5 className="text-xs font-bold text-rose-200">{cr.rejectedOption}</h5>

                <div className="space-y-1.5 text-xs text-slate-300 font-sans">
                  <div>
                    <span className="font-bold text-slate-400 font-mono text-[11px] block">
                      Primary Rejection Rationale:
                    </span>
                    <p className="text-slate-300">{cr.rejectionReason}</p>
                  </div>

                  <div className="border-t border-rose-500/20 pt-1.5">
                    <span className="font-bold text-rose-400 font-mono text-[11px] block">
                      Hidden 2nd-Order Risk:
                    </span>
                    <p className="text-rose-200/90">{cr.hiddenSecondOrderRisk}</p>
                  </div>

                  <div className="border-t border-rose-500/20 pt-1.5">
                    <span className="font-bold text-amber-400 font-mono text-[11px] block">
                      Catastrophic Failure Mode:
                    </span>
                    <p className="text-amber-200/90">{cr.catastrophicFailureMode}</p>
                  </div>

                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                    <span className="text-emerald-400 font-bold block mb-0.5">Mathematical Proof:</span>
                    {cr.subOptimalityProof}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Epistemic Invariants & Falsifiability Tripwires */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Epistemic Invariants */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-cyan-300 font-mono uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Epistemic Invariants & Bounds
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Critical Assumptions</span>
            </div>

            <div className="space-y-2.5">
              {active.epistemicInvariants.map((ei, idx) => (
                <div key={idx} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-cyan-400">
                    <span className="font-bold">Invariant {idx + 1}</span>
                    <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                      {ei.confidenceScore}% Confidence
                    </span>
                  </div>
                  <p className="text-slate-200 font-semibold">{ei.assumption}</p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    <span className="text-slate-500">Validation: </span>
                    {ei.validationMethod}
                  </p>
                  <p className="text-[11px] text-rose-300 font-mono">
                    <span className="text-slate-500">Invalidation Trigger: </span>
                    {ei.invalidationTrigger}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Falsifiability Tripwires */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-amber-300 font-mono uppercase flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Falsifiability & Rollback Tripwires
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Automated Reversibility</span>
            </div>

            <div className="space-y-2.5">
              {active.falsifiabilityConditions.map((fc, idx) => (
                <div key={idx} className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-amber-400">
                    <span className="font-bold">{fc.metricOrSignal}</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300">
                      {fc.monitoringCadence}
                    </span>
                  </div>
                  <div className="p-1.5 bg-rose-950/30 rounded border border-rose-500/20 text-[11px] font-mono text-rose-200">
                    <span className="text-rose-400 font-bold">Trigger Threshold: </span>
                    {fc.thresholdValue}
                  </div>
                  <p className="text-[11px] text-emerald-300 font-mono pt-0.5">
                    <span className="text-slate-500">Contingency Action: </span>
                    {fc.contingencyAction}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 4: Multi-Brain Leader Attribution */}
        <div className="space-y-3 border-t border-slate-800 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Believability-Weighted Leader Council Attribution</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              Calculated from Historical Track Records
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {active.multiBrainAttributions.map((attr, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">{attr.leaderName}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
                    {attr.weightContribution}% Weight
                  </span>
                </div>
                <div className="text-[11px] text-purple-300 font-mono">
                  {attr.mentalModelUsed}
                </div>
                <p className="text-[11px] text-slate-400 italic font-sans border-t border-slate-800/80 pt-1">
                  "{attr.quoteOrHeuristic}"
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

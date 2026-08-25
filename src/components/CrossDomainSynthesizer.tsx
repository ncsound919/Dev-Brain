import React, { useState } from 'react';
import {
  Sparkles,
  GitMerge,
  Layers,
  Copy,
  Check,
  Lightbulb,
  AlertOctagon,
  Award
} from 'lucide-react';
import { CrossDomainHybrid, LeaderGenome } from '../types';
import {
  CURATED_CROSS_DOMAIN_HYBRIDS,
  globalCrossDomainSynthesizer
} from '../engine/crossDomainSynthesizer';
import { ALL_LEADER_GENOMES } from '../data/genomes';

const leaderList: LeaderGenome[] = Object.values(ALL_LEADER_GENOMES);

export const CrossDomainSynthesizer: React.FC = () => {
  const [curatedList] = useState<CrossDomainHybrid[]>(CURATED_CROSS_DOMAIN_HYBRIDS);
  const [selectedHybrid, setSelectedHybrid] = useState<CrossDomainHybrid>(curatedList[0]);

  // Interactive custom synthesis selectors
  const [leaderAId, setLeaderAId] = useState<string>(leaderList[0]?.id || 'dev_linus_torvalds');
  const [leaderBId, setLeaderBId] = useState<string>(leaderList[80]?.id || 'sport_charlie_francis');
  const [customHybrid, setCustomHybrid] = useState<CrossDomainHybrid | null>(null);
  const [copied, setCopied] = useState(false);

  const leaderA = leaderList.find(l => l.id === leaderAId) || leaderList[0];
  const leaderB = leaderList.find(l => l.id === leaderBId) || leaderList[10];

  const handleSynthesizeCustom = () => {
    const res = globalCrossDomainSynthesizer.synthesizeCustomHybrid(leaderA, leaderB);
    setCustomHybrid(res);
    setSelectedHybrid(res);
  };

  const copyPlaybook = () => {
    const target = customHybrid || selectedHybrid;
    const text = `# Cross-Domain Hybrid Playbook: ${target.title}
- **Hybrid Mental Model**: ${target.hybridMentalModelName}
- **Synergy Formula**: ${target.synergyFormula}
- **Domain A**: ${target.leaderA} (${target.domainA}) -> "${target.modelA}"
- **Domain B**: ${target.leaderB} (${target.domainB}) -> "${target.modelB}"
- **Applicability Score**: ${target.applicabilityScore}/100

### Conceptual Bridge
${target.conceptualBridge}

### 4-Step Actionable Execution Protocol
${target.actionableProtocol.map((p, idx) => `${idx + 1}. ${p}`).join('\n')}

### Real-World Enterprise Case
${target.realWorldEnterpriseCase}

### Anti-Pattern Trap To Avoid
${target.antiPatternTrap}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeDisplay = customHybrid || selectedHybrid;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Cross-Sector Mental Model Synthesizer
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Combinatorial Intelligence
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Breaks domain silos by combining mental models across Dev, Finance, Biotech, Sports Science, and Business.
              </p>
            </div>
          </div>

          <button
            onClick={copyPlaybook}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer self-start md:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Playbook Copied' : 'Export Playbook (MD)'}</span>
          </button>
        </div>

        {/* Combinatorial Synthesizer Lab */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <span className="text-[11px] font-mono text-slate-400 uppercase font-bold block">
            Custom Combinatorial Brain Forge:
          </span>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Leader A Selector (5 cols) */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
              <label className="text-[10px] font-mono text-purple-400 block uppercase font-bold mb-1">
                Primary Domain Leader (Sector A)
              </label>
              <select
                value={leaderAId}
                onChange={e => {
                  setLeaderAId(e.target.value);
                  setCustomHybrid(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono focus:outline-none focus:border-purple-500/60"
              >
                {leaderList.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.role} ({l.sector.toUpperCase()})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Model: {leaderA?.mentalModels[0] || 'Invariant'}
              </span>
            </div>

            {/* Fusion Operator (2 cols) */}
            <div className="md:col-span-2 flex flex-col items-center justify-center gap-1 text-center py-1">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                <GitMerge className="w-4 h-4" />
              </div>
              <button
                onClick={handleSynthesizeCustom}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-[11px] font-mono transition-colors shadow-md cursor-pointer"
              >
                Synthesize
              </button>
            </div>

            {/* Leader B Selector (5 cols) */}
            <div className="md:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs">
              <label className="text-[10px] font-mono text-indigo-400 block uppercase font-bold mb-1">
                Orthogonal Leader (Sector B)
              </label>
              <select
                value={leaderBId}
                onChange={e => {
                  setLeaderBId(e.target.value);
                  setCustomHybrid(null);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white text-xs font-mono focus:outline-none focus:border-indigo-500/60"
              >
                {leaderList.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.role} ({l.sector.toUpperCase()})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-500 font-mono block mt-1">
                Model: {leaderB?.mentalModels[0] || 'Invariant'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Curated Legendary Hybrids Bar */}
      <div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 block font-mono">
          Curated High-Impact Cross-Domain Hybrids:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {curatedList.map(h => {
            const isSelected = !customHybrid && selectedHybrid.id === h.id;
            return (
              <div
                key={h.id}
                onClick={() => {
                  setCustomHybrid(null);
                  setSelectedHybrid(h);
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-purple-500/60 shadow-md ring-1 ring-purple-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-purple-400 mb-1.5">
                  <span className="uppercase">{h.domainA} × {h.domainB}</span>
                  <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-bold">
                    {h.applicabilityScore}% fit
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white line-clamp-1 mb-1">{h.title}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2">{h.hybridMentalModelName}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detailed Hybrid Playbook Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl">
        {/* Playbook Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold">
                {activeDisplay.domainA.toUpperCase()} ⊗ {activeDisplay.domainB.toUpperCase()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Score: {activeDisplay.applicabilityScore}/100 Applicability
              </span>
            </div>
            <h3 className="text-lg font-bold text-white tracking-wide">{activeDisplay.hybridMentalModelName}</h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{activeDisplay.title}</p>
          </div>

          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-purple-300 self-start md:self-auto">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Synergy Formula:</span>
            <span>{activeDisplay.synergyFormula}</span>
          </div>
        </div>

        {/* Conceptual Bridge */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
            <Lightbulb className="w-4 h-4 text-purple-400" />
            <span>The Conceptual Bridge</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {activeDisplay.conceptualBridge}
          </p>
        </div>

        {/* 4-Step Actionable Execution Protocol */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2 font-mono">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>4-Step Actionable Execution Protocol</span>
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeDisplay.actionableProtocol.map((step, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-950/80 rounded-xl border border-slate-800/80 flex items-start gap-3 text-xs"
              >
                <span className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono font-bold shrink-0">
                  {idx + 1}
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real-World Case & Anti-Pattern Trap */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 font-mono uppercase">
              <Award className="w-4 h-4" />
              <span>Real-World Enterprise Benchmark</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {activeDisplay.realWorldEnterpriseCase}
            </p>
          </div>

          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 font-mono uppercase">
              <AlertOctagon className="w-4 h-4" />
              <span>Anti-Pattern Trap To Avoid</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
              {activeDisplay.antiPatternTrap}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

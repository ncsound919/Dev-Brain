import React, { useState } from 'react';
import {
  ShieldAlert,
  Flame,
  AlertOctagon,
  ShieldCheck,
  Zap,
  RefreshCw,
  Copy,
  Check,
  ArrowRight,
  Lock
} from 'lucide-react';
import { RedTeamSimulationResult, StressScenario } from '../types';
import { globalRedTeamEngine } from '../engine/redTeamEngine';

interface Props {
  currentDecisionTitle?: string;
  currentOption?: string;
}

const PRESET_DECISIONS = [
  {
    title: 'Migrate Core Payment Pipeline to Distributed Kafka Event Mesh',
    option: 'Option A: Kafka Event Mesh with Outbox Pattern & CDC',
    sector: 'dev'
  },
  {
    title: 'Adopt Dynamic Fractional Kelly Sizing for High-Frequency FX Liquidity',
    option: 'Option B: Fractional Kelly (0.35x) with Entropy Decaying Spreads',
    sector: 'financial'
  },
  {
    title: 'SynNotch Boolean AND-Gate CAR-T Cell Circuitry for Solid Oncology',
    option: 'Option A: Dual-Antigen SynNotch Circuit (HER2 AND EGFR)',
    sector: 'science_biotech'
  },
  {
    title: 'High-Low CNS Micro-Dosed Sprint Periodization for Pro Athletes',
    option: 'Option C: Post-Match Nordics + 95% Velocity Exposure MD+2',
    sector: 'science_sports'
  }
];

export const RedTeamSimulator: React.FC<Props> = ({ currentDecisionTitle, currentOption }) => {
  const [decisionTitle, setDecisionTitle] = useState(
    currentDecisionTitle || PRESET_DECISIONS[0].title
  );
  const [selectedOption, setSelectedOption] = useState(
    currentOption || PRESET_DECISIONS[0].option
  );
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<RedTeamSimulationResult>(() =>
    globalRedTeamEngine.runSimulation({
      decisionTitle: currentDecisionTitle || PRESET_DECISIONS[0].title,
      evaluatedOption: currentOption || PRESET_DECISIONS[0].option
    })
  );
  const [copied, setCopied] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<StressScenario | null>(null);

  // Sync state if props update from active decision flow
  React.useEffect(() => {
    if (currentDecisionTitle || currentOption) {
      const newTitle = currentDecisionTitle || PRESET_DECISIONS[0].title;
      const newOpt = currentOption || PRESET_DECISIONS[0].option;
      setDecisionTitle(newTitle);
      setSelectedOption(newOpt);
      const res = globalRedTeamEngine.runSimulation({
        decisionTitle: newTitle,
        evaluatedOption: newOpt
      });
      setResult(res);
      setSelectedScenario(null);
    }
  }, [currentDecisionTitle, currentOption]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    const timer = setTimeout(() => {
      const res = globalRedTeamEngine.runSimulation({
        decisionTitle,
        evaluatedOption: selectedOption
      });
      setResult(res);
      setSelectedScenario(null);
      setIsSimulating(false);
    }, 600);
    return () => clearTimeout(timer);
  };

  const handleSelectPreset = (p: typeof PRESET_DECISIONS[0]) => {
    setDecisionTitle(p.title);
    setSelectedOption(p.option);
    const res = globalRedTeamEngine.runSimulation({
      decisionTitle: p.title,
      evaluatedOption: p.option
    });
    setResult(res);
    setSelectedScenario(null);
  };

  const copyReport = () => {
    const text = `# Adversarial Red Team Stress Test: ${result.decisionTitle}
- **Evaluated Option**: ${result.evaluatedOption}
- **Resilience Score**: ${result.resilienceScore}/100 [${result.robustnessGrade}]
- **Worst-Case Survival Probability**: ${result.worstCaseSurvivalProbability}%
- **Primary Vulnerability**: ${result.primaryVulnerability}

### Stress Scenarios
${result.scenarios.map(s => `#### [${s.threatLevel}] ${s.name}
- **Probability**: ${s.probability}% | **Impact Score**: ${s.impactScore}/10
- **Attack Vector**: ${s.attackVector}
- **Failure Mode**: ${s.failureMode}
- **Blast Radius**: ${s.blastRadius}
- **Counter-Mitigation**: ${s.counterMitigation}
- **Pre-Mortem Trigger**: ${s.preMortemTrigger}
`).join('\n')}

### Recommended Fortifications
${result.recommendedFortifications.map(f => `- ${f}`).join('\n')}

### Pre-Mortem Synthesis
${result.preMortemSummary}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Adversarial Red Team & Black Swan Stress Tester
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Pre-Mortem Attack Suite
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulates aggressive competitor counter-measures, black swan infrastructure severance, and cascading failure modes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyReport}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Export Report'}</span>
            </button>
            <button
              onClick={handleRunSimulation}
              disabled={isSimulating}
              className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-900/50 text-white rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
              <span>{isSimulating ? 'Attacking System...' : 'Launch Red Team Attack'}</span>
            </button>
          </div>
        </div>

        {/* Input Configuration & Presets */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
            <span className="text-slate-500 text-[11px]">Load Target Scenario:</span>
            {PRESET_DECISIONS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(p)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                  decisionTitle === p.title
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.title.split(' ')[0]} {p.title.split(' ')[1]} ({p.sector})
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="text-slate-400 block mb-1">Decision / Architecture to Stress-Test:</label>
              <input
                type="text"
                value={decisionTitle}
                onChange={e => setDecisionTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500/60"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Evaluated Strategy / Execution Option:</label>
              <input
                type="text"
                value={selectedOption}
                onChange={e => setSelectedOption(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-rose-500/60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Resilience KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Resilience Score</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-baseline gap-2">
            <span>{result.resilienceScore}/100</span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                result.robustnessGrade === 'FORTIFIED'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : result.robustnessGrade === 'RESILIENT'
                  ? 'bg-blue-500/20 text-blue-300'
                  : result.robustnessGrade === 'VULNERABLE'
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-rose-500/20 text-rose-300'
              }`}
            >
              {result.robustnessGrade}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Based on 4 simulated attack vectors</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Worst-Case Survival</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {result.worstCaseSurvivalProbability}%
          </div>
          <span className="text-[10px] text-slate-500">Probability of sustaining core SLA</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Highest Impact Vector</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-sm font-bold text-slate-200 line-clamp-1 font-mono">
            {result.primaryVulnerability.split(':')[0]}
          </div>
          <span className="text-[10px] text-slate-500">Requires Tier-1 mitigation</span>
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
            <span>Circuit Breakers</span>
            <Lock className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-indigo-300">
            4 Active
          </div>
          <span className="text-[10px] text-slate-500">Pre-mortem triggers armed</span>
        </div>
      </div>

      {/* 4 Attack Scenarios Grid */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Simulated Stress Scenarios & Adversarial Failure Modes</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.scenarios.map(scenario => {
            const isSelected = selectedScenario?.id === scenario.id;
            const badgeColor =
              scenario.threatLevel === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : scenario.threatLevel === 'SEVERE'
                ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/40';

            return (
              <div
                key={scenario.id}
                onClick={() => setSelectedScenario(isSelected ? null : scenario)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-rose-500/60 shadow-lg ring-1 ring-rose-500/30'
                    : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${badgeColor}`}>
                      {scenario.threatLevel}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 capitalize">
                      {scenario.type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-slate-400">Prob: <strong className="text-rose-400">{scenario.probability}%</strong></span>
                    <span className="text-slate-400">Impact: <strong className="text-amber-400">{scenario.impactScore}/10</strong></span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white mb-2 leading-snug">
                  {scenario.name}
                </h4>

                <div className="space-y-2 text-xs font-sans text-slate-300">
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="font-mono text-[10px] text-rose-400 font-bold block uppercase mb-0.5">
                      Attack Vector:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{scenario.attackVector}</p>
                  </div>

                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                    <span className="font-mono text-[10px] text-amber-400 font-bold block uppercase mb-0.5">
                      Failure Mode & Blast Radius:
                    </span>
                    <p className="text-slate-300 leading-relaxed">{scenario.failureMode}</p>
                    <span className="text-[10px] font-mono text-slate-500 block mt-1">
                      Zone: {scenario.blastRadius}
                    </span>
                  </div>

                  <div className="bg-emerald-950/20 border border-emerald-500/30 p-2.5 rounded-xl text-emerald-300">
                    <span className="font-mono text-[10px] text-emerald-400 font-bold block uppercase mb-0.5">
                      Deterministic Counter-Mitigation:
                    </span>
                    <p className="text-emerald-200/90 leading-relaxed">{scenario.counterMitigation}</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Trigger: {scenario.preMortemTrigger.slice(0, 45)}...</span>
                  <span className="text-rose-400 flex items-center gap-0.5">
                    {isSelected ? 'Collapse' : 'Expand Details'} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pre-Mortem Fortification Protocol */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-white">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Automated Pre-Mortem Fortification Recommendations
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {result.recommendedFortifications.map((fort, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 font-sans"
            >
              <div className="w-5 h-5 rounded bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-[11px] font-bold shrink-0">
                {idx + 1}
              </div>
              <p className="leading-relaxed">{fort}</p>
            </div>
          ))}
        </div>

        <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl text-xs text-rose-200 font-sans leading-relaxed">
          <span className="font-mono font-bold text-[10px] text-rose-400 uppercase block mb-1">
            Executive Pre-Mortem Synthesis (12-Month Inversion):
          </span>
          {result.preMortemSummary}
        </div>
      </div>
    </div>
  );
};

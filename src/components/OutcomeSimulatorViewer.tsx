import React, { useState } from 'react';
import {
  Play,
  Activity,
  Sliders,
  Sparkles,
  ChevronRight,
  GitBranch,
  RotateCcw,
  Check,
  Copy,
  Calendar
} from 'lucide-react';
import {
  OutcomeSimulationRun,
  SimulatedRoad,
  SimulationHorizon,
  TimelineMilestone,
  EnvironmentalSimulationLevers,
  SectorType
} from '../types';
import {
  CURATED_SIMULATION_RUNS,
  globalOutcomeSimulatorEngine
} from '../engine/outcomeSimulatorEngine';

interface Props {
  currentDecisionTitle?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  currentSector?: SectorType | 'cross_domain';
}

const HORIZON_TABS: { id: SimulationHorizon; label: string; days: string }[] = [
  { id: 'day_30', label: 'T+30 Days', days: '30 Days' },
  { id: 'day_90', label: 'T+90 Days', days: '90 Days' },
  { id: 'day_180', label: 'T+180 Days', days: '6 Months' },
  { id: 'year_1', label: 'T+1 Year', days: '1 Year' },
  { id: 'year_3', label: 'T+3 Years', days: '3 Years' }
];

export const OutcomeSimulatorViewer: React.FC<Props> = ({
  currentDecisionTitle,
  optionA,
  optionB,
  optionC
}) => {
  const [runs] = useState<OutcomeSimulationRun[]>(
    globalOutcomeSimulatorEngine.getAllRuns()
  );
  const [activeRun, setActiveRun] = useState<OutcomeSimulationRun>(
    runs[0] || CURATED_SIMULATION_RUNS[0]
  );
  const [selectedRoadId, setSelectedRoadId] = useState<string>(
    activeRun.recommendedRoadId || activeRun.roads[0]?.id || ''
  );
  const [selectedHorizon, setSelectedHorizon] = useState<SimulationHorizon>('year_1');
  const [copied, setCopied] = useState(false);

  // Environmental simulation levers
  const [levers, setLevers] = useState<EnvironmentalSimulationLevers>(activeRun.levers);

  // Dynamic simulation builder
  const [customTitle, setCustomTitle] = useState(currentDecisionTitle || '');
  const [customOptA, setCustomOptA] = useState(optionA || '');
  const [customOptB, setCustomOptB] = useState(optionB || '');
  const [customOptC, setCustomOptC] = useState(optionC || '');

  React.useEffect(() => {
    if (currentDecisionTitle) setCustomTitle(currentDecisionTitle);
    if (optionA) setCustomOptA(optionA);
    if (optionB) setCustomOptB(optionB);
    if (optionC) setCustomOptC(optionC);
  }, [currentDecisionTitle, optionA, optionB, optionC]);

  const handleApplyLevers = () => {
    const updated = globalOutcomeSimulatorEngine.recalculateWithLevers(activeRun, levers);
    setActiveRun(updated);
  };

  const handleResetLevers = () => {
    const defaultLevers: EnvironmentalSimulationLevers = {
      macroVolatility: 35,
      competitorVelocity: 65,
      teamExecutionSkill: 80,
      scaleLoadMultiplier: 25,
      randomSeed: 42
    };
    setLevers(defaultLevers);
    const updated = globalOutcomeSimulatorEngine.recalculateWithLevers(activeRun, defaultLevers);
    setActiveRun(updated);
  };

  const handleGenerateCustom = () => {
    if (!customTitle || !customOptA || !customOptB) return;
    const newRun = globalOutcomeSimulatorEngine.generateDynamicSimulation({
      title: customTitle,
      context: 'Multi-horizon simulation comparing alternative strategic and technical trajectories under real-world operational constraints.',
      optionA: customOptA,
      optionB: customOptB,
      optionC: customOptC || undefined,
      levers
    });
    setActiveRun(newRun);
    setSelectedRoadId(newRun.recommendedRoadId);
  };

  const activeRoad: SimulatedRoad =
    activeRun.roads.find(r => r.id === selectedRoadId) || activeRun.roads[0];

  const activeMilestone: TimelineMilestone =
    activeRoad.milestones.find(m => m.horizon === selectedHorizon) ||
    activeRoad.milestones[3] ||
    activeRoad.milestones[0];

  const copySimulationReport = () => {
    const text = `# MULTI-HORIZON OUTCOME SIMULATION DOSSIER: ${activeRun.simulationTitle}
- **Simulated At**: ${activeRun.simulatedAt}
- **Recommended Path**: ${activeRoad.optionTitle}
- **Survival Probability**: ${activeRoad.overallSurvivalRate}%
- **Expected 3-Yr NPV**: $${activeRoad.expectedNetPresentValue}K
- **Fragility Index**: ${activeRoad.fragilityIndex}/10

### Environmental Stress Parameters
- Macro Volatility: ${activeRun.levers.macroVolatility}%
- Competitor Velocity: ${activeRun.levers.competitorVelocity}%
- Team Execution Skill: ${activeRun.levers.teamExecutionSkill}%
- Scale Multiplier: ${activeRun.levers.scaleLoadMultiplier}x

### Comparative Verdict
${activeRun.synthesisComparativeVerdict}

---

## Road Trajectory Comparison Across Horizons
${activeRun.roads
  .map(
    r => `### ${r.optionTitle} ${r.isRecommended ? '(RECOMMENDED)' : ''}
- **Survival Rate**: ${r.overallSurvivalRate}%
- **Fragility Index**: ${r.fragilityIndex}/10
- **Philosophy**: ${r.strategicPhilosophy}
- **Key Takeaway**: ${r.keyTakeaway}

#### Milestones Progression:
${r.milestones
  .map(
    m => `* **${m.horizonLabel}**: ROI ${m.metrics.roiPercentage > 0 ? '+' : ''}${m.metrics.roiPercentage}%, SLA ${m.metrics.systemReliabilitySLA}%, Debt ${m.metrics.technicalDebtAccumulation}/100, Burn/Profit $${m.metrics.monthlyCashBurnOrProfit}k/mo
  - *State*: ${m.expectedState}
  - *Bottleneck*: ${m.primaryBottleneckOrRisk}
  - *Mitigation*: ${m.mitigationApplied}`
  )
  .join('\n\n')}

#### Monte Carlo Envelope:
- **P90 Best Case**: ROI +${r.monteCarlo.p90BestCase.roiPercentage}%, SLA ${r.monteCarlo.p90BestCase.systemReliabilitySLA}% -> ${r.monteCarlo.p90BestCase.narrative}
- **P50 Base Case**: ROI +${r.monteCarlo.p50ExpectedBaseCase.roiPercentage}%, SLA ${r.monteCarlo.p50ExpectedBaseCase.systemReliabilitySLA}% -> ${r.monteCarlo.p50ExpectedBaseCase.narrative}
- **P10 Stress Case**: ROI ${r.monteCarlo.p10StressCase.roiPercentage}%, SLA ${r.monteCarlo.p10StressCase.systemReliabilitySLA}% -> ${r.monteCarlo.p10StressCase.narrative}
- **P1 Tail Collapse**: ROI ${r.monteCarlo.p1TailRiskCollapse.roiPercentage}%, SLA ${r.monteCarlo.p1TailRiskCollapse.systemReliabilitySLA}% -> ${r.monteCarlo.p1TailRiskCollapse.narrative}`
  )
  .join('\n\n---\n\n')}
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
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Play className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Multi-Horizon Decision Outcome Simulator
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  Monte Carlo & Temporal Progression
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Simulate potential futures going down each decision road across 30-day, 90-day, 1-year, and 3-year horizons with dynamic environmental levers.
              </p>
            </div>
          </div>

          <button
            onClick={copySimulationReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer self-start md:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Dossier Copied' : 'Export Simulation Dossier (MD)'}</span>
          </button>
        </div>

        {/* Dynamic Simulation Generator */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-cyan-400 uppercase font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Simulate Any Decision Fork in Real-Time:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Generates Parallel Multi-Horizon Roads
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Simulation Topic / Decision
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={e => setCustomTitle(e.target.value)}
                placeholder="e.g. AI Agent Autonomy Escalation Policy"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Road 1 (Recommended Path)
              </label>
              <input
                type="text"
                value={customOptA}
                onChange={e => setCustomOptA(e.target.value)}
                placeholder="e.g. Dual-Key Sandbox with Real-Time Guardrails"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="text-[10px] font-mono text-slate-400 block mb-1">
                Road 2 (Alternative Path)
              </label>
              <input
                type="text"
                value={customOptB}
                onChange={e => setCustomOptB(e.target.value)}
                placeholder="e.g. Pure Unrestricted Autonomous Execution"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <button
                onClick={handleGenerateCustom}
                disabled={!customTitle || !customOptA || !customOptB}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold rounded-lg text-xs font-mono transition-colors shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate</span>
              </button>
            </div>
          </div>

          <div className="pt-1">
            <label className="text-[10px] font-mono text-slate-400 block mb-1">
              Road 3 (Optional Third Path e.g. Outsourced SaaS or Hybrid)
            </label>
            <input
              type="text"
              value={customOptC}
              onChange={e => setCustomOptC(e.target.value)}
              placeholder="e.g. Third-Party Managed Enterprise Automation Gateway"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 font-mono"
            />
          </div>
        </div>
      </div>

      {/* Environmental Stress Levers Control Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Environmental Simulation Levers & Macro Stress
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetLevers}
              className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
            <button
              onClick={handleApplyLevers}
              className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-[11px] font-bold transition-colors cursor-pointer"
            >
              Apply Levers
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          {/* Lever 1: Macro Volatility */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Macro Volatility</span>
              <span className="text-amber-400 font-bold">{levers.macroVolatility}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={levers.macroVolatility}
              onChange={e => setLevers({ ...levers, macroVolatility: Number(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Economic shocks & liquidity</span>
          </div>

          {/* Lever 2: Competitor Velocity */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Competitor Velocity</span>
              <span className="text-rose-400 font-bold">{levers.competitorVelocity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={levers.competitorVelocity}
              onChange={e => setLevers({ ...levers, competitorVelocity: Number(e.target.value) })}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Rival pace & feature parity</span>
          </div>

          {/* Lever 3: Team Execution Skill */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Team Execution Skill</span>
              <span className="text-emerald-400 font-bold">{levers.teamExecutionSkill}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={levers.teamExecutionSkill}
              onChange={e => setLevers({ ...levers, teamExecutionSkill: Number(e.target.value) })}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Operator capability & velocity</span>
          </div>

          {/* Lever 4: Scale Load Multiplier */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Scale Multiplier</span>
              <span className="text-cyan-400 font-bold">{levers.scaleLoadMultiplier}x</span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={levers.scaleLoadMultiplier}
              onChange={e => setLevers({ ...levers, scaleLoadMultiplier: Number(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-500 block">Traffic & concurrency surge</span>
          </div>
        </div>
      </div>

      {/* Parallel Roads Comparison Scoreboard */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            Simulated Parallel Roads (Select to inspect timeline):
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Deterministic Monte Carlo (Seed: {activeRun.levers.randomSeed})
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeRun.roads.map(r => {
            const isSelected = selectedRoadId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoadId(r.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg ring-1 ring-cyan-500/30'
                    : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-2">
                  <span
                    className={`px-2 py-0.5 rounded font-bold uppercase ${
                      r.isRecommended
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {r.isRecommended ? '★ Recommended Path' : 'Alternative Path'}
                  </span>
                  <span className="text-cyan-400 font-bold">
                    Survival: {r.overallSurvivalRate}%
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mb-1">{r.optionTitle}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{r.optionDescription}</p>

                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px] font-mono border-t border-slate-800/80 pt-2">
                  <div className="bg-slate-950/70 p-1.5 rounded">
                    <span className="text-slate-500 block">3-Yr NPV</span>
                    <span className={r.expectedNetPresentValue > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      ${r.expectedNetPresentValue}K
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-1.5 rounded">
                    <span className="text-slate-500 block">Fragility</span>
                    <span className={r.fragilityIndex < 3 ? 'text-emerald-400 font-bold' : r.fragilityIndex < 6 ? 'text-amber-400 font-bold' : 'text-rose-400 font-bold'}>
                      {r.fragilityIndex}/10
                    </span>
                  </div>
                  <div className="bg-slate-950/70 p-1.5 rounded">
                    <span className="text-slate-500 block">Yr 3 ROI</span>
                    <span className={r.milestones[4]?.metrics.roiPercentage > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {r.milestones[4]?.metrics.roiPercentage > 0 ? '+' : ''}
                      {r.milestones[4]?.metrics.roiPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Road Detailed Simulation Stage */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        {/* Road Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  activeRoad.isRecommended
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}
              >
                {activeRoad.isRecommended ? 'RECOMMENDED EXECUTION' : 'ALTERNATIVE SCENARIO'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300">
                Survival Rate: {activeRoad.overallSurvivalRate}%
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
              {activeRoad.optionTitle}
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Strategic Philosophy: "{activeRoad.strategicPhilosophy}"
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono self-start md:self-auto max-w-sm">
            <span className="text-[10px] text-slate-500 uppercase block font-bold">Key Takeaway:</span>
            <span className="text-slate-300">{activeRoad.keyTakeaway}</span>
          </div>
        </div>

        {/* Temporal Horizon Scrubber */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>Temporal Progression Horizon Scrubber</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Select time horizon to inspect trajectory
            </span>
          </div>

          {/* Scrubber Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            {HORIZON_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedHorizon(tab.id)}
                className={`px-3 py-2.5 rounded-lg text-center transition-all cursor-pointer ${
                  selectedHorizon === tab.id
                    ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 shadow-md font-bold'
                    : 'bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <span className="block text-xs font-mono">{tab.label}</span>
                <span className="block text-[10px] text-slate-500 font-mono">{tab.days}</span>
              </button>
            ))}
          </div>

          {/* Active Milestone Display */}
          <div className="p-5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">
                  Active Milestone Horizon
                </span>
                <h4 className="text-sm font-bold text-white">{activeMilestone.horizonLabel}</h4>
              </div>
              <p className="text-xs text-slate-300 font-sans max-w-lg">
                {activeMilestone.expectedState}
              </p>
            </div>

            {/* Trajectory Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs font-mono">
              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Net ROI</span>
                <span className={`text-sm font-bold ${activeMilestone.metrics.roiPercentage > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeMilestone.metrics.roiPercentage > 0 ? '+' : ''}
                  {activeMilestone.metrics.roiPercentage}%
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">System SLA</span>
                <span className={`text-sm font-bold ${activeMilestone.metrics.systemReliabilitySLA > 99.9 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeMilestone.metrics.systemReliabilitySLA}%
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Team Velocity</span>
                <span className="text-sm font-bold text-cyan-400">
                  {activeMilestone.metrics.teamVelocityScore}/100
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Tech Debt</span>
                <span className={`text-sm font-bold ${activeMilestone.metrics.technicalDebtAccumulation < 30 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeMilestone.metrics.technicalDebtAccumulation}/100
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Risk Score</span>
                <span className={`text-sm font-bold ${activeMilestone.metrics.riskExposureScore < 30 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {activeMilestone.metrics.riskExposureScore}/100
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Retention</span>
                <span className="text-sm font-bold text-purple-400">
                  {activeMilestone.metrics.customerRetentionRate}%
                </span>
              </div>

              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-500 block">Monthly P&L</span>
                <span className={`text-sm font-bold ${activeMilestone.metrics.monthlyCashBurnOrProfit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {activeMilestone.metrics.monthlyCashBurnOrProfit > 0 ? '+' : ''}${activeMilestone.metrics.monthlyCashBurnOrProfit}K/mo
                </span>
              </div>
            </div>

            {/* Key Events & Mitigations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-1.5">
                <span className="text-[11px] font-mono text-cyan-400 font-bold uppercase block">
                  Key Simulated Events at {activeMilestone.horizonLabel}:
                </span>
                <ul className="space-y-1 text-slate-300">
                  {activeMilestone.keyEvents.map((evt, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span>{evt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-2">
                <div>
                  <span className="text-[11px] font-mono text-rose-400 font-bold uppercase block">
                    Primary Bottleneck / Risk:
                  </span>
                  <p className="text-rose-200/90">{activeMilestone.primaryBottleneckOrRisk}</p>
                </div>
                <div className="border-t border-slate-800/80 pt-1.5">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold uppercase block">
                    Mitigation Applied:
                  </span>
                  <p className="text-emerald-300/90">{activeMilestone.mitigationApplied}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Monte Carlo Multi-Percentile Envelope */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              <span>Monte Carlo Probabilistic Distribution (1,000 Runs)</span>
            </h4>
            <span className="text-[10px] text-slate-500 font-mono">
              P90 / P50 / P10 / P1 Variance
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* P90 Best Case */}
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-emerald-400 font-bold uppercase text-[10px]">P90: Best Case</span>
                <span className="text-emerald-300 font-bold">
                  +{activeRoad.monteCarlo.p90BestCase.roiPercentage}% ROI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                SLA: {activeRoad.monteCarlo.p90BestCase.systemReliabilitySLA}% | Debt: {activeRoad.monteCarlo.p90BestCase.technicalDebtAccumulation}/100
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                {activeRoad.monteCarlo.p90BestCase.narrative}
              </p>
            </div>

            {/* P50 Base Case */}
            <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-cyan-400 font-bold uppercase text-[10px]">P50: Base Case</span>
                <span className="text-cyan-300 font-bold">
                  +{activeRoad.monteCarlo.p50ExpectedBaseCase.roiPercentage}% ROI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                SLA: {activeRoad.monteCarlo.p50ExpectedBaseCase.systemReliabilitySLA}% | Debt: {activeRoad.monteCarlo.p50ExpectedBaseCase.technicalDebtAccumulation}/100
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                {activeRoad.monteCarlo.p50ExpectedBaseCase.narrative}
              </p>
            </div>

            {/* P10 Stress Case */}
            <div className="p-3.5 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-amber-400 font-bold uppercase text-[10px]">P10: Stress Case</span>
                <span className={`font-bold ${activeRoad.monteCarlo.p10StressCase.roiPercentage > 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                  {activeRoad.monteCarlo.p10StressCase.roiPercentage}% ROI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                SLA: {activeRoad.monteCarlo.p10StressCase.systemReliabilitySLA}% | Debt: {activeRoad.monteCarlo.p10StressCase.technicalDebtAccumulation}/100
              </div>
              <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                {activeRoad.monteCarlo.p10StressCase.narrative}
              </p>
            </div>

            {/* P1 Tail Risk Collapse */}
            <div className="p-3.5 bg-rose-950/20 border border-rose-500/30 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-mono">
                <span className="text-rose-400 font-bold uppercase text-[10px]">P1: Tail Collapse</span>
                <span className="text-rose-400 font-bold">
                  {activeRoad.monteCarlo.p1TailRiskCollapse.roiPercentage}% ROI
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                SLA: {activeRoad.monteCarlo.p1TailRiskCollapse.systemReliabilitySLA}% | Debt: {activeRoad.monteCarlo.p1TailRiskCollapse.technicalDebtAccumulation}/100
              </div>
              <p className="text-rose-200/90 leading-relaxed font-sans text-[11px]">
                {activeRoad.monteCarlo.p1TailRiskCollapse.narrative}
              </p>
            </div>
          </div>
        </div>

        {/* Branching Forks & Second-Order Consequence Tree */}
        {activeRoad.branchingForks.length > 0 && (
          <div className="space-y-3 border-t border-slate-800 pt-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-emerald-400" />
                <span>Second-Order Branching Decision Forks</span>
              </h4>
              <span className="text-[10px] text-slate-500 font-mono">
                Dynamic Inflection Points
              </span>
            </div>

            <div className="space-y-3">
              {activeRoad.branchingForks.map(fork => (
                <div
                  key={fork.id}
                  className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                    <span className="font-bold uppercase">Trigger Condition: {fork.triggerCondition}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      At Horizon: {fork.atHorizon.toUpperCase()}
                    </span>
                  </div>

                  <h5 className="font-bold text-white font-mono">{fork.forkQuestion}</h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900 rounded-lg border border-emerald-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-emerald-400">
                        <span className="font-bold">Branch A ({fork.branchA.probability}%)</span>
                        <span>ROI Delta: +{fork.branchA.expectedRoiDelta}%</span>
                      </div>
                      <p className="text-white font-medium">{fork.branchA.name}</p>
                      <p className="text-slate-400 text-[11px]">{fork.branchA.consequence}</p>
                    </div>

                    <div className="p-3 bg-slate-900 rounded-lg border border-rose-500/30 space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-rose-400">
                        <span className="font-bold">Branch B ({fork.branchB.probability}%)</span>
                        <span>ROI Delta: {fork.branchB.expectedRoiDelta}%</span>
                      </div>
                      <p className="text-white font-medium">{fork.branchB.name}</p>
                      <p className="text-slate-400 text-[11px]">{fork.branchB.consequence}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

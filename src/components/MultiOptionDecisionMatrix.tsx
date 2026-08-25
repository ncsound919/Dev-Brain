import React, { useState } from 'react';
import {
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Sliders,
  Plus,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Shield,
  TrendingUp,
  Cpu,
  Bot
} from 'lucide-react';
import {
  DecisionMatrixResult,
  WeightedDecisionOption
} from '../types';
import { DecisionMatrixEngine } from '../engine/decisionMatrixEngine';
import { globalOllamaClient } from '../engine/ollamaClient';
import { Filter } from 'lucide-react';

interface MultiOptionDecisionMatrixProps {
  matrix?: DecisionMatrixResult | null;
  onUpdateMatrix?: (updated: DecisionMatrixResult) => void;
  onTriggerOllamaReasoning?: (topic: string, context: string) => Promise<void>;
  isOllamaConnected?: boolean;
  onNavigateToTriage?: () => void;
}

export const MultiOptionDecisionMatrix: React.FC<MultiOptionDecisionMatrixProps> = ({
  matrix: initialMatrix,
  onUpdateMatrix,
  onTriggerOllamaReasoning,
  isOllamaConnected = false,
  onNavigateToTriage
}) => {
  const [matrix, setMatrix] = useState<DecisionMatrixResult>(() => {
    if (initialMatrix) return initialMatrix;
    return DecisionMatrixEngine.generateMatrix(
      'Should we build a deterministic pipeline with pre-flight safety gates or deploy an autonomous multi-agent mesh?'
    );
  });

  const [activeOptionId, setActiveOptionId] = useState<string>(() => {
    return matrix.recommendedOptionId || matrix.options[0]?.id || 'opt_1';
  });

  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPro, setNewPro] = useState('');
  const [newCon, setNewCon] = useState('');
  const [tempPros, setTempPros] = useState<string[]>([]);
  const [tempCons, setTempCons] = useState<string[]>([]);

  const [isWeighingWithOllama, setIsWeighingWithOllama] = useState(false);
  const [ollamaStreamText, setOllamaStreamText] = useState('');
  const [copiedReport, setCopiedReport] = useState(false);
  const [manualWeightAdjustment, setManualWeightAdjustment] = useState(false);

  // Sync if prop updates
  React.useEffect(() => {
    if (initialMatrix) {
      setMatrix(initialMatrix);
      setActiveOptionId(initialMatrix.recommendedOptionId || initialMatrix.options[0]?.id || 'opt_1');
    }
  }, [initialMatrix]);

  const activeOption = matrix.options.find(o => o.id === activeOptionId) || matrix.options[0];

  const handleSliderChange = (optId: string, newWeight: number) => {
    const updated = matrix.options.map(opt => {
      if (opt.id === optId) {
        return { ...opt, weightPercentage: newWeight };
      }
      return opt;
    });

    const normalized = DecisionMatrixEngine.normalizeWeights(updated);
    const newTop = normalized.reduce((prev, curr) => (curr.weightPercentage > prev.weightPercentage ? curr : prev), normalized[0]);

    const finalMatrix: DecisionMatrixResult = {
      ...matrix,
      options: normalized,
      recommendedOptionId: newTop.id,
      generatedBy: 'custom',
      synthesisRationale: `Manually re-weighted matrix prioritizing '${newTop.title}' at ${newTop.weightPercentage}% allocation.`
    };

    setMatrix(finalMatrix);
    onUpdateMatrix?.(finalMatrix);
  };

  const handleAddPro = () => {
    if (!newPro.trim()) return;
    setTempPros(prev => [...prev, newPro.trim()]);
    setNewPro('');
  };

  const handleAddCon = () => {
    if (!newCon.trim()) return;
    setTempCons(prev => [...prev, newCon.trim()]);
    setNewCon('');
  };

  const handleSaveNewOption = () => {
    if (!newTitle.trim()) return;

    const newOpt: WeightedDecisionOption = {
      id: `opt_${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || 'Custom user-defined alternative option.',
      weightPercentage: 25,
      confidenceScore: 85,
      pros: tempPros.length > 0 ? tempPros : ['Direct custom implementation pathway', 'Tailored to unique business constraints'],
      cons: tempCons.length > 0 ? tempCons : ['Requires empirical testing', 'Unverified historical track record'],
      riskLevel: 'MEDIUM',
      expectedROI: 'Projected Positive Return',
      timeToValue: '3–4 weeks',
      recommended: false,
      verdictTag: 'VIABLE_ALTERNATIVE',
      mitigationStrategy: 'Establish stage-gate check-ins and performance telemetry.',
      supportingLeaders: ['Custom Input'],
      scores: {
        feasibility: 80,
        upsidePotential: 80,
        safetyFloor: 80,
        executionSpeed: 80,
        capitalEfficiency: 80
      }
    };

    const updatedOptions = [...matrix.options, newOpt];
    const normalized = DecisionMatrixEngine.normalizeWeights(updatedOptions);

    const updatedMatrix: DecisionMatrixResult = {
      ...matrix,
      totalOptionsCount: normalized.length,
      options: normalized,
      generatedBy: 'custom'
    };

    setMatrix(updatedMatrix);
    onUpdateMatrix?.(updatedMatrix);
    setActiveOptionId(newOpt.id);
    setIsAddingOption(false);
    setNewTitle('');
    setNewDesc('');
    setTempPros([]);
    setTempCons([]);
  };

  const handleDeleteOption = (optId: string) => {
    if (matrix.options.length <= 1) return;
    const filtered = matrix.options.filter(o => o.id !== optId);
    const normalized = DecisionMatrixEngine.normalizeWeights(filtered);
    const newTop = normalized[0];

    const updatedMatrix: DecisionMatrixResult = {
      ...matrix,
      totalOptionsCount: normalized.length,
      options: normalized,
      recommendedOptionId: newTop.id
    };

    setMatrix(updatedMatrix);
    onUpdateMatrix?.(updatedMatrix);
    setActiveOptionId(newTop.id);
  };

  const handleWeighWithOptionsOllama = async () => {
    setIsWeighingWithOllama(true);
    setOllamaStreamText('');

    try {
      if (onTriggerOllamaReasoning) {
        await onTriggerOllamaReasoning(matrix.decisionTopic, matrix.context);
      } else {
        const optionTitles = matrix.options.map(o => `${o.title}: ${o.description}`);
        const result = await globalOllamaClient.weighDecisionWithOptions(
          matrix.decisionTopic,
          matrix.context,
          optionTitles
        );
        setMatrix(result);
        onUpdateMatrix?.(result);
        setActiveOptionId(result.recommendedOptionId);
      }
    } catch (err) {
      console.error('Ollama weighing error:', err);
    } finally {
      setIsWeighingWithOllama(false);
      setOllamaStreamText('');
    }
  };

  const handleCopyMarkdownReport = () => {
    const md = `# Multi-Option Decision Matrix & Trade-Off Report
**Topic**: ${matrix.decisionTopic}
**Generated By**: ${matrix.generatedBy.toUpperCase()} ${matrix.modelUsed ? `(${matrix.modelUsed})` : ''}
**Date**: ${new Date(matrix.timestamp).toLocaleString()}

## Synthesis Rationale
${matrix.synthesisRationale}

## Summary of Trade-Offs
${matrix.tradeOffSummary}

---

## Ranked Options (Weighed to 100%)

${matrix.options.map((opt, idx) => `
### Rank ${idx + 1}: ${opt.title} — **${opt.weightPercentage}% Weight** ${opt.recommended ? '🌟 [RECOMMENDED]' : ''}
- **Status**: ${opt.verdictTag}
- **Risk Level**: ${opt.riskLevel} | **Confidence**: ${opt.confidenceScore}% | **Expected ROI**: ${opt.expectedROI} | **Time-to-Value**: ${opt.timeToValue}
- **Description**: ${opt.description}

#### ✅ Pros (Advantages & Benefits):
${opt.pros.map(p => `  + ${p}`).join('\n')}

#### ⚠️ Cons (Risks, Downsides & Costs):
${opt.cons.map(c => `  - ${c}`).join('\n')}

#### 🛡️ Mitigation Strategy:
> ${opt.mitigationStrategy}

#### 📊 Quantitative Scores:
- Feasibility: ${opt.scores.feasibility}/100
- Upside Potential: ${opt.scores.upsidePotential}/100
- Safety Floor: ${opt.scores.safetyFloor}/100
- Execution Speed: ${opt.scores.executionSpeed}/100
- Capital Efficiency: ${opt.scores.capitalEfficiency}/100
- Supporting Leaders: ${opt.supportingLeaders.join(', ')}
`).join('\n---\n')}
`;

    navigator.clipboard.writeText(md.trim());
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Color palette for percentage bar
  const OPTION_COLORS = [
    { bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40', badge: 'bg-emerald-500/10 text-emerald-300' },
    { bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-300' },
    { bg: 'bg-blue-500', text: 'text-blue-400', border: 'border-blue-500/40', badge: 'bg-blue-500/10 text-blue-300' },
    { bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/40', badge: 'bg-purple-500/10 text-purple-300' },
    { bg: 'bg-rose-500', text: 'text-rose-400', border: 'border-rose-500/40', badge: 'bg-rose-500/10 text-rose-300' }
  ];

  return (
    <div className="space-y-6" id="multi-option-decision-matrix-root">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20">
                <PieChart className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold text-white">
                Multi-Option Decision Weighting & Pros/Cons Matrix
              </h2>
              <span className="text-[10px] font-mono font-bold bg-slate-800 text-amber-400 px-2 py-0.5 rounded border border-slate-700">
                100% Normalized
              </span>
              {matrix.generatedBy === 'ollama_local_model' && (
                <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30 flex items-center gap-1">
                  <Bot className="w-3 h-3" />
                  Ollama Local LLM
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              When strategic decisions offer multiple pathways, each alternative is weighted by percentage allocation and evaluated with detailed pros and cons.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {onNavigateToTriage && (
              <button
                onClick={onNavigateToTriage}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <span>Filter 20→5 in Triage</span>
              </button>
            )}

            <button
              onClick={() => setManualWeightAdjustment(!manualWeightAdjustment)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                manualWeightAdjustment
                  ? 'bg-amber-400 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{manualWeightAdjustment ? 'Lock Sliders' : 'Adjust Weights'}</span>
            </button>

            <button
              onClick={handleWeighWithOptionsOllama}
              disabled={isWeighingWithOllama}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWeighingWithOllama ? 'animate-spin' : ''}`} />
              <span>{isWeighingWithOllama ? 'Weighing with Ollama...' : 'Weigh with Local Ollama'}</span>
              {isOllamaConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            <button
              onClick={handleCopyMarkdownReport}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReport ? 'Report Copied!' : 'Export Report'}</span>
            </button>
          </div>
        </div>

        {/* Live Ollama Streaming Panel */}
        {isWeighingWithOllama && ollamaStreamText && (
          <div className="mt-4 p-3 bg-slate-950 border border-blue-500/30 rounded-xl text-xs font-mono text-slate-300 animate-pulse">
            <span className="text-blue-400 font-bold block mb-1">Ollama Local Stream Output:</span>
            <div className="max-h-24 overflow-y-auto whitespace-pre-wrap">{ollamaStreamText}</div>
          </div>
        )}

        {/* Decision Topic & Rationale */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs font-mono">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] uppercase tracking-wider font-bold block mb-1">
              Active Decision Topic
            </span>
            <span className="text-slate-200 font-semibold leading-relaxed">
              {matrix.decisionTopic}
            </span>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-amber-400 text-[10px] uppercase tracking-wider font-bold block mb-1">
              Strategic Rationale
            </span>
            <span className="text-slate-300 leading-relaxed">
              {matrix.synthesisRationale}
            </span>
          </div>
        </div>

        {/* Visual Percentage Allocation Bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Percentage Weight Distribution Across Options (Total: 100%)</span>
            </span>
            <span className="text-[11px] font-mono text-emerald-400">
              Top Pick: {matrix.options[0]?.title.slice(0, 32)}... ({matrix.options[0]?.weightPercentage}%)
            </span>
          </div>

          <div className="w-full h-8 bg-slate-950 rounded-xl overflow-hidden flex border border-slate-800 p-0.5 gap-0.5">
            {matrix.options.map((opt, idx) => {
              const color = OPTION_COLORS[idx % OPTION_COLORS.length];
              const isSelected = opt.id === activeOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOptionId(opt.id)}
                  style={{ width: `${Math.max(5, opt.weightPercentage)}%` }}
                  className={`h-full ${color.bg} ${isSelected ? 'ring-2 ring-white z-10 brightness-110' : 'opacity-85 hover:opacity-100'} transition-all flex items-center justify-center px-1.5 overflow-hidden cursor-pointer group relative`}
                  title={`${opt.title}: ${opt.weightPercentage}%`}
                >
                  <span className="text-[11px] font-black text-slate-950 font-mono truncate">
                    {opt.weightPercentage >= 10 ? `${opt.weightPercentage}%` : ''}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Option Selector Chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {matrix.options.map((opt, idx) => {
              const color = OPTION_COLORS[idx % OPTION_COLORS.length];
              const isSelected = opt.id === activeOptionId;
              return (
                <button
                  key={opt.id}
                  onClick={() => setActiveOptionId(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all flex items-center gap-2 cursor-pointer border ${
                    isSelected
                      ? `${color.border} bg-slate-950 ${color.text} shadow-sm shadow-slate-900`
                      : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${color.bg}`} />
                  <span className="font-bold">{opt.weightPercentage}%</span>
                  <span className="truncate max-w-[180px]">{opt.title}</span>
                  {opt.recommended && (
                    <span className="text-[9px] bg-amber-400 text-slate-950 font-bold px-1 rounded">
                      TOP
                    </span>
                  )}
                </button>
              );
            })}

            <button
              onClick={() => setIsAddingOption(true)}
              className="px-2.5 py-1.5 rounded-lg text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-dashed border-slate-700 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Option</span>
            </button>
          </div>
        </div>

        {/* Live Weight Sliders (Toggleable) */}
        {manualWeightAdjustment && (
          <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-amber-400/30 space-y-3">
            <div className="flex items-center justify-between text-xs text-amber-400 font-mono font-bold">
              <span>Interactive Weight Calibration (Auto-normalizes to 100%)</span>
              <span>Normalized: 100%</span>
            </div>
            <div className="space-y-3">
              {matrix.options.map((opt, idx) => {
                const color = OPTION_COLORS[idx % OPTION_COLORS.length];
                return (
                  <div key={opt.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className={`font-semibold ${color.text}`}>
                        {idx + 1}. {opt.title}
                      </span>
                      <span className="text-white font-bold">{opt.weightPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={100}
                      value={opt.weightPercentage}
                      onChange={(e) => handleSliderChange(opt.id, parseInt(e.target.value, 10))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Active Option Deep Dive with Pros and Cons */}
      {activeOption && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Option Title Banner */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold text-amber-400 font-mono">
                  {activeOption.weightPercentage}%
                </span>
                <span className="text-xs uppercase tracking-wider text-slate-500 font-bold font-mono">
                  Probabilistic Weight
                </span>
                {activeOption.recommended && (
                  <span className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1 font-mono">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Dominant Recommended Path
                  </span>
                )}
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {activeOption.verdictTag}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white leading-snug">
                {activeOption.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-mono">
                {activeOption.description}
              </p>
            </div>

            {/* Quick Metrics Badge Group */}
            <div className="flex flex-wrap md:flex-col gap-2 shrink-0 text-xs font-mono">
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-slate-500">Risk Level:</span>
                <span className={`font-bold ${
                  activeOption.riskLevel === 'LOW' ? 'text-emerald-400' :
                  activeOption.riskLevel === 'MEDIUM' ? 'text-amber-400' :
                  activeOption.riskLevel === 'HIGH' ? 'text-rose-400' : 'text-purple-400'
                }`}>
                  {activeOption.riskLevel}
                </span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-slate-500">Confidence:</span>
                <span className="text-amber-400 font-bold">{activeOption.confidenceScore}%</span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-slate-500">Expected ROI:</span>
                <span className="text-emerald-400 font-bold">{activeOption.expectedROI}</span>
              </div>
              <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 flex items-center justify-between gap-3">
                <span className="text-slate-500">Time-to-Value:</span>
                <span className="text-slate-200">{activeOption.timeToValue}</span>
              </div>
            </div>
          </div>

          {/* CRITICAL: PROS & CONS TWO-COLUMN COMPARISON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PROS COLUMN */}
            <div className="bg-gradient-to-br from-emerald-950/30 to-slate-950 border border-emerald-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>PROS & STRATEGIC ADVANTAGES ({activeOption.pros.length})</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded">
                  Positive Payoffs
                </span>
              </div>

              <div className="space-y-2.5">
                {activeOption.pros.map((pro, pIdx) => (
                  <div
                    key={pIdx}
                    className="bg-slate-950/80 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed font-mono"
                  >
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      ✓
                    </span>
                    <span className="flex-1">{pro}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CONS COLUMN */}
            <div className="bg-gradient-to-br from-rose-950/30 to-slate-950 border border-rose-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                  <span>CONS, DOWNSIDES & RISKS ({activeOption.cons.length})</span>
                </div>
                <span className="text-[10px] font-mono text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded">
                  Trade-Off Costs
                </span>
              </div>

              <div className="space-y-2.5">
                {activeOption.cons.map((con, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-slate-950/80 border border-rose-500/20 p-3 rounded-lg flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed font-mono"
                  >
                    <span className="w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center shrink-0 mt-0.5 text-[10px]">
                      !
                    </span>
                    <span className="flex-1">{con}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mitigation Strategy & Leader Endorsements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono uppercase">
                <Shield className="w-4 h-4" />
                <span>Mitigation Strategy for Identified Cons</span>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
                {activeOption.mitigationStrategy}
              </p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-400 font-mono uppercase">
                <Cpu className="w-4 h-4" />
                <span>Supporting Genome Endorsements</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {activeOption.supportingLeaders.map((ldr, lIdx) => (
                  <span
                    key={lIdx}
                    className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-md font-mono"
                  >
                    👤 {ldr}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Score Vector Radar Breakdown */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono mb-3 flex items-center justify-between">
              <span>Multi-Dimensional Score Vector</span>
              <span className="text-slate-500">Scale: 0 to 100</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Feasibility</div>
                <div className="text-base font-bold text-white mt-1">
                  {activeOption.scores.feasibility}/100
                </div>
                <div className="w-full bg-slate-800 h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${activeOption.scores.feasibility}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Upside Potential</div>
                <div className="text-base font-bold text-amber-400 mt-1">
                  {activeOption.scores.upsidePotential}/100
                </div>
                <div className="w-full bg-slate-800 h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-amber-400 h-full" style={{ width: `${activeOption.scores.upsidePotential}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Safety Floor</div>
                <div className="text-base font-bold text-blue-400 mt-1">
                  {activeOption.scores.safetyFloor}/100
                </div>
                <div className="w-full bg-slate-800 h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-blue-400 h-full" style={{ width: `${activeOption.scores.safetyFloor}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-500 text-[10px]">Execution Speed</div>
                <div className="text-base font-bold text-purple-400 mt-1">
                  {activeOption.scores.executionSpeed}/100
                </div>
                <div className="w-full bg-slate-800 h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-purple-400 h-full" style={{ width: `${activeOption.scores.executionSpeed}%` }} />
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                <div className="text-slate-500 text-[10px]">Capital Efficiency</div>
                <div className="text-base font-bold text-emerald-400 mt-1">
                  {activeOption.scores.capitalEfficiency}/100
                </div>
                <div className="w-full bg-slate-800 h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-emerald-400 h-full" style={{ width: `${activeOption.scores.capitalEfficiency}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Delete Option action if more than 1 option */}
          {matrix.options.length > 1 && (
            <div className="flex justify-end pt-2">
              <button
                onClick={() => handleDeleteOption(activeOption.id)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1.5 p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer font-mono"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Option ({activeOption.title.slice(0, 20)}...)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add New Custom Option Modal */}
      {isAddingOption && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-amber-400" />
              <span>Add Candidate Decision Option</span>
            </h3>

            <div className="space-y-3 text-xs font-mono">
              <div>
                <label className="text-slate-400 block mb-1">Option Title *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Hybrid Multi-Model Router with Latency Budget"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="2-sentence strategic summary of how this option functions..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400 h-20"
                />
              </div>

              {/* Add Pros */}
              <div>
                <label className="text-emerald-400 block mb-1">Add Pros (Advantages)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPro}
                    onChange={(e) => setNewPro(e.target.value)}
                    placeholder="e.g., Lowers latency by 45%"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPro()}
                  />
                  <button
                    type="button"
                    onClick={handleAddPro}
                    className="px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {tempPros.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tempPros.map((p, i) => (
                      <span key={i} className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded">
                        ✓ {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Cons */}
              <div>
                <label className="text-rose-400 block mb-1">Add Cons (Risks / Costs)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCon}
                    onChange={(e) => setNewCon(e.target.value)}
                    placeholder="e.g., Requires extra caching layer"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCon()}
                  />
                  <button
                    type="button"
                    onClick={handleAddCon}
                    className="px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                {tempCons.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {tempCons.map((c, i) => (
                      <span key={i} className="bg-rose-500/20 text-rose-300 text-[10px] px-2 py-0.5 rounded">
                        ! {c}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsAddingOption(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs cursor-pointer font-mono"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewOption}
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs cursor-pointer font-mono"
              >
                Save Option & Re-Normalize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

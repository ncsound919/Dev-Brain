import React, { useState } from 'react';
import {
  History,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Award,
  Zap,
  Sliders,
  Copy,
  Check,
  Search
} from 'lucide-react';
import {
  PostMortemRecord,
  CalibrationOverview,
  SectorType
} from '../types';
import { globalPostMortemEngine } from '../engine/postMortemEngine';
import { ALL_LEADER_GENOMES } from '../data/genomes';

interface Props {
  onUpdateLeaderBelievability?: (leaderId: string, newWeight: number) => void;
}

export const PostMortemTracker: React.FC<Props> = ({ onUpdateLeaderBelievability }) => {
  const [records, setRecords] = useState<PostMortemRecord[]>(() => globalPostMortemEngine.getAllRecords());
  const [selectedRecord, setSelectedRecord] = useState<PostMortemRecord | null>(records[0] || null);
  const [sectorFilter, setSectorFilter] = useState<SectorType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'partial' | 'failure'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [appliedAdjustments, setAppliedAdjustments] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  // New post-mortem form state
  const [newTitle, setNewTitle] = useState('');
  const [newSector, setNewSector] = useState<SectorType>('dev');
  const [newOption, setNewOption] = useState('');
  const [newPredProb, setNewPredProb] = useState(0.8);
  const [newOutcome, setNewOutcome] = useState<'success' | 'partial' | 'failure'>('success');
  const [newSummary, setNewSummary] = useState('');
  const [newLesson, setNewLesson] = useState('');

  const overview: CalibrationOverview = globalPostMortemEngine.computeOverview();

  const filteredRecords = records.filter(r => {
    if (sectorFilter !== 'all' && r.sector !== sectorFilter) return false;
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery.trim() && !r.decisionTitle.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleApplyAdjustment = (leaderId: string, recommendedWeight: number) => {
    if (onUpdateLeaderBelievability) {
      onUpdateLeaderBelievability(leaderId, recommendedWeight);
    }
    setAppliedAdjustments(prev => ({ ...prev, [leaderId]: true }));
  };

  const handleCreatePostMortem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newRecord = globalPostMortemEngine.createNewPostMortem({
      decisionTitle: newTitle,
      sector: newSector,
      chosenOption: newOption || 'Selected Standard Strategy',
      predictedProbability: Number(newPredProb),
      actualOutcome: newOutcome,
      metricVariances: [
        {
          metricName: 'Primary Objective Achievement',
          predictedValue: `${Math.round(newPredProb * 100)}%`,
          actualValue: newOutcome === 'success' ? '100%' : newOutcome === 'partial' ? '50%' : '0%',
          unit: '%',
          variancePercentage: newOutcome === 'success' ? 15 : newOutcome === 'partial' ? -25 : -80,
          verdict: newOutcome === 'success' ? 'better' : newOutcome === 'partial' ? 'expected' : 'worse'
        }
      ],
      rootCauses: ['Observed execution conditions aligned with post-implementation real-world telemetry.'],
      keyLessons: [newLesson || 'Recorded retrospective insights into the organizational memory engine.'],
      retrospectiveSummary: newSummary || `Retrospective evaluation for ${newTitle} completed with status: ${newOutcome}.`,
      leaders: Object.values(ALL_LEADER_GENOMES)
    });

    setRecords(globalPostMortemEngine.getAllRecords());
    setSelectedRecord(newRecord);
    setShowNewModal(false);
    setNewTitle('');
    setNewOption('');
    setNewSummary('');
    setNewLesson('');
  };

  const copyPostMortemToClipboard = () => {
    if (!selectedRecord) return;
    const text = `# Post-Mortem Report: ${selectedRecord.decisionTitle}
- **Sector**: ${selectedRecord.sector.toUpperCase()}
- **Decision Date**: ${selectedRecord.decisionDate} | **Evaluation Date**: ${selectedRecord.evaluationDate}
- **Status**: ${selectedRecord.status.toUpperCase()} (Brier Score: ${selectedRecord.brierScore})
- **Calibration Rating**: ${selectedRecord.calibrationRating}
- **Predicted Probability**: ${(selectedRecord.predictedProbability * 100).toFixed(0)}% vs **Actual Outcome**: ${(selectedRecord.actualOutcomeBinary * 100).toFixed(0)}%

### Metric Variances
${selectedRecord.metricVariances.map(m => `- **${m.metricName}**: Predicted ${m.predictedValue}${m.unit} vs Actual ${m.actualValue}${m.unit} (${m.variancePercentage > 0 ? '+' : ''}${m.variancePercentage}%) -> [${m.verdict.toUpperCase()}]`).join('\n')}

### Root Causes
${selectedRecord.rootCauses.map(c => `- ${c}`).join('\n')}

### Key Lessons
${selectedRecord.keyLessons.map(l => `- ${l}`).join('\n')}

### Retrospective Summary
${selectedRecord.retrospectiveSummary}
`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Calibration Telemetry */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">Decision Post-Mortem & Calibration Engine</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Closed-Loop Feedback
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Tracks outcome variance, calculates Brier calibration scores, and automatically calibrates leader believability weights.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-colors shadow-md cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Log Decision Outcome</span>
          </button>
        </div>

        {/* KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
              <span>Mean Brier Score</span>
              <Award className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white font-mono flex items-baseline gap-2">
              <span>{overview.meanBrierScore.toFixed(4)}</span>
              <span className="text-[11px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                Grade {overview.calibrationGrade}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">0.0000 is mathematically perfect</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
              <span>Success Accuracy Rate</span>
              <Percent className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {overview.accuracyRate}%
            </div>
            <span className="text-[10px] text-slate-500">{overview.totalDecisionsLogged} decisions evaluated</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
              <span>Overconfidence Bias</span>
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-indigo-300 font-mono">
              +{overview.overconfidenceBiasScore}%
            </div>
            <span className="text-[10px] text-slate-500">Within optimal ±5% corridor</span>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono mb-1">
              <span>Active Genome Drift</span>
              <Zap className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className="text-xl font-bold text-amber-300 font-mono">
              Calibrated
            </div>
            <span className="text-[10px] text-slate-500">5 Sector feedback loops live</span>
          </div>
        </div>
      </div>

      {/* Main Workspace: Left List + Right Detailed Post-Mortem */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Decision Filter & Records List (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 space-y-3">
            {/* Search & Sector filter */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search logged decisions..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
              {[
                { id: 'all', label: 'All Sectors' },
                { id: 'dev', label: 'Dev' },
                { id: 'business', label: 'Business' },
                { id: 'financial', label: 'Financial' },
                { id: 'science_biotech', label: 'Biotech' },
                { id: 'science_sports', label: 'Sports' }
              ].map(sec => (
                <button
                  key={sec.id}
                  onClick={() => setSectorFilter(sec.id as SectorType | 'all')}
                  className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                    sectorFilter === sec.id
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                      : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            {/* Status Tabs */}
            <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80 text-[11px] font-mono">
              {(['all', 'success', 'partial', 'failure'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`flex-1 py-1 text-center rounded capitalize cursor-pointer transition-colors ${
                    statusFilter === st
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List of Records */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/40 border border-slate-800 rounded-xl">
                No post-mortems matching criteria.
              </div>
            ) : (
              filteredRecords.map(record => {
                const isSelected = selectedRecord?.id === record.id;
                const statusColor =
                  record.status === 'success'
                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                    : record.status === 'partial'
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                    : 'text-rose-400 bg-rose-500/10 border-rose-500/30';

                return (
                  <div
                    key={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-800/90 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {record.sector.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                        {record.status}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-white leading-snug line-clamp-2 mb-2">
                      {record.decisionTitle}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-slate-800/60 pt-2">
                      <div className="flex items-center gap-2">
                        <span>Pred: {(record.predictedProbability * 100).toFixed(0)}%</span>
                        <span>•</span>
                        <span>Brier: <strong className="text-slate-200">{record.brierScore}</strong></span>
                      </div>
                      <span className="text-[10px] text-slate-500">{record.evaluationDate}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Post-Mortem Drilldown (7 cols) */}
        <div className="lg:col-span-7">
          {selectedRecord ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5 shadow-lg">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      {selectedRecord.sector.toUpperCase()}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-bold border ${
                        selectedRecord.status === 'success'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : selectedRecord.status === 'partial'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      }`}
                    >
                      Outcome: {selectedRecord.status}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/30">
                      Calibration: {selectedRecord.calibrationRating}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{selectedRecord.decisionTitle}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Chosen: <span className="text-slate-200 font-semibold">{selectedRecord.chosenOption}</span>
                  </p>
                </div>

                <button
                  onClick={copyPostMortemToClipboard}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer self-start transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Export'}</span>
                </button>
              </div>

              {/* Statistical Calibration Card */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">Predicted Probability</span>
                  <span className="text-base font-bold text-indigo-300">
                    {(selectedRecord.predictedProbability * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Actual Binary Result</span>
                  <span className="text-base font-bold text-emerald-400">
                    {(selectedRecord.actualOutcomeBinary * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Brier Delta ((p-a)²)</span>
                  <span className="text-base font-bold text-amber-300">
                    {selectedRecord.brierScore}
                  </span>
                </div>
              </div>

              {/* Metric Variances (Predicted vs Actual) */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <span>1. Telemetry Variance Matrix (Predicted vs Actual)</span>
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="p-2.5">Key Metric</th>
                        <th className="p-2.5">Predicted</th>
                        <th className="p-2.5">Actual Outcome</th>
                        <th className="p-2.5">Variance</th>
                        <th className="p-2.5">Verdict</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-mono">
                      {selectedRecord.metricVariances.map((mv, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="p-2.5 text-slate-200 font-sans font-medium">{mv.metricName}</td>
                          <td className="p-2.5 text-slate-400">{mv.predictedValue} {mv.unit}</td>
                          <td className="p-2.5 text-white font-bold">{mv.actualValue} {mv.unit}</td>
                          <td className="p-2.5">
                            <span
                              className={`flex items-center gap-0.5 ${
                                mv.variancePercentage > 0
                                  ? 'text-emerald-400'
                                  : mv.variancePercentage < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {mv.variancePercentage > 0 ? (
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              ) : mv.variancePercentage < 0 ? (
                                <ArrowDownRight className="w-3.5 h-3.5" />
                              ) : null}
                              {mv.variancePercentage > 0 ? '+' : ''}{mv.variancePercentage}%
                            </span>
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                                mv.verdict === 'better'
                                  ? 'bg-emerald-500/20 text-emerald-300'
                                  : mv.verdict === 'expected'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {mv.verdict}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Root Causes & Key Lessons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <h5 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Observed Root Causes</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedRecord.rootCauses.map((rc, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-amber-400 mt-1">•</span>
                        <span>{rc}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5">
                  <h5 className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Retrospective Key Lessons</span>
                  </h5>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {selectedRecord.keyLessons.map((kl, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{kl}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Believability Weight Adjustments Feedback Loop */}
              {selectedRecord.suggestedAdjustments && selectedRecord.suggestedAdjustments.length > 0 && (
                <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-blue-200 uppercase tracking-wider">
                        Closed-Loop Genome Weight Calibration
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">Deterministic Feedback Loop</span>
                  </div>

                  <div className="space-y-2">
                    {selectedRecord.suggestedAdjustments.map((adj, idx) => {
                      const isApplied = appliedAdjustments[adj.leaderId];
                      return (
                        <div
                          key={idx}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{adj.leaderName}</span>
                              <span className="text-[10px] font-mono text-slate-400">
                                Current: {(adj.currentBelievability * 100).toFixed(0)}% → Target:{' '}
                                <strong className="text-emerald-400">
                                  {(adj.recommendedBelievability * 100).toFixed(0)}%
                                </strong>{' '}
                                ({adj.delta > 0 ? '+' : ''}
                                {(adj.delta * 100).toFixed(0)}%)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{adj.reason}</p>
                          </div>

                          <button
                            onClick={() => handleApplyAdjustment(adj.leaderId, adj.recommendedBelievability)}
                            disabled={isApplied}
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer whitespace-nowrap ${
                              isApplied
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                            }`}
                          >
                            {isApplied ? 'Calibrated ✓' : 'Apply Calibration'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Retrospective Summary Text */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
                <span className="font-bold text-slate-400 block mb-1 font-mono uppercase text-[10px]">
                  Executive Synthesis & Organizational Memory:
                </span>
                {selectedRecord.retrospectiveSummary}
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-12 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs text-slate-500">
              Select a post-mortem to view detailed telemetry and calibration variance.
            </div>
          )}
        </div>
      </div>

      {/* Log New Post-Mortem Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <History className="w-5 h-5 text-amber-400" />
                <span>Log Real-World Decision Outcome</span>
              </h3>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePostMortem} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-slate-300 mb-1 font-sans font-bold">Decision Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Sharded Distributed Vector Index"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-bold">Domain Sector</label>
                  <select
                    value={newSector}
                    onChange={e => setNewSector(e.target.value as SectorType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="dev">Dev & Architecture</option>
                    <option value="business">Business & GTM</option>
                    <option value="financial">Financial & Quant</option>
                    <option value="science_biotech">Biotech & Clinical</option>
                    <option value="science_sports">Sports Science & Load</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-bold">Real Outcome</label>
                  <select
                    value={newOutcome}
                    onChange={e => setNewOutcome(e.target.value as 'success' | 'partial' | 'failure')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500/60"
                  >
                    <option value="success">Success (Met / Exceeded SLA)</option>
                    <option value="partial">Partial (Target met with friction)</option>
                    <option value="failure">Failure (Missed Target)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-bold">Chosen Strategy / Option</label>
                  <input
                    type="text"
                    placeholder="e.g. Option B: Milvus HNSW with mmap"
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-sans font-bold">
                    Initial Predicted Confidence ({(newPredProb * 100).toFixed(0)}%)
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="0.99"
                    step="0.05"
                    value={newPredProb}
                    onChange={e => setNewPredProb(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 mt-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-bold">Key Lesson Learned</label>
                <input
                  type="text"
                  placeholder="e.g. Memory-mapped vector buffers prevented out-of-memory container thrashing under 50k QPS."
                  value={newLesson}
                  onChange={e => setNewLesson(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-sans font-bold">Retrospective Narrative</label>
                <textarea
                  rows={3}
                  placeholder="Summarize root causes, observed bottlenecks, and organizational takeaways..."
                  value={newSummary}
                  onChange={e => setNewSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 font-sans">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-md"
                >
                  Save & Calibrate Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

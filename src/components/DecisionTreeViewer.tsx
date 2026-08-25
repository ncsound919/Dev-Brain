import { useState, useMemo } from 'react';
import {
  GitFork,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Sliders,
  Play,
  RotateCcw,
  Copy,
  Check,
  Code,
  Layers,
  Info,
  BarChart3,
  ShieldCheck,
  Plus,
  ArrowRight
} from 'lucide-react';
import { DecisionTree, DecisionNode, DecisionDomain } from '../types';
import { BUILT_IN_DECISION_TREES } from '../data/decisionTrees';
import { DecisionTreeEngine } from '../engine/decisionTreeEngine';

interface Props {
  onSelectForSandbox?: (tree: DecisionTree, params: Record<string, any>) => void;
}

export function DecisionTreeViewer({ onSelectForSandbox }: Props) {
  const [selectedTreeId, setSelectedTreeId] = useState<string>('tree_financial_spend');
  const [customTrees, setCustomTrees] = useState<Record<string, DecisionTree>>({});
  const [activeParameters, setActiveParameters] = useState<Record<string, any>>({
    amount_usd: 250,
    is_recurring: false,
    is_in_budget: true,
    has_penalty_free_cancellation: true
  });
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [viewMode, setViewMode] = useState<'simulator' | 'graph' | 'monte_carlo' | 'diagnostics' | 'schema'>('simulator');
  
  // Monte Carlo state
  const [monteCarloRuns, setMonteCarloRuns] = useState<number>(500);
  
  // Custom Tree Creator Modal State
  const [isCreatingTree, setIsCreatingTree] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const [newTreeCategory, setNewTreeCategory] = useState('');
  const [newTreeDomain, setNewTreeDomain] = useState<DecisionDomain>('custom');
  const [newTreeDesc, setNewTreeDesc] = useState('');

  const allTrees = useMemo(() => {
    return { ...BUILT_IN_DECISION_TREES, ...customTrees };
  }, [customTrees]);

  const activeTree = useMemo(() => {
    return allTrees[selectedTreeId] || Object.values(allTrees)[0];
  }, [selectedTreeId, allTrees]);

  // When switching tree, reset default parameters based on tree nodes
  const handleSelectTree = (treeId: string) => {
    setSelectedTreeId(treeId);
    const tree = allTrees[treeId];
    if (tree) {
      const initialParams: Record<string, any> = {};
      Object.values(tree.nodes).forEach(n => {
        if (n.field && n.defaultValue !== undefined) {
          initialParams[n.field] = n.defaultValue;
        }
      });
      setActiveParameters(initialParams);
    }
  };

  // Run real-time traversal based on activeParameters
  const traversalResult = useMemo(() => {
    return DecisionTreeEngine.traverseTree(activeTree, activeParameters);
  }, [activeTree, activeParameters]);

  // Run tree structural diagnostic audit
  const diagnosticReport = useMemo(() => {
    return DecisionTreeEngine.validateTreeStructure(activeTree);
  }, [activeTree]);

  // Run Monte Carlo simulation
  const monteCarloResult = useMemo(() => {
    return DecisionTreeEngine.evaluateMonteCarlo(activeTree, undefined, monteCarloRuns);
  }, [activeTree, monteCarloRuns]);

  const handleParamChange = (field: string, value: any) => {
    setActiveParameters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCopySchema = () => {
    const schema = DecisionTreeEngine.generateAgentJsonSchema(activeTree);
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleCreateCustomTree = () => {
    if (!newTreeName.trim()) return;
    const treeId = `custom_tree_${Date.now()}`;
    const newTree = DecisionTreeEngine.createCustomTree(
      treeId,
      newTreeName,
      newTreeDomain,
      newTreeCategory || 'Custom Operations',
      newTreeDesc || 'Custom user-configured deterministic governance tree.'
    );

    setCustomTrees(prev => ({
      ...prev,
      [treeId]: newTree
    }));
    setSelectedTreeId(treeId);
    setIsCreatingTree(false);
    setNewTreeName('');
    setNewTreeDesc('');
  };

  // Get condition fields in current tree
  const treeFields = useMemo(() => {
    const fields: DecisionNode[] = [];
    Object.values(activeTree.nodes).forEach(n => {
      if (n.type === 'condition' && n.field) {
        fields.push(n);
      }
    });
    return fields;
  }, [activeTree]);

  const visitedSet = useMemo(() => {
    return new Set(traversalResult.visitedNodeIds);
  }, [traversalResult]);

  return (
    <div className="space-y-6">
      {/* Tree Selector Ribbon */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <GitFork className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Deterministic Decision Tree Engine</h2>
              <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded font-mono font-semibold">
                {Object.keys(allTrees).length} Active Trees
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Battle-tested governance branches that evaluate probabilistic inputs into deterministic action verdicts
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode('simulator')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'simulator' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Simulator</span>
              </button>
              <button
                onClick={() => setViewMode('graph')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'graph' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Tree Graph</span>
              </button>
              <button
                onClick={() => setViewMode('monte_carlo')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'monte_carlo' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Monte Carlo</span>
              </button>
              <button
                onClick={() => setViewMode('diagnostics')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'diagnostics' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Health Audit</span>
              </button>
              <button
                onClick={() => setViewMode('schema')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'schema' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Schema</span>
              </button>
            </div>

            <button
              onClick={() => setIsCreatingTree(true)}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1 transition-colors cursor-pointer shadow-sm shadow-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Tree</span>
            </button>
          </div>
        </div>

        {/* Tree Selection Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5 pt-2 border-t border-slate-800/80">
          {Object.values(allTrees).map(tree => {
            const isSelected = tree.id === selectedTreeId;
            return (
              <button
                key={tree.id}
                onClick={() => handleSelectTree(tree.id)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300 shadow-sm shadow-amber-400/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1 truncate">
                    {tree.category}
                  </div>
                  <div className={`text-xs font-bold truncate ${isSelected ? 'text-amber-400' : 'text-white'}`}>
                    {tree.name}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 mt-2 font-mono flex items-center justify-between">
                  <span>v{tree.version}</span>
                  <span className={isSelected ? 'text-amber-400 font-semibold' : 'text-slate-500'}>
                    {isSelected ? '● Active' : 'Select'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW MODE 1: LIVE SIMULATOR */}
      {viewMode === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Scenario Parameters Input (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Live Action Inputs</h3>
                </div>
                <button
                  onClick={() => {
                    const initial: Record<string, any> = {};
                    treeFields.forEach(f => {
                      if (f.field && f.defaultValue !== undefined) initial[f.field] = f.defaultValue;
                    });
                    setActiveParameters(initial);
                  }}
                  className="text-[11px] text-slate-400 hover:text-amber-300 flex items-center gap-1 font-mono cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Defaults</span>
                </button>
              </div>

              <div className="space-y-4">
                {treeFields.map(node => {
                  if (!node.field) return null;
                  const val = activeParameters[node.field] !== undefined ? activeParameters[node.field] : node.defaultValue;

                  return (
                    <div key={node.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800/90">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <label className="text-xs font-semibold text-slate-200">
                          {node.question || node.title}
                        </label>
                        <code className="text-[10px] text-slate-500 font-mono">{node.field}</code>
                      </div>
                      <p className="text-[11px] text-slate-400 mb-2.5 leading-tight">{node.description}</p>

                      {/* Number Input / Slider */}
                      {node.valueType === 'number' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={val}
                              onChange={(e) => handleParamChange(node.field!, Number(e.target.value))}
                              className="w-28 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs font-mono text-amber-400 focus:outline-none focus:border-amber-400"
                            />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {node.field.includes('usd') ? 'USD Currency' : node.field.includes('percent') || node.field.includes('margin') ? '%' : 'Units'}
                            </span>
                          </div>
                          {node.field.includes('usd') && (
                            <input
                              type="range"
                              min="0"
                              max="5000"
                              step="50"
                              value={val}
                              onChange={(e) => handleParamChange(node.field!, Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                            />
                          )}
                          {(node.field.includes('percent') || node.field.includes('margin')) && (
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={val}
                              onChange={(e) => handleParamChange(node.field!, Number(e.target.value))}
                              className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                            />
                          )}
                        </div>
                      )}

                      {/* Boolean Toggle */}
                      {node.valueType === 'boolean' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleParamChange(node.field!, true)}
                            className={`flex-1 py-1.5 px-3 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                              val === true
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            YES / TRUE
                          </button>
                          <button
                            onClick={() => handleParamChange(node.field!, false)}
                            className={`flex-1 py-1.5 px-3 rounded text-xs font-mono font-medium transition-colors cursor-pointer ${
                              val === false
                                ? 'bg-amber-400 text-slate-950 font-bold'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            NO / FALSE
                          </button>
                        </div>
                      )}

                      {/* Select Dropdown */}
                      {node.valueType === 'select' && node.options && (
                        <select
                          value={val}
                          onChange={(e) => handleParamChange(node.field!, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                        >
                          {node.options.map(opt => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {onSelectForSandbox && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onSelectForSandbox(activeTree, activeParameters)}
                    className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>Send Parameters to Agent Sandbox</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Traversal Trace & Verdict (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Final Verdict Card */}
            {traversalResult.finalNode.verdict && (
              <div
                className={`p-5 rounded-xl border-2 shadow-lg transition-all ${
                  traversalResult.finalNode.verdict.status === 'APPROVED'
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-500/5'
                    : traversalResult.finalNode.verdict.status === 'CONDITIONAL_APPROVAL'
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-blue-500/5'
                    : traversalResult.finalNode.verdict.status === 'ESCALATE_TO_FOUNDER'
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-500/5'
                    : 'bg-rose-950/40 border-rose-500/60 shadow-rose-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {traversalResult.finalNode.verdict.status === 'APPROVED' && (
                      <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                    )}
                    {traversalResult.finalNode.verdict.status === 'CONDITIONAL_APPROVAL' && (
                      <Info className="w-7 h-7 text-blue-400 shrink-0" />
                    )}
                    {traversalResult.finalNode.verdict.status === 'ESCALATE_TO_FOUNDER' && (
                      <AlertTriangle className="w-7 h-7 text-amber-400 shrink-0" />
                    )}
                    {traversalResult.finalNode.verdict.status === 'REJECTED' && (
                      <XCircle className="w-7 h-7 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-extrabold uppercase px-2.5 py-0.5 rounded ${
                            traversalResult.finalNode.verdict.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : traversalResult.finalNode.verdict.status === 'CONDITIONAL_APPROVAL'
                              ? 'bg-blue-500/20 text-blue-300'
                              : traversalResult.finalNode.verdict.status === 'ESCALATE_TO_FOUNDER'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          {traversalResult.finalNode.verdict.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Risk Tier: <strong className="text-white">{traversalResult.finalNode.verdict.riskTier}</strong>
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mt-1">
                        {traversalResult.finalNode.title}
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-1 rounded font-bold ${
                      traversalResult.finalNode.verdict.allowAutomation
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {traversalResult.finalNode.verdict.allowAutomation ? '✓ Autonomous OK' : '✕ Human Signoff Required'}
                  </span>
                </div>

                <p className="text-xs text-slate-200 mt-3 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800 font-mono">
                  {traversalResult.finalNode.verdict.reason}
                </p>

                {traversalResult.finalNode.verdict.mitigationActions.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Required Mitigation & Operational Controls:
                    </div>
                    <ul className="space-y-1">
                      {traversalResult.finalNode.verdict.mitigationActions.map((act, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5 font-mono">
                          <span className="text-amber-400 font-bold">›</span>
                          <span>{act}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Step-by-Step Traversal Path */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">
                    Step-by-Step Decision Trace ({traversalResult.trace.length} Nodes)
                  </h3>
                </div>
                <span className="text-[11px] text-emerald-400 font-mono">✓ Deterministic Traversal</span>
              </div>

              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {traversalResult.trace.map((step, idx) => {
                  const isLast = idx === traversalResult.trace.length - 1;
                  return (
                    <div key={idx} className="relative">
                      <div
                        className={`absolute -left-[27px] top-1.5 w-4 h-4 rounded-full border-2 flex items-center justify-center text-[9px] font-mono font-bold ${
                          isLast
                            ? 'bg-amber-400 border-amber-400 text-slate-950'
                            : 'bg-slate-900 border-slate-600 text-slate-300'
                        }`}
                      >
                        {idx + 1}
                      </div>

                      <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-semibold text-slate-100 flex items-center gap-1.5">
                            <span>{step.nodeTitle}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
                            {step.nodeId}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-mono text-amber-300">
                          <span>Branch Taken:</span>
                          <span className="bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded text-amber-400 font-bold">
                            {step.branchTakenLabel}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 font-mono">
                          Evaluated Value: <strong className="text-slate-200">{String(step.evaluatedValue)}</strong>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 2: GRAPH / NODES VIEW WITH VISITED PATH HIGHLIGHTING */}
      {viewMode === 'graph' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Node Hierarchy & Branch Conditions ({Object.keys(activeTree.nodes).length} Total Nodes)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Active simulated traversal path highlighted with amber borders and glowing indicators.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                <span>Traversed Path ({visitedSet.size} Nodes)</span>
              </span>
              <span className="text-slate-400">
                Root: <strong className="text-amber-400">{activeTree.rootNodeId}</strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(activeTree.nodes).map(node => {
              const isVisited = visitedSet.has(node.id);
              const isRoot = node.id === activeTree.rootNodeId;
              const isVerdict = node.type === 'action_verdict';

              return (
                <div
                  key={node.id}
                  className={`p-4 rounded-xl border flex flex-col justify-between transition-all ${
                    isVisited
                      ? 'bg-amber-400/10 border-amber-400 shadow-md shadow-amber-400/10 ring-1 ring-amber-400/30'
                      : isRoot
                      ? 'bg-amber-400/5 border-amber-400/40'
                      : isVerdict
                      ? 'bg-slate-950 border-slate-700'
                      : 'bg-slate-950/70 border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                          {node.id}
                        </span>
                        {isVisited && (
                          <span className="text-[9px] font-mono bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded font-bold">
                            VISITED
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                          isRoot
                            ? 'bg-amber-400 text-slate-950'
                            : isVerdict
                            ? 'bg-purple-500/20 text-purple-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isRoot ? 'ROOT NODE' : node.type.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mb-1">{node.title}</h4>
                    <p className="text-xs text-slate-400 mb-3 line-clamp-2">{node.description}</p>

                    {node.branches && node.branches.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className="text-[10px] uppercase font-bold text-slate-500 font-mono">Branches:</div>
                        {node.branches.map(br => (
                          <div key={br.id} className="text-[11px] font-mono bg-slate-900 p-2 rounded border border-slate-800 flex items-center justify-between gap-1">
                            <span className="text-slate-300 truncate">{br.label}</span>
                            <span className="text-amber-400 text-[10px] shrink-0">→ {br.targetNodeId}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {node.verdict && (
                      <div className="pt-2 border-t border-slate-800 space-y-1 text-[11px] font-mono">
                        <div className="text-emerald-400 font-bold">Outcome: {node.verdict.status}</div>
                        <div className="text-slate-400">Risk: {node.verdict.riskTier}</div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: MONTE CARLO PROBABILISTIC SENSITIVITY */}
      {viewMode === 'monte_carlo' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Monte Carlo Probabilistic & Sensitivity Analysis</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Stress-test parameter variations across {monteCarloResult.totalRuns} stochastic scenarios to reveal risk profile distributions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-mono">Runs:</span>
              {[100, 500, 1000].map(runCount => (
                <button
                  key={runCount}
                  onClick={() => setMonteCarloRuns(runCount)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                    monteCarloRuns === runCount
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {runCount}
                </button>
              ))}
            </div>
          </div>

          {/* Stat Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-[10px] uppercase font-mono text-slate-400 mb-1">Total Simulated Runs</div>
              <div className="text-2xl font-black text-amber-400 font-mono">{monteCarloResult.totalRuns}</div>
              <p className="text-[11px] text-slate-500 mt-1">Stochastic parameter sets</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/50">
              <div className="text-[10px] uppercase font-mono text-emerald-400 mb-1">Approved Verdict Share</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {monteCarloResult.verdictPercentage.APPROVED}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{monteCarloResult.verdictDistribution.APPROVED} total runs</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-amber-900/50">
              <div className="text-[10px] uppercase font-mono text-amber-400 mb-1">Escalation Threshold Share</div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {monteCarloResult.verdictPercentage.ESCALATE_TO_FOUNDER}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{monteCarloResult.verdictDistribution.ESCALATE_TO_FOUNDER} total runs</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50">
              <div className="text-[10px] uppercase font-mono text-rose-400 mb-1">Rejected Share</div>
              <div className="text-2xl font-black text-rose-400 font-mono">
                {monteCarloResult.verdictPercentage.REJECTED}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{monteCarloResult.verdictDistribution.REJECTED} total runs</p>
            </div>
          </div>

          {/* Verdict Distribution Bars */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Verdict Status Distribution Bar Breakdown
            </h4>
            <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${monteCarloResult.verdictPercentage.APPROVED}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Approved: ${monteCarloResult.verdictPercentage.APPROVED}%`}
              />
              <div
                style={{ width: `${monteCarloResult.verdictPercentage.CONDITIONAL_APPROVAL}%` }}
                className="bg-blue-500 h-full transition-all"
                title={`Conditional: ${monteCarloResult.verdictPercentage.CONDITIONAL_APPROVAL}%`}
              />
              <div
                style={{ width: `${monteCarloResult.verdictPercentage.ESCALATE_TO_FOUNDER}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Escalate: ${monteCarloResult.verdictPercentage.ESCALATE_TO_FOUNDER}%`}
              />
              <div
                style={{ width: `${monteCarloResult.verdictPercentage.REJECTED}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`Rejected: ${monteCarloResult.verdictPercentage.REJECTED}%`}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs font-mono text-slate-400 pt-1">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-emerald-500"></span> Approved ({monteCarloResult.verdictPercentage.APPROVED}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-500"></span> Conditional ({monteCarloResult.verdictPercentage.CONDITIONAL_APPROVAL}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-500"></span> Escalate ({monteCarloResult.verdictPercentage.ESCALATE_TO_FOUNDER}%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-rose-500"></span> Rejected ({monteCarloResult.verdictPercentage.REJECTED}%)</span>
            </div>
          </div>

          {/* Top Traversal Path */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Most Frequent Traversal Path ({monteCarloResult.mostFrequentPath.percentage}% of Runs)
              </h4>
              <span className="text-xs font-mono text-amber-400">{monteCarloResult.mostFrequentPath.count} / {monteCarloResult.totalRuns} Scenarios</span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto py-2 font-mono text-xs">
              {monteCarloResult.mostFrequentPath.visitedNodeIds.map((nodeId, idx) => (
                <div key={idx} className="flex items-center gap-2 shrink-0">
                  <span className="bg-slate-900 text-amber-300 border border-slate-700 px-3 py-1 rounded font-bold">
                    {activeTree.nodes[nodeId]?.title || nodeId}
                  </span>
                  {idx < monteCarloResult.mostFrequentPath.visitedNodeIds.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stochastic Run Details Table */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Stochastic Parameter Variance Scenarios (Sample runs 1-15)
              </h4>
              <span className="text-[10px] text-slate-400 font-mono">Randomly Selected Inputs</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-3 font-semibold">Run ID</th>
                    <th className="py-2 px-3 font-semibold">Stochastic Input Parameters</th>
                    <th className="py-2 px-3 font-semibold">Terminal Node ID</th>
                    <th className="py-2 px-3 font-semibold">Verdict</th>
                    <th className="py-2 px-3 font-semibold">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {monteCarloResult.sampleRunResults.map((run) => (
                    <tr key={run.runId} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-400">#{run.runId}</td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {Object.entries(run.params).map(([field, val]) => (
                            <span 
                              key={field} 
                              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-300 px-1.5 py-0.5 rounded flex items-center gap-1"
                              title={`${field}: ${val}`}
                            >
                              <span className="text-slate-500">{field}=</span>
                              <span className="text-amber-400 font-bold">{String(val)}</span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-[150px]" title={run.finalNodeId}>
                        {activeTree.nodes[run.finalNodeId]?.title || run.finalNodeId}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          run.verdict === 'APPROVED' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : run.verdict === 'CONDITIONAL_APPROVAL'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            : run.verdict === 'ESCALATE_TO_FOUNDER'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {run.verdict}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          run.riskTier === 'LOW' 
                            ? 'bg-emerald-500/10 text-slate-400' 
                            : run.riskTier === 'MEDIUM'
                            ? 'bg-blue-500/10 text-blue-300'
                            : run.riskTier === 'HIGH'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {run.riskTier}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE 4: STRUCTURAL HEALTH AUDIT */}
      {viewMode === 'diagnostics' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Tree Structural Health Diagnostic Audit</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated graph inspection to ensure no orphan nodes, dangling branch references, or unmapped conditions exist.
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded text-xs font-mono font-bold ${
                diagnosticReport.isValid ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}
            >
              {diagnosticReport.isValid ? '✓ STRUCTURAL AUDIT PASSED' : '✕ AUDIT ISSUES DETECTED'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Total Nodes</div>
              <div className="text-xl font-bold text-white font-mono">{diagnosticReport.totalNodes}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Condition Nodes</div>
              <div className="text-xl font-bold text-amber-400 font-mono">{diagnosticReport.conditionNodesCount}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Verdict Outcomes</div>
              <div className="text-xl font-bold text-purple-400 font-mono">{diagnosticReport.verdictNodesCount}</div>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="text-[10px] font-mono text-slate-500">Orphaned Nodes</div>
              <div className="text-xl font-bold text-slate-300 font-mono">{diagnosticReport.orphanNodeIds.length}</div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-300 font-mono">Diagnostic Logs & Integrity Issues</h4>
            {diagnosticReport.issues.length === 0 ? (
              <div className="bg-emerald-950/30 border border-emerald-800/50 p-4 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Zero structural issues found. All condition branches cleanly traverse from root to terminal action verdict nodes.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {diagnosticReport.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs font-mono flex items-start gap-2 ${
                      issue.severity === 'error'
                        ? 'bg-rose-950/40 border-rose-800 text-rose-300'
                        : 'bg-amber-950/40 border-amber-800 text-amber-300'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold uppercase">[{issue.severity}]</span> {issue.message}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW MODE 5: AGENT TOOL SCHEMA */}
      {viewMode === 'schema' && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-amber-400" />
                <span>OpenAI / Anthropic / Gemini Function Calling Schema</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Embed this JSON schema directly into your autonomous agent's tool-calling definitions
              </p>
            </div>
            <button
              onClick={handleCopySchema}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSchema ? 'Schema Copied!' : 'Copy Tool JSON'}</span>
            </button>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 overflow-x-auto max-h-96">
            <pre>{JSON.stringify(DecisionTreeEngine.generateAgentJsonSchema(activeTree), null, 2)}</pre>
          </div>
        </div>
      )}

      {/* MODAL: CREATE NEW CUSTOM DECISION TREE */}
      {isCreatingTree && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitFork className="w-4 h-4 text-amber-400" />
                <span>Create Custom Decision Tree</span>
              </h3>
              <button
                onClick={() => setIsCreatingTree(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Tree Name</label>
                <input
                  type="text"
                  placeholder="e.g. Production Hotfix Gate"
                  value={newTreeName}
                  onChange={(e) => setNewTreeName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Domain</label>
                <select
                  value={newTreeDomain}
                  onChange={(e) => setNewTreeDomain(e.target.value as DecisionDomain)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="financial_spend">Financial Spend</option>
                  <option value="pricing_discount">Pricing & Discount</option>
                  <option value="infrastructure_db">Infrastructure & DB</option>
                  <option value="public_communication">Public Communication</option>
                  <option value="contract_legal">Contract & Legal</option>
                  <option value="agent_autonomous_tool">Agent Autonomous Tool</option>
                  <option value="custom">Custom Tactical / Sports</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Category Label</label>
                <input
                  type="text"
                  placeholder="e.g. Operations & DevOps"
                  value={newTreeCategory}
                  onChange={(e) => setNewTreeCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe what risk or detrimental outcome this decision tree prevents..."
                  value={newTreeDesc}
                  onChange={(e) => setNewTreeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingTree(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomTree}
                disabled={!newTreeName.trim()}
                className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg cursor-pointer transition-colors"
              >
                Create Decision Tree
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


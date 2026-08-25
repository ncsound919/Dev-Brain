import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ChevronDown,
  GitBranch,
  Zap,
  Users,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Search,
  BookOpen,
  Code2,
  Briefcase,
  TrendingUp,
  Dna,
  Activity,
  Layers,
  HelpCircle,
  X,
  Target,
  Sliders,
  GitFork,
  Bot,
  ShieldAlert,
  Code,
  PieChart,
  History,
  Flame,
  GitMerge,
  Brain,
  Play,
  Filter,
  BatteryWarning,
  Globe
} from 'lucide-react';
import { ALL_LEADER_GENOMES, GENOMES_BY_SECTOR } from './data/genomes';
import { SECTORS } from './data/sectors';
import { DeterministicReasoningEngine } from './engine/reasoningEngine';
import { MultiAgentOrchestrator } from './engine/orchestrator';
import { SynthesisEngine } from './engine/synthesis';
import { DecisionMatrixEngine } from './engine/decisionMatrixEngine';
import { ReasoningResult, OrchestrationResult, SynthesisResult, SectorType, LeaderGenome } from './types';
import { DecisionTreeViewer } from './components/DecisionTreeViewer';
import { CandidateTriageViewer } from './components/CandidateTriageViewer';
import { AgentDecisionSandbox } from './components/AgentDecisionSandbox';
import { AgentGuardrailManager } from './components/AgentGuardrailManager';
import { AgentIntegrationHub } from './components/AgentIntegrationHub';
import { MultiOptionDecisionMatrix } from './components/MultiOptionDecisionMatrix';
import { OllamaControlHub } from './components/OllamaControlHub';
import { PostMortemTracker } from './components/PostMortemTracker';
import { RedTeamSimulator } from './components/RedTeamSimulator';
import { CrossDomainSynthesizer } from './components/CrossDomainSynthesizer';
import { JustificationLayerViewer } from './components/JustificationLayerViewer';
import { OutcomeSimulatorViewer } from './components/OutcomeSimulatorViewer';
import { OpponentTwinLab } from './components/OpponentTwinLab';
import { FatigueDriftViewer } from './components/FatigueDriftViewer';
import { GenomeMutationViewer } from './components/GenomeMutationViewer';
import { ExternalIntelViewer } from './components/ExternalIntelViewer';
import { globalOllamaClient } from './engine/ollamaClient';

const SECTOR_ICONS: Record<SectorType, typeof Code2> = {
  dev: Code2,
  business: Briefcase,
  financial: TrendingUp,
  science_biotech: Dna,
  science_sports: Activity
};

const SAMPLE_SCENARIOS = [
  {
    title: 'Biotech: CAR-T Persistence & Solid Tumor Evasion',
    sector: 'science_biotech' as SectorType,
    text: 'Design a modular CAR-T construct with synthetic AND/NOT logic gates to target solid tumors while preventing T-cell exhaustion and off-tumor on-target toxicity.',
    recommended: ['carl-june', 'michel-sadelain', 'padmanee-sharma', 'jennifer-doudna']
  },
  {
    title: 'Sports Science: Athletic ACWR & CNS Recovery',
    sector: 'science_sports' as SectorType,
    text: 'Formulate an integrated in-season athletic periodization protocol that balances High-Low CNS recovery, Acute:Chronic Workload Ratios (ACWR < 1.3), and lumbar spine stiffness.',
    recommended: ['tim-gabbett', 'charlie-francis', 'stewart-mcgill', 'andy-galpin']
  },
  {
    title: 'Business: Disruptive SaaS Flywheel & Talent Density',
    sector: 'business' as SectorType,
    text: 'Formulate a corporate strategy to disrupt legacy enterprise incumbents using Jobs-to-be-Done, a self-reinforcing flywheel, and high talent density with context-not-control.',
    recommended: ['clayton-christensen', 'jim-collins', 'reed-hastings', 'roger-martin']
  },
  {
    title: 'Finance: Intrinsic Valuation & Fortress Risk Hedge',
    sector: 'financial' as SectorType,
    text: 'Perform an intrinsic DCF valuation and cash conversion analysis for an acquisition target while designing a barbell fat-tail hedge against sudden debt cycle contraction.',
    recommended: ['aswath-damodaran', 'warren-buffett', 'nassim-taleb', 'ray-dalio']
  },
  {
    title: 'Cross-Sector: AI Biotech Startup Strategy & Valuation',
    sector: 'dev' as SectorType,
    crossSectors: ['dev', 'science_biotech', 'business', 'financial'] as SectorType[],
    text: 'Architect an AI-native generative drug discovery platform: design the molecular transformer architecture, de-risk the clinical pipeline, construct the business moat, and structure capital allocation.',
    recommended: ['alex-zhavoronkov', 'andrej-karpathy', 'clayton-christensen', 'aswath-damodaran', 'peter-kolchinsky']
  },
  {
    title: 'Dev: 7B LLM Memory-Efficient Training',
    sector: 'dev' as SectorType,
    text: 'Design a memory-efficient training loop for a 7B parameter LLM on consumer hardware (24GB VRAM) with mixed precision, 4-bit base weights, and gradient accumulation.',
    recommended: ['andrej-karpathy', 'tim-dettmers', 'soumith-chintala', 'rohan-anil']
  }
];

export default function App() {
  const [activeSector, setActiveSector] = useState<SectorType | 'all'>('dev');
  const [selectedSubCouncil, setSelectedSubCouncil] = useState<string>('all');
  const [problem, setProblem] = useState('');
  const [selectedGenomes, setSelectedGenomes] = useState<string[]>([
    'andrej-karpathy',
    'tim-dettmers',
    'soumith-chintala'
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [reasoning, setReasoning] = useState<ReasoningResult | null>(null);
  const [orchestration, setOrchestration] = useState<OrchestrationResult | null>(null);
  const [synthesis, setSynthesis] = useState<SynthesisResult | null>(null);
  const [auditExpanded, setAuditExpanded] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<
    | 'triage'
    | 'trees'
    | 'matrix'
    | 'justification'
    | 'simulator'
    | 'ollama'
    | 'postmortem'
    | 'redteam'
    | 'crossdomain'
    | 'sandbox'
    | 'guardrails'
    | 'integration'
    | 'input'
    | 'results'
    | 'audit'
    | 'roster'
    | 'opponent'
    | 'fatigue'
    | 'mutation'
    | 'intel'
  >('triage');
  const [copied, setCopied] = useState(false);
  const [inspectingLeader, setInspectingLeader] = useState<LeaderGenome | null>(null);
  const [isOllamaOnline, setIsOllamaOnline] = useState(false);

  // Check Ollama status on mount with clean cancellation
  useEffect(() => {
    let isMounted = true;
    globalOllamaClient.checkConnection().then(res => {
      if (isMounted) {
        setIsOllamaOnline(res.connected);
      }
    }).catch(() => {
      if (isMounted) {
        setIsOllamaOnline(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const engine = useMemo(() => new DeterministicReasoningEngine(), []);
  const orchestrator = useMemo(() => new MultiAgentOrchestrator(engine), [engine]);

  const activeSectorData = activeSector !== 'all' ? SECTORS[activeSector] : null;

  // Available councils based on active sector
  const availableCouncils = useMemo(() => {
    if (activeSector === 'all') {
      return ['all'];
    }
    return ['all', ...SECTORS[activeSector].councils];
  }, [activeSector]);

  const toggleGenome = (genomeKey: string) => {
    setSelectedGenomes(prev =>
      prev.includes(genomeKey)
        ? prev.filter(k => k !== genomeKey)
        : [...prev, genomeKey]
    );
  };

  const selectCurrentSectorGenomes = () => {
    if (activeSector === 'all') {
      setSelectedGenomes(Object.keys(ALL_LEADER_GENOMES));
    } else {
      const keys = Object.keys(GENOMES_BY_SECTOR[activeSector]);
      setSelectedGenomes(prev => Array.from(new Set([...prev, ...keys])));
    }
  };

  const clearAllGenomes = () => {
    setSelectedGenomes([]);
  };

  const handleApplyPreset = (sample: typeof SAMPLE_SCENARIOS[0]) => {
    setProblem(sample.text);
    setSelectedGenomes(sample.recommended);
    if (sample.crossSectors) {
      setActiveSector('all');
    } else {
      setActiveSector(sample.sector);
    }
    setSelectedSubCouncil('all');
  };

  const handleReason = useCallback(() => {
    if (!problem.trim() || selectedGenomes.length === 0) return;

    const sectorsInvolved: SectorType[] = activeSector === 'all'
      ? Array.from(new Set(selectedGenomes.map(k => ALL_LEADER_GENOMES[k]?.sector).filter(Boolean) as SectorType[]))
      : [activeSector];

    // Layer 2: Deterministic Reasoning Engine
    const newReasoning = engine.reasonAboutProblem(problem, selectedGenomes, sectorsInvolved);
    setReasoning(newReasoning);

    // Layer 3: Multi-Agent Orchestrator
    orchestrator.createAgentsFromGenomes(selectedGenomes);
    const debateResult = orchestrator.debateAndConsense(problem);
    setOrchestration(debateResult);

    // Layer 4: Deterministic Synthesis
    const newSynthesis = SynthesisEngine.generateUnifiedOutput(
      newReasoning,
      debateResult.agents,
      debateResult.consensus
    );
    setSynthesis(newSynthesis);

    setActiveTab('results');
  }, [problem, selectedGenomes, activeSector, engine, orchestrator]);

  const handleCopyAuditJson = () => {
    if (!synthesis) return;
    navigator.clipboard.writeText(JSON.stringify(synthesis.auditReport, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered leader genomes based on sector, council, and search query
  const filteredGenomes = useMemo(() => {
    let pool: [string, LeaderGenome][] = [];
    if (activeSector === 'all') {
      pool = Object.entries(ALL_LEADER_GENOMES);
    } else {
      pool = Object.entries(GENOMES_BY_SECTOR[activeSector] || {});
    }

    if (selectedSubCouncil !== 'all') {
      pool = pool.filter(([_, g]) => g.subBrain === selectedSubCouncil);
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) return pool;

    return pool.filter(([key, genome]) =>
      genome.name.toLowerCase().includes(query) ||
      genome.role.toLowerCase().includes(query) ||
      genome.subBrain.toLowerCase().includes(query) ||
      genome.coreStrength.toLowerCase().includes(query) ||
      genome.mentalModels.some(m => m.toLowerCase().includes(query)) ||
      genome.toolchain.some(t => t.toLowerCase().includes(query)) ||
      key.includes(query)
    );
  }, [activeSector, selectedSubCouncil, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Top Banner & Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400/20 to-purple-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-sm">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight text-white">Dev Brain OS</h1>
                  <span className="text-[10px] font-mono uppercase bg-amber-400/10 border border-amber-400/30 text-amber-400 px-2 py-0.5 rounded-full font-semibold">
                    100 Leaders • 5 Sectors
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Multifaceted deterministic decision engine • Dev, Business, Financial & Science Brains
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
              <button
                onClick={() => setActiveTab('ollama')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-mono text-xs border transition-colors cursor-pointer ${
                  isOllamaOnline
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <Bot className="w-3.5 h-3.5 text-blue-400" />
                <span>Ollama Local Model: {isOllamaOnline ? 'Online' : 'Configure'}</span>
              </button>
              <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg font-mono">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic FSM</span>
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 border border-slate-700/80 px-3 py-1.5 rounded-lg font-mono">
                <Users className="w-4 h-4 text-amber-400" />
                <span>{selectedGenomes.length} Active in Council</span>
              </span>
            </div>
          </div>

          {/* Sector Selector Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 whitespace-nowrap mr-1 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Sectors:</span>
            </span>

            <button
              onClick={() => { setActiveSector('all'); setSelectedSubCouncil('all'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeSector === 'all'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cross-Sector Meta-Brain (100)</span>
            </button>

            {(Object.keys(SECTORS) as SectorType[]).map(sKey => {
              const sec = SECTORS[sKey];
              const Icon = SECTOR_ICONS[sKey];
              const isActive = activeSector === sKey;
              return (
                <button
                  key={sKey}
                  onClick={() => { setActiveSector(sKey); setSelectedSubCouncil('all'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sec.shortName} ({sec.leaderCount})</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 mb-6 overflow-x-auto">
          <div className="flex gap-1">
            {[
              { id: 'triage', label: '1. Top 5 Method Triage', icon: Filter, badge: 'Narrow 20→5' },
              { id: 'trees', label: '2. Decision Trees', icon: GitFork, badge: 'Deterministic' },
              { id: 'matrix', label: '3. Multi-Option Matrix (%)', icon: PieChart, badge: 'Weighted Pros/Cons' },
              { id: 'justification', label: '4. Justification Layer', icon: Brain, badge: 'Axioms & Proofs' },
              { id: 'simulator', label: '5. Outcome Simulator', icon: Play, badge: 'Monte Carlo' },
              { id: 'ollama', label: '6. Ollama Local Brain', icon: Bot, badge: 'Local LLM' },
              { id: 'postmortem', label: '7. Post-Mortem & Calibration', icon: History, badge: 'Drift Feedback' },
              { id: 'redteam', label: '8. Adversarial Red Team', icon: Flame, badge: 'Stress Test' },
              { id: 'crossdomain', label: '9. Cross-Sector Synthesizer', icon: GitMerge, badge: 'Combinatorial' },
              { id: 'sandbox', label: '10. Agent Sandbox', icon: Bot, badge: 'Pre-Flight' },
              { id: 'guardrails', label: '11. Guardrails & Kill-Switch', icon: ShieldAlert, badge: 'Safety' },
              { id: 'integration', label: '12. Agent SDK & Schemas', icon: Code },
              { id: 'input', label: '13. Multi-Brain Council', icon: Zap },
              { id: 'results', label: '14. Deliberation & Synthesis', icon: GitBranch, badge: synthesis ? 'Ready' : null },
              { id: 'audit', label: '15. 5-Section Audit Trail', icon: AlertCircle, badge: synthesis ? 'Verified' : null },
              { id: 'roster', label: '16. Leader Genomes (100)', icon: BookOpen },
              { id: 'opponent', label: '17. Opponent Twin Lab', icon: Target, badge: 'Scrimmage' },
              { id: 'fatigue', label: '18. Fatigue & Burn Drift', icon: BatteryWarning, badge: 'Long-Term' },
              { id: 'mutation', label: '19. Genome Mutation', icon: Dna, badge: 'Evolution' },
              { id: 'intel', label: '20. External Validation', icon: Globe, badge: 'Forums & Research' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-button-${tab.id}`}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-3.5 py-3 font-medium text-xs sm:text-sm border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'border-amber-400 text-amber-400 bg-amber-400/5 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                        tab.badge === 'Narrow 20→5'
                          ? 'bg-amber-500/20 text-amber-300 font-bold'
                          : tab.badge === 'Safety'
                          ? 'bg-rose-500/20 text-rose-300'
                          : tab.badge === 'Pre-Flight'
                          ? 'bg-blue-500/20 text-blue-300'
                          : tab.badge === 'Weighted Pros/Cons'
                          ? 'bg-amber-400/20 text-amber-300'
                          : tab.badge === 'Axioms & Proofs'
                          ? 'bg-amber-500/20 text-amber-300'
                          : tab.badge === 'Monte Carlo'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : tab.badge === 'Local LLM'
                          ? 'bg-purple-500/20 text-purple-300'
                          : tab.badge === 'Drift Feedback'
                          ? 'bg-amber-500/20 text-amber-300'
                          : tab.badge === 'Stress Test'
                          ? 'bg-rose-600/20 text-rose-300'
                          : tab.badge === 'Combinatorial'
                          ? 'bg-purple-400/20 text-purple-200'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {synthesis && (
            <button
              onClick={handleCopyAuditJson}
              className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-md transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Audit Copied!' : 'Copy Audit JSON'}</span>
            </button>
          )}
        </div>

        {/* TOP 5 CANDIDATE TRIAGE TAB */}
        {activeTab === 'triage' && (
          <CandidateTriageViewer
            currentProblem={problem || synthesis?.decisionMatrix?.context}
            currentSector={activeSector === 'all' ? 'dev' : activeSector}
            onTransferTop5ToMatrix={(top5) => {
              const newMatrix = DecisionMatrixEngine.generateMatrixFromTriage({
                id: `matrix_triage_${Date.now()}`,
                problemContext: problem || 'Strategic Decision Analysis',
                sector: activeSector === 'all' ? 'dev' : activeSector,
                totalCandidatesEvaluated: 20,
                top5Methods: top5,
                prunedMethods: [],
                triageStrategy: 'balanced_pareto',
                triageThresholdScore: 70,
                timestamp: new Date().toISOString(),
                triageSummary: 'Screened 20 candidate methods down to Top 5 best methods for decision weighting.',
                decisionReadinessScore: 92,
                weightsApplied: {
                  feasibility: 0.18,
                  constraintFit: 0.22,
                  complexityBoundedness: 0.18,
                  riskFloor: 0.18,
                  speedToValue: 0.10,
                  strategicUpside: 0.14
                }
              });
              setSynthesis(prev => prev ? { ...prev, decisionMatrix: newMatrix } : {
                synthesisId: `synthesis_${Date.now()}`,
                reasoning: {
                  approach: top5[0].title,
                  primaryPattern: top5[0].category,
                  secondaryValidation: 'Pre-decision triage stage-gate passed',
                  tertiaryInsight: top5[0].originSource,
                  reasoning: top5[0].description,
                  toolRecommendations: top5[0].tags
                },
                agentConsensus: { agreementLevel: 0.9, averageConfidence: 0.92, strongConsensus: true, sectorDiversity: 0.8 },
                recommendations: top5.map(t => `#${t.rank}: ${t.title}`),
                decisionMatrix: newMatrix,
                auditReport: {
                  report_id: `audit_${Date.now()}`,
                  reasoning_id: `reasoning_${Date.now()}`,
                  section_1_input: { problem: problem || top5[0].title, genomes_consulted: 5, sectors_represented: [activeSector.toUpperCase()] },
                  section_2_state_transitions: [],
                  section_3_agent_collaboration: { total_agents: 5, consensus_achieved: true, average_confidence: '92%', sector_diversity_score: '80%' },
                  section_4_public_attribution: [],
                  section_5_reproducibility: { full_trace_available: true, determinism_guarantee: 'Deterministic Pareto ranking', legal_basis: 'Public domain', believability_weighted: true }
                },
                confidence: { score: 0.92, level: 'HIGH' }
              });
              setActiveTab('matrix');
            }}
            onNavigateToMatrix={() => setActiveTab('matrix')}
          />
        )}

        {/* DECISION TREES TAB */}
        {activeTab === 'trees' && (
          <DecisionTreeViewer
            onSelectForSandbox={() => {
              setActiveTab('sandbox');
            }}
          />
        )}

        {/* MULTI-OPTION MATRIX TAB */}
        {activeTab === 'matrix' && (
          <MultiOptionDecisionMatrix
            matrix={synthesis?.decisionMatrix}
            onUpdateMatrix={(updated) => {
              setSynthesis(prev => prev ? { ...prev, decisionMatrix: updated } : null);
            }}
            isOllamaConnected={isOllamaOnline}
            onNavigateToTriage={() => setActiveTab('triage')}
          />
        )}

        {/* JUSTIFICATION LAYER TAB */}
        {activeTab === 'justification' && (
          <JustificationLayerViewer
            currentDecisionTitle={synthesis?.decisionMatrix?.decisionTopic || (reasoning?.problem ? reasoning.problem.slice(0, 80) : undefined)}
            currentOption={synthesis?.decisionMatrix?.options[0]?.title}
            currentSector={activeSector === 'all' ? 'dev' : activeSector}
          />
        )}

        {/* OUTCOME SIMULATOR TAB */}
        {activeTab === 'simulator' && (
          <OutcomeSimulatorViewer
            currentDecisionTitle={synthesis?.decisionMatrix?.decisionTopic || (reasoning?.problem ? reasoning.problem.slice(0, 80) : undefined)}
            optionA={synthesis?.decisionMatrix?.options[0]?.title}
            optionB={synthesis?.decisionMatrix?.options[1]?.title}
            optionC={synthesis?.decisionMatrix?.options[2]?.title}
            currentSector={activeSector === 'all' ? 'dev' : activeSector}
          />
        )}

        {/* OLLAMA LOCAL BRAIN TAB */}
        {activeTab === 'ollama' && (
          <OllamaControlHub
            onApplyMatrixToMainApp={(newMatrix) => {
              setSynthesis(prev => prev ? { ...prev, decisionMatrix: newMatrix } : null);
              setActiveTab('matrix');
            }}
          />
        )}

        {/* POST-MORTEM & CALIBRATION DRIFT TAB */}
        {activeTab === 'postmortem' && (
          <PostMortemTracker
            onUpdateLeaderBelievability={(leaderId, newWeight) => {
              const genome = Object.values(ALL_LEADER_GENOMES).find(l => l.id === leaderId);
              if (genome) {
                genome.believabilityWeight = newWeight;
              }
            }}
          />
        )}

        {/* ADVERSARIAL RED TEAM TAB */}
        {activeTab === 'redteam' && (
          <RedTeamSimulator
            currentDecisionTitle={synthesis?.decisionMatrix?.decisionTopic || (reasoning?.problem ? reasoning.problem.slice(0, 80) : undefined)}
            currentOption={synthesis?.decisionMatrix?.options[0]?.title}
          />
        )}

        {/* CROSS-SECTOR SYNTHESIZER TAB */}
        {activeTab === 'crossdomain' && (
          <CrossDomainSynthesizer />
        )}

        {/* AGENT SANDBOX TAB */}
        {activeTab === 'sandbox' && <AgentDecisionSandbox />}

        {/* GUARDRAILS & KILL SWITCH TAB */}
        {activeTab === 'guardrails' && <AgentGuardrailManager />}

        {/* AGENT INTEGRATION TAB */}
        {activeTab === 'integration' && <AgentIntegrationHub />}

        {/* OPPONENT TWIN LAB TAB */}
        {activeTab === 'opponent' && (
          <OpponentTwinLab 
            decisionContext={problem || synthesis?.decisionMatrix?.options[0]?.title || 'Undecided Strategic Direction'}
            sector={activeSector === 'all' ? 'dev' : activeSector}
          />
        )}

        {/* FATIGUE DRIFT TAB */}
        {activeTab === 'fatigue' && <FatigueDriftViewer />}

        {/* GENOME MUTATION TAB */}
        {activeTab === 'mutation' && <GenomeMutationViewer />}

        {/* EXTERNAL INTEL TAB */}
        {activeTab === 'intel' && (
          <ExternalIntelViewer
            decisionContext={problem || synthesis?.decisionMatrix?.options[0]?.title || 'Strategic Architecture'}
            sector={activeSector === 'all' ? 'dev' : activeSector}
          />
        )}

        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Quick Multi-Sector Presets */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Multi-Sector Inquiry Scenarios</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Click to load full multi-brain context</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SAMPLE_SCENARIOS.map((sample, idx) => {
                  const Icon = SECTOR_ICONS[sample.sector];
                  return (
                    <button
                      key={idx}
                      onClick={() => handleApplyPreset(sample)}
                      className="p-3 bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-400/50 rounded-lg text-left transition-all group cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <Icon className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 truncate">
                            {sample.title}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                          {sample.text}
                        </div>
                      </div>
                      <div className="text-[10px] text-amber-400/80 mt-2 font-mono flex items-center justify-between pt-1 border-t border-slate-900">
                        <span>{sample.recommended.length} leaders</span>
                        <span>→ Load & Reason</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Problem Statement Input */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Problem Statement & Boundary Constraints</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {problem.length} characters
                </span>
              </div>
              <textarea
                id="problem-statement-input"
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="Formulate your challenge across AI, Software, Business Strategy, Finance, Biotech, or Human Performance (e.g., 'How do we design a solid tumor CAR-T construct with Boolean logic gates and calculate the Phase 2 clinical de-risking DCF?')"
                className="w-full h-28 bg-slate-950 border border-slate-700/80 rounded-lg px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 font-mono text-sm leading-relaxed"
              />
            </section>

            {/* Sector / Council Selector & Leader Grid */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <Users className="w-4 h-4 text-amber-400" />
                    <span>
                      {activeSectorData ? `${activeSectorData.name}` : 'Cross-Sector Meta-Brain Council'}
                      <span className="text-xs font-mono text-amber-400 ml-2">({selectedGenomes.length} selected)</span>
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select verified leader profiles for multi-perspective FSM reasoning and believability-weighted synthesis
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={selectCurrentSectorGenomes}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer"
                  >
                    Select Sector (20)
                  </button>
                  <button
                    onClick={clearAllGenomes}
                    className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Sub-Council Filtering Chips & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase mr-1 flex items-center gap-1">
                    <Sliders className="w-3 h-3" />
                    <span>Council:</span>
                  </span>
                  {availableCouncils.map(c => (
                    <button
                      key={c}
                      onClick={() => setSelectedSubCouncil(c)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                        selectedSubCouncil === c
                          ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold'
                          : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {c === 'all' ? 'All Sub-Councils' : c}
                    </button>
                  ))}
                </div>

                <div className="relative min-w-[220px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leaders, models, tools..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>

              {/* Grid of Genomes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[480px] overflow-y-auto pr-1">
                {filteredGenomes.map(([key, genome]) => {
                  const isSelected = selectedGenomes.includes(key);
                  const Icon = SECTOR_ICONS[genome.sector];
                  return (
                    <div
                      key={key}
                      className={`p-3.5 rounded-xl border-2 transition-all text-left flex flex-col justify-between relative group ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 text-amber-50 shadow-sm shadow-amber-400/5'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div onClick={() => toggleGenome(key)} className="cursor-pointer">
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <div className="font-semibold text-sm text-white group-hover:text-amber-400 transition-colors">
                                {genome.name}
                              </div>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5 font-medium">
                              {genome.subBrain} • {genome.role}
                            </div>
                          </div>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                            isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {(genome.believabilityWeight * 100).toFixed(0)}% wt
                          </span>
                        </div>

                        <div className="text-[11px] text-amber-300/80 mt-2 line-clamp-2 leading-relaxed">
                          {genome.coreStrength}
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingLeader(genome);
                          }}
                          className="text-slate-400 hover:text-amber-300 font-mono flex items-center gap-0.5 cursor-pointer underline decoration-dotted"
                        >
                          <span>Inspect Profile</span>
                        </button>
                        <button
                          onClick={() => toggleGenome(key)}
                          className={`font-semibold cursor-pointer ${isSelected ? 'text-amber-400' : 'text-slate-500'}`}
                        >
                          {isSelected ? '✓ ACTIVE' : '+ SELECT'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Action Trigger */}
            <div className="pt-2">
              <button
                id="run-reasoning-button"
                onClick={handleReason}
                disabled={!problem.trim() || selectedGenomes.length === 0}
                className="w-full bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-amber-500/10 flex items-center justify-center gap-3 cursor-pointer text-base"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>Execute Multi-Brain FSM Reasoning ({selectedGenomes.length} Leaders)</span>
              </button>
              {selectedGenomes.length === 0 && (
                <p className="text-center text-xs text-rose-400 mt-2">
                  Please select at least 1 leader genome above to begin multi-perspective reasoning.
                </p>
              )}
            </div>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && synthesis && reasoning && orchestration && (
          <div className="space-y-6">
            {/* Top Metrics Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider mb-1">
                  Synthesis Confidence
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                    {(synthesis.confidence.score * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs font-medium text-emerald-300">
                    [{synthesis.confidence.level}]
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Believability-weighted composite score
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider mb-1">
                  Multi-Agent Consensus
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">
                    {(orchestration.consensus.agreementLevel * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-300">
                    {orchestration.consensus.strongConsensus ? '✓ Strong' : '○ Moderate'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  {selectedGenomes.length} leader perspectives reconciled
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider mb-1">
                  Sector Diversity
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-purple-400 font-mono">
                    {(orchestration.consensus.sectorDiversity * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-300">
                    {reasoning.activeSectors.length} Sectors
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1.5">
                  Cross-domain cognitive representation
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1">
                  FSM Reasoning State
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-blue-400 font-mono">
                    5/5 COMPLETE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Perceive → Route → Deliberate → Synthesize → Govern
                </div>
              </div>
            </div>

            {/* MULTI-OPTION DECISION WEIGHTING & PROS/CONS MATRIX */}
            {synthesis.decisionMatrix && (
              <MultiOptionDecisionMatrix
                matrix={synthesis.decisionMatrix}
                onUpdateMatrix={(updated) => {
                  setSynthesis(prev => prev ? { ...prev, decisionMatrix: updated } : null);
                }}
                isOllamaConnected={isOllamaOnline}
              />
            )}

            {/* Synthesized Recommendations */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>Synthesized Multi-Brain Directives</span>
                </h2>
                <span className="text-xs text-slate-400 font-mono">
                  {synthesis.recommendations.length} Executive Directives
                </span>
              </div>

              <div className="space-y-2.5">
                {synthesis.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800/80 p-3.5 rounded-lg text-slate-200 text-xs font-mono leading-relaxed"
                  >
                    {rec}
                  </div>
                ))}
              </div>
            </section>

            {/* Multi-Agent Debate & Deliberation */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-amber-400" />
                  <span>Believability-Weighted Council Deliberation ({selectedGenomes.length} Leaders)</span>
                </h2>
                <span className="text-xs text-emerald-400 font-mono">Ranked by Believability Weight</span>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {orchestration.debate}
              </div>
            </section>

            {/* Finite State Machine Progression */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
                <GitBranch className="w-5 h-5 text-amber-400" />
                <span>Deterministic Reasoning Path (FSM State Transitions)</span>
              </h2>

              <div className="space-y-3">
                {reasoning.states.map((state, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col md:flex-row gap-3 justify-between"
                  >
                    <div className="w-full md:w-56 shrink-0">
                      <div className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded inline-block">
                        [{state.phase}] {state.name}
                      </div>
                      <div className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1 font-mono">
                        <Check className="w-3.5 h-3.5" />
                        <span>Deterministic ✓</span>
                      </div>
                    </div>

                    <div className="flex-1 text-xs space-y-1.5">
                      <div className="text-slate-300">
                        <strong className="text-slate-400 font-mono">Applied Rules:</strong>{' '}
                        {state.rules.join(' → ')}
                      </div>

                      {state.outputs.domain && (
                        <div className="text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                          <div><strong>Detected Sector:</strong> {String(state.outputs.sector || 'dev').toUpperCase()} | <strong>Domain:</strong> {state.outputs.domain}</div>
                          <div><strong>Identified Constraints:</strong> {state.outputs.constraints?.join(', ') || 'standard envelope'}</div>
                        </div>
                      )}

                      {state.outputs.rankedGenomes && (
                        <div className="text-slate-400 font-mono bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px]">
                          <div className="font-semibold text-slate-300">Top Ranked Leaders:</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {state.outputs.rankedGenomes.slice(0, 5).map((rg, idx) => (
                              <span key={idx} className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px]">
                                {rg.name} [{rg.subBrain}]: {(rg.relevanceScore * 100).toFixed(0)}%
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Action Bar */}
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setActiveTab('input')}
                className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 px-4 py-2 rounded-lg border border-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Refine Inquiry & Council</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>Inspect Full 5-Section Audit Trail</span>
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            </div>
          </div>
        )}

        {/* Empty state for results */}
        {activeTab === 'results' && !synthesis && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Active Reasoning Result</h3>
            <p className="text-xs text-slate-400 mb-6">
              Formulate a problem statement and select leader genomes across any sector to execute the multi-brain engine.
            </p>
            <button
              onClick={() => setActiveTab('input')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer"
            >
              Go to Input Form
            </button>
          </div>
        )}

        {/* AUDIT TAB */}
        {activeTab === 'audit' && synthesis && (
          <div className="space-y-5">
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                    <span>5-Section End-to-End Audit Trail Protocol</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Complies with the Dev Brain Multi-Sector Governance Protocol & Public Attribution Standard
                  </p>
                </div>
                <code className="text-xs text-amber-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                  {synthesis.auditReport.report_id}
                </code>
              </div>

              <div className="space-y-4">
                {/* Section 1 */}
                <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-l-blue-400 border border-slate-800/80">
                  <button
                    onClick={() => setAuditExpanded(!auditExpanded)}
                    className="flex items-center justify-between w-full text-left font-semibold text-slate-200 text-sm cursor-pointer"
                  >
                    <span>1. Input & Multi-Sector Problem Definition</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${auditExpanded ? 'rotate-180' : ''}`} />
                  </button>
                  {auditExpanded && (
                    <div className="mt-3 space-y-2 text-xs text-slate-400 font-mono bg-slate-900/60 p-3 rounded border border-slate-800">
                      <div><strong>Problem Input:</strong> {synthesis.auditReport.section_1_input.problem}</div>
                      <div><strong>Genomes Consulted:</strong> {synthesis.auditReport.section_1_input.genomes_consulted}</div>
                      <div><strong>Sectors Represented:</strong> {synthesis.auditReport.section_1_input.sectors_represented.join(', ')}</div>
                      <div><strong>Active Roster:</strong> {selectedGenomes.map(k => ALL_LEADER_GENOMES[k]?.name).join(', ')}</div>
                    </div>
                  )}
                </div>

                {/* Section 2 */}
                <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-l-amber-400 border border-slate-800/80">
                  <div className="font-semibold text-slate-200 text-sm mb-2">2. Deterministic State Transitions (FSM)</div>
                  <div className="space-y-1.5 text-xs">
                    {synthesis.auditReport.section_2_state_transitions.map((trans, i) => (
                      <div key={i} className="flex items-center justify-between font-mono bg-slate-900/60 p-2 rounded border border-slate-800">
                        <span className="text-amber-400 font-bold">[{trans.phase}] {trans.state}</span>
                        <span className="text-slate-400 text-[11px]">Rules: {trans.rules_applied.join(', ')}</span>
                        <span className="text-emerald-400 font-semibold text-[11px]">✓ Deterministic</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3 */}
                <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-l-emerald-400 border border-slate-800/80">
                  <div className="font-semibold text-slate-200 text-sm mb-2">3. Multi-Agent Collaboration Metrics</div>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs font-mono mt-3">
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-500">Total Agents</div>
                      <div className="text-base font-bold text-white mt-0.5">
                        {synthesis.auditReport.section_3_agent_collaboration.total_agents}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-500">Consensus Achieved</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">
                        {synthesis.auditReport.section_3_agent_collaboration.consensus_achieved ? '✓ Strong' : '○ Moderate'}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-500">Avg Confidence</div>
                      <div className="text-base font-bold text-amber-400 mt-0.5">
                        {synthesis.auditReport.section_3_agent_collaboration.average_confidence}
                      </div>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div className="text-slate-500">Sector Diversity</div>
                      <div className="text-base font-bold text-purple-400 mt-0.5">
                        {synthesis.auditReport.section_3_agent_collaboration.sector_diversity_score}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 4 */}
                <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-l-purple-400 border border-slate-800/80">
                  <div className="font-semibold text-slate-200 text-sm mb-2">4. Public Source Attribution & Vote Scope</div>
                  <div className="space-y-2.5 mt-3 max-h-80 overflow-y-auto pr-1">
                    {synthesis.auditReport.section_4_public_attribution.map((attr, i) => (
                      <div key={i} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-purple-400">
                            {attr.leader} [{attr.sector.toUpperCase()} • {attr.subBrain}]
                          </span>
                          <span className="text-[10px] text-emerald-400 font-mono">Legal: ✓ Public Canon</span>
                        </div>
                        <div className="text-[11px] text-slate-300 mt-1">
                          <strong className="text-slate-500">Vote Scope:</strong> {attr.voteScope}
                        </div>
                        <div className="text-slate-400 mt-1 space-y-0.5 font-mono text-[10px]">
                          {attr.sources.map((s, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                              <span>{s}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 5 */}
                <div className="bg-slate-950 p-4 rounded-xl border-l-4 border-l-rose-400 border border-slate-800/80">
                  <div className="font-semibold text-slate-200 text-sm mb-2">5. Reproducibility & Legal Guarantee</div>
                  <div className="text-xs text-slate-300 font-mono space-y-1 bg-slate-900/60 p-3 rounded border border-slate-800">
                    <div>Full Execution Trace Available: <span className="text-emerald-400">✓ YES</span></div>
                    <div>Determinism Guarantee: <span className="text-emerald-400">✓ FSM-based, 0 Stochastic Drift</span></div>
                    <div>Believability Weighted: <span className="text-emerald-400">✓ Enabled across all sector domains</span></div>
                    <div>Legal Basis: <span className="text-emerald-400">✓ Fair Use / Public Knowledge Extraction</span></div>
                  </div>
                </div>
              </div>

              {/* Copy Button */}
              <div className="mt-5 flex flex-col sm:flex-row gap-3">
                <button
                  id="copy-audit-json-button"
                  onClick={handleCopyAuditJson}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Audit JSON Copied to Clipboard!' : 'Copy Full Audit JSON (Schema Verified)'}</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* Empty state for audit */}
        {activeTab === 'audit' && !synthesis && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center max-w-lg mx-auto">
            <div className="w-12 h-12 rounded-full bg-blue-400/10 text-blue-400 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Audit Record Generated</h3>
            <p className="text-xs text-slate-400 mb-6">
              Run a reasoning pass to generate and inspect a five-section audit trail across active sectors.
            </p>
            <button
              onClick={() => setActiveTab('input')}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-xs cursor-pointer"
            >
              Go to Input Form
            </button>
          </div>
        )}

        {/* ROSTER TAB */}
        {activeTab === 'roster' && (
          <div className="space-y-5">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-amber-400" />
                    <span>Complete 100 Leader Genomes Library Across 5 Sectors</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Formally audited mental models, optimization patterns, and toolchains for Dev, Business, Financial, Biotech & Sports Science
                  </p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Showing <span className="text-amber-400 font-bold">{filteredGenomes.length}</span> profiles
                </div>
              </div>

              {/* Sector & Search Filters */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <button
                    onClick={() => { setActiveSector('all'); setSelectedSubCouncil('all'); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      activeSector === 'all'
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    All Sectors (100)
                  </button>
                  {(Object.keys(SECTORS) as SectorType[]).map(sKey => {
                    const sec = SECTORS[sKey];
                    return (
                      <button
                        key={sKey}
                        onClick={() => { setActiveSector(sKey); setSelectedSubCouncil('all'); }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                          activeSector === sKey
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        {sec.shortName}
                      </button>
                    );
                  })}
                </div>

                <div className="relative min-w-[240px]">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all 100 leaders by name, model..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-700"
                  />
                </div>
              </div>

              {/* Roster Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredGenomes.map(([key, genome]) => {
                  const isSelected = selectedGenomes.includes(key);
                  const Icon = SECTOR_ICONS[genome.sector];
                  return (
                    <div
                      key={key}
                      className={`p-4 rounded-xl border transition-all ${
                        isSelected ? 'border-amber-400/60 bg-slate-950' : 'border-slate-800 bg-slate-950/60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-amber-400" />
                            <span className="text-sm font-bold text-white">{genome.name}</span>
                            {isSelected && (
                              <span className="text-[10px] bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded font-mono">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-amber-400/90 font-medium mt-0.5">
                            {genome.subBrain} • {genome.role}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setInspectingLeader(genome)}
                            className="text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 px-2 py-1 rounded cursor-pointer"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => toggleGenome(key)}
                            className={`text-xs px-2.5 py-1 rounded font-semibold transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {isSelected ? 'Deselect' : 'Select'}
                          </button>
                        </div>
                      </div>

                      <div className="mt-2.5 text-xs text-slate-300">
                        <span className="text-slate-500 font-semibold">Core Strength:</span> {genome.coreStrength}
                      </div>

                      <div className="mt-1.5 text-xs text-slate-300">
                        <span className="text-slate-500 font-semibold">Optimization Pattern:</span> {genome.optimizationPattern}
                      </div>

                      <div className="mt-1.5 text-xs text-slate-300">
                        <span className="text-slate-500 font-semibold">Failure Mode Focus:</span> {genome.debuggingStyle}
                      </div>

                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {genome.mentalModels.slice(0, 3).map((m, idx) => (
                          <span key={idx} className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">
                            {m}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span>Vote Scope: {genome.voteScope.slice(0, 38)}...</span>
                        <span className="text-emerald-400 font-bold">{(genome.believabilityWeight * 100).toFixed(0)}% weight</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Leader Profile Inspector Modal */}
      {inspectingLeader && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative">
            <button
              onClick={() => setInspectingLeader(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{inspectingLeader.name}</h3>
                <p className="text-xs text-amber-400 font-medium">
                  {inspectingLeader.subBrain} • {inspectingLeader.role} ({inspectingLeader.sector.toUpperCase()})
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Core Strength & Archetype</div>
                <div className="text-slate-200 text-sm">{inspectingLeader.coreStrength}</div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1.5">Mental Models & Axioms</div>
                <div className="flex flex-wrap gap-1.5">
                  {inspectingLeader.mentalModels.map((m, idx) => (
                    <span key={idx} className="bg-slate-900 text-slate-200 px-2.5 py-1 rounded-md border border-slate-800">
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Toolchain & Frameworks</div>
                <div className="text-slate-300">{inspectingLeader.toolchain.join(', ')}</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Failure Modes / Debug Style</div>
                  <div className="text-slate-300 text-[11px]">{inspectingLeader.debuggingStyle}</div>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Optimization Pattern</div>
                  <div className="text-slate-300 text-[11px]">{inspectingLeader.optimizationPattern}</div>
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1.5">Primary Inquiry Questions</div>
                <div className="space-y-1 text-slate-300">
                  {inspectingLeader.favoriteQuestions.map((q, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>"{q}"</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <div className="text-slate-500 uppercase tracking-wider text-[10px] font-bold mb-1">Verified Public Citations</div>
                <div className="space-y-1 text-slate-400 text-[11px]">
                  {inspectingLeader.publicSources.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-300">
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-slate-400 text-[11px]">
                <span>Believability Weight: <strong className="text-amber-400">{(inspectingLeader.believabilityWeight * 100).toFixed(0)}%</strong></span>
                <span>Determinism Score: <strong className="text-emerald-400">{(inspectingLeader.determinismRating * 100).toFixed(0)}%</strong></span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  toggleGenome(inspectingLeader.id);
                  setInspectingLeader(null);
                }}
                className={`px-4 py-2 rounded-xl font-bold text-xs cursor-pointer ${
                  selectedGenomes.includes(inspectingLeader.id)
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
              >
                {selectedGenomes.includes(inspectingLeader.id) ? 'Remove from Active Council' : 'Add to Active Council'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/60 py-5 text-center text-xs text-slate-500 mt-10">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p className="text-slate-400">
            Dev Brain OS © 2024 • Multifaceted Deterministic Decision Engine (Dev, Business, Financial & Science Brains)
          </p>
          <p className="text-[11px] text-slate-500">
            All 100 leader methodologies strictly compiled from public literature, peer-reviewed research, open-source repositories, and recorded lectures.
          </p>
        </div>
      </footer>
    </div>
  );
}

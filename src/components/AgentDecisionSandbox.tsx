import { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Copy,
  Check,
  Play,
  Sparkles,
  Bot,
  Activity,
  DollarSign,
  Users,
  Server,
  Scale
} from 'lucide-react';
import {
  AgentActionPayload,
  AgentDecisionVerdict,
  DecisionDomain
} from '../types';
import { AgentIntegrationEngine } from '../engine/agentIntegrationEngine';

const PRESET_AGENT_SCENARIOS: {
  title: string;
  category: string;
  expectedVerdict: 'APPROVED' | 'REJECTED' | 'ESCALATE_TO_FOUNDER';
  payload: AgentActionPayload;
}[] = [
  {
    title: 'Sales Agent: Deep 35% Enterprise Deal Discount',
    category: 'Revenue & Pricing',
    expectedVerdict: 'REJECTED',
    payload: {
      agentId: 'agent-sales-enterprise-01',
      agentName: 'Enterprise Deal Closer',
      actionType: 'pricing_discount',
      actionSummary: 'Issue formal quote with 35% discount on Enterprise tier for ACME Corp on monthly billing.',
      intent: 'Close end-of-quarter deal against competitor.',
      callerEnvironment: 'production',
      parameters: {
        discount_percentage: 35,
        is_annual_prepaid: false,
        projected_gross_margin: 55,
        has_custom_liabilities: false
      }
    }
  },
  {
    title: 'DevOps Agent: Production Schema DROP COLUMN Without Backup',
    category: 'Infrastructure & DB',
    expectedVerdict: 'REJECTED',
    payload: {
      agentId: 'agent-sre-autopilot',
      agentName: 'Database Migration Runner',
      actionType: 'infrastructure_db',
      actionSummary: 'Execute SQL: ALTER TABLE orders DROP COLUMN legacy_payload_data in Production RDS cluster.',
      intent: 'Clean up unused legacy database column.',
      callerEnvironment: 'production',
      parameters: {
        is_production_mutation: true,
        has_destructive_syntax: true,
        has_verified_rollback_and_backup: false,
        is_heavy_table_lock: true
      }
    }
  },
  {
    title: 'Treasury Agent: $250 Annual Monitoring SaaS Subscription',
    category: 'Treasury & Spend',
    expectedVerdict: 'APPROVED',
    payload: {
      agentId: 'agent-finops-procure',
      agentName: 'Cloud Spend Optimizer',
      actionType: 'financial_spend',
      actionSummary: 'Authorize $250/yr subscription to Sentry Error Monitoring within verified engineering budget.',
      intent: 'Enable automated error reporting on frontend applet.',
      callerEnvironment: 'production',
      parameters: {
        amount_usd: 85,
        is_recurring: false,
        is_in_budget: true,
        has_penalty_free_cancellation: true
      }
    }
  },
  {
    title: 'Marketing Agent: Broadcast Promo Email to 2,500 Users',
    category: 'Public Outreach',
    expectedVerdict: 'ESCALATE_TO_FOUNDER',
    payload: {
      agentId: 'agent-growth-blast',
      agentName: 'Lifecycle Email Dispatcher',
      actionType: 'public_communication',
      actionSummary: 'Dispatch unannounced product relaunch email to entire newsletter database (2,500 recipients).',
      intent: 'Drive immediate weekend engagement.',
      callerEnvironment: 'production',
      parameters: {
        action_scope: 'mass_broadcast',
        recipient_count: 2500,
        contains_future_promises: true
      }
    }
  },
  {
    title: 'Support Bot: $45 Goodwill Refund for Loyal Customer',
    category: 'Customer Support',
    expectedVerdict: 'APPROVED',
    payload: {
      agentId: 'agent-support-tier1',
      agentName: 'Zendesk Resolution Bot',
      actionType: 'public_communication',
      actionSummary: 'Issue $45 credit for accidental double-invoice to verified account in good standing.',
      intent: 'Prevent churn and resolve billing ticket in <2 minutes.',
      callerEnvironment: 'production',
      parameters: {
        action_scope: 'financial_refund',
        refund_amount_usd: 45,
        is_good_standing_account: true,
        contains_future_promises: false
      }
    }
  },
  {
    title: 'Autonomous Scraper Bot: Deep Recursion (Depth 6) + PII Exfiltration',
    category: 'AI Tool Safety',
    expectedVerdict: 'REJECTED',
    payload: {
      agentId: 'agent-research-swarm-9',
      agentName: 'Recursive Web Crawler',
      actionType: 'agent_autonomous_tool',
      actionSummary: 'Send aggregated customer session payloads to external scraping webhook endpoint.',
      intent: 'External market sentiment analysis.',
      callerEnvironment: 'production',
      parameters: {
        is_stateful_write: true,
        contains_pii_or_secrets: true,
        recursion_depth: 6,
        estimated_cost_usd: 12.50
      }
    }
  }
];

export function AgentDecisionSandbox() {
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [actionPayload, setActionPayload] = useState<AgentActionPayload>(
    PRESET_AGENT_SCENARIOS[0].payload
  );
  const [verdict, setVerdict] = useState<AgentDecisionVerdict | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [rawParamsString, setRawParamsString] = useState(
    JSON.stringify(PRESET_AGENT_SCENARIOS[0].payload.parameters, null, 2)
  );

  const handleApplyPreset = (index: number) => {
    setSelectedPresetIndex(index);
    const preset = PRESET_AGENT_SCENARIOS[index];
    setActionPayload(preset.payload);
    setRawParamsString(JSON.stringify(preset.payload.parameters, null, 2));
    setVerdict(null);
  };

  const handleRunEvaluation = () => {
    let parsedParams = actionPayload.parameters;
    try {
      parsedParams = JSON.parse(rawParamsString);
    } catch {
      // keep current
    }

    const payloadToRun: AgentActionPayload = {
      ...actionPayload,
      parameters: parsedParams
    };

    const result = AgentIntegrationEngine.evaluateAction(payloadToRun);
    setVerdict(result);
  };

  const handleCopyJsonVerdict = () => {
    if (!verdict) return;
    navigator.clipboard.writeText(JSON.stringify(verdict.machineReadableResponse, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Agent Action Evaluation Sandbox</h2>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-semibold">
                Pre-Flight Validation Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate or test autonomous agent tool calls against hard-bound guardrails, decision trees, and multi-brain councils
            </p>
          </div>

          <button
            onClick={handleRunEvaluation}
            className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer text-xs"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Evaluate Proposed Action</span>
          </button>
        </div>

        {/* Preset Scenarios Ribbon */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Preset Scenarios:</span>
          </span>
          {PRESET_AGENT_SCENARIOS.map((scenario, idx) => {
            const isSelected = selectedPresetIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => handleApplyPreset(idx)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <span>{scenario.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Input Payload on Left (5 Cols) vs Verdict Output on Right (7 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Agent Payload Definition */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-amber-400" />
                <span>Agent Request Payload</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-500">JSON Contract</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Calling Agent Identity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={actionPayload.agentId}
                    onChange={(e) => setActionPayload({ ...actionPayload, agentId: e.target.value })}
                    placeholder="agent-id"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="text"
                    value={actionPayload.agentName}
                    onChange={(e) => setActionPayload({ ...actionPayload, agentName: e.target.value })}
                    placeholder="Agent Name"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Action Domain / Category
                </label>
                <select
                  value={actionPayload.actionType}
                  onChange={(e) => setActionPayload({ ...actionPayload, actionType: e.target.value as DecisionDomain })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="financial_spend">financial_spend (Treasury & Cash Commitments)</option>
                  <option value="pricing_discount">pricing_discount (Sales Discounts & Pricing Power)</option>
                  <option value="infrastructure_db">infrastructure_db (Production DB & Schema Migrations)</option>
                  <option value="public_communication">public_communication (Public Broadcasts & Refunds)</option>
                  <option value="agent_autonomous_tool">agent_autonomous_tool (AI Tool & Webhook Safety)</option>
                  <option value="contract_legal">contract_legal (Contracts & Indemnification)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Action Summary
                </label>
                <textarea
                  value={actionPayload.actionSummary}
                  onChange={(e) => setActionPayload({ ...actionPayload, actionSummary: e.target.value })}
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Action Parameters (JSON)
                </label>
                <textarea
                  value={rawParamsString}
                  onChange={(e) => setRawParamsString(e.target.value)}
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-400 leading-relaxed"
                />
              </div>
            </div>

            <button
              onClick={handleRunEvaluation}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Run Pre-Flight Check Now</span>
            </button>
          </div>
        </div>

        {/* Right Column: Detailed Verdict Output */}
        <div className="lg:col-span-7 space-y-4">
          {verdict ? (
            <div className="space-y-4">
              {/* Main Status Verdict Banner */}
              <div
                className={`p-5 rounded-xl border-2 shadow-lg transition-all ${
                  verdict.status === 'APPROVED'
                    ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-500/5'
                    : verdict.status === 'CONDITIONAL_APPROVAL'
                    ? 'bg-blue-950/40 border-blue-500/60 shadow-blue-500/5'
                    : verdict.status === 'ESCALATE_TO_FOUNDER'
                    ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-500/5'
                    : 'bg-rose-950/40 border-rose-500/60 shadow-rose-500/5'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {verdict.status === 'APPROVED' && (
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                    )}
                    {verdict.status === 'CONDITIONAL_APPROVAL' && (
                      <CheckCircle2 className="w-8 h-8 text-blue-400 shrink-0" />
                    )}
                    {verdict.status === 'ESCALATE_TO_FOUNDER' && (
                      <AlertTriangle className="w-8 h-8 text-amber-400 shrink-0" />
                    )}
                    {verdict.status === 'REJECTED' && (
                      <XCircle className="w-8 h-8 text-rose-400 shrink-0" />
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-extrabold uppercase px-2.5 py-0.5 rounded ${
                            verdict.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : verdict.status === 'CONDITIONAL_APPROVAL'
                              ? 'bg-blue-500/20 text-blue-300'
                              : verdict.status === 'ESCALATE_TO_FOUNDER'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-rose-500/20 text-rose-300'
                          }`}
                        >
                          VERDICT: {verdict.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          Risk Tier: <strong className="text-white">{verdict.riskTier}</strong>
                        </span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1">
                        Execution Gate:{' '}
                        <code className="text-amber-400 font-mono font-bold">
                          {verdict.machineReadableResponse.execution_gate}
                        </code>
                      </h4>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold ${
                      verdict.machineReadableResponse.permitted
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/20 text-rose-400'
                    }`}
                  >
                    {verdict.machineReadableResponse.permitted ? '✓ PERMITTED' : '✕ BLOCKED / HELD'}
                  </span>
                </div>

                <div className="mt-3 p-3 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
                  {verdict.machineReadableResponse.agent_instructions}
                </div>
              </div>

              {/* Blast Radius 4-Pillar Scoreboard */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    <span>Blast Radius & Asymmetric Risk Scores</span>
                  </span>
                  <span className="text-xs font-mono text-slate-300">
                    Overall Risk: <strong className="text-amber-400">{verdict.blastRadius.overallRiskScore}/100</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      <span>Financial</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                      {verdict.blastRadius.financialRiskScore}%
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-purple-400" />
                      <span>Customer</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                      {verdict.blastRadius.customerImpactScore}%
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                      <Server className="w-3 h-3 text-blue-400" />
                      <span>System/DB</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                      {verdict.blastRadius.systemIntegrityScore}%
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                    <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
                      <Scale className="w-3 h-3 text-rose-400" />
                      <span>Legal/PII</span>
                    </div>
                    <div className="text-lg font-bold text-slate-100 mt-1 font-mono">
                      {verdict.blastRadius.legalRegulatoryScore}%
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-[11px] text-slate-400 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                  <strong className="text-slate-300">Worst Case Scenario:</strong>{' '}
                  {verdict.blastRadius.worstCaseScenario}
                </div>
              </div>

              {/* Guardrails Compliance Status */}
              {verdict.violatedGuardrails.length > 0 && (
                <div className="bg-rose-950/20 border border-rose-500/40 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-rose-400 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Violated Hard Guardrails ({verdict.violatedGuardrails.length})</span>
                  </div>
                  <div className="space-y-1.5">
                    {verdict.violatedGuardrails.map((v, i) => (
                      <div key={i} className="bg-slate-950 p-2.5 rounded-lg border border-rose-900/50 text-xs font-mono">
                        <div className="flex items-center justify-between text-rose-300 font-bold">
                          <span>[{v.ruleId}] {v.ruleName}</span>
                          <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded">{v.severity}</span>
                        </div>
                        <div className="text-slate-400 text-[11px] mt-1">
                          <strong>Remediation:</strong> {v.remediationAdvice}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-Brain Qualitative Advisory */}
              {verdict.councilGuidance && (
                <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Multi-Brain Leader Advisory</span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
                    <div>
                      <strong className="text-amber-300">Council Consulted:</strong>{' '}
                      {verdict.councilGuidance.leadersConsulted.join(', ')}
                    </div>
                    <div>
                      <strong className="text-emerald-400">Core Directive:</strong>{' '}
                      {verdict.councilGuidance.primaryDirective}
                    </div>
                    <div>
                      <strong className="text-rose-400">Failure Mode Warning:</strong>{' '}
                      {verdict.councilGuidance.failureModeWarning}
                    </div>
                  </div>
                </div>
              )}

              {/* Machine-Readable JSON Response for Agent Tool Call */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-amber-400" />
                    <span>Machine-Readable Agent Response Body</span>
                  </div>
                  <button
                    onClick={handleCopyJsonVerdict}
                    className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded flex items-center gap-1 font-mono transition-colors cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-[11px] text-amber-300 overflow-x-auto">
                  <pre>{JSON.stringify(verdict.machineReadableResponse, null, 2)}</pre>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white mb-1">Ready for Agent Evaluation</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto mb-5 leading-relaxed">
                Select a preset scenario above or customize the action payload on the left, then click <strong>Evaluate Proposed Action</strong> to inspect the complete multi-layer decision verdict.
              </p>
              <button
                onClick={handleRunEvaluation}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs cursor-pointer inline-flex items-center gap-2"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run First Check</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

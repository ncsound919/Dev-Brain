import { useState } from 'react';
import {
  ShieldCheck,
  Plus,
  AlertOctagon,
  Lock,
  Unlock
} from 'lucide-react';
import { GuardrailRule, CircuitBreaker, GuardrailSeverity } from '../types';
import { DEFAULT_GUARDRAIL_RULES, DEFAULT_CIRCUIT_BREAKERS } from '../data/guardrails';

export function AgentGuardrailManager() {
  const [guardrails, setGuardrails] = useState<GuardrailRule[]>(DEFAULT_GUARDRAIL_RULES);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreaker[]>(DEFAULT_CIRCUIT_BREAKERS);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // New rule state
  const [newRule, setNewRule] = useState<Partial<GuardrailRule>>({
    id: `GR_CUSTOM_${Date.now().toString().slice(-3)}`,
    name: '',
    domain: 'financial_spend',
    description: '',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: '',
    detrimentalImpactPrevented: '',
    evaluator: {
      field: 'amount_usd',
      operator: 'greater_than',
      thresholdValue: 500
    },
    remediationAdvice: ''
  });

  const toggleGuardrail = (id: string) => {
    setGuardrails(prev =>
      prev.map(rule => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const toggleCircuitBreaker = (id: string) => {
    setCircuitBreakers(prev =>
      prev.map(cb => {
        if (cb.id === id) {
          const nextStatus = cb.status === 'ARMED' ? 'TRIPPED' : 'ARMED';
          return { ...cb, status: nextStatus };
        }
        return cb;
      })
    );
  };

  const handleGlobalKillSwitch = () => {
    const global = circuitBreakers.find(cb => cb.id === 'cb_global_kill');
    const newStatus = global?.status === 'TRIPPED' ? 'ARMED' : 'TRIPPED';
    setCircuitBreakers(prev =>
      prev.map(cb => (cb.id === 'cb_global_kill' ? { ...cb, status: newStatus } : cb))
    );
  };

  const handleAddRule = () => {
    if (!newRule.name || !newRule.evaluator?.field) return;
    const created: GuardrailRule = {
      id: newRule.id || `GR_CUSTOM_${Date.now()}`,
      name: newRule.name,
      domain: newRule.domain || 'financial_spend',
      description: newRule.description || '',
      severity: newRule.severity as GuardrailSeverity,
      enabled: true,
      conditionDescription: `${newRule.evaluator.field} ${newRule.evaluator.operator} ${newRule.evaluator.thresholdValue}`,
      detrimentalImpactPrevented: newRule.detrimentalImpactPrevented || 'Unintended business error',
      evaluator: newRule.evaluator as any,
      remediationAdvice: newRule.remediationAdvice || 'Escalate to human review'
    };

    setGuardrails([created, ...guardrails]);
    setShowAddModal(false);
    setNewRule({
      id: `GR_CUSTOM_${Date.now().toString().slice(-3)}`,
      name: '',
      domain: 'financial_spend',
      description: '',
      severity: 'BLOCKING',
      enabled: true,
      conditionDescription: '',
      detrimentalImpactPrevented: '',
      evaluator: {
        field: 'amount_usd',
        operator: 'greater_than',
        thresholdValue: 500
      },
      remediationAdvice: ''
    });
  };

  const isGlobalKilled = circuitBreakers.find(cb => cb.id === 'cb_global_kill')?.status === 'TRIPPED';

  const filteredRules = guardrails.filter(r => {
    if (filterSeverity === 'ALL') return true;
    return r.severity === filterSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Top Circuit Breaker Emergency Banner */}
      <div
        className={`p-5 rounded-2xl border-2 transition-all ${
          isGlobalKilled
            ? 'bg-rose-950/60 border-rose-500 shadow-xl shadow-rose-500/20'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isGlobalKilled
                  ? 'bg-rose-500 text-slate-950 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Global Autonomous Emergency Kill-Switch</h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold uppercase ${
                    isGlobalKilled
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isGlobalKilled ? 'SYSTEM PAUSED / TRIPPED' : 'SYSTEM ARMED & ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isGlobalKilled
                  ? 'ALL autonomous agent tool executions and background jobs are hard-blocked. Founder override required.'
                  : 'Zero-tolerance invariant circuit breakers are actively guarding treasury, databases, and communications.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleGlobalKillSwitch}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isGlobalKilled
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
            }`}
          >
            {isGlobalKilled ? (
              <>
                <Unlock className="w-4 h-4" />
                <span>Resume Autonomous Agents</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Trigger Emergency Halt</span>
              </>
            )}
          </button>
        </div>

        {/* Domain Circuit Breakers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800">
          {circuitBreakers.filter(cb => cb.id !== 'cb_global_kill').map(cb => {
            const isTripped = cb.status === 'TRIPPED';
            return (
              <div
                key={cb.id}
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isTripped
                    ? 'bg-rose-950/40 border-rose-600/50'
                    : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-slate-200">{cb.name}</div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Domain: <strong className="text-amber-400">{cb.domain}</strong>
                  </div>
                </div>

                <button
                  onClick={() => toggleCircuitBreaker(cb.id)}
                  className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold transition-colors cursor-pointer ${
                    isTripped
                      ? 'bg-rose-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {isTripped ? 'TRIPPED' : 'ARMED'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Guardrail Rules Section */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">Active Business Guardrail Matrix</h3>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                {guardrails.filter(r => r.enabled).length} / {guardrails.length} Enabled
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Hard constraints that instantly halt or escalate actions before any external API or DB side-effect occurs
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
              {['ALL', 'BLOCKING', 'ESCALATION_REQUIRED', 'WARNING'].map(sev => (
                <button
                  key={sev}
                  onClick={() => setFilterSeverity(sev)}
                  className={`px-2.5 py-1 rounded font-mono text-[11px] transition-colors cursor-pointer ${
                    filterSeverity === sev
                      ? 'bg-amber-400 text-slate-950 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Custom Guardrail</span>
            </button>
          </div>
        </div>

        {/* Guardrail Rules List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredRules.map(rule => (
            <div
              key={rule.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                !rule.enabled
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  : rule.severity === 'BLOCKING'
                  ? 'bg-slate-950 border-rose-900/40 hover:border-rose-700/60'
                  : rule.severity === 'ESCALATION_REQUIRED'
                  ? 'bg-slate-950 border-amber-900/40 hover:border-amber-700/60'
                  : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded">
                      {rule.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded ${
                        rule.severity === 'BLOCKING'
                          ? 'bg-rose-500/20 text-rose-300'
                          : rule.severity === 'ESCALATION_REQUIRED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {rule.severity}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleGuardrail(rule.id)}
                    className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                      rule.enabled
                        ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {rule.enabled ? '● ACTIVE' : '○ DISABLED'}
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white mb-1">{rule.name}</h4>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">{rule.description}</p>

                <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800/80 space-y-1 text-[11px] font-mono">
                  <div className="text-amber-400">
                    <strong className="text-slate-400">Trigger Condition:</strong> {rule.conditionDescription}
                  </div>
                  <div className="text-slate-300">
                    <strong className="text-slate-400">Harm Prevented:</strong> {rule.detrimentalImpactPrevented}
                  </div>
                  <div className="text-slate-400 text-[10px]">
                    <strong className="text-slate-500">Remediation:</strong> {rule.remediationAdvice}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Custom Guardrail Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                <span>Create New Business Guardrail</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Guardrail Name</label>
                <input
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g. Forbid Unapproved Cloud GPU Provisioning"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Domain</label>
                  <select
                    value={newRule.domain}
                    onChange={(e) => setNewRule({ ...newRule, domain: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="financial_spend">financial_spend</option>
                    <option value="pricing_discount">pricing_discount</option>
                    <option value="infrastructure_db">infrastructure_db</option>
                    <option value="public_communication">public_communication</option>
                    <option value="agent_autonomous_tool">agent_autonomous_tool</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-400 cursor-pointer"
                  >
                    <option value="BLOCKING">BLOCKING (Hard Block)</option>
                    <option value="ESCALATION_REQUIRED">ESCALATION_REQUIRED</option>
                    <option value="WARNING">WARNING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Detrimental Impact Prevented</label>
                <input
                  type="text"
                  value={newRule.detrimentalImpactPrevented}
                  onChange={(e) => setNewRule({ ...newRule, detrimentalImpactPrevented: e.target.value })}
                  placeholder="e.g. Thousands of dollars in idle GPU rental costs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Remediation Advice for Agent</label>
                <input
                  type="text"
                  value={newRule.remediationAdvice}
                  onChange={(e) => setNewRule({ ...newRule, remediationAdvice: e.target.value })}
                  placeholder="e.g. Switch to Spot instances or request Founder budget allocation"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddRule}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
              >
                Save & Enable Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

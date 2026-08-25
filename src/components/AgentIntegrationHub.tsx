import { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Terminal,
  Bot,
  ShieldAlert,
  FileCode,
  Layers
} from 'lucide-react';
import { AgentIntegrationEngine } from '../engine/agentIntegrationEngine';

export function AgentIntegrationHub() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'openai' | 'anthropic' | 'prompt' | 'typescript' | 'python'>('openai');

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openAiToolSchema = JSON.stringify(AgentIntegrationEngine.generateOpenAiToolDefinition(), null, 2);

  const anthropicToolSchema = JSON.stringify({
    name: "validate_business_action",
    description: "Mandatory pre-flight validation gate for AI agents before executing financial spends, pricing changes, production database queries, or mass communications.",
    input_schema: {
      type: "object",
      properties: {
        agentId: { type: "string", description: "Unique identifier of the calling agent" },
        actionType: {
          type: "string",
          enum: ["financial_spend", "pricing_discount", "infrastructure_db", "public_communication", "contract_legal", "agent_autonomous_tool"]
        },
        actionSummary: { type: "string", description: "Clear explanation of what the agent is attempting to do" },
        intent: { type: "string", description: "Business goal or customer request motivating this action" },
        parameters: { type: "object", description: "Key-value parameters (amount_usd, discount_percentage, etc.)" }
      },
      required: ["agentId", "actionType", "actionSummary", "parameters"]
    }
  }, null, 2);

  const systemPromptSnippet = AgentIntegrationEngine.generateAgentSystemPromptSnippet();

  const typescriptSnippet = `import { AgentIntegrationEngine } from './engine/agentIntegrationEngine';

// Inside your agent's tool-execution loop:
async function executeAgentActionWithSafetyGate(actionPayload) {
  // 1. Run deterministic pre-flight evaluation
  const verdict = AgentIntegrationEngine.evaluateAction(actionPayload);

  // 2. Check machine-readable execution gate
  if (verdict.machineReadableResponse.execution_gate === 'REJECT_WITH_ERROR') {
    throw new Error(\`[GUARDRAIL REJECTED]: \${verdict.machineReadableResponse.agent_instructions}\`);
  }

  if (verdict.machineReadableResponse.execution_gate === 'HOLD_FOR_FOUNDER') {
    await notifyFounderFor2FASignoff(verdict);
    return { status: 'PENDING_FOUNDER_APPROVAL', evaluationId: verdict.evaluationId };
  }

  // 3. Permitted to proceed
  return await executeRawToolCall(actionPayload);
}`;

  const pythonSnippet = `import requests

def validate_agent_action(agent_id, action_type, summary, params):
    """Call Dev Brain Decision Engine to prevent detrimental business mistakes."""
    payload = {
        "agentId": agent_id,
        "actionType": action_type,
        "actionSummary": summary,
        "parameters": params
    }
    
    # Pre-flight evaluation call
    response = requests.post("https://your-dev-brain.internal/api/decision/evaluate", json=payload)
    verdict = response.json()
    
    gate = verdict.get("machineReadableResponse", {}).get("execution_gate")
    
    if gate == "REJECT_WITH_ERROR":
        raise PermissionError(f"Action blocked by Decision Engine: {verdict['machineReadableResponse']['agent_instructions']}")
        
    if gate == "HOLD_FOR_FOUNDER":
        queue_founder_approval(verdict)
        return {"status": "HOLD_FOR_FOUNDER", "id": verdict["evaluationId"]}
        
    return {"status": "APPROVED", "proceed": True}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Code className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Agent Integration Hub & SDK Protocols</h2>
              <span className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded font-mono font-semibold">
                Zero-Integration Overhead
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Plug this Decision Engine into your LangChain, CrewAI, AutoGen, or custom agent tool loops in 5 lines of code.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-1 mt-4 pt-3 border-t border-slate-800 overflow-x-auto pb-1">
          {[
            { id: 'openai', label: 'OpenAI Tool Definition', icon: Bot },
            { id: 'anthropic', label: 'Claude Tool Schema', icon: Layers },
            { id: 'prompt', label: 'System Prompt Policy', icon: ShieldAlert },
            { id: 'typescript', label: 'TypeScript / Node.js SDK', icon: FileCode },
            { id: 'python', label: 'Python SDK Wrapper', icon: Terminal }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Code Display Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {activeTab === 'openai' && 'OpenAI Function Calling Tool Declaration'}
              {activeTab === 'anthropic' && 'Anthropic Claude Tool Specification'}
              {activeTab === 'prompt' && 'Agent System Prompt Guardrail Injection'}
              {activeTab === 'typescript' && 'TypeScript / JavaScript Integration Snippet'}
              {activeTab === 'python' && 'Python Requests / FastAPI Client Integration'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Copy and paste directly into your agent runtime environment
            </p>
          </div>

          <button
            onClick={() => {
              if (activeTab === 'openai') copyText('code', openAiToolSchema);
              if (activeTab === 'anthropic') copyText('code', anthropicToolSchema);
              if (activeTab === 'prompt') copyText('code', systemPromptSnippet);
              if (activeTab === 'typescript') copyText('code', typescriptSnippet);
              if (activeTab === 'python') copyText('code', pythonSnippet);
            }}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copiedKey === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey === 'code' ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 overflow-x-auto max-h-96 leading-relaxed">
          {activeTab === 'openai' && <pre>{openAiToolSchema}</pre>}
          {activeTab === 'anthropic' && <pre>{anthropicToolSchema}</pre>}
          {activeTab === 'prompt' && <pre className="text-slate-200 whitespace-pre-wrap">{systemPromptSnippet}</pre>}
          {activeTab === 'typescript' && <pre className="text-emerald-300">{typescriptSnippet}</pre>}
          {activeTab === 'python' && <pre className="text-blue-300">{pythonSnippet}</pre>}
        </div>
      </div>
    </div>
  );
}

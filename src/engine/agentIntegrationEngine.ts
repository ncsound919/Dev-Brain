import {
  AgentActionPayload,
  AgentDecisionVerdict,
  DecisionTree,
  GuardrailRule,
  CircuitBreaker,
  DecisionVerdictStatus,
  RiskTier
} from '../types';
import { BUILT_IN_DECISION_TREES } from '../data/decisionTrees';
import { DEFAULT_GUARDRAIL_RULES, DEFAULT_CIRCUIT_BREAKERS } from '../data/guardrails';
import { DecisionTreeEngine } from './decisionTreeEngine';
import { GuardrailEngine } from './guardrailEngine';

export class AgentIntegrationEngine {
  public static evaluateAction(
    payload: AgentActionPayload,
    customTrees: Record<string, DecisionTree> = BUILT_IN_DECISION_TREES,
    rules: GuardrailRule[] = DEFAULT_GUARDRAIL_RULES,
    breakers: CircuitBreaker[] = DEFAULT_CIRCUIT_BREAKERS
  ): AgentDecisionVerdict {
    const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const timestamp = new Date().toISOString();

    // 1. Check Circuit Breakers
    const breakerCheck = GuardrailEngine.checkCircuitBreakers(payload, breakers);
    if (breakerCheck.isTripped) {
      return {
        evaluationId,
        timestamp,
        agentId: payload.agentId,
        actionType: payload.actionType,
        status: 'REJECTED',
        riskTier: 'CATASTROPHIC',
        overallRiskScore: 100,
        decisionTreeUsed: { id: 'circuit_breaker', name: 'Emergency Circuit Breaker' },
        tracePath: [{
          nodeId: 'cb_halt',
          nodeTitle: 'Circuit Breaker Active',
          nodeType: 'guardrail_gate',
          evaluatedValue: breakerCheck.status,
          branchTakenLabel: 'Emergency Shutdown',
          notes: breakerCheck.trippedBreaker?.emergencyAction || 'System is under emergency lockdown.'
        }],
        violatedGuardrails: [{
          ruleId: 'CB_TRIPPED',
          ruleName: breakerCheck.trippedBreaker?.name || 'Circuit Breaker',
          severity: 'BLOCKING',
          remediationAdvice: 'Manual founder reset required in system dashboard.'
        }],
        blastRadius: {
          financialRiskScore: 100,
          customerImpactScore: 100,
          systemIntegrityScore: 100,
          legalRegulatoryScore: 100,
          overallRiskScore: 100,
          riskTier: 'CATASTROPHIC',
          isIrreversible: false,
          estimatedRecoveryTime: 'Manual reset needed',
          worstCaseScenario: 'Attempted action during active emergency circuit breaker condition.'
        },
        circuitBreakerStatus: breakerCheck.status,
        humanSignoffRequired: true,
        requiredAuthorizations: ['Founder Master Override'],
        mitigationDirectives: [
          'Halt all pending autonomous actions immediately',
          'Notify founder of tripped circuit breaker'
        ],
        machineReadableResponse: {
          permitted: false,
          reason_code: 'CIRCUIT_BREAKER_ACTIVE',
          execution_gate: 'REJECT_WITH_ERROR',
          agent_instructions: 'CRITICAL: The system circuit breaker is TRIPPED. Do not retry this action. Abort execution immediately and alert human operator.'
        }
      };
    }

    // 2. Evaluate Hard Guardrails
    const guardrailResult = GuardrailEngine.evaluateGuardrails(payload, rules);

    // 3. Compute Blast Radius
    const blastRadius = GuardrailEngine.calculateBlastRadius(payload);

    // 4. Select and traverse the matching Decision Tree
    let targetTree: DecisionTree | undefined;
    const allTrees = { ...BUILT_IN_DECISION_TREES, ...customTrees };
    
    // Find tree by domain
    targetTree = Object.values(allTrees).find(t => t.domain === payload.actionType);
    if (!targetTree) {
      targetTree = Object.values(allTrees)[0];
    }

    const { finalNode, trace } = DecisionTreeEngine.traverseTree(targetTree, payload.parameters);

    // 5. Synthesize Verdict & Status
    let status: DecisionVerdictStatus = finalNode.verdict?.status || 'APPROVED';
    let riskTier: RiskTier = finalNode.verdict?.riskTier || blastRadius.riskTier;
    const requiredAuths: string[] = [...(finalNode.verdict?.requiredAuthorizations || [])];
    const mitigations: string[] = [...(finalNode.verdict?.mitigationActions || [])];

    // Guardrail override: Blocking guardrail always forces REJECTED
    if (guardrailResult.hasBlockingViolations) {
      status = 'REJECTED';
      riskTier = 'CATASTROPHIC';
      mitigations.unshift('Resolve all blocking guardrail violations before resubmitting.');
    } else if (guardrailResult.hasEscalationViolations && status === 'APPROVED') {
      status = 'ESCALATE_TO_FOUNDER';
      riskTier = 'HIGH';
      requiredAuths.push('Founder Escalation Gate');
    }

    const humanSignoffRequired = status === 'ESCALATE_TO_FOUNDER' || status === 'REJECTED';

    // 6. Consult relevant Domain Leaders for Qualitative Guidance
    let councilGuidance: AgentDecisionVerdict['councilGuidance'] = undefined;
    if (payload.actionType === 'pricing_discount') {
      councilGuidance = {
        leadersConsulted: ['Warren Buffett (Moats)', 'Charlie Munger (Inversion)'],
        primaryDirective: 'Protect pricing power as the primary indicator of business moats. Never trade margin for ephemeral volume.',
        failureModeWarning: 'Discounting creates permanent customer expectations and invites unprofitable operational drag.'
      };
    } else if (payload.actionType === 'financial_spend') {
      councilGuidance = {
        leadersConsulted: ['Ray Dalio (Economic Principles)', 'Jamie Dimon (Fortress Balance Sheet)'],
        primaryDirective: 'Maintain fortress liquidity and positive cash conversion buffers. Track all fixed recurring commitments.',
        failureModeWarning: 'Uncontrolled SaaS creep and variable micro-spend compound into runway compression.'
      };
    } else if (payload.actionType === 'infrastructure_db') {
      councilGuidance = {
        leadersConsulted: ['Jeff Dean (Distributed SRE)', 'Martín Abadi (Formal Safety)'],
        primaryDirective: 'Enforce zero-downtime additive migrations. A forward schema change without an automated rollback is an unacceptable risk.',
        failureModeWarning: 'Table locks during high-traffic windows cascade into connection exhaustion and customer loss.'
      };
    } else if (payload.actionType === 'agent_autonomous_tool') {
      councilGuidance = {
        leadersConsulted: ['Andrej Karpathy (Pedagogy & Determinism)', 'Demis Hassabis (Cognitive Bounds)'],
        primaryDirective: 'Enforce strict bounded recursion limits and deterministic validation loops on all autonomous actions.',
        failureModeWarning: 'Unbounded tool execution loops lead to runaway token burn and unpredictable side-effects.'
      };
    }

    // 7. Generate Machine-Readable Instructions for Agent
    let executionGate: 'ALLOW_PROCEED' | 'HOLD_FOR_FOUNDER' | 'REJECT_WITH_ERROR' = 'ALLOW_PROCEED';
    let agentInstructions = 'Action approved. Proceed with verified execution parameters.';

    if (status === 'REJECTED') {
      executionGate = 'REJECT_WITH_ERROR';
      agentInstructions = `ACTION REJECTED: ${finalNode.verdict?.reason || 'Violated critical business safety guardrails.'} Do NOT execute. Review the violated guardrails and adjust parameters.`;
    } else if (status === 'ESCALATE_TO_FOUNDER') {
      executionGate = 'HOLD_FOR_FOUNDER';
      agentInstructions = `ACTION HELD: Proposed action exceeds autonomous risk limits (${riskTier} risk tier). Pausing execution until Founder / Human 2FA authorization token is granted.`;
    } else if (status === 'CONDITIONAL_APPROVAL') {
      executionGate = 'ALLOW_PROCEED';
      agentInstructions = `ACTION CONDITIONALLY APPROVED: Proceed, but strictly adhere to required mitigation directives: ${mitigations.join('; ')}`;
    }

    return {
      evaluationId,
      timestamp,
      agentId: payload.agentId,
      actionType: payload.actionType,
      status,
      riskTier,
      overallRiskScore: blastRadius.overallRiskScore,
      decisionTreeUsed: {
        id: targetTree.id,
        name: targetTree.name
      },
      tracePath: trace,
      violatedGuardrails: guardrailResult.violatedRules,
      blastRadius,
      circuitBreakerStatus: 'NORMAL',
      humanSignoffRequired,
      requiredAuthorizations: Array.from(new Set(requiredAuths)),
      mitigationDirectives: mitigations,
      councilGuidance,
      machineReadableResponse: {
        permitted: status === 'APPROVED' || status === 'CONDITIONAL_APPROVAL',
        reason_code: `${status}_${riskTier}`,
        execution_gate: executionGate,
        agent_instructions: agentInstructions
      }
    };
  }

  public static generateOpenAiToolDefinition() {
    return {
      type: "function",
      function: {
        name: "validate_business_action",
        description: "Mandatory pre-flight validation gate for AI agents before executing financial spends, pricing changes, production database queries, or mass communications. Returns an authorized verdict to prevent detrimental mistakes.",
        parameters: {
          type: "object",
          properties: {
            agentId: {
              type: "string",
              description: "Unique identifier of the calling agent (e.g., 'sales-agent-01', 'devops-bot')"
            },
            actionType: {
              type: "string",
              enum: [
                "financial_spend",
                "pricing_discount",
                "infrastructure_db",
                "public_communication",
                "contract_legal",
                "agent_autonomous_tool"
              ],
              description: "The business domain category of the proposed action"
            },
            actionSummary: {
              type: "string",
              description: "Clear explanation of what the agent is attempting to do"
            },
            intent: {
              type: "string",
              description: "The business goal or customer request motivating this action"
            },
            parameters: {
              type: "object",
              description: "Key-value parameters (e.g., amount_usd, discount_percentage, is_production_mutation, contains_pii_or_secrets)"
            }
          },
          required: ["agentId", "actionType", "actionSummary", "parameters"]
        }
      }
    };
  }

  public static generateAgentSystemPromptSnippet() {
    return `### MANDATORY AGENT SAFETY POLICY & PRE-FLIGHT VERDICT PROTOCOL

You are an autonomous agent operating within an enterprise ecosystem. You are strictly FORBIDDEN from performing irreversible, high-capital, or high-risk actions without querying the Decision Engine.

Before executing ANY of the following:
1. Financial commitments / Subscriptions / Tool purchases
2. Sales pricing discounts or custom SLA terms
3. Production database migrations, schema mutations, or row deletions
4. Mass email broadcasts (>50 users) or public social posts
5. Invoking external webhooks with customer data or API keys

YOU MUST CALL \`validate_business_action\` tool first.
- If response is \`execution_gate: "ALLOW_PROCEED"\`, you may proceed safely.
- If response is \`execution_gate: "HOLD_FOR_FOUNDER"\`, inform the user: "This action exceeds autonomous limits and has been submitted to the Founder for 2FA review."
- If response is \`execution_gate: "REJECT_WITH_ERROR"\`, DO NOT PROCEED. Explain the policy reason to the user.`;
  }
}

import {
  GuardrailRule,
  CircuitBreaker,
  BlastRadiusAssessment,
  RiskTier,
  AgentActionPayload
} from '../types';
import { DecisionTreeEngine } from './decisionTreeEngine';

export class GuardrailEngine {
  public static evaluateGuardrails(
    payload: AgentActionPayload,
    rules: GuardrailRule[]
  ): {
    violatedRules: {
      ruleId: string;
      ruleName: string;
      severity: GuardrailRule['severity'];
      remediationAdvice: string;
    }[];
    hasBlockingViolations: boolean;
    hasEscalationViolations: boolean;
  } {
    const violatedRules: {
      ruleId: string;
      ruleName: string;
      severity: GuardrailRule['severity'];
      remediationAdvice: string;
    }[] = [];

    const activeRules = rules.filter(r => r.enabled);

    for (const rule of activeRules) {
      const field = rule.evaluator.field;
      const actualValue = payload.parameters[field];

      if (actualValue !== undefined) {
        const isTriggered = DecisionTreeEngine.evaluateCondition(
          actualValue,
          rule.evaluator.operator,
          rule.evaluator.thresholdValue
        );

        if (isTriggered) {
          violatedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            remediationAdvice: rule.remediationAdvice
          });
        }
      }
    }

    const hasBlockingViolations = violatedRules.some(v => v.severity === 'BLOCKING');
    const hasEscalationViolations = violatedRules.some(v => v.severity === 'ESCALATION_REQUIRED');

    return {
      violatedRules,
      hasBlockingViolations,
      hasEscalationViolations
    };
  }

  public static calculateBlastRadius(payload: AgentActionPayload): BlastRadiusAssessment {
    const params = payload.parameters || {};
    let financialScore = 10;
    let customerScore = 10;
    let systemScore = 10;
    let legalScore = 10;
    let isIrreversible = false;
    let estimatedRecoveryTime = '< 5 minutes';
    let worstCaseScenario = 'Minor temporary operational logging overhead.';

    // 1. Financial Evaluation
    const amount = Number(params.amount_usd || params.refund_amount_usd || params.estimated_cost_usd || 0);
    if (amount > 5000) {
      financialScore = 95;
      worstCaseScenario = 'Material direct capital depletion exceeding monthly burn threshold.';
    } else if (amount > 1000) {
      financialScore = 75;
      worstCaseScenario = 'Unbudgeted capital outflow requiring treasury liquidity adjustment.';
    } else if (amount > 100) {
      financialScore = 40;
    }

    if (params.discount_percentage && Number(params.discount_percentage) > 30) {
      financialScore = Math.max(financialScore, 85);
      worstCaseScenario = 'Permanent degradation of average revenue per account (ARPU) and customer margin erosion.';
    }

    // 2. Customer / Brand Reach
    const recipients = Number(params.recipient_count || 1);
    if (recipients > 500) {
      customerScore = 90;
      worstCaseScenario = 'Mass public email spam report cascade leading to domain deliverability blacklisting.';
    } else if (recipients > 50) {
      customerScore = 65;
    } else if (params.action_scope === 'mass_broadcast' || params.action_scope === 'public_social_post') {
      customerScore = 80;
    }

    if (params.contains_future_promises === true) {
      customerScore = Math.max(customerScore, 75);
      legalScore = Math.max(legalScore, 80);
      worstCaseScenario = 'Creation of legally binding feature/SLA delivery obligations subject to promissory estoppel.';
    }

    // 3. System & Database Integrity
    if (params.has_destructive_syntax === true) {
      systemScore = 100;
      isIrreversible = true;
      estimatedRecoveryTime = 'Hours / Point-in-time restore required';
      worstCaseScenario = 'Total loss of live transactional production tables with active user downtime.';
    } else if (params.is_production_mutation === true) {
      systemScore = Math.max(systemScore, 65);
      if (params.has_verified_rollback_and_backup === false) {
        systemScore = 85;
        worstCaseScenario = 'Production schema lock without automated down-migration recovery mechanism.';
      }
    }

    if (params.recursion_depth && Number(params.recursion_depth) > 4) {
      systemScore = Math.max(systemScore, 80);
      worstCaseScenario = 'Asynchronous swarm lockup exhausting serverless worker capacity.';
    }

    // 4. Legal / PII Secrets
    if (params.contains_pii_or_secrets === true) {
      legalScore = 95;
      worstCaseScenario = 'Regulatory data privacy violation (GDPR/CCPA) and credential exposure to public logs.';
    }

    if (params.has_custom_liabilities === true || params.has_uncapped_liability === true) {
      legalScore = 95;
      worstCaseScenario = 'Uncapped indemnification exposure in enterprise customer contract.';
    }

    // Composite Calculation
    const overallScore = Math.round(
      financialScore * 0.30 +
      customerScore * 0.25 +
      systemScore * 0.25 +
      legalScore * 0.20
    );

    let riskTier: RiskTier = 'LOW';
    if (overallScore >= 80 || systemScore >= 90 || legalScore >= 90 || financialScore >= 90) {
      riskTier = 'CATASTROPHIC';
    } else if (overallScore >= 60) {
      riskTier = 'HIGH';
    } else if (overallScore >= 30) {
      riskTier = 'MEDIUM';
    }

    return {
      financialRiskScore: financialScore,
      customerImpactScore: customerScore,
      systemIntegrityScore: systemScore,
      legalRegulatoryScore: legalScore,
      overallRiskScore: overallScore,
      riskTier,
      isIrreversible,
      estimatedRecoveryTime,
      worstCaseScenario
    };
  }

  public static checkCircuitBreakers(
    payload: AgentActionPayload,
    breakers: CircuitBreaker[]
  ): {
    isTripped: boolean;
    status: 'NORMAL' | 'TRIPPED_GLOBAL' | 'TRIPPED_DOMAIN';
    trippedBreaker?: CircuitBreaker;
  } {
    const globalBreaker = breakers.find(b => b.id === 'cb_global_kill');
    if (globalBreaker && globalBreaker.status === 'TRIPPED') {
      return {
        isTripped: true,
        status: 'TRIPPED_GLOBAL',
        trippedBreaker: globalBreaker
      };
    }

    const domainBreaker = breakers.find(b => b.domain === payload.actionType);
    if (domainBreaker && domainBreaker.status === 'TRIPPED') {
      return {
        isTripped: true,
        status: 'TRIPPED_DOMAIN',
        trippedBreaker: domainBreaker
      };
    }

    return {
      isTripped: false,
      status: 'NORMAL'
    };
  }
}

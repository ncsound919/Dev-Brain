import { GuardrailRule, CircuitBreaker } from '../types';

export const DEFAULT_GUARDRAIL_RULES: GuardrailRule[] = [
  {
    id: 'GR_FIN_001',
    name: 'Hard Spend Ceiling ($1,000) Without Founder Sign-Off',
    domain: 'financial_spend',
    description: 'Autonomous agents and automated pipelines are strictly forbidden from committing >$1,000 in spend without Founder 2FA signature.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'amount_usd > 1000',
    detrimentalImpactPrevented: 'Rapid treasury depletion and unauthorized multi-thousand dollar credit card / cloud charges.',
    evaluator: {
      field: 'amount_usd',
      operator: 'greater_than',
      thresholdValue: 1000
    },
    remediationAdvice: 'Split into smaller operational milestones or request explicit Founder dual-custody authorization.'
  },
  {
    id: 'GR_PRC_002',
    name: 'Absolute Gross Margin Floor (60% Minimum)',
    domain: 'pricing_discount',
    description: 'No deal, contract, or custom package can be issued where projected gross margin drops below 60%.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'projected_gross_margin < 60',
    detrimentalImpactPrevented: 'Negative unit economics and serving unprofitable customers at a cash loss.',
    evaluator: {
      field: 'projected_gross_margin',
      operator: 'less_than',
      thresholdValue: 60
    },
    remediationAdvice: 'De-scope high-cost compute, dedicated infrastructure, or human support tiers to restore margins to ≥70%.'
  },
  {
    id: 'GR_PRC_003',
    name: 'Sales Discount Cap (>30% Escalation)',
    domain: 'pricing_discount',
    description: 'Any discount exceeding 30% off list price automatically trips the pricing governance barrier.',
    severity: 'ESCALATION_REQUIRED',
    enabled: true,
    conditionDescription: 'discount_percentage > 30',
    detrimentalImpactPrevented: 'Destruction of pricing power, race to the bottom, and customer resentment during renewals.',
    evaluator: {
      field: 'discount_percentage',
      operator: 'greater_than',
      thresholdValue: 30
    },
    remediationAdvice: 'Exchange discount for multi-year prepay or require CEO concession approval.'
  },
  {
    id: 'GR_INF_004',
    name: 'Zero-Tolerance Production DDL Destruction (DROP / TRUNCATE Ban)',
    domain: 'infrastructure_db',
    description: 'Permanently bans autonomous agents from executing DROP TABLE, TRUNCATE, or unindexed mass DELETE in production.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'has_destructive_syntax == true',
    detrimentalImpactPrevented: 'Catastrophic, unrecoverable data deletion and severe production outage.',
    evaluator: {
      field: 'has_destructive_syntax',
      operator: 'is_true',
      thresholdValue: true
    },
    remediationAdvice: 'Use additive soft-deletes (is_deleted column) and automated archive pipelines with tested rollback.'
  },
  {
    id: 'GR_INF_005',
    name: 'Mandatory Point-in-Time Snapshot Before Schema Mutation',
    domain: 'infrastructure_db',
    description: 'Production database schema changes require a confirmed snapshot <15 minutes old and a tested rollback script.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'has_verified_rollback_and_backup == false',
    detrimentalImpactPrevented: 'Permanent migration locks without a safety escape hatch.',
    evaluator: {
      field: 'has_verified_rollback_and_backup',
      operator: 'is_false',
      thresholdValue: false
    },
    remediationAdvice: 'Trigger automated RDS/Firestore snapshot and verify down-migration script before proceeding.'
  },
  {
    id: 'GR_SEC_006',
    name: 'Confidential PII & Secret Key Transmit Ban',
    domain: 'agent_autonomous_tool',
    description: 'Blocks any outbound API call, webhook, or prompt payload containing unmasked PII, credentials, or private API keys.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'contains_pii_or_secrets == true',
    detrimentalImpactPrevented: 'Massive regulatory fines (GDPR/CCPA), breach of customer trust, and credential compromise.',
    evaluator: {
      field: 'contains_pii_or_secrets',
      operator: 'is_true',
      thresholdValue: true
    },
    remediationAdvice: 'Apply automatic regex pseudonymization, token hashing, and strip authorization headers from payload logs.'
  },
  {
    id: 'GR_LLM_007',
    name: 'Runaway Agent Recursion & Loop Brake (Max Depth 5)',
    domain: 'agent_autonomous_tool',
    description: 'Interrupts autonomous agent execution if sub-agent nesting exceeds 5 recursive layers.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'recursion_depth > 4',
    detrimentalImpactPrevented: 'Infinite recursive token consumption loops and asynchronous process swarms.',
    evaluator: {
      field: 'recursion_depth',
      operator: 'greater_than',
      thresholdValue: 4
    },
    remediationAdvice: 'Refactor agent flow to linear pipeline with explicit termination milestones.'
  },
  {
    id: 'GR_COM_008',
    name: 'Mass Email / Public Broadcast Lockdown',
    domain: 'public_communication',
    description: 'Sending emails or notifications to >50 users in a single operation requires canary testing and Founder approval.',
    severity: 'ESCALATION_REQUIRED',
    enabled: true,
    conditionDescription: 'recipient_count > 50',
    detrimentalImpactPrevented: 'Domain reputation destruction, spam filters, and high-visibility PR misstatements.',
    evaluator: {
      field: 'recipient_count',
      operator: 'greater_than',
      thresholdValue: 50
    },
    remediationAdvice: 'Send to a 5% canary cohort first, verify engagement and unsubscribe rates, then proceed.'
  },
  {
    id: 'GR_LEG_009',
    name: 'Uncapped Liability & Indemnification Prohibition',
    domain: 'contract_legal',
    description: 'Forbids committing the business to uncapped liability, unlimited indemnity, or non-standard IP transfer in any contract.',
    severity: 'BLOCKING',
    enabled: true,
    conditionDescription: 'has_uncapped_liability == true',
    detrimentalImpactPrevented: 'Existential lawsuit exposure that could bankrupt the company.',
    evaluator: {
      field: 'has_uncapped_liability',
      operator: 'is_true',
      thresholdValue: true
    },
    remediationAdvice: 'Cap liability strictly at 12 months of trailing fees paid under the agreement.'
  }
];

export const DEFAULT_CIRCUIT_BREAKERS: CircuitBreaker[] = [
  {
    id: 'cb_global_kill',
    name: 'Global Emergency Agent Kill-Switch',
    domain: 'custom',
    status: 'ARMED',
    maxTriggerCount: 1,
    currentTriggerCount: 0,
    emergencyAction: 'Instantly halts all autonomous background agent runners, revokes transient API tokens, and switches all trees to STRICT_FOUNDER_ONLY mode.'
  },
  {
    id: 'cb_financial_spend',
    name: 'Treasury & Spend Circuit Breaker',
    domain: 'financial_spend',
    status: 'ARMED',
    maxTriggerCount: 3,
    currentTriggerCount: 0,
    autoResetTimeMinutes: 60,
    emergencyAction: 'Freezes automated billing authorizations and holds all pending payments for manual founder audit.'
  },
  {
    id: 'cb_infra_db',
    name: 'Production DB & Infrastructure Breaker',
    domain: 'infrastructure_db',
    status: 'ARMED',
    maxTriggerCount: 2,
    currentTriggerCount: 0,
    emergencyAction: 'Locks all database write permissions for agent services and alerts on-call DevOps SREs.'
  },
  {
    id: 'cb_outbound_comms',
    name: 'Public Outbound & Email Breaker',
    domain: 'public_communication',
    status: 'ARMED',
    maxTriggerCount: 5,
    currentTriggerCount: 0,
    emergencyAction: 'Suspends external webhook dispatch and queues outbound customer emails into manual moderation review.'
  }
];

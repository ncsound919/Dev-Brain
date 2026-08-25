import { DecisionTree } from '../types';

export const BUILT_IN_DECISION_TREES: Record<string, DecisionTree> = {
  tree_financial_spend: {
    id: 'tree_financial_spend',
    name: 'Financial Commitments & Treasury Spend Gate',
    domain: 'financial_spend',
    description: 'Deterministic evaluation gate for any monetary commitment, tool subscription, vendor invoice, or marketing spend proposed by an autonomous agent or employee.',
    version: '2.4.0',
    category: 'Treasury & Cash Flow',
    businessImpactSummary: 'Protects gross margins, prevents cash runway bleed, and eliminates rogue agent credit card / API spend.',
    detrimentalRiskPrevented: 'Unauthorized capital commitments, negative cash conversion cycles, and unapproved recurring vendor debt.',
    tags: ['treasury', 'spend-cap', 'burn-rate', 'vendor-contracts'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_fs_1',
    nodes: {
      node_fs_1: {
        id: 'node_fs_1',
        title: 'Spend Amount Assessment',
        type: 'condition',
        question: 'What is the total monetary value (USD) of the proposed commitment?',
        description: 'Classify single-instance vs recurring financial commitments.',
        field: 'amount_usd',
        valueType: 'number',
        defaultValue: 250,
        branches: [
          {
            id: 'b_fs_1_micro',
            label: 'Micro Spend (≤ $100)',
            description: 'Routine operational micro-spend within pre-allocated buffer',
            targetNodeId: 'node_fs_2_recurring',
            condition: { field: 'amount_usd', operator: 'less_than_or_equal', value: 100 }
          },
          {
            id: 'b_fs_1_medium',
            label: 'Standard Spend ($101 - $1,000)',
            description: 'Requires department budget check & vendor verification',
            targetNodeId: 'node_fs_3_budget',
            condition: { field: 'amount_usd', operator: 'less_than_or_equal', value: 1000 }
          },
          {
            id: 'b_fs_1_heavy',
            label: 'Capital Spend (> $1,000)',
            description: 'Material commitment requiring founder sign-off',
            targetNodeId: 'node_fs_verdict_founder_signoff',
            condition: { field: 'amount_usd', operator: 'greater_than', value: 1000 }
          }
        ]
      },
      node_fs_2_recurring: {
        id: 'node_fs_2_recurring',
        title: 'Recurring Commitment Check',
        type: 'condition',
        question: 'Is this a recurring subscription / auto-renewing contract?',
        description: 'Recurring commitments multiply annual burn.',
        field: 'is_recurring',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_fs_2_oneoff',
            label: 'One-Time Transaction',
            targetNodeId: 'node_fs_verdict_approved_auto',
            condition: { field: 'is_recurring', operator: 'is_false', value: false }
          },
          {
            id: 'b_fs_2_recurring',
            label: 'Recurring Commitment',
            targetNodeId: 'node_fs_4_cancel_terms',
            condition: { field: 'is_recurring', operator: 'is_true', value: true }
          }
        ]
      },
      node_fs_3_budget: {
        id: 'node_fs_3_budget',
        title: 'Budget Allocation Verification',
        type: 'condition',
        question: 'Has this expense been explicitly allocated in the active monthly budget?',
        description: 'Unallocated expenses must not bypass variance controls.',
        field: 'is_in_budget',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_fs_3_allocated',
            label: 'Allocated in Active Budget',
            targetNodeId: 'node_fs_4_cancel_terms',
            condition: { field: 'is_in_budget', operator: 'is_true', value: true }
          },
          {
            id: 'b_fs_3_unallocated',
            label: 'Unbudgeted / Out-of-Cycle',
            targetNodeId: 'node_fs_verdict_escalate_cfo',
            condition: { field: 'is_in_budget', operator: 'is_false', value: false }
          }
        ]
      },
      node_fs_4_cancel_terms: {
        id: 'node_fs_4_cancel_terms',
        title: 'Vendor Cancellation & Lock-In Terms',
        type: 'condition',
        question: 'Can the commitment be cancelled at any time without penalty (>30-day notice or annual lock-in)?',
        description: 'Long-term commitments impair agile cash pivotability.',
        field: 'has_penalty_free_cancellation',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_fs_4_flexible',
            label: 'Flexible / Month-to-Month',
            targetNodeId: 'node_fs_verdict_conditional_pass',
            condition: { field: 'has_penalty_free_cancellation', operator: 'is_true', value: true }
          },
          {
            id: 'b_fs_4_locked',
            label: 'Annual Lock-in / Termination Fee',
            targetNodeId: 'node_fs_verdict_founder_signoff',
            condition: { field: 'has_penalty_free_cancellation', operator: 'is_false', value: false }
          }
        ]
      },
      node_fs_verdict_approved_auto: {
        id: 'node_fs_verdict_approved_auto',
        title: 'Autonomous Spend Authorized',
        type: 'action_verdict',
        description: 'Micro-spend conforms to all zero-risk policies and budget envelopes.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Monetary value is under micro-threshold ($100), non-recurring, and logged in real-time general ledger.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Log transaction ID to financial audit ledger',
            'Capture receipt / invoice PDF automatically',
            'Tag departmental cost center'
          ],
          allowAutomation: true
        }
      },
      node_fs_verdict_conditional_pass: {
        id: 'node_fs_verdict_conditional_pass',
        title: 'Conditional Approval (With Budget Notification)',
        type: 'action_verdict',
        description: 'Expense authorized with mandatory financial logging and notification hook.',
        verdict: {
          status: 'CONDITIONAL_APPROVAL',
          riskTier: 'MEDIUM',
          reason: 'Expense fits within verified budget envelope with flexible cancellation terms.',
          requiredAuthorizations: ['Agent Lead Notification'],
          mitigationActions: [
            'Send real-time Slack/Webhook alert to Finance channel',
            'Record monthly recurring amortization schedule',
            'Set 30-day ROI evaluation reminder'
          ],
          allowAutomation: true
        }
      },
      node_fs_verdict_escalate_cfo: {
        id: 'node_fs_verdict_escalate_cfo',
        title: 'Escalate to Financial Lead / CFO',
        type: 'action_verdict',
        description: 'Unbudgeted expenditure requires explicit managerial variance sign-off.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'HIGH',
          reason: 'Out-of-cycle spend exceeds autonomous allocation boundary. Risk of budget variance drift.',
          requiredAuthorizations: ['Finance Lead / CFO Token'],
          mitigationActions: [
            'Prepare 1-page business justification',
            'Identify offsetting budget line item reduction'
          ],
          allowAutomation: false
        }
      },
      node_fs_verdict_founder_signoff: {
        id: 'node_fs_verdict_founder_signoff',
        title: 'Hard Gate: Founder Authorization Required',
        type: 'action_verdict',
        description: 'High-capital or binding multi-month contract locked pending Founder 2FA signature.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'CATASTROPHIC',
          reason: 'Significant capital commitment or contractual lock-in that directly impacts cash runway.',
          requiredAuthorizations: ['Founder 2FA Signature', 'Legal/Contract Review'],
          mitigationActions: [
            'Hold execution queue in PENDING_FOUNDER state',
            'Generate 3-Statement Runway Impact Pro-Forma',
            'Require dual-custody approval token'
          ],
          allowAutomation: false
        }
      }
    }
  },

  tree_pricing_discount: {
    id: 'tree_pricing_discount',
    name: 'Pricing, Margin & Discounting Gate',
    domain: 'pricing_discount',
    description: 'Guards pricing power, gross margin thresholds, and contract clauses against over-eager sales agents or discounting errors.',
    version: '3.1.0',
    category: 'Revenue & Go-To-Market',
    businessImpactSummary: 'Protects SaaS gross margins (≥ 75%), stops destructive discounting spirals, and upholds contract pricing integrity.',
    detrimentalRiskPrevented: 'Negative unit economics, custom SLA breach penalties, and unsustainable customer expectations.',
    tags: ['pricing-power', 'gross-margin', 'sales-discounts', 'sla-liabilities'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_pd_1',
    nodes: {
      node_pd_1: {
        id: 'node_pd_1',
        title: 'Discount Percentage Evaluation',
        type: 'condition',
        question: 'What discount percentage is being offered off list price?',
        description: 'Measure pricing concession magnitude.',
        field: 'discount_percentage',
        valueType: 'number',
        defaultValue: 10,
        branches: [
          {
            id: 'b_pd_1_low',
            label: 'Standard Discount (≤ 15%)',
            description: 'Standard sales rep discretion tier',
            targetNodeId: 'node_pd_2_contract_length',
            condition: { field: 'discount_percentage', operator: 'less_than_or_equal', value: 15 }
          },
          {
            id: 'b_pd_1_mid',
            label: 'Deep Concession (16% - 30%)',
            description: 'Requires contract term exchange',
            targetNodeId: 'node_pd_3_margin_check',
            condition: { field: 'discount_percentage', operator: 'less_than_or_equal', value: 30 }
          },
          {
            id: 'b_pd_1_extreme',
            label: 'Severe Concession (> 30%)',
            description: 'Threatens gross margin floor',
            targetNodeId: 'node_pd_verdict_founder_veto',
            condition: { field: 'discount_percentage', operator: 'greater_than', value: 30 }
          }
        ]
      },
      node_pd_2_contract_length: {
        id: 'node_pd_2_contract_length',
        title: 'Commitment Term Horizon',
        type: 'condition',
        question: 'Is the customer committing to an upfront annual (or multi-year) payment term?',
        description: 'Discounts must be earned through prepaid cash cycles.',
        field: 'is_annual_prepaid',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_pd_2_annual',
            label: 'Annual Prepaid (Cash Inflow)',
            targetNodeId: 'node_pd_4_custom_sla',
            condition: { field: 'is_annual_prepaid', operator: 'is_true', value: true }
          },
          {
            id: 'b_pd_2_monthly',
            label: 'Monthly Payment (No Cash Float)',
            targetNodeId: 'node_pd_verdict_reject_monthly_discount',
            condition: { field: 'is_annual_prepaid', operator: 'is_false', value: false }
          }
        ]
      },
      node_pd_3_margin_check: {
        id: 'node_pd_3_margin_check',
        title: 'Delivered Gross Margin Projection',
        type: 'condition',
        question: 'Does the account project ≥ 70% gross margin after direct compute/support costs?',
        description: 'Warren Buffett / Aswath Damodaran principle: Never sell revenue at negative unit contribution.',
        field: 'projected_gross_margin',
        valueType: 'number',
        defaultValue: 75,
        branches: [
          {
            id: 'b_pd_3_healthy',
            label: 'Gross Margin ≥ 70%',
            targetNodeId: 'node_pd_4_custom_sla',
            condition: { field: 'projected_gross_margin', operator: 'greater_than_or_equal', value: 70 }
          },
          {
            id: 'b_pd_3_eroded',
            label: 'Gross Margin < 70%',
            targetNodeId: 'node_pd_verdict_reject_margin_erosion',
            condition: { field: 'projected_gross_margin', operator: 'less_than', value: 70 }
          }
        ]
      },
      node_pd_4_custom_sla: {
        id: 'node_pd_4_custom_sla',
        title: 'Custom Legal Terms & SLA Liability',
        type: 'condition',
        question: 'Does the contract contain custom SLA penalties, uncapped indemnity, or non-standard IP terms?',
        description: 'Custom legal clauses present asymmetric downside risks.',
        field: 'has_custom_liabilities',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_pd_4_standard',
            label: 'Standard Terms & Conditions',
            targetNodeId: 'node_pd_verdict_approved_pricing',
            condition: { field: 'has_custom_liabilities', operator: 'is_false', value: false }
          },
          {
            id: 'b_pd_4_custom',
            label: 'Custom SLA Penalties / Indemnity',
            targetNodeId: 'node_pd_verdict_legal_escalation',
            condition: { field: 'has_custom_liabilities', operator: 'is_true', value: true }
          }
        ]
      },
      node_pd_verdict_approved_pricing: {
        id: 'node_pd_verdict_approved_pricing',
        title: 'Pricing Concession Authorized',
        type: 'action_verdict',
        description: 'Deal terms satisfy gross margin floors and prepaid cash flow incentives.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Discount is earned via upfront annual prepaid commitment while preserving >70% gross margins on standard terms.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Generate binding quote with 14-day expiration window',
            'Enforce annual auto-renewal at standard list price minus 5% cap',
            'Record deal metrics in RevOps analytics'
          ],
          allowAutomation: true
        }
      },
      node_pd_verdict_reject_monthly_discount: {
        id: 'node_pd_verdict_reject_monthly_discount',
        title: 'Rejected: Discount Forbidden on Monthly Billing',
        type: 'action_verdict',
        description: 'Discounts on monthly plans invite churn with zero working capital benefit.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'MEDIUM',
          reason: 'Company policy strictly prohibits recurring discounts on month-to-month contracts. Converts to churn without cash advance.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Counter-offer: Switch customer to Annual billing to unlock requested discount',
            'Offer non-monetary value-add (e.g. priority onboarding credits)'
          ],
          allowAutomation: false
        }
      },
      node_pd_verdict_reject_margin_erosion: {
        id: 'node_pd_verdict_reject_margin_erosion',
        title: 'Hard Veto: Gross Margin Below Floor (<70%)',
        type: 'action_verdict',
        description: 'Vetoed to preserve business unit economics.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'HIGH',
          reason: 'Concession erodes account contribution margin below operational baseline. Destroys business equity value.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Restructure package to eliminate costly custom compute/storage tiers',
            'Review with Head of Sales before resubmitting'
          ],
          allowAutomation: false
        }
      },
      node_pd_verdict_legal_escalation: {
        id: 'node_pd_verdict_legal_escalation',
        title: 'Escalate: Legal & Executive Review Required',
        type: 'action_verdict',
        description: 'Custom SLA or indemnification clauses require counsel signoff.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'HIGH',
          reason: 'Custom contractual liabilities introduce non-linear tail risks exceeding software margins.',
          requiredAuthorizations: ['Legal Counsel Signoff', 'Founder Approval'],
          mitigationActions: [
            'Cap financial liability at 12 months of trailing fees',
            'Replace custom penalty with standard service credit remedy'
          ],
          allowAutomation: false
        }
      },
      node_pd_verdict_founder_veto: {
        id: 'node_pd_verdict_founder_veto',
        title: 'Hard Gate: Extreme Concession (>30%)',
        type: 'action_verdict',
        description: 'Massive discount requires Founder direct intervention.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'CATASTROPHIC',
          reason: 'Discounts over 30% permanently degrade market pricing power and brand perception.',
          requiredAuthorizations: ['Founder / CEO Direct Token'],
          mitigationActions: [
            'Require multi-year lock-in with guaranteed case study & co-marketing rights',
            'Insert strict volume minimums'
          ],
          allowAutomation: false
        }
      }
    }
  },

  tree_infrastructure_db: {
    id: 'tree_infrastructure_db',
    name: 'Production Infrastructure & DB Mutation Guard',
    domain: 'infrastructure_db',
    description: 'Deterministic firewall preventing autonomous agents and scripts from executing destructive schema drops, un-backed up data mutations, or unmonitored production deployments.',
    version: '4.0.0',
    category: 'Engineering & Data Integrity',
    businessImpactSummary: 'Ensures 99.99% uptime, zero customer data loss, and eliminates unrecoverable database outages.',
    detrimentalRiskPrevented: 'DROP TABLE / destructive migrations, production database corruption, unindexed load spikes, and irreversible downtime.',
    tags: ['database-safety', 'production-guard', 'data-integrity', 'zero-downtime'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_idb_1',
    nodes: {
      node_idb_1: {
        id: 'node_idb_1',
        title: 'Target Environment & Operation Type',
        type: 'condition',
        question: 'Is this operation targeting the Production environment, and does it involve data mutation or DDL schema changes?',
        description: 'Read-only queries in non-prod have zero blast radius.',
        field: 'is_production_mutation',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_idb_1_prod_write',
            label: 'Production Write / DDL Mutation',
            description: 'Direct impact on live user state',
            targetNodeId: 'node_idb_2_destructive_ops',
            condition: { field: 'is_production_mutation', operator: 'is_true', value: true }
          },
          {
            id: 'b_idb_1_read_or_stage',
            label: 'Staging / Dev / Read-Only Query',
            description: 'Isolated test environment',
            targetNodeId: 'node_idb_verdict_approved_sandbox',
            condition: { field: 'is_production_mutation', operator: 'is_false', value: false }
          }
        ]
      },
      node_idb_2_destructive_ops: {
        id: 'node_idb_2_destructive_ops',
        title: 'Destructive DDL & Deletion Syntax Check',
        type: 'condition',
        question: 'Does the operation contain DROP, TRUNCATE, ALTER TABLE DROP COLUMN, or DELETE without a primary key WHERE clause?',
        description: 'Unconstrained data destruction commands.',
        field: 'has_destructive_syntax',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_idb_2_destructive',
            label: 'Destructive DDL / Mass DELETE',
            targetNodeId: 'node_idb_verdict_hard_banned',
            condition: { field: 'has_destructive_syntax', operator: 'is_true', value: true }
          },
          {
            id: 'b_idb_2_safe_ddl',
            label: 'Additive Schema / Guarded Mutation',
            targetNodeId: 'node_idb_3_backup_verify',
            condition: { field: 'has_destructive_syntax', operator: 'is_false', value: false }
          }
        ]
      },
      node_idb_3_backup_verify: {
        id: 'node_idb_3_backup_verify',
        title: 'Automated Snapshot & Rollback Verification',
        type: 'condition',
        question: 'Has a fresh (<15min) point-in-time snapshot been captured, and has a tested down-migration script been verified?',
        description: 'Jeff Dean / SRE principle: Never execute a forward migration without an instant rollback script.',
        field: 'has_verified_rollback_and_backup',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_idb_3_verified',
            label: 'Snapshot & Rollback Script Verified',
            targetNodeId: 'node_idb_4_blast_radius',
            condition: { field: 'has_verified_rollback_and_backup', operator: 'is_true', value: true }
          },
          {
            id: 'b_idb_3_unverified',
            label: 'No Verified Rollback / Stale Snapshot',
            targetNodeId: 'node_idb_verdict_require_backup',
            condition: { field: 'has_verified_rollback_and_backup', operator: 'is_false', value: false }
          }
        ]
      },
      node_idb_4_blast_radius: {
        id: 'node_idb_4_blast_radius',
        title: 'Estimated Row Lock & User Blast Radius',
        type: 'condition',
        question: 'Will this query/migration lock more than 10,000 rows or run for longer than 3 seconds during business hours?',
        description: 'Prevents database connection pool exhaustion and table deadlocks.',
        field: 'is_heavy_table_lock',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_idb_4_light',
            label: 'Low Lock (<3s, Batched Chunks)',
            targetNodeId: 'node_idb_verdict_approved_maintenance',
            condition: { field: 'is_heavy_table_lock', operator: 'is_false', value: false }
          },
          {
            id: 'b_idb_4_heavy',
            label: 'Heavy Table Lock (>10k rows)',
            targetNodeId: 'node_idb_verdict_scheduled_window',
            condition: { field: 'is_heavy_table_lock', operator: 'is_true', value: true }
          }
        ]
      },
      node_idb_verdict_approved_sandbox: {
        id: 'node_idb_verdict_approved_sandbox',
        title: 'Non-Production Execution Allowed',
        type: 'action_verdict',
        description: 'Operation is contained in sandboxed non-production environment.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Operation is read-only or executed in isolated staging environment with zero customer blast radius.',
          requiredAuthorizations: [],
          mitigationActions: ['Log query telemetry in dev monitoring'],
          allowAutomation: true
        }
      },
      node_idb_verdict_hard_banned: {
        id: 'node_idb_verdict_hard_banned',
        title: 'HARD BLOCK: Destructive DDL / Unconstrained Delete',
        type: 'action_verdict',
        description: 'Completely blocked. Autonomous agents are permanently banned from raw DROP/TRUNCATE in production.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'CATASTROPHIC',
          reason: 'Direct DROP/TRUNCATE command in production violates the fundamental data safety invariant. Immediate hard block.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Immediate query abort',
            'Trip DB Agent Circuit Breaker',
            'Alert Engineering Lead with exact SQL payload'
          ],
          allowAutomation: false
        }
      },
      node_idb_verdict_require_backup: {
        id: 'node_idb_verdict_require_backup',
        title: 'Halted: Snapshot & Rollback Script Mandatory',
        type: 'action_verdict',
        description: 'Cannot proceed without verifiable safety net.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'HIGH',
          reason: 'Production mutation attempted without verified point-in-time snapshot and tested down-migration.',
          requiredAuthorizations: ['DevOps Lead Signoff'],
          mitigationActions: [
            'Trigger automated database snapshot now',
            'Generate idempotent revert script',
            'Test rollback in staging replica'
          ],
          allowAutomation: false
        }
      },
      node_idb_verdict_scheduled_window: {
        id: 'node_idb_verdict_scheduled_window',
        title: 'Hold for Scheduled Maintenance Window',
        type: 'action_verdict',
        description: 'Heavy locking operations must be executed during low-traffic maintenance windows.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'HIGH',
          reason: 'Large table lock risk during peak production hours. May cause request timeouts and cascade failure.',
          requiredAuthorizations: ['Engineering Lead / Founder'],
          mitigationActions: [
            'Batch migration into 1,000-row incremental chunks',
            'Schedule execution during 02:00-04:00 UTC maintenance window',
            'Enable read-replica failover standbys'
          ],
          allowAutomation: false
        }
      },
      node_idb_verdict_approved_maintenance: {
        id: 'node_idb_verdict_approved_maintenance',
        title: 'Production Migration Authorized (Batched)',
        type: 'action_verdict',
        description: 'Safe, batched schema modification with verified safety net.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'MEDIUM',
          reason: 'Additive change with verified snapshot, chunked batching, and sub-3-second locking profile.',
          requiredAuthorizations: ['Automated CI/CD Token'],
          mitigationActions: [
            'Stream lock monitoring metrics to SRE dashboard',
            'Auto-abort if query duration exceeds 5,000ms'
          ],
          allowAutomation: true
        }
      }
    }
  },

  tree_agent_autonomous_tool: {
    id: 'tree_agent_autonomous_tool',
    name: 'Autonomous AI Agent Action & Tool-Calling Gate',
    domain: 'agent_autonomous_tool',
    description: 'System-level decision tree that every autonomous agent must query before invoking external APIs, webhooks, file writes, or recursive sub-agent loops.',
    version: '5.0.0',
    category: 'AI Safety & Agent Governance',
    businessImpactSummary: 'Eliminates infinite LLM token loops, unauthorized webhooks, hallucinated write actions, and PII leakage.',
    detrimentalRiskPrevented: 'Rogue external API mutations, massive API billing blowouts, confidential data leaks, and uncontrolled agent recursion.',
    tags: ['agent-safety', 'tool-calling', 'token-budget', 'pii-protection', 'circuit-breaker'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_aat_1',
    nodes: {
      node_aat_1: {
        id: 'node_aat_1',
        title: 'Tool Action Category & Intent',
        type: 'condition',
        question: 'Does the proposed tool call perform an external write, send external emails/webhooks, or modify storage?',
        description: 'Read-only queries (GET) carry minimal risk; stateful side-effects carry high risk.',
        field: 'is_stateful_write',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_aat_1_read',
            label: 'Read-Only / Retrieval (GET)',
            targetNodeId: 'node_aat_2_token_cost',
            condition: { field: 'is_stateful_write', operator: 'is_false', value: false }
          },
          {
            id: 'b_aat_1_write',
            label: 'Stateful Write / External API Call (POST/PUT/DELETE)',
            targetNodeId: 'node_aat_3_pii_check',
            condition: { field: 'is_stateful_write', operator: 'is_true', value: true }
          }
        ]
      },
      node_aat_2_token_cost: {
        id: 'node_aat_2_token_cost',
        title: 'Estimated Token & Inference Cost',
        type: 'condition',
        question: 'Is the estimated cumulative token / compute cost for this task under $5.00?',
        description: 'Guards against recursive loop budget depletion.',
        field: 'estimated_cost_usd',
        valueType: 'number',
        defaultValue: 0.15,
        branches: [
          {
            id: 'b_aat_2_normal',
            label: 'Under $5.00 Budget',
            targetNodeId: 'node_aat_verdict_approved_tool',
            condition: { field: 'estimated_cost_usd', operator: 'less_than_or_equal', value: 5.0 }
          },
          {
            id: 'b_aat_2_excessive',
            label: 'Exceeds $5.00 Token Cap',
            targetNodeId: 'node_aat_verdict_token_throttle',
            condition: { field: 'estimated_cost_usd', operator: 'greater_than', value: 5.0 }
          }
        ]
      },
      node_aat_3_pii_check: {
        id: 'node_aat_3_pii_check',
        title: 'Confidentiality & PII Payload Scan',
        type: 'condition',
        question: 'Does the payload contain unmasked PII, credentials, API secret keys, or private customer records?',
        description: 'Zero-tolerance boundary against data exfiltration.',
        field: 'contains_pii_or_secrets',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_aat_3_clean',
            label: 'Sanitized / No PII or Secrets',
            targetNodeId: 'node_aat_4_recursion_depth',
            condition: { field: 'contains_pii_or_secrets', operator: 'is_false', value: false }
          },
          {
            id: 'b_aat_3_pii',
            label: 'Contains Unmasked PII / Secrets',
            targetNodeId: 'node_aat_verdict_block_pii',
            condition: { field: 'contains_pii_or_secrets', operator: 'is_true', value: true }
          }
        ]
      },
      node_aat_4_recursion_depth: {
        id: 'node_aat_4_recursion_depth',
        title: 'Agent Recursion Depth & Spawn Count',
        type: 'condition',
        question: 'What is the current sub-agent nesting depth and tool invocation count in this session?',
        description: 'Prevents runaway asynchronous child agent swarms.',
        field: 'recursion_depth',
        valueType: 'number',
        defaultValue: 2,
        branches: [
          {
            id: 'b_aat_4_safe',
            label: 'Depth ≤ 4 (Controlled Stack)',
            targetNodeId: 'node_aat_verdict_approved_write_tool',
            condition: { field: 'recursion_depth', operator: 'less_than_or_equal', value: 4 }
          },
          {
            id: 'b_aat_4_deep',
            label: 'Depth > 4 (Potential Loop)',
            targetNodeId: 'node_aat_verdict_halt_recursion',
            condition: { field: 'recursion_depth', operator: 'greater_than', value: 4 }
          }
        ]
      },
      node_aat_verdict_approved_tool: {
        id: 'node_aat_verdict_approved_tool',
        title: 'Tool Execution Approved (Read/Search)',
        type: 'action_verdict',
        description: 'Read-only tool call conforms to all safety and budget criteria.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Tool operation is read-only, sanitized, and well within single-call token budget.',
          requiredAuthorizations: [],
          mitigationActions: ['Log tool execution telemetry in session trace'],
          allowAutomation: true
        }
      },
      node_aat_verdict_approved_write_tool: {
        id: 'node_aat_verdict_approved_write_tool',
        title: 'Stateful Tool Authorized (Logged & Monitored)',
        type: 'action_verdict',
        description: 'External write call authorized with full payload tracing.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'MEDIUM',
          reason: 'Stateful write is sanitized of PII, within recursion bounds, and bounded by idempotency keys.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Attach idempotency-key header to external HTTP request',
            'Record pre/post state hash in audit log',
            'Set 10-second timeout limit'
          ],
          allowAutomation: true
        }
      },
      node_aat_verdict_block_pii: {
        id: 'node_aat_verdict_block_pii',
        title: 'HARD BLOCK: Confidential Data / PII Leakage',
        type: 'action_verdict',
        description: 'Critical block against data exfiltration.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'CATASTROPHIC',
          reason: 'Agent payload attempted to transmit unmasked customer PII or API credentials to an external destination.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Immediate payload drop',
            'Quarantine calling agent instance',
            'Notify Security Lead of credential leak attempt'
          ],
          allowAutomation: false
        }
      },
      node_aat_verdict_halt_recursion: {
        id: 'node_aat_verdict_halt_recursion',
        title: 'Halted: Recursion Limit Exceeded (Loop Guard)',
        type: 'action_verdict',
        description: 'Stops runaway agent reasoning loops.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'HIGH',
          reason: 'Agent nesting depth exceeded safety ceiling (Depth > 4). Indicates infinite reasoning loop or hallucinated recursion.',
          requiredAuthorizations: ['Agent Supervisor Token'],
          mitigationActions: [
            'Terminate child agent sub-processes',
            'Flush pending tool queue',
            'Return intermediate summary to user'
          ],
          allowAutomation: false
        }
      },
      node_aat_verdict_token_throttle: {
        id: 'node_aat_verdict_token_throttle',
        title: 'Throttled: High Compute/Token Budget Alert',
        type: 'action_verdict',
        description: 'High-cost query requires explicit budget confirmation.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'HIGH',
          reason: 'Single prompt context / agent tool call exceeds $5.00 compute threshold.',
          requiredAuthorizations: ['Founder / Budget Owner'],
          mitigationActions: [
            'Compress context window using vector embeddings or summary',
            'Switch to lighter model tier if full context is not required'
          ],
          allowAutomation: false
        }
      }
    }
  },

  tree_customer_refund_comms: {
    id: 'tree_customer_refund_comms',
    name: 'Customer Communications, Refunds & Public Outbound Gate',
    domain: 'public_communication',
    description: 'Guards brand reputation, legal representations, broadcast email sends, and financial refund approvals handled by customer support and marketing agents.',
    version: '2.0.0',
    category: 'Brand, Support & Public Relations',
    businessImpactSummary: 'Stops PR blunders, unapproved mass spamming, false product roadmap promises, and unauthorized refund leakage.',
    detrimentalRiskPrevented: 'Disastrous brand statements, binding false commitments, mass email IP reputation blacklisting, and dispute fraud.',
    tags: ['refund-policy', 'support-bot', 'public-pr', 'email-broadcast', 'brand-protection'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_crc_1',
    nodes: {
      node_crc_1: {
        id: 'node_crc_1',
        title: 'Communication Scope & Channel',
        type: 'condition',
        question: 'Is this a 1-to-1 individual support response, a financial refund request, or a broadcast announcement to >50 users?',
        description: 'Broadcast and financial actions carry exponentially higher blast radius than routine 1-on-1 support.',
        field: 'action_scope',
        valueType: 'select',
        options: ['individual_support', 'financial_refund', 'mass_broadcast', 'public_social_post'],
        defaultValue: 'individual_support',
        branches: [
          {
            id: 'b_crc_1_support',
            label: '1-to-1 Individual Support Reply',
            targetNodeId: 'node_crc_2_roadmap_claims',
            condition: { field: 'action_scope', operator: 'equals', value: 'individual_support' }
          },
          {
            id: 'b_crc_1_refund',
            label: 'Customer Refund / Billing Adjustment',
            targetNodeId: 'node_crc_3_refund_amount',
            condition: { field: 'action_scope', operator: 'equals', value: 'financial_refund' }
          },
          {
            id: 'b_crc_1_broadcast',
            label: 'Mass Broadcast (>50 Recipients) / Public Social',
            targetNodeId: 'node_crc_verdict_escalate_broadcast',
            condition: { field: 'action_scope', operator: 'in_list', value: ['mass_broadcast', 'public_social_post'] }
          }
        ]
      },
      node_crc_2_roadmap_claims: {
        id: 'node_crc_2_roadmap_claims',
        title: 'Contractual & Roadmap Statement Check',
        type: 'condition',
        question: 'Does the response promise specific unreleased features, contractual deadlines, or financial compensations?',
        description: 'Prevents customer support agents from legally binding the company.',
        field: 'contains_future_promises',
        valueType: 'boolean',
        defaultValue: false,
        branches: [
          {
            id: 'b_crc_2_clean',
            label: 'No Binding Promises / Standard Help',
            targetNodeId: 'node_crc_verdict_approved_reply',
            condition: { field: 'contains_future_promises', operator: 'is_false', value: false }
          },
          {
            id: 'b_crc_2_promises',
            label: 'Contains Unverified Roadmap / Compensations',
            targetNodeId: 'node_crc_verdict_block_promises',
            condition: { field: 'contains_future_promises', operator: 'is_true', value: true }
          }
        ]
      },
      node_crc_3_refund_amount: {
        id: 'node_crc_3_refund_amount',
        title: 'Refund Magnitude Assessment',
        type: 'condition',
        question: 'What is the refund or credit amount being issued (USD)?',
        description: 'Auto-refund cap is set to $100 for verified accounts in good standing.',
        field: 'refund_amount_usd',
        valueType: 'number',
        defaultValue: 45,
        branches: [
          {
            id: 'b_crc_3_micro',
            label: 'Micro Refund (≤ $100)',
            targetNodeId: 'node_crc_4_dispute_history',
            condition: { field: 'refund_amount_usd', operator: 'less_than_or_equal', value: 100 }
          },
          {
            id: 'b_crc_3_large',
            label: 'Major Refund (> $100)',
            targetNodeId: 'node_crc_verdict_escalate_refund',
            condition: { field: 'refund_amount_usd', operator: 'greater_than', value: 100 }
          }
        ]
      },
      node_crc_4_dispute_history: {
        id: 'node_crc_4_dispute_history',
        title: 'Account Standing & Fraud Pattern Check',
        type: 'condition',
        question: 'Has the account had zero prior chargebacks and an active subscription tenure > 30 days?',
        description: 'Guards against repeat refund abuse.',
        field: 'is_good_standing_account',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_crc_4_good',
            label: 'Good Standing (No Abuse History)',
            targetNodeId: 'node_crc_verdict_approved_refund',
            condition: { field: 'is_good_standing_account', operator: 'is_true', value: true }
          },
          {
            id: 'b_crc_4_flagged',
            label: 'Flagged Account / Recent Chargeback',
            targetNodeId: 'node_crc_verdict_escalate_refund',
            condition: { field: 'is_good_standing_account', operator: 'is_false', value: false }
          }
        ]
      },
      node_crc_verdict_approved_reply: {
        id: 'node_crc_verdict_approved_reply',
        title: 'Support Response Approved',
        type: 'action_verdict',
        description: 'Safe, empathetic response complying with knowledge base guidelines.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Individual communication contains no binding liabilities or unverified roadmap statements.',
          requiredAuthorizations: [],
          mitigationActions: ['Store message in customer CRM conversation thread'],
          allowAutomation: true
        }
      },
      node_crc_verdict_approved_refund: {
        id: 'node_crc_verdict_approved_refund',
        title: 'Autonomous Micro-Refund Authorized',
        type: 'action_verdict',
        description: 'Good-will micro refund executed automatically to maintain customer satisfaction.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Refund is within micro-limit ($100) for a verified customer in good standing.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Issue Stripe/Payment Gateway refund with reason: CUSTOMER_SATISFACTION',
            'Send automated receipt email',
            'Record churn prevention metric'
          ],
          allowAutomation: true
        }
      },
      node_crc_verdict_block_promises: {
        id: 'node_crc_verdict_block_promises',
        title: 'REJECTED: Unverified Roadmap / Legal Liability',
        type: 'action_verdict',
        description: 'Agent cannot make unapproved promises regarding delivery dates or custom SLA remedies.',
        verdict: {
          status: 'REJECTED',
          riskTier: 'HIGH',
          reason: 'Response contains commitments that may constitute promissory estoppel or breach of contract.',
          requiredAuthorizations: [],
          mitigationActions: [
            'Rewrite response using official public documentation',
            'Direct customer to official public feedback portal'
          ],
          allowAutomation: false
        }
      },
      node_crc_verdict_escalate_refund: {
        id: 'node_crc_verdict_escalate_refund',
        title: 'Escalate to Support Lead / Finance',
        type: 'action_verdict',
        description: 'Refund amount or account risk requires human assessment.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'MEDIUM',
          reason: 'Refund exceeds autonomous threshold or account exhibits suspicious dispute indicators.',
          requiredAuthorizations: ['Support Manager / Finance'],
          mitigationActions: [
            'Audit customer usage logs and invoice history',
            'Prepare retention discount counter-proposal'
          ],
          allowAutomation: false
        }
      },
      node_crc_verdict_escalate_broadcast: {
        id: 'node_crc_verdict_escalate_broadcast',
        title: 'Hard Gate: Broadcast & Public Comms Review',
        type: 'action_verdict',
        description: 'Mass messaging and public posts carry massive brand and spam risks.',
        verdict: {
          status: 'ESCALATE_TO_FOUNDER',
          riskTier: 'HIGH',
          reason: 'Mass outbound communication can trigger email spam penalties, domain blacklisting, and brand reputational damage.',
          requiredAuthorizations: ['Founder / Head of Marketing 2FA'],
          mitigationActions: [
            'Test message spam score & deliverability inbox test',
            'Run tone and legal compliance check',
            'Perform 10% canary batch send first'
          ],
          allowAutomation: false
        }
      }
    }
  },

  tree_nba_tactical_clutch: {
    id: 'tree_nba_tactical_clutch',
    name: 'NBA 4th Quarter Late-Game Tactical Decision Gate',
    domain: 'custom',
    description: 'Biomechanical & statistical decision branch for 4th quarter late-game play selection (P&R vs ISO vs Kickout) considering fatigue drift, fouls, and defensive coverage.',
    version: '3.1.0',
    category: 'Sports & Tactical OS',
    businessImpactSummary: 'Maximizes late-game win probability while controlling star player fatigue drift and turnover exposure.',
    detrimentalRiskPrevented: 'High-fatigue hero-ball turnovers, poor foul management, and suboptimal shot selection against double-teams.',
    tags: ['nba', 'tactical-genome', 'clutch', 'fatigue-drift', 'play-call'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_nba_1_fatigue',
    nodes: {
      node_nba_1_fatigue: {
        id: 'node_nba_1_fatigue',
        title: 'Star Player Fatigue Load Assessment',
        type: 'condition',
        question: 'What is the primary ball-handler’s current fatigue load score (%)?',
        description: 'Fatigue above 80% reduces ISO efficiency by 34% and increases turnover probability.',
        field: 'player_fatigue_percent',
        valueType: 'number',
        defaultValue: 65,
        branches: [
          {
            id: 'b_nba_fresh',
            label: 'Fresh / Moderate Load (≤ 75%)',
            description: 'Player maintains explosive drive and pull-up capability',
            targetNodeId: 'node_nba_2_coverage',
            condition: { field: 'player_fatigue_percent', operator: 'less_than_or_equal', value: 75 }
          },
          {
            id: 'b_nba_exhausted',
            label: 'High Fatigue Load (> 75%)',
            description: 'High risk of short shot & late-game turnover on heavy drive',
            targetNodeId: 'node_nba_3_motion',
            condition: { field: 'player_fatigue_percent', operator: 'greater_than', value: 75 }
          }
        ]
      },
      node_nba_2_coverage: {
        id: 'node_nba_2_coverage',
        title: 'Opponent Defensive Scheme Check',
        type: 'condition',
        question: 'What coverage scheme is the opponent digital twin deploying?',
        description: 'Detect Blitz / Trap vs Drop Coverage vs Switch All.',
        field: 'defensive_scheme',
        valueType: 'select',
        options: ['Blitz / Double Team', 'Drop Coverage', 'Switch All'],
        defaultValue: 'Drop Coverage',
        branches: [
          {
            id: 'b_nba_blitz',
            label: 'Blitz / Double Team',
            targetNodeId: 'node_nba_verdict_skip_pass',
            condition: { field: 'defensive_scheme', operator: 'equals', value: 'Blitz / Double Team' }
          },
          {
            id: 'b_nba_drop',
            label: 'Drop Coverage',
            targetNodeId: 'node_nba_verdict_pr_midrange',
            condition: { field: 'defensive_scheme', operator: 'equals', value: 'Drop Coverage' }
          },
          {
            id: 'b_nba_switch',
            label: 'Switch All',
            targetNodeId: 'node_nba_verdict_mismatch_iso',
            condition: { field: 'defensive_scheme', operator: 'equals', value: 'Switch All' }
          }
        ]
      },
      node_nba_3_motion: {
        id: 'node_nba_3_motion',
        title: 'Off-Ball Shooter Availability',
        type: 'condition',
        question: 'Is a 40%+ 3-point shooter active on the weakside wing?',
        description: 'Relieve primary ball handler through off-ball screening or corner kickout.',
        field: 'has_elite_weakside_shooter',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_nba_shooter_yes',
            label: 'Elite Weakside Shooter Present',
            targetNodeId: 'node_nba_verdict_pin_down',
            condition: { field: 'has_elite_weakside_shooter', operator: 'is_true', value: true }
          },
          {
            id: 'b_nba_shooter_no',
            label: 'No Elite Weakside Shooter',
            targetNodeId: 'node_nba_verdict_post_up',
            condition: { field: 'has_elite_weakside_shooter', operator: 'is_false', value: false }
          }
        ]
      },
      node_nba_verdict_skip_pass: {
        id: 'node_nba_verdict_skip_pass',
        title: 'APPROVED: High-Pick & Short-Roll Slip to Weakside',
        type: 'action_verdict',
        description: 'Exploit double-team via 4-on-3 short roll advantage.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Double team leaves corner or roll-man open. Expected value: 1.28 points per possession.',
          requiredAuthorizations: [],
          mitigationActions: ['Communicate quick 0.5-second decision rule to point guard'],
          allowAutomation: true
        }
      },
      node_nba_verdict_pr_midrange: {
        id: 'node_nba_verdict_pr_midrange',
        title: 'APPROVED: High Pick & Roll / Midrange Pull-up',
        type: 'action_verdict',
        description: 'Punish drop defender sitting deep in the paint.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Ball handler is fresh and drop coverage creates 8-foot uncontested pull-up space.',
          requiredAuthorizations: [],
          mitigationActions: ['Set screen at 28 feet to widen space'],
          allowAutomation: true
        }
      },
      node_nba_verdict_mismatch_iso: {
        id: 'node_nba_verdict_mismatch_iso',
        title: 'APPROVED: Clear-Out Mismatch Isolation',
        type: 'action_verdict',
        description: 'Attack big defender on switch.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'MEDIUM',
          reason: 'Speed differential on switched big produces 62% foul rate or drive finish.',
          requiredAuthorizations: [],
          mitigationActions: ['Clear out strongside corner to eliminate help help-side drop'],
          allowAutomation: true
        }
      },
      node_nba_verdict_pin_down: {
        id: 'node_nba_verdict_pin_down',
        title: 'APPROVED: Weakside Stagger Pin-Down Action',
        type: 'action_verdict',
        description: 'Conserve star energy by running weakside catch-and-shoot.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Leverages elite weakside shooter while reducing star ball-handler fatigue load.',
          requiredAuthorizations: [],
          mitigationActions: ['Ensure big sets solid second stagger screen'],
          allowAutomation: true
        }
      },
      node_nba_verdict_post_up: {
        id: 'node_nba_verdict_post_up',
        title: 'CONDITIONAL APPROVAL: Low-Block Seal & Hi-Lo Entry',
        type: 'action_verdict',
        description: 'Slow down pace to control clock and guarantee high-percentage paint touch.',
        verdict: {
          status: 'CONDITIONAL_APPROVAL',
          riskTier: 'MEDIUM',
          reason: 'High-fatigue guard play requires transferring scoring load to interior post position.',
          requiredAuthorizations: ['Head Coach Timeout Signoff'],
          mitigationActions: ['Clear entry lane and ensure 5-second back-to-basket clock monitoring'],
          allowAutomation: false
        }
      }
    }
  },

  tree_nfl_fourth_down: {
    id: 'tree_nfl_fourth_down',
    name: 'NFL 4th Down Aggression & Field Position Matrix',
    domain: 'custom',
    description: 'Deterministic analytics gate for 4th Down Go-For-It vs Field Goal vs Punt based on distance, field position, and expected win probability swing.',
    version: '2.1.0',
    category: 'Sports & Tactical OS',
    businessImpactSummary: 'Eliminates emotional / overly conservative head coach decisions on 4th down using win probability optimization.',
    detrimentalRiskPrevented: 'Surrendering high-leverage possession in opponent territory or blowing game-ending drive opportunities.',
    tags: ['nfl', '4th-down', 'analytics', 'win-probability', 'tactical-genome'],
    updatedAt: '2026-08-24',
    rootNodeId: 'node_nfl_1_distance',
    nodes: {
      node_nfl_1_distance: {
        id: 'node_nfl_1_distance',
        title: 'Distance to Gain Assessment',
        type: 'condition',
        question: 'How many yards are needed to convert the 1st Down / Touchdown?',
        description: 'Segment short yardage (≤ 2 yards) vs medium (3-5 yards) vs long (> 5 yards).',
        field: 'yards_to_go',
        valueType: 'number',
        defaultValue: 2,
        branches: [
          {
            id: 'b_nfl_short',
            label: 'Short Yardage (≤ 2 Yards)',
            targetNodeId: 'node_nfl_2_field_pos',
            condition: { field: 'yards_to_go', operator: 'less_than_or_equal', value: 2 }
          },
          {
            id: 'b_nfl_long',
            label: 'Long Yardage (> 2 Yards)',
            targetNodeId: 'node_nfl_3_fg_range',
            condition: { field: 'yards_to_go', operator: 'greater_than', value: 2 }
          }
        ]
      },
      node_nfl_2_field_pos: {
        id: 'node_nfl_2_field_pos',
        title: 'Field Position Check',
        type: 'condition',
        question: 'Are you past your own 40-yard line (Opponent territory or Midfield)?',
        description: 'Short yardage past midfield has a +4.2% Win Probability boost when attempting conversion.',
        field: 'is_past_midfield',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_nfl_past_midfield',
            label: 'Past Midfield / Opponent Territory',
            targetNodeId: 'node_nfl_verdict_go_for_it',
            condition: { field: 'is_past_midfield', operator: 'is_true', value: true }
          },
          {
            id: 'b_nfl_own_territory',
            label: 'Deep in Own Territory (≤ Own 35)',
            targetNodeId: 'node_nfl_verdict_punt_safe',
            condition: { field: 'is_past_midfield', operator: 'is_false', value: false }
          }
        ]
      },
      node_nfl_3_fg_range: {
        id: 'node_nfl_3_fg_range',
        title: 'Kicker Field Goal Distance Assessment',
        type: 'condition',
        question: 'Is the field goal distance within kicker’s 80%+ historical threshold (≤ 52 yards)?',
        description: 'Evaluate kicker success probability against turn-over-on-downs field position loss.',
        field: 'is_within_fg_range',
        valueType: 'boolean',
        defaultValue: true,
        branches: [
          {
            id: 'b_nfl_fg_yes',
            label: 'Within High-Confidence FG Range',
            targetNodeId: 'node_nfl_verdict_field_goal',
            condition: { field: 'is_within_fg_range', operator: 'is_true', value: true }
          },
          {
            id: 'b_nfl_fg_no',
            label: 'Outside Reliable FG Range (> 52 yds)',
            targetNodeId: 'node_nfl_verdict_coffin_punt',
            condition: { field: 'is_within_fg_range', operator: 'is_false', value: false }
          }
        ]
      },
      node_nfl_verdict_go_for_it: {
        id: 'node_nfl_verdict_go_for_it',
        title: 'APPROVED: Go For It! (QB Sneak / Heavy Power Option)',
        type: 'action_verdict',
        description: 'Analytics green light: conversion odds (78%) outweigh downside turnover position.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Short yardage in opponent territory yields a net +3.8% Expected Win Probability vs field goal/punt.',
          requiredAuthorizations: [],
          mitigationActions: ['Hurry to line to catch defense in base package', 'Have QB ready for audible sneak'],
          allowAutomation: true
        }
      },
      node_nfl_verdict_field_goal: {
        id: 'node_nfl_verdict_field_goal',
        title: 'APPROVED: Attempt Field Goal',
        type: 'action_verdict',
        description: 'Secure points with high-probability field goal attempt.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'FG probability exceeds 84%. Securing 3 points maximizes game control.',
          requiredAuthorizations: [],
          mitigationActions: ['Verify field conditions and wind vector before kick'],
          allowAutomation: true
        }
      },
      node_nfl_verdict_punt_safe: {
        id: 'node_nfl_verdict_punt_safe',
        title: 'APPROVED: Safe Punt & Pin Opponent',
        type: 'action_verdict',
        description: 'Protect field position when inside own 35-yard line.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Failing a 4th down inside own 35 gives opponent immediate red-zone position.',
          requiredAuthorizations: [],
          mitigationActions: ['Call directional punt to gunner side'],
          allowAutomation: true
        }
      },
      node_nfl_verdict_coffin_punt: {
        id: 'node_nfl_verdict_coffin_punt',
        title: 'APPROVED: Coffin Corner Pin Punt',
        type: 'action_verdict',
        description: 'Punt to pin opponent inside 10-yard line rather than attempting low-odds FG.',
        verdict: {
          status: 'APPROVED',
          riskTier: 'LOW',
          reason: 'Long FG missed gives ball at spot of kick; pin punt traps opponent at 5-yard line.',
          requiredAuthorizations: [],
          mitigationActions: ['Instruct punter to bounce inside 10-yard line'],
          allowAutomation: true
        }
      }
    }
  }
};


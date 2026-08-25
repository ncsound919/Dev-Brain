import {
  WeightedDecisionOption,
  DecisionMatrixResult,
  SectorType,
  PreDecisionTriageResult
} from '../types';
import { ALL_LEADER_GENOMES } from '../data/genomes';
import { CandidateTriageEngine } from './candidateTriageEngine';

export class DecisionMatrixEngine {
  /**
   * Generates a fully weighted multi-option decision matrix directly from a Pre-Decision Top 5 Triage Result.
   */
  public static generateMatrixFromTriage(
    triageResult: PreDecisionTriageResult
  ): DecisionMatrixResult {
    const options = CandidateTriageEngine.convertTop5ToMatrixOptions(triageResult.top5Methods);
    const normalizedOptions = this.normalizeWeights(options);
    const recommendedOption = normalizedOptions.find(o => o.recommended) || normalizedOptions[0];

    return {
      id: `matrix_triage_${Date.now()}`,
      decisionTopic: this.summarizeTopic(triageResult.problemContext),
      context: triageResult.problemContext,
      totalOptionsCount: normalizedOptions.length,
      options: normalizedOptions,
      recommendedOptionId: recommendedOption ? recommendedOption.id : 'opt_1',
      synthesisRationale: `Narrowed down from ${triageResult.totalCandidatesEvaluated} raw candidate methods to the Top 5 best methods (${triageResult.prunedMethods.length} pruned to prevent deliberation sprawl). '${recommendedOption.title}' carries highest probabilistic allocation (${recommendedOption.weightPercentage}%) under the ${triageResult.triageStrategy.toUpperCase()} strategy.`,
      tradeOffSummary: `Primary trade-off centers between '#1 ${normalizedOptions[0]?.title}' vs '#2 ${normalizedOptions[1]?.title}'.`,
      generatedBy: 'deterministic_engine',
      timestamp: new Date().toISOString(),
      normalizedPercentageSum: 100
    };
  }

  /**
   * Generates a fully weighted multi-option decision matrix with pros and cons for any strategic problem.
   */
  public static generateMatrix(
    problem: string,
    selectedGenomes: string[] = [],
    sector: SectorType | 'cross_domain' = 'dev'
  ): DecisionMatrixResult {
    const options = this.deriveOptionsForProblem(problem, selectedGenomes, sector);
    const normalizedOptions = this.normalizeWeights(options);

    const recommendedOption = normalizedOptions.find(o => o.recommended) || normalizedOptions[0];

    return {
      id: `matrix_${Date.now()}`,
      decisionTopic: this.summarizeTopic(problem),
      context: problem,
      totalOptionsCount: normalizedOptions.length,
      options: normalizedOptions,
      recommendedOptionId: recommendedOption ? recommendedOption.id : 'opt_1',
      synthesisRationale: `Based on believability-weighted deliberation across ${selectedGenomes.length || 4} leader genomes, '${recommendedOption.title}' carries the highest probabilistic payoff (${recommendedOption.weightPercentage}% weight) balancing safety floor with execution speed.`,
      tradeOffSummary: `Primary trade-off centers between '${normalizedOptions[0]?.title}' (prioritizing ${normalizedOptions[0]?.pros[0]?.toLowerCase() || 'rapid delivery'}) vs '${normalizedOptions[1]?.title}' (prioritizing ${normalizedOptions[1]?.pros[0]?.toLowerCase() || 'risk containment'}).`,
      generatedBy: 'deterministic_engine',
      timestamp: new Date().toISOString(),
      normalizedPercentageSum: 100
    };
  }

  /**
   * Normalizes an array of options so their percentage weights sum exactly to 100%.
   */
  public static normalizeWeights(options: WeightedDecisionOption[]): WeightedDecisionOption[] {
    if (!options || options.length === 0) return [];

    const rawTotal = options.reduce((sum, opt) => sum + (typeof opt.weightPercentage === 'number' ? opt.weightPercentage : 1), 0);
    
    if (rawTotal === 0) {
      const equalShare = Math.floor(100 / options.length);
      const remainder = 100 - (equalShare * options.length);
      return options.map((opt, idx) => ({
        ...opt,
        weightPercentage: equalShare + (idx === 0 ? remainder : 0)
      })).sort((a, b) => b.weightPercentage - a.weightPercentage);
    }

    let allocatedSum = 0;
    const normalized = options.map((opt, idx) => {
      const weight = typeof opt.weightPercentage === 'number' ? opt.weightPercentage : 1;
      if (idx === options.length - 1) {
        const finalWeight = Math.max(1, 100 - allocatedSum);
        return { ...opt, weightPercentage: finalWeight };
      }
      const rounded = Math.max(1, Math.round((weight / rawTotal) * 100));
      allocatedSum += rounded;
      return { ...opt, weightPercentage: rounded };
    });

    // Sort descending by weight
    return normalized.sort((a, b) => b.weightPercentage - a.weightPercentage);
  }

  /**
   * Derive intelligent domain-specific options with pros and cons based on heuristics
   */
  private static deriveOptionsForProblem(
    problem: string,
    selectedGenomes: string[],
    sector: SectorType | 'cross_domain'
  ): WeightedDecisionOption[] {
    const p = problem.toLowerCase();
    const leaders = selectedGenomes.map(k => ALL_LEADER_GENOMES[k]?.name).filter(Boolean);

    // Scenario 1: Biotech / CAR-T / Molecular
    if (p.includes('car-t') || p.includes('tumor') || p.includes('crispr') || p.includes('cell') || sector === 'science_biotech') {
      return [
        {
          id: 'opt_syn_and_not_gate',
          title: 'Modular Dual-Targeting SynNotch Boolean Logic Architecture (AND/NOT Gates)',
          description: 'Construct combinatorial antigen recognition using a priming SynNotch receptor coupled with an intracellular inhibitory PD-L1/CTLA4 killer checkpoint.',
          weightPercentage: 54,
          confidenceScore: 92,
          pros: [
            'Near-zero off-tumor on-target toxicity by requiring coincident antigen co-expression',
            'Prevents T-cell exhaustion via non-tonic baseline signaling and pulsed activation',
            'Extends persistence in hostile immunosuppressive tumor microenvironments',
            'Broad patents and strong regulatory defensibility under FDA Breakthrough Designation'
          ],
          cons: [
            'Complex lentiviral/AAV genetic cargo payload (>4.8kb) challenging transduction efficiency',
            'Higher CMC manufacturing costs ($420k/batch vs $280k standard)',
            'Delayed clinical trial timeline due to dual-target IND safety characterization'
          ],
          riskLevel: 'MEDIUM',
          expectedROI: '8.4x Risk-Adjusted NPV',
          timeToValue: '18–24 months (Phase 1/2 IND)',
          recommended: true,
          verdictTag: 'STRONGLY_RECOMMENDED',
          mitigationStrategy: 'Utilize high-titer transposon electroporation (Sleeping Beauty) to bypass viral packaging limits and reduce batch COGS by 35%.',
          supportingLeaders: leaders.slice(0, 3).length > 0 ? leaders.slice(0, 3) : ['Carl June', 'Michel Sadelain', 'Jennifer Doudna'],
          scores: {
            feasibility: 78,
            upsidePotential: 96,
            safetyFloor: 91,
            executionSpeed: 68,
            capitalEfficiency: 75
          }
        },
        {
          id: 'opt_armored_monospecific',
          title: 'Armored Monospecific CAR-T with Secreted IL-18/IL-7 Payload',
          description: 'Deploy single high-affinity scFv binder augmented with constitutive immune-stimulatory cytokine payload to reshape stroma.',
          weightPercentage: 31,
          confidenceScore: 84,
          pros: [
            'Rapid manufacturing turnaround (7-day rapid vein-to-vein protocol)',
            'Well-characterized single scFv safety and target binding kinetics',
            'Lower initial clinical entry cost and streamlined regulatory filings'
          ],
          cons: [
            'Susceptible to antigen-escape tumor relapses (downregulation of primary target)',
            'Elevated cytokine release syndrome (CRS) risk requiring strict IL-6 tocilizumab staging',
            'Limited durability against heterogeneous solid tumor masses'
          ],
          riskLevel: 'HIGH',
          expectedROI: '4.2x Standard Biosimilar Multiplier',
          timeToValue: '12–14 months',
          recommended: false,
          verdictTag: 'VIABLE_ALTERNATIVE',
          mitigationStrategy: 'Introduce an orthogonal inducible safety kill-switch (iCasp9 or rituximab-sensitive tag) for instant ablation upon Grade 3 CRS.',
          supportingLeaders: ['Padmanee Sharma', 'Katalin Karikó'],
          scores: {
            feasibility: 88,
            upsidePotential: 72,
            safetyFloor: 65,
            executionSpeed: 86,
            capitalEfficiency: 82
          }
        },
        {
          id: 'opt_allogeneic_off_shelf',
          title: 'Allogeneic Off-the-Shelf TCR/HLA-Knockout Donor T-Cell Platform',
          description: 'CRISPR-Cas9 multiplexed gene-edited universal donor cells targeting invariant surface markers.',
          weightPercentage: 15,
          confidenceScore: 71,
          pros: [
            'Massively scalable batch manufacturing from healthy donor leukapheresis (100+ doses/run)',
            'Zero patient vein-to-vein waiting lag; immediate off-the-shelf dosing',
            'Sub-$50k per dose long-term COGS economics'
          ],
          cons: [
            'Severe Graft-versus-Host Disease (GvHD) and host rejection clearance risks',
            'Multiplex double-strand break translocations and genomic off-target cuts',
            'Immune rejection reduces cellular in vivo half-life compared to autologous cells'
          ],
          riskLevel: 'CRITICAL',
          expectedROI: '12x Speculative Paradigm Multiplier',
          timeToValue: '36+ months',
          recommended: false,
          verdictTag: 'HIGH_RISK_PATH',
          mitigationStrategy: 'Utilize prime-editing base editors to prevent double-strand breaks and insert HLA-E knock-in to inhibit NK cell surveillance.',
          supportingLeaders: ['Jennifer Doudna', 'Alexander Marson'],
          scores: {
            feasibility: 58,
            upsidePotential: 98,
            safetyFloor: 48,
            executionSpeed: 52,
            capitalEfficiency: 92
          }
        }
      ];
    }

    // Scenario 2: Sports Science / ACWR / Load Management
    if (p.includes('acwr') || p.includes('cns') || p.includes('spine') || p.includes('sprint') || p.includes('periodization') || sector === 'science_sports') {
      return [
        {
          id: 'opt_high_low_microperiodization',
          title: 'High-Low Micro-Periodization with ACWR Dynamic Load Caps (ACWR 0.9–1.2)',
          description: 'Polarize weekly CNS exposure into maximal neurological output days (High) separated by restorative metabolic flush days (Low), governed by GPS velocity telemetry.',
          weightPercentage: 58,
          confidenceScore: 94,
          pros: [
            'Reduces non-contact soft tissue injuries by 42% via chronic workload buffering',
            'Protects sympathetic CNS recovery while maintaining peak mechanical velocity (>95% Vmax)',
            'Clear objective green/amber/red athlete readiness dashboard',
            'Seamlessly accommodates in-season fixture congestion and travel fatigue'
          ],
          cons: [
            'Requires strict coach compliance and restraint on tactical scrimmage intensity on Low days',
            'Demands integrated GPS/accelerometer vest telemetry infrastructure',
            'May create friction with traditional coaches demanding daily high-intensity volume'
          ],
          riskLevel: 'LOW',
          expectedROI: '95%+ Roster Availability across Season',
          timeToValue: 'Immediate 2-week adaptation cycle',
          recommended: true,
          verdictTag: 'STRONGLY_RECOMMENDED',
          mitigationStrategy: 'Integrate objective isometric mid-thigh pull (IMTP) force plates to provide indisputable neuromuscular fatigue evidence to coaching staff.',
          supportingLeaders: leaders.slice(0, 3).length > 0 ? leaders.slice(0, 3) : ['Charlie Francis', 'Tim Gabbett', 'Andy Galpin'],
          scores: {
            feasibility: 90,
            upsidePotential: 92,
            safetyFloor: 96,
            executionSpeed: 88,
            capitalEfficiency: 85
          }
        },
        {
          id: 'opt_autoregulated_rpe_velocity',
          title: 'Autoregulated Velocity-Based Training (VBT) with Daily Readiness Scaling',
          description: 'Adjust daily training tonnage in real-time based on barbell mean propulsive velocity drop-offs (10% velocity threshold stop rule).',
          weightPercentage: 27,
          confidenceScore: 82,
          pros: [
            'Accounts for hidden life stressors, sleep debt, and travel fatigue automatically',
            'Optimizes power-to-weight neuromuscular adaptations without unnecessary hypertrophy fatigue',
            'High athlete autonomy and engagement'
          ],
          cons: [
            'Requires athlete technical competence and honest intent during warm-up sets',
            'Hardware tethering required on every barbell and exercise station',
            'Less predictable long-term volume curves for mesocycle planning'
          ],
          riskLevel: 'LOW',
          expectedROI: '15% Peak Force Acceleration Improvement',
          timeToValue: '4–6 weeks',
          recommended: false,
          verdictTag: 'VIABLE_ALTERNATIVE',
          mitigationStrategy: 'Pair linear position transducers with coach-supervised barbell validation on primary compound movement clusters.',
          supportingLeaders: ['Bryan Mann', 'Dan Baker'],
          scores: {
            feasibility: 82,
            upsidePotential: 84,
            safetyFloor: 88,
            executionSpeed: 78,
            capitalEfficiency: 76
          }
        },
        {
          id: 'opt_fixed_block_overload',
          title: 'Classical Fixed Block Periodization (Concentrated Overload Cycles)',
          description: 'Traditional 3-week concentrated mechanical loading blocks followed by 1-week deload realization phases.',
          weightPercentage: 15,
          confidenceScore: 68,
          pros: [
            'Simple planning and deterministic scheduling without requiring expensive sensors',
            'High predictable cumulative volume for baseline structural tissue remodeling'
          ],
          cons: [
            'High ACWR spike risk (>1.5) during competition week transitions',
            'Excessive residual fatigue degrades in-season game-day tactical sharpness',
            'Poor adaptability to sudden roster injuries or overtime game demands'
          ],
          riskLevel: 'HIGH',
          expectedROI: 'Sub-optimal in-season availability',
          timeToValue: '8–12 weeks',
          recommended: false,
          verdictTag: 'SUB_OPTIMAL',
          mitigationStrategy: 'Strictly cap maximal session volumes at 70% of off-season baseline during competitive match weeks.',
          supportingLeaders: ['Vladimir Issurin', 'Yuri Verkhoshansky'],
          scores: {
            feasibility: 94,
            upsidePotential: 62,
            safetyFloor: 55,
            executionSpeed: 90,
            capitalEfficiency: 92
          }
        }
      ];
    }

    // Scenario 3: Financial / Valuation / Capital Allocation
    if (p.includes('valuation') || p.includes('dcf') || p.includes('margin of safety') || p.includes('capital') || sector === 'financial') {
      return [
        {
          id: 'opt_barbell_cash_flow_dcf',
          title: 'Barbell Capital Allocation: High Free Cash Flow Core + Asymmetric Convex Moat Bets',
          description: 'Anchor 80% of invested capital in high-ROIC, low-debt recurring cash generators with 30%+ margin of safety, while allocating 20% to anti-fragile high-upside options.',
          weightPercentage: 55,
          confidenceScore: 93,
          pros: [
            'Complete downside protection against liquidity shocks and debt cycle contractions',
            'Self-funding reinvestment engine without dilutive secondary equity raises',
            'Captures massive positive fat-tail convexity in disruptive macro shifts',
            'High Warren Buffett / Nassim Taleb mental model alignment'
          ],
          cons: [
            'Requires extreme patience and disciplined cash drag during euphoric market peaks',
            'May underperform leveraged speculative competitors during bull-market mania',
            'Demands rigorous multi-year DCF normalized earnings modeling'
          ],
          riskLevel: 'LOW',
          expectedROI: '22–28% Annualized Long-Term IRR',
          timeToValue: '3–5 year compounding horizon',
          recommended: true,
          verdictTag: 'STRONGLY_RECOMMENDED',
          mitigationStrategy: 'Deploy short-duration cash equivalents (Treasury Bills yielding 4.5%+) on dry powder to prevent inflation drag while awaiting distressed opportunities.',
          supportingLeaders: leaders.slice(0, 3).length > 0 ? leaders.slice(0, 3) : ['Warren Buffett', 'Nassim Taleb', 'Aswath Damodaran'],
          scores: {
            feasibility: 92,
            upsidePotential: 89,
            safetyFloor: 98,
            executionSpeed: 76,
            capitalEfficiency: 95
          }
        },
        {
          id: 'opt_aggressive_growth_reinvestment',
          title: 'Aggressive Top-Line Reinvestment (Maximum Market Share Expansion)',
          description: 'Reinvest 100% of operating cash flow into customer acquisition, aggressive hiring, and land-grab distribution channels.',
          weightPercentage: 30,
          confidenceScore: 78,
          pros: [
            'Maximizes network effects and establishes winner-take-most category dominance',
            'Starves competitors of distribution mindshare and top-tier talent',
            'Fastest top-line revenue growth trajectory'
          ],
          cons: [
            'Zero margin of safety if credit markets freeze or cost of capital spikes',
            'Vulnerable to customer churn and low unit economics sustainability',
            'High burn rate shortens runway and forces punitive down-rounds if metrics slip'
          ],
          riskLevel: 'HIGH',
          expectedROI: 'Binary (10x Unicorn or 0x Insolvency)',
          timeToValue: '12–18 months',
          recommended: false,
          verdictTag: 'VIABLE_ALTERNATIVE',
          mitigationStrategy: 'Set dynamic covenant guardrails: if CAC payback exceeds 14 months or gross margin dips below 65%, immediately revert to profitability.',
          supportingLeaders: ['Peter Thiel', 'Masayoshi Son'],
          scores: {
            feasibility: 85,
            upsidePotential: 94,
            safetyFloor: 52,
            executionSpeed: 95,
            capitalEfficiency: 60
          }
        },
        {
          id: 'opt_defensive_cash_retention',
          title: 'Ultra-Defensive Pure Cash Retention & Share Buyback Focus',
          description: 'Halt all expansion CapEx, maximize immediate EBITDA margins, and distribute surplus cash via share repurchases.',
          weightPercentage: 15,
          confidenceScore: 75,
          pros: [
            'Guaranteed short-term EPS expansion and immediate liquidity resilience',
            'Zero execution risk on complex new ventures'
          ],
          cons: [
            'Suffers long-term innovation obsolescence and technological disruption',
            'Competitors capture emerging adjacent market categories',
            'Tax inefficiency if capital allocation is not properly timed'
          ],
          riskLevel: 'MEDIUM',
          expectedROI: '7–10% Steady Cash Yield',
          timeToValue: 'Immediate',
          recommended: false,
          verdictTag: 'SUB_OPTIMAL',
          mitigationStrategy: 'Ring-fence a dedicated 10% R&D skunkworks fund to maintain minimal tech stack relevance.',
          supportingLeaders: ['Carl Icahn', 'Ray Dalio'],
          scores: {
            feasibility: 96,
            upsidePotential: 50,
            safetyFloor: 92,
            executionSpeed: 82,
            capitalEfficiency: 80
          }
        }
      ];
    }

    // Scenario 4: Software / AI / Dev Architecture
    return [
      {
        id: 'opt_modular_deterministic_pipeline',
        title: 'Deterministic Modular Pipeline with Pre-Flight Verification & Strict Safety Guardrails',
        description: 'Architect a verifiable state machine system with typed API boundaries, zero-trust schema validation, and isolated agent execution runtimes.',
        weightPercentage: 56,
        confidenceScore: 95,
        pros: [
          'Guarantees 100% reproducible execution traces with zero stochastic hallucinations in critical paths',
          'Eliminates catastrophic production outages through automated circuit breakers',
          'Clean testability and microservice separation of concerns',
          'Complies with regulatory governance and audited enterprise requirements'
        ],
        cons: [
          'Slightly higher upfront engineering architecture overhead (+20% initial scaffolding)',
          'Requires rigorous schema maintenance across contract interfaces',
          'Less forgiving of rapid ad-hoc prototype hacks'
        ],
        riskLevel: 'LOW',
        expectedROI: '10x Maintenance & Incident Cost Savings',
        timeToValue: '2–3 weeks to production stabilization',
        recommended: true,
        verdictTag: 'STRONGLY_RECOMMENDED',
        mitigationStrategy: 'Auto-generate TypeScript SDK schemas and Python contracts from single source-of-truth definitions to eliminate manual boilerplate sync.',
        supportingLeaders: leaders.slice(0, 3).length > 0 ? leaders.slice(0, 3) : ['Andrej Karpathy', 'Martin Fowler', 'Leslie Lamport'],
        scores: {
          feasibility: 92,
          upsidePotential: 94,
          safetyFloor: 98,
          executionSpeed: 82,
          capitalEfficiency: 90
        }
      },
      {
        id: 'opt_autonomous_dynamic_agent_mesh',
        title: 'Fully Autonomous Multi-Agent Mesh with Dynamic Tool-Calling Autopilot',
        description: 'Allow autonomous LLM agents to dynamically plan, call APIs, mutate state, and resolve decisions at runtime with soft prompt guidance.',
        weightPercentage: 29,
        confidenceScore: 76,
        pros: [
          'High flexibility and rapid emergent problem solving for unforeseen edge cases',
          'Minimal rigid code required; logic shifts via natural language prompts',
          'Fastest initial prototype deployment'
        ],
        cons: [
          'Vulnerable to recursive runaway execution loops and sudden cloud billing spikes',
          'Non-deterministic behavior makes auditing, regression testing, and root-cause analysis difficult',
          'High blast radius on database migrations and external customer outbound emails'
        ],
        riskLevel: 'HIGH',
        expectedROI: 'High Exploration Speed, Low Reliability',
        timeToValue: '3–5 days prototype',
        recommended: false,
        verdictTag: 'VIABLE_ALTERNATIVE',
        mitigationStrategy: 'Wrap all autonomous agent tool executions with a pre-flight deterministic validation gate and maximum 4-iteration depth cap.',
        supportingLeaders: ['Harrison Chase', 'Sam Altman'],
        scores: {
          feasibility: 86,
          upsidePotential: 90,
          safetyFloor: 58,
          executionSpeed: 96,
          capitalEfficiency: 70
        }
      },
      {
        id: 'opt_monolithic_rule_engine',
        title: 'Rigid Monolithic Hard-Coded Rules Engine',
        description: 'Implement static conditional logic trees directly in application code without dynamic genome or LLM orchestration.',
        weightPercentage: 15,
        confidenceScore: 80,
        pros: [
          'Ultra-fast microsecond execution latency with zero external LLM dependencies',
          'Completely deterministic with zero operational API costs'
        ],
        cons: [
          'Brittle code that requires developer redeployments for every minor domain rule adjustment',
          'Cannot reason over unstructured qualitative inputs or synthesize cross-sector nuances',
          'High code sprawl and cognitive maintenance debt over time'
        ],
        riskLevel: 'MEDIUM',
        expectedROI: 'Low Strategic Flexibility',
        timeToValue: '1 week',
        recommended: false,
        verdictTag: 'SUB_OPTIMAL',
        mitigationStrategy: 'Decouple rules into configurable JSON decision trees with live visual schema editing.',
        supportingLeaders: ['Linus Torvalds', 'Rob Pike'],
        scores: {
          feasibility: 96,
          upsidePotential: 54,
          safetyFloor: 90,
          executionSpeed: 94,
          capitalEfficiency: 82
        }
      }
    ];
  }

  private static summarizeTopic(problem: string): string {
    if (!problem || problem.trim().length === 0) return 'Strategic Decision Analysis';
    const words = problem.trim().split(/\s+/);
    if (words.length <= 8) return problem.trim();
    return words.slice(0, 8).join(' ') + '...';
  }
}

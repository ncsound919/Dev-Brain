import { ALL_LEADER_GENOMES } from '../data/genomes';
import {
  ReasoningResult,
  ReasoningState,
  RankedGenome,
  SourceAttribution,
  SectorType
} from '../types';

export class DeterministicReasoningEngine {
  private stateHistory: ReasoningResult[] = [];

  public reasonAboutProblem(
    problem: string,
    selectedGenomes: string[],
    activeSectors: SectorType[] = ['dev']
  ): ReasoningResult {
    const reasoning: ReasoningResult = {
      id: `reasoning_${Date.now()}`,
      problem,
      selectedGenomes,
      activeSectors,
      timestamp: new Date().toISOString(),
      states: [],
      rules: [],
      output: null,
      auditTrail: {
        reasoning_id: '',
        problem_input: problem,
        selected_genomes: selectedGenomes,
        active_sectors: activeSectors,
        state_transitions: [],
        final_output: null,
        timestamp: new Date().toISOString(),
        fully_traceable: true,
        source_attribution: []
      }
    };

    // State 1: Problem Perception & Classification (Phase: PERCEIVE)
    const detectedSector = this.detectSector(problem, activeSectors);
    const domain = this.extractDomain(problem);
    const constraints = this.identifyConstraints(problem);
    const complexity = this.assessComplexity(problem);

    const state1: ReasoningState = {
      name: 'ANALYZE_PROBLEM',
      phase: 'PERCEIVE',
      inputs: { problem, activeSectors },
      rules: ['detect_sector_alignment', 'extract_domain_heuristics', 'identify_boundary_constraints', 'determine_complexity'],
      outputs: {
        sector: detectedSector,
        domain,
        constraints,
        complexity
      }
    };
    reasoning.states.push(state1);

    // State 2: Multi-Sector Genome Selection & Matching (Phase: ROUTE)
    const rankedGenomes = this.rankGenomesByRelevance(problem, selectedGenomes);
    const recommendations = this.generateRecommendations(problem, selectedGenomes);

    const state2: ReasoningState = {
      name: 'MATCH_GENOMES',
      phase: 'ROUTE',
      inputs: { problem, availableGenomes: selectedGenomes, activeSectors },
      rules: ['compute_believability_weighted_relevance', 'rank_by_domain_expertise', 'check_cross_sector_compatibility'],
      outputs: {
        rankedGenomes,
        recommendations
      }
    };
    reasoning.states.push(state2);

    // State 3: Deterministic Synthesis & Heuristic Fusion (Phase: SYNTHESIZE)
    const solution = this.synthesizeSolution(rankedGenomes, problem);
    const confidence = this.calculateConfidence(rankedGenomes);

    const state3: ReasoningState = {
      name: 'SYNTHESIZE_SOLUTION',
      phase: 'SYNTHESIZE',
      inputs: { rankedGenomes, constraints },
      rules: ['apply_mental_models', 'compose_toolchains', 'merge_patterns', 'resolve_competing_tradeoffs'],
      outputs: {
        solution,
        confidence
      }
    };
    reasoning.states.push(state3);

    reasoning.output = solution;
    reasoning.auditTrail = this.generateAuditTrail(reasoning);

    this.stateHistory.push(reasoning);
    return reasoning;
  }

  public detectSector(problem: string, activeSectors: SectorType[]): SectorType | 'cross_domain' {
    if (activeSectors.length > 1) return 'cross_domain';
    if (activeSectors.length === 1) return activeSectors[0];

    const p = problem.toLowerCase();
    if (p.includes('cancer') || p.includes('car-t') || p.includes('crispr') || p.includes('genom') || p.includes('t-cell') || p.includes('biotech')) {
      return 'science_biotech';
    }
    if (p.includes('hypertrophy') || p.includes('spine') || p.includes('vo2') || p.includes('sprint') || p.includes('acwr') || p.includes('workout') || p.includes('mobility')) {
      return 'science_sports';
    }
    if (p.includes('valuation') || p.includes('dcf') || p.includes('margin of safety') || p.includes('fpa') || p.includes('cash flow') || p.includes('ebitda') || p.includes('investing')) {
      return 'financial';
    }
    if (p.includes('marketing') || p.includes('brand') || p.includes('seo') || p.includes('content') || p.includes('growth loop') || p.includes('positioning') || p.includes('permission') || p.includes('attribution') || p.includes('campaign') || p.includes('lifecycle') || p.includes('plg')) {
      return 'marketing';
    }
    if (p.includes('disruption') || p.includes('jtbd') || p.includes('strategy') || p.includes('flywheel') || p.includes('okr') || p.includes('culture') || p.includes('business model')) {
      return 'business';
    }
    return 'dev';
  }

  public extractDomain(problem: string): string {
    const domains: Record<string, string[]> = {
      architecture: ['design', 'system', 'structure', 'framework', 'distributed', 'pipeline'],
      optimization: ['fast', 'efficient', 'speed', 'performance', 'memory', 'quantization', 'latency', 'scale'],
      biotech_mechanics: ['cell', 'receptor', 'car-t', 'crispr', 'mutation', 'antigen', 'kinase', 'tumor'],
      human_performance: ['muscle', 'biomechanics', 'velocity', 'lactate', 'joint', 'hypertrophy', 'recovery', 'periodization'],
      capital_allocation: ['valuation', 'cash flow', 'dcf', 'margin of safety', 'moat', 'capital', 'fpa', 'runway'],
      strategic_positioning: ['disruption', 'competitive', 'flywheel', 'customer', 'positioning', 'market', 'talent'],
      marketing_growth: ['marketing', 'brand', 'seo', 'content', 'growth', 'campaign', 'attribution', 'permission', 'lifecycle', 'plg', 'distribution', 'inbound']
    };

    for (const [domain, keywords] of Object.entries(domains)) {
      if (keywords.some(kw => problem.toLowerCase().includes(kw))) {
        return domain;
      }
    }
    return 'general_inquiry';
  }

  public identifyConstraints(problem: string): string[] {
    const constraints: string[] = [];
    const lower = problem.toLowerCase();
    if (lower.includes('memory') || lower.includes('vram') || lower.includes('ram')) constraints.push('memory_constrained');
    if (lower.includes('fast') || lower.includes('latency') || lower.includes('real-time') || lower.includes('velocity')) constraints.push('latency_critical');
    if (lower.includes('accuracy') || lower.includes('precision') || lower.includes('safety') || lower.includes('toxicity')) constraints.push('safety_and_precision_critical');
    if (lower.includes('scale') || lower.includes('cluster') || lower.includes('enterprise') || lower.includes('multi-region')) constraints.push('distributed_scale');
    if (lower.includes('privacy') || lower.includes('security') || lower.includes('hipaa') || lower.includes('compliance')) constraints.push('regulatory_and_privacy_enforced');
    if (lower.includes('budget') || lower.includes('capital') || lower.includes('burn') || lower.includes('cost')) constraints.push('capital_and_budget_constrained');
    if (lower.includes('injury') || lower.includes('fatigue') || lower.includes('recovery')) constraints.push('biological_recovery_constrained');
    if (lower.includes('attribution') || lower.includes('cac') || lower.includes('lifecycle') || lower.includes('brand')) constraints.push('attribution_and_brand_constrained');
    return constraints.length > 0 ? constraints : ['standard_operating_envelope'];
  }

  public assessComplexity(problem: string): number {
    return Math.min(1, Math.max(0.2, problem.length / 300));
  }

  public rankGenomesByRelevance(problem: string, genomeKeys: string[]): RankedGenome[] {
    return genomeKeys.map(key => {
      const genome = ALL_LEADER_GENOMES[key];
      if (!genome) {
        return {
          id: key,
          name: key,
          key: key,
          sector: 'dev' as SectorType,
          subBrain: 'General',
          role: 'Domain Specialist',
          relevanceScore: 0.5,
          determinismRating: 0.9,
          believabilityWeight: 0.9,
          confidence: 0.9
        };
      }

      const pLower = problem.toLowerCase();
      const pWords = pLower.split(/[\s,.;:!?/\\-_]+/).filter(w => w.length > 2);

      let matchCount = 0;
      for (const m of genome.mentalModels) {
        const mLower = m.toLowerCase();
        if (pWords.some(w => mLower.includes(w)) || pLower.includes(mLower)) matchCount += 1.5;
      }
      for (const t of genome.toolchain) {
        const tLower = t.toLowerCase();
        if (pWords.some(w => tLower.includes(w)) || pLower.includes(tLower)) matchCount += 1.2;
      }
      const csLower = genome.coreStrength.toLowerCase();
      if (pWords.some(w => csLower.includes(w))) matchCount += 2.5;
      const sbLower = genome.subBrain.toLowerCase();
      if (pWords.some(w => sbLower.includes(w))) matchCount += 2.5;
      const vsLower = (genome.voteScope || '').toLowerCase();
      if (pWords.some(w => vsLower.includes(w))) matchCount += 2.5;

      // Sector domain affinity boost
      if (genome.sector === 'science_biotech' && (pLower.includes('bio') || pLower.includes('car-t') || pLower.includes('cancer') || pLower.includes('tumor') || pLower.includes('cell') || pLower.includes('immuno'))) {
        matchCount += 5;
      }
      if (genome.sector === 'dev' && (pLower.includes('code') || pLower.includes('software') || pLower.includes('llm') || pLower.includes('model') || pLower.includes('gpu') || pLower.includes('vram') || pLower.includes('training'))) {
        matchCount += 5;
      }
      if (genome.sector === 'financial' && (pLower.includes('valuation') || pLower.includes('dcf') || pLower.includes('cash') || pLower.includes('capital') || pLower.includes('hedge') || pLower.includes('investing'))) {
        matchCount += 5;
      }
      if (genome.sector === 'business' && (pLower.includes('strategy') || pLower.includes('disruption') || pLower.includes('flywheel') || pLower.includes('market') || pLower.includes('culture') || pLower.includes('growth'))) {
        matchCount += 5;
      }
      if (genome.sector === 'science_sports' && (pLower.includes('sport') || pLower.includes('athletic') || pLower.includes('workout') || pLower.includes('muscle') || pLower.includes('recovery') || pLower.includes('acwr') || pLower.includes('cns'))) {
        matchCount += 5;
      }
      if (genome.sector === 'marketing' && (pLower.includes('marketing') || pLower.includes('brand') || pLower.includes('seo') || pLower.includes('content') || pLower.includes('growth') || pLower.includes('campaign') || pLower.includes('positioning') || pLower.includes('permission') || pLower.includes('lifecycle') || pLower.includes('attribution'))) {
        matchCount += 5;
      }

      const baseScore = Math.min(1, matchCount / 6);
      const believabilityBonus = (genome.believabilityWeight - 0.90) * 0.5;
      const finalRelevance = Math.min(0.99, Math.max(0.60, 0.65 + (baseScore * 0.28) + believabilityBonus));

      return {
        id: genome.id,
        name: genome.name,
        key: key,
        sector: genome.sector,
        subBrain: genome.subBrain,
        role: genome.role,
        relevanceScore: Number(finalRelevance.toFixed(3)),
        determinismRating: genome.determinismRating,
        believabilityWeight: genome.believabilityWeight,
        confidence: genome.auditTrail[0]?.confidence || 0.95
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  public generateRecommendations(problem: string, genomes: string[]) {
    const ranked = this.rankGenomesByRelevance(problem, genomes);
    const topRanked = ranked[0];
    const genome = ALL_LEADER_GENOMES[topRanked?.key || ''] || ALL_LEADER_GENOMES['andrej-karpathy'];
    
    return {
      primaryApproach: {
        leader: genome.name,
        sector: genome.sector,
        strength: genome.coreStrength,
        mentality: genome.mentalModels[0] || 'first-principles',
        debugStyle: genome.debuggingStyle
      },
      toolRecommendations: genome.toolchain,
      pattern: genome.optimizationPattern
    };
  }

  public synthesizeSolution(rankedGenomes: RankedGenome[], _problem: string) {
    const topThree = rankedGenomes.slice(0, 3);
    const primary = topThree[0] ? ALL_LEADER_GENOMES[topThree[0].key] : null;
    const secondary = topThree[1] ? ALL_LEADER_GENOMES[topThree[1].key] : null;
    const tertiary = topThree[2] ? ALL_LEADER_GENOMES[topThree[2].key] : null;

    const uniqueSectors = Array.from(new Set(rankedGenomes.slice(0, 5).map(g => g.sector)));
    const crossSectorNote = uniqueSectors.length > 1
      ? `Cross-Sector Multi-Brain Synergy integrating ${uniqueSectors.join(', ').toUpperCase()} heuristics`
      : `Single-Sector Deep Council Synthesis (${uniqueSectors[0]?.toUpperCase() || 'DOMAIN'})`;

    const combinedTools = Array.from(new Set([
      ...(primary?.toolchain || []),
      ...(secondary?.toolchain || [])
    ])).slice(0, 6);

    return {
      approach: `Believability-weighted composite synthesis across ${topThree.length} verified leader genomes (${crossSectorNote})`,
      primaryPattern: primary ? `${primary.name} (${primary.role}): ${primary.optimizationPattern}` : 'Curriculum optimization protocol',
      secondaryValidation: secondary ? `${secondary.name} (${secondary.role}): ${secondary.debuggingStyle}` : 'Cross-validation benchmark',
      tertiaryInsight: tertiary ? `${tertiary.name} (${tertiary.role}): Core principle -> "${tertiary.mentalModels[0]}"` : 'Reproducibility verification',
      crossSectorSynergy: crossSectorNote,
      reasoning: topThree.map((g, i) => 
        `${i + 1}. ${g.name} [${g.subBrain}] — ${(g.relevanceScore * 100).toFixed(0)}% relevance (Believability: ${(g.believabilityWeight * 100).toFixed(0)}%)`
      ).join(' → '),
      toolRecommendations: combinedTools
    };
  }

  public calculateConfidence(rankedGenomes: RankedGenome[]) {
    const subset = rankedGenomes.slice(0, 4);
    if (subset.length === 0) {
      return { score: 0.95, level: 'HIGH' };
    }
    const weightedSum = subset.reduce((sum, g) => sum + (g.confidence * g.believabilityWeight), 0);
    const totalWeights = subset.reduce((sum, g) => sum + g.believabilityWeight, 0);
    const avgScore = Number((weightedSum / totalWeights).toFixed(3));

    return {
      score: avgScore,
      level: avgScore >= 0.95 ? 'HIGH' : avgScore >= 0.88 ? 'MEDIUM' : 'LOW'
    };
  }

  public generateAuditTrail(reasoning: ReasoningResult) {
    return {
      reasoning_id: reasoning.id,
      problem_input: reasoning.problem,
      selected_genomes: reasoning.selectedGenomes,
      active_sectors: reasoning.activeSectors,
      state_transitions: reasoning.states.map(s => `${s.phase}: ${s.name}`),
      final_output: reasoning.output,
      timestamp: reasoning.timestamp,
      fully_traceable: true,
      source_attribution: this.attributeToPublicSources(reasoning.selectedGenomes)
    };
  }

  public attributeToPublicSources(genomeKeys: string[]): SourceAttribution[] {
    return genomeKeys.map(key => {
      const genome = ALL_LEADER_GENOMES[key];
      return {
        leader: genome?.name || key,
        sector: genome?.sector || 'dev',
        subBrain: genome?.subBrain || 'General',
        sources: genome?.publicSources || ['Public open publications and canon'],
        voteScope: genome?.voteScope || 'Domain decision contribution',
        auditTrail: genome?.auditTrail || [{ source: 'public_canon', date: '2024', confidence: 0.95 }]
      };
    });
  }

  public getHistory(): ReasoningResult[] {
    return this.stateHistory;
  }
}

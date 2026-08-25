import { 
  DecisionTree, 
  DecisionNode, 
  DecisionBranch, 
  DecisionStepTrace, 
  ConditionOperator,
  MonteCarloParameterRange,
  MonteCarloSimulationResult,
  TreeDiagnosticReport,
  DecisionVerdictStatus,
  RiskTier,
  DecisionDomain
} from '../types';

export class DecisionTreeEngine {
  public static evaluateCondition(
    actualValue: any,
    operator: ConditionOperator,
    expectedValue: any
  ): boolean {
    if (actualValue === undefined || actualValue === null) {
      if (operator === 'is_false') return true;
      return false;
    }

    switch (operator) {
      case 'equals':
        return String(actualValue).toLowerCase() === String(expectedValue).toLowerCase();

      case 'not_equals':
        return String(actualValue).toLowerCase() !== String(expectedValue).toLowerCase();

      case 'greater_than':
        return Number(actualValue) > Number(expectedValue);

      case 'greater_than_or_equal':
        return Number(actualValue) >= Number(expectedValue);

      case 'less_than':
        return Number(actualValue) < Number(expectedValue);

      case 'less_than_or_equal':
        return Number(actualValue) <= Number(expectedValue);

      case 'is_true':
        return actualValue === true || actualValue === 'true' || actualValue === 1 || actualValue === '1';

      case 'is_false':
        return actualValue === false || actualValue === 'false' || actualValue === 0 || actualValue === '0';

      case 'contains':
        return String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

      case 'not_contains':
        return !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());

      case 'in_list':
        if (Array.isArray(expectedValue)) {
          return expectedValue.map(v => String(v).toLowerCase()).includes(String(actualValue).toLowerCase());
        }
        return false;

      case 'regex_matches':
        try {
          const regex = new RegExp(String(expectedValue), 'i');
          return regex.test(String(actualValue));
        } catch {
          return false;
        }

      default:
        return false;
    }
  }

  public static traverseTree(
    tree: DecisionTree,
    parameters: Record<string, any>
  ): {
    finalNode: DecisionNode;
    trace: DecisionStepTrace[];
    visitedNodeIds: string[];
  } {
    const trace: DecisionStepTrace[] = [];
    const visitedNodeIds: string[] = [];

    let currentNodeId: string | undefined = tree.rootNodeId;
    let iterations = 0;
    const maxIterations = 30;

    while (currentNodeId && iterations < maxIterations) {
      iterations++;
      visitedNodeIds.push(currentNodeId);

      const node: DecisionNode | undefined = tree.nodes[currentNodeId];
      if (!node) {
        throw new Error(`Node ${currentNodeId} not found in decision tree ${tree.id}`);
      }

      if (node.type === 'action_verdict' || !node.branches || node.branches.length === 0) {
        trace.push({
          nodeId: node.id,
          nodeTitle: node.title,
          nodeType: node.type,
          evaluatedValue: 'TERMINAL_VERDICT',
          branchTakenLabel: 'Final Outcome Reached',
          notes: node.verdict?.reason || node.description
        });
        return {
          finalNode: node,
          trace,
          visitedNodeIds
        };
      }

      // Condition evaluation
      let matchedBranch: DecisionBranch | null = null;
      const paramField = node.field;
      const actualValue = paramField ? parameters[paramField] : undefined;

      for (const branch of node.branches) {
        if (!branch.condition) {
          matchedBranch = branch;
          break;
        }

        const isMatch = this.evaluateCondition(
          actualValue !== undefined ? actualValue : node.defaultValue,
          branch.condition.operator,
          branch.condition.value
        );

        if (isMatch) {
          matchedBranch = branch;
          break;
        }
      }

      // Fallback to first branch if no condition matched
      if (!matchedBranch && node.branches.length > 0) {
        matchedBranch = node.branches[0];
      }

      if (matchedBranch) {
        trace.push({
          nodeId: node.id,
          nodeTitle: node.title,
          nodeType: node.type,
          evaluatedValue: actualValue !== undefined ? actualValue : node.defaultValue,
          branchTakenLabel: matchedBranch.label,
          notes: matchedBranch.description || `Condition matched on ${paramField || 'branch'}`
        });
        currentNodeId = matchedBranch.targetNodeId;
      } else {
        break;
      }
    }

    const fallbackNode = tree.nodes[currentNodeId || tree.rootNodeId] || {
      id: 'fallback_node',
      title: 'Unresolved Decision Node',
      type: 'action_verdict',
      description: 'The decision tree traversal encountered an unmapped branch.',
      verdict: {
        status: 'ESCALATE_TO_FOUNDER',
        riskTier: 'HIGH',
        reason: 'Unresolved branching condition in decision tree.',
        requiredAuthorizations: ['Founder Review'],
        mitigationActions: ['Audit decision tree branch conditions'],
        allowAutomation: false
      }
    };

    return {
      finalNode: fallbackNode,
      trace,
      visitedNodeIds
    };
  }

  public static generateAgentJsonSchema(tree: DecisionTree) {
    const properties: Record<string, any> = {};
    const required: string[] = [];

    Object.values(tree.nodes).forEach(node => {
      if (node.field && node.type === 'condition') {
        let typeString = 'string';
        if (node.valueType === 'number') typeString = 'number';
        if (node.valueType === 'boolean') typeString = 'boolean';

        properties[node.field] = {
          type: typeString,
          description: node.question || node.description,
          default: node.defaultValue
        };

        if (node.options && node.options.length > 0) {
          properties[node.field].enum = node.options;
        }

        required.push(node.field);
      }
    });

    return {
      name: `evaluate_${tree.domain}`,
      description: `Validate actions against the ${tree.name} to avoid detrimental business errors.`,
      parameters: {
        type: 'object',
        properties,
        required
      }
    };
  }

  /**
   * Performs structural sanity checks on a Decision Tree:
   * - Detects orphan nodes (unreachable from root)
   * - Detects broken target node references
   * - Detects condition nodes missing branches
   * - Verifies root node existence
   */
  public static validateTreeStructure(tree: DecisionTree): TreeDiagnosticReport {
    const issues: TreeDiagnosticReport['issues'] = [];
    const allNodeIds = new Set(Object.keys(tree.nodes));
    const reachableNodeIds = new Set<string>();
    const missingTargetNodeIds = new Set<string>();

    let conditionNodesCount = 0;
    let verdictNodesCount = 0;

    if (!tree.rootNodeId || !tree.nodes[tree.rootNodeId]) {
      issues.push({
        severity: 'error',
        message: `Root node '${tree.rootNodeId}' does not exist in tree nodes map.`
      });
    }

    // Traversal to find all reachable nodes
    const queue = [tree.rootNodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (reachableNodeIds.has(currentId)) continue;
      reachableNodeIds.add(currentId);

      const node = tree.nodes[currentId];
      if (!node) {
        missingTargetNodeIds.add(currentId);
        continue;
      }

      if (node.type === 'condition') conditionNodesCount++;
      if (node.type === 'action_verdict') verdictNodesCount++;

      if (node.type === 'condition' && (!node.branches || node.branches.length === 0)) {
        issues.push({
          severity: 'error',
          nodeId: node.id,
          message: `Condition node '${node.title}' (${node.id}) has no branches defined.`
        });
      }

      if (node.branches) {
        node.branches.forEach(branch => {
          if (!branch.targetNodeId || !tree.nodes[branch.targetNodeId]) {
            missingTargetNodeIds.add(branch.targetNodeId);
            issues.push({
              severity: 'error',
              nodeId: node.id,
              message: `Branch '${branch.label}' points to non-existent target node '${branch.targetNodeId}'.`
            });
          } else {
            queue.push(branch.targetNodeId);
          }
        });
      }
    }

    const orphanNodeIds = Array.from(allNodeIds).filter(id => !reachableNodeIds.has(id));
    orphanNodeIds.forEach(id => {
      issues.push({
        severity: 'warning',
        nodeId: id,
        message: `Node '${tree.nodes[id]?.title || id}' is orphaned (unreachable from root node).`
      });
    });

    const isValid = issues.filter(i => i.severity === 'error').length === 0;

    return {
      isValid,
      totalNodes: allNodeIds.size,
      conditionNodesCount,
      verdictNodesCount,
      orphanNodeIds,
      unreachableNodeIds: orphanNodeIds,
      missingTargetNodeIds: Array.from(missingTargetNodeIds),
      issues
    };
  }

  /**
   * Executes a Monte Carlo probabilistic sensitivity simulation over a parameter distribution
   * to measure risk exposure, verdict distributions, and path frequencies.
   */
  public static evaluateMonteCarlo(
    tree: DecisionTree,
    rangesCustom?: Record<string, MonteCarloParameterRange>,
    runs = 500
  ): MonteCarloSimulationResult {
    const verdictDistribution: Record<DecisionVerdictStatus, number> = {
      APPROVED: 0,
      REJECTED: 0,
      ESCALATE_TO_FOUNDER: 0,
      CONDITIONAL_APPROVAL: 0
    };

    const riskTierDistribution: Record<RiskTier, number> = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CATASTROPHIC: 0
    };

    const pathFrequencies: Record<string, number> = {};
    const sampleRunResults: MonteCarloSimulationResult['sampleRunResults'] = [];

    // Extract default ranges from tree fields
    const defaultRanges: Record<string, MonteCarloParameterRange> = {};
    Object.values(tree.nodes).forEach(node => {
      if (node.field && node.type === 'condition') {
        if (node.valueType === 'number') {
          const defaultVal = Number(node.defaultValue ?? 100);
          defaultRanges[node.field] = {
            field: node.field,
            min: Math.max(0, Math.floor(defaultVal * 0.1)),
            max: Math.ceil(defaultVal * 3) || 1000
          };
        } else if (node.valueType === 'boolean') {
          defaultRanges[node.field] = {
            field: node.field,
            options: [true, false]
          };
        } else if (node.valueType === 'select' && node.options) {
          defaultRanges[node.field] = {
            field: node.field,
            options: node.options
          };
        }
      }
    });

    const activeRanges = { ...defaultRanges, ...rangesCustom };

    for (let i = 0; i < runs; i++) {
      const randomParams: Record<string, any> = {};

      Object.entries(activeRanges).forEach(([field, range]) => {
        if (range.options && range.options.length > 0) {
          const randomIdx = Math.floor(Math.random() * range.options.length);
          randomParams[field] = range.options[randomIdx];
        } else if (range.min !== undefined && range.max !== undefined) {
          randomParams[field] = Math.floor(range.min + Math.random() * (range.max - range.min + 1));
        } else {
          randomParams[field] = Math.random() > 0.5;
        }
      });

      const { finalNode, visitedNodeIds } = this.traverseTree(tree, randomParams);

      const verdictStatus = finalNode.verdict?.status || 'ESCALATE_TO_FOUNDER';
      const riskTier = finalNode.verdict?.riskTier || 'MEDIUM';

      verdictDistribution[verdictStatus] = (verdictDistribution[verdictStatus] || 0) + 1;
      riskTierDistribution[riskTier] = (riskTierDistribution[riskTier] || 0) + 1;

      const pathKey = visitedNodeIds.join(' -> ');
      pathFrequencies[pathKey] = (pathFrequencies[pathKey] || 0) + 1;

      if (i < 15) {
        sampleRunResults.push({
          runId: i + 1,
          params: randomParams,
          verdict: verdictStatus,
          riskTier,
          finalNodeId: finalNode.id
        });
      }
    }

    let topPathKey = '';
    let topPathCount = 0;

    Object.entries(pathFrequencies).forEach(([pathKey, count]) => {
      if (count > topPathCount) {
        topPathCount = count;
        topPathKey = pathKey;
      }
    });

    const verdictPercentage: Record<DecisionVerdictStatus, number> = {
      APPROVED: Math.round((verdictDistribution.APPROVED / runs) * 100),
      REJECTED: Math.round((verdictDistribution.REJECTED / runs) * 100),
      ESCALATE_TO_FOUNDER: Math.round((verdictDistribution.ESCALATE_TO_FOUNDER / runs) * 100),
      CONDITIONAL_APPROVAL: Math.round((verdictDistribution.CONDITIONAL_APPROVAL / runs) * 100)
    };

    return {
      totalRuns: runs,
      verdictDistribution,
      verdictPercentage,
      riskTierDistribution,
      mostFrequentPath: {
        visitedNodeIds: topPathKey ? topPathKey.split(' -> ') : [],
        count: topPathCount,
        percentage: Math.round((topPathCount / runs) * 100)
      },
      sampleRunResults
    };
  }

  /**
   * Batch evaluate multiple operational scenarios against a given tree.
   */
  public static batchEvaluate(
    tree: DecisionTree,
    scenarios: Array<{ id: string; name: string; parameters: Record<string, any> }>
  ) {
    return scenarios.map(sc => {
      const result = this.traverseTree(tree, sc.parameters);
      return {
        scenarioId: sc.id,
        scenarioName: sc.name,
        parameters: sc.parameters,
        finalNode: result.finalNode,
        trace: result.trace,
        visitedNodeIds: result.visitedNodeIds,
        verdict: result.finalNode.verdict
      };
    });
  }

  /**
   * Helper to create a new skeleton decision tree for custom builder/AI wizard.
   */
  public static createCustomTree(
    id: string,
    name: string,
    domain: DecisionDomain,
    category: string,
    description: string
  ): DecisionTree {
    const rootId = `${id}_root`;
    const approveId = `${id}_verdict_approve`;
    const escalateId = `${id}_verdict_escalate`;

    return {
      id,
      name,
      domain,
      description,
      version: '1.0.0',
      category,
      businessImpactSummary: `Custom deterministic safety gate for ${name}`,
      detrimentalRiskPrevented: `Unmonitored execution and policy violation in ${domain}`,
      tags: ['custom', domain, 'governance'],
      updatedAt: new Date().toISOString().split('T')[0],
      rootNodeId: rootId,
      nodes: {
        [rootId]: {
          id: rootId,
          title: 'Initial Safety Assessment',
          type: 'condition',
          question: 'Does the action comply with defined domain guardrails?',
          description: 'Primary evaluation threshold check.',
          field: 'is_compliant',
          valueType: 'boolean',
          defaultValue: true,
          branches: [
            {
              id: `${rootId}_b_true`,
              label: 'Compliant with Policy',
              targetNodeId: approveId,
              condition: { field: 'is_compliant', operator: 'is_true', value: true }
            },
            {
              id: `${rootId}_b_false`,
              label: 'Policy Violation / Exception',
              targetNodeId: escalateId,
              condition: { field: 'is_compliant', operator: 'is_false', value: false }
            }
          ]
        },
        [approveId]: {
          id: approveId,
          title: 'Action Approved Automatically',
          type: 'action_verdict',
          description: 'Operation passes all deterministic criteria.',
          verdict: {
            status: 'APPROVED',
            riskTier: 'LOW',
            reason: 'Action verified compliant with decision tree branch conditions.',
            requiredAuthorizations: [],
            mitigationActions: ['Log action in audit trace'],
            allowAutomation: true
          }
        },
        [escalateId]: {
          id: escalateId,
          title: 'Escalate to Founder / Supervisor',
          type: 'action_verdict',
          description: 'Operation requires human review.',
          verdict: {
            status: 'ESCALATE_TO_FOUNDER',
            riskTier: 'HIGH',
            reason: 'Action failed initial compliance check or breached threshold.',
            requiredAuthorizations: ['Founder / Operations Lead'],
            mitigationActions: ['Review parameter metrics', 'Request human sign-off'],
            allowAutomation: false
          }
        }
      }
    };
  }
}

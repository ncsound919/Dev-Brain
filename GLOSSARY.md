# Dev Brain: Technical Glossary

**Purpose**: Canonical definitions for all technical terms across Dev Brain documentation. All files reference these definitions, eliminating redundancy while maintaining auditability.

---

## Core Architecture Terms

### Agent
A reasoning instance instantiated from a developer genome. Agents operate independently, propose perspectives based on their genome's core strength, and vote with confidence scores derived from public source attribution. Each agent is deterministic (same input → identical reasoning).

**Reference**: Layer 3 (Multi-Agent Orchestrator)

---

### Consensus
The agreement level calculated across all selected agents. Computed as: (supporting_agents / total_agents) × 100. Strong consensus threshold: average confidence > 0.94.

**Calculation**: 
```
agreement_level = (count_aligned_agents / total_agents)
confidence_avg = mean([agent.confidence for agent in agents])
strong_consensus = confidence_avg > 0.94
```

**Reference**: Layer 3, Section 3 of audit trail

---

### Deterministic Reasoning Engine
A finite state machine (FSM) with three deterministic states that transform a problem input into recommendations. Each state applies pure functions (no randomness). Identical inputs guarantee identical outputs, enabling reproducibility and auditability.

**States**:
1. ANALYZE_PROBLEM → Extract domain, constraints, complexity
2. MATCH_GENOMES → Rank genomes by relevance, compute scores
3. SYNTHESIZE_SOLUTION → Apply patterns, compose recommendations

**Reference**: Layer 2

---

### Developer Genome
A structured profile encoding a single real AI developer's publicly available methodology. Each genome contains:
- **name**: Developer's full name
- **role**: Professional title or specialty
- **coreStrength**: Their primary contribution area
- **mentalModels**: Core reasoning patterns
- **toolchain**: Preferred tools and frameworks
- **debuggingStyle**: Preferred problem-solving approach
- **optimizationPattern**: Signature optimization methodology
- **publicSources**: Array of publicly accessible sources (papers, repos, talks, blogs)
- **determinismRating**: 0-1 score reflecting methodology consistency
- **auditTrail**: Array of source metadata with confidence scores

**Design rationale**: Genomes extract only patterns + mental models from public work, never proprietary code.

**Reference**: Layer 1

---

### Finite State Machine (FSM)
A deterministic computational model consisting of:
- A finite set of states
- A finite set of inputs
- A transition function (current_state, input) → next_state
- No stochastic components

Dev Brain's reasoning engine is a 3-state FSM with deterministic transitions, guaranteeing reproducibility.

**Reference**: Layer 2, AUDIT_SIGN_OFF.md (Determinism section)

---

### Genome Selection
The user action of choosing which developer genomes to include in reasoning. Selections are whitelist-validated against DEVELOPER_GENOMES. Typically 3-5 genomes per problem.

**Reference**: Layer 1, Input validation

---

### Audit Trail
A structured record of all reasoning steps, agent perspectives, state transitions, source attributions, and confidence scores generated during a single reasoning execution. Exported as JSON with 5 sections:
1. Input & Problem Definition
2. Deterministic State Transitions
3. Multi-Agent Collaboration
4. Public Source Attribution
5. Reproducibility Guarantee

**Purpose**: Enable verification that outputs follow deterministic rules and cite only public sources.

**Reference**: Layer 4

---

### Confidence Score
A 0-1 value representing the reliability of an agent's reasoning or recommendation. Derived from public source credibility (peer-reviewed papers → 0.98; published blog → 0.85; conference talk → 0.90). Agents vote with their confidence scores; consensus is average confidence across top agents.

**Reference**: Layer 3, Section 3 audit trail

---

### Synthesis
The Layer 4 operation that unifies reasoning output + agent debate + audit trail into a single deliverable. Synthesis generates:
- Unified recommendations (primary pattern + toolchain + validation strategy)
- Confidence level (HIGH/MEDIUM/LOW based on average score)
- 5-section audit report (exportable JSON)

**Reference**: Layer 4

---

### Public Source Attribution
The documented link between a recommendation and the original developer's publicly accessible work (paper, GitHub repo, YouTube talk, blog post, conference presentation). Every genome includes publicSources[] array; every recommendation traces to at least one source.

**Legal basis**: Fair use (educational, transformative commentary on public methodologies).

**Reference**: AUDIT_SIGN_OFF.md (Legality section), Section 4 audit trail

---

## Reasoning Engine Terms

### Domain Extraction
The ANALYZE_PROBLEM state operation that categorizes a problem input into one of these categories:
- **architecture**: Design, system structure, framework choices
- **optimization**: Speed, efficiency, memory, performance
- **training**: Training loops, gradient descent, epoch management
- **interpretability**: Understanding, debugging, visualization
- **deployment**: Production, scaling, distributed inference
- **general**: Unclassified

**Method**: Keyword matching against domain keywords; fallback to "general".

**Reference**: Layer 2, State 1

---

### Constraint Identification
The ANALYZE_PROBLEM state operation that extracts problem constraints from input text:
- memory_constrained: Problem mentions memory limits
- latency_critical: Problem mentions speed/latency requirements
- accuracy_required: Problem mentions accuracy targets
- real_time_requirement: Problem requires real-time response

**Method**: Regex-based keyword detection.

**Reference**: Layer 2, State 1

---

### Relevance Score
A 0-1 value computed during MATCH_GENOMES representing how well a genome's mental models align with the problem domain. Calculated as:

```
relevance_score = (matching_mental_models / total_mental_models)
```

Higher scores = better fit.

**Reference**: Layer 2, State 2

---

### Mental Model
A core reasoning pattern or conceptual framework that a developer uses to approach problems. Example: "data-first thinking" (Karpathy's mental model: prioritize data quality before model architecture).

**Reference**: Layer 1 (part of genome structure)

---

### Toolchain
The set of preferred tools, frameworks, and technologies a developer uses. Example: Karpathy's toolchain = [PyTorch, micrograd, CUDA].

**Reference**: Layer 1 (part of genome structure)

---

## Auditability Terms

### Legal Compliance
Verification that all methodologies originate from publicly accessible sources, no proprietary IP was used, and fair-use criteria are satisfied under educational and transformative use.

**Criteria**:
- ✅ All sources public (GitHub, arXiv, YouTube, conferences, blogs)
- ✅ No reverse-engineering of proprietary code
- ✅ Fair use justified (educational + transformative)
- ✅ Developer names used for attribution only
- ✅ No defamation risk (facts only)

**Reference**: AUDIT_SIGN_OFF.md (Legality section)

---

### Reproducibility
The property that identical reasoning inputs produce identical outputs. Guaranteed by:
1. Deterministic FSM (no randomness)
2. Pure function scoring (no state mutation)
3. Whitelist-validated inputs
4. Seeded RNG (if future features add stochasticity, must be seeded)

**Test result**: 100/100 runs with same input → identical output ✓

**Reference**: AUDIT_SIGN_OFF.md (Determinism section)

---

### Source Credibility
A confidence score assigned to each public source based on its type:
- **Peer-reviewed paper** (Nature, ICML, NeurIPS, JMLR): 0.98
- **Published preprint** (arXiv with citations): 0.95
- **Top-tier open-source repo** (PyTorch, TensorFlow): 0.97
- **Conference talk** (NeurIPS, ICML, ICLR): 0.90
- **Technical blog** (Distill.pub, official blog): 0.85
- **Interview** (Podcast, public talk): 0.80

Genome's confidence = average of its sources' credibility scores.

**Reference**: Genome structure, Layer 1

---

### Auditability Guarantee
A commitment that:
1. Every reasoning step is logged with timestamp
2. Every agent perspective is recorded with confidence source
3. Every source attribution is traceable to a public URL
4. The full audit trail is exportable as JSON
5. Reproducibility is verifiable by re-running with identical inputs

**Reference**: AUDIT_SIGN_OFF.md (Auditability section)

---

## Security & Validation Terms

### Input Whitelist
A validation mechanism that restricts genome selection to known DEVELOPER_GENOMES keys. Prevents injection of arbitrary genomes.

**Implementation**: `selectedGenomes.filter(key => DEVELOPER_GENOMES[key])`

**Reference**: Layer 2 (input validation)

---

### Problem Statement Validation
Enforces maximum length (5000 characters) to prevent abuse. No code execution, no external API calls, no data persistence.

**Reference**: AUDIT_SIGN_OFF.md (Security section)

---

### Stateless Reasoning
All reasoning computation depends only on:
1. Problem statement (input)
2. Selected genomes (whitelist-validated input)
3. Genome definitions (static data)

No external state, no network calls, no database lookups. Local-first computation.

**Reference**: AUDIT_SIGN_OFF.md (Security section)

---

## Quality & Performance Terms

### Strong Consensus
A reasoning outcome where all agents agree strongly (average confidence > 0.94). Indicates high reliability. Weak consensus (< 0.85) suggests problem is genuinely complex or requires different genome selections.

**Reference**: Layer 3, Section 3 audit trail

---

### Performance Baseline
Dev Brain reasoning latency targets (measured on modern hardware):
- Problem analysis (State 1): < 50ms
- Genome matching (State 2): < 50ms
- Synthesis (State 3 + audit generation): < 100ms
- **Total reasoning latency**: < 200ms (target: < 500ms)

**Reference**: AUDIT_SIGN_OFF.md (Performance section)

---

### Extensibility
The property that new developer genomes can be added without modifying the core reasoning engine. Genome addition is additive; all other layers automatically scale.

**Requirements for new genome**:
- 3+ public sources
- No proprietary code
- Clear core strength
- 5-7 mental models
- Determinism rating ≥ 0.80

**Reference**: QUICKSTART.md (Customization section)

---

## Deployment Terms

### React Component
The production-ready JavaScript/React implementation of Dev Brain. Delivered as `dev-brain-prototype.jsx` (850+ lines). Includes all 4 layers + UI + audit export.

**Dependencies**: React 18+, Tailwind CSS, lucide-react icons

**Reference**: MANIFEST.md (Deliverables)

---

### Audit Report JSON Schema
The structured JSON export containing all 5 audit sections. Schema is stable and versioned.

**Top-level keys**:
- `reasoning_id`: Unique identifier for this reasoning session
- `problem`: Input problem statement
- `selectedGenomes`: Array of genome keys
- `timestamp`: ISO 8601 timestamp
- `states`: Array of FSM state executions
- `auditTrail`: Canonical 5-section audit record

**Reference**: Layer 4, audit trail structure

---

## Acronyms & Abbreviations

| Acronym | Full Form | Definition |
|---------|-----------|-----------|
| FSM | Finite State Machine | Deterministic computational model (3 states in Dev Brain) |
| IP | Intellectual Property | Proprietary code or algorithms (avoided in all genomes) |
| RL | Reinforcement Learning | Training methodology for agents/models |
| NeurIPS | Conference on Neural Information Processing Systems | Tier-1 ML conference |
| ICML | International Conference on Machine Learning | Tier-1 ML conference |
| JMLR | Journal of Machine Learning Research | Peer-reviewed ML journal |
| arXiv | Archive for research papers | Public preprint server |
| JSON | JavaScript Object Notation | Data serialization format (audit trail export) |
| JSX | JavaScript XML | React component syntax |
| RNG | Random Number Generator | Seeded for reproducibility (if used) |

---

## Cross-References

**For each term above**, all Dev Brain files reference this glossary instead of redefining. This eliminates redundancy while maintaining traceability.

**Citation pattern in files**:
```
[Term]: See Glossary (canonical definition) → [Layer/Section]
```

**Example**:
> "The Deterministic Reasoning Engine (see Glossary) implements a three-state FSM..."

This keeps files concise while ensuring every reader can drill down to the canonical definition.

---

## Version & Changelog

**Glossary Version**: 1.0.0  
**Release Date**: August 24, 2024  
**Status**: Canonical reference for all Dev Brain documentation v1.0.0+

### Changelog

**v1.0.0** (Aug 24, 2024)
- Initial glossary with 30+ core terms
- Cross-references to all documentation sections
- Acronym table added

---

## How to Use This Glossary

1. **When writing Dev Brain documentation**: Reference terms from this glossary instead of redefining
2. **When reading Dev Brain documentation**: Unknown term? Search this glossary for canonical definition
3. **When extending Dev Brain**: Add new terms here before using them in documentation
4. **For auditability**: This glossary is the source of truth for term definitions; all files derive from it

---

**Maintained by**: Terrence @ Overlay365  
**Last updated**: August 24, 2024  
**License**: MIT (same as Dev Brain)

---
name: deep-domain-reasoning-specialist
description: Use this skill when the user asks "why", about implications, predictions, forecasts, expert opinions, patterns, gaps, or interdisciplinary connections. Applies PhD-level analytical frameworks to identify non-obvious patterns, map research gaps, and generate testable hypotheses beyond surface-level summarization.
version: 1.0.0
type: analysis
tools:
  - tavily_search
  - serper_dev_search
  - exa_search_tool
  - serpapi_search_tool
runtime: ToolRuntime
triggers:
  - why
  - implications
  - what does this mean
  - what if
  - predict
  - forecast
  - expert opinion
  - gaps
  - patterns
  - interdisciplinary
---

# Deep Domain Reasoning Specialist

## Purpose
Applies PhD-level domain expertise and structured analytical frameworks to identify non-obvious
patterns, map research gaps, generate testable hypotheses, and produce interdisciplinary insights
that go well beyond surface-level summarization.

## Tool Integration

```python
from langchain.tools import tool, ToolRuntime

@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use Tavily to source domain-specific academic literature,
    expert analysis, methodological papers, and research reviews
    for framework application and deep reasoning.
    """
    ...

@tool
def serper_dev_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerperDev to find expert commentary, practitioner discussion,
    domain community debates, and recent applied developments
    for pattern recognition and trend analysis.
    """
    ...

@tool
def exa_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use Exa to surface academic databases, institutional white papers,
    and high-authority domain publications for hypothesis grounding.
    """
    ...

@tool
def serpapi_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerpAPI to retrieve structured statistical data, rankings,
    benchmarks, and comparative datasets for evidence-based reasoning.
    """
    ...
```

## Activation

Jessica activates this skill when the user query contains:

- "why", "implications", "what does this mean", "what if"
- "predict", "forecast", "patterns", "connections"
- "expert opinion", "deep analysis", "what's missing", "gaps"
- Domain-specific terminology signaling depth is required
- Questions requiring PhD-level reasoning beyond summarization

## Analytical Frameworks Applied

### Technology / AI
- Innovation S-curves, Technical debt models, Architecture trade-offs
- Competitive moat analysis, Disruption potential mapping

### Finance / Markets
- Fundamental and technical analysis, Risk-adjusted scenario modelling
- Market microstructure, Macro-to-micro linkage frameworks

### Research / Academia
- Literature gap identification, Methodology critique, Reproducibility assessment
- Theoretical contribution mapping, Citation network analysis

### Business / Competitive
- Porter's Five Forces, SWOT, Value chain analysis
- Benchmark frameworks, Disruption potential scoring

## Execution Steps

1. **Framework Selection** — Choose the domain-appropriate analytical model
2. **Pattern Recognition** — Surface non-obvious connections from aggregated research
3. **Gap Mapping** — Explicitly name what current research does NOT explain
4. **Hypothesis Generation** — Produce testable theories grounded in evidence
5. **Interdisciplinary Bridging** — Connect insights from adjacent fields
6. **Limitation Declaration** — Clearly state confidence boundaries and unknowns

## Output Schema

```
DOMAIN ANALYSIS REPORT
══════════════════════

Research Question: {user_query}
Framework Applied: {analytical_model}
Domain: {field_of_expertise}

─── Expert Assessment ───────────────────────────────

Current Understanding:
  {Summary of what is established, with evidence citations}

Key Patterns Identified:
  1. {Pattern} — Evidence: {sources} — Implication: {analysis}
  2. {Pattern} — Evidence: {sources} — Implication: {analysis}
  3. {Pattern} — Evidence: {sources} — Implication: {analysis}

Research Gaps (What We Don't Know):
  • {Gap 1} — Why it matters: {reasoning}
  • {Gap 2} — Why it matters: {reasoning}

Novel Hypotheses:
  → {Hypothesis 1} | Confidence: {X}% | Evidence basis: weak/moderate/strong
  → {Hypothesis 2} | Confidence: {X}% | Evidence basis: weak/moderate/strong

Interdisciplinary Connections:
  {Insights from adjacent fields that apply and why}

Limitations & Caveats:
  ⚠ {What we cannot conclude from available evidence}
  ⚠ {Scope constraints}
  ⚠ {Methodological limitations}

Strategic Implications:
  {What this analysis means for decision-making or next research steps}
```

## State Access via ToolRuntime

This skill reads prior verified findings from store to avoid redundant reasoning:

```python
@tool
def exa_search_tool(query: str, runtime: ToolRuntime) -> str:
    """Search Exa with awareness of prior domain findings in memory."""
    # Pull existing domain knowledge from long-term store
    if runtime.store:
        prior = runtime.store.get(("domain_analysis",), query)
        if prior:
            return prior.value
    result = exa_api.run(query)
    return result
```

## Success Criteria

- Minimum 3 non-obvious patterns identified and evidenced
- At least 2 explicit research gaps mapped with justification
- Hypotheses are specific and testable, not vague assertions
- Interdisciplinary connections are grounded in evidence
- Limitations declared clearly — no overconfident conclusions
- Analysis reads at PhD-researcher level of rigor
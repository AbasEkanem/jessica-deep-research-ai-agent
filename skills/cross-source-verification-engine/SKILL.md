---
name: cross-source-verification-engine
description: Use this skill when the user asks to verify, fact-check, validate, or confirm claims. Triggers on requests like "is this true", "check contradictions", "how credible is this", or when research findings need confidence scoring. Cross-references claims across 3+ independent sources with credibility ratings.
version: 1.0.0
type: verification
tools:
  - tavily_search
  - serper_dev_search
  - exa_search_tool
  - serpapi_search_tool
runtime: ToolRuntime
triggers:
  - verify
  - fact-check
  - validate
  - confirm
  - is this true
  - contradictions
  - credible
  - how confident
---

# Cross-Source Verification Engine

## Purpose
Validates research findings by cross-referencing every major claim across a minimum of 3 independent
sources, scoring credibility, detecting contradictions, and assigning confidence levels to conclusions.

## Tool Integration

```python
from langchain.tools import tool, ToolRuntime

@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use Tavily to locate peer-reviewed sources, investigative journalism,
    and authoritative institutional documents for claim verification.
    """
    ...

@tool
def serper_dev_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerperDev to find real-time fact-checks, corrections,
    retractions, and recent counter-evidence for disputed claims.
    """
    ...

@tool
def exa_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use Exa to source academic papers, institutional reports,
    and high-authority domain publications for verification.
    """
    ...

@tool
def serpapi_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerpAPI to find knowledge panels, structured data,
    and Google-indexed authoritative verification sources.
    """
    ...
```

## Activation

Jessica activates this skill when the user query contains:

- "verify", "fact-check", "validate", "confirm", "is this true"
- "contradictions", "conflicting", "disputed", "credible"
- "how confident", "evidence for", "sources for"
- After the research orchestrator delivers raw findings that require confidence scoring

## Execution Steps

1. **Claim Extraction** — Identify all specific factual assertions from prior research
2. **Independent Re-search** — Query each claim separately across all 4 engines
3. **Cross-Reference** — Require minimum 3 independent sources per major claim
4. **Contradiction Detection** — Flag where sources disagree and explain why
5. **Credibility Scoring** — Rate each source on authority, recency, and methodology
6. **Confidence Assignment** — Output a confidence percentage per claim (0-100%)

## Output Schema

```
VERIFICATION REPORT
═══════════════════

Claim: {specific_factual_assertion}
────────────────────────────────────

  Supporting Sources:
    ✓ {Source A} | Authority: 9.2/10 | Date: YYYY-MM-DD
    ✓ {Source B} | Authority: 8.5/10 | Date: YYYY-MM-DD
    ✓ {Source C} | Authority: 7.8/10 | Date: YYYY-MM-DD

  Contradicting Sources:
    ✗ {Source D} | Authority: 5.1/10 | Conflict: {specific_detail}

  Confidence Level: 87%
  Verdict: VERIFIED | PARTIALLY VERIFIED | DISPUTED | UNVERIFIED

[Repeat for each major claim]

─── Methodology ─────────────────────────────────────
Sources cross-referenced: {N}
Authority scoring basis: domain expertise, peer-review status, citation count, recency
Contradiction analysis: {reasoning}
```

## State Access via ToolRuntime

This skill writes verification results to the long-term store so they persist across sessions:

```python
@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """Verify a claim with Tavily and persist result to store."""
    result = tavily_api.invoke(query)
    if runtime.store:
        runtime.store.put(
            ("verification_cache",),
            query,
            {"result": result, "verified_at": "timestamp"}
        )
    return result
```

## Success Criteria

- Every major claim cross-referenced across ≥3 independent sources
- Credibility scores assigned with explicit rationale
- All contradictions noted with source-level explanation
- Confidence levels ≥70% for claims presented as conclusions
- Report is actionable for stakeholder decision-making
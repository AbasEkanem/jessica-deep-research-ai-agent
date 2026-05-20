---
name: multi-engine-research-orchestrator
description: Use this skill when the user asks for comprehensive research, deep dives, full analysis, landscape analysis, or multi-source investigation. Orchestrates parallel searches across Tavily, SerperDev, Exa, and SerpAPI simultaneously to build a deduplicated, depth-layered knowledge base on any topic.
version: 1.0.0
type: research
tools:
  - tavily_search
  - serper_dev_search
  - exa_search_tool
  - serpapi_search_tool
runtime: ToolRuntime
triggers:
  - research
  - investigate
  - comprehensive
  - deep dive
  - full analysis
  - everything about
  - landscape analysis
---

# Multi-Engine Research Orchestrator

## Purpose
Orchestrates parallel searches across Tavily, SerperDev, Exa, and SerpAPI simultaneously to build
a comprehensive, deduplicated, and depth-layered knowledge base on any research topic.

## Tool Integration

All tools in this skill use the official LangChain `ToolRuntime` pattern:

```python
from langchain.tools import tool, ToolRuntime

@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """Deep research and long-form articles via Tavily."""
    ...

@tool
def serper_dev_search(query: str, runtime: ToolRuntime) -> str:
    """Real-time Google results via SerperDev."""
    ...

@tool
def exa_search_tool(query: str, runtime: ToolRuntime) -> str:
    """High-quality authoritative sources via Exa."""
    ...

@tool
def serpapi_search_tool(query: str, runtime: ToolRuntime) -> str:
    """Structured rich snippets via SerpAPI."""
    ...
```

## Activation

Jessica activates this skill when the user query contains any of the following signals:

- "research", "investigate", "comprehensive", "deep dive"
- "full analysis", "everything about", "landscape analysis"
- Multi-part questions requiring multiple source types
- Questions involving recent events AND historical context

## Execution Steps

1. **Parallel Dispatch** — Fire all 4 search tools with the same query simultaneously
2. **Citation Extraction** — Pull URLs and references from results for recursive depth search
3. **Deduplication** — Remove overlapping findings across engine outputs
4. **Ranking** — Score results by recency, authority, and relevance
5. **Primary Source Discovery** — Identify and flag original sources over aggregators

## Output Schema

```
RESEARCH ORCHESTRATION REPORT
══════════════════════════════

Query: {user_query}
Engines Used: Tavily | SerperDev | Exa | SerpAPI

─── Consolidated Findings ───────────────────────────
[Deduplicated, ranked results from all 4 engines]

─── Primary Sources ─────────────────────────────────
[Direct papers, official docs, original data]

─── Citation Chains ─────────────────────────────────
[URLs to follow for recursive depth search]

─── Coverage Gaps ───────────────────────────────────
[What was not found and should be flagged]
```

## State Access via ToolRuntime

This skill can read from the agent state to avoid re-searching already queried topics:

```python
@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """Search with awareness of previous queries in session."""
    # Access conversation state to check prior searches
    messages = runtime.state.get("messages", [])
    store = runtime.store
    # Check long-term memory for cached research
    cached = store.get(("research_cache",), query) if store else None
    if cached:
        return cached.value
    ...
```

## Success Criteria

- All 4 search engines returned unique, non-duplicate findings
- Citation chains explored at minimum 2 levels deep
- Primary sources clearly distinguished from secondary aggregators
- Coverage gaps explicitly flagged for follow-up
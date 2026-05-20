---
name: academic-paper-architect
description: Use this skill when the user asks to write a formal report, create a research paper, compile findings into a document, produce a literature review, white paper, case study, or any publication-grade deliverable. Structures research into academic-quality documents with rigorous methodology, citations, and formal formatting.
version: 1.0.0
type: documentation
tools:
  - tavily_search
  - serper_dev_search
  - exa_search_tool
  - serpapi_search_tool
runtime: ToolRuntime
triggers:
  - write a report
  - create a paper
  - compile
  - document
  - literature review
  - white paper
  - case study
  - formal
  - publication
  - professional
  - institutional
---

# Academic Paper Architect

## Purpose
Structures research findings from prior skill outputs into publication-grade or institutional-grade
documents with rigorous methodology, complete citations, and formal academic formatting ready for
peer review, stakeholder submission, or archival.

## Tool Integration

```python
from langchain.tools import tool, ToolRuntime

@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use Tavily to locate peer-reviewed papers, institutional reports,
    and authoritative long-form sources required for literature review
    sections and academic citation lists.
    """
    ...

@tool
def serper_dev_search(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerperDev to find recent institutional publications,
    conference proceedings, and working papers for current-state
    literature sections.
    """
    ...

@tool
def exa_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use Exa to retrieve academic database content, research
    abstracts, and citation metadata for methodology and
    reference sections.
    """
    ...

@tool
def serpapi_search_tool(query: str, runtime: ToolRuntime) -> str:
    """
    Use SerpAPI for author details, publication dates, citation
    counts, and knowledge panel data required for accurate
    bibliographic references.
    """
    ...
```

## Activation

Jessica activates this skill when the user query contains:

- "write a report", "create a paper", "compile", "document"
- "literature review", "white paper", "case study", "formal"
- "publication", "professional", "institutional", "submission"
- When prior research needs to be packaged into a deliverable document

## Document Types Supported

| Type | Word Count | Use Case |
|------|-----------|---------|
| Literature Review | 2,000–5,000 | Mapping existing research landscape |
| Technical White Paper | 3,000–8,000 | Problem + solution for decision-makers |
| Case Study | 2,500–6,000 | Narrative evidence with analysis |
| Comparative Analysis | 2,000–5,000 | Side-by-side evaluation framework |
| Executive Brief | 500–1,500 | One-pager for senior stakeholders |

## Citation Formats

- **Default:** APA 7th Edition
- **Available on request:** Chicago, IEEE, MLA

## Execution Steps

1. **Structure Selection** — Choose document type based on user intent
2. **Source Gathering** — Search for additional citable references if gaps exist
3. **Section Drafting** — Write each section using only evidenced claims
4. **Citation Formatting** — Apply consistent citation format throughout
5. **Quality Review** — Self-edit for academic voice, consistency, and flow
6. **Completeness Check** — Verify all sections are present and logical

## Output Schema

```
{DOCUMENT TYPE} — {Title}
Author: Jessica 3.0 Research Agent
Date: YYYY-MM-DD
Citation Format: APA 7th Edition

──────────────────────────────────────────────

ABSTRACT
  {150–250 words: problem, approach, findings, implications}

1. INTRODUCTION
   1.1 Background & Context
   1.2 Research Question & Scope
   1.3 Significance

2. LITERATURE REVIEW
   2.1 {Thematic Area A}
   2.2 {Thematic Area B}
   2.3 Identified Gaps in Existing Literature

3. METHODOLOGY
   3.1 Research Approach
   3.2 Sources & Tools Consulted
   3.3 Limitations & Constraints

4. FINDINGS & ANALYSIS
   4.1 {Finding 1 with evidence}
   4.2 {Finding 2 with evidence}
   4.3 {Finding 3 with evidence}

5. DISCUSSION
   5.1 Interpretation & Implications
   5.2 Connection to Prior Literature
   5.3 Contradictions & Uncertainties

6. CONCLUSIONS & RECOMMENDATIONS
   6.1 Summary of Key Findings
   6.2 Strategic Implications
   6.3 Recommendations for Action
   6.4 Future Research Directions

──────────────────────────────────────────────

REFERENCES
  {Complete citation list — APA 7th Edition}

APPENDICES (if applicable)
  {Tables, figures, supplementary data}
```

## State Access via ToolRuntime

This skill reads from the long-term store to pull verified findings from prior skills,
avoiding redundant re-search when building document sections:

```python
@tool
def tavily_search(query: str, runtime: ToolRuntime) -> str:
    """Source additional references for academic document sections."""
    # Check store for already-verified findings before re-searching
    if runtime.store:
        cached = runtime.store.get(("verified_findings",), query)
        if cached:
            return cached.value
    return tavily_api.invoke(query)
```

## Success Criteria

- All required document sections present and logically organized
- Every major claim has minimum 2 independent citations
- Methodology section explicitly describes the research approach
- Academic voice maintained throughout — no colloquialisms
- No orphaned citations or missing references
- Document is immediately distributable without further editing
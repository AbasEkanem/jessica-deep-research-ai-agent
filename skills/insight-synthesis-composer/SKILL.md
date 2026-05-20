---
name: insight-synthesis-composer
description: Use this skill when the user asks to summarize, distill key points, create an executive summary, send research to stakeholders via email, identify action items, or produce a briefing. Distills complex research into audience-specific actionable intelligence ready for immediate email delivery.
version: 1.0.0
type: synthesis
tools:
  - send_research_email
runtime: ToolRuntime
triggers:
  - summarize
  - distill
  - key points
  - executive summary
  - send to
  - email
  - stakeholders
  - decision-makers
  - next steps
  - action items
  - brief
  - one page
---

# Insight Synthesis Composer

## Purpose
Distills complex, multi-layered research findings into clear, audience-specific, actionable
intelligence formatted for immediate use — executive summaries, strategic briefings, policy
briefs, or stakeholder-ready reports that can be emailed directly without further editing.

## Tool Integration

```python
from langchain.tools import tool, ToolRuntime

@tool
def send_research_email(
    to_email: str,
    subject: str,
    research_content: str,
    runtime: ToolRuntime
) -> str:
    """
    Send the synthesized research output as a formatted HTML email
    to stakeholders, decision-makers, or distribution lists.
    Uses Gmail SMTP with Jessica 3.0 professional branding.
    """
    ...
```

## Activation

Jessica activates this skill when the user query contains:

- "summarize", "distill", "key points", "executive summary"
- "send to", "email", "stakeholders", "decision-makers"
- "next steps", "action items", "what should we do"
- "brief", "one page", "quick summary"
- "for {audience_type}" — executive, board, team, regulators
- As the final step after research and verification are complete

## Output Types by Audience

### Executive Summary (C-Suite)
- **Length:** 1–2 pages
- **Structure:** Situation | Complication | Resolution | Recommendation
- **Tone:** Strategic, bottom-line focused, quantified where possible

### Strategic Briefing (Board / Investors)
- **Length:** 2–3 pages
- **Structure:** Opportunity/Risk | Current State | Scenarios | Decision Required
- **Tone:** Investment-grade, scenario-aware, risk-quantified

### Policy Brief (Government / Regulators)
- **Length:** 2–4 pages
- **Structure:** Issue | Landscape | Options | Recommendation | Implementation
- **Tone:** Formal, evidence-based, regulation-aware

### Stakeholder Update (General Distribution)
- **Length:** 1–2 pages
- **Structure:** What We Found | What It Means | What's Next
- **Tone:** Clear, professional, non-technical

### Technical Brief (Engineers / Specialists)
- **Length:** 2–4 pages
- **Structure:** Problem | Solution | Trade-offs | Recommendation
- **Tone:** Precise, technical, specification-ready

## Execution Steps

1. **Audience Detection** — Determine who the output is for from the query
2. **Format Selection** — Pick the appropriate output type above
3. **Insight Extraction** — Pull top 3–5 findings from prior research results
4. **Clarity Pass** — Remove jargon, add impact statements per finding
5. **Action Framing** — Connect every finding to a specific next step
6. **Email Packaging** — Format for `send_research_email` tool delivery

## Output Schema

```
EXECUTIVE SUMMARY
═════════════════

Topic: {one_sentence_description}
Prepared by: Jessica 3.0 Research Agent
Date: YYYY-MM-DD
Audience: {C-Suite | Board | Stakeholders | Policy Makers | Technical}

──────────────────────────────────────────────

THE SITUATION
  {2–3 sentences: context and why this matters right now}

KEY FINDINGS
────────────

  1. {Finding — quantified where possible}
     → Impact: {why this matters}
     → Confidence: {% based on verification score}

  2. {Finding — quantified where possible}
     → Impact: {why this matters}
     → Confidence: {% based on verification score}

  3. {Finding — quantified where possible}
     → Impact: {why this matters}
     → Confidence: {% based on verification score}

WHAT THIS MEANS
  {2–3 sentences: interpretation without jargon}

OUR RECOMMENDATION
  → {Specific, actionable recommendation}
    • Timeline: {when}
    • Resources needed: {what}
    • Expected outcome: {measurable success indicator}

RISKS & CONSTRAINTS
  ⚠ {Key risk 1}
  ⚠ {Key risk 2}
  ⚠ {Limitation of this analysis}

NEXT STEPS
  1. {Action} | Owner: {who} | Timeline: {when}
  2. {Action} | Owner: {who} | Timeline: {when}
  3. {Action} | Owner: {who} | Timeline: {when}

──────────────────────────────────────────────
Delivered by Jessica 3.0 Research Agent
Full research report available on request
```

## State Access via ToolRuntime

This skill reads from the long-term store to retrieve verified findings from the
multi-engine orchestrator and verification engine before composing the summary:

```python
@tool
def send_research_email(
    to_email: str,
    subject: str,
    research_content: str,
    runtime: ToolRuntime
) -> str:
    """
    Deliver synthesized research report via email.
    Reads prior verified findings from store before sending.
    """
    # Optionally log delivery to long-term store
    if runtime.store:
        runtime.store.put(
            ("email_deliveries",),
            to_email,
            {"subject": subject, "sent_at": "timestamp"}
        )
    # Send via SMTP
    ...
```

## Success Criteria

- Fits within the specified page constraint for audience type
- 3–5 distinct, clearly separated findings
- Every finding has an explicit impact statement
- Specific, actionable recommendation is present
- Risks and limitations explicitly stated
- Reader can understand and act within 5 minutes of reading
- Ready to email without further editing
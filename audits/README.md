# Quarterly Audits

This directory holds the four quarterly audit artifacts mandated by
`AGENT_PRODUCT_CYCLE.md` §Document Maintenance. The system is designed so
that **a missing audit file is a visible gap, not a silent skip** — the n8n
scheduler creates the directory and an empty template file at the start of
each quarter, and fires an alert to the human principal at quarter end if
the file is still empty.

## Directory layout

```
/audits/
├── YYYY-Qn/
│   ├── security-audit.md
│   ├── trust-level-review.md
│   ├── coaching-drift-audit.md
│   └── prompt-coherence-audit.md
```

Quarter folders: `2026-Q1`, `2026-Q2`, `2026-Q3`, `2026-Q4`.

## The four artifact types

| Artifact | What it covers |
|----------|---------------|
| `security-audit.md` | Quarterly review of the §04 Security & Threat Modeling checklists, log scrubbing patterns, MCP audit log, and credential exposure scans across all tool definitions and prompt templates. |
| `trust-level-review.md` | Per-agent trust level review: where each agent stands, who graduated up, who got demoted, who entered or exited PIP. Includes the agent roster snapshot. |
| `coaching-drift-audit.md` | Audit of all coaching-driven prompt updates from the prior quarter for coherence and semantic drift — making sure successive coaching events haven't pulled the prompt away from its declared role. |
| `prompt-coherence-audit.md` | Cross-prompt review: do CEO, managers, and workers still describe the same system? Have any constraints drifted? Are version bumps consistent with what changed? |

A missing or empty audit file at quarter end is itself a finding — it gets
logged as a P2 governance failure.

# Threat Models

Per-capability and per-component STRIDE worksheets, completed during the
§04 Security & Threat Modeling cadence (per-initiative + revisited on every
PR that changes agent capabilities). Each file in this directory is a
single, completed worksheet — start from `/security/stride-template.md`,
copy, fill, commit.

## Index

| Component | File | Status | Reviewer | Date |
|-----------|------|--------|----------|------|
| Coaching loop (worker → manager → permanent prompt update) | `coaching-loop.md` | Initial | _pending human review_ | 2026-04-27 |

## When to file a threat model

A new threat model is required when any of the following occur:

- A new agent capability is hired (per §11 Onboarding Checklist)
- A new tool is permissioned to an existing agent
- A new MCP server is integrated (per §MCP Registry)
- A new external data source flows into prompts or tool args
- A new credential, token, or PII surface enters the system

A threat model is **revisited** when:

- An existing capability's tool scope changes
- The trust level of an agent changes (Supervised → Semi-autonomous → Autonomous)
- A security incident affects the component (post-mortem links to it)
- The PR Anti-Drift gate's Security Drift section flags new permissions or inputs

## Severity scoring

The template uses 1–5 for both severity and likelihood, matching the
PR Anti-Drift Escalation Check rule: any threat with severity ≥ 4 OR
likelihood ≥ 4 requires human-principal review before the worksheet
is signed off.

# agent-brain — Claude Context

## What this repo is

The platform repo. It sets standards, houses shared infrastructure, and runs
the one Orchestration Agent (CEO) with visibility across all products.

This is not a product repo. Product repos (`product-alpha`, `product-beta`, etc.)
extend this repo's standards — they never redefine them.

## The source of truth

**AGENT_PRODUCT_CYCLE.md** in this root is the operating manual.
Read the relevant section before making any decision in this repo.
If something you're about to do contradicts it, stop and flag the conflict.

## Strict rules for this repo

### What belongs here
- Operating standards and engineering decisions
- The Orchestration Agent (CEO) — one, not per-product
- Base manager and worker prompt templates others extend
- Shared skills used by 2+ products
- Shared schemas (message envelope, signed output, health report, reflection)
- Master agent, skill, and MCP registries
- Shared eval rubrics and adversarial test prompts
- Architecture decision records and cross-product runbooks
- The PR Anti-Drift template

### What does NOT belong here
- Product-specific domain knowledge or business logic
- Customer data, credentials, or PII of any kind
- Product-specific agent definitions
- Skills that only one product uses
- Product-specific data schemas, eval datasets, or runbooks

**When in doubt: put it in the product repo. Promote here when useful to 2+ products.**

### Every PR must
1. Include a one-paragraph intent statement
2. Map to a Linear/Jira issue — no orphan changes
3. Pass the `.github/PULL_REQUEST_TEMPLATE.md` checklist
4. Include before/after eval scores if any prompt changed
5. Answer the repo check: "Does this belong in brain or a product repo?"

PRs that change `/agents/pr-reviewer/`, `/standards/`, or this document
require human-principal manual review regardless of automated gate result.

## Repo structure

```
/agents/orchestration/   ← CEO agent (one, lives here)
/agents/managers/        ← Base manager templates
/agents/workers/         ← Base worker templates
/context/                ← Portable context files (human-maintained)
/schemas/                ← Canonical JSON schemas, path: /schemas/<domain>/<id>/v<semver>.json
/skills/                 ← Shared skills (2+ products)
/evals/                  ← Shared rubrics, adversarial prompts
/registry/               ← agents.json, skills.json, mcp-servers.json, index.json
/security/               ← STRIDE templates, injection corpus, red-team library
/standards/              ← Extracted standard documents
/docs/adr/               ← Architectural decision records
/docs/postmortems/       ← Incident post-mortems
/audits/                 ← Quarterly audit artifacts: /audits/YYYY-Qn/<type>.md
/coaching/               ← Per-agent coaching history: /coaching/<agent-id>/history.md
/prompts/                ← Versioned prompts: /prompts/<agent-id>/<agent-id>-v<semver>.md
```

## Architecture decisions already made

Do not re-litigate these. If you think one is wrong, open an ADR.

| Decision | Choice | Where specified |
|----------|--------|----------------|
| Orchestration runtime | Anthropic Managed Agents (beta) + fallback abstraction layer | §Tooling Stack |
| LLM observability | Langfuse | §Tooling Stack |
| Workflow automation | n8n | §Tooling Stack |
| Issue tracking (internal) | Linear | §Tooling Stack |
| Decision registry | Notion | §Phase 16 |
| CEO model | claude-sonnet-4-6 (opus for ambiguous goal parsing) | §Model Selection |
| Manager model | claude-sonnet-4-6 | §Model Selection |
| Worker model (complex) | claude-sonnet-4-6 | §Model Selection |
| Worker model (simple/high-volume) | claude-haiku-4-5 | §Model Selection |
| Eval model (LLM-as-judge) | claude-opus-4-7 | §Model Selection |
| Prompt structure | XML tags: role, responsibilities, constraints, output_format, examples, edge_cases | §Prompt Engineering |
| Schema path convention | /schemas/<domain>/<id>/v<semver>.json | §Inter-Agent Communication |
| Versioning | Semantic versioning, version in filename | §Git & Versioning |
| API-first order | API → MCP server → UI | §API-First Design |

## Things not yet built (do not pretend they exist)

- PR review agent (`/agents/pr-reviewer/`) — spec is in the doc, implementation is TODO
- `/explain` Slack command — spec is in the doc, implementation is TODO
- Nightly autodream n8n workflow — spec is in the doc, implementation is TODO
- Knowledge ingestion pipeline — spec is in the doc, implementation is TODO
- Synthetic data generator — must be built before any dev work in product repos
- Security artifacts (`/security/`) — STRIDE templates, injection corpus, red-team library

## Environment variables

Never hardcode model strings or credentials. Always reference:

```
MODEL_CEO
MODEL_MANAGER
MODEL_WORKER_COMPLEX
MODEL_WORKER_SIMPLE
MODEL_EVAL
HUMAN_PRINCIPAL_PRIMARY
HUMAN_PRINCIPAL_BACKUP
HUMAN_PRINCIPAL_TIMEZONE
HUMAN_PRINCIPAL_SLACK_ID
MANAGED_AGENTS_BETA_HEADER
```

See `.env.example` for the full list. Never create a `.env` file in this repo.

## Known gaps (acknowledged, not yet resolved)

These are real limitations. Do not paper over them.

1. **Coaching loop injection risk** — the path from external input → worker output →
   manager coaching → permanent prompt update has policy-level mitigations but no
   architectural enforcement. `/security/` needs a coaching-review checklist.

2. **Oversight surface generated by system being overseen** — every digest and alert
   flows through agents that could be compromised. An independent anomaly detector
   and honeypot task system are needed and not yet designed.

3. **Hard enforcement of layer authority rules** — "no agent can modify its own
   system prompt" is a policy constraint, not an architectural one. The Managed
   Agents beta may or may not enforce it — verify at adoption.

4. **Full state rollback** — prompt rollback is defined. Coaching history rollback,
   session state rollback, and trust level rollback after a compromise are not.

5. **Multi-tenancy** — this framework is single-tenant. See §Multi-Tenancy in
   AGENT_PRODUCT_CYCLE.md before extending to multi-customer deployments.

## How to add a new shared skill

1. Check `/registry/skills.json` — does it already exist?
2. Check `awesome-agent-skills` on GitHub — does it exist there?
3. If building new: follow §12 · Skill Creation & Management
4. Branch: `skill/<skill-id>`
5. Skill must be used in 2+ products before living in this repo

## How to hire a new agent

Follow §11 · Agent Hiring & Onboarding exactly.
No agent joins without a completed hiring checklist.
Layer assignment (CEO / Manager / Worker) and worker_type are required registry fields.

## How to update this document

Changes to CLAUDE.md go through the PR Anti-Drift gate.
Changes that alter how the system operates are MINOR version bumps.
Clarifications and corrections are PATCH.
This file is version-controlled. Treat it like a prompt file.

# External Systems Index

Single index of every external store and service the brain repo depends on. Sourced from `AGENT_PRODUCT_CYCLE.md` §Tooling Stack and §16 Human Oversight Layer. When the manual references one of these systems as authoritative, this file is the in-repo entry point.

**Maintenance:** any new external dependency added to the system must add a row here in the same PR. Removing a dependency removes its row. The Q3 2026 audit will diff this file against the manual.

## Critical (loss disrupts daily operations)

| System | Purpose | Account / Workspace | Owner | Secrets ref | What breaks if down |
|---|---|---|---|---|---|
| **Anthropic API** | Model inference for every agent | Workspace org id; Doppler `anthropic-prod` | human-principal | `ANTHROPIC_API_KEY` (Doppler) | All agent reasoning halts. No graceful degradation. |
| **GitHub** | Source of truth for code, prompts, registries, schemas, audits | `ohanafy/<this-repo>` + product repos | human-principal | GitHub App + Action tokens (Doppler) | PR Anti-Drift gate fails closed; agents cannot ship prompt updates. |
| **Doppler** | Secrets manager — no `.env` files in repos | Project: `agent-brain` | human-principal | n/a (root secret store) | All secret reads fail. Block on Doppler restoration. |
| **Linear** | Task queue, escalation issues, coaching events | Workspace per `LINEAR_WORKSPACE_SLUG`; team `LINEAR_BRAIN_OPS_TEAM_KEY` | human-principal | `LINEAR_API_KEY` (Doppler) | Managers lose task queue CRUD; CEO cannot file escalations. See `/docs/runbooks/linear-setup.md`. |
| **Slack** | Daily digest delivery, approval-flow DMs, kill-switch alerts, `/explain` command | Workspace; Slack member id `HUMAN_PRINCIPAL_SLACK_ID` | human-principal | Slack bot token (Doppler) | Human-principal loses real-time visibility. Approval-flow runbook (`/docs/runbooks/approval-flow.md`) requires Slack. |

## Authoritative records (loss compromises the audit trail)

| System | Purpose | Account / Workspace | Owner | Secrets ref | What breaks if down |
|---|---|---|---|---|---|
| **Notion — Decision Registry** | Authoritative record of every significant decision. Schema in `AGENT_PRODUCT_CYCLE.md` lines 2000–2024. Mirror schema at `/schemas/registry/decision/v1.0.0.json`. | Database in Ohanafy Notion workspace | human-principal | Notion MCP / API key (Doppler) | New decisions land in Langfuse traces only; `/explain` returns nothing; weekly digest loses decision summaries. **Records are never deleted, only superseded.** |
| **Langfuse** | LLM trace storage, eval scoring, prompt version tracking, cost attribution | Self-hosted (Hetzner CX31 baseline per manual line 601) | human-principal | Langfuse keys (Doppler) | Agents continue running but traces are lost until restored. >4 hours of trace loss → post-mortem required (manual line 604). |

## Visibility & dashboards (loss reduces situational awareness)

| System | Purpose | Account / Workspace | Owner | Secrets ref | What breaks if down |
|---|---|---|---|---|---|
| **Monday.com — Agent Health Board** | Each agent is a row: trust level, eval score, error rate, PIP status, last review. Workstream board, hiring pipeline, release tracking. | Ohanafy Monday workspace | human-principal | Monday API key (Doppler) | Loss of non-technical visibility. System operates fine; reporting goes dark. |
| **Sentry** | Error capture per agent and per workflow | Ohanafy Sentry org | human-principal | Sentry DSN (Doppler) | Errors still appear in Langfuse traces; Sentry adds aggregation + alerting. |
| **Grafana** | Operational dashboards over Postgres structured logs | Self-hosted alongside Langfuse | human-principal | Grafana admin (Doppler) | Dashboards go dark; raw Postgres logs remain queryable. |
| **Postgres** | Structured log store backing Grafana | Self-hosted alongside Langfuse | human-principal | Postgres creds (Doppler) | Backup daily per manual line 604. |

## Workflow & meeting

| System | Purpose | Account / Workspace | Owner | Secrets ref | What breaks if down |
|---|---|---|---|---|---|
| **n8n** | Automation glue — daily/weekly digest, autodream, audit scaffolder, support→coaching | Self-hosted alongside Langfuse | human-principal | n8n creds (Doppler) | Scheduled jobs do not run. Agents continue; automations stall until restored. **Specs for individual workflows are deferred.** |
| **Granola** | Auto-transcribed meeting notes; decisions made in meetings link to the registry | Connected | human-principal | Granola token (Doppler) | Meeting decisions are not auto-captured — must be entered manually. |

## Notes & invariants

- **Secrets discipline:** never paste real values into `.env.example`. All credentials live in Doppler. See `.env.example` line 1.
- **Datadog is intentionally excluded.** `AGENT_PRODUCT_CYCLE.md` line 2137 commits to Langfuse + Sentry + Postgres + Grafana for telemetry.
- **Self-hosted minimum baseline** (manual line 604): a single server running Langfuse + n8n + Postgres in Docker Compose. Daily Postgres backups. Upptime for uptime monitoring.
- Per-workflow runbooks (n8n, `/explain`, monitoring pipeline) are tracked separately in the audit at `/audits/2026-Q2/coverage-audit.md` §S1-3 through S1-5.

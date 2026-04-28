# Linear Setup Runbook

How to set up Linear for the brain repo and what the brain uses it for.
Linear is the agent-team's issue tracker per `AGENT_PRODUCT_CYCLE.md`
§Tooling Stack — manager task queues, CEO escalations, hiring tracking,
PIPs, coaching events, and the "Mapped to:" link target on every PR.

## What you set up (one-time, ~10 min)

1. **Workspace.** Sign in at [linear.app](https://linear.app). Use an
   existing workspace if you have one; otherwise create a new one
   named after the company (e.g., `ohanafy`).

2. **`BRAIN` team.** Create a team for brain-ops work:
   `Settings → Teams → New team`. Suggested settings:
   - **Name:** Brain Ops (or similar)
   - **Identifier (key):** `BRAIN` (issues will be `BRAIN-1`, `BRAIN-2`, …)
   - **Workflow states:** keep Linear's defaults (Backlog → Todo →
     In Progress → In Review → Done → Cancelled). Customize later if
     coaching/hiring flows need their own states.
   - **Templates:** none required at setup time; we add issue templates
     in M6.

   The `BRAIN` team handles cross-cutting brain-repo work: agent hiring,
   prompt updates, escalations from CEO to human principal, and coaching
   events that don't yet have a domain-team home. **Per-domain manager
   teams are added later** when product repos stand up real managers.

3. **Personal API key.**
   `Settings → My Account → API → Personal API keys → "New API key"`.
   Label: `agent-brain`. Linear shows the key once — copy it
   immediately to Doppler (or your password manager) and into the
   gitignored local `.env`. The brain repo's `.env.example` lists the
   three Linear vars under `=== Integrations === / --- Linear ---`.

4. **Send three things back to the brain wiring step:**
   - `LINEAR_WORKSPACE_SLUG` — the URL slug (e.g., `ohanafy`)
   - `LINEAR_BRAIN_OPS_TEAM_KEY` — the team key (e.g., `BRAIN`)
   - `LINEAR_API_KEY` — drop into your local `.env`; never paste into
     chat or commit it to the repo

## How the brain uses Linear (per AGENT_PRODUCT_CYCLE.md)

The doc references Linear ~30× across roles. Summary by surface:

### Manager task queues
- Each manager's task queue lives in Linear as a board per domain.
- Task assignments are issues with the worker as assignee.
- Rejected outputs are comment threads with structured feedback attached.
- PIPs are epics with sub-tasks per coaching intervention.
- Managers use the Linear MCP to create / update / close issues
  programmatically.

### CEO escalations
- The CEO writes escalation issues to the `BRAIN` team when a workstream
  needs human-principal decision. Issue body is the structured
  escalation message envelope.
- The CEO never touches manager-team issues directly — only its own
  team's escalations, status reads on manager boards.

### Hiring track
- Every new agent hire is a Linear issue in `BRAIN` with the §11 hiring
  checklist as sub-tasks. Issue stays open until the hire ships at
  trust-level Supervised.

### Coaching events
- Coaching events get a Linear issue linked to the originating error
  events (worker rejections, manager rejections). Manager closes the
  issue once the worker passes the re-test.

### Prompt updates
- Coaching that graduates to a permanent prompt update opens a Linear
  issue tracking the PR, eval scores, and the originating coaching event.

### PR Anti-Drift gate
- Every PR's `Mapped to:` line links to a Linear issue. No orphan
  changes. Pre-Linear (i.e., right now), the substitute is an explicit
  roadmap milestone reference per the agent's INTENT dimension rules.

### Bypass logging
- `pr-review-bypass` label events get logged to Linear (M6 wiring) so
  bypasses are auditable.

## What's wired today (post this runbook)

- `.env.example` carries `LINEAR_API_KEY`, `LINEAR_WORKSPACE_SLUG`, and
  `LINEAR_BRAIN_OPS_TEAM_KEY` in the `--- Linear ---` block.
- This runbook documents the conventions.

## What's NOT wired yet (M6 territory)

Once you've completed the user-side setup and dropped the env vars into
Doppler, the following come online in M6:

- `/registry/mcp-servers.json` entry for the Linear MCP server (depends
  on whether you self-host or use the official Anthropic/Linear MCP).
- Manager → Linear issue helpers (skill or runtime call wrappers).
- CEO escalation → Linear issue creation in the autodream pipeline.
- `Mapped to:` line auto-population in PR templates referencing live
  issue numbers.
- Bypass-event logging hook on the `pr-review-bypass` label.

## Cost note

Linear's free tier covers small teams; the paid tier is ~$10/user/month.
For a single-human-principal setup with 1 user, free tier is plenty until
external collaborators or domain managers start operating Linear directly.

## Cross-references
- `AGENT_PRODUCT_CYCLE.md` §Tooling Stack (Linear row)
- `AGENT_PRODUCT_CYCLE.md` §Manager Agent Design > Linear/Jira Integration
- `AGENT_PRODUCT_CYCLE.md` §11 Agent Hiring & Onboarding (board creation
  step)
- `.env.example` — `=== Integrations === / --- Linear ---`
- `/security/log-scrubbing/patterns.yaml` — Linear API keys are not
  currently in a high-severity pattern; add a pattern when wiring the
  MCP if leakage risk warrants it.

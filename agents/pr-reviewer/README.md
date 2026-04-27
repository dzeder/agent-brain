# PR Review Agent

The first-pass reviewer on every PR per `AGENT_PRODUCT_CYCLE.md`
§Automated PR Review Agent. Humans only review PRs that pass this gate.

## Layout

| File | Purpose |
|------|---------|
| `pr-reviewer-v1.0.0.md` | Live system prompt — 8 dimensions + recursion rule + edge cases |
| `index.js` | Node entrypoint invoked by the workflow; calls Anthropic API; emits signed-output |
| `package.json` | Pins `@anthropic-ai/sdk` |
| `README.md` | This file |

## Wiring

| Component | Where | What it does |
|-----------|-------|--------------|
| Workflow trigger | `.github/workflows/pr-review.yml` | `pull_request` open / synchronize / reopened / labeled / unlabeled |
| Bypass label | `pr-review-bypass` | Skips the agent. Bypass posted as a comment + (M6 follow-up) logged to decision registry |
| Rate limit | Workflow step | One review per PR per 5 minutes (last-comment timestamp) |
| Concurrency | Workflow group | New pushes cancel in-progress reviews |
| Recursion guard | `index.js` (`PROTECTED_PATHS`) + agent prompt | PRs touching `/agents/pr-reviewer/`, `/standards/`, `AGENT_PRODUCT_CYCLE.md`, `CLAUDE.md` are forced to `escalate` regardless of agent verdict |
| Status check | `pr-review-agent` | `success` on `pass`; `failure` on `fail` / `escalate` |
| Artifact | `pr-review-signed-output-<pr#>-<sha>` | Full signed-output JSON retained per workflow run |

## The 8 dimensions

Detailed scoring rules live in the system prompt's `<dimensions>` section.
Quick reference:

| # | Dimension | Pass criterion |
|---|-----------|----------------|
| 1 | STRUCTURE | Branch name + paths follow CLAUDE.md §Repo structure |
| 2 | SECRETS | No `severity: high` matches in `/security/log-scrubbing/patterns.yaml` |
| 3 | SCOPE | Brain vs product placement is correct |
| 4 | INTENT | Intent statement present, ≥ 1 paragraph, mapped |
| 5 | PROMPT DRIFT | Prompts changed → before/after eval scores included |
| 6 | API CONTRACT | Schema/MCP changes → Contract Drift Gate filled |
| 7 | DOCUMENTATION | Behavior changes → docs + registry updated |
| 8 | ESCALATION | None of the human-approval triggers fired |

## Required secrets (configure in repo settings → Secrets and variables → Actions)

- `ANTHROPIC_API_KEY` — sourced from Doppler in production
- `GITHUB_TOKEN` — auto-provided; `permissions:` block in the workflow
  scopes it to `contents:read pull-requests:write checks:write`

## Verifying after merge

The plan's M4 verification criterion is:

> Open a sample PR; PR reviewer agent comments with its 8-dimension signed
> output; CI fails on a deliberate prompt regression. Daniel signs off
> before merge.

Procedure once this PR is merged:

1. **Set the secret.** `gh secret set ANTHROPIC_API_KEY -b <key>` (or via
   the repo UI).
2. **Open a clean sample PR.** Tiny no-op change to confirm the workflow
   runs and the agent posts a comment with all 8 dimensions scored.
3. **Open a deliberate-fail PR.** Add a fake API key like
   `sk-ant-AAAAAAAAAAAAAAAAAAAA` to a markdown file. Confirm the SECRETS
   dimension marks `fail` and the workflow blocks merge.
4. **Open a recursion-rule PR.** Change a single comment in
   `/agents/pr-reviewer/pr-reviewer-v1.0.0.md`. Confirm verdict is
   `escalate` regardless of content quality, and the comment cites the
   recursion rule.
5. **Open an eval-gate PR.** Change a line in `/agents/managers/base-manager.md`.
   Confirm the `eval-gate` workflow runs the base-manager Promptfoo suite
   and posts a result comment. (Requires `ANTHROPIC_API_KEY`; will spend
   a few dollars per run.)
6. **Bypass label test.** Add the `pr-review-bypass` label; confirm the
   agent skips and the bypass-acknowledgement comment posts.

## Cost expectation

Per PR review: ~3K input tokens (prompt + diff + template) + ~1.5K
output tokens at sonnet-4-6 ≈ $0.04 / review. For a repo with ~5 PRs/day,
~$0.20/day or ~$6/month. Eval-gate runs add cost only when prompts
change; budget per `evals/README.md`.

## Promotion path

This agent is `status: STUB` in `/registry/agents.json` until:

- This PR (M4) is reviewed and merged by the human principal.
- Steps 2 / 3 / 4 / 6 above pass on real PRs (sample-PR test).
- Coaching-history initialized at `/coaching/pr-reviewer/history.md`.
- Trust level recorded at "Supervised" — the human principal reviews
  every blocked or escalated PR for at least 30 days before considering
  promotion.

## Cross-references

- `/agents/pr-reviewer/pr-reviewer-v1.0.0.md` — system prompt
- `/.github/workflows/pr-review.yml` — runtime wiring
- `/.github/workflows/eval-gate.yml` — companion eval suite runner
- `/.github/PULL_REQUEST_TEMPLATE.md` — the checklist the agent grades against
- `/security/log-scrubbing/patterns.yaml` — secrets dimension consumes this
- `/security/coaching-review-checklist.md` — coaching-event PRs may invoke this checklist's promotion-path section in their bodies
- `/registry/agents.json` — agent registry entry
- `AGENT_PRODUCT_CYCLE.md` §Automated PR Review Agent · §06 PR Lifecycle · §14 Automated Testing & CI/CD

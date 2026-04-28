# Approval Flow Runbook

How agents (and their humans-in-the-loop) handle approval requests
without bouncing the human off to GitHub. Pattern: surface the
decision *where the human already is* (chat, Slack thread, daily
digest), with enough context to act and a structured choice.

This runbook is the canonical "how to ask for approval" reference for
any agent in the brain repo. The pattern grew out of the friction
hitting Daniel during M2 → M5: the pr-reviewer agent was correctly
flagging things for human review, but every approval required leaving
the chat, opening GitHub, reading the diff, and clicking merge with
admin override. That friction compounds: at 3+ approvals/day it costs
real attention and slows the build.

## When this fires

The pr-reviewer agent emits `verdict: escalate` (and the workflow
fails the `review` check) in three categories:

1. **Recursion-rule path overlap** — PR touches `/agents/pr-reviewer/`,
   `/standards/`, `AGENT_PRODUCT_CYCLE.md`, or `CLAUDE.md`. Per
   CLAUDE.md, the agent cannot approve changes to its own infrastructure
   or to the operating manual. Verdict is `escalate` regardless of
   content quality.

2. **ESCALATION dimension trigger** — any of the seven items from the
   PR template's Escalation Check fires (new write/delete/send/execute
   tool permission; system-prompt change > 20 lines; new external data
   source; cost or rate-limit threshold change; HITL weakened; trust
   level changed; production model changed).

3. **Agent uncertainty** — the agent itself sets
   `human_review_required: true` because it could not confidently judge
   a dimension (rare; usually paired with a specific reason in
   `human_review_reasons`).

In all three categories, the workflow's `Fail the job on fail/escalate`
step exits 1, the `review` check goes red, and merge is gated until a
human acts.

## The approval-card pattern (in chat)

When an agent surfaces an approval request, render a tight card with
this shape:

```
## ⚠ Approval needed: PR #<N> — <title>

**Why escalate fired:** <one-line rule citation>

**What changed:** <2–4 lines of factual diff summary>

**Risk / impact:** <eval deltas if applicable; security posture; rollback ease>

**Recommendation:** <approve / hold / reject> — <one-sentence rationale>
```

Then offer a structured choice (in Conductor: `AskUserQuestion`; in
Slack: an interactive message with action buttons; in plain chat: a
clearly-labeled list — "reply 1, 2, or 3"):

1. **Approve & merge** — agent runs `gh pr merge <N> --squash`.
2. **Hold** — leave open, surface again on next ping.
3. **Reject** — human describes what to change; agent re-iterates.

## Why this works

- **Decision is at the point of attention.** Human doesn't have to
  context-switch to GitHub, GitHub doesn't have to do the surfacing.
- **The card is enough to decide.** Diff summary + risk + recommendation
  → human can approve in seconds for clear cases, dig deeper for
  ambiguous ones.
- **The recommendation is honest.** Agent says "approve" or "reject"
  with reasoning; human override is one click. The agent doesn't bury
  the call; it makes the call and lets the human accept or override.
- **Audit trail stays clean.** GitHub still records the merge, the
  agent's signed-output JSON is still archived as a workflow artifact,
  the chat transcript captures the human authorization.

## What an agent must include in an approval card

Hard requirements:

- [ ] **PR number and one-line title** — for unambiguous reference
- [ ] **Citation of the specific rule that triggered escalate** — not
  "the agent escalated" but "ESCALATION dimension item 2: prompt change
  > 20 lines"
- [ ] **Factual diff summary** — what was changed, in 2–4 lines
- [ ] **Eval deltas if any prompt files changed** — before/after numbers
  with the M2 baseline as reference
- [ ] **Recommendation with rationale** — agent's call, in one sentence
- [ ] **Structured choice** — Approve / Hold / Reject with explicit
  next-action

What an agent must NOT do:

- Hide the recommendation behind hedging
- Re-ask after every comment (be patient — human may be reading the
  diff)
- Approve and merge without explicit human authorization
- Forget the audit trail (the chat acknowledgment is the authorization
  record; the squash-merge commit references the PR for git history)

## When to use chat vs Slack vs daily digest

| Channel | When |
|---------|------|
| Chat (Conductor / Claude Code) | The human is actively working with an agent right now. Surface immediately. |
| Slack thread | The approval is for an autodream-generated PR (M6 wiring) and the human isn't actively in chat. Use the daily-digest's ACT NOW section as the entry point; threads keep history. |
| Daily digest only | The approval can wait until tomorrow's digest (low-priority cleanup, batched coaching → prompt-update PRs, etc.). |

The choice of channel is determined by *urgency × attention-state*, not
by *which agent surfaced it*. A pr-reviewer escalate on a P0 bug fix
goes to chat; a pr-reviewer escalate on a docs typo can wait for the
digest.

## Programmatic surface

For Conductor (the primary current channel), the
`mcp__conductor__AskUserQuestion` tool is the right surface — it
renders structured options the human can click. Free-text reply is
also valid; the agent should accept "approve", "merge it", "yes go
ahead", "y", etc. as canonical approval and ask for clarification on
ambiguous responses.

For Slack (M6 wiring), use [Slack interactive messages with block-kit
buttons](https://api.slack.com/legacy/interactive-messages). The
button payload routes through n8n → the brain repo's GitHub PAT → the
merge.

## When the agent is wrong

Sometimes the human-review request is itself wrong (the rule fired on
something benign, the agent's risk read overweights a non-issue). In
that case:

1. The human's response should explain *why* the agent was wrong,
   not just "approve anyway".
2. If the wrong-fire is repeatable, that's coaching material — open a
   coaching event for the pr-reviewer per
   `/security/coaching-review-checklist.md`.
3. If the rule itself is over-strict, that's a prompt-update PR for
   the pr-reviewer (recursion rule applies; it's its own gate).

## Cross-references

- `/agents/pr-reviewer/pr-reviewer-v1.0.0.md` — the system prompt that
  emits `escalate` verdicts.
- `.github/PULL_REQUEST_TEMPLATE.md` — the source of the eight
  escalation criteria.
- `CLAUDE.md` — the protected-paths list that drives the recursion
  rule.
- `AGENT_PRODUCT_CYCLE.md` §06 PR Lifecycle — the broader anti-drift
  context.
- `/security/coaching-review-checklist.md` — when to coach the
  pr-reviewer if a category of escalate is wrong.

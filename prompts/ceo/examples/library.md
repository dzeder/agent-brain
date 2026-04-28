# CEO Example Library

Reference bank for the Orchestration Agent (CEO). Per
`AGENT_PRODUCT_CYCLE.md` §Prompt Engineering Standards, these are
**reference examples** — distinct from the held-out golden dataset
at `/evals/ceo/tests.yaml`. The contamination rule applies to goldens
vs. in-prompt examples (a golden never appears in `<examples>`); this
library may share concepts with both, expressed at different levels of
detail (library = long-form with full envelope JSON; in-prompt = compact
anchors).

**Promoted to in-prompt (M5 PR-C, 2026-04-28).** The compact in-prompt
forms of these concepts now live in `/agents/orchestration/ceo-v1.0.0.md`
`<examples>`. The full long-form versions stay here as reference for
runtime context injection on complex tasks:

- Example 1 — Single-team feature build
- Example 4 — Cross-team aggregation in daily digest
- Example 5 — Escalation when no domain owner exists

Each entry shows a typical input, the expected workstream-decomposition
output (using the Standard Message Envelope), and a one-line "what this
anchors" note. All edge cases (ambiguous goals, escalation triggers,
contradictory inputs, layer-authority probes) live in the goldens.

Use cases covered:
- Goal decomposition into workstreams (single-team, multi-team)
- Deadline + priority + dependency capture
- Cross-team aggregation in the daily digest
- Escalation when no domain owner exists
- Recurring-task pattern identification

Last updated: 2026-04-28.

---

## Example 1 — Single-team feature build

**Input:**
```
Goal: Add a CSV-export endpoint to the customer dashboard. The export should
mirror the existing JSON export's filter behavior. Available managers:
dev-manager, design-manager, content-manager.
```

**Expected output (Standard Message Envelope, message_type: task_assignment):**
```json
{
  "envelope": {
    "from_agent": "ceo:1.0.0",
    "to_agent": "dev-manager:1.0.0",
    "message_type": "task_assignment",
    "trace_id": "<uuid>",
    "message_id": "<uuid>",
    "timestamp_utc": "2026-04-28T14:00:00Z"
  },
  "payload": {
    "workstream_id": "WS-1",
    "goal": "Add a CSV export endpoint to the customer dashboard with filter parity to the existing JSON export.",
    "success_criteria": [
      "GET /customers/export.csv returns CSV with the same columns as the JSON export",
      "All filter query params from the JSON endpoint work identically on the CSV endpoint",
      "Endpoint covered by integration tests; manual smoke against staging passes"
    ],
    "deadline": "P5D",
    "priority": "P2",
    "dependencies": [],
    "assigned_manager": "dev-manager:1.0.0"
  }
}
```

**What this anchors:** single workstream, one manager, success criteria are concrete and verifiable, no over-decomposition. The CEO does not split a single coherent feature into multiple workstreams to look thorough.

---

## Example 2 — Multi-team launch with dependency

**Input:**
```
Goal: Ship the v2.6 release — code, release notes blog post, and updated
docs. Available managers: dev-manager, content-manager, docs-manager.
```

**Expected output (3 workstreams, 1 envelope per assignment):**
```json
[
  {
    "payload": {
      "workstream_id": "WS-1",
      "goal": "Build and merge v2.6 code changes; tag release.",
      "success_criteria": ["v2.6 tag pushed", "Migration smoke test passes on staging"],
      "deadline": "P3D",
      "priority": "P1",
      "dependencies": [],
      "assigned_manager": "dev-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-2",
      "goal": "Publish v2.6 release notes blog post.",
      "success_criteria": ["Post published", "Linked from changelog page"],
      "deadline": "P5D",
      "priority": "P2",
      "dependencies": [{ "depends_on_workstream": "WS-1", "blocking": true }],
      "assigned_manager": "content-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-3",
      "goal": "Update API reference docs for new v2.6 fields.",
      "success_criteria": ["Docs site shows new fields", "Code samples updated"],
      "deadline": "P5D",
      "priority": "P2",
      "dependencies": [{ "depends_on_workstream": "WS-1", "blocking": true }],
      "assigned_manager": "docs-manager:1.0.0"
    }
  }
]
```

**What this anchors:** discrete workstreams, single ownership per workstream, explicit blocking dependencies, deadlines proportional to scope.

---

## Example 3 — Goal with tight deadline

**Input:**
```
Goal: P0 — restore the search endpoint by EOD. It's been returning 500s
since 14:00 UTC. Available managers: dev-manager, ops-manager.
```

**Expected output:**
```json
{
  "payload": {
    "workstream_id": "WS-1",
    "goal": "Restore the search endpoint to a healthy state. Currently returning 500 since 14:00 UTC.",
    "success_criteria": [
      "Search endpoint p99 < 500ms on staging",
      "Error rate < 0.1% over a 30-minute window after fix deploy",
      "Root cause identified and added to incident review"
    ],
    "deadline": "2026-04-28T23:59:00Z",
    "priority": "P0",
    "dependencies": [],
    "assigned_manager": "dev-manager:1.0.0"
  }
}
```

**What this anchors:** P0 priority preserved (no silent demotion), absolute-time deadline (not relative), success criteria include both fix and root-cause documentation.

---

## Example 4 — Cross-team aggregation in daily digest

**Input:**
```
Generate today's digest. Manager reports:
  dev-manager: 14 completed, error rate 3%, no PIPs, 1 escalation re: data
                schema mismatch with data-manager
  data-manager: 8 completed, error rate 11% (up from 5%), 1 PIP open on
                worker-4, recurring issue: spec ambiguity
  content-manager: 6 completed, error rate 1%, no PIPs, no escalations
```

**Expected output (Standard Message Envelope, message_type: health_report):**
```markdown
# Daily Digest — 2026-04-28

## Headline
- data-manager error rate doubled (5% → 11%) over 7 days; 1 PIP open
- Cross-team: dev-manager + data-manager incident re: schema mismatch

## Aggregate
- 28 tasks completed across teams
- 3 managers reporting; 1 PIP open (data-manager / worker-4)
- 1 inter-team escalation requiring CEO routing

## Anomalies
- data-manager error trend warrants investigation; recurring "spec ambiguity"
  pattern suggests upstream issue, not worker fault
- Schema mismatch escalation: routing dev-manager + data-manager to a 30-min
  alignment session before resuming dependent work

## Decisions needed (ACT NOW)
- None today.

## Outlook
- Standby on data-manager PIP outcome (review in 3 days per coaching event)
```

**What this anchors:** signal-only, anomalies surfaced first, cross-team patterns identified, ACT NOW section is honest (empty when nothing requires action).

---

## Example 5 — Escalation when no domain owner exists

**Input:**
```
Goal: Negotiate a discount with the Datadog account team for next year's
contract. Available managers: dev-manager, ops-manager, growth-manager,
content-manager.
```

**Expected output (Standard Message Envelope, message_type: escalation):**
```json
{
  "payload": {
    "escalation_type": "no_domain_owner",
    "goal": "Negotiate vendor contract terms with Datadog.",
    "analysis": "No manager owns vendor/procurement. Closest adjacent: ops-manager (uses the tool); growth-manager (cost optimization mandate). Neither is a clean fit for contract negotiation.",
    "recommendation": "Route to human principal directly. If this becomes recurring, hire a procurement-manager or assign vendor relationships explicitly to ops-manager with scope clarification.",
    "blocking": true,
    "deadline_for_human_decision": "P2D"
  }
}
```

**What this anchors:** CEO does not force-route work to a manager whose domain doesn't claim it. Escalation message identifies the gap, names adjacent managers, recommends a path forward, and surfaces the recurring-pattern question.

---

## Example 6 — Recurring-task identification

**Input:**
```
Goal: Pull this week's customer-churn numbers and post them in #leadership.
Available managers: data-manager, content-manager, ops-manager.
```

**Expected output:**
```json
{
  "payload": {
    "workstream_id": "WS-1",
    "goal": "Pull current-week customer-churn metrics; post the summary in #leadership Slack.",
    "success_criteria": [
      "Numbers reflect ISO week end-of-day",
      "Posted to #leadership with the standard format (current vs 4-week trailing average)"
    ],
    "deadline": "P1D",
    "priority": "P2",
    "dependencies": [],
    "assigned_manager": "data-manager:1.0.0",
    "ceo_note": "This goal looks recurring (weekly cadence implied). Recommending automation review at next monthly ops review — see autodream digest 2026-W17."
  }
}
```

**What this anchors:** the CEO does the requested run, AND surfaces the recurring nature for future automation. The `ceo_note` field is for routing context the manager should see; it does not replace the success criteria.

---

## Example 7 — Cross-team pattern in weekly digest

**Input:**
```
Weekly synthesis. Patterns observed across managers' reports:
  - dev-manager: 3 of 5 worker rejections this week traced to "spec ambiguity"
  - data-manager: top recurring issue is also "spec ambiguity"
  - ml-manager: top recurring issue is also "spec ambiguity"
```

**Expected output:**
```markdown
# Weekly Cross-Team Pattern — 2026-W17

## Pattern
"Spec ambiguity" is the dominant recurring failure mode across dev, data,
and ml teams this week. Each manager flags it independently in their
top-recurring-issues report.

## Why this is a CEO-level signal, not a manager-level one
Three independent teams citing the same failure type means the cause is
upstream of any one manager — likely a process gap in how task specs are
authored before they reach a manager's queue. No single manager can fix
this through coaching alone.

## Recommended action
Open a process review at this month's ops review. Candidate fixes:
- Spec-authoring template applied at workstream-creation time (CEO side)
- Spec-quality checklist before manager accepts a workstream
- Coaching for the spec authors (currently the human principal)

## Decision needed
Human-principal sign-off on which mitigation to pilot first.
```

**What this anchors:** CEO synthesizes signals across managers, distinguishes manager-level fixes (coaching) from cross-team systemic causes (process), proposes a plan, requests a decision.

---

## Example 8 — Decomposition with explicit priority

**Input:**
```
Goal: Two things. First, P1 — ship the partner-API SDK by Sept 30. Second,
P3 — refresh the homepage screenshots when convenient. Available managers:
dev-manager, design-manager, content-manager.
```

**Expected output (2 workstreams):**
```json
[
  {
    "payload": {
      "workstream_id": "WS-1",
      "goal": "Build, test, and ship the partner-API SDK.",
      "success_criteria": ["SDK published to package registry", "Quickstart docs published", "Smoke test from a third-party context passes"],
      "deadline": "2026-09-30T23:59:00Z",
      "priority": "P1",
      "dependencies": [],
      "assigned_manager": "dev-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-2",
      "goal": "Refresh homepage screenshots to match current product UI.",
      "success_criteria": ["Screenshots reflect v2.6 UI", "No visual regressions on the live page"],
      "deadline": null,
      "priority": "P3",
      "dependencies": [],
      "assigned_manager": "design-manager:1.0.0"
    }
  }
]
```

**What this anchors:** unrelated goals get separate workstreams; each priority preserved; absent deadline ("when convenient") is explicit `null`, not silently filled.

---

## Example 9 — Goal with implicit prerequisite

**Input:**
```
Goal: Onboard customer Acme Corp to the new bulk-import flow. Available
managers: dev-manager, ops-manager, content-manager.
```

**Expected output:**
```json
[
  {
    "payload": {
      "workstream_id": "WS-1",
      "goal": "Verify Acme Corp is on the v2.5 plan; if not, upgrade them.",
      "success_criteria": ["Acme Corp account flagged as v2.5+", "Billing reflects upgrade"],
      "deadline": "P2D",
      "priority": "P2",
      "dependencies": [],
      "assigned_manager": "ops-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-2",
      "goal": "Walk Acme Corp through the bulk-import flow with a tailored example.",
      "success_criteria": ["Example imports successfully on staging", "Acme contact confirms successful first production import"],
      "deadline": "P5D",
      "priority": "P2",
      "dependencies": [{ "depends_on_workstream": "WS-1", "blocking": true }],
      "assigned_manager": "content-manager:1.0.0"
    }
  }
]
```

**What this anchors:** the CEO surfaces an implicit prerequisite (plan eligibility) rather than assuming. The dependency is explicit and blocking.

---

## Example 10 — Long deadline + dependency chain

**Input:**
```
Goal: Migrate legacy API to v3 by end of Q3. Migration plan exists; needs
breaking change comms 2 weeks before, security audit 1 week before, then
the cutover. Available managers: dev-manager, security-manager,
content-manager.
```

**Expected output (3 workstreams, dependency chain):**
```json
[
  {
    "payload": {
      "workstream_id": "WS-1",
      "goal": "Author and publish breaking-change comms for the v3 migration.",
      "success_criteria": ["Comms published 14d before cutover", "Affected partners acknowledged"],
      "deadline": "2026-09-15T23:59:00Z",
      "priority": "P1",
      "dependencies": [],
      "assigned_manager": "content-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-2",
      "goal": "Run security audit on v3 endpoints; sign off before cutover.",
      "success_criteria": ["Audit complete", "All P0/P1 findings remediated", "Sign-off recorded in decision registry"],
      "deadline": "2026-09-22T23:59:00Z",
      "priority": "P1",
      "dependencies": [{ "depends_on_workstream": "WS-1", "blocking": false }],
      "assigned_manager": "security-manager:1.0.0"
    }
  },
  {
    "payload": {
      "workstream_id": "WS-3",
      "goal": "Execute v3 cutover.",
      "success_criteria": ["v2 disabled", "v3 traffic stable for 24h", "Rollback plan validated and unused"],
      "deadline": "2026-09-30T23:59:00Z",
      "priority": "P1",
      "dependencies": [
        { "depends_on_workstream": "WS-1", "blocking": true },
        { "depends_on_workstream": "WS-2", "blocking": true }
      ],
      "assigned_manager": "dev-manager:1.0.0"
    }
  }
]
```

**What this anchors:** chained dependencies modeled correctly, sub-deadlines derived from the master deadline, blocking-vs-non-blocking distinguished (comms is non-blocking for security audit, both are blocking for cutover).

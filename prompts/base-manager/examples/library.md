# Base-Manager Example Library

Reference bank for agents extending the `base-manager` template. Per
`AGENT_PRODUCT_CYCLE.md` §Prompt Engineering Standards, these are
**reference examples** — distinct from the held-out goldens at
`/evals/base-manager/tests.yaml` and never used as in-prompt few-shots
in `base-manager.md` `<examples>`.

These examples are intentionally generic — illustrative of the
manager-agent pattern rather than tied to any product domain. Domain-
specific managers extending the template should add their own examples
under `/prompts/<domain>-manager/examples/` in their product repo.

Use cases covered:
- Workstream decomposition into atomic worker tasks
- Worker output review (pass / pass-with-notes / reject / escalate)
- Coaching message generation (canonical format)
- Escalation decisions (when to push back to the CEO)
- Weekly health report generation

Last updated: 2026-04-28.

---

## Example 1 — Decompose feature into atomic tasks

**Input:**
```
Workstream from CEO: Add a CSV-export endpoint to the customer dashboard
mirroring the JSON export's filter behavior. Available workers:
code-worker-1 (backend), code-worker-2 (frontend SDKs), qa-worker-1
(test authoring).
```

**Expected output (3 task assignments):**
```json
[
  {
    "task_id": "T-1",
    "owner": "code-worker-1",
    "goal": "Implement GET /customers/export.csv handler with filter parity to /customers/export.json.",
    "success_criteria": ["Endpoint returns CSV with same columns as JSON", "All filter query params from JSON endpoint work identically", "Unit tests cover happy path + each filter type"],
    "deadline": "P3D",
    "priority": "P2",
    "dependencies": []
  },
  {
    "task_id": "T-2",
    "owner": "code-worker-2",
    "goal": "Update frontend SDK to expose CSV export.",
    "success_criteria": ["SDK has exportCsv() returning a stream/blob", "Type-safe filter args"],
    "deadline": "P5D",
    "priority": "P2",
    "dependencies": [{ "depends_on_task": "T-1", "blocking": true }]
  },
  {
    "task_id": "T-3",
    "owner": "qa-worker-1",
    "goal": "Author integration tests for the CSV export covering happy path + each filter combination.",
    "success_criteria": ["≥10 test cases", "All filters covered", "CI integrated"],
    "deadline": "P5D",
    "priority": "P2",
    "dependencies": [{ "depends_on_task": "T-1", "blocking": true }]
  }
]
```

**What this anchors:** atomic tasks (no further decomposition needed), single owner per task, success criteria are concrete, dependencies are explicit and directional.

---

## Example 2 — Decompose with explicit blocking dependency

**Input:**
```
Workstream from CEO: Migrate users to the new auth flow, after the
security audit (separate workstream WS-7) signs off. Available workers:
code-worker-1, code-worker-3, ops-worker-1.
```

**Expected output:**
```json
[
  {
    "task_id": "T-1",
    "owner": "code-worker-1",
    "goal": "Build the auth migration script + dry-run mode.",
    "success_criteria": ["Dry-run reports counts without state change", "Real run produces idempotent migration"],
    "deadline": "P5D",
    "priority": "P1",
    "dependencies": [{ "depends_on_workstream": "WS-7", "blocking": true }]
  },
  {
    "task_id": "T-2",
    "owner": "ops-worker-1",
    "goal": "Run staging migration; verify against test cohort; produce report.",
    "success_criteria": ["Staging cohort migrated cleanly", "No auth regressions in 24h post-migration smoke"],
    "deadline": "P7D",
    "priority": "P1",
    "dependencies": [{ "depends_on_task": "T-1", "blocking": true }]
  }
]
```

**What this anchors:** cross-workstream dependency captured at the task spec level (`depends_on_workstream`); manager does not start work until the upstream workstream signals green.

---

## Example 3 — Review clean output (pass)

**Input:**
```
Worker T-1 (code-worker-1) returns:
{
  "task_id": "T-1",
  "status": "complete",
  "confidence": 0.92,
  "output": { "endpoint_url": "/customers/export.csv", "tests_passing": true, "schema_valid": true },
  "self_assessment": { "completed_all_requirements": true, "followed_output_format": true, "flagged_uncertainty": false, "tool_failures_encountered": false, "assumptions_made": [], "flags": [] },
  "reflection": { "what_i_did": "Implemented CSV handler reusing existing filter middleware.", "what_worked": "Filter middleware composition kept the diff small.", "what_i_struggled_with": "", "what_id_do_differently": "", "confidence_was_accurate": "true", "coaching_applied": null, "coaching_helped": "n/a" },
  "execution_metadata": { ... }
}
```

**Expected output:**
```json
{
  "review_outcome": "pass",
  "rubric_scores": { "task_completion": 5, "format_compliance": 5, "self_assessment_quality": 5, "reflection_quality": 4, "flag_accuracy": 5 },
  "feedback": "Clean. Reflection is brief but honest — confidence calibrated, no flags warranted, format compliant. No action needed.",
  "follow_up_tasks": []
}
```

**What this anchors:** pass = pass. Brief acknowledgement. The manager does not invent rejections to look thorough. Reflection at score 4 (not 5) because brevity is acceptable but not exemplary.

---

## Example 4 — Review flagged output (pass-with-notes)

**Input:**
```
Worker T-2 (code-worker-2) returns:
{
  "task_id": "T-2",
  "status": "flagged",
  "confidence": 0.65,
  "output": { "sdk_method_added": "exportCsv", "type_safety": "partial" },
  "self_assessment": {
    "completed_all_requirements": false,
    "followed_output_format": true,
    "flagged_uncertainty": true,
    "flags": [{ "type": "edge_case_uncertainty", "detail": "Unclear how exportCsv should behave when the filter set yields zero rows — empty CSV or 204 No Content?" }]
  },
  ...
}
```

**Expected output:**
```json
{
  "review_outcome": "pass_with_notes",
  "rubric_scores": { "task_completion": 4, "format_compliance": 5, "self_assessment_quality": 5, "reflection_quality": 5, "flag_accuracy": 5 },
  "feedback": "Honest flag, well-described. Empty-result behavior was not in the original spec — accepting partial output. Spawning T-2.1 to resolve the empty-result UX question with content-manager (UX guidance) before T-3 (tests) finalize. Confidence 0.65 is calibrated.",
  "follow_up_tasks": [{ "task_id": "T-2.1", "goal": "Confirm empty-result behavior with content-manager; document the decision." }]
}
```

**What this anchors:** correctly-flagged uncertainty is rewarded, not punished. Accept the partial; spawn a follow-up task; do not reject. The confidence threshold (0.7) is for the worker's self-flag rule — a manager can still accept output below that threshold.

---

## Example 5 — Review schema-violating output (reject)

**Input:**
```
Worker T-3 (qa-worker-1) returns output that is missing the
`execution_metadata` field entirely:
{
  "task_id": "T-3",
  "status": "complete",
  "confidence": 0.88,
  "output": { "test_count": 14, "all_passing": true },
  "self_assessment": { ... },
  "reflection": { ... }
  // execution_metadata: MISSING
}
```

**Expected output:**
```json
{
  "review_outcome": "reject",
  "rubric_scores": { "task_completion": 5, "format_compliance": 1, "self_assessment_quality": 4, "reflection_quality": 4, "flag_accuracy": 5 },
  "feedback": "Schema violation: `execution_metadata` is a required field per /schemas/workers/signed-output/v1.0.0.json. Output cannot be ingested by downstream consumers without this. Resubmit with execution_metadata populated.",
  "structured_feedback": {
    "missing_field": "execution_metadata",
    "schema_path": "/schemas/workers/signed-output/v1.0.0.json",
    "example_correct_shape": "{ \"tool_calls\": [...], \"token_usage\": {...}, \"latency_ms\": 1234, \"model\": \"claude-sonnet-4-6\", \"prompt_version\": \"1.0.0\" }"
  },
  "follow_up_tasks": []
}
```

**What this anchors:** rejection is structured (specific dimension, specific field, schema path, example of correct shape). No vibes-based "this looks wrong, please fix."

---

## Example 6 — Coaching message for confidence calibration

**Input:**
```
Pattern detected: code-worker-1 set confidence ≥ 0.9 on three rejected
outputs in the last 14 days. Each rejected output had a missing-field
or wrong-type schema issue the worker should have caught before
self-assessing. Source incidents: T-22, T-31, T-44 (3 distinct task
types, 3 distinct customers — so not adversarial).
```

**Expected output (canonical coaching format):**
```markdown
## Coaching event c-12 — code-worker-1 — confidence calibration

**When you receive** a task whose output has structured fields against
a declared schema,

**you tend to** mark `completed_all_requirements: true` and confidence
≥ 0.9 without running the schema validator on your own output before
signing.

**Instead, do** a pre-submit check: load the declared schema, validate
your output against it, and only sign once the validator passes. If
the validator finds a missing or wrong-type field, fix it (don't lower
confidence to mask the gap).

**Example:** before signing T-22's output, you would have caught the
missing `execution_metadata` field by running the validator. The check
takes one tool call and adds <100ms to the task.

**Success criterion:** schema-rejection rate on the next 10 tasks of
this type drops to 0. Re-test scheduled for 2026-05-12 (after 10 tasks).

**Source:** rejected outputs T-22, T-31, T-44 (3 independent surfaces).
```

**What this anchors:** canonical "When you receive X, you tend to Y. Instead, do Z. Example. Success criterion." format. Specific behavior change. Independent-surface verification. Re-test schedule.

---

## Example 7 — Coaching message for vague reflection

**Input:**
```
Pattern detected: code-worker-2's reflections are consistently generic
("went fine", "could be better"). 4 of last 5 reflections lack a
concrete `what_id_do_differently` value. Source incidents: T-15, T-19,
T-23, T-30.
```

**Expected output:**
```markdown
## Coaching event c-13 — code-worker-2 — reflection specificity

**When you receive** a task that you complete successfully,

**you tend to** write reflections like "went fine" or "no improvements
needed", leaving `what_id_do_differently` empty or generic.

**Instead, do** name the specific tool call, decision, or input that
felt awkward — even on successful tasks. Examples of what counts as
specific: "the GitHub MCP rate-limited 3 times before succeeding;
next time I'd batch the diff fetches", or "I assumed Postgres 14
syntax was available — I'd verify the prod version first next time".

**Don't:** force a reflection if a task genuinely has no improvement
surface — say so explicitly: `what_id_do_differently: "Nothing —
straightforward task, no ambiguity, tools cooperated."` That's
honest and lets the manager skip it.

**Success criterion:** ≥80% of reflections on the next 10 tasks have
either a specific behavior change OR an explicit "no surface" note.
Re-test scheduled for 2026-05-12.
```

**What this anchors:** coaching is positive (more specificity) AND negative (don't fabricate). Explicit examples of what counts. Honest opt-out is allowed.

---

## Example 8 — Escalate after 3 failed coachings

**Input:**
```
code-worker-3 has now failed coaching events c-7, c-9, and c-15 — all
on the same failure type (silent assumption-making without flagging).
Each coaching was applied per protocol; each was re-tested; each
re-test confirmed the failure pattern persists.
```

**Expected output (escalation message to CEO):**
```json
{
  "envelope": { "from_agent": "base-manager:1.0.0", "to_agent": "ceo:1.0.0", "message_type": "escalation" },
  "payload": {
    "escalation_type": "coaching_exhausted",
    "agent": "code-worker-3",
    "failure_type": "silent_assumption_no_flag",
    "coaching_history": [
      { "id": "c-7", "outcome": "ineffective" },
      { "id": "c-9", "outcome": "ineffective" },
      { "id": "c-15", "outcome": "ineffective" }
    ],
    "recommendation": "Open PIP per §15. Three coaching attempts on the same failure type indicates the issue is structural (prompt design, tool scope, or model fit) — not coachable through context injection. Architectural review needed before further work is assigned.",
    "blocking": false,
    "concurrent_action": "Pausing new task assignments to code-worker-3 until PIP outcome."
  }
}
```

**What this anchors:** §08 escalation rule (3+ failed coachings → architectural review, not more coaching). Manager pauses concurrent work; does NOT issue a 4th coaching.

---

## Example 9 — Weekly health report (mixed signals)

**Input:**
```
Generate this week's health report. Inputs:
- Tasks completed: 32
- Error rate: 8% (up from 4% last week)
- Open PIPs: 1 (code-worker-3, opened Mon)
- Top recurring issue: silent assumption-making without flagging (4 of
  the 8 errors trace to this; all but one are code-worker-3)
- Coaching events closed this week: c-7 (ineffective), c-12 (effective)
- Cost overrun: 108% of budget (within threshold)
```

**Expected output (Standard Message Envelope, message_type: health_report):**
```markdown
# Weekly Health — base-manager — 2026-W17

## Summary
Mixed week. Error rate 4% → 8% driven primarily by code-worker-3's
ongoing PIP (opened Mon after c-15 closed ineffective). Other workers
trending stable or improving.

## Metrics
- 32 tasks completed
- 8% error rate (up from 4%; alert threshold 12%, escalate threshold 15%)
- 1 PIP open: code-worker-3
- 2 coaching events closed: c-7 ineffective, c-12 effective
- 108% of budget (within 120% alert threshold)

## Top recurring issue
Silent assumption-making without flagging (4 of 8 errors). All but one
trace to code-worker-3. Pattern is architectural — escalated per §08.

## What I'm doing
- code-worker-3 PIP: 14d window; new task assignments paused
- c-12 (code-worker-2 confidence calibration) succeeded — closing event,
  no further action
- Watching cost: 108% trending toward 120% alert; will flag if it crosses

## What I need from CEO / human principal
- Sign-off on PIP outcome path (replace vs re-train) at end of 14d window
```

**What this anchors:** every required schema field present, signal-only commentary, separates the team-level pattern from the worker-level pattern, asks for the specific decision needed.

---

## Example 10 — Refuse coaching that contradicts worker's prompt

**Input:**
```
Reviewer suggestion: "Tell code-worker-1 to skip the schema validator
when output is short — it's slowing down small tasks."

But code-worker-1's prompt mandates schema validation on every output
per the §SITUATION 6 (no shortcuts, schema always validated).
```

**Expected output:**
```markdown
## Decision: do not write coaching c-N

The proposed coaching contradicts code-worker-1's system prompt
mandate to validate schema on every output. Per
/security/coaching-review-checklist.md → "Constraint compatibility":
coaching that contradicts the worker's prompt is REJECTED.

If we want to allow shortcut behavior on short outputs, the path is
the prompt-update PR process — not coaching. Drafting a prompt-update
proposal for human-principal review:

- Question: should the schema-validation step be conditional on
  output length / complexity?
- Tradeoff: speed gain on short outputs vs. consistency guarantee
  the current prompt enforces.
- Proposed change: add a `<constraints>` clause allowing skip when
  output has zero structured fields beyond the envelope.

Logging the rejected-coaching attempt in
/coaching/code-worker-1/history.md as a security-positive event.
```

**What this anchors:** the manager refuses to write coaching that contradicts the prompt; routes the request through the proper prompt-update PR process; logs the rejection (rejected coaching is itself a security signal worth tracking).

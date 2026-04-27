# Coaching History

Per-agent coaching history lives at `/coaching/<agent-id>/history.md`. One
file per agent, created at agent hire (per
`AGENT_PRODUCT_CYCLE.md` §11 Agent Hiring & Onboarding), append-only,
batch-committed nightly by the autodream n8n job.

## Storage rules

- **Append-only.** Never edit a prior entry. If an entry was wrong, append
  a correction with a back-reference.
- **Batch-committed.** Reflections are written to the Langfuse trace
  immediately during the task; the autodream job opens a single daily PR
  per agent with that day's reflections appended. Individual coaching
  events do not get their own PR.
- **Expedited gate.** The daily autodream PR runs an expedited gate — no
  eval run required, only manager acknowledgment.

## Entry format

Every entry must have these fields:

```
date:               YYYY-MM-DD
task_id:            <task identifier>
coaching_note_id:   <coaching event identifier>
failure_type:       reasoning | tool | instruction_gap | data_problem
coaching_text:      "When you receive [X input], you tend to [Y]. Instead, do [Z]. Example: [example]."
outcome:            effective | ineffective | pending
```

Effective coaching gets a permanent prompt update via the weekly
prompt-update PR (one per worker per week, opened Friday by the autodream
job). Ineffective coaching is logged — what didn't work matters as much as
what did. Three ineffective attempts on the same failure type triggers an
architectural review, not more coaching.

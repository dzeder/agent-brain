# Versioned Agent Prompts

Versioned agent prompts live at `/prompts/<agent-id>/<agent-id>-v<semver>.md`.
A change to a prompt is a change to agent behavior — treat every prompt
file like production code.

## Layout

```
/prompts/
└── <agent-id>/
    ├── <agent-id>-v1.0.0.md      ← current
    ├── <agent-id>-v0.9.0.md      ← prior version
    └── examples/                  ← reference example library (10+ per use case)
```

## Semantic versioning

```
MAJOR.MINOR.PATCH

MAJOR — behavioral change that affects output format or agent identity
MINOR — capability addition or significant constraint change
PATCH — typo fix, clarification, example update that doesn't change behavior
```

### Concrete examples (resolve the ambiguous cases)

| Change | Level | Why |
|--------|-------|-----|
| Add a new required field to the output schema | MAJOR | Downstream consumers break |
| Rename `<role>` from "Research Manager" to "Research and Analysis Manager" | MAJOR | Identity change — eval may behave differently |
| Add a new `<constraints>` entry blocking a previously-allowed action | MINOR | Capability change (restriction is still a capability change) |
| Add an example to the `<examples>` section | MINOR | Examples anchor behavior — treat like capability |
| Fix a typo in a `<responsibilities>` bullet that doesn't change meaning | PATCH | No behavioral impact |
| Update temperature from 0.3 to 0.5 | MINOR | Observable behavioral change |
| Change model version (e.g., Sonnet 4.5 → Sonnet 4.6) | MINOR with eval run | Treat like capability — model behavior may shift |
| Add a `<constraints>` clarification that explains an existing rule more precisely | PATCH | Doesn't change the rule, just the wording |

## Eval gates

- A **MAJOR** version bump always requires a full eval run and
  human-principal sign-off.
- A **MINOR** bump requires an eval diff (before/after).
- A **PATCH** requires a sanity check run on the core golden dataset.

## Branch and commit conventions

Per `AGENT_PRODUCT_CYCLE.md` §Git & Versioning Strategy:

- Prompt-only changes go on `prompt/*` branches.
- New agents go on `agent/*` branches with a completed hiring checklist.
- Commit format: `prompt(<agent-id>): <description>`.
- Every prompt PR includes the eval before/after scores in the description.

## Coaching-driven prompt updates

Per §10 Self-Improvement & Coaching Loops:

- Coaching-driven prompt updates are batched **one PR per worker per week**,
  opened by the autodream job on Fridays. Individual coaching PRs are not
  opened per-event.
- A weekly PR includes all effective coaching from the prior 7 days with a
  combined before/after eval diff.
- Fast path: prompt edits under 5 lines that have already passed the weekly
  eval CI run auto-merge after manager acknowledgment without
  human-principal review. Anything ≥5 lines or touching constraints/output
  format goes through the full gate.

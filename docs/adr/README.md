# Architecture Decision Records

Every significant architectural decision in the brain repo is logged here as
a numbered ADR. ADRs are append-only — superseded ADRs stay in the directory
with `Status: Superseded by ADR-NNN`.

## Format

Use this exact format for every new ADR:

```markdown
# ADR NNN — Title

Date:
Status: [Proposed | Accepted | Deprecated | Superseded by ADR-NNN]
Decided by:

## Context
[What situation prompted this decision]

## Decision
[What was decided]

## Consequences
[What this enables and what it constrains]

## Alternatives considered
[What else was evaluated and why it was rejected]
```

## Numbering

Sequential, three-digit, zero-padded: `001-...`, `002-...`, `010-...`.
Numbers are never reused. If an ADR is rejected, its number stays
"Rejected" — it does not get reassigned.

## When to write one

Per `AGENT_PRODUCT_CYCLE.md` §Document Maintenance: any decision that
changes how the system operates. Routine implementation choices stay in
PR descriptions and the Notion decision registry. Architectural decisions
get an ADR here.

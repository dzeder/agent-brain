# Post-Mortems

Every significant incident gets a post-mortem here. Per
`AGENT_PRODUCT_CYCLE.md` §21 Governance & Safety, post-mortems must be
completed within **5 business days** of the incident.

## Format

```markdown
# Post-Mortem: <short title>

Date of incident:
Date of post-mortem:
Severity: [P0 | P1 | P2 | P3]
Authors:

## Summary
[1-2 sentence what-happened, what-was-the-impact]

## Timeline
[ISO timestamps · what happened · who/what was involved]

## Which Layer Failed
[Worker execution / Manager review gap / CEO routing / Human oversight — be specific]

## Root Cause
[Not the proximate trigger — the underlying cause]

## Action Items
| # | Action | Owner | Due | Status |
|---|--------|-------|-----|--------|
| 1 |        |       |     |        |
```

## Severity ladder

| Level | Definition |
|-------|-----------|
| **P0** | Customer-impacting outage, data corruption, or unauthorized action took effect |
| **P1** | Internal-impacting outage; customer impact narrowly avoided |
| **P2** | Single-agent failure with degraded but functional system |
| **P3** | Near-miss; safety net caught the issue before harm |

## Discipline

- One layer must be named — diffuse "the system failed" answers are not
  acceptable. If multiple layers failed, name each.
- Action items must have a single owner and a due date. "TBD" is not an
  owner.
- The post-mortem is reviewed by the human principal before it is closed.

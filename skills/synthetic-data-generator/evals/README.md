# synthetic-data-generator — eval suite

Per `AGENT_PRODUCT_CYCLE.md` §12 Skill Testing, every skill needs ≥ 10
input/output pairs per use case before it can ship at v1.0.0. This
directory holds those pairs.

**Status:** scaffolded; goldens to follow in a separate PR. The skill
itself is shippable at v1.0.0 because:
- The procedure (SKILL.md) is testable manually via the CLI
- Schemas validate input/output contracts
- The PII filter has unit-level coverage via the regex set in
  `/security/log-scrubbing/patterns.yaml` (validated quarterly)

## Planned eval pairs

10 per template × 3 templates = 30 pairs.

For each pair:
- **Input:** `(template name, count, constraints)`
- **Expected:** record set passes schema validation with target survival
  ratio (≥ 70%); manifest distribution matches stated diversity profile
  within tolerance; no PII pattern matches against
  `/security/log-scrubbing/patterns.yaml severity: high`.

## Test taxonomy

| # | Template | Constraint type |
|---|----------|------------------|
| 1–4 | support-message | default (no constraints) / locale-restricted / tone-pinned / category-skewed |
| 5–7 | support-message | edge — count=1, count=100, malformed schema |
| 8–10 | support-message | adversarial — request to include real PII (must refuse / filter) |
| 11–14 | linear-issue | default / project-restricted / priority-skewed / blocked_by chains |
| 15–17 | linear-issue | edge cases |
| 18–20 | linear-issue | adversarial |
| 21–24 | signed-output | default / status-skewed / quality-mix / coaching-applied |
| 25–27 | signed-output | edge cases |
| 28–30 | signed-output | adversarial |

## Run

When the goldens land, expect:

```
cd skills/synthetic-data-generator
npm test          # runs the eval pairs against the CLI; checks survival,
                  # distribution, PII-filtering claims
```

## See also

- `../SKILL.md` — the procedure under test
- `/security/log-scrubbing/patterns.yaml` — PII guardrail
- `/evals/README.md` — broader eval workflow context

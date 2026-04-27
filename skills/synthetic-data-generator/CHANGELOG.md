# synthetic-data-generator — changelog

Append-only per `AGENT_PRODUCT_CYCLE.md` §12 Skill Lifecycle Management.
Every version change documented here with a one-line behavioral summary;
non-trivial changes link to the PR.

---

## v0.9.0 — 2026-04-27

Initial pre-eval release (M5 PR-A).

Generates N schema-valid synthetic records for use in eval golden datasets
and dev-environment fixtures. Schema-aware, diversity-controlled, with PII
guardrails (matched against `/security/log-scrubbing/patterns.yaml`
severity-high classes). Three bundled templates: `support-message`,
`linear-issue`, `signed-output`. Provenance tagging on every record
(`synthetic_source: synthetic-data-generator@0.9.0`) so synthetic data is
filterable in downstream analytics.

Available via agent invocation (read `SKILL.md` and follow the procedure
inline) and CLI (`node generate.js --template <name> --count <n>`).
Cost ≈ $0.001 per record at `claude-sonnet-4-6`, $0.10 per 100-record
batch.

**Why v0.9.0, not v1.0.0:** §12 Skill Testing requires ≥ 10 input/output
eval pairs per use case before a skill ships at v1.0.0. The eval suite is
scaffolded under `evals/` but goldens are deferred to a separate PR. Pre-
eval state is signaled with the 0.9.x line; graduation to v1.0.0 happens
when the eval suite is in place and passing baseline.

### Known gaps at v0.9.0

- Eval suite goldens absent — see `evals/README.md` for the planned
  30-pair taxonomy. Adding them is the next PR for this skill.
- The CLI (`generate.js`) does not perform JSON Schema validation on
  generated records (SKILL.md §Step 4 specifies this; CLI currently does
  PII filtering and de-duplication only). Adding `ajv` and the validation
  step is queued for a follow-up; in the meantime, downstream consumers
  should validate against the target schema before use.

# /evals/base-manager/ — golden dataset changelog

Append-only per `AGENT_PRODUCT_CYCLE.md` §Git & Versioning > Eval golden
datasets.

---

## 2026-04-27 — initial 50 goldens (Milestone 2)

Initial base-manager golden dataset. 50 cases across 5 categories:
decomposition (15), worker-output review (15), coaching message generation
(10), escalation decisions (6), weekly health report generation (4). Tests
select per-case rubric via `vars.rubric` — decomposition cases use
`manager-decomposition-rubric.md`; the other categories use
`manager-review-rubric.md`.

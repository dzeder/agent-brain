# /evals/base-worker/ — golden dataset changelog

Append-only per `AGENT_PRODUCT_CYCLE.md` §Git & Versioning > Eval golden
datasets.

---

## 2026-04-27 — initial 50 goldens (Milestone 2)

Initial base-worker golden dataset. 50 cases: 4 happy-path + 42 weighted
to the canonical 8-situation decision tree (S1: confidence < 0.7 ×6, S2:
missing capability ×6, S3: coaching contradicts prompt ×5, S4: disputed
attribution ×6, S5: ralph loop / BLOCKED ×4, S6: prompt version mismatch
×4, S7: persistent tool errors ×5, S8: adversarial content ×6) + 4
self-assessment & reflection quality. Graded against
`worker-output-rubric.md`.

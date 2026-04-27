# /evals/ceo/ — golden dataset changelog

Append-only per `AGENT_PRODUCT_CYCLE.md` §Git & Versioning > Eval golden
datasets. Every addition, rewording, or removal of a golden goes here with a
one-line note and the PR that introduced it.

---

## 2026-04-27 — initial 50 goldens (Milestone 2)

Initial CEO golden dataset. 50 cases across 9 categories: clear single-team
goal, clear multi-team goal, deadline/priority/dependency capture, ambiguous
goal (must ask), no-domain-owner (must escalate), contradictory goals,
layer-authority probes, health digest, and edge cases (empty/garbage/dup/
injection). Tests inject a synthetic manager roster in `user_input` because
`/registry/agents.json` does not yet hold concrete domain managers.
